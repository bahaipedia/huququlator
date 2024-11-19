/* Handle "Add a New Asset/Debt/Expense" */
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

/* Handle adding a new reporting period */
document.querySelector('.add-year-button').addEventListener('click', () => {
    const endDate = prompt('Enter the end date for the new reporting period (YYYY-MM-DD):');
    if (endDate) {
        fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ end_date: endDate }),
        })
            .then((response) => response.json())
            .then((data) => {
                alert('New reporting period added successfully!');
                location.reload(); // Reload to reflect the new column
            })
            .catch((err) => {
                console.error('Error adding reporting period:', err);
                alert('Failed to add the reporting period.');
            });
    }
});

/* Handle Inline Editing */
document.querySelectorAll('.dashboard-table input').forEach(input => {
    input.addEventListener('change', () => {
        const entryId = input.dataset.id; // Assume each input has a data-id attribute
        const newValue = parseFloat(input.value);

        fetch(`/api/entries/${entryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: newValue })
        })
            .then(response => response.json())
            .then(data => {
                alert('Entry updated successfully!');
            })
            .catch(err => {
                console.error('Error updating entry:', err);
                alert('Failed to update the entry.');
            });
    });
});

/* Handle Huquq Payments */
const huquqInput = document.querySelector('.summary-table input');
if (huquqInput) {
    huquqInput.addEventListener('change', () => {
        const summaryId = document.querySelector('.summary-table').dataset.summaryId; // Assume summary ID is stored in the table
        const huquqPaymentsMade = parseFloat(huquqInput.value);

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
    });
}

/* Display Summary Calculations */
function calculateSummary() {
    const totalAssets = parseFloat(document.querySelector('.total-assets').textContent) || 0;
    const totalDebts = parseFloat(document.querySelector('.total-debts').textContent.replace(/[()]/g, '')) || 0;
    const unnecessaryExpenses = parseFloat(document.querySelector('.unnecessary-expenses').textContent) || 0;
    const wealthAlreadyTaxed = parseFloat(document.querySelector('.wealth-already-taxed input').value) || 0;
    const goldRate = parseFloat(document.querySelector('.gold-rate').textContent) || 0;

    const summary = totalAssets - totalDebts + unnecessaryExpenses - wealthAlreadyTaxed;
    const unitsOfHuquq = summary / goldRate;
    const roundedUnits = Math.floor(unitsOfHuquq);
    const huquqPaymentOwed = 0.19 * (roundedUnits * goldRate);
    const huquqPaymentsMade = parseFloat(document.querySelector('.huquq-payments-made input').value) || 0;
    const remainderDue = huquqPaymentOwed - huquqPaymentsMade;

    document.querySelector('.summary-value').textContent = `$${summary.toFixed(2)}`;
    document.querySelector('.units-of-huquq').textContent = unitsOfHuquq.toFixed(2);
    document.querySelector('.rounded-units').textContent = roundedUnits;
    document.querySelector('.payment-owed').textContent = `$${huquqPaymentOwed.toFixed(2)}`;
    document.querySelector('.remainder-due').textContent = `$${remainderDue.toFixed(2)}`;
}

// Call the calculation function after the page loads or when data changes
calculateSummary();
