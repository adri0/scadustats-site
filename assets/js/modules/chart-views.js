/*
 * A chart with several views (`[data-chart-views]`, e.g. claim-order-chart.html):
 * each `button[data-view]` shows the `[data-view-panel]` of the same name and hides
 * the others. Clicking the pressed button again goes back to the "all" view.
 */
function show(chart, view) {
    chart.querySelectorAll('button[data-view]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.view === view));
    });
    chart.querySelectorAll('[data-view-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.viewPanel !== view;
    });
}

export function initChartViews() {
    document.querySelectorAll('[data-chart-views]').forEach((chart) => {
        if (chart.dataset.chartViewsReady) return;
        chart.dataset.chartViewsReady = 'true';
        chart.querySelectorAll('button[data-view]').forEach((button) => {
            button.addEventListener('click', () => {
                const pressed = button.getAttribute('aria-pressed') === 'true';
                show(chart, pressed ? 'all' : button.dataset.view);
            });
        });
    });
}
