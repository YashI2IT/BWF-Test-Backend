// student/sos/routes.js
const express = require('express');
const router = express.Router();
const { triggerSOS } = require('./controller');
const { authenticateToken, authorizeRoles } = require('../../auth/middleware');

/**
 * @route POST /api/student/sos
 * @desc  Triggers an emergency alert
 * @access Private (Student only)
 */
router.post(
    '/',
    authenticateToken,
    authorizeRoles('student'),
    triggerSOS
);

module.exports = router;
