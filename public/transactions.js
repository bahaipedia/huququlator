// Function to categorize transactions via AJAX
async function categorizeTransaction(transactionId, status) {
    try {
        const response = await fetch(`/transactions/categorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId, status })
        });

        if (response.ok) {
            // Check if the page is in preview mode by looking for the 'Cancel' button
            const isPreviewMode = document.getElementById('cancelButton').style.display === 'inline';

            if (isPreviewMode) {
                // Re-run the preview filter to refresh the list
                previewFilter();
            } else {
                // Otherwise, remove the transaction row from the table in regular mode
                const transactionRow = document.getElementById(`transaction-${transactionId}`);
                if (transactionRow) {
                    transactionRow.remove();
                }
            }
        } else {
            alert('Error updating transaction. Please try again.');
        }
    } catch (error) {
        console.error('Error categorizing transaction:', error);
        alert('An error occurred. Please try again.');
    }
}

// Function to preview transactions based on filter criteria
async function previewFilter() {
    const filterField = document.getElementById("filterField").value;
    const filterValue = document.getElementById("filterValue").value;
    const pageIndicator = document.getElementById("page-indicator").value;

    // Retrieve date range from localStorage
    const startDate = localStorage.getItem("startDate") || null;
    const endDate = localStorage.getItem("endDate") || null;
    
    // Convert pageIndicator to status for filtering
    let status;
    switch (pageIndicator) {
        case 'necessary-expenses':
            status = 'ne';
            break;
        case 'unnecessary-expenses':
            status = 'un';
            break;
        case 'hidden':
            status = 'hi';
            break;
        default:
            console.error(`Unrecognized page indicator: ${pageIndicator}`);
            alert('Error: Unrecognized page. Please try again or contact support.');
            return;  // Exit the function without proceeding
    }

    try {
        const response = await fetch('/transactions/preview-filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: filterField, value: filterValue, status: status, startDate: startDate, endDate: endDate })
        });

        if (response.ok) {
            const previewTransactions = await response.json();

            // Render the preview transactions in place of the full list
            renderTransactionList(previewTransactions);
            document.getElementById('previewButton').style.display = 'none';
            document.getElementById('cancelButton').style.display = 'inline';
        } else {
            alert('Error fetching preview. Please try again.');
        }
    } catch (error) {
        console.error('Error previewing filter:', error);
        alert('An error occurred. Please try again.');
    }
}

// Function to cancel the preview and show the original list
function cancelPreview() {
    location.reload(); // Reload the original transaction list from the server
}

// Function to apply filter and mark transactions based on criteria using status
async function applyFilter() {
    const filterField = document.getElementById("filterField").value;
    const filterValue = document.getElementById("filterValue").value;
    const filterAction = document.getElementById("filterAction").value;
    const originStatus = document.getElementById('page-indicator').value;
    const pageIndicator = document.getElementById('page-indicator').value;
    const pageContext = {
    'necessary-expenses': 'Necessary Expenses',
    'unnecessary-expenses': 'Unnecessary Expenses',
    'hidden': 'Hidden Transactions'
     };
    const currentPage = pageContext[pageIndicator] || 'Unknown Page';

    try {
        const response = await fetch('/transactions/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                field: filterField,
                value: filterValue,
                action: filterAction,
                originStatus
            })
        });

        if (response.ok) {
            // After applying the filter, prompt to save the rule
            document.getElementById('saveRulePrompt').style.display = 'block';
            document.getElementById('saveRulePrompt').innerHTML = `
                <p>Would you like all future ${filterField} transactions matching "${filterValue}" on the ${currentPage} page to be marked as ${filterAction}?</p>
                <button onclick="saveFilterRule()">Yes</button>
                <button onclick="document.getElementById('saveRulePrompt').style.display = 'none'">No</button>
            `;
        } else {
            alert('Error applying filter. Please try again.');
        }
    } catch (error) {
        console.error('Error applying filter:', error);
        alert('An error occurred. Please try again.');
    }
}

// Function to save filters for the user
async function saveFilterRule() {
    const filterField = document.getElementById("filterField").value;
    const filterValue = document.getElementById("filterValue").value;
    const filterAction = document.getElementById("filterAction").value;
    const pageIndicator = document.getElementById('page-indicator').value;

    // Convert pageIndicator to originStatus
    let originStatus;
    switch (pageIndicator) {
        case 'necessary-expenses':
            originStatus = 'ne';
            break;
        case 'unnecessary-expenses':
            originStatus = 'un';
            break;
        case 'hidden':
            originStatus = 'hi';
            break;
        default:
            console.error('Unrecognized page indicator:', pageIndicator);
            return; // Exit if page indicator is unrecognized
    }
    
    try {
        const response = await fetch('/filter-rules/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                field: filterField,
                value: filterValue,
                action: filterAction,
                originStatus: originStatus
            })
        });

        if (response.ok) {
            document.getElementById('saveRulePrompt').style.display = 'none';
            alert('Filter rule saved successfully!');
        } else {
            alert('Error saving filter rule. Please try again.');
        }
    } catch (error) {
        console.error('Error saving filter rule:', error);
        alert('An error occurred. Please try again.');
    }
}

// Helper function to render transactions in the table
function renderTransactionList(transactions) {
    const tableBody = document.querySelector('tbody');
    const pageIndicator = document.getElementById('page-indicator').value;
    tableBody.innerHTML = ''; // Clear existing rows

    transactions.forEach(transaction => {
        const formattedDate = new Date(transaction.date).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
        const formattedTags = transaction.tags || ''; // Display empty string if tags are null

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${transaction.account}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td>${formattedTags}</td>
            <td>${transaction.amount}</td>
            <td id="actions-${transaction.id}">
                ${generateActionButtons(transaction.id, pageIndicator)}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Fucntion to apply a date filter to the transactions page
async function applyDateFilter() {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (startDate && endDate) {
        // Save dates to localStorage
        localStorage.setItem("startDate", startDate);
        localStorage.setItem("endDate", endDate);

        // Redirect to apply filter
        window.location.href = `/transactions?startDate=${startDate}&endDate=${endDate}`;
    } else {
        alert("Please select both start and end dates.");
    }
}

function clearDateFilter() {
    localStorage.removeItem("startDate");
    localStorage.removeItem("endDate");
    window.location.href = '/transactions';
}

// Initialize date fields from localStorage if available
document.addEventListener("DOMContentLoaded", () => {
    const startDate = localStorage.getItem("startDate");
    const endDate = localStorage.getItem("endDate");

    const startDateField = document.getElementById("startDate");
    const endDateField = document.getElementById("endDate");

    if (startDateField && startDate) startDateField.value = startDate;
    if (endDateField && endDate) endDateField.value = endDate;
});

// Function to redirect to a page while including the date filter as query parameters
function redirectToPageWithDateFilter(pagePath) {
    const startDate = localStorage.getItem('startDate');
    const endDate = localStorage.getItem('endDate');

    let url = pagePath;
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    window.location.href = url;
}

// Use this function when navigating to other pages
document.getElementById('unnecessaryLink').addEventListener('click', () => {
    redirectToPageWithDateFilter('/transactions/unnecessary');
});
document.getElementById('hiddenLink').addEventListener('click', () => {
    redirectToPageWithDateFilter('/transactions/hidden');
});

// Helper function to generate action buttons based on the page
function generateActionButtons(transactionId, pageIndicator) {
    switch (pageIndicator) {
        case 'necessary-expenses':
            return `
                <button onclick="categorizeTransaction(${transactionId}, 'un')">Unnecessary</button>
                <button onclick="categorizeTransaction(${transactionId}, 'hi')">Hidden</button>
            `;
        case 'unnecessary-expenses':
            return `
                <button onclick="categorizeTransaction(${transactionId}, 'ne')">Necessary</button>
                <button onclick="categorizeTransaction(${transactionId}, 'hi')">Hidden</button>
            `;
        case 'hidden':
            return `
                <button onclick="categorizeTransaction(${transactionId}, 'ne')">Necessary</button>
                <button onclick="categorizeTransaction(${transactionId}, 'un')">Unnecessary</button>
            `;
        default:
            return ''; // No action buttons if the page indicator is unrecognized
    }
}
