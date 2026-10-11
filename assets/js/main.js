/*
 * Site JS entry point. The modules in `kopi/` are copied from the kopi theme
 * (https://github.com/bect/kopi, MIT -- see LICENSES/kopi.txt); its search,
 * radio player, bookmark/library and PWA (service worker) modules were left
 * behind. `vendor/` holds Hotwire Turbo 8.0.20, unmodified from npm.
 * Everything in `modules/` is ours.
 */
import { initNavigation } from './kopi/navigation.js';
import { initTheme } from './modules/theme.js';
import { initInteractions } from './kopi/interactions.js';
import { initPrefetch } from './kopi/prefetch.js';
import { initSortableTables } from './modules/sortable-tables.js';
import { initSpoilers } from './modules/spoilers.js';
import './vendor/turbo.es2017-umd.js';

document.addEventListener('turbo:load', () => {
    initNavigation();
    initTheme();
    initInteractions();
    initPrefetch();
    initSortableTables();
    initSpoilers();
});
