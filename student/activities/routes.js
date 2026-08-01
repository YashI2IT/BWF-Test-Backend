const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../auth/middleware');
const { getCampusActivities } = require('./controller');

router.use(authenticateToken);

router.get('/', getCampusActivities);

module.exports = router;
