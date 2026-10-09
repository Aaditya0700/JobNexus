const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, uploadResume, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadResume: uploadResumeMiddleware, uploadProfile } = require('../config/cloudinary');
const { authLimiter } = require('../middleware/rateLimiter');

const parseResumeUpload = (req, res, next) => {
  uploadResumeMiddleware.single('resume')(req, res, (error) => {
    if (error) {
      console.error('[ResumeUpload] stage:', error.name === 'MulterError' || error.code === 'INVALID_RESUME_TYPE'
        ? 'multipart-validation'
        : 'cloudinary-storage');
      return next(error);
    }
    console.info(`[ResumeUpload] stage: ${req.file ? 'cloudinary-upload-complete' : 'multipart-no-file'}`);
    next();
  });
};

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadProfile.single('profilePhoto'), updateProfile);
router.post('/resume', protect, parseResumeUpload, uploadResume);
router.put('/password', protect, changePassword);

module.exports = router;
