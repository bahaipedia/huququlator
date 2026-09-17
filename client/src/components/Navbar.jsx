import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from '../api/axios';

export default function Navbar() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post('/auth/logout');
            setUser(null);
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <nav className="navbar">
            {user ? (
                <>
                    <span>Welcome, {user.username}</span>
                    <div className="navbar-right">
                        <Link to="/dashboard">Dashboard</Link>
                        <button onClick={handleLogout}>Log out</button>
                    </div>
                </>
            ) : (
                <>
                    <div className="navbar-left">
                        <Link to="/">Calculator</Link>
                    </div>
                    <div className="navbar-right">
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </div>
                </>
            )}
        </nav>
    );
}

