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
            .then(data => {
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
            .then(data => {
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
                    location.reload();
                })
                .catch(err => {
                    console.error(`Error adding ${category.toLowerCase()} label:`, err);
                    alert(`Failed to add the ${category.toLowerCase()} label. Please try again.`);
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

document.addEventListener('DOMContentLoaded', () => {
    // Select all financial input fields on the page
    const inputs = document.querySelectorAll('.financial-input');

    inputs.forEach((input, index) => {
        // Step 1: Clear value when clicking on "0.00"
        input.addEventListener('focus', () => {
            if (input.value === '0.00') {
                input.value = ''; // Clear the value to make it easier for the user to type
            }
        });

        // Step 2: Restore "0.00" if the user leaves it empty
        input.addEventListener('blur', () => {
            if (input.value.trim() === '') {
                input.value = '0.00'; // Restore the value if the input is left empty
            }

            // Auto-save value on blur
            const labelId = input.dataset.labelId;
            const reportingDate = input.dataset.reportingDate;
            const newValue = parseFloat(input.value) || 0;

            // Only make a save request if the new value is different from the initial value
            if (newValue !== parseFloat(input.dataset.originalValue)) {
                fetch(`/api/entries/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        label_id: labelId,
                        reporting_date: reportingDate,
                        value: newValue,
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(() => {
                    console.log('Value saved successfully.');
                    // Refresh summary section to reflect updated values
                    refreshSummary();
                })
                .catch(err => {
                    console.error('Error saving value:', err);
                    alert('Failed to save the value. Please try again.');
                });
            }
        });

        // Step 3: Handle "tab" to move down to the next input
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                event.preventDefault(); // Prevent the default browser tabbing behavior
                let nextIndex = (index + 1) % inputs.length;
                inputs[nextIndex].focus();
            }
        });
    });
});

// Function to refresh the summary section
function refreshSummary() {
    fetch('/api/summary')
        .then(response => response.json())
        .then(data => {
            // Assuming you have a function to update the summary section with new data
            updateSummarySection(data.summaries);
        })
        .catch(err => {
            console.error('Error refreshing summary:', err);
        });
}

function updateSummarySection(summaries) {
    // Update the summary section based on the returned data
    // Example: Loop over each summary cell and update its value
    summaries.forEach(summary => {
        const summaryElement = document.querySelector(`[data-summary-id="${summary.id}"]`);
        if (summaryElement) {
            summaryElement.textContent = summary.total; // Update with the new total
        }
    });
}
