/* Add a New Reporting Period */
document.querySelector('.add-year-button').addEventListener('click', () => {
    const endDate = prompt('Enter the end date for the new reporting period (YYYY-MM-DD):');
    if (endDate) {
        fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ end_date: endDate }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                alert('New reporting period added successfully!');
                location.reload(); // Reload to reflect the new column
            })
            .catch(err => {
                console.error('Error adding reporting period:', err);
                alert('Failed to add the reporting period. Please try again later.');
            });
    }
});

// Delete a Reporting Period
document.querySelectorAll('.delete-year-button').forEach(button => {
    button.addEventListener('click', () => {
        const yearId = button.dataset.id;

        if (confirm('Are you sure you want to delete this year? This action cannot be undone.')) {
            fetch(`/api/summary/${yearId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(() => {
                    alert('Year and associated entries deleted successfully!');
                    location.reload(); // Reload to reflect changes
                })
                .catch(err => {
                    console.error('Error deleting year:', err);
                    alert('Failed to delete the year. Please try again later.');
                });
        }
    });
});

/* Add a New Asset, Debt, or Expense */
/* Add a New Asset, Debt, or Expense */
document.querySelectorAll('.add-item-button').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.classList.contains('asset-button')
            ? 'Assets'
            : button.classList.contains('debt-button')
            ? 'Debts'
            : 'Expenses';

        const buttonRow = button.closest('tr');
        const newRow = document.createElement('tr');

        // Create a new row for adding a label
        newRow.innerHTML = `
            <td>
                <input type="text" placeholder="Label" class="new-item-label" />
                <button class="save-item-button">Save</button>
            </td>
            ${summaries.map(() => `
                <td>
                    <input type="number" value="0.00" disabled />
                </td>`).join('')}
        `;

        buttonRow.parentNode.insertBefore(newRow, buttonRow);

        // Handle saving the new label
        newRow.querySelector('.save-item-button').addEventListener('click', () => {
            const label = newRow.querySelector('.new-item-label').value.trim();

            if (!label) {
                alert('Please enter a valid label.');
                return;
            }

            fetch('/api/labels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    label
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Update the row with the newly assigned label ID
                    newRow.querySelector('.new-item-label').dataset.labelId = data.labelId;
                    newRow.querySelector('.save-item-button').remove(); // Remove the save button
                    alert(`${category} label added successfully!`);
                })
                .catch(err => {
                    console.error(`Error adding ${category.toLowerCase()} label:`, err);
                    alert(`Failed to add the ${category.toLowerCase()} label. Please try again.`);
                });
        });
    });
});

// Handle Deleting an Asset, Debt, or Expense
document.querySelector('.dashboard-table').addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-item-button')) {
        const labelId = event.target.dataset.labelId;

        if (!confirm('Are you sure you want to delete this label and all associated entries?')) {
            return;
        }

        fetch(`/api/labels/${labelId}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                // Remove the row from the table
                const row = event.target.closest('tr');
                row.remove();

                alert('Label and associated entries deleted successfully!');
            })
            .catch(err => {
                console.error('Error deleting label:', err);
                alert('Failed to delete the label.');
            });
    }
});

// Function to recalculate totals dynamically
function calculateTotals() {
    let totalAssets = 0;
    let totalDebts = 0;
    let totalExpenses = 0;

    // Sum up all visible asset, debt, and expense input fields
    document.querySelectorAll('.asset-input').forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalAssets += value;
    });
    document.querySelectorAll('.debt-input').forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalDebts += value;
    });
    document.querySelectorAll('.expense-input').forEach(input => {
        const value = parseFloat(input.value) || 0;
        totalExpenses += value;
    });

    // Update the DOM for Total Assets, Debts, and Expenses
    const totalAssetsElement = document.querySelector('.total-assets');
    const totalDebtsElement = document.querySelector('.total-debts');
    const totalExpensesElement = document.querySelector('.unnecessary-expenses');

    if (totalAssetsElement) {
        totalAssetsElement.textContent = totalAssets.toFixed(2);
    }
    if (totalDebtsElement) {
        totalDebtsElement.textContent = `(${totalDebts.toFixed(2)})`;
    }
    if (totalExpensesElement) {
        totalExpensesElement.textContent = totalExpenses.toFixed(2);
    }

    // Recalculate summary and related values
    calculateSummary();
}

/* Handle Changes in the Summary Table Using Event Delegation */
document.querySelector('.summary-table').addEventListener('change', (event) => {
    if (event.target && event.target.tagName === 'INPUT') {
        const summaryId = event.target.closest('table').dataset.summaryId; // Assume summary ID is stored in the table
        const huquqPaymentsMade = parseFloat(event.target.value) || 0.00;

        fetch(`/api/summary/${summaryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ huquq_payments_made: huquqPaymentsMade }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                calculateTotals();
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
        const entryId = event.target.dataset.id;

        // Ignore inputs without a data-id (new unsaved rows)
        if (!entryId) {
            console.warn('New entry detected. Use the save button to submit it.');
            return;
        }

        // Parse the new value or default to 0.00 if empty
        const newValue = parseFloat(event.target.value) || 0.00;

        // Send updated value to the backend for existing labels
        fetch(`/api/labels/${entryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: newValue }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                calculateTotals();
            })
            .catch(err => {
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
    const adjustedSummary = summary < 0 ? 0 : summary;
    const unitsOfHuquq = adjustedSummary / goldRate;
    const roundedUnits = Math.floor(unitsOfHuquq);
    const huquqPaymentOwed = 0.19 * (roundedUnits * goldRate);
    const huquqPaymentsMade = parseFloat(document.querySelector('.huquq-payments-made input')?.value) || 0;
    const remainderDue = huquqPaymentOwed - huquqPaymentsMade;

    // Update the DOM only if the elements exist
    if (document.querySelector('.summary-value')) {
        document.querySelector('.summary-value').textContent = `$${adjustedSummary.toFixed(2)}`;
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
