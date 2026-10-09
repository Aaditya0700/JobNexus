const test = require('node:test');
const assert = require('node:assert/strict');
const {
  clearCache,
  searchJobs,
  CACHE_TTL_MS,
} = require('../services/adzunaService');
const { getExternalJobs } = require('../controllers/externalJobController');

const saveProviderEnvironment = () => {
  const keys = ['ADZUNA_APP_ID', 'ADZUNA_APP_KEY', 'ADZUNA_COUNTRY'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  process.env.ADZUNA_APP_ID = 'test-app-id';
  process.env.ADZUNA_APP_KEY = 'test-app-key';
  process.env.ADZUNA_COUNTRY = 'in';
  return () => keys.forEach((key) => {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  });
};

test('external job service retries transient failures twice and returns stale cached jobs', async () => {
  const restoreEnvironment = saveProviderEnvironment();
  const originalFetch = global.fetch;
  const originalNow = Date.now;
  let calls = 0;
  clearCache();

  try {
    global.fetch = async () => {
      calls += 1;
      if (calls === 1) {
        return {
          ok: true,
          json: async () => ({
            count: 1,
            results: [{ id: 'test-adzuna-job', title: 'QA fixture role' }],
          }),
        };
      }
      return { ok: false, status: 503 };
    };

    const query = { q: 'qa-stale-cache-fixture', page: 1, results_per_page: 12 };
    const fresh = await searchJobs(query);
    Date.now = () => originalNow() + CACHE_TTL_MS + 1;
    const stale = await searchJobs(query);

    assert.equal(stale.stale, true);
    assert.equal(stale.jobs[0].externalId, fresh.jobs[0].externalId);
    assert.equal(calls, 3, 'one initial request plus two bounded retries');
  } finally {
    Date.now = originalNow;
    global.fetch = originalFetch;
    restoreEnvironment();
    clearCache();
  }
});

test('external job API returns a safe retryable error after provider exhaustion', async () => {
  const restoreEnvironment = saveProviderEnvironment();
  const originalFetch = global.fetch;
  let calls = 0;
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  clearCache();

  try {
    global.fetch = async () => {
      calls += 1;
      return { ok: false, status: 503 };
    };

    await getExternalJobs({ query: { q: 'qa-provider-failure-fixture' } }, response, (error) => {
      throw error;
    });

    assert.equal(response.statusCode, 503);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /temporarily unavailable/i);
    assert.equal(JSON.stringify(response.body).includes('test-app-key'), false);
    assert.equal(calls, 2);
  } finally {
    global.fetch = originalFetch;
    restoreEnvironment();
    clearCache();
  }
});
