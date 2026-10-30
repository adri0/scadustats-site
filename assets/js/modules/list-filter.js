/*
 * Filter and sort bars: `form[data-list-filter]`, hidden until this runs, so
 * it never shows without JavaScript. Used by the matches and squares pages.
 *
 * - `data-list`: selector of the element whose children are the rows (a <ul>
 *   or a <tbody>). `data-empty` (optional): selector of the message shown
 *   when no row is left. `data-noun`: what the count counts ("matches").
 * - Each named <select> or <input> filters rows on the row's `data-<name>`:
 *   a select by exact value ("" = all), an input by case-insensitive
 *   substring. A select with `data-match="word"` matches any one of the
 *   space-separated values in the row's attribute instead.
 * - A select with `data-swap` also swaps a row's figures for the chosen
 *   value's: the row's `data-swap` is JSON, {value: {key: [sort value,
 *   text]}}, and each key replaces the row's `data-<key>` and the text of
 *   its `[data-swap-cell="<key>"]` cell. "" puts the server's figures back.
 * - The <select name="sort"> sorts instead. Its options say how with
 *   `data-key` (the row attribute), `data-dir` ("asc" or "desc") and
 *   `data-type` ("number" or text). An option without `data-key` is the
 *   order the rows came in (the server's). Ties keep that order.
 *
 * The choices are kept in the URL (?season=6&sort=oldest), so a filtered list
 * can be linked to.
 */
function sortRows(rows, option) {
    const { key, dir, type } = option?.dataset ?? {};
    if (!key) return rows;
    const sign = dir === 'desc' ? -1 : 1;
    const value = (row) => row.dataset[key] ?? '';
    // Array sort is stable, so ties keep the server's order.
    return [...rows].sort((a, b) => sign * (type === 'number'
        ? (parseFloat(value(a)) || 0) - (parseFloat(value(b)) || 0)
        : value(a).localeCompare(value(b), undefined, { sensitivity: 'base' })));
}

// The figures a swap select can replace, as the server rendered them.
const originals = new WeakMap();

function swapFigures(row, value) {
    if (!row.dataset.swap) return;
    const cells = [...row.querySelectorAll('[data-swap-cell]')];
    if (!originals.has(row)) {
        originals.set(row, Object.fromEntries(cells.map((cell) => {
            const key = cell.dataset.swapCell;
            return [key, [row.dataset[key], cell.textContent]];
        })));
    }
    const figures = (value && JSON.parse(row.dataset.swap)[value]) || originals.get(row);
    for (const cell of cells) {
        const key = cell.dataset.swapCell;
        const [sortValue, text] = figures[key] ?? originals.get(row)[key];
        row.dataset[key] = sortValue;
        cell.textContent = text;
    }
}

function initForm(form) {
    const list = document.querySelector(form.dataset.list);
    if (!list) return;
    form.dataset.listFilterReady = 'true';

    const rows = [...list.children];
    const empty = form.dataset.empty && document.querySelector(form.dataset.empty);
    const count = form.querySelector('.filter-count');
    const noun = form.dataset.noun ?? 'items';
    const fields = [...form.elements].filter((f) => f.name);
    const filters = fields.filter((f) => f.name !== 'sort');
    const sort = form.elements.sort;
    const swap = filters.find((f) => 'swap' in f.dataset);

    const params = new URLSearchParams(window.location.search);
    for (const field of fields) {
        const value = params.get(field.name);
        // A select keeps its default when the URL names an option it lacks.
        if (value && (field.tagName !== 'SELECT' || [...field.options].some((o) => o.value === value))) {
            field.value = value;
        }
    }

    function update() {
        let shown = 0;
        for (const row of rows) {
            if (swap) swapFigures(row, swap.value);
            const match = filters.every((field) => {
                const wanted = field.value.trim().toLowerCase();
                if (!wanted) return true;
                const have = (row.dataset[field.name] ?? '').toLowerCase();
                if (field.tagName !== 'SELECT') return have.includes(wanted);
                return field.dataset.match === 'word' ? have.split(' ').includes(wanted) : have === wanted;
            });
            row.hidden = !match;
            if (match) shown++;
        }
        if (sort) list.append(...sortRows(rows, sort.selectedOptions[0]));

        if (count) {
            count.textContent = shown === rows.length
                ? `${rows.length} ${noun}`
                : `${shown} of ${rows.length} ${noun}`;
        }
        if (empty) empty.hidden = shown > 0;

        const url = new URL(window.location.href);
        for (const field of fields) {
            const value = field.value.trim();
            const isDefault = field === sort ? field.selectedIndex === 0 : !value;
            if (isDefault) url.searchParams.delete(field.name);
            else url.searchParams.set(field.name, value);
        }
        // Keep Turbo's history state, so back/forward still works.
        window.history.replaceState(window.history.state, '', url);
    }

    form.addEventListener('input', update);
    form.addEventListener('submit', (event) => event.preventDefault());
    form.hidden = false;
    update();
}

export function initListFilters() {
    document.querySelectorAll('form[data-list-filter]').forEach((form) => {
        if (!form.dataset.listFilterReady) initForm(form);
    });
}
