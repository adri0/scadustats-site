/*
 * Board replay on the match page. _partials/board-grid.html renders each
 * game's final board with [data-board-replay] and its marks and unmarks, in
 * order, as JSON ([data-replay-steps]: {type, cell, color, time, url}). The
 * bar under the board (hidden until this runs) steps through them: play/pause,
 * previous/next and a slider over the steps, evenly spaced. Step N, the last,
 * is the final board as rendered, win line included. The game's score
 * ([data-score] in its .game section) follows the board. The replay plays by
 * itself the first time most of the board scrolls into view, unless the
 * viewer prefers reduced motion or has already used the bar. Cells fade
 * into and out of their colour, and so do their time labels.
 */
const STEP_MS = 250;
const FADE_MS = 450; // .cell transitions in _scadu.scss
const AUTOPLAY_RATIO = 0.6;
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
    const scores = root.closest('.game')?.querySelectorAll('[data-score]') ?? [];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const last = steps.length;
    let shown = last;
    let timer = null;

    // `animate` is off for the first render, which only takes over the
    // server-rendered board, and for viewers who prefer reduced motion.
    function render(k, animate = !reducedMotion) {
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
            // Keep a label that is still right, so only new ones fade in.
            const current = td.querySelector('.cell-time:not(.is-leaving)');
            if (current && current.step === s) return;
            if (current) {
                if (animate) {
                    current.classList.add('is-leaving');
                    setTimeout(() => current.remove(), FADE_MS);
                } else {
                    current.remove();
                }
            }
            if (s && s.time) {
                const el = timeElement(s);
                el.step = s;
                td.append(el);
                if (animate) {
                    el.classList.add('is-leaving');
                    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-leaving')));
                }
            }
        });
        const counts = { red: 0, blue: 0 };
        state.forEach((s) => { if (s.color in counts) counts[s.color] += 1; });
        scores.forEach((el) => { el.textContent = String(counts[el.dataset.score]); });
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

    let observer = null;
    function stopAutoplay() {
        observer?.disconnect();
        observer = null;
    }

    play.addEventListener('click', () => { stopAutoplay(); timer ? pause() : start(); });
    prev.addEventListener('click', () => { stopAutoplay(); pause(); render(shown - 1); });
    next.addEventListener('click', () => { stopAutoplay(); pause(); render(shown + 1); });
    scrub.addEventListener('input', () => { stopAutoplay(); pause(); render(Number(scrub.value)); });

    render(last, false);
    bar.hidden = false;

    // Boards hidden by no-spoilers mode never intersect, so they start
    // when revealed and scrolled to.
    if ('IntersectionObserver' in window && !reducedMotion) {
        observer = new IntersectionObserver((entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            stopAutoplay();
            if (!timer) start();
        }, { threshold: AUTOPLAY_RATIO });
        observer.observe(root);
    }
}

export function initBoardReplays() {
    document.querySelectorAll('[data-board-replay]').forEach((root) => {
        if (initialized.has(root)) return;
        initialized.add(root);
        initBoard(root);
    });
}
