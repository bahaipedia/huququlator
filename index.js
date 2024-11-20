const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { parse } = require('fast-csv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const { body, validationResult } = require('express-validator');
const winston = require('winston');

dotenv.config();

// Initialize Express
const app = express();
const port = 3000;

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// Logger setup using Winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Configure Axios with retry logic
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

const cache = {
    goldPrice: null,
    timestamp: null
};

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Create a MariaDB connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware to check if user is logged in
function checkLoginStatus(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        req.loggedIn = false;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.loggedIn = true;
        req.userId = decoded.id;
        req.username = decoded.username;
    } catch (error) {
        logger.error('JWT verification failed', { error });
        req.loggedIn = false;
    }
    next();
}

// Helper function to validate user inputs
function validateInputs(validations) {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    };
}

// Routes
app.set('view engine', 'ejs');

// Basic routes
app.get('/', checkLoginStatus, (req, res) => {
    res.render('index', { loggedIn: req.loggedIn, username: req.username });
});

app.get('/wealthtracker', async (req, res) => {
    try {
        const userId = 1; // Replace with the actual logged-in user ID

        // Fetch financial labels grouped by category
        const [labels] = await pool.query(
            `SELECT id, category, label FROM financial_labels WHERE user_id = ? ORDER BY category, id`,
            [userId]
        );

        // Fetch financial entries with formatted reporting_date
        const [entries] = await pool.query(
            `SELECT 
                label_id, 
                DATE_FORMAT(reporting_date, '%Y-%m-%d') AS reporting_date, 
                value 
             FROM financial_entries 
             WHERE user_id = ? 
             ORDER BY reporting_date`,
            [userId]
        );

        // Group entries by reporting date for table columns
        const groupedEntries = {};
        entries.forEach(entry => {
            if (!groupedEntries[entry.reporting_date]) {
                groupedEntries[entry.reporting_date] = {};
            }
            groupedEntries[entry.reporting_date][entry.label_id] = entry.value;
        });

        // Organize labels by category
        const categorizedLabels = {
            Assets: [],
            Debts: [],
            Expenses: [],
        };
        labels.forEach(label => {
            if (categorizedLabels[label.category]) {
                categorizedLabels[label.category].push(label);
            }
        });

        res.render('wealthtracker', {
            categorizedLabels,
            groupedEntries,
            reportingDates: Object.keys(groupedEntries), // Dates will already be formatted as 'YYYY-MM-DD'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get the value of 2.25 troy ounces of gold
app.get('/api/gold-price', async (req, res) => {
    try {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Format: YYYYMMDD

        const { date = today } = req.query; // Default to today's date

        // If the same date is requested and cached, return the cached value
        if (cache.goldPrice && cache.timestamp && cache.date === date && now - cache.timestamp < oneDay) {
            logger.info(`Serving cached gold price for date: ${date}`);
            return res.json({ value: cache.goldPrice });
        }

        const apiKey = process.env.GOLD_API_KEY;
        const apiUrl = date === today
            ? `https://www.goldapi.io/api/XAU/USD` // Current price endpoint
            : `https://www.goldapi.io/api/XAU/USD/${date}`; // Historical price endpoint

        const response = await axios.get(apiUrl, {
            headers: {
                'x-access-token': apiKey,
                'Content-Type': 'application/json',
            },
        });

        // Ensure the response contains a valid price
        const goldPrice = response.data.price; // Price in troy ounces
        if (!goldPrice) {
            throw new Error('Gold price is missing in the API response.');
        }

        const mithqalPrice = goldPrice * 2.22456; // Calculate mithqal price

        // Update the cache
        cache.goldPrice = mithqalPrice;
        cache.timestamp = now;
        cache.date = date;

        logger.info(`Fetched and cached gold price for date: ${date}`);
        return res.json({ value: mithqalPrice });
    } catch (error) {
        logger.error('Error fetching gold price', { error });
        res.status(500).json({ value: null, error: 'Gold price unavailable' });
    }
});

app.get('/help', checkLoginStatus, (req, res) => {
    res.render('help', { loggedIn: req.loggedIn, username: req.username });
});

app.get('/register', (req, res) => {
    res.render('register', { loggedIn: false });
});

app.get('/login', (req, res) => {
    res.render('login', { loggedIn: false });
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

app.get('/test', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.redirect('/login');
    }

    try {
        const userId = req.userId;

        // Fetch financial summaries
        const [summaries] = await pool.query(
            `
            SELECT 
                id, 
                user_id, 
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, 
                total_assets, 
                total_debts, 
                unnecessary_expenses, 
                wealth_already_taxed, 
                gold_rate, 
                huquq_payments_made 
            FROM financial_summary 
            WHERE user_id = ? 
            ORDER BY end_date ASC
            `,
            [userId]
        );

        // Fetch all labels for the user
        const [labels] = await pool.query(
            `
            SELECT 
                id, 
                user_id, 
                category, 
                label 
            FROM financial_labels 
            WHERE user_id = ? 
            ORDER BY category ASC, label ASC
            `,
            [userId]
        );

        // Fetch all financial entries
        const [entries] = await pool.query(
            `
            SELECT 
                fv.id,
                fv.user_id,
                fv.label_id,
                DATE_FORMAT(fv.reporting_date, '%Y-%m-%d') AS reporting_date,
                fv.value,
                fl.category,
                fl.label
            FROM financial_entries fv
            JOIN financial_labels fl ON fv.label_id = fl.id
            WHERE fv.user_id = ?
            ORDER BY fv.reporting_date ASC, fl.category ASC, fl.label ASC
            `,
            [userId]
        );

        // Render the test page with raw data for debugging
        res.render('test', {
            summaries,
            labels,
            entries,
        });
    } catch (error) {
        console.error('Error loading test page:', error);
        res.status(500).send('Server Error');
    }
});

// User Registration Endpoint
app.post(
    '/register',
    [
        body('username').isAlphanumeric().withMessage('Username must be alphanumeric'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('email').isEmail().withMessage('Must be a valid email')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render('register', { errors: errors.array(), loggedIn: false });
        }

        const { username, password, email } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email]);
            res.redirect('/login');
        } catch (error) {
            logger.error('Error during registration', { error });
            res.status(500).render('register', {
                errorMessage: 'An error occurred during registration. Please try again.',
                loggedIn: false
            });
        }
    }
);

// User Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).render('login', { errorMessage: 'User not found', loggedIn: false });
        }

        const user = rows[0];
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).render('login', { errorMessage: 'Incorrect password', loggedIn: false });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.redirect('/');
    } catch (error) {
        logger.error('Error during login', { error });
        res.status(500).render('login', { errorMessage: 'An error occurred during login.', loggedIn: false });
    }
});

