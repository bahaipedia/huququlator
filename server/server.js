const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const pool = require('./config/db');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const publicRoutes = require('./routes/publicRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api', publicRoutes);

// Test Database Connection
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        res.status(200).json({ 
            status: 'success', 
            message: 'Database connected successfully', 
            solution: rows[0].solution 
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

// Run every day at midnight to delete unverified accounts older than 30 days
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cleanup of unverified accounts...');
    try {
        const [result] = await pool.query(
            `DELETE FROM users WHERE is_verified = FALSE AND created_at < NOW() - INTERVAL 30 DAY`
        );
        if (result.affectedRows > 0) {
            console.log(`Deleted ${result.affectedRows} unverified bot accounts.`);
        }
    } catch (error) {
        console.error('Error during account cleanup task:', error);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
