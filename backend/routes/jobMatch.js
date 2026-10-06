const express = require('express');
const router = express.Router();
const {
  analyzeJobMatch,
  getJobMatch,
  getMyJobMatches,
  analyzeExternalJobMatch,
  getExternalJobMatch,
} = require('../controllers/jobMatchController');
const { protect, authorize } = require('../middleware/auth');

router.post('/analyze/:jobId', protect, authorize('student'), analyzeJobMatch);
router.get('/:jobId', protect, authorize('student'), getJobMatch);
router.get('/', protect, authorize('student'), getMyJobMatches);

// External (Adzuna) job match routes
router.post('/analyze/external/:externalJobId', protect, authorize('student'), analyzeExternalJobMatch);
router.get('/external/:externalJobId', protect, authorize('student'), getExternalJobMatch);

module.exports = router;