// Dashboard route
app.get('/dashboard', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.redirect('/login');
    }

    try {
        const userId = req.userId;

        // Fetch financial summaries for the user
        const [summaries] = await pool.query(
            `
            SELECT 
                id, 
                user_id, 
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, 
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, 
                total_assets, 
                total_debts, 
                unnecessary_expenses, 
                wealth_already_taxed, 
                gold_rate, 
                huquq_payments_made 
            FROM financial_summary 
            WHERE user_id = ? 
            ORDER BY end_date ASC
            `,
            [userId]
        );

        // Fetch all labels for the user
        const [labels] = await pool.query(
            `
            SELECT 
                id, 
                user_id, 
                category, 
                label 
            FROM financial_labels 
            WHERE user_id = ? 
            ORDER BY category ASC, label ASC
            `,
            [userId]
        );

        // Fetch all financial entries with normalized reporting_date
        const [entries] = await pool.query(
            `
            SELECT 
                fv.id,
                fv.user_id,
                fv.label_id,
                DATE_FORMAT(fv.reporting_date, '%Y-%m-%d') AS reporting_date, -- Normalize date format
                fv.value,
                fl.category,
                fl.label
            FROM financial_entries fv
            JOIN financial_labels fl ON fv.label_id = fl.id
            WHERE fv.user_id = ?
            ORDER BY fv.reporting_date ASC, fl.category ASC, fl.label ASC
            `,
            [userId]
        );

        // Transform the data for easier rendering
        const entryMap = labels.map(label => {
            const labelEntries = entries.filter(entry => entry.label_id === label.id);
            return {
                id: label.id,
                category: label.category,
                label: label.label,
                values: summaries.map(summary => {
                    const match = labelEntries.find(entry => entry.reporting_date === summary.end_date);
                    return match ? parseFloat(match.value).toFixed(2) : '0.00';
                }),
            };
        });

        // Render the dashboard page with the fetched data
        res.render('dashboard', {
            loggedIn: req.loggedIn,
            username: req.username,
            summaries,
            labels,
            entries,
            entryMap,
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Server Error');
    }
});

