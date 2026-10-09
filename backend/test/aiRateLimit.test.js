const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const { RATE_LIMIT_MAX, recordAiRun, recentRunsExpression } = require('../services/aiRateLimit');

test('atomic AI reservation filters expired timestamps before counting runs', () => {
  const cutoff = new Date('2026-01-01T00:00:00.000Z');
  assert.deepEqual(recentRunsExpression(cutoff), {
    $filter: {
      input: { $ifNull: ['$analysisRunsAt', []] },
      as: 'run',
      cond: { $gt: ['$$run', cutoff] },
    },
  });
});

test('AI reservation atomically enforces the cap and appends the timestamp', async () => {
  const originalUpdateOne = User.updateOne;
  const now = new Date('2026-01-01T01:00:00.000Z');
  let query;
  let update;
  User.updateOne = async (actualQuery, actualUpdate) => {
    query = actualQuery;
    update = actualUpdate;
    return { modifiedCount: 1 };
  };

  try {
    assert.equal(await recordAiRun('user-id', now), true);
    assert.equal(query._id, 'user-id');
    assert.deepEqual(query.$expr, { $lt: [{ $size: update[0].$set.analysisRunsAt.$concatArrays[0] }, RATE_LIMIT_MAX] });
    assert.equal(update[0].$set.analysisRunsAt.$concatArrays[1][0], now);
  } finally {
    User.updateOne = originalUpdateOne;
  }
});
