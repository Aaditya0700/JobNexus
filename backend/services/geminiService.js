const { GoogleGenAI, ThinkingLevel } = require('@google/genai');

const DEFAULT_MODEL = 'gemini-3.8-flash';
// Pinned, stable, non-preview release one generation behind the default, used
// when GEMINI_FALLBACK_MODEL is not set. A rolling alias such as
// gemini-flash-latest is deliberately avoided: it would most likely resolve to
// the same model that is already overloaded, so it would not relieve the very
// pressure the fallback exists to absorb. Verified against the live models API.
const DEFAULT_FALLBACK_MODEL = 'gemini-3.5-flash';
const PDF_MIME_TYPE = 'application/pdf';
const REQUEST_TIMEOUT_MS = 60000;
const MAX_OUTPUT_TOKENS = 8192;
const MAX_JOB_DESCRIPTION_CHARS = 4000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 2000;
// 429 means the provider's request quota/rate limit has been reached. Retrying
// it from every concurrent request can amplify the quota problem, so leave it
// for the user-facing rate-limit response instead of automatically retrying.
const RETRYABLE_STATUS_CODES = new Set([408, 500, 502, 503, 504]);

let client;

const serverError = (message) => Object.assign(new Error(message), { statusCode: 500, expose: true });
const badGateway = (message) => Object.assign(new Error(message), { statusCode: 502, expose: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getModel = () => process.env.GEMINI_MODEL || DEFAULT_MODEL;

// Mirrors getModel: an unset or blank value degrades to the pinned default
// rather than failing, so a missing variable can never stop the server booting
// or disable the primary model.
const getFallbackModel = () => {
  const configured = process.env.GEMINI_FALLBACK_MODEL;
  return (typeof configured === 'string' && configured.trim()) || DEFAULT_FALLBACK_MODEL;
};

// Built lazily so the server still boots when the key is missing, and so the
// error surfaces on the request that needs it.
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw serverError('Gemini API key is not configured on the server.');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

const SYSTEM_INSTRUCTION = [
  'You are an experienced technical recruiter reviewing resumes for a job portal.',
  'Base every judgement only on the document you are given.',
  'Never assume, infer or invent experience, employers, dates or skills that are not written in the resume.',
  'Give specific, actionable feedback that references what is actually in the resume.',
  'Never give generic advice that would apply to any candidate.',
].join(' ');

const SECTION_NAMES = [
  'Contact',
  'Professional Summary',
  'Experience',
  'Education',
  'Skills',
  'Projects',
  'Certifications',
  'Achievements',
];

const scoreField = (description) => ({
  type: 'integer',
  minimum: 0,
  maximum: 100,
  description,
});

const stringListField = (description) => ({
  type: 'array',
  items: { type: 'string' },
  description,
});

const buildResponseSchema = (withJobMatch) => {
  const properties = {
    overallScore: scoreField('Overall quality of the resume as a document, from 0 to 100.'),
    atsScore: scoreField(
      'How cleanly an Applicant Tracking System would parse this resume, 0 to 100. Penalise tables, multi-column layouts, images, icons, text boxes, headers and footers. Plain single-column text should score high.'
    ),
    summary: {
      type: 'string',
      description: 'Two or three sentences summarising overall quality and the single biggest problem to fix.',
    },
    sections: {
      type: 'array',
      description: 'A score and feedback breakdown for each resume section.',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: `The section name. Use only these values: ${SECTION_NAMES.join(', ')}.`,
          },
          score: scoreField('Completeness and quality of this section, from 0 to 100.'),
          feedback: {
            type: 'string',
            description: 'One or two sentences of specific, actionable feedback for this section.',
          },
        },
        required: ['name', 'score', 'feedback'],
      },
    },
    skills: {
      type: 'object',
      description: 'Skills coverage.',
      properties: {
        matched: stringListField('Technical and professional skills clearly evidenced in the resume.'),
        missing: stringListField('Important skills for this candidate profile that the resume does not evidence.'),
      },
      required: ['matched', 'missing'],
    },
    keywords: {
      type: 'object',
      description: 'ATS keyword coverage.',
      properties: {
        matched: stringListField('Recruiter keywords present in the resume.'),
        missing: stringListField('Recruiter keywords absent from the resume.'),
      },
      required: ['matched', 'missing'],
    },
    strengths: stringListField('Concrete strengths of this resume, most important first.'),
    suggestions: stringListField(
      'Actionable improvements, ordered from highest to lowest impact. Each item must be a single specific change.'
    ),
  };

  const required = [
    'overallScore',
    'atsScore',
    'summary',
    'sections',
    'skills',
    'keywords',
    'strengths',
    'suggestions',
  ];

  if (withJobMatch) {
    properties.jobMatch = {
      type: 'object',
      description: 'How well the resume matches the target job.',
      properties: {
        score: scoreField('Job match score from 0 to 100.'),
        verdict: {
          type: 'string',
          description: 'One sentence verdict on whether this candidate should apply for the job.',
        },
        missingRequirements: stringListField(
          'Requirements from the job posting that the resume does not evidence.'
        ),
      },
      required: ['score', 'verdict', 'missingRequirements'],
    };
    required.push('jobMatch');
  }

  return { type: 'object', properties, required };
};

