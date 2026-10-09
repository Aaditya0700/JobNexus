import test from 'node:test';
import assert from 'node:assert/strict';
import { isJobSaved } from '../src/utils/jobState.js';

test('saved-job matching supports raw ids and populated job records', () => {
  const jobId = '6ac62c0ddaed6a30526ad68b';
  assert.equal(isJobSaved([jobId], jobId), true);
  assert.equal(isJobSaved([{ _id: jobId, title: 'Senior React Developer' }], jobId), true);
  assert.equal(isJobSaved([{ _id: 'another-job' }], jobId), false);
  assert.equal(isJobSaved(null, jobId), false);
});
