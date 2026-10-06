const mongoose = require('mongoose');

const sectionSchema = {
  name: { type: String, required: true, trim: true },
  score: { type: Number, min: 0, max: 100, default: 0 },
  feedback: { type: String, default: '' },
};

const matchListSchema = {
  matched: { type: [{ type: String }], default: [] },
  missing: { type: [{ type: String }], default: [] },
};

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // null means a general analysis with no target job
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    resumeUrl: { type: String },
    resumeOriginalName: { type: String },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    atsScore: { type: Number, min: 0, max: 100, default: 0 },
    summary: { type: String, default: '' },
    sections: [sectionSchema],
    skills: matchListSchema,
    keywords: matchListSchema,
    strengths: [{ type: String }],
    suggestions: [{ type: String }],
    jobMatch: {
      score: { type: Number, min: 0, max: 100 },
      verdict: { type: String },
      missingRequirements: [{ type: String }],
    },
    model: { type: String },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

// One analysis per user per target job — re-analyzing overwrites
resumeAnalysisSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);