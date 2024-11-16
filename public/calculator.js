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

    // Fetch today's value of 19 Mithqals in USD
    try {
        const response = await fetch('/api/gold-price');
        const data = await response.json();
        const mithqalValue = data.value; // e.g., 5698.8918
        a4.value = mithqalValue;
    } catch (error) {
        console.error("Error fetching gold price:", error);
    }

    // Function to calculate responses specific to inputs
    function calculate() {
        const numA1 = parseFloat(a1.value) || 0;
        const numA2 = parseFloat(a2.value) || 0;
        const numA3 = parseFloat(a3.value) || 0;
        const numA4 = parseFloat(a4.value) || 0;

        const totalWealth = numA1 + numA2;
        const taxableWealth = totalWealth - numA3;
        const huquqUnits = Math.floor(taxableWealth / numA4);
        const totalTaxable = huquqUnits * numA4;
        const huquqDue = totalTaxable * 0.19;

        // Update dependent fields
        a5.value = huquqUnits;
        a6.value = totalTaxable;
        a7.value = huquqDue.toFixed(2);

        // Update responses based on input relevance
        if (numA1 || numA2) {
            if (totalWealth <= numA4) {
                r1.style.visibility = "visible";
                r1.textContent = "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold";
            } else {
                r1.style.visibility = "hidden";
            }
        }

        if (numA1 || numA2 || numA3) {
            if (taxableWealth <= numA4) {
                r2.style.visibility = "visible";
                r2.textContent = "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold";
            } else {
                r2.style.visibility = "hidden";
            }
        }

        if (numA1 || numA2 || numA3) {
            r3.style.visibility = "visible";
            r3.textContent = `We rounded down from ${(taxableWealth / numA4).toFixed(2)} because payments are only due on whole units of Huquq`;
            r4.style.visibility = "visible";
            r4.textContent = `This represents the amount of wealth you are paying Huquq on`;
            r5.style.visibility = "visible";
            r5.textContent = `Huququllah is a 19% tax on the wealth listed above`;
            r6.style.visibility = "visible";
            r6.textContent = `This year you owe $${a7.value} to Huququllah. If you are in the United States you can make a payment at [this url].`;
        }
    }

    // Event Listeners for each relevant input
    [a1, a2, a3].forEach(input => input.addEventListener("input", calculate));
});
