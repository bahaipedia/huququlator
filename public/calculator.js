// Function to update the calculation
function calculateHuququllah() {
    const a1 = parseFloat(document.getElementById("a1").value) || 0; // Excess wealth
    const a2 = parseFloat(document.getElementById("a2").value) || 0; // Unnecessary expenditures
    const a3 = parseFloat(document.getElementById("a3").value) || 0; // Wealth previously paid
    const a4 = parseFloat(document.getElementById("a4").value) || 5698.89; // Value of 19 Mithqals of gold

    const totalWealth = a1 + a2; // Total wealth including unnecessary expenditures
    const netWealth = totalWealth - a3; // Net wealth after previously paid amount

    // Response r1: If total wealth is less than a4
    if (totalWealth < a4) {
        document.getElementById("r1").textContent =
            "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold.";
    } else {
        document.getElementById("r1").textContent = ""; // Clear response if condition is not met
    }

    // Response r2: If net wealth is less than a4
    if (netWealth < a4) {
        document.getElementById("r2").textContent =
            "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold.";
    } else {
        document.getElementById("r2").textContent = ""; // Clear response if condition is not met
    }

    // a5: Units of Huquq
    const a5 = Math.floor(netWealth / a4); // Rounded down to nearest whole number
    document.getElementById("a5").value = a5;

    // Response r3: Explanation of rounding
    if (a5 > 0) {
        document.getElementById("r3").textContent =
            "We rounded down from " + (netWealth / a4).toFixed(2) + " because payments are only due on whole units of Huquq.";
    } else {
        document.getElementById("r3").textContent = ""; // Clear response if condition is not met
    }

    // a6: Wealth to pay Huquq on
    const a6 = a5 * a4;
    document.getElementById("a6").value = a6;

    // Response r4: Explanation of wealth being paid on
    document.getElementById("r4").textContent =
        "This represents the amount of wealth you are paying Huquq on.";

    // a7: Huququllah amount (19% of a6)
    const a7 = a6 * 0.19;
    document.getElementById("a7").value = a7.toFixed(2);

    // Response r5: Final amount due
    document.getElementById("r5").textContent =
        "This year you owe $" + a7.toFixed(2) + " to Huququllah. If you are in the United States, you can make a payment at [this URL].";
}

// Add event listeners to trigger calculation on input change
document.getElementById("a1").addEventListener("input", calculateHuququllah);
document.getElementById("a2").addEventListener("input", calculateHuququllah);
document.getElementById("a3").addEventListener("input", calculateHuququllah);
document.getElementById("a4").addEventListener("input", calculateHuququllah);

// Initial calculation
calculateHuququllah();
