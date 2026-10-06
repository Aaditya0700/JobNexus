const ResumeAnalysis = require('../models/ResumeAnalysis');
const Job = require('../models/Job');
const User = require('../models/User');
const { fetchResumePdf } = require('../services/resumeFetcher');
const { analyzeResumePdf, normalizeAnalysis } = require('../services/geminiService');
const { evaluateAiRateLimit, aiRateLimitMessage, recordAiRun } = require('../services/aiRateLimit');

const ANALYSIS_HISTORY_LIMIT = 20;

// @desc    Analyze the student's resume, optionally against a target job
// @route   POST /api/resume-analysis/analyze
// @access  Private (student)
const analyzeResume = async (req, res, next) => {
  try {
    const { jobId } = req.body;

    const resumeUrl = req.user.profile?.resumeUrl;
    const resumeOriginalName = req.user.profile?.resumeOriginalName;

    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume in your profile before running the analyzer.',
      });
    }

    if (resumeOriginalName && !/\.pdf$/i.test(resumeOriginalName)) {
      return res.status(400).json({
        success: false,
        message: 'The resume analyzer supports PDF files only. Please upload a PDF resume.',
      });
    }

    // Basic per-user cost guard — Gemini calls are billed per request. Run
    // timestamps live on the user because re-analyzing the same job overwrites
    // its analysis, so counting analysis documents would never trip. This budget
    // is shared with the job match feature.
    const { allowed, limit, recentRuns, now } = evaluateAiRateLimit(req.user);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: aiRateLimitMessage(limit, 'resume analyses'),
      });
    }

    let job = null;
    if (jobId) {
      job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
    }

    const pdfBuffer = await fetchResumePdf(resumeUrl);

    // Charged only once the resume is in hand, immediately before the paid call,
    // so a failed download does not cost the user a run
    await recordAiRun(req.user.id, now, recentRuns);

    const { model, analysis: rawAnalysis } = await analyzeResumePdf({ pdfBuffer, job });

    const analysis = normalizeAnalysis(rawAnalysis, Boolean(job));

    const saved = await ResumeAnalysis.findOneAndUpdate(
      { user: req.user.id, job: job ? job._id : null },
      {
        $set: {
          resumeUrl,
          resumeOriginalName,
          ...analysis,
          model,
          status: 'completed',
        },
        // A general analysis must not inherit a job match from a previous run
        ...(job ? {} : { $unset: { jobMatch: 1 } }),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await User.updateOne(
      { _id: req.user.id },
      {
        $set: {
          'profile.resumeAnalysis': saved._id,
          'profile.resumeAnalyzedAt': now,
        },
      }
    );

    res.json({ success: true, analysis: saved });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the student's own analyses
// @route   GET /api/resume-analysis
// @access  Private (student)
const getMyAnalyses = async (req, res, next) => {
  try {
    const analyses = await ResumeAnalysis.find({ user: req.user.id })
      .populate('job', 'title location jobType experienceLevel')
      .sort('-createdAt')
      .limit(ANALYSIS_HISTORY_LIMIT);

    res.json({ success: true, count: analyses.length, analyses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single analysis owned by the student
// @route   GET /api/resume-analysis/:id
// @access  Private (student)
const getAnalysis = async (req, res, next) => {
  try {
    const analysis = await ResumeAnalysis.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('job', 'title location jobType experienceLevel');

    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Analysis not found' });
    }

    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzeResume, getMyAnalyses, getAnalysis };