// Function to categorize transactions via AJAX
async function categorizeTransaction(transactionId, status) {
    try {
        const response = await fetch(`/transactions/categorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId, status })
        });

        if (response.ok) {
            const updatedTransaction = await response.json();
            const pageIndicator = document.getElementById('page-indicator').value;

            // Remove the transaction row if it's marked unnecessary on the "Unnecessary Expenses" page
            if (pageIndicator === 'unnecessary-expenses' && status === 'ne') {
                document.getElementById(`transaction-${transactionId}`).remove();
            } else {
                // Update the "Actions" cell to show the correct button based on the status
                const actionsCell = document.getElementById(`actions-${transactionId}`);
                if (actionsCell) {
                    actionsCell.innerHTML = status === 'ne'
                        ? `<button onclick="categorizeTransaction(${transactionId}, 'un')">Mark as Unnecessary</button>`
                        : `<button onclick="categorizeTransaction(${transactionId}, 'ne')">Undo</button>`;
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
