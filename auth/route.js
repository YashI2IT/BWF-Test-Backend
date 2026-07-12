const express = require('express');
const router = express.Router();
const { login, refreshToken, logout } = require('./controller');

const {authenticateToken} = require('./middleware');

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateToken, logout);

module.exports = router;