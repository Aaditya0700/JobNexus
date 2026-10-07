const User = require('../models/User');
const { sendTokenResponse } = require('../utils/token');
const { sendEmail, emailTemplates } = require('../utils/email');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Don't allow admin registration via API
    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot register as admin' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role: role || 'student' });

    // Send welcome email (non-blocking)
    const { subject, html } = emailTemplates.welcomeEmail(name);
    sendEmail({ to: email, subject, html });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password').populate('company');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('company').populate('savedJobs');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData['profile.bio'] = bio;
    if (skills) updateData['profile.skills'] = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());

    if (req.file) {
      updateData['profile.profilePhoto'] = req.file.path;
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updateData }, { new: true, runValidators: true }).populate('company');

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload resume
// @route   POST /api/auth/resume
// @access  Private (students only)
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'profile.resumeUrl': req.file.path,
          'profile.resumeOriginalName': req.file.originalname,
          'profile.resumeText': '',
          'profile.resumeVersion': '',
        },
      },
      { new: true }
    );

    res.json({ success: true, message: 'Resume uploaded successfully', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, uploadResume, changePassword };