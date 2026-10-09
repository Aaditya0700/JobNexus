const { searchJobs, getExternalJobById } = require('../services/adzunaService');

const getExternalJobs = async (req, res, next) => {
  try {
    const { q, location, page, results_per_page, sort_by } = req.query;

    const result = await searchJobs({ q, location, page, results_per_page, sort_by });

    res.json({
      success: true,
      source: 'adzuna',
      cached: result.cached,
      stale: Boolean(result.stale),
      count: result.count,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / (result.pageSize || result.count || 1)) || 1,
      jobs: result.jobs,
    });
  } catch (error) {
    const unavailable = /credentials are not configured|rate limit|temporarily unavailable|timed out/i.test(error.message || '');
    console.warn('[Adzuna] External search failed:', unavailable ? 'temporarily unavailable' : 'provider request rejected');
    return res.status(unavailable ? 503 : 502).json({
      success: false,
      message: unavailable
        ? 'External job search is temporarily unavailable. Please try again shortly.'
        : 'External job search could not be completed. Please try again shortly.',
      source: 'adzuna',
    });
  }
};

const getExternalJob = async (req, res, next) => {
  try {
    const { externalId } = req.params;

    const job = await getExternalJobById(externalId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'External job not found' });
    }

    res.json({ success: true, job });
  } catch (error) {
    const unavailable = /credentials are not configured|rate limit|temporarily unavailable|timed out/i.test(error.message || '');
    return res.status(unavailable ? 503 : 502).json({
      success: false,
      message: unavailable
        ? 'External job search is temporarily unavailable. Please try again shortly.'
        : 'External job details could not be loaded. Please try again shortly.',
      source: 'adzuna',
    });
  }
};

module.exports = { getExternalJobs, getExternalJob };