const joinOrFallback = (values, fallback) => (Array.isArray(values) && values.length ? values.join(', ') : fallback);

const buildPrompt = (job) => {
  const base = [
    'Analyse the attached resume and return the report described in the output schema.',
    '',
    'Scoring guidance:',
    '- Be strict and realistic. An average resume scores 50 to 65.',
    '- Reserve 85 and above for resumes that are genuinely excellent.',
    '- overallScore judges the resume as a document. atsScore judges machine readability only.',
    '- Include every section in SECTION_NAMES even when it is absent from the resume; give it a low score and say it is missing.',
    '- Only list a skill as matched when the resume actually evidences it.',
  ].join('\n');

  if (!job) {
    return `${base}\n\nNo target job was supplied. Score the resume on its own merits. For skills.missing and keywords.missing, focus on what is typically expected of a strong candidate in this resume's field.`;
  }

  return [
    base,
    '',
    'A target job was supplied. Score the resume against that job.',
    `Job title: ${job.title}`,
    `Job type: ${job.jobType || 'not specified'}`,
    `Experience level: ${job.experienceLevel || 'not specified'}`,
    `Location: ${job.location || 'not specified'}`,
    `Required skills from the posting: ${joinOrFallback(job.skills, 'not specified')}`,
    `Requirements: ${joinOrFallback(job.requirements, 'not specified')}`,
    `Responsibilities: ${joinOrFallback(job.responsibilities, 'not specified')}`,
    `Job description: ${String(job.description || 'not specified').slice(0, MAX_JOB_DESCRIPTION_CHARS)}`,
    '',
    'Use these details to fill jobMatch, and to decide which skills belong in skills.missing and keywords.missing.',
  ].join('\n');
};

const stripCodeFence = (text) =>
  text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim();

const parseAnalysisResponse = (response) => {
  const text = response?.text;

  if (!text) {
    throw badGateway('The analyzer returned an empty response. Please try again.');
  }

  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    throw badGateway('The analyzer returned an unreadable response. Please try again.');
  }
};

// AbortSignal.timeout() rejects with a TimeoutError, while manual cancellation
// and some SDK transports use AbortError. Treat both as transient timeouts.
const isAbortError = (error) =>
  error?.name === 'AbortError' ||
  error?.name === 'TimeoutError' ||
  error?.code === 'ABORT_ERR' ||
  error?.code === 'ETIMEDOUT' ||
  error?.code === 'ECONNRESET';

const isRetryable = (error) =>
  RETRYABLE_STATUS_CODES.has(Number(error?.status ?? error?.code)) || isAbortError(error);

const statusOf = (error) => Number(error?.status ?? error?.code) || null;

