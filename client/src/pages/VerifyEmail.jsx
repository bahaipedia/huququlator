import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import Sidebar from '../components/Sidebar';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('Verifying...');

    useEffect(() => {
        if (!token) {
            setStatus('Invalid verification link.');
            return;
        }

        axios.get(`/auth/verify?token=${token}`)
            .then(res => setStatus(res.data.message))
            .catch(err => setStatus(err.response?.data?.message || 'Verification failed.'));
    }, [token]);

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content" style={{ padding: '2rem' }}>
                <div className="form-container" style={{ textAlign: 'center' }}>
                    <h2>Email Verification</h2>
                    <p>{status}</p>
                    {status.includes('successfully') && (
                        <Link to="/login">
                            <button style={{ marginTop: '1rem' }}>Go to Login</button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
