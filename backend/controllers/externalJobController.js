const { searchJobs } = require('../services/adzunaService');

const getExternalJobs = async (req, res, next) => {
  try {
    const { q, location, page, results_per_page, sort_by } = req.query;

    const result = await searchJobs({ q, location, page, results_per_page, sort_by });

    res.json({
      success: true,
      source: 'adzuna',
      cached: result.cached,
      count: result.count,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / (result.count || 1)) || 1,
      jobs: result.jobs,
    });
  } catch (error) {
    if (error.message.includes('credentials are not configured')) {
      console.warn('[Adzuna] API credentials not configured');
      return res.status(503).json({
        success: false,
        message: 'External job search is temporarily unavailable. Please try again later.',
        source: 'adzuna',
        jobs: [],
      });
    }
    if (error.message.includes('rate limit') || error.message.includes('temporarily unavailable') || error.message.includes('timed out')) {
      return res.status(503).json({
        success: false,
        message: error.message,
        source: 'adzuna',
        jobs: [],
      });
    }
    next(error);
  }
};

const getExternalJob = async (req, res, next) => {
  try {
    const { externalId } = req.params;

    const result = await searchJobs({ q: '', location: '', page: 1, results_per_page: 50 });

    const job = result.jobs.find((j) => j.externalId === externalId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'External job not found' });
    }

    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExternalJobs, getExternalJob };