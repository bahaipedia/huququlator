import { useEffect, useState } from 'react';
import axios from '../api/axios';

export default function FilterRules() {
    const [rules, setRules] = useState([]);
    const statusLabels = { ne: 'Necessary', un: 'Unnecessary', hi: 'Hidden' };

    const fetchRules = async () => {
        try {
            const response = await axios.get('/rules');
            setRules(response.data);
        } catch (err) {
            console.error('Error fetching rules', err);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleDelete = async (ruleId) => {
        if (!window.confirm('Delete this rule?')) return;
        try {
            await axios.delete(`/rules/${ruleId}`);
            fetchRules();
        } catch (err) {
            console.error('Error deleting rule', err);
        }
    };

    return (
        <div className="app-container">
            <div className="main-content" style={{ padding: '2rem' }}>
                <h1>Categorization Rules</h1>
                
                <div className="table-scroll-container">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Origin</th>
                                <th>Field</th>
                                <th>Value</th>
                                <th>Mark as</th>
                                <th>Actions</th>
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
                                        <button className="delete-btn" style={{ opacity: 1, float: 'none', color: 'red' }} onClick={() => handleDelete(rule.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {rules.length === 0 && <tr><td colSpan="5">No rules saved.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
