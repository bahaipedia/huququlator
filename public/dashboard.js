/* Add a New Reporting Period */
document.querySelector('.add-year-button').addEventListener('click', () => {
    const endDate = prompt('Enter the end date for the new reporting period (YYYY-MM-DD):');
    if (endDate) {
        // Step 1: Add financial entries for each label for the new reporting period
        fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reporting_date: endDate }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                // Step 2: Add a new reporting period to financial_summary
                return fetch('/api/summary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ end_date: endDate }),
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                alert('New reporting period and entries added successfully!');
                location.reload(); // Reload to reflect the new column
            })
            .catch(err => {
                console.error('Error adding reporting period and entries:', err);
                alert('Failed to add the reporting period. Please try again later.');
            });
    }
});

// Delete a Reporting Period
document.querySelectorAll('.delete-year-button').forEach(button => {
    button.addEventListener('click', () => {
        const entryId = button.dataset.entryId;

        if (confirm('Are you sure you want to delete this year? This action cannot be undone.')) {
            fetch(`/api/entries/${entryId}`, {
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
                    location.reload();
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

        // Create a temporary row for adding a label
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

            // Disable the save button while processing
            const saveButton = newRow.querySelector('.save-item-button');
            saveButton.disabled = true;
           
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
                    // Reload the table to fetch the updated backend data
                    location.reload();
                })
                .catch(err => {
                    console.error(`Error adding ${category.toLowerCase()} label:`, err);
                    alert(`Failed to add the ${category.toLowerCase()} label. Please try again.`);
                    saveButton.disabled = false; // Re-enable the button if there was an error
                });
        });
    });
});

// Delete an Asset, Debt, or Expense
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
            })
            .catch(err => {
                console.error('Error deleting label:', err);
                alert('Failed to delete the label.');
            });
    }
});

// Handle focus event to clear "0.00" values
document.querySelectorAll('.financial-input').forEach(input => {
    input.addEventListener('focus', (event) => {
        if (event.target.value === '0.00') {
            event.target.value = ''; // Clear the input for easier typing
        }
    });

    // Restore "0.00" if left empty on blur
    input.addEventListener('blur', (event) => {
        if (event.target.value.trim() === '') {
            event.target.value = '0.00';
        }
    });
});

// Custom "Tab" behavior for navigating vertically
document.querySelector('.dashboard-table').addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
        const currentInput = event.target;
        if (currentInput.classList.contains('financial-input')) {
            event.preventDefault(); // Stop default tab behavior

            const currentDate = currentInput.dataset.reportingDate;
            const currentLabelId = currentInput.dataset.labelId;

            // Get all inputs in the current column (same reporting_date)
            const columnInputs = Array.from(document.querySelectorAll(`.financial-input[data-reporting-date="${currentDate}"]`));

            // Find the next input in the same column
            const currentIndex = columnInputs.findIndex(input => input === currentInput);
            const nextInput = columnInputs[currentIndex + 1] || columnInputs[0]; // Wrap around if at the bottom

            if (nextInput) {
                nextInput.focus();
            }
        }
    }
});

// Allow for automatic updates to the summary table 
function updateSummaryTable() {
    fetch('/api/summary', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const summaries = data.summaries;

            // Update the summary table rows dynamically
            summaries.forEach(summary => {
                const formattedEndDate = new Date(summary.end_date).toISOString().split('T')[0]; // Format as YYYY-MM-DD

                const totalAssetsCell = document.querySelector(`.total-assets[data-end-date="${formattedEndDate}"]`);
                const totalDebtsCell = document.querySelector(`.total-debts[data-end-date="${formattedEndDate}"]`);
                const unnecessaryExpensesCell = document.querySelector(`.unnecessary-expenses[data-end-date="${formattedEndDate}"]`);

                // Only update if the corresponding cell exists in the DOM
                if (totalAssetsCell) {
                    totalAssetsCell.textContent = summary.total_assets ? parseFloat(summary.total_assets).toFixed(2) : '0.00';
                }
                if (totalDebtsCell) {
                    totalDebtsCell.textContent = summary.total_debts ? parseFloat(summary.total_debts).toFixed(2) : '0.00';
                }
                if (unnecessaryExpensesCell) {
                    unnecessaryExpensesCell.textContent = summary.unnecessary_expenses ? parseFloat(summary.unnecessary_expenses).toFixed(2) : '0.00';
                }
            });
        })
        .catch(err => {
            console.error('Error fetching summary data:', err);
        });
}

