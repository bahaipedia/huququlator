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

    // Set static help text
    r0.textContent = "Total assets less any debts.";
    r1.textContent = "These are purchases or expenditures subject to Huququllah.";
    r2.textContent = "Enter any wealth you have already paid Huququllah on.";
    r3.textContent = "This is calculated by taking today's gold rate and multiplying it by 2.225.";
    r4.textContent = "We rounded down from the calculated value because payments are only due on whole units of Huquq.";
    r5.textContent = "The amount of wealth you are paying Huquq on today. Save this number for next year.";
    r6.textContent = "Huququllah is a 19% tax on the wealth listed above.";

    // Fetch today's value of 19 Mithqals in USD
    try {
        const response = await fetch('/api/gold-price');
        const data = await response.json();
        const mithqalValue = data.value; // e.g., 5698.8918
        a4.value = mithqalValue;
    } catch (error) {
        console.error("Error fetching gold price:", error);
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
            a6.value = totalTaxable;

            const huquqDue = totalTaxable * 0.19;
            a7.value = huquqDue.toFixed(2);

            r4.textContent = `We rounded down from ${(taxableWealth / numA4).toFixed(2)} because payments are only due on whole units of Huquq.`;
            r7.textContent = `This year you owe $${a7.value} to Huququllah.`;
        }
    }

    // Event Listeners for user input
    [a1, a2, a3].forEach(input => input.addEventListener("input", calculate));
});
