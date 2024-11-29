document.addEventListener("DOMContentLoaded", async () => {
    const a1 = document.getElementById("a1");
    const a2 = document.getElementById("a2");
    const a3 = document.getElementById("a3");
    const a4 = document.getElementById("a4"); // Value of 19 Mithqáls of gold
    const a5 = document.getElementById("a5");
    const a6 = document.getElementById("a6");
    const a7 = document.getElementById("a7");
    const r0 = document.getElementById("r0");
    const r1 = document.getElementById("r1");
    const r2 = document.getElementById("r2");
    const r3 = document.getElementById("r3"); // Response for gold value
    const r4 = document.getElementById("r4");
    const r5 = document.getElementById("r5");
    const r6 = document.getElementById("r6");
    const r7 = document.getElementById("r7");
    const dateLabel = document.getElementById("dateLabel");
    const goldDateInput = document.getElementById("goldDate");

    if (!a3 || !a4 || !a5 || !dateLabel || !goldDateInput || !r3 || !r4) {
        console.error("One or more critical elements are missing in the DOM.");
        return;
    }

    let isCustomMithqalValue = false;

    // Set static help text (if needed for other responses)
    if (r2) r2.textContent = "If you only know past payments, multiply those by (100/19).";
    if (r3) r3.textContent = "Today's gold rate multiplied by 2.22456.";
    if (r4) r4.textContent = "Payments are only due on whole units of Ḥuqúq.";

    const formatDateForAPI = (date) => date.replace(/-/g, '');

    const fetchGoldPrice = async (date) => {
        try {
            const formattedDate = formatDateForAPI(date || new Date().toISOString().split("T")[0]);
            const response = await fetch(`/api/gold-price?date=${formattedDate}`);
            const data = await response.json();

            if (response.ok) {
                const mithqalValue = data.value * 2.22456; // Convert to 19 Mithqáls
                if (!isCustomMithqalValue) a4.value = mithqalValue.toFixed(2);
                r3.textContent = `Gold value for ${formattedDate}: $${mithqalValue.toFixed(2)}`;
            } else {
                throw new Error(data.error || "Unable to fetch gold price.");
            }
        } catch (error) {
            console.error("Error fetching gold price:", error);
            r3.textContent = error.message;
        }
    };

    // Directly trigger the date picker
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
    });
});
