const express = require('express');
const router = express.Router();

const { register, login, logout, refreshToken } = require('../../controllers/V1/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;