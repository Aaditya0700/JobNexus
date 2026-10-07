const CLOUDINARY_HOST_SUFFIX = 'cloudinary.com';
const PDF_SIGNATURE = '%PDF-';
const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5MB — matches config/cloudinary.js
const FETCH_TIMEOUT_MS = 30000;

const { extractTextFromPdf } = require('./pdfTextExtractor');

const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });
const badGateway = (message) => Object.assign(new Error(message), { statusCode: 502 });

const isPdfBuffer = (buffer) =>
  buffer.length > PDF_SIGNATURE.length &&
  buffer.subarray(0, PDF_SIGNATURE.length).toString('latin1') === PDF_SIGNATURE;

// Resumes are only ever written by our own Cloudinary uploader, so restricting
// the host keeps a stored resumeUrl from being used to fetch arbitrary URLs.
const assertCloudinaryUrl = (rawUrl) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw badRequest('Resume file location is not valid. Please re-upload your resume.');
  }

  if (url.protocol !== 'https:' || !url.hostname.endsWith(CLOUDINARY_HOST_SUFFIX)) {
    throw badRequest('Resume file location is not a valid Cloudinary URL.');
  }

  return url;
};

// @desc    Download the student's stored resume as PDF bytes
// @route   (internal service) — used by resumeAnalysisController
const fetchResumePdf = async (resumeUrl) => {
  assertCloudinaryUrl(resumeUrl);

  let response;
  try {
    response = await fetch(resumeUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw badGateway('Could not download your resume from storage. Please try again.');
  }

  if (!response.ok) {
    throw badGateway('Could not download your resume from storage. Please re-upload it.');
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > MAX_RESUME_BYTES) {
    throw badRequest('Resume is larger than 5MB. Please upload a smaller PDF.');
  }

  // Cloudinary serves raw assets as application/octet-stream, so check magic bytes
  // rather than trusting the response content-type.
  if (!isPdfBuffer(buffer)) {
    throw badRequest('The resume analyzer supports PDF files only. Please upload a PDF resume.');
  }

  return buffer;
};

// @desc    Download resume PDF and extract text (with cache check done by caller)
// @route   (internal service) — returns { buffer, text }
const fetchResumePdfAndText = async (resumeUrl) => {
  const buffer = await fetchResumePdf(resumeUrl);
  const text = await extractTextFromPdf(buffer);
  return { buffer, text };
};

// @desc    Compute a simple version identifier from resume URL + name for cache invalidation
const computeResumeVersion = (resumeUrl, resumeOriginalName) => {
  // Use URL + filename as version — changes when either changes
  return `${resumeUrl}|${resumeOriginalName || ''}`;
};

// @desc    Get resume text, using cache if available and valid
// @route   (internal service) — returns { text, usedCache, buffer?, text? }
const getResumeText = async (user, resumeUrl, resumeOriginalName) => {
  const currentVersion = computeResumeVersion(resumeUrl, resumeOriginalName);
  
  // Check if cached text is valid for current resume
  if (user.profile?.resumeText && user.profile?.resumeVersion === currentVersion) {
    return { text: user.profile.resumeText, usedCache: true };
  }
  
  // Cache miss or invalid — download PDF, extract text
  const { buffer, text } = await fetchResumePdfAndText(resumeUrl);
  return { text, usedCache: false, buffer };
};

module.exports = { 
  fetchResumePdf, 
  fetchResumePdfAndText, 
  getResumeText, 
  computeResumeVersion,
  isPdfBuffer, 
  MAX_RESUME_BYTES 
};