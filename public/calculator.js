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
        if (!response.ok) throw new Error("Failed to fetch gold price");
        const data = await response.json();
        a4.value = parseFloat(data.value).toFixed(2);
    } catch (error) {
        console.error("Error fetching gold price:", error);
        a4.value = "5698.89"; // Fallback value
    }

    // Reusable function for updating help text
    function updateHelpText(inputId, helpTextId, condition) {
        const inputElement = document.getElementById(inputId);
        const helpTextElement = document.getElementById(helpTextId);

        inputElement.addEventListener("input", () => {
            if (condition(inputElement.value)) {
                helpTextElement.style.display = "block"; // Show help text
            } else {
                helpTextElement.style.display = "none"; // Hide help text
            }
        });
    }

    // Define conditions for help text
    const condition1 = (value) => parseFloat(value) < 0; // Example: Show help if input is negative
    const condition2 = (value) => parseFloat(value) === 0; // Show help if input is zero

    // Attach help text logic to inputs
    updateHelpText("a1", "r0", condition1);
    updateHelpText("a2", "r1", condition2);

    // Calculation function
    function calculate() {
        const numA1 = parseFloat(a1.value) || 0;
        const numA2 = parseFloat(a2.value) || 0;
        const numA3 = parseFloat(a3.value) || 0;
        const numA4 = parseFloat(a4.value) || 0;

        const totalWealth = numA1 + numA2;
        if (totalWealth <= numA4) {
            r1.textContent = "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold.";
        } else {
            r1.textContent = "";
        }

        const taxableWealth = totalWealth - numA3;
        if (taxableWealth <= numA4) {
            r2.textContent = "No Huququllah payment is due today because your taxable wealth did not exceed 19 Mithqals of gold.";
        } else {
            r2.textContent = "";
        }

        const huquqUnits = Math.floor(taxableWealth / numA4);
        a5.value = huquqUnits || 0;
        r3.textContent = `Rounded down from ${taxableWealth / numA4} to whole units of Huquq.`;

        const totalTaxable = huquqUnits * numA4;
        a6.value = totalTaxable.toFixed(2) || 0;
        r5.textContent = `This is the wealth on which Huququllah is calculated.`;

        const huquqDue = totalTaxable * 0.19;
        a7.value = huquqDue.toFixed(2) || 0;
        r6.textContent = `This year you owe $${a7.value} to Huququllah. If you're in the U.S., you can make payments online.`;
    }

    // Attach calculation logic to inputs
    [a1, a2, a3].forEach((input) => input.addEventListener("input", calculate));
});
