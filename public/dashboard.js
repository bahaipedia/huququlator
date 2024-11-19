/* Add a New Asset, Debt, or Expense */
document.querySelectorAll('.add-item-button').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.classList.contains('asset-button')
            ? 'Assets'
            : button.classList.contains('debt-button')
            ? 'Debts'
            : 'Expenses';

        const label = prompt(`Enter ${category} Name:`);
        if (label) {
            const reportingDate = document.querySelector('.dashboard-table thead th:nth-child(2)').textContent;

            fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    label,
                    value: 0.00, // Default value until user edits
                    reporting_date: reportingDate
                })
            })
                .then(response => response.json())
                .then(data => {
                    alert(`${category} added successfully!`);
                    location.reload(); // Reload to reflect changes
                })
                .catch(err => {
                    console.error('Error adding item:', err);
                    alert('Failed to add the item.');
                });
        }
    });
});

/* Add a New Reporting Period */
document.querySelector('.add-year-button').addEventListener('click', () => {
    const endDate = prompt('Enter the end date for the new reporting period (YYYY-MM-DD):');
    if (endDate) {
        fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ end_date: endDate }),
        })
            .then(response => response.json())
            .then(data => {
                alert('New reporting period added successfully!');
                location.reload(); // Reload to reflect the new column
            })
            .catch(err => {
                console.error('Error adding reporting period:', err);
                alert('Failed to add the reporting period.');
            });
    }
});

/* Handle Changes in the Summary Table Using Event Delegation */
document.querySelector('.summary-table').addEventListener('change', (event) => {
    if (event.target && event.target.tagName === 'INPUT') {
        const summaryId = document.querySelector('.summary-table').dataset.summaryId; // Assume summary ID is stored in the table
        const huquqPaymentsMade = parseFloat(event.target.value);

        fetch(`/api/summary/${summaryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ huquq_payments_made: huquqPaymentsMade }),
        })
            .then((response) => response.json())
            .then((data) => {
                alert('Huquq payment updated successfully!');
            })
            .catch((err) => {
                console.error('Error updating Huquq payment:', err);
                alert('Failed to update Huquq payment.');
            });
    }
});

/* Handle Inline Editing for Financial Entries Using Event Delegation */
document.querySelector('.dashboard-table').addEventListener('change', (event) => {
    if (event.target && event.target.tagName === 'INPUT') {
        const entryId = event.target.dataset.id; // Assume each input has a data-id attribute
        const newValue = parseFloat(event.target.value);

        fetch(`/api/entries/${entryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: newValue }),
        })
            .then((response) => response.json())
            .then((data) => {
                alert('Entry updated successfully!');
            })
            .catch((err) => {
                console.error('Error updating entry:', err);
                alert('Failed to update the entry.');
            });
    }
});

/* Calculate Summary Table */
function calculateSummary() {
    const totalAssets = parseFloat(document.querySelector('.total-assets')?.textContent) || 0;
    const totalDebts = parseFloat(document.querySelector('.total-debts')?.textContent?.replace(/[()]/g, '')) || 0;
    const unnecessaryExpenses = parseFloat(document.querySelector('.unnecessary-expenses')?.textContent) || 0;
    const wealthAlreadyTaxed = parseFloat(document.querySelector('.wealth-already-taxed input')?.value) || 0;
    const goldRate = parseFloat(document.querySelector('.gold-rate')?.textContent) || 0;

    // Only proceed with calculations if the required elements exist
    if (!goldRate || !document.querySelector('.summary-table')) {
        console.warn('No data available for calculations.');
        return;
    }

    const summary = totalAssets - totalDebts + unnecessaryExpenses - wealthAlreadyTaxed;
    const unitsOfHuquq = summary / goldRate;
    const roundedUnits = Math.floor(unitsOfHuquq);
    const huquqPaymentOwed = 0.19 * (roundedUnits * goldRate);
    const huquqPaymentsMade = parseFloat(document.querySelector('.huquq-payments-made input')?.value) || 0;
    const remainderDue = huquqPaymentOwed - huquqPaymentsMade;

    // Update the DOM only if the elements exist
    if (document.querySelector('.summary-value')) {
        document.querySelector('.summary-value').textContent = `$${summary.toFixed(2)}`;
    }
    if (document.querySelector('.units-of-huquq')) {
        document.querySelector('.units-of-huquq').textContent = unitsOfHuquq.toFixed(2);
    }
    if (document.querySelector('.rounded-units')) {
        document.querySelector('.rounded-units').textContent = roundedUnits;
    }
    if (document.querySelector('.payment-owed')) {
        document.querySelector('.payment-owed').textContent = `$${huquqPaymentOwed.toFixed(2)}`;
    }
    if (document.querySelector('.remainder-due')) {
        document.querySelector('.remainder-due').textContent = `$${remainderDue.toFixed(2)}`;
    }
}

// Call the calculation function after the page loads or when data changes
calculateSummary();
