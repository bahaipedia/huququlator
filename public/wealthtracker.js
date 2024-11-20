document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('wealth-table');
    const addColumnBtn = document.getElementById('add-column');

    // Add a new column
    addColumnBtn.addEventListener('click', () => {
        const theadRow = table.querySelector('thead tr');
        const newHeader = document.createElement('th');

        // Prompt user for a date for the new column
        const date = prompt("Enter date for new column (YYYY-MM-DD):", new Date().toISOString().slice(0, 10));
        if (!date) return;

        // Add the new column header
        newHeader.textContent = date;
        theadRow.appendChild(newHeader);

        // Add a new input cell for each row in the body
        table.querySelector('tbody').querySelectorAll('tr').forEach(row => {
            // Skip section header rows
            if (row.querySelector('th') && row.children.length === 1) return;

            const labelId = row.querySelector('td')?.getAttribute('data-label-id'); // Use a custom attribute to identify rows
            const cell = document.createElement('td');
            cell.innerHTML = `<input type="text" id="cell-${labelId}_${date}" />`;
            row.appendChild(cell);
        });
    });

    // Add a new row for a specific category
    function addRow(category) {
        const tbody = table.querySelector('tbody');
        const section = Array.from(tbody.children).find(row =>
            row.querySelector('th')?.textContent === category
        );

        const newRow = document.createElement('tr');
        const labelCell = document.createElement('td');
        labelCell.innerHTML = `<input type="text" placeholder="New ${category} Label" />`;
        newRow.appendChild(labelCell);

        // Add empty cells for all existing columns
        table.querySelector('thead tr').querySelectorAll('th:not(:first-child)').forEach(header => {
            const date = header.textContent;
            const cell = document.createElement('td');
            cell.innerHTML = `<input type="text" id="cell-new_${date}" />`;
            newRow.appendChild(cell);
        });

        section.parentNode.insertBefore(newRow, section.nextSibling);
    }

    document.getElementById('add-asset').addEventListener('click', () => addRow('Assets'));
    document.getElementById('add-debt').addEventListener('click', () => addRow('Debts'));
    document.getElementById('add-expense').addEventListener('click', () => addRow('Expenses'));
});
