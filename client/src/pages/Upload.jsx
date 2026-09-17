import { useEffect, useState } from 'react';
import axios from '../api/axios';
import Sidebar from '../components/Sidebar';

export default function Upload() {
    const [rules, setRules] = useState([]);
    const [history, setHistory] = useState([]);
    const [selectedRules, setSelectedRules] = useState([]);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const statusLabels = { ne: 'Necessary', un: 'Unnecessary', hi: 'Hidden' };

    const fetchData = async () => {
        try {
            const response = await axios.get('/upload/data');
            setRules(response.data.rules);
            setHistory(response.data.history);
            // Default select all rules
            setSelectedRules(response.data.rules.map(r => r.id));
        } catch (err) {
            console.error('Failed to load upload data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRuleToggle = (ruleId) => {
        setSelectedRules(prev => 
            prev.includes(ruleId) ? prev.filter(id => id !== ruleId) : [...prev, ruleId]
        );
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert('Please select a file');

        setUploading(true);
        const formData = new FormData();
        formData.append('csvFile', file);
        formData.append('selectedRules', JSON.stringify(selectedRules));

        try {
            await axios.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Transactions uploaded successfully!');
            setFile(null);
            document.getElementById('csvFile').value = ''; // Reset file input
            fetchData(); // Refresh history
        } catch (err) {
            console.error(err);
            alert('Error uploading transactions.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (uploadId) => {
        if (!window.confirm('Are you sure you want to delete this upload and its transactions?')) return;
        try {
            await axios.delete(`/upload/${uploadId}`);
            fetchData();
        } catch (err) {
            console.error('Failed to delete upload', err);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content" style={{ padding: '2rem' }}>
                
                <div style={{ background: 'var(--nav-bg)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                    <h2>Upload Transactions</h2>
                    <form onSubmit={handleUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                        <input 
                            type="file" 
                            id="csvFile" 
                            accept=".csv" 
                            onChange={(e) => setFile(e.target.files[0])} 
                            required 
                        />
                        <button type="submit" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                        <small>(Limit: 5 MB)</small>
                    </form>
                    <ul style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                        <li>Expected column labels in any order: Date, Account, Description, Category, Tags, Amount</li>
                        <li>If all amounts are positive ensure a column titled "Transaction Type" has either "credit" or "debit"</li>
                    </ul>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h2>These rules will be applied to new uploads</h2>
                    {rules.length > 0 ? (
                        <table className="dashboard-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Origin</th>
                                    <th>Field</th>
                                    <th>Value</th>
                                    <th>Mark as</th>
                                    <th>Apply</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map(rule => (
                                    <tr key={rule.id}>
                                        <td>{statusLabels[rule.origin_status]}</td>
                                        <td>{rule.field}</td>
                                        <td>{rule.value}</td>
                                        <td>{statusLabels[rule.mark_as]}</td>
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedRules.includes(rule.id)}
                                                onChange={() => handleRuleToggle(rule.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No rules available to apply.</p>
                    )}
                </div>

                <div>
                    <h2>Upload History</h2>
                    <table className="dashboard-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Filename</th>
                                <th>Rows Imported</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? history.map(record => (
                                <tr key={record.id}>
                                    <td>{new Date(record.upload_date).toISOString().split('T')[0]}</td>
                                    <td>{record.filename}</td>
                                    <td>{record.rows_imported}</td>
                                    <td>{record.status}</td>
                                    <td>
                                        <button className="delete-btn" style={{ opacity: 1, float: 'none', color: 'red' }} onClick={() => handleDelete(record.id)}>Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5">No upload history available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
