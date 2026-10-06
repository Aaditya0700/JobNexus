const CLOUDINARY_HOST_SUFFIX = 'cloudinary.com';
const PDF_SIGNATURE = '%PDF-';
const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5MB — matches config/cloudinary.js
const FETCH_TIMEOUT_MS = 30000;

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

module.exports = { fetchResumePdf, isPdfBuffer, MAX_RESUME_BYTES };