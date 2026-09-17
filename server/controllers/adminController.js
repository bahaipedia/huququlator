const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        // Run multiple queries concurrently for speed
        const [
            [totalUsers], [unverifiedUsers], [activeUsers], 
            [totalTransactions], [totalRules], [failedUploads]
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM users'),
            pool.query('SELECT COUNT(*) as count FROM users WHERE is_verified = FALSE'),
            pool.query('SELECT COUNT(*) as count FROM users WHERE last_login > NOW() - INTERVAL 30 DAY'),
            pool.query('SELECT COUNT(*) as count FROM transactions'),
            pool.query('SELECT COUNT(*) as count FROM filter_rules'),
            pool.query('SELECT COUNT(*) as count FROM upload_history WHERE status = "error"')
        ]);

        // Fetch recent users
        const [usersList] = await pool.query(
            'SELECT id, username, email, role, is_verified, created_at, last_login FROM users ORDER BY created_at DESC LIMIT 50'
        );

        res.status(200).json({
            stats: {
                totalUsers: totalUsers[0].count,
                unverifiedUsers: unverifiedUsers[0].count,
                activeUsers: activeUsers[0].count,
                totalTransactions: totalTransactions[0].count,
                totalRules: totalRules[0].count,
                failedUploads: failedUploads[0].count
            },
            users: usersList
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Server Error loading admin stats' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Cascade delete will happen if you have foreign keys set up, 
        // otherwise we manually delete their data first to keep the DB clean.
        await pool.query('DELETE FROM transactions WHERE user_id = ?', [id]);
        await pool.query('DELETE FROM filter_rules WHERE user_id = ?', [id]);
        await pool.query('DELETE FROM upload_history WHERE user_id = ?', [id]);
        await pool.query('DELETE FROM financial_entries WHERE user_id = ?', [id]);
        await pool.query('DELETE FROM financial_summary WHERE user_id = ?', [id]);
        await pool.query('DELETE FROM financial_labels WHERE user_id = ?', [id]);
        
        await pool.query('DELETE FROM users WHERE id = ?', [id]);

        res.status(200).json({ message: 'User and all associated data deleted.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server Error deleting user' });
    }
};
