// Add a new reporting period when the user selects a date
function addNewYearColumn(event) {
    const endDate = event.target.value;

    // Validate the selected date
    if (!endDate) {
        return; // Exit if no date is provided
    }

    // Check if the date already exists
    if (summaries.some(summary => summary.end_date === endDate)) {
        return; // Exit if the date already exists
    }

    // Add the new reporting period to the summaries array
    summaries.push({
        id: Date.now(), // Generate a unique ID
        end_date: endDate,
        total_assets: 0,
        total_debts: 0,
        unnecessary_expenses: 0,
        wealth_already_taxed: 0,
        gold_rate: 0,
        huquq_payments_made: 0,
    });

    // Re-render the table to include the new column
    renderTable();

    // Clear the input value
    event.target.value = '';
}

document.querySelector('.add-year-button').addEventListener('click', () => {
    const endDate = prompt('Enter the end date for the new reporting period (YYYY-MM-DD):');
    if (!endDate) {
        alert('Please select a valid date.');
        return;
    }

    if (summaries.some(summary => summary.end_date === endDate)) {
        alert('This date already exists.');
        return;
    }

    // Simulate adding the new reporting period locally
    summaries.push({
        id: Date.now(), // Generate unique ID
        end_date: endDate,
        total_assets: 0,
        total_debts: 0,
        unnecessary_expenses: 0,
        wealth_already_taxed: 0,
        gold_rate: 0,
        huquq_payments_made: 0,
    });

    // Enable previously disabled inputs
    const tableBody = document.querySelector('.dashboard-table tbody');
    const newInputs = tableBody.querySelectorAll('input[data-editable="false"]');
    newInputs.forEach(input => {
        input.disabled = false;
        input.setAttribute('data-editable', 'true');
    });

    renderTable(); // Update the UI to include the new column
});

// Render the updated table
function renderTable() {
    const tableHead = document.querySelector('.dashboard-table thead tr');
    const tableBody = document.querySelector('.dashboard-table tbody');

    // Update the table header
    tableHead.innerHTML = `
        <th>Accounts</th>
        ${summaries.map(summary => `
            <th data-date="${summary.end_date}">
                ${new Date(summary.end_date).toISOString().split('T')[0]}
                <button class="delete-year-button" data-entry-id="${summary.id}">Delete</button>
            </th>
        `).join('')}
        <th>
            <input 
                type="date" 
                class="new-year-input" 
                placeholder="Select a reporting date" 
                onchange="addNewYearColumn(event)" 
            />
        </th>
    `;

    // Clear and re-render body rows for Assets, Debts, and Expenses
    tableBody.innerHTML = ''; // Clear existing rows
    ['Assets', 'Debts', 'Expenses'].forEach(category => {
        const categoryEntries = entryMap.filter(entry => entry.category === category);

        tableBody.innerHTML += `
            <tr class="section-row">
                <td colspan="${summaries.length + 2}" class="section-title">${category}</td>
            </tr>
            ${categoryEntries.map(entry => `
                <tr>
                    <td>
                        ${entry.label}
                        <button class="delete-item-button" data-label-id="${entry.id}">D</button>
                    </td>
                    ${summaries.map(summary => `
                        <td>
                            <input 
                                type="text" 
                                class="financial-input" 
                                data-label-id="${entry.id}" 
                                data-reporting-date="${summary.end_date}" 
                                value="${entry.values.find(v => v.reportingDate === summary.end_date)?.value || '0.00'}" 
                            />
                        </td>
                    `).join('')}
                </tr>
            `).join('')}
            <tr>
                <td colspan="${summaries.length + 2}">
                    <button class="add-item-button ${category.toLowerCase()}-button">Add a New ${category.slice(0, -1)}</button>
                </td>
            </tr>
        `;
    });
}

// Delete a Reporting Period
document.querySelector('.dashboard-table').addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-year-button')) {
        const entryId = event.target.dataset.entryId;

        if (confirm('Are you sure you want to delete this year? This action cannot be undone.')) {
            // Simulate deletion by removing the entry from summaries
            summaries = summaries.filter(summary => summary.id !== parseInt(entryId, 10));

            // Re-render the table to reflect changes
            renderTable();
            alert('Reporting period deleted.');
        }
    }
});

// Add a New Asset, Debt, or Expense
document.querySelectorAll('.add-item-button').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.classList.contains('asset-button')
            ? 'Assets'
            : button.classList.contains('debt-button')
            ? 'Debts'
            : 'Expenses';

        const buttonRow = button.closest('tr');
        const newRow = document.createElement('tr');

        // Temporary row for adding a new label
        newRow.innerHTML = `
            <td>
                <input type="text" placeholder="Label" class="new-item-label" />
                <button class="save-item-button">Save</button>
            </td>
            ${summaries.map(() => `
                <td>
                    <input type="number" value="0.00" disabled />
                </td>
            `).join('')}
        `;

        buttonRow.parentNode.insertBefore(newRow, buttonRow);

        // Handle saving the new label
        newRow.querySelector('.save-item-button').addEventListener('click', () => {
            const label = newRow.querySelector('.new-item-label').value.trim();

            if (!label) {
                alert('Please enter a valid label.');
                return;
            }

            // Add the new label locally
            entryMap.push({
                id: Date.now(),
                category,
                label,
                values: summaries.map(summary => ({
                    reportingDate: summary.end_date,
                    value: 0,
                })),
            });

            // Re-render the table or dynamically update rows
            renderTable();
            alert(`${category} label added successfully!`);
        });
    });
});

// Delete an Asset, Debt, or Expense
document.querySelector('.dashboard-table').addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-item-button')) {
        const labelId = event.target.dataset.labelId;

        if (confirm('Are you sure you want to delete this label and all associated entries?')) {
            // Simulate deletion by removing the label from entryMap
            entryMap = entryMap.filter(entry => entry.id !== parseInt(labelId, 10));

            // Re-render the table to reflect changes
            renderTable();
            alert('Label deleted successfully.');
        }
    }
});

// Handle financial input updates
document.querySelectorAll('.financial-input').forEach(input => {
    input.addEventListener('blur', (event) => {
        const inputElement = event.target;
        const value = inputElement.value.trim();
        const labelId = inputElement.dataset.labelId;
        const reportingDate = inputElement.dataset.reportingDate;

        // Find the entry and update its value locally
        const entry = entryMap.find(entry => entry.id === parseInt(labelId, 10));
        if (entry) {
            const valueEntry = entry.values.find(v => v.reportingDate === reportingDate);
            if (valueEntry) {
                valueEntry.value = parseFloat(value) || 0;
            }
        }

        // Optionally recalculate summaries here
    });
});

