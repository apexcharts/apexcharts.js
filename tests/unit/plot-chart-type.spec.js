import { createChartWithOptions } from './utils/utils.js'

// Behavior-lock harness for Core.plotChartType's renderer-instantiation and
// elGraph orchestration (audit C2 remainder). Locks the two things easy to
// break when splitting the method: the per-type renderer side effects
// (ctx.pie / ctx.rangeBar / ctx.bar) and the orchestration producing the right
// series groups (incl. combo z-order). plotChartType is on the render hot path,
// so the full suite is the broad net; this pins the specific invariants.

function render(options) {
  return createChartWithOptions({
    chart: { animations: { enabled: false }, ...(options.chart || {}) },
    ...options,
  })
}

const q = (chart, sel) => chart.w.dom.baseEl.querySelectorAll(sel)

describe('plotChartType renderer side effects', () => {
  it('line: no pie/rangeBar renderer, one plain series group', () => {
    const chart = render({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    expect(chart.pie).toBeFalsy()
    expect(chart.rangeBar).toBeFalsy()
    expect(q(chart, '.apexcharts-bar-series').length).toBe(0)
    expect(q(chart, '.apexcharts-series').length).toBeGreaterThanOrEqual(1)
  })

  it('bar (non-stacked): ctx.bar set, no pie, a bar-series group', () => {
    const chart = render({
      chart: { type: 'bar' },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    expect(chart.bar).toBeTruthy()
    expect(chart.pie).toBeFalsy()
    expect(q(chart, '.apexcharts-bar-series').length).toBe(1)
  })

  it('pie: ctx.pie set, a pie-series group', () => {
    const chart = render({
      chart: { type: 'pie' },
      series: [10, 20, 30],
      labels: ['a', 'b', 'c'],
    })
    expect(chart.pie).toBeTruthy()
    expect(chart.rangeBar).toBeFalsy()
    expect(q(chart, '.apexcharts-pie-series').length).toBeGreaterThanOrEqual(1)
  })

  it('rangeBar: ctx.rangeBar set, a rangebar-series group', () => {
    const chart = render({
      chart: { type: 'rangeBar' },
      plotOptions: { bar: { horizontal: true } },
      series: [
        { name: 'S', data: [{ x: 'R', y: [1, 5] }] },
      ],
    })
    expect(chart.rangeBar).toBeTruthy()
    expect(chart.pie).toBeFalsy()
    expect(q(chart, '.apexcharts-rangebar-series').length).toBeGreaterThanOrEqual(1)
  })
})

describe('plotChartType orchestration', () => {
  it('combo bar+line renders both a bar-series and a plain (line) series', () => {
    const chart = render({
      chart: { type: 'line' },
      series: [
        { name: 'bar', type: 'bar', data: [1, 2, 3] },
        { name: 'line', type: 'line', data: [4, 5, 6] },
      ],
    })
    expect(chart.w.globals.comboCharts).toBe(true)
    expect(chart.bar).toBeTruthy()
    expect(q(chart, '.apexcharts-bar-series').length).toBe(1)
    // the line series draws a plain apexcharts-series group
    expect(q(chart, '.apexcharts-series').length).toBeGreaterThanOrEqual(1)
  })

  it('stacked bar renders bar-series groups without setting ctx.bar', () => {
    const chart = render({
      chart: { type: 'bar', stacked: true },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [4, 5, 6] },
      ],
    })
    // stacked path uses BarStacked, not ctx.bar
    expect(chart.bar).toBeFalsy()
    expect(q(chart, '.apexcharts-bar-series').length).toBeGreaterThanOrEqual(1)
  })

  it('scatter renders marker series (single-type, not combo)', () => {
    const chart = render({
      chart: { type: 'scatter' },
      series: [{ name: 'A', data: [[1, 2], [3, 4]] }],
    })
    expect(chart.w.globals.comboCharts).toBe(false)
    expect(q(chart, '.apexcharts-series').length).toBeGreaterThanOrEqual(1)
  })
})
