document.addEventListener("DOMContentLoaded", async () => {
    const a1 = document.getElementById("a1");
    const a2 = document.getElementById("a2");
    const a3 = document.getElementById("a3");
    const a4 = document.getElementById("a4");
    const a5 = document.getElementById("a5");
    const a6 = document.getElementById("a6");
    const a7 = document.getElementById("a7");
    const r0 = document.getElementById("r0");
    const r1 = document.getElementById("r1");
    const r2 = document.getElementById("r2");
    const r3 = document.getElementById("r3");
    const r4 = document.getElementById("r4");
    const r5 = document.getElementById("r5");
    const r6 = document.getElementById("r6");
    const r7 = document.getElementById("r7");

    let isCustomMithqalValue = false;

    // Set static help text
    r0.textContent = "Total assets less any debts.";
    r1.textContent = "These are purchases or expenditures subject to Ḥuqúqu’lláh.";
    r2.textContent = "If you only know past payments, multiply those by (100/19).";
    r3.textContent = "Today's gold rate multiplied by 2.22456.";
    r4.textContent = "We rounded down from the calculated value because payments are only due on whole units of Ḥuqúq.";
    r5.textContent = "Today's gold rate multiplied by full units of Ḥuqúq.";
    r6.textContent = "Ḥuqúqu’lláh is a 19% tax on the wealth listed above.";

    // Fetch today's value of 19 Mithqals in USD
    try {
        const response = await fetch('/api/gold-price');
        const data = await response.json();
        const mithqalValue = data.value; // e.g., 5698.8918
        if (!isCustomMithqalValue) {
            a4.value = mithqalValue.toFixed(2); // Round for display
        }
    } catch (error) {
        console.error("Error fetching gold price:", error);
    }

    // Utility functions for rounding
    function roundDown(value, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.floor(value * factor) / factor;
    }

    function roundUp(value, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.ceil(value * factor) / factor;
    }

    // Update final response based on user input
    function calculate() {
        const numA1 = parseFloat(a1.value) || 0;
        const numA2 = parseFloat(a2.value) || 0;
        const numA3 = parseFloat(a3.value) || 0;
        const numA4 = parseFloat(a4.value) || 0;

        const totalWealth = numA1 + numA2;
        const taxableWealth = totalWealth - numA3;

        if (taxableWealth <= numA4) {
            r7.textContent = "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold.";
        } else {
            const huquqUnits = Math.floor(taxableWealth / numA4);
            a5.value = huquqUnits;

            const totalTaxable = huquqUnits * numA4;
            a6.value = roundDown(totalTaxable); // Rounded down for display

            const huquqDue = totalTaxable * 0.19;
            a7.value = roundUp(huquqDue).toFixed(2); // Rounded up for display

            r4.textContent = `We rounded down from ${(taxableWealth / numA4).toFixed(2)} because payments are only due on whole units of Huquq.`;
            r7.textContent = `This year you owe $${a7.value} to Huququllah.`;
        }
    }

    // Track custom Mithqal input
    a4.addEventListener("input", () => {
        isCustomMithqalValue = true;
        calculate();
    });

    // Event Listeners for user input
    [a1, a2, a3].forEach(input => input.addEventListener("input", calculate));
});

// Fetch gold price
const dateLabel = document.getElementById('dateLabel');
const goldDateInput = document.getElementById('goldDate');
const goldValueInput = document.getElementById('goldValue');
const errorSpan = document.getElementById('goldError');

const formatDateForAPI = (date) => date.replace(/-/g, '');

const fetchGoldPrice = async (date) => {
    try {
        const formattedDate = formatDateForAPI(date);
        const response = await fetch(`/api/gold-price?date=${formattedDate}`);
        const data = await response.json();

        if (response.ok) {
            goldValueInput.value = `$${data.value.toFixed(2)}`;
            errorSpan.textContent = '';
        } else {
            throw new Error(data.error || 'Unable to fetch gold price.');
        }
    } catch (error) {
        errorSpan.textContent = error.message;
        goldValueInput.value = '';
    }
};

// Directly trigger the date picker
dateLabel.addEventListener('click', () => {
    goldDateInput.click(); // This directly triggers the date picker
});

// Handle date selection
goldDateInput.addEventListener('change', (event) => {
    const selectedDate = event.target.value;
    if (selectedDate) {
        const formattedLabelDate = new Date(selectedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        dateLabel.textContent = `[${formattedLabelDate}]`;

        fetchGoldPrice(selectedDate);
    }
});

// Automatically fetch today's gold price on page load
const today = new Date().toISOString().split('T')[0];
goldDateInput.value = today;
fetchGoldPrice(today);
