import { useEffect, useState, useMemo } from 'react';
import axios from '../api/axios';
import Sidebar from '../components/Sidebar';

export default function AdminDashboard() {
    const [data, setData] = useState({ stats: {}, users: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Search and Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    const fetchAdminData = async () => {
        try {
            const response = await axios.get('/admin/stats');
            setData(response.data);
        } catch (err) {
            setError('Failed to load admin data. Are you an admin?');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleDeleteUser = async (id, username) => {
        if (!window.confirm(`WARNING: This will permanently delete ${username} and ALL their financial data. Proceed?`)) return;
        try {
            await axios.delete(`/admin/user/${id}`);
            fetchAdminData();
        } catch (err) {
            alert('Error deleting user');
        }
    };

    // --- SORTING LOGIC ---
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // --- FILTERING & SORTING EXECUTION ---
    // useMemo ensures we only recalculate this when data, search, or sort changes (performance boost)
    const processedUsers = useMemo(() => {
        // 1. Filter
        const filtered = data.users.filter(u => 
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // 2. Sort
        return filtered.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            // Handle nulls (like last_login)
            if (aVal === null) aVal = '';
            if (bVal === null) bVal = '';

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data.users, searchTerm, sortConfig]);

    // Helper for table headers
    const getSortIndicator = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
        }
        return '';
    };

    if (loading) return <div>Loading Admin Panel...</div>;
    if (error) return <div style={{ color: 'red', padding: '2rem' }}>{error}</div>;

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content" style={{ padding: '2rem' }}>
                <h1>Admin Dashboard</h1>
                
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--nav-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h3>Total Users</h3>
                        <p style={{ fontSize: '2rem', margin: '0' }}>{data.stats.totalUsers}</p>
                    </div>
                    <div style={{ background: 'var(--nav-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h3>Active (30 Days)</h3>
                        <p style={{ fontSize: '2rem', margin: '0' }}>{data.stats.activeUsers}</p>
                    </div>
                    <div style={{ background: 'var(--nav-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h3>Unverified Bots</h3>
                        <p style={{ fontSize: '2rem', margin: '0', color: data.stats.unverifiedUsers > 0 ? 'orange' : 'inherit' }}>{data.stats.unverifiedUsers}</p>
                    </div>
                    <div style={{ background: 'var(--nav-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h3>Total Transactions</h3>
                        <p style={{ fontSize: '2rem', margin: '0' }}>{data.stats.totalTransactions}</p>
                    </div>
                    <div style={{ background: 'var(--nav-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h3>Failed Uploads</h3>
                        <p style={{ fontSize: '2rem', margin: '0', color: data.stats.failedUploads > 0 ? 'red' : 'inherit' }}>{data.stats.failedUploads}</p>
                    </div>
                </div>

                {/* User List Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>User Management ({processedUsers.length})</h2>
                    <input 
                        type="text" 
                        placeholder="Search username or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    />
                </div>

                {/* User List Table */}
                <div className="table-scroll-container">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('username')} style={{ cursor: 'pointer' }}>
                                    Username{getSortIndicator('username')}
                                </th>
                                <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                                    Email{getSortIndicator('email')}
                                </th>
                                <th onClick={() => handleSort('role')} style={{ cursor: 'pointer' }}>
                                    Role{getSortIndicator('role')}
                                </th>
                                <th onClick={() => handleSort('is_verified')} style={{ cursor: 'pointer' }}>
                                    Verified{getSortIndicator('is_verified')}
                                </th>
                                <th onClick={() => handleSort('dashboard_count')} style={{ cursor: 'pointer' }}>
                                    Dashboard{getSortIndicator('dashboard_count')}
                                </th>
                                <th onClick={() => handleSort('transaction_count')} style={{ cursor: 'pointer' }}>
                                    Transactions{getSortIndicator('transaction_count')}
                                </th>
                                <th onClick={() => handleSort('rule_count')} style={{ cursor: 'pointer' }}>
                                    Rules{getSortIndicator('rule_count')}
                                </th>
                                <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
                                    Created{getSortIndicator('created_at')}
                                </th>
                                <th onClick={() => handleSort('last_login')} style={{ cursor: 'pointer' }}>
                                    Last Login{getSortIndicator('last_login')}
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedUsers.map(u => (
                                <tr key={u.id}>
                                    <td>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role === 'admin' ? <strong style={{color: 'orange'}}>Admin</strong> : 'User'}</td>
                                    <td>{u.is_verified ? '✅' : '❌'}</td>
                                    <td>
                                        <span style={{ color: u.dashboard_count > 0 ? 'var(--link-color)' : 'inherit', fontWeight: u.dashboard_count > 0 ? 'bold' : 'normal' }}>
                                            {u.dashboard_count}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: u.transaction_count > 0 ? 'var(--link-color)' : 'inherit', fontWeight: u.transaction_count > 0 ? 'bold' : 'normal' }}>
                                            {u.transaction_count}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: u.rule_count > 0 ? 'var(--link-color)' : 'inherit', fontWeight: u.rule_count > 0 ? 'bold' : 'normal' }}>
                                            {u.rule_count}
                                        </span>
                                    </td>
                                    <td>{new Date(u.created_at).toISOString().split('T')[0]}</td>
                                    <td>{u.last_login ? new Date(u.last_login).toISOString().split('T')[0] : 'Never'}</td>
                                    <td>
                                        {u.role !== 'admin' && (
                                            <button className="delete-btn" style={{ opacity: 1, float: 'none', color: 'red', cursor: 'pointer' }} onClick={() => handleDeleteUser(u.id, u.username)}>Delete</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {processedUsers.length === 0 && (
                                <tr>
                                    <td colSpan="10" style={{ textAlign: 'center' }}>No users found matching "{searchTerm}"</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
