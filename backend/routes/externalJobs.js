const express = require('express');
const router = express.Router();
const { getExternalJobs, getExternalJob } = require('../controllers/externalJobController');

router.get('/', getExternalJobs);
router.get('/:externalId', getExternalJob);

module.exports = router;