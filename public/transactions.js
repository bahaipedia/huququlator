// Function to categorize transactions via AJAX
async function categorizeTransaction(transactionId, status) {
    try {
        const response = await fetch(`/transactions/categorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId, status })
        });

        if (response.ok) {
            // Remove the transaction row from the table
            document.getElementById(`transaction-${transactionId}`).remove();
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
    const filterAction = document.getElementById("filterAction").value;

    try {
        const response = await fetch('/transactions/preview-filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: filterField, value: filterValue, action: filterAction })
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

    try {
        const response = await fetch('/transactions/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                field: filterField,
                value: filterValue,
                action: filterAction  // Expecting 'ne', 'un', or 'hi' directly
            })
        });

        if (response.ok) {
            location.reload(); // Reload the page to update the displayed transactions
        } else {
            alert('Error applying filter. Please try again.');
        }
    } catch (error) {
        console.error('Error applying filter:', error);
        alert('An error occurred. Please try again.');
    }
}

// Helper function to render transactions in the table
function renderTransactionList(transactions) {
    const tableBody = document.querySelector('tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    transactions.forEach(transaction => {
        const formattedDate = new Date(transaction.date).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
        const formattedTags = transaction.tags || '';  // Display empty string if tags are null

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
