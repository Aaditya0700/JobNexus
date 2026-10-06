const mongoose = require('mongoose');

// A job match is always tied to one target job (internal or external).
// Internal jobs reference the Job collection; external jobs are identified by
// source + externalJobId (e.g., Adzuna job id).
const jobMatchAnalysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Internal job reference (only for source === 'internal')
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      index: true,
    },
    // Source of the job: 'internal' for recruiter-posted jobs, 'adzuna' for external
    source: {
      type: String,
      enum: ['internal', 'adzuna'],
      default: 'internal',
      index: true,
    },
    // External job identifier (only for source === 'adzuna')
    externalJobId: {
      type: String,
      index: true,
    },
    // Kept for traceability so a match can always be traced to the exact resume
    // that produced it, even if the student re-uploads later.
    resumeUrl: { type: String },
    resumeOriginalName: { type: String },
    matchPercentage: { type: Number, min: 0, max: 100, default: 0 },
    verdict: { type: String, default: '' },
    summary: { type: String, default: '' },
    matchingSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    matchingRequirements: [{ type: String }],
    missingRequirements: [{ type: String }],
    skillGaps: [{ type: String }],
    experienceMatch: { type: String, default: '' },
    educationMatch: { type: String, default: '' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendedSkills: [{ type: String }],
    recommendations: [{ type: String }],
    model: { type: String },
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

// One analysis per user per internal job — re-analyzing overwrites instead of
// piling up duplicate documents.
jobMatchAnalysisSchema.index(
  { user: 1, job: 1 },
  { unique: true, partialFilterExpression: { source: 'internal' } }
);

// One analysis per user per external job (by source + externalJobId)
jobMatchAnalysisSchema.index(
  { user: 1, source: 1, externalJobId: 1 },
  { unique: true, partialFilterExpression: { source: 'adzuna' } }
);

module.exports = mongoose.model('JobMatchAnalysis', jobMatchAnalysisSchema);