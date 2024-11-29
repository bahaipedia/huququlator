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
    const goldDateInput = document.getElementById("goldDate");
    const goldValueInput = document.getElementById("goldValue");
    const errorSpan = document.getElementById("goldError");

    console.log({
    a1, a2, a3, a4, a5, a6, a7,
    r0, r1, r2, r3, r4, r5, r6, r7,
    dateLabel, goldDateInput, goldValueInput, errorSpan
});
    
    if (!a1 || !a2 || !a3 || !a4 || !a5 || !a6 || !a7 || !dateLabel || !goldDateInput || !goldValueInput || !errorSpan) {
        console.error("One or more elements are missing in the DOM.");
        return;
    }

    let isCustomMithqalValue = false;

    // Set static help text
    r0.textContent = "Total assets less any debts.";
    r1.textContent = "These are purchases or expenditures subject to Ḥuqúqu’lláh.";
    r2.textContent = "If you only know past payments, multiply those by (100/19).";
    r3.textContent = "Today's gold rate multiplied by 2.22456.";
    r4.textContent = "We rounded down from the calculated value because payments are only due on whole units of Ḥuqúq.";
    r5.textContent = "Today's gold rate multiplied by full units of Ḥuqúq.";
    r6.textContent = "Ḥuqúqu’lláh is a 19% tax on the wealth listed above.";

    const formatDateForAPI = (date) => date.replace(/-/g, '');

    const fetchGoldPrice = async (date) => {
        try {
            const formattedDate = formatDateForAPI(date || new Date().toISOString().split("T")[0]);
            const response = await fetch(`/api/gold-price?date=${formattedDate}`);
            const data = await response.json();

            if (response.ok) {
                const mithqalValue = data.value * 2.22456; // Multiply for Mithqal conversion
                if (!isCustomMithqalValue) a4.value = mithqalValue.toFixed(2);
                goldValueInput.value = `$${mithqalValue.toFixed(2)}`;
                errorSpan.textContent = "";
            } else {
                throw new Error(data.error || "Unable to fetch gold price.");
            }
        } catch (error) {
            console.error("Error fetching gold price:", error);
            errorSpan.textContent = error.message;
            goldValueInput.value = "";
        }
    };

    // Utility functions for rounding
    const roundDown = (value, decimals = 2) => Math.floor(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    const roundUp = (value, decimals = 2) => Math.ceil(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

    // Update calculations based on user input
    const calculate = () => {
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
            a6.value = roundDown(totalTaxable);

            const huquqDue = totalTaxable * 0.19;
            a7.value = roundUp(huquqDue).toFixed(2);

            r4.textContent = `We rounded down from ${(taxableWealth / numA4).toFixed(2)} because payments are only due on whole units of Huquq.`;
            r7.textContent = `This year you owe $${a7.value} to Huququllah.`;
        }
    };

    // Handle "Today" label click
    dateLabel.addEventListener("click", () => {
        goldDateInput.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Handle date picker selection
    goldDateInput.addEventListener("change", (event) => {
        const selectedDate = event.target.value;
        if (selectedDate) {
            const formattedLabelDate = new Date(selectedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            dateLabel.textContent = `[${formattedLabelDate}]`;
            fetchGoldPrice(selectedDate);
        }
    });

    // Automatically fetch today's gold price on page load
    goldDateInput.value = new Date().toISOString().split("T")[0];
    await fetchGoldPrice();

    // Track custom Mithqal input
    a4.addEventListener("input", () => {
        isCustomMithqalValue = true;
        calculate();
    });

    // Event Listeners for user input
    [a1, a2, a3].forEach((input) => input.addEventListener("input", calculate));
});
