document.addEventListener('DOMContentLoaded', () => {
    const table = document.getElementById('wealth-table');

    // Add new label for a category
    function addLabel(category) {
        const tbody = table.querySelector('tbody');
        const section = Array.from(tbody.children).find(row =>
            row.querySelector('th')?.textContent === category
        );
        const newRow = document.createElement('tr');
        const labelCell = document.createElement('td');
        labelCell.innerHTML = `<input type="text" placeholder="New ${category} Label" />`;
        newRow.appendChild(labelCell);

        // Add empty cells for all dates
        table.querySelector('thead tr').querySelectorAll('th:not(:first-child)').forEach(() => {
            const cell = document.createElement('td');
            cell.innerHTML = `<input type="text" />`;
            newRow.appendChild(cell);
        });

        section.parentNode.insertBefore(newRow, section.nextSibling);
    }

    document.getElementById('add-asset').addEventListener('click', () => addLabel('Assets'));
    document.getElementById('add-debt').addEventListener('click', () => addLabel('Debts'));
    document.getElementById('add-expense').addEventListener('click', () => addLabel('Expenses'));
});
