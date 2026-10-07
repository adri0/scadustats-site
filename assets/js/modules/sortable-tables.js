/*
 * Click-to-sort for tables marked `data-sortable`. Every header cell with a
 * `data-sort` attribute ("number" or "text") becomes a button; the first click
 * sorts numbers high-to-low and text A-Z (or as `data-sort-first="asc"|"desc"`
 * says), the next reverses it. A cell's `data-sort-value` overrides its text
 * as the sort key. A `.rank` column is renumbered after each sort. Header cells are matched to body
 * columns by position, so multi-row headers (colspan/rowspan) are resolved
 * through the table's own column layout.
 */

// Body column index of each header cell, accounting for colspan/rowspan.
function headerColumns(thead) {
    const taken = [];
    const columns = new Map();
    [...thead.rows].forEach((row, r) => {
        let c = 0;
        for (const cell of row.cells) {
            while (taken[r]?.[c]) c++;
            columns.set(cell, c);
            for (let dr = 0; dr < cell.rowSpan; dr++) {
                for (let dc = 0; dc < cell.colSpan; dc++) {
                    (taken[r + dr] ??= [])[c + dc] = true;
                }
            }
            c += cell.colSpan;
        }
    });
    return columns;
}

function sortBy(table, th, column) {
    const type = th.dataset.sort;
    const current = th.getAttribute('aria-sort');
    const first = th.dataset.sortFirst ?? (type === 'number' ? 'desc' : 'asc');
    const firstDir = first === 'asc' ? 'ascending' : 'descending';
    const dir = current === firstDir
        ? (firstDir === 'descending' ? 'ascending' : 'descending')
        : firstDir;

    table.querySelectorAll('th[aria-sort]').forEach((h) => h.removeAttribute('aria-sort'));
    th.setAttribute('aria-sort', dir);

    const tbody = table.tBodies[0];
    const value = (row) => {
        const cell = row.cells[column];
        return cell?.dataset.sortValue ?? cell?.textContent.trim() ?? '';
    };
    const sign = dir === 'ascending' ? 1 : -1;
    // Array sort is stable, so ties keep their current order.
    const rows = [...tbody.rows].sort((a, b) => {
        const cmp = type === 'number'
            ? (parseFloat(value(a)) || 0) - (parseFloat(value(b)) || 0)
            : value(a).localeCompare(value(b), undefined, { sensitivity: 'base' });
        return cmp * sign;
    });
    rows.forEach((row, i) => {
        const rank = row.querySelector('.rank');
        if (rank) rank.textContent = i + 1;
        tbody.appendChild(row);
    });
}

export function initSortableTables() {
    document.querySelectorAll('table[data-sortable]').forEach((table) => {
        if (table.dataset.sortableReady || !table.tHead) return;
        table.dataset.sortableReady = 'true';
        const columns = headerColumns(table.tHead);
        table.tHead.querySelectorAll('th[data-sort]').forEach((th) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'sort-button';
            button.append(...th.childNodes);
            th.append(button);
            button.addEventListener('click', () => sortBy(table, th, columns.get(th)));
        });
    });
}
