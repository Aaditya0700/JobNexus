const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_RESULTS_PER_PAGE = 50;
const MIN_RESULTS_PER_PAGE = 1;
const DEFAULT_RESULTS_PER_PAGE = 20;

const cache = new Map();

const buildCacheKey = (params) => {
  const { q, location, page, results_per_page, sort_by } = params;
  return `${q || ''}|${location || ''}|${page || 1}|${results_per_page || DEFAULT_RESULTS_PER_PAGE}|${sort_by || 'date'}`;
};

const isCacheValid = (entry) => Date.now() - entry.timestamp < CACHE_TTL_MS;

const getFromCache = (key) => {
  const entry = cache.get(key);
  if (entry && isCacheValid(entry)) {
    return entry.data;
  }
  if (entry) {
    cache.delete(key);
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const sanitizeParams = (params) => {
  const sanitized = {};
  if (params.q && typeof params.q === 'string') {
    sanitized.q = params.q.trim().slice(0, 100);
  }
  if (params.location && typeof params.location === 'string') {
    sanitized.location = params.location.trim().slice(0, 100);
  }
  const page = parseInt(params.page, 10);
  sanitized.page = Number.isFinite(page) && page > 0 ? page : 1;
  const resultsPerPage = parseInt(params.results_per_page, 10);
  sanitized.results_per_page = Number.isFinite(resultsPerPage)
    ? Math.min(Math.max(resultsPerPage, MIN_RESULTS_PER_PAGE), MAX_RESULTS_PER_PAGE)
    : DEFAULT_RESULTS_PER_PAGE;
  if (params.sort_by && typeof params.sort_by === 'string') {
    const allowed = ['relevance', 'salary'];
    sanitized.sort_by = allowed.includes(params.sort_by) ? params.sort_by : 'relevance';
  } else {
    sanitized.sort_by = 'relevance';
  }
  return sanitized;
};

const buildAdzunaUrl = (params) => {
  const { ADZUNA_APP_ID, ADZUNA_APP_KEY, ADZUNA_COUNTRY } = process.env;
  const country = ADZUNA_COUNTRY || 'in';
  const baseUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/${params.page}`;
  const queryParams = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: params.results_per_page,
    what: params.q || '',
    where: params.location || '',
    sort_by: params.sort_by,
  });
  return `${baseUrl}?${queryParams.toString()}`;
};

const normalizeJob = (adzunaJob) => {
  const salaryMin = adzunaJob.salary_min ? Number(adzunaJob.salary_min) : null;
  const salaryMax = adzunaJob.salary_max ? Number(adzunaJob.salary_max) : null;
  const salaryPeriod = adzunaJob.salary_is_predicted ? 'predicted' : 'yearly';

  return {
    externalId: String(adzunaJob.id),
    source: 'adzuna',
    title: adzunaJob.title || 'Untitled Position',
    company: adzunaJob.company?.display_name || 'Unknown Company',
    location: adzunaJob.location?.display_name || 'Location not specified',
    description: adzunaJob.description || '',
    redirectUrl: adzunaJob.redirect_url || '',
    created: adzunaJob.created ? new Date(adzunaJob.created) : new Date(),
    salaryMin,
    salaryMax,
    salaryPeriod,
    jobType: adzunaJob.contract_type || null,
    category: adzunaJob.category?.label || null,
    companyLogo: adzunaJob.company?.logo_url || null,
  };
};

const fetchFromAdzuna = async (params) => {
  const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = process.env;
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    throw new Error('Adzuna API credentials are not configured on the server.');
  }

  const url = buildAdzunaUrl(params);
  
  // Log URL for debugging (without app_key)
  const debugUrl = url.replace(ADZUNA_APP_KEY, '***');
  console.log('[Adzuna] Request URL:', debugUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {}
      
      console.error('[Adzuna] API Error:', response.status, errorBody || '(no body)');
      
      if (response.status === 429) {
        throw new Error('Adzuna API rate limit exceeded. Please try again later.');
      }
      if (response.status >= 500) {
        throw new Error('Adzuna API is temporarily unavailable. Please try again later.');
      }
      throw new Error(`Adzuna API error: ${response.status} - ${errorBody || 'Bad Request'}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Adzuna API request timed out.');
    }
    throw error;
  }
};

const searchJobs = async (rawParams) => {
  const params = sanitizeParams(rawParams);
  const cacheKey = buildCacheKey(params);

  const cached = getFromCache(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const data = await fetchFromAdzuna(params);

  const normalizedJobs = (data.results || []).map(normalizeJob);

  const result = {
    success: true,
    source: 'adzuna',
    count: normalizedJobs.length,
    page: params.page,
    total: data.count || 0,
    jobs: normalizedJobs,
  };

  setCache(cacheKey, result);
  return { ...result, cached: false };
};

const clearCache = () => {
  cache.clear();
};

const getCacheStats = () => ({
  size: cache.size,
  keys: Array.from(cache.keys()),
});

// Fetch a single external job by externalId for validation
// This searches Adzuna with a broad query and finds the job by ID
const getExternalJobById = async (externalId) => {
  // Search with empty query to get a broad set of results
  const params = sanitizeParams({ q: '', location: '', page: 1, results_per_page: 50 });
  const cacheKey = buildCacheKey(params);

  const cached = getFromCache(cacheKey);
  let data;
  if (cached) {
    data = cached;
  } else {
    data = await fetchFromAdzuna(params);
    const result = {
      success: true,
      source: 'adzuna',
      count: (data.results || []).length,
      page: params.page,
      total: data.count || 0,
      jobs: (data.results || []).map(normalizeJob),
    };
    setCache(cacheKey, result);
    data = result;
  }

  const job = data.jobs.find((j) => j.externalId === externalId);
  return job || null;
};

module.exports = {
  searchJobs,
  clearCache,
  getCacheStats,
  CACHE_TTL_MS,
  getExternalJobById,
};