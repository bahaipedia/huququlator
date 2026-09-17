const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

// Register User
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password, email } = req.body;

    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) return res.status(409).json({ message: 'Username or email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await pool.query(
            'INSERT INTO users (username, password, email, verification_token) VALUES (?, ?, ?, ?)', 
            [username, hashedPassword, email, verificationToken]
        );
        
        // Send email
        await emailService.sendVerificationEmail(email, verificationToken);
        
        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
        const [users] = await pool.query('SELECT id FROM users WHERE verification_token = ?', [token]);
        if (users.length === 0) return res.status(400).json({ message: 'Invalid or expired verification token' });

        await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?',
            [users[0].id]
        );

        res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
};

// Login User
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid username or password' });

        const user = rows[0];

        if (!user.is_verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid username or password' });

        // Update last login
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '12h' }
        );

        res.cookie('token', token, { 
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', maxAge: 12 * 3600000
        });

        res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Logout User
exports.logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
};

// Check Auth Status
exports.checkAuth = (req, res) => {
    res.status(200).json({ user: { id: req.userId, username: req.username, role: req.role } });
};
