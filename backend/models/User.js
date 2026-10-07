const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'recruiter', 'admin'],
      default: 'student',
    },
    profile: {
      bio: { type: String, maxlength: 500 },
      skills: [{ type: String }],
      resumeUrl: { type: String },
      resumeOriginalName: { type: String },
      resumeText: { type: String },
      resumeVersion: { type: String },
      resumeAnalysis: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ResumeAnalysis',
      },
      resumeAnalyzedAt: { type: Date },
      profilePhoto: {
        type: String,
        default: '',
      },
    },
    // Recruiter-specific
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Timestamps of resume analyzer runs, used for the per-user cost guard
    analysisRunsAt: [{ type: Date, default: [] }],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);