// Switching models is only justified by a temporary provider capacity problem
// or a request timeout/abort. Invalid API keys, auth failures, permission errors,
// malformed requests, invalid model names, quota/rate limits and application
// validation errors all keep their existing handling, so none of them match here.
//
// Quota (429 / RESOURCE_EXHAUSTED) is excluded on purpose: another model does
// not create additional quota, so switching would only burn the retry budget
// and delay a correct error.
const isTemporaryAvailabilityError = (error) => {
  if (!error) return false;

  // Errors raised by our own helpers already carry a clean user-facing message
  // and a statusCode, and must not be reinterpreted as provider outages.
  if (error.statusCode) return false;

  // AbortError from our AbortSignal.timeout represents a request timeout,
  // which is a temporary condition worth retrying on another model.
  if (isAbortError(error)) return true;

  const status = statusOf(error);
  const message = String(error.message || '');

  if (status === 429 || /RESOURCE_EXHAUSTED/i.test(message)) return false;

  return status === 503 || /\bUNAVAILABLE\b/.test(message) || /high demand/i.test(message);
};

// Single send path shared by both AI features. The prompt, schema and config are
// byte-identical for every model — only the model id changes — so the fallback
// reuses the exact same request instead of duplicating a prompt.
//
// Flow: primary -> existing retry -> (temporary availability failure only)
// fallback -> existing retry -> original error handling. The retry budget is
// unchanged: MAX_ATTEMPTS per model.
const generateStructured = async ({ model, contents, config, feature }) => {
  // A fresh signal per attempt: an aborted signal cannot be reused, and the
  // signal from the primary model's final attempt would already be spent by the
  // time a fallback attempt starts.
  const send = (target) => () =>
    getClient().models.generateContent({
      model: target,
      contents,
      config: { ...config, abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    });

  try {
    const response = await withRetry(send(model));
    return { response, model };
  } catch (error) {
    const fallbackModel = getFallbackModel();

    if (!fallbackModel || fallbackModel === model || !isTemporaryAvailabilityError(error)) {
      throw error;
    }

    const isAbort = isAbortError(error);
    const reason = isAbort ? 'request aborted/timeout' : `temporarily unavailable (status ${statusOf(error) || 'unknown'})`;
    console.warn(
      `[Gemini] ${feature}: primary model "${model}" ${reason}; trying fallback model "${fallbackModel}"`
    );

    try {
      const response = await withRetry(send(fallbackModel));
      console.log(`[Gemini] ${feature}: fallback model "${fallbackModel}" succeeded`);
      return { response, model: fallbackModel };
    } catch (fallbackError) {
      const fallbackIsAbort = isAbortError(fallbackError);
      const fallbackReason = fallbackIsAbort ? 'request aborted/timeout' : `status ${statusOf(fallbackError) || 'unknown'}`;
      console.error(
        `[Gemini] ${feature}: fallback model "${fallbackModel}" also failed (${fallbackReason})`
      );
      throw fallbackError;
    }
  }
};

// Gemini intermittently returns 503 under load. Each attempt costs tokens, so
// retries are capped at 3 and use a bounded backoff. AbortError from our
// AbortSignal.timeout is also treated as a transient failure worth retrying.
const withRetry = async (operation) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS || !isRetryable(error)) throw error;

      if (isAbortError(error)) {
        console.warn(
          `[Gemini] request aborted/timeout (attempt ${attempt}/${MAX_ATTEMPTS}); retrying`
        );
      }
      const exponentialDelay = RETRY_BASE_DELAY_MS * (2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * RETRY_BASE_DELAY_MS);
      await sleep(exponentialDelay + jitter);
    }
  }

  throw lastError;
};

// @desc    Send a resume (PDF or text) to Gemini and return the parsed analysis
// @route   (internal service) — used by resumeAnalysisController
// If resumeText is provided, sends text instead of PDF (much faster)
const analyzeResumePdf = async ({ pdfBuffer, resumeText, job }) => {
  const prompt = buildPrompt(job);

  const parts = resumeText
    ? [{ text: `RESUME TEXT:\n${resumeText}\n\n---\n\n${prompt}` }]
    : [
        { inlineData: { mimeType: PDF_MIME_TYPE, data: pdfBuffer.toString('base64') } },
        { text: prompt },
      ];

  let response;
  let model;
  try {
    ({ response, model } = await generateStructured({
      model: getModel(),
      feature: 'resume-analysis',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema: buildResponseSchema(Boolean(job)),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    }));
  } catch (error) {
    if (error?.statusCode) throw error;
    throw badGateway(describeGeminiFailure(error));
  }

  // `model` is whichever model actually produced this result, so the existing
  // model field records it without any schema change.
  return { model, analysis: parseAnalysisResponse(response) };
};

const clampScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
};

const toText = (value, max = 2000) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const toStringList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 50);
};

const normalizeSections = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, SECTION_NAMES.length)
    .map((section) => ({
      name: toText(section?.name, 60),
      score: clampScore(section?.score),
      feedback: toText(section?.feedback),
    }))
    .filter((section) => section.name);
};

// The Gemini schema constrains the shape of the response, but scores are still
// clamped here so one out-of-range value cannot fail Mongoose validation and
// surface to the user as a misleading 400.
const normalizeAnalysis = (raw, withJobMatch) => {
  const normalized = {
    overallScore: clampScore(raw?.overallScore),
    atsScore: clampScore(raw?.atsScore),
    summary: toText(raw?.summary),
    sections: normalizeSections(raw?.sections),
    skills: {
      matched: toStringList(raw?.skills?.matched),
      missing: toStringList(raw?.skills?.missing),
    },
    keywords: {
      matched: toStringList(raw?.keywords?.matched),
      missing: toStringList(raw?.keywords?.missing),
    },
    strengths: toStringList(raw?.strengths),
    suggestions: toStringList(raw?.suggestions),
  };

  if (withJobMatch) {
    normalized.jobMatch = {
      score: clampScore(raw?.jobMatch?.score),
      verdict: toText(raw?.jobMatch?.verdict, 500),
      missingRequirements: toStringList(raw?.jobMatch?.missingRequirements),
    };
  }

  return normalized;
};

// ---------------------------------------------------------------------------
// Job match (AI Job Match + Skill Gap Analyzer)
//
// Reuses the single Gemini client, retry wrapper, JSON parser and score
// normalisers defined above. No second client and no second key handling.
// ---------------------------------------------------------------------------

const MAX_JOB_TEXT_ITEMS = 40;
const MAX_JOB_TEXT_ITEM_CHARS = 400;

const JOB_MATCH_SYSTEM_INSTRUCTION = [
  'You are an AI career/job matching assistant.',
  'Compare the supplied resume with the supplied job description and requirements.',
  'Use ONLY information that is present in the resume and in the job data you are given.',
  'Never invent skills, experience, education, projects, certifications or job requirements.',
  'If the resume does not evidence something, it belongs in a missing list, never in a matching list.',
  'Give practical, specific recommendations that reference the actual job and the actual resume.',
].join(' ');

const buildJobMatchResponseSchema = () => ({
  type: 'object',
  properties: {
    matchPercentage: scoreField(
      'Overall match between the candidate\'s demonstrated qualifications and this job, from 0 to 100.'
    ),
    verdict: {
      type: 'string',
      description:
        'One short sentence stating whether this candidate is a strong, plausible or weak match for the job.',
    },
    summary: {
      type: 'string',
      description:
        'Two or three sentences explaining why the candidate matches this job: the real overlap with the role and the main thing holding them back.',
    },
    matchingSkills: stringListField(
      'Skills the job asks for that the resume clearly evidences. Only include skills present in the job data.'
    ),
    missingSkills: stringListField(
      'Skills present in the job data that the resume does not evidence. Never include skills the job does not ask for.'
    ),
    matchingRequirements: stringListField(
      'Requirements from the job data that the resume clearly satisfies. Keep each close to the wording of the requirement.'
    ),
    missingRequirements: stringListField(
      'Requirements from the job data that the resume does not evidence. Keep each close to the wording of the requirement.'
    ),
    skillGaps: stringListField(
      'Short statements of the gap between what the job needs and what the resume shows, e.g. "Job asks for 3 years of React; resume shows a 6-month internship".'
    ),
    experienceMatch: {
      type: 'string',
      description:
        'Two or three sentences comparing the experience the resume actually shows against the experience level this job asks for.',
    },
    educationMatch: {
      type: 'string',
      description:
        'Two or three sentences comparing the education the resume actually shows against what this job implies. If the resume shows no education, say so plainly.',
    },
    strengths: stringListField(
      'Parts of the resume that are directly relevant to this job and are genuine strengths for it.',
    ),
    weaknesses: stringListField(
      'Real weaknesses or gaps in the resume relative to this job. Do not pad this list.',
    ),
    recommendedSkills: stringListField(
      'Skills worth learning that would close the gap to this job, most valuable first.',
    ),
    recommendations: stringListField(
      'Practical, specific actions the candidate could take to improve their fit for this job, highest impact first.',
    ),
  },
  required: [
    'matchPercentage',
    'verdict',
    'summary',
    'matchingSkills',
    'missingSkills',
    'matchingRequirements',
    'missingRequirements',
    'skillGaps',
    'experienceMatch',
    'educationMatch',
    'strengths',
    'weaknesses',
    'recommendedSkills',
    'recommendations',
  ],
});

