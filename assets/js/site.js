/*
 * The site's own scripts, run by the Land of Shadow theme's main.js on every
 * Turbo page load (after the theme's modules). This file replaces the theme's
 * empty assets/js/site.js.
 */
import { initBoardReplays } from './modules/board-replay.js';
import { initListFilters } from './modules/list-filter.js';
import { initSortableTables } from './modules/sortable-tables.js';
import { initSpoilers } from './modules/spoilers.js';

export function initSite() {
    initBoardReplays();
    initListFilters();
    initSortableTables();
    initSpoilers();
}
