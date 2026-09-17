import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';

export default function Sidebar() {
    const { user, setUser } = useContext(AuthContext);

    const handleLogout = async () => {
        try {
            await axios.post('/auth/logout');
            setUser(null);
            window.location.href = '/login'; // Force redirect
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    if (!user) return null;

    return (
        <div className="sidebar">
            <h3>Navigation</h3>
            <ul>
                {user.role === 'admin' && <li><Link to="/admin" style={{ color: 'orange', fontWeight: 'bold' }}>Admin Panel</Link></li>}
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/upload">Upload Transactions</Link></li>
                <li><Link to="/filter-rules">Categorization rules</Link></li>
                <li><Link to="/transactions">View Transactions</Link></li>
                <li><button onClick={handleLogout} className="sidebar-logout">Logout</button></li>
            </ul>
        </div>
    );
}
