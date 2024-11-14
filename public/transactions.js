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
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.account}</td>
            <td>${transaction.description}</td>
            <td>${transaction.category}</td>
            <td>${transaction.tags}</td>
            <td>${transaction.amount}</td>
            <td id="actions-${transaction.id}">
                <button onclick="categorizeTransaction(${transaction.id}, '${transaction.status === 'ne' ? 'un' : 'ne'}')">
                    ${transaction.status === 'ne' ? 'Mark as Unnecessary' : 'Mark as Necessary'}
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
