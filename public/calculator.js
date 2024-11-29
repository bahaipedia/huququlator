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

    const dateLabel = document.getElementById("dateLabel");

    let isCustomMithqalValue = false;

    // Set static help text
    r0.textContent = "Total assets less any debts.";
    r1.textContent = "These are purchases or expenditures subject to Ḥuqúqu'lláh.";
    r2.textContent = "If you only know past payments, multiply those by (100/19).";
    r3.textContent = "Today's gold rate multiplied by 2.22456.";
    r4.textContent = "We rounded down from the calculated value because payments are only due on whole units of Ḥuqúq.";
    r5.textContent = "Today's gold rate multiplied by full units of Ḥuqúq.";
    r6.textContent = "Ḥuqúqu'lláh is a 19% tax on the wealth listed above.";

    // Function to fetch gold price for a specific date
    async function fetchGoldPrice(date) {
        try {
            // Format date as YYYYMMDD for the API
            const formattedDate = date.replace(/-/g, '');

            const response = await fetch(`/api/gold-price?date=${formattedDate}`);
            const data = await response.json();

            if (data.value) {
                if (!isCustomMithqalValue) {
                    a4.value = data.value.toFixed(2);
                    dateLabel.textContent = date === new Date().toISOString().split('T')[0] ? "Today" : date;
                    r3.textContent = `${date}'s gold rate multiplied by 2.22456.`;
                }
                calculate(); // Recalculate after updating gold price
                return true;
            } else {
                a4.value = '';
                r3.textContent = 'Unable to fetch gold price';
                return false;
            }
        } catch (error) {
            console.error('Error fetching gold price:', error);
            a4.value = '';
            r3.textContent = 'Error fetching gold price';
            return false;
        }
    }

    // Create a hidden date input for native date picker
    const hiddenDateInput = document.createElement('input');
    hiddenDateInput.type = 'date';
    hiddenDateInput.style.position = 'absolute';
    hiddenDateInput.style.opacity = 0;
    hiddenDateInput.style.pointerEvents = 'none';

    // Initially position the input near the dateLabel
    const positionDateInput = () => {
        const rect = dateLabel.getBoundingClientRect();
        hiddenDateInput.style.top = `${rect.top + window.scrollY}px`;
        hiddenDateInput.style.left = `${rect.left + window.scrollX}px`;
    };

    positionDateInput(); // Set initial position
    document.body.appendChild(hiddenDateInput);

    // Fetch initial gold price for today
    const today = new Date().toISOString().split('T')[0];
    await fetchGoldPrice(today);

    // Show date picker when "Today" is clicked
    dateLabel.addEventListener('click', () => {
        positionDateInput(); // Ensure correct positioning before opening
        hiddenDateInput.value = today;
        hiddenDateInput.showPicker();
    });

    // Handle date selection
    hiddenDateInput.addEventListener('change', async (event) => {
        const selectedDate = event.target.value;
        await fetchGoldPrice(selectedDate);
    });

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
