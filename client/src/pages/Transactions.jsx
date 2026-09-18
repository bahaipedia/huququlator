import { useEffect, useState } from 'react';
import axios from '../api/axios';

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState('ne'); // 'ne', 'un', 'hi'
    const [dates, setDates] = useState({ start: '', end: '' });
    
    // Filter State
    const [filter, setFilter] = useState({ field: 'category', value: '', action: 'un' });
    const [isPreview, setIsPreview] = useState(false);

    const fetchTransactions = async () => {
        try {
            let url = `/transactions?status=${activeTab}`;
            if (dates.start && dates.end) {
                url += `&startDate=${dates.start}&endDate=${dates.end}`;
            }
            const response = await axios.get(url);
            setTransactions(response.data);
            setIsPreview(false);
        } catch (err) {
            console.error('Error fetching transactions', err);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [activeTab, dates]); // Auto-fetch when tab or dates change

    const handleCategorize = async (transactionId, newStatus) => {
        try {
            await axios.put('/transactions/categorize', { transactionId, status: newStatus });
            if (isPreview) handlePreview(); // refresh preview
            else fetchTransactions(); // refresh normal list
        } catch (err) {
            console.error('Error categorizing', err);
        }
    };

    const handlePreview = async () => {
        if (!filter.value) return alert('Enter a value to filter by');
        try {
            const response = await axios.post('/transactions/filter', {
                ...filter, originStatus: activeTab, isPreview: true
            });
            setTransactions(response.data);
            setIsPreview(true);
        } catch (err) {
            console.error('Preview error', err);
        }
    };

    const handleApplyFilter = async (createRule = false) => {
        if (!filter.value) return alert('Enter a value to filter by');
        try {
            await axios.post('/transactions/filter', {
                ...filter, originStatus: activeTab, isPreview: false
            });
            if (createRule) {
                await axios.post('/rules', { ...filter, originStatus: activeTab });
                alert('Filter applied and rule saved!');
            } else {
                alert('Filter applied!');
            }
            setFilter({ ...filter, value: '' });
            fetchTransactions();
        } catch (err) {
            console.error('Apply error', err);
        }
    };

    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    return (
        <div className="app-container">
            <div className="main-content" style={{ padding: '2rem' }}>
                <h1>Transactions</h1>

                <div className="filter-bar">
                    <label>Start Date:</label>
                    <input type="date" value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} />
                    <label>End Date:</label>
                    <input type="date" value={dates.end} onChange={e => setDates({...dates, end: e.target.value})} />
                    <button onClick={() => setDates({start: '', end: ''})}>Clear Dates</button>
                </div>

                <div className="tab-container">
                    <button className={`tab ${activeTab === 'ne' ? 'active' : ''}`} onClick={() => setActiveTab('ne')}>Necessary</button>
                    <button className={`tab ${activeTab === 'un' ? 'active' : ''}`} onClick={() => setActiveTab('un')}>Unnecessary</button>
                    <button className={`tab ${activeTab === 'hi' ? 'active' : ''}`} onClick={() => setActiveTab('hi')}>Hidden</button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <strong>Count:</strong> {transactions.length} | <strong>Total:</strong> ${totalAmount.toFixed(2)}
                </div>

                <div className="filter-bar">
                    <span>Mark all matching</span>
                    <select value={filter.field} onChange={e => setFilter({...filter, field: e.target.value})}>
                        <option value="date">Date</option>
                        <option value="account">Account</option>
                        <option value="description">Description</option>
                        <option value="category">Category</option>
                        <option value="tags">Tags</option>
                        <option value="amount">Amount</option>
                    </select>
                    <input type="text" placeholder="Value..." value={filter.value} onChange={e => setFilter({...filter, value: e.target.value})} />
                    <span>as</span>
                    <select value={filter.action} onChange={e => setFilter({...filter, action: e.target.value})}>
                        <option value="ne">Necessary</option>
                        <option value="un">Unnecessary</option>
                        <option value="hi">Hidden</option>
                    </select>
                    
                    {!isPreview ? (
                        <button onClick={handlePreview}>Preview</button>
                    ) : (
                        <button onClick={fetchTransactions} style={{ background: 'gray' }}>Cancel Preview</button>
                    )}
                    <button onClick={() => handleApplyFilter(false)}>Apply</button>
                    <button onClick={() => handleApplyFilter(true)}>Apply & Create Rule</button>
                </div>

                <div className="table-scroll-container">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Account</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Tags</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id}>
                                    <td>{new Date(t.date).toISOString().split('T')[0]}</td>
                                    <td>{t.account}</td>
                                    <td>{t.description}</td>
                                    <td>{t.category}</td>
                                    <td>{t.tags}</td>
                                    <td>{t.amount}</td>
                                    <td>
                                        {activeTab !== 'ne' && <button onClick={() => handleCategorize(t.id, 'ne')}>Necessary</button>}
                                        {activeTab !== 'un' && <button onClick={() => handleCategorize(t.id, 'un')}>Unnecessary</button>}
                                        {activeTab !== 'hi' && <button onClick={() => handleCategorize(t.id, 'hi')}>Hidden</button>}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && <tr><td colSpan="7">No transactions found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