app.post('/api/labels', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        logger.info('Unauthorized access attempt.');
        return res.status(403).send('Unauthorized');
    }

    try {
        const { category, label } = req.body;
        const userId = req.userId;

        logger.info('Received request to add label.', { category, label, userId });

        // Check if the label already exists
        let [labelResult] = await pool.query(
            `
            SELECT id 
            FROM financial_labels 
            WHERE user_id = ? AND category = ? AND label = ?
            `,
            [userId, category, label]
        );

        let labelId;

        if (labelResult.length === 0) {
            // Insert the new label
            logger.info('Label does not exist. Inserting new label...');
            const insertLabelQuery = `
                INSERT INTO financial_labels (user_id, category, label)
                VALUES (?, ?, ?)
            `;
            const result = await pool.query(insertLabelQuery, [userId, category, label]);
            labelId = result[0].insertId; // Get the inserted label's ID
            logger.info('Inserted new label with ID:', labelId);
        } else {
            labelId = labelResult[0].id; // Use existing label's ID
            logger.info('Label already exists with ID:', labelId);
        }

        // Get all existing reporting_dates for the user
        logger.info('Fetching existing reporting dates...');
        const [datesResult] = await pool.query(
            `
            SELECT DISTINCT reporting_date 
            FROM financial_entries 
            WHERE user_id = ?
            `,
            [userId]
        );
        logger.info('Existing reporting dates:', datesResult);

        // Insert entries for the new label for all existing reporting_dates
        const insertEntryQuery = `
            INSERT INTO financial_entries (user_id, label_id, reporting_date, value)
            VALUES (?, ?, ?, ?)
        `;
        const entries = datesResult.map(date => [
            userId,
            labelId,
            date.reporting_date,
            0.00, // Default value
        ]);

        logger.info('Entries to insert:', entries);

        if (entries.length > 0) {
            try {
                await pool.query(insertEntryQuery, [entries]);
                logger.info('Successfully inserted financial entries for the new label.');
            } catch (err) {
                logger.error('Error inserting financial entries:', err);
            }
        }

        // Return the labelId to the client
        res.status(201).json({ labelId });
    } catch (error) {
        logger.error('Error adding financial label:', error);
        res.status(500).send('Server Error');
    }
});

app.put('/api/labels/:id', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const { id } = req.params;
        const { value } = req.body;

        // Update the value in financial_entries
        const updateValueQuery = `
            UPDATE financial_entries
            SET value = ?
            WHERE id = ? AND label_id IN (
                SELECT id FROM financial_labels WHERE user_id = ?
            )
        `;
        await pool.query(updateValueQuery, [value, id, req.userId]);

        // Get the reporting_date and label_id for the updated entry
        const [entry] = await pool.query(`
            SELECT reporting_date, label_id
            FROM financial_entries
            WHERE id = ? AND label_id IN (
                SELECT id FROM financial_labels WHERE user_id = ?
            )
        `, [id, req.userId]);

        if (entry.length === 0) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        const { reporting_date } = entry[0];

        // Aggregate totals for the reporting_date
        const [totals] = await pool.query(`
            SELECT 
                SUM(CASE WHEN l.category = 'Assets' THEN v.value ELSE 0 END) AS total_assets,
                SUM(CASE WHEN l.category = 'Debts' THEN v.value ELSE 0 END) AS total_debts,
                SUM(CASE WHEN l.category = 'Expenses' THEN v.value ELSE 0 END) AS unnecessary_expenses
            FROM financial_entries v
            JOIN financial_labels l ON v.label_id = l.id
            WHERE l.user_id = ? AND v.reporting_date = ?
        `, [req.userId, reporting_date]);

        const { total_assets, total_debts, unnecessary_expenses } = totals[0];

        // Update the financial_summary table
        const updateSummaryQuery = `
            UPDATE financial_summary
            SET total_assets = ?, total_debts = ?, unnecessary_expenses = ?
            WHERE user_id = ? AND end_date = ?
        `;
        await pool.query(updateSummaryQuery, [total_assets, total_debts, unnecessary_expenses, req.userId, reporting_date]);

        res.status(200).json({ message: 'Entry updated and summary recalculated successfully' });
    } catch (error) {
        console.error('Error updating entry and recalculating summary:', error);
        res.status(500).send('Server Error');
    }
});

