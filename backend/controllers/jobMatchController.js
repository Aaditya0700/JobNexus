const JobMatchAnalysis = require('../models/JobMatchAnalysis');
const Job = require('../models/Job');
const { fetchResumePdf } = require('../services/resumeFetcher');
const { analyzeJobMatchPdf, normalizeJobMatch, selectJobForMatching } = require('../services/geminiService');
const { evaluateAiRateLimit, aiRateLimitMessage, recordAiRun } = require('../services/aiRateLimit');
const { getExternalJobById } = require('../services/adzunaService');

const JOB_MATCH_HISTORY_LIMIT = 20;
const JOB_POPULATE_FIELDS = 'title location jobType experienceLevel';

// The global error handler maps a Mongoose CastError to 404, but an unusable
// job id is a client mistake, so it is rejected as a 400 before any query runs.
// isValidObjectId alone accepts any 12-character string, hence the explicit
// 24-character hex check.
const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''));

const findJobOrRespond = async (jobId, res) => {
  if (!isValidObjectId(jobId)) {
    res.status(400).json({ success: false, message: 'Invalid job id.' });
    return null;
  }

  const job = await Job.findById(jobId).populate('company', 'name');

  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return null;
  }

  return job;
};

const findExternalJobOrRespond = async (externalJobId, res) => {
  if (!externalJobId || typeof externalJobId !== 'string') {
    res.status(400).json({ success: false, message: 'Invalid external job id.' });
    return null;
  }

  const job = await getExternalJobById(externalJobId);

  if (!job) {
    res.status(404).json({ success: false, message: 'External job not found' });
    return null;
  }

  return job;
};

// @desc    Compare the student's resume against a specific job
// @route   POST /api/job-match/analyze/:jobId
// @access  Private (student)
const analyzeJobMatch = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await findJobOrRespond(jobId, res);
    if (!job) return;

    const resumeUrl = req.user.profile?.resumeUrl;
    const resumeOriginalName = req.user.profile?.resumeOriginalName;

    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume in your profile before running the job matcher.',
      });
    }

    // PDF only, matching the resume analyzer. resumeFetcher re-validates the
    // downloaded bytes so a mislabelled file is still caught.
    if (resumeOriginalName && !/\.pdf$/i.test(resumeOriginalName)) {
      return res.status(400).json({
        success: false,
        message: 'The job matcher supports PDF files only. Please upload a PDF resume.',
      });
    }

    // Shared per-user cost guard — this budget is the same one the resume
    // analyzer draws on, so job matching cannot add unlimited Gemini calls.
    const { allowed, limit, recentRuns, now } = evaluateAiRateLimit(req.user);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: aiRateLimitMessage(limit, 'AI analyses'),
      });
    }

    const pdfBuffer = await fetchResumePdf(resumeUrl);

    // Charged only once the resume is in hand, immediately before the paid
    // call, so a failed download does not cost the user a run
    await recordAiRun(req.user.id, now, recentRuns);

    const { model, analysis: rawAnalysis } = await analyzeJobMatchPdf({ pdfBuffer, job });

    const analysis = normalizeJobMatch(rawAnalysis);

    // Upsert so re-analyzing the same job updates the one document for this
    // user + job pair rather than creating duplicates.
    const saved = await JobMatchAnalysis.findOneAndUpdate(
      { user: req.user.id, job: job._id },
      {
        $set: {
          resumeUrl,
          resumeOriginalName,
          ...analysis,
          model,
          status: 'completed',
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('job', JOB_POPULATE_FIELDS);

    res.json({ success: true, analysis: saved });
  } catch (error) {
    next(error);
  }
};

// @desc    Compare the student's resume against an external (Adzuna) job
// @route   POST /api/job-match/analyze/external/:externalJobId
// @access  Private (student)
const analyzeExternalJobMatch = async (req, res, next) => {
  try {
    const { externalJobId } = req.params;

    const job = await findExternalJobOrRespond(externalJobId, res);
    if (!job) return;

    const resumeUrl = req.user.profile?.resumeUrl;
    const resumeOriginalName = req.user.profile?.resumeOriginalName;

    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume in your profile before running the job matcher.',
      });
    }

    if (resumeOriginalName && !/\.pdf$/i.test(resumeOriginalName)) {
      return res.status(400).json({
        success: false,
        message: 'The job matcher supports PDF files only. Please upload a PDF resume.',
      });
    }

    const { allowed, limit, recentRuns, now } = evaluateAiRateLimit(req.user);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: aiRateLimitMessage(limit, 'AI analyses'),
      });
    }

    const pdfBuffer = await fetchResumePdf(resumeUrl);

    await recordAiRun(req.user.id, now, recentRuns);

    // Convert Adzuna job format to the format expected by selectJobForMatching
    const jobForMatching = {
      title: job.title,
      company: { name: job.company },
      location: job.location,
      jobType: job.jobType,
      experienceLevel: null, // Adzuna doesn't provide this directly
      salary: job.salaryMin || job.salaryMax ? { min: job.salaryMin, max: job.salaryMax, currency: 'INR', period: job.salaryPeriod } : null,
      skills: job.category ? [job.category] : [],
      requirements: [],
      responsibilities: [],
      description: job.description,
    };

    const { model, analysis: rawAnalysis } = await analyzeJobMatchPdf({ pdfBuffer, job: jobForMatching });

    const analysis = normalizeJobMatch(rawAnalysis);

    // Upsert for external job (source: 'adzuna', externalJobId)
    const saved = await JobMatchAnalysis.findOneAndUpdate(
      { user: req.user.id, source: 'adzuna', externalJobId },
      {
        $set: {
          resumeUrl,
          resumeOriginalName,
          ...analysis,
          model,
          status: 'completed',
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, analysis: saved });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the student's existing match analysis for one job
// @route   GET /api/job-match/:jobId
// @access  Private (student)
const getJobMatch = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job id.' });
    }

    // Scoped to the requesting user, so one student can never read another's
    // analysis for the same job.
    const analysis = await JobMatchAnalysis.findOne({
      job: jobId,
      user: req.user.id,
    }).populate('job', JOB_POPULATE_FIELDS);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No job match analysis found for this job yet.',
      });
    }

    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the student's existing match analysis for an external job
// @route   GET /api/job-match/external/:externalJobId
// @access  Private (student)
const getExternalJobMatch = async (req, res, next) => {
  try {
    const { externalJobId } = req.params;

    if (!externalJobId || typeof externalJobId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid external job id.' });
    }

    const analysis = await JobMatchAnalysis.findOne({
      source: 'adzuna',
      externalJobId,
      user: req.user.id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No job match analysis found for this external job yet.',
      });
    }

    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all of the student's job match analyses
// @route   GET /api/job-match
// @access  Private (student)
const getMyJobMatches = async (req, res, next) => {
  try {
    const analyses = await JobMatchAnalysis.find({ user: req.user.id })
      .populate('job', JOB_POPULATE_FIELDS)
      .sort('-createdAt')
      .limit(JOB_MATCH_HISTORY_LIMIT);

    res.json({ success: true, count: analyses.length, analyses });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzeJobMatch, getJobMatch, getMyJobMatches, analyzeExternalJobMatch, getExternalJobMatch };