document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('wealth-table');
    const addRowBtn = document.getElementById('add-row');
    const addColumnBtn = document.getElementById('add-column');
    let columnCount = 0;
    let rowCount = 0;

    // Add a new row
    addRowBtn.addEventListener('click', () => {
        const tbody = table.querySelector('tbody');
        const row = document.createElement('tr');
        const labelCell = document.createElement('td');
        labelCell.innerHTML = `<input type="text" id="label-${rowCount}" placeholder="Label ${rowCount + 1}" />`;
        row.appendChild(labelCell);

        for (let i = 0; i < columnCount; i++) {
            const cell = document.createElement('td');
            cell.innerHTML = `<input type="text" id="cell-${rowCount}-${i}" />`;
            row.appendChild(cell);
        }

        tbody.appendChild(row);
        rowCount++;
    });

    // Add a new column
    addColumnBtn.addEventListener('click', () => {
        const theadRow = table.querySelector('thead tr');
        const newHeader = document.createElement('th');
        newHeader.textContent = `Column ${columnCount + 1}`;
        theadRow.appendChild(newHeader);

        const tbody = table.querySelector('tbody');
        tbody.querySelectorAll('tr').forEach((row, rowIndex) => {
            const cell = document.createElement('td');
            cell.innerHTML = `<input type="text" id="cell-${rowIndex}-${columnCount}" />`;
            row.appendChild(cell);
        });

        columnCount++;
    });
});
