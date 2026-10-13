/*
 * The matches page's filter and sort bar (`form[data-match-filter]`, hidden
 * until this runs, so it never shows without JavaScript). It filters the rows
 * of `[data-match-list]` by season (`data-season`) and by player, a
 * case-insensitive substring of any name in a row's `data-players` (both
 * sides, and a team's members), and sorts them newest or oldest first. The
 * rows come from the server newest first, so oldest first is that order
 * reversed. The choices are kept in the URL (?season=…&player=…&sort=oldest),
 * so a filtered list can be linked to.
 */
const FIELDS = ['season', 'player', 'sort'];

export function initMatchFilter() {
    const form = document.querySelector('form[data-match-filter]');
    const list = document.querySelector('[data-match-list]');
    if (!form || !list || form.dataset.matchFilterReady) return;
    form.dataset.matchFilterReady = 'true';

    const rows = [...list.children];
    const empty = document.querySelector('.filter-empty');
    const count = form.querySelector('.filter-count');

    const params = new URLSearchParams(window.location.search);
    for (const name of FIELDS) {
        const field = form.elements[name];
        const value = params.get(name);
        // A select keeps its default when the URL names an option it lacks.
        if (value && (field.tagName !== 'SELECT' || [...field.options].some((o) => o.value === value))) {
            field.value = value;
        }
    }

    function update() {
        const season = form.elements.season.value;
        const player = form.elements.player.value.trim().toLowerCase();
        const sort = form.elements.sort.value;

        let shown = 0;
        for (const row of rows) {
            const match = (!season || row.dataset.season === season)
                && (!player || row.dataset.players.split('|').some((name) => name.includes(player)));
            row.hidden = !match;
            if (match) shown++;
        }
        list.append(...(sort === 'oldest' ? [...rows].reverse() : rows));

        count.textContent = shown === rows.length
            ? `${rows.length} matches`
            : `${shown} of ${rows.length} matches`;
        if (empty) empty.hidden = shown > 0;

        const url = new URL(window.location.href);
        for (const name of FIELDS) url.searchParams.delete(name);
        if (season) url.searchParams.set('season', season);
        if (player) url.searchParams.set('player', form.elements.player.value.trim());
        if (sort !== 'newest') url.searchParams.set('sort', sort);
        // Keep Turbo's history state, so back/forward still works.
        window.history.replaceState(window.history.state, '', url);
    }

    form.addEventListener('input', update);
    form.addEventListener('submit', (event) => event.preventDefault());
    form.hidden = false;
    update();
}
