document.addEventListener("DOMContentLoaded", async () => {
    const a1 = document.getElementById("a1");
    const a2 = document.getElementById("a2");
    const a3 = document.getElementById("a3");
    const a4 = document.getElementById("a4");

    const helpText1 = document.getElementById("helpText1");
    const helpText2 = document.getElementById("helpText2");
    const helpText3 = document.getElementById("helpText3");

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

    // Function to show or hide help text
    function updateHelpText(input, helpText, condition) {
        input.addEventListener("input", () => {
            if (condition(input.value)) {
                helpText.classList.add("show"); // Add the 'show' class to display the help text
            } else {
                helpText.classList.remove("show"); // Remove the 'show' class to hide the help text
            }
        });
    }

    // Conditions for showing help text
    const condition1 = (value) => value.trim() === ""; // Show help text if input is empty
    const condition2 = (value) => parseFloat(value) < 0; // Show help text if input is negative
    const condition3 = (value) => isNaN(parseFloat(value)); // Show help text if input is not a valid number

    // Attach help text logic to inputs
    updateHelpText(a1, helpText1, condition1);
    updateHelpText(a2, helpText2, condition2);
    updateHelpText(a3, helpText3, condition3);

    // Function to perform calculations
    function calculate() {
        const numA1 = parseFloat(a1.value) || 0;
        const numA2 = parseFloat(a2.value) || 0;
        const numA3 = parseFloat(a3.value) || 0;
        const numA4 = parseFloat(a4.value) || 0;

        const totalWealth = numA1 + numA2 - numA3;
        const huquqDue = totalWealth > numA4 ? totalWealth * 0.19 : 0;

        document.getElementById("a5").value = Math.floor(totalWealth / numA4) || 0;
        document.getElementById("a6").value = (Math.floor(totalWealth / numA4) * numA4).toFixed(2) || 0;
        document.getElementById("a7").value = huquqDue.toFixed(2) || 0;
    }

    // Attach calculation logic
    [a1, a2, a3].forEach((input) => input.addEventListener("input", calculate));
});
