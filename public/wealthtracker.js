document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('wealth-table');
    const addRowBtn = document.getElementById('add-row');
    const addColumnBtn = document.getElementById('add-column');

    // Add a new row
    addRowBtn.addEventListener('click', () => {
        const tbody = table.querySelector('tbody');
        const row = document.createElement('tr');
        const labelCell = document.createElement('td');
        labelCell.innerHTML = `<input type="text" placeholder="New Label" />`;
        row.appendChild(labelCell);

        // Add input cells for each existing column
        table.querySelector('thead tr').querySelectorAll('th:not(:first-child)').forEach(() => {
            const cell = document.createElement('td');
            cell.innerHTML = `<input type="text" />`;
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    // Add a new column
    addColumnBtn.addEventListener('click', () => {
        const theadRow = table.querySelector('thead tr');
        const newHeader = document.createElement('th');
        const date = prompt("Enter date for new column (YYYY-MM-DD):", new Date().toISOString().slice(0, 10));
        if (!date) return;

        newHeader.textContent = date;
        theadRow.appendChild(newHeader);

        // Add input cells for each existing row
        table.querySelector('tbody').querySelectorAll('tr').forEach(row => {
            const cell = document.createElement('td');
            cell.innerHTML = `<input type="text" />`;
            row.appendChild(cell);
        });
    });
});
