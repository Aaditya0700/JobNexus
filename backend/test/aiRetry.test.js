const test = require('node:test');
const assert = require('node:assert/strict');
const { isAbortError, isRetryable, isTemporaryAvailabilityError } = require('../services/geminiService');

test('Gemini timeout and abort errors are recognized as transient', () => {
  assert.equal(isAbortError({ name: 'TimeoutError' }), true);
  assert.equal(isAbortError({ name: 'AbortError' }), true);
  assert.equal(isRetryable({ name: 'TimeoutError' }), true);
});

test('Gemini retries transient upstream failures but does not retry quota exhaustion', () => {
  assert.equal(isRetryable({ status: 503 }), true);
  assert.equal(isTemporaryAvailabilityError({ status: 503 }), true);
  assert.equal(isRetryable({ status: 429 }), false);
  assert.equal(isTemporaryAvailabilityError({ status: 429, message: 'RESOURCE_EXHAUSTED' }), false);
  assert.equal(isRetryable({ status: 400 }), false);
});
