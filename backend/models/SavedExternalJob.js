const mongoose = require('mongoose');

const savedExternalJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['adzuna'],
      default: 'adzuna',
      required: true,
    },
    externalJobId: {
      type: String,
      required: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    redirectUrl: { type: String, required: true, trim: true },
    jobType: { type: String, default: '' },
    category: { type: String, default: '' },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    companyLogo: { type: String, default: '' },
  },
  { timestamps: true }
);

savedExternalJobSchema.index({ user: 1, source: 1, externalJobId: 1 }, { unique: true });

module.exports = mongoose.model('SavedExternalJob', savedExternalJobSchema);
