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

const recentRunsExpression = (cutoff) => ({
  $filter: {
    input: { $ifNull: ['$analysisRunsAt', []] },
    as: 'run',
    cond: { $gt: ['$$run', cutoff] },
  },
});

// Atomically check the shared hourly cap and record the run. A read followed
// by $set allowed parallel requests to overwrite one another and all pass the
// limit. The conditional pipeline update admits only the requests that still
// fit beneath the cap.
const recordAiRun = async (userId, now) => {
  const cutoff = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const recentRuns = recentRunsExpression(cutoff);
  const result = await User.updateOne(
    {
      _id: userId,
      $expr: { $lt: [{ $size: recentRuns }, RATE_LIMIT_MAX] },
    },
    [{ $set: { analysisRunsAt: { $concatArrays: [recentRuns, [now]] } } }]
  );

  return result.modifiedCount === 1;
};

module.exports = {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  evaluateAiRateLimit,
  aiRateLimitMessage,
  recordAiRun,
  recentRunsExpression,
};
