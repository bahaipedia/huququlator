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
                    alert('Year deleted successfully!');
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
document.querySelectorAll('.add-item-button').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.classList.contains('asset-button')
            ? 'Assets'
            : button.classList.contains('debt-button')
            ? 'Debts'
            : 'Expenses';

        const buttonRow = button.closest('tr');
        const newRow = document.createElement('tr');

        newRow.innerHTML = `
            <td>
                <input type="text" placeholder="Label" class="new-item-label" />
            </td>
            <td>
                <input 
                    type="number" 
                    placeholder="Value" 
                    value="0.00" 
                    class="new-item-value" 
                />
                <button class="save-item-button">Save</button>
            </td>
        `;

        buttonRow.parentNode.insertBefore(newRow, buttonRow);

        // Save button logic remains the same
        newRow.querySelector('.save-item-button').addEventListener('click', () => {
            const label = newRow.querySelector('.new-item-label').value.trim();
            const value = parseFloat(newRow.querySelector('.new-item-value').value);

            if (!label) {
                alert('Please enter a valid label.');
                return;
            }

            const reportingDateRaw = button.closest('.dashboard-table-wrapper')
                .querySelector('thead th:nth-child(2)')
                .dataset.date;

            const reportingDate = new Date(reportingDateRaw).toISOString().split('T')[0];

            fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    label,
                    value,
                    reporting_date: reportingDate
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(() => {
                    location.reload();
                })
                .catch(err => {
                    console.error(`Error adding ${category.toLowerCase()}:`, err);
                    alert(`Failed to add the ${category.toLowerCase()}. Please try again.`);
                });
        });
    });
});

// Handle Deleting an Asset, Debt, or Expense
document.querySelector('.dashboard-table').addEventListener('click', (event) => {
    // Handle deleting an item
    if (event.target.classList.contains('delete-item-button')) {
        const entryId = event.target.dataset.id;

        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        fetch(`/api/entries/${entryId}`, {
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

                // Recalculate totals dynamically
                calculateTotals();
            })
            .catch(err => {
                console.error('Error deleting entry:', err);
                alert('Failed to delete the entry.');
            });
    }

    // Handle saving a new item
    if (event.target.classList.contains('save-item-button')) {
        const newRow = event.target.closest('tr');
        const label = newRow.querySelector('.new-item-label').value.trim();
        const value = parseFloat(newRow.querySelector('.new-item-value').value) || 0;
        const category = newRow.closest('tbody').querySelector('.section-title').textContent.trim();
        const reportingDateRaw = newRow.closest('.dashboard-table-wrapper').querySelector('thead th:nth-child(2)').dataset.date;
        const reportingDate = new Date(reportingDateRaw).toISOString().split('T')[0];

        if (!label) {
            alert('Please enter a valid label.');
            return;
        }

        fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                label,
                value,
                reporting_date: reportingDate
            }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Dynamically set the new data-id and update the row
                newRow.querySelector('.new-item-value').dataset.id = data.id;
                newRow.querySelector('.save-item-button').remove(); // Remove the save button
                console.log('New entry created successfully:', data);

                // Recalculate totals dynamically
                calculateTotals();
            })
            .catch(err => {
                console.error('Error saving new item:', err);
                alert('Failed to save the new item.');
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
        totalAssets += parseFloat(input.value) || 0;
    });
    document.querySelectorAll('.debt-input').forEach(input => {
        totalDebts += parseFloat(input.value) || 0;
    });
    document.querySelectorAll('.expense-input').forEach(input => {
        totalExpenses += parseFloat(input.value) || 0;
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
        const entryId = event.target.dataset.id;
        const newValue = parseFloat(event.target.value);

        // Ensure valid numeric input
        if (isNaN(newValue)) {
            alert('Please enter a valid number.');
            event.target.value = '0.00'; // Reset to default if invalid
            return;
        }

        if (!entryId) {
            console.warn('New entry detected. Save manually to backend.');
            return;
        }

        // Send updated value to the backend for existing entries
        fetch(`/api/entries/${entryId}`, {
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
                console.log('Entry updated successfully!');
                calculateTotals(); // Recalculate totals after successful update
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
