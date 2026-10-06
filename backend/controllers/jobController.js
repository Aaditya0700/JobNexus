const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');

// @desc    Get all jobs with search & filters
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res, next) => {
  try {
    const {
      keyword,
      location,
      jobType,
      experienceLevel,
      minSalary,
      maxSalary,
      skills,
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = req.query;

    const query = { status: 'active' };

    // Text search
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // Filters
    if (location) query.location = { $regex: location, $options: 'i' };
    if (jobType) query.jobType = { $in: jobType.split(',') };
    if (experienceLevel) query.experienceLevel = { $in: experienceLevel.split(',') };
    if (skills) query.skills = { $in: skills.split(',') };
    if (minSalary || maxSalary) {
      query['salary.min'] = {};
      if (minSalary) query['salary.min'].$gte = Number(minSalary);
      if (maxSalary) query['salary.max'] = { $lte: Number(maxSalary) };
    }

    // Clamp pagination to safe bounds
    const DEFAULT_LIMIT = 10;
    const MAX_LIMIT = 50;
    let parsedPage = parseInt(page, 10);
    if (!Number.isFinite(parsedPage) || parsedPage < 1) parsedPage = 1;
    let parsedLimit = parseInt(limit, 10);
    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) parsedLimit = DEFAULT_LIMIT;
    if (parsedLimit > MAX_LIMIT) parsedLimit = MAX_LIMIT;

    const skip = (parsedPage - 1) * parsedLimit;
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('company', 'name logo location')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo location website description industry size')
      .populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// @desc    Create job
// @route   POST /api/jobs
// @access  Private (recruiter)
const createJob = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user.id });
    if (!company) {
      return res.status(400).json({ success: false, message: 'Please register a company first' });
    }

    const job = await Job.create({
      ...req.body,
      company: company._id,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (recruiter — own jobs)
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job' });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (recruiter — own jobs)
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this job' });
    }

    // Also delete all applications for this job
    await Application.deleteMany({ job: req.params.id });
    await job.deleteOne();

    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recruiter's own jobs
// @route   GET /api/jobs/my-jobs
// @access  Private (recruiter)
const getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ createdBy: req.user.id })
      .populate('company', 'name logo')
      .populate('applications')
      .sort('-createdAt');

    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
};

// @desc    Save / unsave a job
// @route   PUT /api/jobs/:id/save
// @access  Private (student)
const toggleSaveJob = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    const jobId = req.params.id;

    const isSaved = user.savedJobs.includes(jobId);

    if (isSaved) {
      user.savedJobs = user.savedJobs.filter((id) => id.toString() !== jobId);
    } else {
      user.savedJobs.push(jobId);
    }

    await user.save();
    res.json({ success: true, saved: !isSaved, savedJobs: user.savedJobs });
  } catch (error) {
    next(error);
  }
};

module.exports = { getJobs, getJob, createJob, updateJob, deleteJob, getMyJobs, toggleSaveJob };