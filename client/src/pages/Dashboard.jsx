import { useEffect, useState } from 'react';
import axios from '../api/axios';
import '../styles/dashboard.css';

export default function Dashboard() {
    const [data, setData] = useState({ labels: [], entries: [], summaries: [] });
    const [loading, setLoading] = useState(true);
    const [newLabel, setNewLabel] = useState('');

    const fetchData = async () => {
        try {
            const response = await axios.get('/dashboard');
            setData(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- ROW & CELL MANAGEMENT ---
    const handleCellChange = (labelId, date, newValue) => {
        const updatedEntries = data.entries.map(entry => 
            entry.label_id === labelId && entry.reporting_date === date 
                ? { ...entry, value: newValue } 
                : entry
        );
        setData({ ...data, entries: updatedEntries });
    };

    const handleCellBlur = async (labelId, date, value) => {
        try {
            await axios.put(`/dashboard/entry/${labelId}`, { value, reporting_date: date });
        } catch (err) {
            console.error('Failed to save cell', err);
            fetchData();
        }
    };

    const handleAddLabel = async (category) => {
        if (!newLabel.trim()) return;
        try {
            await axios.post('/dashboard/label', { category, label: newLabel });
            setNewLabel('');
            fetchData();
        } catch (err) {
            console.error('Failed to add label', err);
        }
    };

    const handleDeleteLabel = async (labelId) => {
        if (!window.confirm('Delete this item and all its history?')) return;
        try {
            await axios.delete(`/dashboard/label/${labelId}`);
            fetchData();
        } catch (err) {
            console.error('Failed to delete label', err);
        }
    };

    // --- YEAR (COLUMN) MANAGEMENT ---
    const handleAddYear = async () => {
        const date = window.prompt('Enter the end date for the new reporting period (YYYY-MM-DD):');
        if (!date) return;
        try {
            await axios.post('/dashboard/year', { end_date: date });
            fetchData();
        } catch (err) {
            console.error('Failed to add year', err);
            alert('Error adding year. Ensure format is YYYY-MM-DD.');
        }
    };

    const handleDeleteYear = async (date) => {
        if (!window.confirm(`Are you sure you want to delete the year ${date}?`)) return;
        try {
            await axios.delete(`/dashboard/year/${date}`);
            fetchData();
        } catch (err) {
            console.error('Failed to delete year', err);
        }
    };

    // --- SUMMARY MANAGEMENT ---
    const handleSummaryChange = (date, field, newValue) => {
        const updatedSummaries = data.summaries.map(s => 
            s.end_date === date ? { ...s, [field]: newValue } : s
        );
        setData({ ...data, summaries: updatedSummaries });
    };

    const handleSummaryBlur = async (date, field, value) => {
        try {
            await axios.put(`/dashboard/summary/${date}`, { field, value });
        } catch (err) {
            console.error('Failed to save summary', err);
            fetchData();
        }
    };

    // --- DYNAMIC MATH CALCULATIONS ---
    const getColumnTotal = (date, category) => {
        const labelIds = data.labels.filter(l => l.category === category).map(l => l.id);
        const total = data.entries
            .filter(e => e.reporting_date === date && labelIds.includes(e.label_id))
            .reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0);
        return total;
    };

    // --- RENDERING HELPERS ---
    const renderCategoryRows = (category) => {
        const categoryLabels = data.labels.filter(l => l.category === category);
        return (
            <>
                <tr className="section-row">
                    <td colSpan={data.summaries.length + 1} className="section-title">{category}</td>
                </tr>
                {categoryLabels.map(label => (
                    <tr key={label.id}>
                        <td>
                            {label.label}
                            <button className="delete-btn" title="Delete Row" onClick={() => handleDeleteLabel(label.id)}>🗑️</button>
                        </td>
                        {data.summaries.map(summary => {
                            const entry = data.entries.find(e => e.label_id === label.id && e.reporting_date === summary.end_date);
                            const val = entry ? entry.value : '0.00';
                            return (
                                <td key={`${label.id}-${summary.end_date}`}>
                                    <input 
                                        type="number" 
                                        className="cell-input"
                                        value={val}
                                        onChange={(e) => handleCellChange(label.id, summary.end_date, e.target.value)}
                                        onBlur={(e) => handleCellBlur(label.id, summary.end_date, e.target.value)}
                                    />
                                </td>
                            );
                        })}
                    </tr>
                ))}
                <tr>
                    <td>
                        <div className="add-row-form">
                            <input 
                                type="text" 
                                placeholder={`New ${category} name...`} 
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel(category)}
                            />
                            <button onClick={() => handleAddLabel(category)}>+</button>
                        </div>
                    </td>
                    <td colSpan={data.summaries.length}></td>
                </tr>
            </>
        );
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="dashboard-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Financial Dashboard</h1>
                <button onClick={handleAddYear} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>+ Add Year</button>
            </div>
            
            <div className="table-scroll-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>Accounts</th>
                            {data.summaries.map(summary => (
                                <th key={summary.end_date}>
                                    {summary.end_date}
                                    <button className="delete-btn" title="Delete Year" onClick={() => handleDeleteYear(summary.end_date)}>🗑️</button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderCategoryRows('Assets')}
                        {renderCategoryRows('Debts')}
                        {renderCategoryRows('Expenses')}

                        {/* --- SUMMARY SECTION --- */}
                        <tr className="section-row">
                            <td colSpan={data.summaries.length + 1} className="section-title" style={{ marginTop: '2rem' }}>Summary</td>
                        </tr>
                        
                        {/* Dynamic Totals */}
                        <tr>
                            <td>Total Assets:</td>
                            {data.summaries.map(s => <td key={s.end_date}>{getColumnTotal(s.end_date, 'Assets').toFixed(2)}</td>)}
                        </tr>
                        <tr>
                            <td>Total Debts:</td>
                            {data.summaries.map(s => <td key={s.end_date}>({getColumnTotal(s.end_date, 'Debts').toFixed(2)})</td>)}
                        </tr>
                        <tr>
                            <td>Unnecessary Expenses:</td>
                            {data.summaries.map(s => <td key={s.end_date}>{getColumnTotal(s.end_date, 'Expenses').toFixed(2)}</td>)}
                        </tr>

                        {/* Manual Inputs */}
                        <tr>
                            <td>Wealth previously taxed:</td>
                            {data.summaries.map((s, index) => (
                                <td key={s.end_date}>
                                    <input 
                                        type="number" 
                                        className="cell-input"
                                        value={s.wealth_already_taxed || '0.00'}
                                        disabled={index !== 0} // Only editable in Year 1 like V1
                                        onChange={(e) => handleSummaryChange(s.end_date, 'wealth_already_taxed', e.target.value)}
                                        onBlur={(e) => handleSummaryBlur(s.end_date, 'wealth_already_taxed', e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>

                        {/* Math Rows */}
                        <tr>
                            <td>Wealth being taxed today:</td>
                            {data.summaries.map(s => {
                                const taxable = getColumnTotal(s.end_date, 'Assets') - getColumnTotal(s.end_date, 'Debts') + getColumnTotal(s.end_date, 'Expenses') - (parseFloat(s.wealth_already_taxed) || 0);
                                return <td key={s.end_date}>{taxable.toFixed(2)}</td>;
                            })}
                        </tr>
                        <tr>
                            <td>Gold Rate:</td>
                            {data.summaries.map(s => <td key={s.end_date}>{parseFloat(s.gold_rate || 0).toFixed(2)}</td>)}
                        </tr>
                        
                        {/* Huquq Calculations */}
                        <tr>
                            <td>Units of Huquq:</td>
                            {data.summaries.map(s => {
                                const taxable = getColumnTotal(s.end_date, 'Assets') - getColumnTotal(s.end_date, 'Debts') + getColumnTotal(s.end_date, 'Expenses') - (parseFloat(s.wealth_already_taxed) || 0);
                                const rate = parseFloat(s.gold_rate) || 1; // prevent divide by zero visually
                                const units = rate > 0 ? (taxable / rate) : 0;
                                return <td key={s.end_date}>{units.toFixed(2)}</td>;
                            })}
                        </tr>
                        <tr>
                            <td>Rounded Units:</td>
                            {data.summaries.map(s => {
                                const taxable = getColumnTotal(s.end_date, 'Assets') - getColumnTotal(s.end_date, 'Debts') + getColumnTotal(s.end_date, 'Expenses') - (parseFloat(s.wealth_already_taxed) || 0);
                                const rate = parseFloat(s.gold_rate) || 1;
                                const rounded = rate > 0 ? Math.floor(taxable / rate) : 0;
                                return <td key={s.end_date}>{rounded}</td>;
                            })}
                        </tr>
                        <tr>
                            <td>Huquq Payment Owed:</td>
                            {data.summaries.map(s => {
                                const taxable = getColumnTotal(s.end_date, 'Assets') - getColumnTotal(s.end_date, 'Debts') + getColumnTotal(s.end_date, 'Expenses') - (parseFloat(s.wealth_already_taxed) || 0);
                                const rate = parseFloat(s.gold_rate) || 1;
                                const owed = rate > 0 ? (0.19 * Math.floor(taxable / rate) * rate) : 0;
                                return <td key={s.end_date}>{owed.toFixed(2)}</td>;
                            })}
                        </tr>

                        {/* Payments Made (Manual Input) */}
                        <tr>
                            <td>Huquq Payments Made:</td>
                            {data.summaries.map(s => (
                                <td key={s.end_date}>
                                    <input 
                                        type="number" 
                                        className="cell-input"
                                        value={s.huquq_payments_made || '0.00'}
                                        onChange={(e) => handleSummaryChange(s.end_date, 'huquq_payments_made', e.target.value)}
                                        onBlur={(e) => handleSummaryBlur(s.end_date, 'huquq_payments_made', e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>

                        {/* Remainder Due */}
                        <tr>
                            <td>Remainder Due:</td>
                            {data.summaries.map(s => {
                                const taxable = getColumnTotal(s.end_date, 'Assets') - getColumnTotal(s.end_date, 'Debts') + getColumnTotal(s.end_date, 'Expenses') - (parseFloat(s.wealth_already_taxed) || 0);
                                const rate = parseFloat(s.gold_rate) || 1;
                                const owed = rate > 0 ? (0.19 * Math.floor(taxable / rate) * rate) : 0;
                                const paid = parseFloat(s.huquq_payments_made) || 0;
                                return <td key={s.end_date}>{(owed - paid).toFixed(2)}</td>;
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
