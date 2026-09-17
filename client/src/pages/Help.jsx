import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/static.css';

export default function Help() {
    // Default the first FAQ to open
    const [expanded, setExpanded] = useState({ faq1: true });

    const toggle = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content" style={{ padding: '2rem' }}>
                <div className="static-content">
                    <h1>Help and Frequently Asked Questions</h1>
                    <p>Below are answers to common questions and explanations for each section of the calculator.</p>

                    <div style={{ marginTop: '2rem' }}>
                        {/* FAQ 1 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('faq1')}>
                                What is Ḥuqúqu’lláh?
                                <span>{expanded['faq1'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['faq1'] ? 'expanded' : ''}`}>
                                <p>Ḥuqúqu’lláh is a voluntary tax on wealth that applies to members of the Bahá’í faith who meet certain requirements. Bahá’u’lláh writes, "Should anyone acquire one hundred mithqáls of gold, nineteen mithqáls thereof are God’s and to be rendered unto Him, the Fashioner of earth and heaven." <a href="https://www.bahai.org/library/authoritative-texts/bahaullah/kitab-i-aqdas/6#443108496" target="_blank" rel="noreferrer">Kitáb-i-Aqdas</a></p>
                                <p>For a general overview, view the <a href="https://bahaipedia.org/%E1%B8%A4uq%C3%BAqu%E2%80%99ll%C3%A1h#External_links" target="_blank" rel="noreferrer">Bahaipedia</a> article. For an outline describing requirements and exemptions, see <a href="https://www.bahai.org/library/authoritative-texts/compilations/codification-law-huququllah/codification-law-huququllah.xhtml?08f75ef0" target="_blank" rel="noreferrer">A Codification of the Law of Ḥuqúqu’lláh</a>. For quotes, see <a href="https://www.bahai.org/library/authoritative-texts/compilations/huququllah-right-god/2#739943918" target="_blank" rel="noreferrer">this compilation</a>, both available on bahai.org. Any quotes listed below are drawn from these pages.</p>
                            </div>
                        </div>

                        {/* FAQ 2 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('faq2')}>
                                Excess Wealth
                                <span>{expanded['faq2'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['faq2'] ? 'expanded' : ''}`}>
                                <p>Enter the sum of all wealth and possessions you own, unless they are exempt.</p>
                                <p>"The basic sum on which Ḥuqúqu’lláh is payable is nineteen mithqáls of gold. In other words, when money to the value of this sum hath been acquired, a payment of Ḥuqúq falleth due. Likewise, Ḥuqúq is payable when the value, not the number, of other forms of property reacheth the prescribed amount... The Primal Point hath directed that Ḥuqúqu’lláh must be paid on the value of whatsoever one possesseth; yet, in this Most Mighty Dispensation, We have exempted the household furnishings, that is such furnishings as are needed, and the residence itself."</p>
                                <p>Concerning the deduction of expenses: "As to the Ḥuqúq, it is payable on whatever is left over after deducting one’s yearly expenses. However, any money or possession which is necessary in producing income for one’s subsistence, and on which Ḥuqúq hath once been paid, is exempt from Ḥuqúq."</p>
                            </div>
                        </div>

                        {/* FAQ 3 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('faq3')}>
                                Unnecessary Expenditures
                                <span>{expanded['faq3'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['faq3'] ? 'expanded' : ''}`}>
                                <p>For the purpose of this calculator, this section is intended to allow one to account for non-exempt possessions. "Ḥuqúq is applied on everything one possesseth. However, if a person hath paid the Ḥuqúq on a certain property, and the income from that property is equal to his needs, no Ḥuqúq is payable by that person. Ḥuqúq is not payable on agricultural tools and equipment, and on animals used in ploughing the land, to the extent that these are necessary."</p>
                                <p>In other words, if you purchased something subject to Ḥuqúqu’lláh ('unnecessary'), you can sum their value and list them in this section (because they would otherwise not be reflected as part of your wealth).</p>
                            </div>
                        </div>

                        {/* FAQ 4 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('faq4')}>
                                Wealth Ḥuqúq Has Already Been Paid On
                                <span>{expanded['faq4'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['faq4'] ? 'expanded' : ''}`}>
                                <p>If you have already paid Ḥuqúqu’lláh on some portion of your wealth or possessions, you never need to pay it again for that portion. Additionally, if there is a loss subsequently recovered, Ḥuqúqu’lláh is not payable on that "increase". Therefore, it is necessary to know the total amount of wealth on which you have previously paid Ḥuqúqu’lláh. This figure is not what you paid to Ḥuqúqu’lláh, but the wealth represented by those payments. If you only know the payments you have made in the past, sum them and multiply the total by (100/19), which will give you the total wealth on which you have paid Ḥuqúqu’lláh.</p>
                            </div>
                        </div>

                        {/* FAQ 5 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('faq5')}>
                                Value of 19 Mithqáls of Gold
                                <span>{expanded['faq5'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['faq5'] ? 'expanded' : ''}`}>
                                <p>A Mithqál is a unit of weight. 19 mithqáls is equal to 69.192 grams or 2.22456 troy ounces. We use an external source to get the value of one troy ounce of gold and multiply it by 2.22456.</p>
                            </div>
                        </div>

                        {/* FAQ 6 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('faq6')}>
                                Payment Due on the Following Units of Ḥuqúq
                                <span>{expanded['faq6'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['faq6'] ? 'expanded' : ''}`}>
                                <p>"Ḥuqúqu’lláh is payable as soon as a person’s assessable possessions reach or exceed the value of 19 mithqáls of gold."</p>
                                <p>The amounts you entered as excess wealth and unnecessary expenditures are added together. The amount of wealth on which you have previously paid Ḥuqúqu’lláh is deducted from that total, then divided by the figure listed in "Today's value of 19 Mithqáls of gold" and rounded down to give you a figure in whole units of Ḥuqúq. This figure represents the number of units of Ḥuqúq (one unit being equal to 19 Mithqáls of gold) you are required to pay on.</p>
                            </div>
                        </div>

                        {/* FAQ 7 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('faq7')}>
                                The Amount of Wealth You Are Paying Ḥuqúq On Today
                                <span>{expanded['faq7'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['faq7'] ? 'expanded' : ''}`}>
                                <p>Payment is only due on full units of Ḥuqúq (where one full unit is 19 Mithqáls of gold, the value of which is shown in the calculator). When your total wealth subject to Ḥuqúqu’lláh is divided by today's value of 19 Mithqáls of gold, that figure is rounded down to get the wealth you need to pay Ḥuqúqu’lláh on today. Save this figure for the future to ensure you don't pay Ḥuqúqu’lláh on the same wealth twice.</p>
                            </div>
                        </div>

                        {/* FAQ 8 */}
                        <div className="accordion-item">
                            <h2 className="accordion-header" onClick={() => toggle('faq8')}>
                                19% of the Above
                                <span>{expanded['faq8'] ? '−' : '+'}</span>
                            </h2>
                            <div className={`accordion-body ${expanded['faq8'] ? 'expanded' : ''}`}>
                                <p>Ḥuqúqu’lláh is a 19% tax on one's excess wealth. We multiply the amount of your excess wealth by 19% to calculate this figure.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
