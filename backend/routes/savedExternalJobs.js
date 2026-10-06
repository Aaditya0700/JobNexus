const express = require('express');
const router = express.Router();
const { getSavedExternalJobs, saveExternalJob, unsaveExternalJob } = require('../controllers/savedExternalJobController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('student'), getSavedExternalJobs);
router.post('/', protect, authorize('student'), saveExternalJob);
router.delete('/:externalJobId', protect, authorize('student'), unsaveExternalJob);

module.exports = router;