// Automatically save financial-input values and refresh the summary
document.querySelectorAll('.financial-input').forEach(input => {
    input.addEventListener('blur', (event) => {
        const inputElement = event.target;
        const value = inputElement.value.trim();
        const labelId = inputElement.dataset.labelId;
        const reportingDate = inputElement.dataset.reportingDate;

        // Only save if the value is valid
        if (!isNaN(value) && value !== '') {
            fetch(`/api/entries/${labelId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value, reporting_date: reportingDate }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(() => {
                    updateSummaryTable(); 
                })
                .catch(err => {
                    console.error('Error saving value:', err);
                    alert('Failed to save the value. Please try again.');
                });
        } else {
            // Restore "0.00" if input is left invalid or empty
            inputElement.value = '0.00';
        }
    });
});

// Function to recalculate dependent fields after Wealth Already Taxed is updated
function recalculateSummaryFields() {
    document.querySelectorAll('.summary-value').forEach(cell => {
        const endDate = cell.getAttribute('data-end-date');
        const wealthAlreadyTaxed = parseFloat(document.querySelector(`.wealth-already-taxed[data-end-date="${endDate}"]`).value) || 0;

        const totalAssets = parseFloat(document.querySelector(`.total-assets[data-end-date="${endDate}"]`).textContent) || 0;
        const totalDebts = parseFloat(document.querySelector(`.total-debts[data-end-date="${endDate}"]`).textContent) || 0;
        const unnecessaryExpenses = parseFloat(document.querySelector(`.unnecessary-expenses[data-end-date="${endDate}"]`).textContent) || 0;
        const goldRate = parseFloat(document.querySelector(`.gold-rate[data-end-date="${endDate}"]`).textContent) || 0;

        // Update Wealth being taxed today
        const wealthBeingTaxedToday = (totalAssets - totalDebts + unnecessaryExpenses - wealthAlreadyTaxed).toFixed(2);
        document.querySelector(`.summary-value[data-end-date="${endDate}"]`).textContent = wealthBeingTaxedToday;

        // Update Units of Huquq
        const unitsOfHuquq = (goldRate > 0) ? ((totalAssets - totalDebts + unnecessaryExpenses - wealthAlreadyTaxed) / goldRate).toFixed(2) : '0.00';
        document.querySelector(`.units-of-huquq[data-end-date="${endDate}"]`).textContent = unitsOfHuquq;

        // Update Rounded Units
        const roundedUnits = Math.floor((totalAssets - totalDebts + unnecessaryExpenses - wealthAlreadyTaxed) / goldRate);
        document.querySelector(`.rounded-units[data-end-date="${endDate}"]`).textContent = roundedUnits;

        // Update Huquq Payment Owed
        const huquqPaymentOwed = (0.19 * Math.floor((totalAssets - totalDebts + unnecessaryExpenses - wealthAlreadyTaxed) / goldRate) * goldRate).toFixed(2);
        document.querySelector(`.payment-owed[data-end-date="${endDate}"]`).textContent = huquqPaymentOwed;

        // Update Remainder Due
        const huquqPaymentsMade = parseFloat(document.querySelector(`.huquq-payments-made[data-end-date="${endDate}"]`).value) || 0;
        const remainderDue = (0.19 * Math.floor((totalAssets - totalDebts + unnecessaryExpenses - wealthAlreadyTaxed) / goldRate) * goldRate - huquqPaymentsMade).toFixed(2);
        document.querySelector(`.remainder-due[data-end-date="${endDate}"]`).textContent = remainderDue;
    });
}

// Save wealth-already-taxed values and refresh the summary
document.querySelectorAll('.save-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const endDate = event.target.closest('tr').querySelector('.wealth-already-taxed').dataset.endDate;
        const value = event.target.closest('tr').querySelector('.wealth-already-taxed').value;

        // Send the update to the server
        fetch('/api/summary/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, end_date: endDate })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                recalculateSummaryFields(); // Recalculate all the fields after the update
            })
            .catch(err => {
                console.error('Error updating summary fields:', err);
            });
    });
});
