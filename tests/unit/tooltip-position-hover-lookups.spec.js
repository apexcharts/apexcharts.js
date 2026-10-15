// What one tooltip move asks of the DOM in Position: no whole-chart query for
// the keyboard focus, the hovered marker found by its rel and not by reading
// rel off every marker, and the marks at `j` (and a y-axis labels group)
// looked up once per render rather than once per mousemove.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Position from '../../src/modules/tooltip/Position'

const tick = () => new Promise((r) => setTimeout(r, 0))

/**
 * Calls of baseEl.querySelector(All) whose selector contains `needle`. jsdom
 * matches no `[data\:realIndex]` test, so the series groups get a plain copy
 * of that attribute and the selectors are pointed at it.
 */
function countQueries(baseEl, needle) {
  baseEl
    .querySelectorAll('.apexcharts-series')
    .forEach((g) => g.setAttribute('data-ri', g.getAttribute('data:realIndex')))
  const seen = { n: 0 }
  for (const m of ['querySelector', 'querySelectorAll']) {
    const orig = baseEl[m].bind(baseEl)
    vi.spyOn(baseEl, m).mockImplementation((sel) => {
      if (String(sel).includes(needle)) seen.n++
      return orig(String(sel).replaceAll('data\\:realIndex', 'data-ri'))
    })
  }
  return seen
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('keyboard-focus nudge', () => {
  it('reads the focus off KeyboardNavigation, with no class query per move', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 400 },
      series: [{ name: 'a', data: [5, 9, 4, 7, 6] }],
      markers: { size: 4 },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.tooltipRect = { ttWidth: 100, ttHeight: 50 }
    const pos = tt.tooltipPosition
    const seen = countQueries(chart.w.dom.baseEl, 'keyboard-focused')

    const free = pos.computeTooltipPosition(100, 120, 4)
    for (let k = 0; k < 9; k++) pos.computeTooltipPosition(100, 120, 4)
    expect(seen.n).toBe(0)

    // A focused point still pushes the box off it.
    const nav = chart.ctx.keyboardNavigation
    nav._applyFocusClass(0, 1)
    expect(nav._focusedEl?.isConnected).toBe(true)
    const nudged = pos.computeTooltipPosition(100, 120, 4)
    expect(nudged.y).toBeLessThan(free.y)
    expect(nudged.y + 50).toBeLessThanOrEqual(120 + chart.w.layout.translateY)

    nav._removeFocusClass()
    expect(pos.computeTooltipPosition(100, 120, 4)).toEqual(free)
    expect(seen.n).toBe(0)
    chart.destroy()
  })
})

describe('non-shared marker hover', () => {
  it('finds the marker at j by its rel, without reading rel off the others', async () => {
    const data = Array.from({ length: 60 }, (_, k) => (k * 7) % 23)
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series: [{ name: 'a', data }],
      markers: { size: 4 },
      tooltip: { shared: false, intersect: false },
    })
    await tick()
    const w = chart.w
    expect(w.globals.markers.size[0]).toBeGreaterThan(0)
    expect(w.globals.markers.batched).toBeFalsy()
    const tt = w.globals.tooltip
    const enlarge = vi
      .spyOn(tt.marker, 'enlargeCurrentPoint')
      .mockImplementation(() => {})
    vi.spyOn(tt.marker, 'resetEnlargedPoints').mockImplementation(() => {})
    const seen = countQueries(w.dom.baseEl, 'apexcharts-marker')
    const getAttr = vi.spyOn(Element.prototype, 'getAttribute')

    tt.tooltipPosition.moveMarkers(0, 50)

    const relReads = getAttr.mock.calls.filter(([a]) => a === 'rel').length
    expect(relReads).toBe(0)
    expect(seen.n).toBe(1)
    expect(enlarge).toHaveBeenCalledTimes(1)
    const [j, node] = enlarge.mock.calls[0]
    expect(j).toBe(50)
    expect(node.classList.contains('apexcharts-marker')).toBe(true)
    expect(node.getAttribute('rel')).toBe('50')
    chart.destroy()
  })
})