app.delete('/api/labels/:id', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const { id } = req.params;
        const userId = req.userId;

        // Delete associated entries from financial_entries
        await pool.query(
            `
            DELETE FROM financial_entries
            WHERE label_id = ? AND label_id IN (
                SELECT id FROM financial_labels WHERE user_id = ?
            )
            `,
            [id, userId]
        );

        // Delete the label itself
        const [result] = await pool.query(
            `
            DELETE FROM financial_labels
            WHERE id = ? AND user_id = ?
            `,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Label not found or not authorized to delete' });
        }

        res.status(200).json({ message: 'Label and associated entries deleted successfully' });
    } catch (error) {
        console.error('Error deleting label:', error);
        res.status(500).send('Server Error');
    }
});

// Route to get all entries for a user
app.get('/api/entries', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const userId = req.userId;

        // Fetch financial entries for the current user, including their labels and categories
        const [entries] = await pool.query(
            `
            SELECT fl.id AS label_id, fl.label, COALESCE(fv.value, 0) AS value, fv.reporting_date, fl.category
            FROM financial_labels fl
            LEFT JOIN financial_entries fv ON fl.id = fv.label_id AND fv.user_id = ?
            WHERE fl.user_id = ?
            `,
            [userId, userId]
        );

        res.status(200).json({ entries });
    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/entries', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const { reporting_date } = req.body; // Expected format: YYYY-MM-DD
        const userId = req.userId;

        // Check if reporting_date is provided
        if (!reporting_date) {
            return res.status(400).json({ error: 'Reporting date is required' });
        }

        // Fetch all labels for the user from financial_labels
        const [labels] = await pool.query(
            'SELECT id FROM financial_labels WHERE user_id = ?',
            [userId]
        );

        if (labels.length === 0) {
            return res.status(400).json({ error: 'No financial labels found for the user' });
        }

        // Insert a new financial entry for each label
        const insertQuery = `
            INSERT INTO financial_entries (user_id, label_id, reporting_date, value)
            VALUES (?, ?, ?, ?)
        `;

        for (let label of labels) {
            await pool.query(insertQuery, [userId, label.id, reporting_date, 0.00]);
        }

        res.status(201).json({ message: 'New financial entries added for the reporting period successfully!' });

    } catch (error) {
        console.error('Error adding financial entries:', error.message, error.stack);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.put('/api/entries/update', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const { label_id, value } = req.body;
        const userId = req.userId;

        // Update the financial entry with the given label
        const result = await pool.query(
            `
            UPDATE financial_entries
            SET value = ?
            WHERE user_id = ? AND label_id = ?
            `,
            [value, userId, label_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Entry not found or not authorized to update.' });
        }

        res.status(200).json({ message: 'Entry updated successfully.' });
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/entries/:id', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const { id } = req.params;
        const userId = req.userId;

        // Fetch the end_date for the reporting period being deleted
        const [summary] = await pool.query(
            'SELECT end_date FROM financial_summary WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (summary.length === 0) {
            return res.status(404).json({ error: 'Year not found or not authorized to delete.' });
        }

        const { end_date } = summary[0];

        // Delete associated entries from financial_entries for the given end_date
        await pool.query(
            `
            DELETE fv
            FROM financial_entries fv
            JOIN financial_labels fl ON fv.label_id = fl.id
            WHERE fl.user_id = ? AND fv.reporting_date = ?
            `,
            [userId, end_date]
        );

        // Delete the reporting period from financial_summary
        const result = await pool.query(
            'DELETE FROM financial_summary WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Year not found or not authorized to delete.' });
        }

        res.status(200).json({ message: 'Year and associated entries deleted successfully.' });
    } catch (error) {
        console.error('Error deleting entries and summary:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/summary', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const userId = req.userId;
        
        // Fetch summary data for the user
        const [summaries] = await pool.query(
            `SELECT * FROM financial_summary WHERE user_id = ?`, 
            [userId]
        );

        res.status(200).json({ summaries });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/summary', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const { end_date } = req.body; // Expected format: YYYY-MM-DD
        const userId = req.userId;

        // Check if the date is in the future
        const today = new Date().toISOString().split('T')[0];
        const isFutureDate = end_date > today;

        let goldRate = 0.00;

        if (!isFutureDate) {
            // Fetch the gold rate for valid past/current dates
            const formattedDate = end_date.replace(/-/g, '');
            const goldResponse = await axios.get(`http://localhost:3000/api/gold-price?date=${formattedDate}`);
            goldRate = goldResponse.data.value;

            if (!goldRate) {
                throw new Error('Failed to fetch gold rate.');
            }
        }

        // Fetch the previous reporting period's end_date
        const [previousPeriod] = await pool.query(
            'SELECT MAX(end_date) AS last_end_date FROM financial_summary WHERE user_id = ?',
            [userId]
        );

        const lastEndDate = previousPeriod[0]?.last_end_date || null;

        // Calculate wealth_already_taxed
        const [prevSummaries] = await pool.query(
            'SELECT total_assets - total_debts + unnecessary_expenses - wealth_already_taxed AS summary FROM financial_summary WHERE user_id = ?',
            [userId]
        );

        const wealthAlreadyTaxed = prevSummaries.length > 0
            ? prevSummaries.reduce((acc, row) => acc + (parseFloat(row.summary) || 0), 0)
            : 0;
        const roundedWealthAlreadyTaxed = parseFloat(wealthAlreadyTaxed.toFixed(5));

        // Insert a new reporting period with placeholder totals
        const insertQuery = `
            INSERT INTO financial_summary (user_id, start_date, end_date, wealth_already_taxed, gold_rate)
            VALUES (?, ?, ?, ?, ?)
        `;
        await pool.query(insertQuery, [userId, lastEndDate, end_date, roundedWealthAlreadyTaxed, goldRate]);

        // Aggregate totals for the new reporting date
        const [totals] = await pool.query(`
            SELECT 
                SUM(CASE WHEN fl.category = 'Assets' THEN fv.value ELSE 0 END) AS total_assets,
                SUM(CASE WHEN fl.category = 'Debts' THEN fv.value ELSE 0 END) AS total_debts,
                SUM(CASE WHEN fl.category = 'Expenses' THEN fv.value ELSE 0 END) AS unnecessary_expenses
            FROM financial_entries fv
            JOIN financial_labels fl ON fv.label_id = fl.id
            WHERE fl.user_id = ? AND fv.reporting_date = ?
        `, [userId, end_date]);

        const { total_assets, total_debts, unnecessary_expenses } = totals[0];

        // Update the new reporting period with calculated totals
        const updateQuery = `
            UPDATE financial_summary
            SET total_assets = ?, total_debts = ?, unnecessary_expenses = ?
            WHERE user_id = ? AND end_date = ?
        `;
        await pool.query(updateQuery, [total_assets, total_debts, unnecessary_expenses, userId, end_date]);

        res.status(201).json({ message: 'New reporting period added successfully!' });
    } catch (error) {
        console.error('Error adding reporting period:', error.message, error.stack);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.put('/api/summary/:id', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(403).send('Unauthorized');
    }

    try {
        const { id } = req.params;
        const { huquq_payments_made } = req.body;

        const query = `
            UPDATE financial_summary
            SET huquq_payments_made = ?
            WHERE id = ? AND user_id = ?
        `;

        await pool.query(query, [huquq_payments_made, id, req.userId]);

        res.status(200).json({ message: 'Summary updated successfully' });
    } catch (error) {
        console.error('Error updating summary:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/upload', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.redirect('/login');
    }

    const statusLabels = {
        ne: 'Necessary',
        un: 'Unnecessary', // Will not appear in upload rules
        hi: 'Hidden'
    };

    try {
        const [uploadHistory] = await pool.query(
            'SELECT * FROM upload_history WHERE user_id = ? ORDER BY upload_date DESC',
            [req.userId]
        );
        const safeUploadHistory = uploadHistory || [];

        const [rules] = await pool.query(
            'SELECT * FROM filter_rules WHERE user_id = ? ORDER BY created_at DESC',
            [req.userId]
        );

        res.render('upload', {
            uploadHistory: safeUploadHistory,
            rules: rules || [],
            statusLabels,
            loggedIn: req.loggedIn
        });
    } catch (error) {
        console.error('Error loading upload page:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/upload/history-data', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const [uploadHistory] = await pool.query(
            'SELECT * FROM upload_history WHERE user_id = ? ORDER BY upload_date DESC',
            [req.userId]
        );
        res.json(uploadHistory);
    } catch (error) {
        console.error('Error fetching upload history data:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/upload', checkLoginStatus, upload.single('csvFile'), async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.userId;
    const filePath = req.file.path;
    const filename = req.file.originalname;
    const selectedRuleIds = JSON.parse(req.body.selectedRules || '[]');
    const transactions = [];
    let rowsImported = 0;

    // Define column mapping for flexible CSV formats
    const columnMapping = {
        "Date": "date",
        "Transaction Date": "date",
        "Description": "description",
        "Amount": "amount",
        "Transaction Type": "transaction_type",
        "Category": "category",
        "Account": "account",
        "Account Name": "account",
        "Tags": "tags",
        "Labels": "tags"
    };

    // Retrieve selected filter rules
    let filterRules = [];
    try {
        if (selectedRuleIds.length > 0) {
            const placeholders = selectedRuleIds.map(() => '?').join(','); // Prepare placeholders for query
            const [rules] = await pool.query(
                `SELECT origin_status, field, value, mark_as 
                 FROM filter_rules 
                 WHERE user_id = ? AND id IN (${placeholders})`,
                [userId, ...selectedRuleIds]
            );
            filterRules = rules;
        }
    } catch (error) {
        logger.error('Error retrieving filter rules', { error });
        return res.status(500).json({ message: 'Error retrieving filter rules' });
    }

    // Process CSV file
    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(parse({ headers: true }))
                .on('data', row => {
                    const transaction = {};

                    // Map CSV fields to transaction object
                    for (const [csvColumn, field] of Object.entries(columnMapping)) {
                        if (row[csvColumn] !== undefined) {
                            transaction[field] = row[csvColumn];
                        }
                    }

                    // Parse and process fields
                    transaction.date = new Date(transaction.date); // Convert to Date
                    transaction.amount = parseFloat(transaction.amount?.replace(/,/g, '') || '0'); // Parse Amount

                    // Skip rows with amount = 0
                    if (transaction.amount === 0) {
                        return; // Skip this row silently
                    }

                    // Determine transaction status
                    if (transaction.transaction_type) {
                        // Use Transaction Type for Format 1
                        transaction.status = transaction.transaction_type.toLowerCase() === 'credit' ? 'hi' : 'ne';
                    } else {
                        // Default status logic for Format 2
                        transaction.status = transaction.amount > 0 ? 'hi' : 'ne';
                    }

                    // Apply selected filter rules
                    filterRules.forEach(rule => {
                        if (transaction.status === rule.origin_status) {
                            const fieldValue = transaction[rule.field.toLowerCase()];
                            if (
                                fieldValue &&
                                typeof fieldValue === 'string' &&
                                fieldValue.toLowerCase().includes(rule.value.toLowerCase())
                            ) {
                                transaction.status = rule.mark_as; // Update status based on rule
                            }
                        }
                    });

                    // Add valid transaction to the array
                    transactions.push({
                        user_id: userId,
                        date: transaction.date,
                        account: transaction.account,
                        description: transaction.description,
                        category: transaction.category,
                        tags: transaction.tags || null,
                        amount: transaction.amount,
                        status: transaction.status
                    });
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Insert upload history and transactions
        const [uploadResult] = await pool.query(
            'INSERT INTO upload_history (user_id, filename, rows_imported, status) VALUES (?, ?, ?, ?)',
            [userId, filename, rowsImported, 'success']
        );
        const uploadId = uploadResult.insertId;

        for (const transaction of transactions) {
            await pool.query(
                'INSERT INTO transactions (user_id, date, account, description, category, tags, amount, status, upload_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    transaction.user_id,
                    transaction.date,
                    transaction.account,
                    transaction.description,
                    transaction.category || null,
                    transaction.tags || null,
                    transaction.amount,
                    transaction.status,
                    uploadId
                ]
            );
            rowsImported++;
        }

        // Update upload history with the number of rows imported
        await pool.query('UPDATE upload_history SET rows_imported = ? WHERE id = ?', [rowsImported, uploadId]);

        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);
        res.status(200).json({ message: 'Transactions uploaded successfully' });
    } catch (error) {
        logger.error('Error during CSV upload', { error });

        // Log upload as failed
        await pool.query(
            'INSERT INTO upload_history (user_id, filename, rows_imported, status) VALUES (?, ?, ?, "error")',
            [userId, filename, rowsImported]
        );

        res.status(500).json({ message: 'Error uploading transactions' });
    }
});

app.post('/upload/delete', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).send('Unauthorized');
    }

    const { uploadId } = req.body;

    try {
        // Delete transactions associated with this upload
        await pool.query('DELETE FROM transactions WHERE upload_id = ?', [uploadId]);

        // Delete the upload history record itself
        await pool.query('DELETE FROM upload_history WHERE id = ?', [uploadId]);

        res.redirect('/upload');
    } catch (error) {
        console.error('Error deleting upload:', error);
        res.status(500).send('Error deleting upload');
    }
});

