const express = require('express');
const router = express.Router();
const {
  analyzeResume,
  getMyAnalyses,
  getAnalysis,
} = require('../controllers/resumeAnalysisController');
const { protect, authorize } = require('../middleware/auth');

router.post('/analyze', protect, authorize('student'), analyzeResume);
router.get('/', protect, authorize('student'), getMyAnalyses);
router.get('/:id', protect, authorize('student'), getAnalysis);

module.exports = router;