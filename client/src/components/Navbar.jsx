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
            <div className="navbar-left">
                <Link to="/">Calculator</Link>
                <Link to="/about">About</Link>
                <Link to="/help">Help</Link>
            </div>
            <div className="navbar-right">
                {user ? (
                    <>
                        <span>Welcome, {user.username}</span>
                        <Link to="/dashboard">Dashboard</Link>
                        <button onClick={handleLogout}>Log out</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