describe('shared bar hover', () => {
  const columns = (extra = {}) =>
    createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300, ...extra.chart },
      series: [
        { name: 'a', data: [4, 8, 6, 3, 7, 5] },
        { name: 'b', data: [2, 5, 9, 4, 3, 6] },
        { name: 'c', data: [7, 3, 4, 8, 2, 9] },
      ],
      xaxis: {
        type: 'datetime',
        categories: [1, 2, 3, 4, 5, 6].map((d) => Date.UTC(2026, 0, d)),
      },
      tooltip: { shared: true, intersect: false },
      ...extra.options,
    })

  /** moveStickyTooltipOverBars with the box writes stubbed, args kept. */
  const hover = (pos, j, s = 0) => {
    const move = vi.spyOn(pos, 'moveTooltip').mockImplementation(() => {})
    const band = vi.spyOn(pos, 'moveXCrosshairs').mockImplementation(() => {})
    pos.moveStickyTooltipOverBars(j, s)
    const out = { move: move.mock.calls.at(-1), band: band.mock.calls.at(-1) }
    move.mockRestore()
    band.mockRestore()
    return out
  }

  it('looks the bars at j up once, not once per mousemove', async () => {
    const chart = columns()
    await tick()
    const pos = chart.w.globals.tooltip.tooltipPosition
    const seen = countQueries(chart.w.dom.baseEl, "[j='2']")

    const first = hover(pos, 2)
    const once = seen.n
    expect(once).toBeGreaterThan(0)
    for (let k = 0; k < 9; k++) expect(hover(pos, 2)).toEqual(first)
    expect(seen.n).toBe(once)

    // Same answer as a Position with nothing remembered.
    const fresh = new Position(chart.w.globals.tooltip)
    expect(hover(fresh, 2)).toEqual(first)
    chart.destroy()
  })

  it('looks again after an update and when a bar leaves the DOM', async () => {
    const chart = columns()
    await tick()
    const tt = chart.w.globals.tooltip
    const pos = tt.tooltipPosition
    hover(pos, 2)

    await chart.updateSeries([
      { name: 'a', data: [1, 2, 3, 4, 5, 6] },
      { name: 'b', data: [6, 5, 4, 3, 2, 1] },
      { name: 'c', data: [3, 3, 3, 3, 3, 3] },
    ])
    await tick()
    const seen = countQueries(chart.w.dom.baseEl, "[j='2']")
    const after = hover(pos, 2)
    expect(seen.n).toBeGreaterThan(0)
    expect(after).toEqual(hover(new Position(tt), 2))

    // Remembered again from here on...
    const n = seen.n
    hover(pos, 2)
    expect(seen.n).toBe(n)
    // ...until a bar is swapped out without a render.
    const bar = chart.w.dom.baseEl.querySelector(
      ".apexcharts-bar-series .apexcharts-series[rel='2'] path[j='2']",
    )
    bar.replaceWith(bar.cloneNode(true))
    const before = seen.n
    hover(pos, 2)
    expect(seen.n).toBeGreaterThan(before)
    chart.destroy()
  })

  it('horizontal bars: the row at j is looked up once', async () => {
    const chart = columns({
      options: {
        plotOptions: { bar: { horizontal: true } },
        xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'] },
      },
    })
    await tick()
    const pos = chart.w.globals.tooltip.tooltipPosition
    vi.spyOn(pos, 'applyTooltipPosition').mockImplementation(() => {})
    const seen = countQueries(chart.w.dom.baseEl, "[j='3']")
    pos.moveStickyTooltipOverBars(3, 0)
    const once = seen.n
    expect(once).toBeGreaterThan(0)
    for (let k = 0; k < 9; k++) pos.moveStickyTooltipOverBars(3, 0)
    expect(seen.n).toBe(once)
    chart.destroy()
  })
})

describe('y-axis tooltip', () => {
  it('finds the axis labels group once, not on every move', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ name: 'a', data: [5, 9, 4, 7, 6] }],
      yaxis: { tooltip: { enabled: true } },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const seen = countQueries(chart.w.dom.baseEl, 'yaxis-texts-g')
    for (let k = 0; k < 10; k++) {
      tt.axesTooltip.drawYaxisTooltipText(0, 150 + k)
    }
    expect(seen.n).toBe(1)
    chart.destroy()
  })
})
