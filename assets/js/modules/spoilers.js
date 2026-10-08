/*
 * No-spoilers mode. <html data-spoilers="hidden|shown"> drives everything:
 * _scadu.scss blurs .spoiler elements and drops .spoiler-hide ones while it is
 * "hidden". Hidden is the default; the inline script in _partials/head.html
 * restores "shown" from localStorage before first paint. Any element with
 * [data-spoiler-toggle] (the header eye, the match page's "Show results")
 * flips the mode.
 */
function sync(toggle, hidden) {
    toggle.setAttribute('aria-pressed', hidden ? 'true' : 'false');
    if (toggle.classList.contains('header-icon')) {
        const label = hidden
            ? 'No-spoilers mode: results hidden. Click to show results'
            : 'Results shown. Click to turn on no-spoilers mode';
        toggle.setAttribute('aria-label', label);
        toggle.title = hidden ? 'No-spoilers mode on: results hidden' : 'Results shown: no-spoilers mode off';
    }
}

export function initSpoilers() {
    const htmlElement = document.documentElement;
    const toggles = document.querySelectorAll('[data-spoiler-toggle]');
    const isHidden = () => htmlElement.getAttribute('data-spoilers') !== 'shown';

    toggles.forEach((toggle) => {
        sync(toggle, isHidden());
        toggle.addEventListener('click', () => {
            const mode = isHidden() ? 'shown' : 'hidden';
            htmlElement.setAttribute('data-spoilers', mode);
            try { localStorage.setItem('spoilers', mode); } catch (e) {}
            toggles.forEach((t) => sync(t, mode === 'hidden'));
        });
    });
}
