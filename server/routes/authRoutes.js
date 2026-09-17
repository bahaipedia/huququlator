const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

router.post('/register', [
    body('username').isAlphanumeric().withMessage('Username must be alphanumeric'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').isEmail().withMessage('Must be a valid email')
], authController.register);

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/check', verifyToken, authController.checkAuth);

module.exports = router;