const truncateItem = (value) => toText(value, MAX_JOB_TEXT_ITEM_CHARS);
const NOT_SPECIFIED = 'not specified';

const formatJobList = (values) => {
  if (!Array.isArray(values) || !values.length) return NOT_SPECIFIED;
  return values.slice(0, MAX_JOB_TEXT_ITEMS).map(truncateItem).filter(Boolean).join('; ') || NOT_SPECIFIED;
};

const formatSalary = (salary) => {
  const min = Number(salary?.min);
  const max = Number(salary?.max);

  if (!Number.isFinite(min) && !Number.isFinite(max)) return NOT_SPECIFIED;

  const currency = toText(salary?.currency, 10) || 'INR';
  const period = toText(salary?.period, 20) || 'yearly';
  const range = `${Number.isFinite(min) ? min : '?'} to ${Number.isFinite(max) ? max : '?'}`;

  return `${range} ${currency} ${period}`;
};

// Explicit allowlist built from the real Job schema. The raw MongoDB document is
// never handed to Gemini, so recruiter-owned fields such as createdBy and
// applications cannot leak into the prompt.
const selectJobForMatching = (job) => ({
  title: toText(job?.title, 200),
  companyName: toText(job?.company?.name, 200),
  location: toText(job?.location, 200),
  jobType: toText(job?.jobType, 50),
  experienceLevel: toText(job?.experienceLevel, 50),
  salary: formatSalary(job?.salary),
  skills: Array.isArray(job?.skills) ? job.skills : [],
  requirements: Array.isArray(job?.requirements) ? job.requirements : [],
  responsibilities: Array.isArray(job?.responsibilities) ? job.responsibilities : [],
  description: toText(job?.description, MAX_JOB_DESCRIPTION_CHARS),
});

const buildJobMatchPrompt = (job) => {
  const data = selectJobForMatching(job);

  return [
    'Analyse the attached resume against the job below and return the match report described in the output schema.',
    '',
    'Rules you must follow:',
    '- Use ONLY what is written in the resume and in the job data below.',
    '- Never invent a skill, employer, project, certification, degree or requirement that is not present in one of the two sources.',
    '- Put a skill or requirement in a matching list only when the resume explicitly evidences it.',
    '- Put a skill or requirement in a missing list when the job asks for it and the resume does not evidence it.',
    '- If the job does not mention something at all, leave it out. Do not guess what a job in this field usually needs.',
    '- matchingSkills and missingSkills together must only cover skills that appear in the job skills or requirements.',
    '- Keep every entry as written in the source data wherever possible; do not paraphrase skill names.',
    '',
    'Scoring guidance for matchPercentage:',
    '- It must reflect the real overlap between the qualifications the resume demonstrates and what this job asks for.',
    '- Weight the job\'s required skills and requirements most heavily, then relevant experience, then education.',
    '- Be strict and realistic. An average qualified candidate scores 50 to 70.',
    '- Reserve 85 and above for a candidate who meets nearly every stated requirement.',
    '- A resume that evidences almost none of the job\'s requirements must score below 30.',
    '- Do not award points for soft qualities or for enthusiasm. Only evidenced qualifications count.',
    '',
    'JOB DATA:',
    `Job title: ${data.title || NOT_SPECIFIED}`,
    `Company: ${data.companyName || NOT_SPECIFIED}`,
    `Location: ${data.location || NOT_SPECIFIED}`,
    `Employment type: ${data.jobType || NOT_SPECIFIED}`,
    `Experience level sought: ${data.experienceLevel || NOT_SPECIFIED}`,
    `Salary: ${data.salary}`,
    `Skills required: ${formatJobList(data.skills)}`,
    `Requirements: ${formatJobList(data.requirements)}`,
    `Responsibilities: ${formatJobList(data.responsibilities)}`,
    `Job description: ${data.description || NOT_SPECIFIED}`,
    '',
    'This job data has no dedicated education field, so judge education only against what the requirements and description actually state.',
    'Write summary as a short explanation of why this candidate matches this job.',
    'Write verdict as a one sentence recommendation on whether to apply.',
  ].join('\n');
};

