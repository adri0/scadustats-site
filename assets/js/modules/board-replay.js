/*
 * Board replay on the match page. _partials/board-grid.html renders each
 * game's final board with [data-board-replay] and its marks and unmarks, in
 * order, as JSON ([data-replay-steps]: {type, cell, color, time, url}). The
 * bar under the board (hidden until this runs) steps through them: play/pause,
 * previous/next and a slider over the steps, evenly spaced. Step N, the last,
 * is the final board as rendered, win line included.
 */
const STEP_MS = 600;
const initialized = new WeakSet();

function timeElement(step) {
    const el = document.createElement(step.url ? 'a' : 'span');
    el.className = 'cell-time';
    el.textContent = step.time;
    if (step.url) {
        el.href = step.url;
        el.target = '_blank';
        el.rel = 'noopener';
        el.title = `Claimed at ${step.time}: watch it in the VOD (opens in a new tab)`;
    } else {
        el.title = `Claimed at ${step.time}`;
    }
    return el;
}

function initBoard(root) {
    const data = root.querySelector('[data-replay-steps]');
    const bar = root.querySelector('.board-replay');
    if (!data || !bar) return;
    let steps;
    try { steps = JSON.parse(data.textContent); } catch (e) { return; }
    if (!Array.isArray(steps) || steps.length === 0) return;

    const cells = new Map();
    root.querySelectorAll('[data-cell]').forEach((td) => {
        cells.set(td.dataset.cell, { td, winline: td.classList.contains('cell-winline') });
    });
    const play = bar.querySelector('[data-replay="play"]');
    const prev = bar.querySelector('[data-replay="prev"]');
    const next = bar.querySelector('[data-replay="next"]');
    const scrub = bar.querySelector('.replay-scrub');
    const clock = bar.querySelector('.replay-clock');
    const count = bar.querySelector('.replay-count');
    const last = steps.length;
    let shown = last;
    let timer = null;

    function render(k) {
        shown = Math.max(0, Math.min(last, k));
        const state = new Map();
        for (let i = 0; i < shown; i++) {
            const s = steps[i];
            if (s.type === 'mark') state.set(s.cell, s);
            else state.delete(s.cell);
        }
        const latest = shown > 0 ? steps[shown - 1] : null;
        cells.forEach(({ td, winline }, key) => {
            const s = state.get(key);
            td.classList.remove('cell-red', 'cell-blue', 'cell-unclaimed', 'cell-latest');
            td.classList.add(s ? `cell-${s.color || 'unclaimed'}` : 'cell-unclaimed');
            td.classList.toggle('cell-winline', winline && shown === last);
            if (latest && latest.cell === key && shown < last) td.classList.add('cell-latest');
            td.querySelector('.cell-time')?.remove();
            if (s && s.time) td.append(timeElement(s));
        });
        scrub.value = String(shown);
        scrub.setAttribute('aria-valuetext', `${shown} of ${last} marks${latest ? `, ${latest.time}` : ''}`);
        clock.textContent = latest ? latest.time : '0:00';
        count.textContent = `${shown}/${last}`;
        prev.disabled = shown === 0;
        next.disabled = shown === last;
    }

    function pause() {
        if (timer) clearInterval(timer);
        timer = null;
        play.classList.remove('is-playing');
        play.setAttribute('aria-label', 'Replay the marks');
    }

    function start() {
        if (shown === last) render(0);
        play.classList.add('is-playing');
        play.setAttribute('aria-label', 'Pause the replay');
        timer = setInterval(() => {
            // Turbo swaps the page out without unloading it.
            if (!root.isConnected) { pause(); return; }
            render(shown + 1);
            if (shown === last) pause();
        }, STEP_MS);
    }

    play.addEventListener('click', () => (timer ? pause() : start()));
    prev.addEventListener('click', () => { pause(); render(shown - 1); });
    next.addEventListener('click', () => { pause(); render(shown + 1); });
    scrub.addEventListener('input', () => { pause(); render(Number(scrub.value)); });

    render(last);
    bar.hidden = false;
}

export function initBoardReplays() {
    document.querySelectorAll('[data-board-replay]').forEach((root) => {
        if (initialized.has(root)) return;
        initialized.add(root);
        initBoard(root);
    });
}
