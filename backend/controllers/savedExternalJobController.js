const SavedExternalJob = require('../models/SavedExternalJob');
const { getExternalJobById } = require('../services/adzunaService');

// @desc    Get current user's saved external jobs
// @route   GET /api/saved-external-jobs
// @access  Private (student)
const getSavedExternalJobs = async (req, res, next) => {
  try {
    const jobs = await SavedExternalJob.find({ user: req.user.id }).sort('-createdAt');
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
};

// @desc    Save an external (Adzuna) job
// @route   POST /api/saved-external-jobs
// @access  Private (student)
const saveExternalJob = async (req, res, next) => {
  try {
    const { externalJobId, source, title, company, location, redirectUrl, jobType, category, salaryMin, salaryMax, companyLogo } = req.body;

    if (!externalJobId || typeof externalJobId !== 'string' || !externalJobId.trim()) {
      return res.status(400).json({ success: false, message: 'externalJobId is required' });
    }
    if (source && source !== 'adzuna') {
      return res.status(400).json({ success: false, message: 'Invalid source. Only "adzuna" is supported.' });
    }

    // Prevent duplicate saves for the same user + source + externalJobId
    const existing = await SavedExternalJob.findOne({
      user: req.user.id,
      source: 'adzuna',
      externalJobId: externalJobId.trim(),
    });
    if (existing) {
      return res.json({ success: true, saved: true, alreadySaved: true, job: existing });
    }

    // Prefer canonical data from the existing Adzuna service when available
    let canonical = null;
    try {
      canonical = await getExternalJobById(externalJobId.trim());
    } catch {
      canonical = null;
    }

    const fields = canonical || {
      externalId: externalJobId.trim(),
      source: 'adzuna',
      title: typeof title === 'string' ? title.trim() : '',
      company: typeof company === 'string' ? company.trim() : '',
      location: typeof location === 'string' ? location.trim() : '',
      redirectUrl: typeof redirectUrl === 'string' ? redirectUrl.trim() : '',
      jobType: typeof jobType === 'string' ? jobType : '',
      category: typeof category === 'string' ? category : '',
      salaryMin,
      salaryMax,
      companyLogo: typeof companyLogo === 'string' ? companyLogo : '',
    };

    if (!fields.title || !fields.company || !fields.redirectUrl) {
      return res.status(400).json({ success: false, message: 'title, company and redirectUrl are required' });
    }
    if (!/^https?:\/\//i.test(fields.redirectUrl)) {
      return res.status(400).json({ success: false, message: 'Invalid redirectUrl' });
    }

    const saved = await SavedExternalJob.create({
      user: req.user.id,
      source: 'adzuna',
      externalJobId: externalJobId.trim(),
      title: fields.title,
      company: fields.company,
      location: fields.location || '',
      redirectUrl: fields.redirectUrl,
      jobType: fields.jobType || '',
      category: fields.category || '',
      salaryMin: typeof fields.salaryMin === 'number' ? fields.salaryMin : undefined,
      salaryMax: typeof fields.salaryMax === 'number' ? fields.salaryMax : undefined,
      companyLogo: fields.companyLogo || '',
    });

    res.status(201).json({ success: true, saved: true, job: saved });
  } catch (error) {
    // Unique index fallback (race conditions)
    if (error?.code === 11000) {
      return res.json({ success: true, saved: true, alreadySaved: true });
    }
    next(error);
  }
};

// @desc    Unsave an external (Adzuna) job
// @route   DELETE /api/saved-external-jobs/:externalJobId
// @access  Private (student)
const unsaveExternalJob = async (req, res, next) => {
  try {
    const { externalJobId } = req.params;
    const result = await SavedExternalJob.findOneAndDelete({
      user: req.user.id,
      source: 'adzuna',
      externalJobId,
    });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Saved job not found' });
    }
    res.json({ success: true, saved: false });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSavedExternalJobs, saveExternalJob, unsaveExternalJob };