// Display all necessary transactions
app.get('/transactions', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.redirect('/login');
    }

    try {
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;
        const transactions = await getDateFilteredTransactions(req.userId, 'ne', startDate, endDate);

        const transactionCount = transactions.length;
        const totalAmount = Math.abs(transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0));

        res.render('transactions', {
            transactions,
            transactionCount,
            totalAmount,
            loggedIn: req.loggedIn,
            pageIndicator: 'necessary-expenses',
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Error loading Necessary Transactions page:', error);
        res.status(500).send('Server Error');
    }
});

// Route for Unnecessary Expenses
app.get('/transactions/unnecessary', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.redirect('/login');
    }

    try {
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;
        const transactions = await getDateFilteredTransactions(req.userId, 'un', startDate, endDate);

        const transactionCount = transactions.length;
        const totalAmount = Math.abs(transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0));

        res.render('transactions_unnecessary', {
            transactions,
            transactionCount,
            totalAmount,
            loggedIn: req.loggedIn,
            pageIndicator: 'unnecessary-expenses',
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Error loading Unnecessary Transactions page:', error);
        res.status(500).send('Server Error');
    }
});

// Route for Hidden Transactions
app.get('/transactions/hidden', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.redirect('/login');
    }

    try {
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;
        const transactions = await getDateFilteredTransactions(req.userId, 'hi', startDate, endDate);

        res.render('transactions_hidden', {
            transactions,
            loggedIn: req.loggedIn,
            pageIndicator: 'hidden',
            startDate,
            endDate
        });
    } catch (error) {
        console.error('Error loading Hidden Transactions page:', error);
        res.status(500).send('Server Error');
    }
});

