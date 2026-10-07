const Job = require('../models/Job');
const { getExternalJobById } = require('../services/adzunaService');
const { analyzeJob } = require('../services/trustCheckService');

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ''));

const getInternalJobTrust = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidObjectId(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job id.' });
    }

    const job = await Job.findById(jobId).populate('company', 'name logo location website description industry size');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const jobData = {
      ...job.toObject(),
      source: 'internal',
    };

    const trustCheck = analyzeJob(jobData);

    res.json({ success: true, trustCheck });
  } catch (error) {
    next(error);
  }
};

const getExternalJobTrust = async (req, res, next) => {
  try {
    const { externalJobId } = req.params;

    if (!externalJobId || typeof externalJobId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid external job id.' });
    }

    const job = await getExternalJobById(externalJobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'External job not found' });
    }

    const jobData = {
      ...job,
      source: 'adzuna',
    };

    const trustCheck = analyzeJob(jobData);

    res.json({ success: true, trustCheck });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInternalJobTrust, getExternalJobTrust };