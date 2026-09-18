import { useState } from 'react';
import '../styles/static.css';

export default function About() {
    // Track which sections are open. We default 'about1' to true (open).
    const [expanded, setExpanded] = useState({ about1: true });

    const toggle = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="about-container">
            <h1>About</h1>
            <p className="georgia-text">
                Huququlator.com is a tool created by Sarah Haslip, its purpose is to help you calculate Ḥuqúqu’lláh. 
                The public calculator can be used for one-time calculations, information you enter there is not saved. 
                Creating an account provides access to a more advanced calculator that allows you to list assets, debts, 
                expenses, and wealth on which you’ve already paid Ḥuqúqu’lláh, and then shows you the amount currently due. 
                It also gives you the option to enter payments made, which will be saved and carried forward from year to year. 
                Additionally, you can upload and categorize financial transactions and create categorization rules for automatic 
                sorting of transactions. Any data you enter after creating an account will be saved until you delete it. 
                Note, all data you enter is permanently deleted from the server as soon as you perform that operation.
            </p>
            <p className="georgia-text">
                Both the private and public calculators allow you to select past dates and view historical gold rates, 
                which can be used to check past calculations.
            </p>

            <div className="about-section">
                {/* Section 1 */}
                <div className="about-item" id="about1">
                    <h2 onClick={() => toggle('about1')}>Financial dashboard</h2>
                    <div className={`about-content ${expanded['about1'] ? 'expanded' : ''}`}>
                        <p>A financial dashboard can be used to keep track of assets, debts, expenses, payments owed, payments made and outstanding balances.</p>
                        {/* Note: Ensure your /images folder is in client/public/ */}
                        <img src="/images/dashboard.png" alt="Picture of the dashboard" style={{ maxWidth: '100%' }} />
                    </div>
                    <button className="view-more-about" onClick={() => toggle('about1')}>
                        {expanded['about1'] ? 'Collapse' : 'Expand'}
                    </button>
                </div>

                {/* Section 2 */}
                <div className="about-item" id="about2">
                    <h2 onClick={() => toggle('about2')}>Uploading financial transactions</h2>
                    <div className={`about-content ${expanded['about2'] ? 'expanded' : ''}`}>
                        <p>You can upload financial transactions and automatically categorize them as necessary (exempt from Huquq) or unnecessary (non-exempt).</p>
                        <img src="/images/upload-transactions.png" alt="Uploading transactions" style={{ maxWidth: '100%' }} />
                    </div>
                    <button className="view-more-about" onClick={() => toggle('about2')}>
                        {expanded['about2'] ? 'Collapse' : 'Expand'}
                    </button>
                </div>

                {/* Section 3 */}
                <div className="about-item" id="about3">
                    <h2 onClick={() => toggle('about3')}>Categorizing transactions</h2>
                    <div className={`about-content ${expanded['about3'] ? 'expanded' : ''}`}>
                        <p>Financial transactions can be categorized as 'necessary', 'unnecessary' or 'hidden'. By default all debts will display in 'necessary' and all credits in 'hidden'. If you need to count a certain expense towards Ḥuqúqu’lláh, move it to the 'unnecessary'. A running total will be shown in the upper right.</p>
                        <img src="/images/transactions.png" alt="Categorizing transactions" style={{ maxWidth: '100%' }} />
                        <p>Use the filter bar to automatically categorize all transactions matching certain parameters. You can press "Apply & create rule" to apply that filter to all future uploads of financial transactions.</p>
                    </div>
                    <button className="view-more-about" onClick={() => toggle('about3')}>
                        {expanded['about3'] ? 'Collapse' : 'Expand'}
                    </button>
                </div>

                {/* Section 4 */}
                <div className="about-item" id="about4">
                    <h2 onClick={() => toggle('about4')}>Rules for automatic transaction categorization</h2>
                    <div className={`about-content ${expanded['about4'] ? 'expanded' : ''}`}>
                        <p>If you press "Apply & create rule" while categorizing financial transactions they will be saved and shown in the 'Categorization rules' page. These rules can be automatically applied to future financial transaction uploads.</p>
                        <img src="/images/filter-rules.png" alt="Filter rules" style={{ maxWidth: '100%' }} />
                    </div>
                    <button className="view-more-about" onClick={() => toggle('about4')}>
                        {expanded['about4'] ? 'Collapse' : 'Expand'}
                    </button>
                </div>
            </div>
        </div>
    );
}
