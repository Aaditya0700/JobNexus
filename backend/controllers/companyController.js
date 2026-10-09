const Company = require('../models/Company');
const { cloudinary } = require('../config/cloudinary');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const COMPANY_UPDATE_FIELDS = ['name', 'description', 'website', 'location', 'industry', 'size'];

// @desc    Register company
// @route   POST /api/companies
// @access  Private (recruiter)
const registerCompany = async (req, res, next) => {
  try {
    const existing = await Company.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a registered company' });
    }

    const company = await Company.create({ ...req.body, userId: req.user.id });

    // Link company to user
    await require('../models/User').findByIdAndUpdate(req.user.id, { company: company._id });

    res.status(201).json({ success: true, company });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
const getCompanies = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};
    if (search) query.name = { $regex: escapeRegex(search), $options: 'i' };

    const total = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .populate('userId', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, companies });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Public
const getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate('userId', 'name');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (recruiter — own company)
const updateCompany = async (req, res, next) => {
  try {
    let company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

    if (company.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.file) {
      req.body.logo = req.file.path;
    }

    const updates = Object.fromEntries(
      COMPANY_UPDATE_FIELDS
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (req.file) updates.logo = req.file.path;

    company = await Company.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    res.json({ success: true, company });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my company
// @route   GET /api/companies/my
// @access  Private (recruiter)
const getMyCompany = async (req, res, next) => {
  try {
    const company = await Company.findOne({ userId: req.user.id });
    res.json({ success: true, company });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerCompany, getCompanies, getCompany, updateCompany, getMyCompany };
