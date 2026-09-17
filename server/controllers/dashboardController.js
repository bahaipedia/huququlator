const pool = require('../config/db');
const goldService = require('../services/goldService');

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch labels
        const [labels] = await pool.query(
            `SELECT id, category, label FROM financial_labels WHERE user_id = ? ORDER BY category ASC, label ASC`,
            [userId]
        );

        // Fetch entries
        const [entries] = await pool.query(
            `SELECT fv.id, fv.label_id, DATE_FORMAT(fv.reporting_date, '%Y-%m-%d') AS reporting_date, fv.value, fl.category, fl.label
             FROM financial_entries fv
             JOIN financial_labels fl ON fv.label_id = fl.id
             WHERE fv.user_id = ?
             ORDER BY fv.reporting_date ASC, fl.category ASC, fl.label ASC`,
            [userId]
        );

        // Fetch summaries
        const [summaries] = await pool.query(
            `SELECT id, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, 
             total_assets, total_debts, unnecessary_expenses, wealth_already_taxed, gold_rate, huquq_payments_made 
             FROM financial_summary WHERE user_id = ? ORDER BY end_date ASC`,
            [userId]
        );

        // In v1, the backend formatted the entryMap. In v2, we send raw data and let React handle the UI logic.
        res.status(200).json({ labels, entries, summaries });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Server Error loading dashboard' });
    }
};

// Update a specific cell value
exports.updateEntry = async (req, res) => {
    try {
        const { labelId } = req.params;
        let { value, reporting_date } = req.body;
        const userId = req.userId;

        value = Math.abs(parseFloat(value)) || 0;

        const [result] = await pool.query(
            `UPDATE financial_entries SET value = ? WHERE label_id = ? AND reporting_date = ? AND user_id = ?`,
            [value, labelId, reporting_date, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        res.status(200).json({ message: 'Value updated' });
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Add a new row (Label)
exports.addLabel = async (req, res) => {
    try {
        const { category, label } = req.body;
        const userId = req.userId;

        // Insert new label
        const [result] = await pool.query(
            `INSERT INTO financial_labels (user_id, category, label) VALUES (?, ?, ?)`,
            [userId, category, label]
        );
        const labelId = result.insertId;

        // Fetch existing dates to create 0.00 entries for this new label
        const [dates] = await pool.query(`SELECT DISTINCT reporting_date FROM financial_entries WHERE user_id = ?`, [userId]);
        
        if (dates.length > 0) {
            const entries = dates.map(d => [userId, labelId, d.reporting_date, 0.00]);
            await pool.query(
                `INSERT INTO financial_entries (user_id, label_id, reporting_date, value) VALUES ?`,
                [entries]
            );
        }

        res.status(201).json({ labelId, message: 'Label added' });
    } catch (error) {
        console.error('Error adding label:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete a row (Label)
exports.deleteLabel = async (req, res) => {
    try {
        const { labelId } = req.params;
        const userId = req.userId;

        await pool.query(`DELETE FROM financial_entries WHERE label_id = ? AND user_id = ?`, [labelId, userId]);
        await pool.query(`DELETE FROM financial_labels WHERE id = ? AND user_id = ?`, [labelId, userId]);

        res.status(200).json({ message: 'Label deleted' });
    } catch (error) {
        console.error('Error deleting label:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Add a new Year (Reporting Period)
exports.addYear = async (req, res) => {
    try {
        const { end_date } = req.body;
        const userId = req.userId;

        // Fetch gold rate using our new service
        const isFutureDate = end_date > new Date().toISOString().split('T')[0];
        const goldRate = isFutureDate ? 0.00 : await goldService.getGoldPrice(end_date);

        // Fetch previous summary to carry over chained values
        const [prevSummary] = await pool.query(
            'SELECT wealth_already_taxed, huquq_payments_made FROM financial_summary WHERE user_id = ? ORDER BY end_date DESC LIMIT 1',
            [userId]
        );

        let updatedWealthTaxed = 0;
        if (prevSummary.length > 0) {
            const prevWealth = parseFloat(prevSummary[0].wealth_already_taxed) || 0;
            const prevHuquq = parseFloat(prevSummary[0].huquq_payments_made) || 0;
            updatedWealthTaxed = prevWealth + (prevHuquq * (100 / 19));
        }

        await pool.query(
            `INSERT INTO financial_summary (user_id, end_date, wealth_already_taxed, gold_rate) VALUES (?, ?, ?, ?)`,
            [userId, end_date, updatedWealthTaxed, goldRate]
        );

        const [labels] = await pool.query(`SELECT id FROM financial_labels WHERE user_id = ?`, [userId]);
        if (labels.length > 0) {
            const entries = labels.map(l => [userId, l.id, end_date, 0.00]);
            await pool.query(`INSERT INTO financial_entries (user_id, label_id, reporting_date, value) VALUES ?`, [entries]);
        }

        res.status(201).json({ message: 'Year added' });
    } catch (error) {
        console.error('Error adding year:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete a Year
exports.deleteYear = async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.userId;

        await pool.query(`DELETE FROM financial_entries WHERE reporting_date = ? AND user_id = ?`, [date, userId]);
        await pool.query(`DELETE FROM financial_summary WHERE end_date = ? AND user_id = ?`, [date, userId]);

        res.status(200).json({ message: 'Year deleted' });
    } catch (error) {
        console.error('Error deleting year:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update a Summary Field & Trigger Chained Math
exports.updateSummaryField = async (req, res) => {
    try {
        const { date } = req.params;
        const { field, value } = req.body; 
        const userId = req.userId;
        const safeValue = Math.abs(parseFloat(value)) || 0;

        // Ensure only allowed columns are updated to prevent SQL injection
        if (!['wealth_already_taxed', 'huquq_payments_made'].includes(field)) {
            return res.status(400).json({ message: 'Invalid field' });
        }

        // 1. Update the specific year
        await pool.query(
            `UPDATE financial_summary SET ?? = ? WHERE end_date = ? AND user_id = ?`,
            [field, safeValue, date, userId]
        );

        // 2. Recalculate the chain for all subsequent years
        const [allYears] = await pool.query(
            `SELECT id, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date, wealth_already_taxed, huquq_payments_made 
             FROM financial_summary WHERE user_id = ? ORDER BY end_date ASC`,
            [userId]
        );

        const updatedYearIndex = allYears.findIndex(y => y.end_date === date);
        
        if (updatedYearIndex !== -1) {
            const updatePromises = [];
            
            // If updating wealth_taxed, recalculate from the NEXT year onward.
            // If updating huquq_payments, recalculate from the NEXT year onward (based on your V1 logic).
            for (let i = updatedYearIndex + 1; i < allYears.length; i++) {
                const prevYear = allYears[i - 1];
                const currentYear = allYears[i];

                const prevWealth = parseFloat(prevYear.wealth_already_taxed) || 0;
                const prevHuquq = parseFloat(prevYear.huquq_payments_made) || 0;
                
                const recalculatedWealth = parseFloat((prevWealth + (prevHuquq * (100 / 19))).toFixed(2));
                currentYear.wealth_already_taxed = recalculatedWealth;

                updatePromises.push(pool.query(
                    `UPDATE financial_summary SET wealth_already_taxed = ? WHERE id = ?`,
                    [recalculatedWealth, currentYear.id]
                ));
            }
            await Promise.all(updatePromises);
        }

        res.status(200).json({ message: 'Summary updated and chain recalculated' });
    } catch (error) {
        console.error('Error updating summary:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
