import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
    const { user } = useContext(AuthContext);
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
    let hasCalculated = false;

    if (numA4 > 0) {
        if (taxableWealth <= numA4) {
            r7 = "No Ḥuqúqu’lláh payment is due today because your excess wealth did not exceed 19 Mithqáls of gold.";
        } else {
            a5 = Math.floor(taxableWealth / numA4);
            a6 = Math.floor((a5 * numA4) * 100) / 100; // Round down to 2 decimals
            a7 = Math.ceil((a6 * 0.19) * 100) / 100; // Round up to 2 decimals
            r7 = `This year you owe $${a7.toFixed(2)} to Huququllah.`;
            hasCalculated = true; // Trigger CTA
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
        <div className="home-container">
            <section className="hero-section">
                <div className="hero-text">
                    <h1>Welcome to Huququlator</h1>
                    <p>A simple, private calculator for Ḥuqúqu’lláh. If you don't understand any of the fields below, visit our <Link to="/help">Help page</Link>.</p>
                </div>

                <div className="calculator-card">
                    <div className="form-group">
                        <label>Excess wealth:</label>
                        <input type="number" value={a1} onChange={e => setA1(e.target.value)} placeholder="Enter amount" />
                        <small className="help-text">Total assets less any debts.</small>
                    </div>

                    <div className="form-group">
                        <label>Unnecessary expenditures:</label>
                        <input type="number" value={a2} onChange={e => setA2(e.target.value)} placeholder="Enter amount" />
                        <small className="help-text">These are purchases or expenditures subject to Ḥuqúqu'lláh.</small>
                    </div>

                    <div className="form-group">
                        <label>Wealth Ḥuqúq has already been paid on:</label>
                        <input type="number" value={a3} onChange={e => setA3(e.target.value)} placeholder="Enter amount" />
                        <small className="help-text">If you only know past payments, multiply those by (100/19).</small>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Value of 19 Mithqáls of gold on: 
                            <input type="date" value={date} onChange={e => { setDate(e.target.value); setIsCustomGold(false); }} style={{ width: 'auto', padding: '0.2rem' }} />
                        </label>
                        <input type="number" value={a4} onChange={handleCustomGoldChange} />
                        <small className="help-text">{date}'s gold rate multiplied by 2.22456.</small>
                    </div>

                    <div className="form-group">
                        <label>Payment due on the following units of Ḥuqúq:</label>
                        <input type="number" value={a5 || ''} readOnly className="readonly-input" />
                        <small className="help-text">
                            {numA4 > 0 && taxableWealth > numA4 
                                ? `We rounded down from ${(taxableWealth / numA4).toFixed(2)} because payments are only due on whole units of Huquq.` 
                                : 'Payments are only due on whole units of Huquq.'}
                        </small>
                    </div>

                    <div className="form-group">
                        <label>The amount of wealth you are paying Ḥuqúq on today:</label>
                        <input type="number" value={a6 || ''} readOnly className="readonly-input" />
                        <small className="help-text">Today's gold rate multiplied by full units of Ḥuqúq.</small>
                    </div>

                    <div className="form-group">
                        <label>19% of the above:</label>
                        <input type="number" value={a7 || ''} readOnly className="readonly-input" />
                        <small className="help-text">Ḥuqúqu'lláh is a 19% tax on the wealth listed above.</small>
                    </div>

                    {r7 && (
                        <div className="result-group">
                            {r7}
                        </div>
                    )}

                    {/* Conditional Call to Action */}
                    {hasCalculated && !user && (
                        <div className="cta-box">
                            <p>Would you like to keep track of this information for next time?</p>
                            <Link to="/register" className="cta-button">Create an Account</Link>
                        </div>
                    )}
                </div>
            </section>

            <section className="features-section">
                <h2>More than just a calculator</h2>
                <div className="feature-grid">
                    <div className="feature-card">
                        <h3>Track Over Time</h3>
                        <p>Keep a historical record of your calculations and payments on your personal dashboard.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Upload Transactions</h3>
                        <p>Import CSV files directly from your bank to automate your math and find unnecessary expenditures.</p>
                    </div>
                    <div className="feature-card">
                        <h3>Smart Filters</h3>
                        <p>Set up custom rules to automatically categorize your expenses every time you upload a statement.</p>
                    </div>
                </div>
            </section>

            <footer className="home-footer">
                <p>You can host a local copy of this website, view the source code and instructions on <a href="https://github.com/bahaipedia/huququlator" target="_blank" rel="noreferrer">Github</a>.</p>
            </footer>
        </div>
    );
}
