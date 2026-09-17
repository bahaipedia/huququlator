import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';

export default function Register() {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }
        try {
            await axios.post('/auth/register', formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="form-container">
            <h1>Register</h1>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Username:</label>
                    <input type="text" onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                </div>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                </div>
                <div className="form-group">
                    <label>Confirm Password:</label>
                    <input type="password" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} required />
                </div>
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <Link to="/login">Login here</Link>.</p>
        </div>
    );
}
