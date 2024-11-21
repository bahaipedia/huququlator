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
    console.log('Fetching updated summary data...');
    fetch('/api/summary', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => {
            console.log('Received response from /api/summary:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const summaries = data.summaries;
            console.log('Fetched summaries:', summaries);

            // Update the summary table rows dynamically
            summaries.forEach(summary => {
                const formattedEndDate = new Date(summary.end_date).toISOString().split('T')[0]; // Format as YYYY-MM-DD
                console.log('Processing summary:', summary);

                const totalAssetsCell = document.querySelector(`.total-assets[data-end-date="${formattedEndDate}"]`);
                const totalDebtsCell = document.querySelector(`.total-debts[data-end-date="${formattedEndDate}"]`);
                const unnecessaryExpensesCell = document.querySelector(`.unnecessary-expenses[data-end-date="${formattedEndDate}"]`);

                console.log('Cells:', {
                    totalAssetsCell,
                    totalDebtsCell,
                    unnecessaryExpensesCell,
                });

                // Only update if the corresponding cell exists in the DOM
                if (totalAssetsCell) {
                    console.log(`Updating total assets for ${formattedEndDate}:`, summary.total_assets);
                    totalAssetsCell.textContent = summary.total_assets ? parseFloat(summary.total_assets).toFixed(2) : '0.00';
                }
                if (totalDebtsCell) {
                    console.log(`Updating total debts for ${formattedEndDate}:`, summary.total_debts);
                    totalDebtsCell.textContent = summary.total_debts ? parseFloat(summary.total_debts).toFixed(2) : '0.00';
                }
                if (unnecessaryExpensesCell) {
                    console.log(`Updating unnecessary expenses for ${formattedEndDate}:`, summary.unnecessary_expenses);
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

// Automatically save wealth-already-taxed values and refresh the summary
document.querySelectorAll('.wealth-already-taxed').forEach(input => {
    if (!input.disabled) { // Ensure only enabled input can trigger updates
        input.addEventListener('blur', (event) => {
            const inputElement = event.target;
            const value = inputElement.value.trim();
            const endDate = inputElement.dataset.endDate;

            console.log('Input blur triggered:');
            console.log('Input element:', inputElement);
            console.log('Input value:', value);
            console.log('End date from dataset:', endDate);

            // Validate input
            if (!isNaN(value) && value !== '') {
                console.log('Validated input. Sending fetch request to update /api/summary/update...');
                fetch(`/api/summary/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value, end_date: endDate }),
                })
                    .then(response => {
                        console.log('Fetch response received:', response);
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Fetch successful. Response data:', data);
                        updateSummaryTable();
                    })
                    .catch(err => {
                        console.error('Error updating wealth already taxed:', err);
                        alert('Failed to update the value. Please try again.');
                    });
            } else {
                console.warn('Invalid input detected. Resetting to 0.00');
                inputElement.value = '0.00'; // Restore default value on invalid input
            }
        });
    }
});


