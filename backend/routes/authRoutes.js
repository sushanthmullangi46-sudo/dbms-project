const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authenticateUser = require('../middleware/authMiddleware');

router.post('/login', AuthController.login);
router.get('/me', authenticateUser, AuthController.getMe);
router.post('/logout', authenticateUser, AuthController.logout);

module.exports = router;
