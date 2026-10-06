const User = require('../models/User');

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.AI_ANALYSIS_HOURLY_LIMIT) || 3;

// Shared hourly cost guard for every Gemini-backed feature (resume analysis and
// job match). Both draw on one budget per user so adding a second AI feature
// cannot double the number of paid calls a user can trigger.
//
// Run timestamps live on the user rather than being counted from analysis
// documents because re-analyzing the same target overwrites its analysis, so
// counting documents would never trip.
const evaluateAiRateLimit = (user) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const recentRuns = (user.analysisRunsAt || []).filter((run) => run > cutoff);

  return {
    allowed: recentRuns.length < RATE_LIMIT_MAX,
    limit: RATE_LIMIT_MAX,
    recentRuns,
    now,
  };
};

const aiRateLimitMessage = (limit, subject) =>
  `You have reached the limit of ${limit} ${subject} per hour. Please try again later.`;

// Charged immediately before the paid Gemini call so that a rejected job id, a
// missing resume or a failed download never costs the user a run.
const recordAiRun = async (userId, now, recentRuns) =>
  User.updateOne({ _id: userId }, { $set: { analysisRunsAt: [...recentRuns, now] } });

module.exports = {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  evaluateAiRateLimit,
  aiRateLimitMessage,
  recordAiRun,
};