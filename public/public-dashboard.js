// Use variables passed from the server
let localSummaries = summaries; // Passed from the EJS template
let localLabels = labels; // Passed from the EJS template
let localEntries = {}; // Dynamically built from entryMap

// Initialize localEntries based on the entryMap
entryMap.forEach(entry => {
    localEntries[entry.id] = {
        category: entry.category,
        label: entry.label,
        values: entry.values.map(value => ({
            reportingDate: value.reportingDate,
            value: parseFloat(value.value) || 0,
        })),
    };
});

// Utility function to render the dashboard
function renderDashboard() {
    const tableBody = document.querySelector('.dashboard-table tbody');
    const summaryTableBody = document.querySelector('.summary-table tbody');

    // Clear existing rows
    tableBody.innerHTML = '';
    summaryTableBody.innerHTML = '';

    // Render sections for Assets, Debts, and Expenses
    ['Assets', 'Debts', 'Expenses'].forEach(category => {
        // Section row
        const sectionRow = document.createElement('tr');
        sectionRow.classList.add('section-row');
        sectionRow.innerHTML = `
            <td colspan="${localSummaries.length + 1}" class="section-title">${category}</td>
        `;
        tableBody.appendChild(sectionRow);

        // Entries for the category
        localLabels.filter(label => label.category === category).forEach(label => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    ${label.label}
                    <button 
                        class="delete-item-button" 
                        data-label-id="${label.id}" 
                        style="float: right;">
                        D
                    </button>
                </td>
                ${localSummaries.map(summary => {
                    const entry = localEntries[label.id]?.values.find(
                        v => v.reportingDate === summary.end_date
                    );
                    return `
                        <td>
                            <input 
                                type="text" 
                                value="${entry ? entry.value.toFixed(2) : '0.00'}"
                                data-label-id="${label.id}"
                                data-reporting-date="${summary.end_date}"
                                class="financial-input"
                            />
                        </td>`;
                }).join('')}
            `;
            tableBody.appendChild(row);
        });

        // Add button for adding a new label
        const addRow = document.createElement('tr');
        addRow.innerHTML = `
            <td colspan="${localSummaries.length + 1}">
                <button class="add-item-button ${category.toLowerCase()}-button">Add a New ${category}</button>
            </td>
        `;
        tableBody.appendChild(addRow);
    });

    // Render summary table rows
    const summariesHtml = localSummaries.map(summary => {
        const totalAssets = localLabels
            .filter(label => label.category === 'Assets')
            .reduce((sum, label) => {
                const entry = localEntries[label.id]?.values.find(
                    v => v.reportingDate === summary.end_date
                );
                return sum + (entry ? parseFloat(entry.value) : 0);
            }, 0);

        const totalDebts = localLabels
            .filter(label => label.category === 'Debts')
            .reduce((sum, label) => {
                const entry = localEntries[label.id]?.values.find(
                    v => v.reportingDate === summary.end_date
                );
                return sum + (entry ? parseFloat(entry.value) : 0);
            }, 0);

        const unnecessaryExpenses = localLabels
            .filter(label => label.category === 'Expenses')
            .reduce((sum, label) => {
                const entry = localEntries[label.id]?.values.find(
                    v => v.reportingDate === summary.end_date
                );
                return sum + (entry ? parseFloat(entry.value) : 0);
            }, 0);

        const goldRate = summary.gold_rate || 0;
        const wealthTaxed = summary.wealth_already_taxed || 0;
        const wealthBeingTaxed =
            totalAssets - totalDebts + unnecessaryExpenses - wealthTaxed;

        const unitsOfHuquq = goldRate > 0 ? wealthBeingTaxed / goldRate : 0;
        const roundedUnits = Math.floor(unitsOfHuquq);
        const huquqPaymentOwed = 0.19 * roundedUnits * goldRate;
        const huquqPaymentsMade = summary.huquq_payments_made || 0;
        const remainderDue = huquqPaymentOwed - huquqPaymentsMade;

        return `
            <tr>
                <td>Total Assets:</td>
                <td>${totalAssets.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Total Debts:</td>
                <td>${totalDebts.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Unnecessary Expenses:</td>
                <td>${unnecessaryExpenses.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Wealth Being Taxed Today:</td>
                <td>${wealthBeingTaxed.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Units of Huquq:</td>
                <td>${unitsOfHuquq.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Rounded Units:</td>
                <td>${roundedUnits}</td>
            </tr>
            <tr>
                <td>Huquq Payment Owed:</td>
                <td>${huquqPaymentOwed.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Huquq Payments Made:</td>
                <td>${huquqPaymentsMade.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Remainder Due:</td>
                <td>${remainderDue.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    summaryTableBody.innerHTML = summariesHtml;
}

// Add a new reporting period
document.querySelector('.add-year-button').addEventListener('click', () => {
    const endDate = prompt('Enter the end date for the new reporting period (YYYY-MM-DD):');
    if (endDate) {
        localSummaries.push({
            id: localSummaries.length + 1,
            end_date: endDate,
            total_assets: 0,
            total_debts: 0,
            unnecessary_expenses: 0,
            wealth_already_taxed: 0,
            gold_rate: 0,
            huquq_payments_made: 0,
        });
        renderDashboard();
    }
});

// Add a new label
document.querySelector('.dashboard-table').addEventListener('click', event => {
    if (event.target.classList.contains('add-item-button')) {
        const category = event.target.classList.contains('assets-button')
            ? 'Assets'
            : event.target.classList.contains('debts-button')
            ? 'Debts'
            : 'Expenses';

        const label = prompt(`Enter the label name for the new ${category}:`);
        if (label) {
            localLabels.push({
                id: localLabels.length + 1,
                category,
                label,
            });
            renderDashboard();
        }
    }
});

// Delete a label
document.querySelector('.dashboard-table').addEventListener('click', event => {
    if (event.target.classList.contains('delete-item-button')) {
        const labelId = parseInt(event.target.dataset.labelId, 10);
        localLabels = localLabels.filter(label => label.id !== labelId);
        delete localEntries[labelId];
        renderDashboard();
    }
});

// Initial rendering
renderDashboard();

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
