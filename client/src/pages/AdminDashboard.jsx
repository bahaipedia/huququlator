import { useEffect, useState } from 'react';
import axios from '../api/axios';
import Sidebar from '../components/Sidebar';

export default function AdminDashboard() {
    const [data, setData] = useState({ stats: {}, users: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

                {/* User List Table */}
                <h2>Recent Users</h2>
                <div className="table-scroll-container">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Verified</th>
                                <th>Created</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role}</td>
                                    <td>{u.is_verified ? '✅' : '❌'}</td>
                                    <td>{new Date(u.created_at).toISOString().split('T')[0]}</td>
                                    <td>{u.last_login ? new Date(u.last_login).toISOString().split('T')[0] : 'Never'}</td>
                                    <td>
                                        {u.role !== 'admin' && (
                                            <button className="delete-btn" style={{ opacity: 1, float: 'none', color: 'red' }} onClick={() => handleDeleteUser(u.id, u.username)}>Delete</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
