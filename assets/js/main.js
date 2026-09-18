/*
 * Overrides kopi's assets/js/main.js. The theme's search, radio player,
 * bookmark/library and PWA (service worker) modules are left out -- those
 * features aren't enabled on this site, and dropping the imports keeps them
 * out of the bundle. The modules themselves still come from the theme.
 */
import { initNavigation } from './modules/navigation.js';
import { initTheme } from './modules/theme.js';
import { initInteractions } from './modules/interactions.js';
import { initPrefetch } from './modules/prefetch.js';
import './external/turbo.es2017-umd.js';

document.addEventListener('turbo:load', () => {
    initNavigation();
    initTheme();
    initInteractions();
    initPrefetch();
});