// Route to set date filter range
app.post('/transactions/date-filter', checkLoginStatus, (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start and end dates are required' });
    }

    // Store the date range in session or localStorage (to be handled client-side)
    res.status(200).json({ message: 'Date range saved successfully' });
});

app.post('/transactions/clear-date-filter', checkLoginStatus, (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    res.status(200).json({ message: 'Date filter cleared successfully' });
});

// Route for categorizing transactions based on status
app.post('/transactions/categorize', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { transactionId, status } = req.body;

    // Validate that `transactionId` is a number and `status` is one of the expected values
    if (!transactionId || !['ne', 'un', 'hi'].includes(status)) {
        return res.status(400).json({ message: 'Invalid transaction ID or status' });
    }

    try {
        // Update the transaction's status in the database
        await pool.query(
            'UPDATE transactions SET status = ? WHERE id = ? AND user_id = ?',
            [status, transactionId, req.userId]
        );

        // Fetch the updated transaction to return to the client
        const [updatedTransaction] = await pool.query(
            'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
            [transactionId, req.userId]
        );

        if (updatedTransaction.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json(updatedTransaction[0]);
    } catch (error) {
        console.error('Error updating transaction status:', error);
        res.status(500).json({ message: 'Error updating transaction' });
    }
});

// Route for previewing transactions based on filter criteria and date range
app.post('/transactions/preview-filter', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { field, value, status, startDate, endDate } = req.body;

    // Validate free-text input field
    if (typeof value !== 'string' || value.trim() === '') {
        return res.status(400).json({ message: 'Invalid input value.' });
    }

    // Start query construction
    let query = `SELECT * FROM transactions WHERE user_id = ? AND status = ?`;
    let params = [req.userId, status];

    // Adjust query based on the field
    if (field === 'description') {
        query += ` AND description LIKE ?`;
        params.push(`%${value}%`);
    } else {
        query += ` AND ${field} = ?`;
        params.push(value);
    }

    // Apply date range filtering if startDate and/or endDate are provided
    if (startDate) {
        query += ` AND date >= ?`;
        params.push(startDate);
    }
    if (endDate) {
        query += ` AND date <= ?`;
        params.push(endDate);
    }

    try {
        const [transactions] = await pool.query(query, params);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error previewing filter:', error);
        res.status(500).json({ message: 'Error previewing filter' });
    }
});

