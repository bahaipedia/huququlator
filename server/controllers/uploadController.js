const multer = require('multer');
const { parse } = require('fast-csv');
const fs = require('fs');
const pool = require('../config/db');

// Fetch rules and upload history for the page load
exports.getUploadPageData = async (req, res) => {
    try {
        const userId = req.userId;
        const [rules] = await pool.query('SELECT * FROM filter_rules WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        const [history] = await pool.query('SELECT * FROM upload_history WHERE user_id = ? ORDER BY upload_date DESC', [userId]);
        
        res.status(200).json({ rules, history });
    } catch (error) {
        console.error('Error fetching upload data:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Handle CSV Upload and Processing
exports.uploadTransactions = async (req, res) => {
    const userId = req.userId;
    const filePath = req.file.path;
    const filename = req.file.originalname;
    const selectedRuleIds = JSON.parse(req.body.selectedRules || '[]');
    const transactions = [];

    const columnMapping = {
        "Date": "date", "Transaction Date": "date",
        "Description": "description", "Amount": "amount",
        "Transaction Type": "transaction_type", "Category": "category",
        "Account": "account", "Account Name": "account",
        "Tags": "tags", "Labels": "tags"
    };

    try {
        // 1. Fetch selected rules
        let filterRules = [];
        if (selectedRuleIds.length > 0) {
            const placeholders = selectedRuleIds.map(() => '?').join(',');
            const [rules] = await pool.query(
                `SELECT origin_status, field, value, mark_as FROM filter_rules WHERE user_id = ? AND id IN (${placeholders})`,
                [userId, ...selectedRuleIds]
            );
            filterRules = rules;
        }

        // 2. Parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(parse({ headers: true }))
                .on('data', row => {
                    const transaction = {};
                    
                    // Map CSV fields to transaction object
                    for (const [csvColumn, field] of Object.entries(columnMapping)) {
                        if (row[csvColumn] !== undefined) transaction[field] = row[csvColumn];
                    }

                    transaction.date = new Date(transaction.date);
                    transaction.amount = parseFloat(transaction.amount?.replace(/,/g, '') || '0');

                    // Skip rows with amount = 0
                    if (transaction.amount === 0) return; 

                    // Determine transaction status
                    if (transaction.transaction_type) {
                        transaction.status = transaction.transaction_type.toLowerCase() === 'credit' ? 'hi' : 'ne';
                    } else {
                        transaction.status = transaction.amount > 0 ? 'hi' : 'ne';
                    }

                    // Apply selected filter rules
                    filterRules.forEach(rule => {
                        if (transaction.status === rule.origin_status) {
                            const fieldValue = transaction[rule.field.toLowerCase()];
                            if (fieldValue && typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(rule.value.toLowerCase())) {
                                transaction.status = rule.mark_as;
                            }
                        }
                    });

                    transactions.push([
                        userId, transaction.date, transaction.account || null, 
                        transaction.description || null, transaction.category || null, 
                        transaction.tags || null, transaction.amount, transaction.status
                    ]);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // 3. Insert Upload History
        const [uploadResult] = await pool.query(
            'INSERT INTO upload_history (user_id, filename, rows_imported, status) VALUES (?, ?, ?, ?)',
            [userId, filename, transactions.length, 'success']
        );
        const uploadId = uploadResult.insertId;

        // 4. BULK INSERT Transactions (V2 Improvement over V1)
        if (transactions.length > 0) {
            // Append uploadId to every transaction array
            transactions.forEach(t => t.push(uploadId));
            
            await pool.query(
                'INSERT INTO transactions (user_id, date, account, description, category, tags, amount, status, upload_id) VALUES ?',
                [transactions]
            );
        }

        // Cleanup
        fs.unlinkSync(filePath);
        res.status(200).json({ message: 'Transactions uploaded successfully' });

    } catch (error) {
        console.error('Error during CSV upload', error);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Cleanup on error
        
        // Log failed upload
        await pool.query(
            'INSERT INTO upload_history (user_id, filename, rows_imported, status) VALUES (?, ?, ?, "error")',
            [userId, filename, 0]
        );
        res.status(500).json({ message: 'Error uploading transactions' });
    }
};

// Delete an Upload and its Transactions
exports.deleteUpload = async (req, res) => {
    try {
        const { uploadId } = req.params;
        const userId = req.userId;

        await pool.query('DELETE FROM transactions WHERE upload_id = ? AND user_id = ?', [uploadId, userId]);
        await pool.query('DELETE FROM upload_history WHERE id = ? AND user_id = ?', [uploadId, userId]);

        res.status(200).json({ message: 'Upload deleted successfully' });
    } catch (error) {
        console.error('Error deleting upload:', error);
        res.status(500).json({ message: 'Error deleting upload' });
    }
};
