const express = require('express');
const router = express.Router();
const { getInternalJobTrust, getExternalJobTrust } = require('../controllers/trustCheckController');
const { protect } = require('../middleware/auth');

router.get('/job/:jobId', protect, getInternalJobTrust);
router.get('/external/:externalJobId', protect, getExternalJobTrust);

module.exports = router;