// Route to apply a filter to a transaction
app.post('/transactions/filter', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { field, value, action, originStatus } = req.body;

    // Validate free-text input field
    if (typeof value !== 'string' || value.trim() === '') {
        return res.status(400).json({ message: 'Invalid input value.' });
    }

    let query, params;

    try {
        // Construct query to respect originStatus
        if (field === 'description') {
            query = `
                UPDATE transactions 
                SET status = ? 
                WHERE user_id = ? AND description LIKE ? AND status = ?
            `;
            params = [action, req.userId, `%${value}%`, originStatus];
        } else {
            query = `
                UPDATE transactions 
                SET status = ? 
                WHERE user_id = ? AND ${field} = ? AND status = ?
            `;
            params = [action, req.userId, value, originStatus]; 
        }

        const [result] = await pool.query(query, params);

        // Check if any rows were affected
        if (result.affectedRows === 0) {
            return res.status(200).json({ message: 'No transactions matched the filter' });
        }

        res.status(200).json({ message: 'Filter applied successfully.' });
    } catch (error) {
        console.error('Error applying filter:', error);
        res.status(500).json({ message: 'Error applying filter.' });
    }
});

// Route to display saved filter rules
app.get('/filter-rules', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.redirect('/login');
    }

    try {
        const [rules] = await pool.query(
            'SELECT * FROM filter_rules WHERE user_id = ? ORDER BY created_at DESC',
            [req.userId]
        );

        res.render('filter_rules', {
            rules,
            loggedIn: req.loggedIn,
            pageIndicator: 'filter-rules'
        });
    } catch (error) {
        console.error('Error loading Filter Rules page:', error);
        res.status(500).send('Server Error');
    }
});

