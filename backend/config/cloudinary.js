const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Resume storage (PDF only — the AI Resume Analyzer expects PDF)
const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'job-portal/resumes',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
  },
});

// Profile picture storage
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'job-portal/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

const resumeFileFilter = (req, file, cb) => {
  const isPdf =
    file.mimetype === 'application/pdf' ||
    (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
  if (isPdf) {
    cb(null, true);
  } else {
    const error = new Error('Only PDF resume files are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: resumeFileFilter,
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = { cloudinary, uploadResume, uploadProfile };