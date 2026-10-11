/*
 * The site's own scripts, run by the Land of Shadow theme's main.js on every
 * Turbo page load (after the theme's modules). This file replaces the theme's
 * empty assets/js/site.js.
 */
import { initSortableTables } from './modules/sortable-tables.js';
import { initSpoilers } from './modules/spoilers.js';

export function initSite() {
    initSortableTables();
    initSpoilers();
}