// Route to save a new filter rule
app.post('/filter-rules/save', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { field, value, action, originStatus } = req.body;

    try {
        await pool.query(
            'INSERT INTO filter_rules (user_id, field, value, origin_status, mark_as) VALUES (?, ?, ?, ?, ?)',
            [req.userId, field, value, originStatus, action]
        );

        res.status(200).json({ message: 'Filter rule saved successfully' });
    } catch (error) {
        console.error('Error saving filter rule:', error);
        res.status(500).json({ message: 'Error saving filter rule' });
    }
});

// Route to delete a filter rule
app.post('/filter-rules/delete', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).redirect('/login');
    }

    const { ruleId } = req.body;

    try {
        await pool.query('DELETE FROM filter_rules WHERE id = ? AND user_id = ?', [ruleId, req.userId]);
        res.redirect('/filter-rules');
    } catch (error) {
        console.error('Error deleting filter rule:', error);
        res.status(500).send('Server Error');
    }
});

// Helper function to get date-filtered transactions
async function getDateFilteredTransactions(userId, status, startDate, endDate) {
    let query = 'SELECT * FROM transactions WHERE user_id = ? AND status = ?';
    const params = [userId, status];

    if (startDate && endDate) {
        query += ' AND date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC';
    const [transactions] = await pool.query(query, params);

    return transactions;
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
