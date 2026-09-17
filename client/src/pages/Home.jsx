import { useState, useEffect } from 'react';
import axios from '../api/axios';
import Sidebar from '../components/Sidebar';

export default function Home() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [a1, setA1] = useState(''); // Excess wealth
    const [a2, setA2] = useState(''); // Unnecessary expenditures
    const [a3, setA3] = useState(''); // Wealth already taxed
    const [a4, setA4] = useState(''); // Gold rate
    const [isCustomGold, setIsCustomGold] = useState(false);

    // Derived calculations
    const numA1 = parseFloat(a1) || 0;
    const numA2 = parseFloat(a2) || 0;
    const numA3 = parseFloat(a3) || 0;
    const numA4 = parseFloat(a4) || 0;

    const totalWealth = numA1 + numA2;
    const taxableWealth = totalWealth - numA3;
    
    let a5 = 0; // Units of Huquq
    let a6 = 0; // Taxable amount today
    let a7 = 0; // Huquq due
    let r7 = ''; // Final message

    if (numA4 > 0) {
        if (taxableWealth <= numA4) {
            r7 = "No Ḥuqúqu’lláh payment is due today because your excess wealth did not exceed 19 Mithqáls of gold.";
        } else {
            a5 = Math.floor(taxableWealth / numA4);
            a6 = Math.floor((a5 * numA4) * 100) / 100; // Round down to 2 decimals
            a7 = Math.ceil((a6 * 0.19) * 100) / 100; // Round up to 2 decimals
            r7 = `This year you owe $${a7.toFixed(2)} to Huququllah.`;
        }
    }

    // Fetch Gold Price
    useEffect(() => {
        const fetchGoldPrice = async () => {
            if (isCustomGold) return; // Don't overwrite if user typed a custom value
            
            try {
                const formattedDate = date.replace(/-/g, '');
                const response = await axios.get(`/gold-price?date=${formattedDate}`);
                if (response.data.value) {
                    setA4(response.data.value.toFixed(2));
                }
            } catch (err) {
                console.error('Failed to fetch gold price', err);
            }
        };
        fetchGoldPrice();
    }, [date, isCustomGold]);

    const handleCustomGoldChange = (e) => {
        setA4(e.target.value);
        setIsCustomGold(true);
    };

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content" style={{ padding: '2rem', maxWidth: '800px' }}>
                <h1>Welcome to Huququlator, a calculator for Ḥuqúqu’lláh</h1>
                <p>If you don't understand any of the fields below, visit our Help page.</p>

                <div className="form-container" style={{ maxWidth: '100%', margin: '0' }}>
                    <div className="form-group">
                        <label>Excess wealth:</label>
                        <input type="number" value={a1} onChange={e => setA1(e.target.value)} placeholder="Enter amount" />
                        <small style={{ color: 'gray', display: 'block', marginTop: '0.25rem' }}>Total assets less any debts.</small>
                    </div>

                    <div className="form-group">
                        <label>Unnecessary expenditures:</label>
                        <input type="number" value={a2} onChange={e => setA2(e.target.value)} placeholder="Enter amount" />
                        <small style={{ color: 'gray', display: 'block', marginTop: '0.25rem' }}>These are purchases or expenditures subject to Ḥuqúqu'lláh.</small>
                    </div>

                    <div className="form-group">
                        <label>Wealth Ḥuqúq has already been paid on:</label>
                        <input type="number" value={a3} onChange={e => setA3(e.target.value)} placeholder="Enter amount" />
                        <small style={{ color: 'gray', display: 'block', marginTop: '0.25rem' }}>If you only know past payments, multiply those by (100/19).</small>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Value of 19 Mithqáls of gold on: 
                            <input type="date" value={date} onChange={e => { setDate(e.target.value); setIsCustomGold(false); }} style={{ width: 'auto', padding: '0.2rem' }} />
                        </label>
                        <input type="number" value={a4} onChange={handleCustomGoldChange} />
                        <small style={{ color: 'gray', display: 'block', marginTop: '0.25rem' }}>{date}'s gold rate multiplied by 2.22456.</small>
                    </div>

                    <div className="form-group">
                        <label>Payment due on the following units of Ḥuqúq:</label>
                        <input type="number" value={a5 || ''} readOnly style={{ backgroundColor: 'var(--nav-bg)' }} />
                        <small style={{ color: 'gray', display: 'block', marginTop: '0.25rem' }}>
                            {numA4 > 0 && taxableWealth > numA4 
                                ? `We rounded down from ${(taxableWealth / numA4).toFixed(2)} because payments are only due on whole units of Huquq.` 
                                : 'Payments are only due on whole units of Huquq.'}
                        </small>
                    </div>

                    <div className="form-group">
                        <label>The amount of wealth you are paying Ḥuqúq on today:</label>
                        <input type="number" value={a6 || ''} readOnly style={{ backgroundColor: 'var(--nav-bg)' }} />
                        <small style={{ color: 'gray', display: 'block', marginTop: '0.25rem' }}>Today's gold rate multiplied by full units of Ḥuqúq.</small>
                    </div>

                    <div className="form-group">
                        <label>19% of the above:</label>
                        <input type="number" value={a7 || ''} readOnly style={{ backgroundColor: 'var(--nav-bg)' }} />
                        <small style={{ color: 'gray', display: 'block', marginTop: '0.25rem' }}>Ḥuqúqu'lláh is a 19% tax on the wealth listed above.</small>
                    </div>

                    <div className="form-group" style={{ marginTop: '2rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--link-color)' }}>
                        {r7}
                    </div>
                </div>
                
                <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'gray' }}>
                    <p>You can host a local copy of this website, view the source code and instructions on <a href="https://github.com/bahaipedia/huququlator" target="_blank" rel="noreferrer">Github</a>.</p>
                </div>
            </div>
        </div>
    );
}
