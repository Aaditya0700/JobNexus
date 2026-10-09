const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/email');

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private (student)
const applyForJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId).populate('company', 'name');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (job.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
    }

    // Check duplicate
    const existing = await Application.findOne({ job: req.params.jobId, applicant: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already applied to this job' });
    }

    const resumeUrl = req.user.profile?.resumeUrl;
    if (!resumeUrl && !req.body.coverLetter) {
      return res.status(400).json({ success: false, message: 'Please upload a resume before applying' });
    }

    const application = await Application.create({
      job: req.params.jobId,
      applicant: req.user.id,
      coverLetter: req.body.coverLetter,
      resumeUrl: resumeUrl,
      resumeOriginalName: req.user.profile?.resumeOriginalName,
    });

    // Add to job's applications array
    await Job.findByIdAndUpdate(req.params.jobId, { $push: { applications: application._id } });

    // Send confirmation email
    const { subject, html } = emailTemplates.applicationReceived(
      req.user.name,
      job.title,
      job.company.name
    );
    sendEmail({ to: req.user.email, subject, html });

    // Send recruiter notification email
    if (job.createdBy) {
      const recruiter = await User.findById(job.createdBy).select('name email');
      if (recruiter && recruiter.email && recruiter.email !== req.user.email) {
        const { subject: recruiterSubject, html: recruiterHtml } = emailTemplates.recruiterNewApplication(
          recruiter.name,
          req.user.name,
          req.user.email,
          job.title,
          job.company.name
        );
        sendEmail({ to: recruiter.email, subject: recruiterSubject, html: recruiterHtml });
      }
    }

    res.status(201).json({ success: true, message: 'Applied successfully!', application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already applied to this job' });
    }
    next(error);
  }
};

// @desc    Get student's own applications
// @route   GET /api/applications/my
// @access  Private (student)
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user.id })
      .populate({
        path: 'job',
        populate: { path: 'company', select: 'name logo location' },
      })
      .sort('-createdAt');

    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications for a job (recruiter)
// @route   GET /api/applications/job/:jobId
// @access  Private (recruiter)
const getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { job: req.params.jobId };
    if (status) query.status = status;

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .populate('applicant', 'name email profile')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: applications.length, total, applications });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status (recruiter)
// @route   PUT /api/applications/:id/status
// @access  Private (recruiter)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('applicant', 'name email')
      .populate({ path: 'job', select: 'title createdBy' });

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (application.job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    application.status = status;
    if (notes) application.notes = notes;
    await application.save();

    // Notify applicant
    const { subject, html } = emailTemplates.statusUpdate(
      application.applicant.name,
      application.job.title,
      status
    );
    sendEmail({ to: application.applicant.email, subject, html });

    res.json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw application
// @route   DELETE /api/applications/:id
// @access  Private (student)
const withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (application.applicant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Job.findByIdAndUpdate(application.job, { $pull: { applications: application._id } });
    await application.deleteOne();

    res.json({ success: true, message: 'Application withdrawn' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
};