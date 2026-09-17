const pool = require('../config/db');
const jwt = require('jsonwebtoken');

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

        // Fetch users with their transaction, rule, and dashboard counts
        const [usersList] = await pool.query(`
            SELECT 
                u.id, u.username, u.email, u.role, u.is_verified, u.created_at, u.last_login,
                (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) as transaction_count,
                (SELECT COUNT(*) FROM filter_rules fr WHERE fr.user_id = u.id) as rule_count,
                (SELECT COUNT(*) FROM financial_summary fs WHERE fs.user_id = u.id) as dashboard_count
            FROM users u 
            ORDER BY u.created_at DESC
        `);

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

// Debug on behalf of a user
exports.impersonateUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Fetch the target user
        const [rows] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const targetUser = rows[0];

        // Generate a new token for the TARGET user
        const token = jwt.sign(
            { id: targetUser.id, username: targetUser.username, role: targetUser.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '12h' }
        );

        // Overwrite the admin's cookie with the target user's cookie
        res.cookie('token', token, { 
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', maxAge: 12 * 3600000
        });

        res.status(200).json({ message: 'Impersonation successful', user: targetUser });
    } catch (error) {
        console.error('Impersonation error:', error);
        res.status(500).json({ message: 'Server Error during impersonation' });
    }
};
