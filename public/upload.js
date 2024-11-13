// Function to handle file upload via AJAX
async function uploadTransactions(event) {
    event.preventDefault(); // Prevent form from submitting the traditional way

    const formData = new FormData(document.getElementById("uploadForm"));
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            document.getElementById('uploadMessage').innerText = 'Transactions uploaded successfully.';
            document.getElementById('uploadMessage').style.color = 'green';

            // Refresh upload history after successful upload
            await fetchUploadHistory();
        } else {
            document.getElementById('uploadMessage').innerText = 'Error uploading transactions. Please try again.';
            document.getElementById('uploadMessage').style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('uploadMessage').innerText = 'An error occurred. Please try again.';
        document.getElementById('uploadMessage').style.color = 'red';
    }
}

// Function to fetch and update the Upload History section
async function fetchUploadHistory() {
    try {
        const response = await fetch('/upload/history-data');
        const history = await response.json();

        const tableBody = document.getElementById('uploadHistoryTableBody');
        tableBody.innerHTML = '';

        history.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(record.upload_date).toISOString().split('T')[0]}</td>
                <td>${record.filename}</td>
                <td>${record.rows_imported}</td>
                <td>${record.status}</td>
                <td>
                    <form action="/upload/delete" method="POST" onsubmit="return confirm('Are you sure you want to delete this upload and its transactions?');">
                        <input type="hidden" name="uploadId" value="${record.id}">
                        <button type="submit">Delete</button>
                    </form>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching upload history:', error);
    }
}

// Function to delete all transactions via AJAX
async function deleteAllTransactions() {
    if (!confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('/transactions/delete-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            document.getElementById('uploadMessage').innerText = 'All transactions deleted successfully.';
            document.getElementById('uploadMessage').style.color = 'green';

            // Refresh the upload history after deletion
            await fetchUploadHistory();
        } else {
            alert('Error deleting transactions. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}
