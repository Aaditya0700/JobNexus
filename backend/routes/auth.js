const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, uploadResume, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadResume: uploadResumeMiddleware, uploadProfile } = require('../config/cloudinary');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadProfile.single('profilePhoto'), updateProfile);
router.post('/resume', protect, uploadResumeMiddleware.single('resume'), uploadResume);
router.put('/password', protect, changePassword);

module.exports = router;