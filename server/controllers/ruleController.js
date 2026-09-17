const pool = require('../config/db');

exports.getRules = async (req, res) => {
    try {
        const [rules] = await pool.query('SELECT * FROM filter_rules WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
        res.status(200).json(rules);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createRule = async (req, res) => {
    try {
        const { field, value, action, originStatus } = req.body;
        await pool.query(
            'INSERT INTO filter_rules (user_id, field, value, origin_status, mark_as) VALUES (?, ?, ?, ?, ?)',
            [req.userId, field, value, originStatus, action]
        );
        res.status(201).json({ message: 'Rule saved' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteRule = async (req, res) => {
    try {
        await pool.query('DELETE FROM filter_rules WHERE id = ? AND user_id = ?', [req.params.ruleId, req.userId]);
        res.status(200).json({ message: 'Rule deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
