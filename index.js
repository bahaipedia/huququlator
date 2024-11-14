const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const port = 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser()); // Use cookie-parser

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
        next();
    } catch (error) {
        req.loggedIn = false;
        next();
    }
}

app.set('view engine', 'ejs');

// User Registration Endpoint
app.post('/register', async (req, res) => {
    const { username, password, confirmPassword, email } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
        return res.render('register', {
            errorMessage: 'Passwords do not match. Please re-enter.',
            loggedIn: false
        });
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return res.render('register', {
            errorMessage: 'Invalid email format. Please enter a valid email address.',
            loggedIn: false
        });
    }

    try {
        // Hash the password and store the new user in the database
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email]);

        res.redirect('/login');
    } catch (error) {
        console.error('Error during registration:', error);
        res.render('register', {
            errorMessage: 'An error occurred during registration. Please try again.',
            loggedIn: false
        });
    }
});

// User Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Find the user in the database
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).send('User not found');
        }

        const user = rows[0];

        // Check if the password is correct
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).send('Incorrect password');
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        // Save token in a cookie (or session if preferred)
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in');
    }
});

// Basic route
app.get('/', checkLoginStatus, (req, res) => {
    res.render('index', { loggedIn: req.loggedIn, username: req.username });
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

app.get('/upload', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.redirect('/login');
    }

    try {
        const uploadHistory = await pool.query(
            'SELECT * FROM upload_history WHERE user_id = ? ORDER BY upload_date DESC',
            [req.userId]
        );
        const transactions = await pool.query(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
            [req.userId]
        );

        res.render('upload', {
            uploadHistory: uploadHistory[0],
            transactions: transactions[0],
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

app.post('/upload', checkLoginStatus, upload.single('csvFile'), (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.userId;
    const filePath = path.join(__dirname, req.file.path);
    const filename = req.file.originalname;
    const transactions = [];
    let rowsImported = 0;
    let status = 'success';

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            const amount = parseFloat(row.Amount.replace(/,/g, ''));
            const transaction = {
                user_id: userId,
                date: new Date(row.Date),
                account: row.Account,
                description: row.Description,
                category: row.Category,
                tags: row.Tags || null,
                amount: amount,
                status: amount > 0 ? 'hi' : 'ne' 
            };
            transactions.push(transaction);
        })
        .on('end', async () => {
            try {
                const [uploadResult] = await pool.query(
                    'INSERT INTO upload_history (user_id, filename, rows_imported, status) VALUES (?, ?, ?, ?)',
                    [userId, filename, rowsImported, status]
                );
                const uploadId = uploadResult.insertId;

                for (const transaction of transactions) {
                    await pool.query(
                        'INSERT INTO transactions (user_id, date, account, description, category, tags, amount, status, upload_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [transaction.user_id, transaction.date, transaction.account, transaction.description, transaction.category, transaction.tags, transaction.amount, transaction.status, uploadId]
                    );
                    rowsImported++;
                }

                await pool.query(
                    'UPDATE upload_history SET rows_imported = ? WHERE id = ?',
                    [rowsImported, uploadId]
                );

                fs.unlinkSync(filePath);
                res.status(200).json({ message: 'Transactions uploaded successfully' });
            } catch (error) {
                console.error('Error during upload:', error);
                await pool.query(
                    'INSERT INTO upload_history (user_id, filename, rows_imported, status) VALUES (?, ?, ?, "error")',
                    [userId, filename, rowsImported]
                );
                res.status(500).json({ message: 'Error uploading transactions' });
            }
        });
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
        // Query for necessary transactions (status = 'ne')
        const [transactions] = await pool.query(
            'SELECT * FROM transactions WHERE user_id = ? AND status = "ne" ORDER BY date DESC',
            [req.userId]
        );

        // Calculate the number of transactions and total amount as a positive value
        const transactionCount = transactions.length;
        const totalAmount = Math.abs(transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0));

        // Render the page with additional data
        res.render('transactions', {
            transactions,
            transactionCount,
            totalAmount,
            loggedIn: req.loggedIn,
            pageIndicator: 'necessary-expenses'
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
        // Query for unnecessary transactions (status = 'un')
        const [transactions] = await pool.query(
            'SELECT * FROM transactions WHERE user_id = ? AND status = "un" ORDER BY date DESC',
            [req.userId]
        );

        // Calculate the number of transactions and total amount as a positive number
        const transactionCount = transactions.length;
        const totalAmount = Math.abs(transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0));

        // Render the page with additional data
        res.render('transactions_unnecessary', {
            transactions,
            transactionCount,
            totalAmount,
            loggedIn: req.loggedIn,
            pageIndicator: 'unnecessary-expenses'
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
        // Fetch all transactions with status 'hi' for hidden
        const [transactions] = await pool.query(
            'SELECT * FROM transactions WHERE user_id = ? AND status = "hi" ORDER BY date DESC',
            [req.userId]
        );

        res.render('transactions_hidden', {
            transactions,
            loggedIn: req.loggedIn,
            pageIndicator: 'hidden'
        });
    } catch (error) {
        console.error('Error loading Hidden Transactions page:', error);
        res.status(500).send('Server Error');
    }
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

// Route for previewing transactions based on filter criteria
app.post('/transactions/preview-filter', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { field, value, status } = req.body;
    let query, params;

    try {
        if (field === 'description') {
            query = `SELECT * FROM transactions WHERE user_id = ? AND description LIKE ? AND status = ?`;
            params = [req.userId, `%${value}%`, status];
        } else {
            query = `SELECT * FROM transactions WHERE user_id = ? AND ${field} = ? AND status = ?`;
            params = [req.userId, value, status];
        }

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

    const { field, value, action } = req.body;
    let query, params;

    try {
        // Set status based directly on action
        const status = action; // Expecting action to be one of 'ne', 'un', or 'hi'

        // Construct query based on field and status
        if (field === 'description') {
            // Use wildcard matching for description
            query = `UPDATE transactions SET status = ? WHERE user_id = ? AND description LIKE ?`;
            params = [status, req.userId, `%${value}%`];
        } else {
            // Use exact matching for other fields
            query = `UPDATE transactions SET status = ? WHERE user_id = ? AND ${field} = ?`;
            params = [status, req.userId, value];
        }

        await pool.query(query, params);

        res.status(200).json({ message: 'Filter applied successfully' });
    } catch (error) {
        console.error('Error applying filter:', error);
        res.status(500).json({ message: 'Error applying filter' });
    }
});

// Route to delete all transactions
app.post('/transactions/delete-all', checkLoginStatus, async (req, res) => {
    if (!req.loggedIn) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        await pool.query('DELETE FROM transactions WHERE user_id = ?', [req.userId]);
        res.status(200).json({ message: 'All transactions deleted successfully' });
    } catch (error) {
        console.error('Error deleting transactions:', error);
        res.status(500).json({ message: 'Error deleting transactions' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
