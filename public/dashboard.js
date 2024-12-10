/* Add a New Reporting Period */
document.querySelector('.add-year-button').addEventListener('click', () => {
    const endDate = prompt('Enter the end date for the new reporting period (YYYY-MM-DD):');
    if (endDate) {
        // Step 1: Add a new reporting period to financial_summary
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
            .then(() => {
                // Step 2: Add financial entries for each label for the new reporting period
                return fetch('/api/entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reporting_date: endDate }),
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
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
        // Disable the add button immediately when clicked
        button.disabled = true;

        const category = button.classList.contains('asset-button')
            ? 'Assets'
            : button.classList.contains('debt-button')
            ? 'Debts'
            : 'Expenses';
        const buttonRow = button.closest('tr');
        const newRow = document.createElement('tr');
        
        // Create inputs for each summary column
        const summaryInputs = summaries.map(() => `
            <td>
                <input type="number" value="0.00" class="new-item-value" />
            </td>
        `).join('');

        // Create the new row with label input and value inputs
        newRow.innerHTML = `
            <td>
                <input type="text" placeholder="Label" class="new-item-label" />
                <button class="save-item-button">Save</button>
            </td>
            ${summaryInputs}
        `;
        
        buttonRow.parentNode.insertBefore(newRow, buttonRow);
        
        // Automatically focus on the new label input
        const labelInput = newRow.querySelector('.new-item-label');
        labelInput.focus();

        // Handle saving the new label
        newRow.querySelector('.save-item-button').addEventListener('click', () => {
            const label = labelInput.value.trim();
            if (!label) {
                alert('Please enter a valid label.');
                return;
            }

            // Collect value inputs
            const valueInputs = Array.from(newRow.querySelectorAll('.new-item-value'));
            const values = valueInputs.map(input => ({
                value: input.value,
            }));

            // Disable the save button while processing
            const saveButton = newRow.querySelector('.save-item-button');
            saveButton.disabled = true;
           
            fetch('/api/labels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category,
                    label,
                    values
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
                    button.disabled = false; // Re-enable the add button if there's an error
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

// Handle focus and blur events for multiple input classes
document.querySelectorAll('.financial-input, .wealth-already-taxed, .huquq-payments-input').forEach(input => {
    // Clear "0.00" on focus
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

            // Get all inputs in the current column (same reporting_date)
            const columnInputs = Array.from(document.querySelectorAll(`.financial-input[data-reporting-date="${currentDate}"]`));

            // Find the current index of the focused input
            const currentIndex = columnInputs.findIndex(input => input === currentInput);

            let nextInput;
            if (event.shiftKey) {
                // Navigate backward with Shift+Tab
                nextInput = columnInputs[currentIndex - 1] || columnInputs[columnInputs.length - 1]; // Wrap around to the bottom
            } else {
                // Navigate forward with Tab
                nextInput = columnInputs[currentIndex + 1] || columnInputs[0]; // Wrap around to the top
            }

            if (nextInput) {
                nextInput.focus();
            }
        }
    }
});

// Automatically save financial-input values and refresh the summary
document.querySelectorAll('.financial-input').forEach(input => {
    input.addEventListener('blur', (event) => {
        const inputElement = event.target;
        let value = inputElement.value.trim();
        const labelId = inputElement.dataset.labelId;
        const reportingDate = inputElement.dataset.reportingDate;

        // Convert to positive
        if (!isNaN(value) && value !== '') {
            value = Math.abs(parseFloat(value)).toFixed(2);
            inputElement.value = value;

            // Save the corrected value to the backend
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
                    location.reload();
                })
                .catch(err => {
                    console.error('Error saving value:', err);
                    alert('Failed to save the value. Please try again.');
                });
        } else {
            inputElement.value = '0.00'; // Reset invalid values
        }
    });
});

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
                location.reload();
            })
            .catch(err => {
                console.error('Error updating summary fields:', err);
            });
    });
});

// Save Huquq payments and refresh the summary
document.querySelectorAll('.save-huquq-payments').forEach(button => {
    button.addEventListener('click', (event) => {
        const parentTd = event.target.closest('td');
        const endDate = parentTd.dataset.endDate;
        const inputElement = parentTd.querySelector('input');
        const value = inputElement ? inputElement.value.trim() : null;

        if (!value || isNaN(value)) {
            console.warn('Invalid value detected:', value);
            alert('Please enter a valid amount.');
            return;
        }

        // Send the update to the server
        fetch('/api/summary/update-huquq', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, end_date: endDate }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                location.reload();
            })
            .catch(err => {
                console.error('Error updating Huquq Payments Made:', err);
                alert('Failed to save Huquq Payments Made. Please try again.');
            });
    });
});
