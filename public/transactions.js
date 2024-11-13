// Function to categorize transactions as necessary or unnecessary via AJAX
async function categorizeTransaction(transactionId, necessity) {
    try {
        const response = await fetch(`/transactions/categorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId, necessity })
        });

        if (response.ok) {
            const updatedTransaction = await response.json();
            const pageIndicator = document.getElementById('page-indicator').value;

            // If on the Unnecessary Expenses page and "Remove" was clicked
            if (pageIndicator === 'unnecessary-expenses' && necessity) {
                // Remove the transaction row from the table on the Unnecessary Expenses page
                document.getElementById(`transaction-${transactionId}`).remove();
            } else {
                // Update the "Actions" cell to show the correct button based on the necessity status
                const actionsCell = document.getElementById(`actions-${transactionId}`);
                if (actionsCell) {
                    actionsCell.innerHTML = necessity
                        ? `<button onclick="categorizeTransaction(${transactionId}, false)">Mark as Unnecessary</button>`
                        : `<button onclick="categorizeTransaction(${transactionId}, true)">Undo</button>`;
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

// Function to apply filter and mark transactions based on criteria
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
                action: filterAction
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
