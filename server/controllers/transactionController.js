const pool = require('../config/db');

// Get transactions based on status and optional date range
exports.getTransactions = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const userId = req.userId;

        let query = 'SELECT * FROM transactions WHERE user_id = ? AND status = ?';
        const params = [userId, status];

        if (startDate && endDate) {
            query += ' AND date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY date DESC';
        const [transactions] = await pool.query(query, params);

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Change a single transaction's status
exports.categorizeTransaction = async (req, res) => {
    try {
        const { transactionId, status } = req.body;
        const userId = req.userId;

        if (!['ne', 'un', 'hi'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await pool.query(
            'UPDATE transactions SET status = ? WHERE id = ? AND user_id = ?',
            [status, transactionId, userId]
        );
        res.status(200).json({ message: 'Transaction updated' });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Preview or Apply a Filter (Fixed SQL Injection vulnerability)
exports.handleFilter = async (req, res) => {
    try {
        const { field, value, action, originStatus, isPreview } = req.body;
        const userId = req.userId;

        // SECURITY FIX: Strictly allowlist the column names to prevent SQL injection
        const allowedFields = ['date', 'account', 'description', 'category', 'tags', 'amount'];
        if (!allowedFields.includes(field)) {
            return res.status(400).json({ message: 'Invalid field' });
        }

        let query, params;
        const operator = field === 'description' ? 'LIKE' : '=';
        const queryValue = field === 'description' ? `%${value}%` : value;

        if (isPreview) {
            query = `SELECT * FROM transactions WHERE user_id = ? AND status = ? AND ?? ${operator} ?`;
            params = [userId, originStatus, field, queryValue];
            const [transactions] = await pool.query(query, params);
            return res.status(200).json(transactions);
        } else {
            query = `UPDATE transactions SET status = ? WHERE user_id = ? AND status = ? AND ?? ${operator} ?`;
            params = [action, userId, originStatus, field, queryValue];
            const [result] = await pool.query(query, params);
            return res.status(200).json({ message: `Updated ${result.affectedRows} transactions` });
        }
    } catch (error) {
        console.error('Error handling filter:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