// The Gemini SDK surfaces upstream availability/quota failures as raw JSON
// strings. Map them onto stable, actionable 5xx messages so a client never sees
// provider internals. Errors raised by our own helpers already carry a
// statusCode and a clean message, so they pass through untouched.
const describeGeminiFailure = (error) => {
  if (error?.statusCode) return error.message;

  const message = String(error?.message || '');
  const status = Number(error?.status || error?.code);

  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(message)) {
    return 'The AI service is busy and its request limit was reached. Please try again in a minute.';
  }
  if (status === 503 || /UNAVAILABLE|high demand/i.test(message)) {
    return 'The AI service is temporarily unavailable. Please try again shortly.';
  }
  if (isAbortError(error) || /timeout|timed out|aborted/i.test(message)) {
    return 'The AI service took too long to respond. Please try again shortly.';
  }
  if (status === 403 || /PERMISSION_DENIED/i.test(message)) {
    return 'The AI service rejected this request.';
  }
  return 'The AI service could not complete the job match. Please try again.';
};

// @desc    Send a resume (PDF or text) plus a target job to Gemini and return the parsed match
// @route   (internal service) — used by jobMatchController
// If resumeText is provided, sends text instead of PDF (much faster)
const analyzeJobMatchPdf = async ({ pdfBuffer, resumeText, job }) => {
  const prompt = buildJobMatchPrompt(job);

  const parts = resumeText
    ? [{ text: `RESUME TEXT:\n${resumeText}\n\n---\n\n${prompt}` }]
    : [
        { inlineData: { mimeType: PDF_MIME_TYPE, data: pdfBuffer.toString('base64') } },
        { text: prompt },
      ];

  let response;
  let model;
  try {
    ({ response, model } = await generateStructured({
      model: getModel(),
      feature: 'job-match',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        systemInstruction: JOB_MATCH_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema: buildJobMatchResponseSchema(),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    }));
  } catch (error) {
    if (error?.statusCode) throw error;
    throw badGateway(describeGeminiFailure(error));
  }

  // `model` is whichever model actually produced this result.
  return { model, analysis: parseAnalysisResponse(response) };
};

// The Gemini schema constrains the response shape, but matchPercentage is still
// clamped here so one out-of-range value cannot fail Mongoose validation and
// surface to the user as a misleading 400.
const normalizeJobMatch = (raw) => ({
  matchPercentage: clampScore(raw?.matchPercentage),
  verdict: toText(raw?.verdict, 500),
  summary: toText(raw?.summary),
  matchingSkills: toStringList(raw?.matchingSkills),
  missingSkills: toStringList(raw?.missingSkills),
  matchingRequirements: toStringList(raw?.matchingRequirements),
  missingRequirements: toStringList(raw?.missingRequirements),
  skillGaps: toStringList(raw?.skillGaps),
  experienceMatch: toText(raw?.experienceMatch),
  educationMatch: toText(raw?.educationMatch),
  strengths: toStringList(raw?.strengths),
  weaknesses: toStringList(raw?.weaknesses),
  recommendedSkills: toStringList(raw?.recommendedSkills),
  recommendations: toStringList(raw?.recommendations),
});

module.exports = {
  DEFAULT_MODEL,
  DEFAULT_FALLBACK_MODEL,
  analyzeResumePdf,
  buildResponseSchema,
  clampScore,
  getFallbackModel,
  getModel,
  isTemporaryAvailabilityError,
  isAbortError,
  isRetryable,
  normalizeAnalysis,
  // Job match
  analyzeJobMatchPdf,
  buildJobMatchPrompt,
  buildJobMatchResponseSchema,
  normalizeJobMatch,
  selectJobForMatching,
};
