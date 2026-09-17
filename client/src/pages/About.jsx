import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/static.css';

export default function About() {
    // Track which sections are open. We default 'about1' to true (open).
    const [expanded, setExpanded] = useState({ about1: true });

    const toggle = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content" style={{ padding: '2rem' }}>
                <div className="static-content">
                    <h1>About</h1>
                    <p>
                        Huququlator.com is a tool created by Sarah Haslip, its purpose is to help you calculate Ḥuqúqu’lláh. 
                        The public calculator can be used for one-time calculations, information you enter there is not saved. 
                        Creating an account provides access to a more advanced calculator that allows you to list assets, debts, 
                        expenses, and wealth on which you’ve already paid Ḥuqúqu’lláh, and then shows you the amount currently due. 
                        It also gives you the option to enter payments made, which will be saved and carried forward from year to year. 
                        Additionally, you can upload and categorize financial transactions and create categorization rules for automatic 
                        sorting of transactions. Any data you enter after creating an account will be saved until you delete it. 
                        Note, all data you enter is permanently deleted from the server as soon as you perform that operation.
                    </p>
                    <p>
                        Both the private and public calculators allow you to select past dates and view historical gold rates, 
                        which can be used to check past calculations.
                    </p>

                    <div style={{ marginTop: '2rem' }}>
                        {/* Section 1 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('about1')}>
                                Financial dashboard
                                <span>{expanded['about1'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['about1'] ? 'expanded' : ''}`}>
                                <p>A financial dashboard can be used to keep track of assets, debts, expenses, payments owed, payments made and outstanding balances.</p>
                                {/* Note: You will need to move your /images folder from V1 public/ to V2 client/public/ for these to load */}
                                <img src="/images/dashboard.png" alt="Picture of the dashboard" style={{ maxWidth: '100%' }} />
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('about2')}>
                                Uploading financial transactions
                                <span>{expanded['about2'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['about2'] ? 'expanded' : ''}`}>
                                <p>You can upload financial transactions and automatically categorize them as necessary (exempt from Huquq) or unnecessary (non-exempt).</p>
                                <img src="/images/upload-transactions.png" alt="Uploading transactions" style={{ maxWidth: '100%' }} />
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('about3')}>
                                Categorizing transactions
                                <span>{expanded['about3'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['about3'] ? 'expanded' : ''}`}>
                                <p>Financial transactions can be categorized as 'necessary', 'unnecessary' or 'hidden'. By default all debts will display in 'necessary' and all credits in 'hidden'. If you need to count a certain expense towards Ḥuqúqu’lláh, move it to the 'unnecessary'. A running total will be shown in the upper right.</p>
                                <img src="/images/transactions.png" alt="Categorizing transactions" style={{ maxWidth: '100%' }} />
                                <p>Use the filter bar to automatically categorize all transactions matching certain parameters. You can press "Apply & create rule" to apply that filter to all future uploads of financial transactions.</p>
                            </div>
                        </div>

                        {/* Section 4 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('about4')}>
                                Rules for automatic transaction categorization
                                <span>{expanded['about4'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['about4'] ? 'expanded' : ''}`}>
                                <p>If you press "Apply & create rule" while categorizing financial transactions they will be saved and shown in the 'Categorization rules' page. These rules can be automatically applied to future financial transaction uploads.</p>
                                <img src="/images/filter-rules.png" alt="Filter rules" style={{ maxWidth: '100%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
