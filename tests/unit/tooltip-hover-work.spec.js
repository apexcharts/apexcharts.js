import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The work one hover and one hide cost the tooltip, counted rather than
// timed: the facts a move needs are fixed per render, so a move should not
// walk the chart for them, a hide with nothing shown should not touch a
// marker, and the legend should not be rewritten with what it already says.

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))

const markerDs = (chart) =>
  [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-marker')].map((m) =>
    m.getAttribute('d'),
  )

/** Count setAttribute('d', ...) on marker nodes while `fn` runs. */
const countMarkerPathWrites = (fn) => {
  const real = Element.prototype.setAttribute
  let n = 0
  const spy = vi
    .spyOn(Element.prototype, 'setAttribute')
    .mockImplementation(function (name, value) {
      if (name === 'd' && this.classList?.contains('apexcharts-marker')) n++
      return real.call(this, name, value)
    })
  try {
    fn()
  } finally {
    spy.mockRestore()
  }
  return n
}

/** The selectors baseEl was queried with while `fn` ran. */
const queriesDuring = (chart, fn) => {
  const el = chart.w.dom.baseEl
  const seen = []
  const qsa = el.querySelectorAll.bind(el)
  const qs = el.querySelector.bind(el)
  el.querySelectorAll = (s) => (seen.push(s), qsa(s))
  el.querySelector = (s) => (seen.push(s), qs(s))
  try {
    fn()
  } finally {
    delete el.querySelectorAll
    delete el.querySelector
  }
  return seen
}

const perRenderSelectors = (seen) =>
  seen.filter((s) =>
    /apexcharts-(bar|candlestick|boxPlot|violin|rangebar)-series|series-markers-wrap/.test(
      s,
    ),
  )

const lineSeries = (n, len, k = 0) =>
  Array.from({ length: n }, (_, i) => ({
    name: `s${i}`,
    data: Array.from({ length: len }, (_, j) => ((i + 1) * (j + 3) + k) % 37),
  }))

let chart
afterEach(() => {
  chart?.destroy()
  chart = null
  vi.restoreAllMocks()
})

describe('handleMouseOut only undoes what a hover changed', () => {
  it('a hide while nothing is shown re-paths no marker', async () => {
    chart = createChartWithOptions({
      chart: { type: 'scatter', width: 500, height: 300 },
      series: lineSeries(4, 50),
      markers: { size: 4 },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const tooltipEl = tt.getElTooltip()
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-marker').length,
    ).toBeGreaterThanOrEqual(200)
    // what a move over the axis labels does, every 20 ms
    const writes = countMarkerPathWrites(() => {
      for (let k = 0; k < 5; k++) tt.handleMouseOut({ tooltipEl })
    })
    expect(writes).toBe(0)
  })

  it('a hide after a hover puts back the enlarged markers only, and every marker ends as drawn', async () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(4, 50),
      markers: { size: 4 },
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const tooltipEl = tt.getElTooltip()
    const atRest = markerDs(chart)
    // what the shared hover at index 7 does to the markers
    tt.marker.enlargePoints(7)
    tooltipEl.classList.add('apexcharts-active')
    expect(markerDs(chart)).not.toEqual(atRest)
    const writes = countMarkerPathWrites(() => tt.handleMouseOut({ tooltipEl }))
    // the 4 enlarged markers, not all 200
    expect(writes).toBeLessThanOrEqual(4 * 2)
    expect(markerDs(chart)).toEqual(atRest)
  })

  it("a hide clears the series' hover dots, without sweeping the chart", async () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(3, 40),
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const tooltipEl = tt.getElTooltip()
    const dots = () =>
      [
        ...chart.w.dom.baseEl.querySelectorAll(
          '.apexcharts-series-markers .apexcharts-marker',
        ),
      ].map((m) => m.getAttribute('d'))
    expect(dots().length).toBe(3)
    tt.create({ type: 'mousemove' }, tt, 0, 5, tt.ttItems)
    // jsdom cannot match the `data\\:realIndex` selector hasMarkers uses, so
    // the dots are moved as a browser's create() moves them
    tt.tooltipPosition.moveDynamicPointsOnHover(5)
    expect(dots().some((d) => d !== 'M0,0' && d !== '')).toBe(true)
    // Not shown yet (a hide decided inside the first move): the dots the
    // move drew still go.
    tt.handleMouseOut({ tooltipEl })
    expect(dots()).toEqual(['M0,0', 'M0,0', 'M0,0'])
  })

  it('a non-shared hover over a zero-size series does not sweep every marker', async () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(3, 60),
      markers: { size: [0, 4, 4] },
      tooltip: { shared: false, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const writes = countMarkerPathWrites(() =>
      tt.tooltipPosition.moveMarkers(0, 3),
    )
    // series 0 draws no markers, so this resets and moves its hover dot:
    // a handful of writes, not one per marker in the chart (120)
    expect(writes).toBeLessThanOrEqual(8)
  })
})

describe('per-render facts are not re-queried per move', () => {
  it('a shared line hover walks the chart for no per-render fact', async () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(6, 30),
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.create({ type: 'mousemove' }, tt, 0, 3, tt.ttItems)
    tt.create({ type: 'mousemove' }, tt, 2, 3, tt.ttItems)
    tt.tooltipPosition.moveDynamicPointsOnHover(3)
    const seen = queriesDuring(chart, () => {
      tt.create({ type: 'mousemove' }, tt, 0, 4, tt.ttItems)
      tt.create({ type: 'mousemove' }, tt, 2, 5, tt.ttItems)
      tt.tooltipPosition.moveDynamicPointsOnHover(5)
    })
    expect(perRenderSelectors(seen)).toEqual([])
  })

  it('a shared column hover walks the chart for no per-render fact', async () => {
    chart = createChartWithOptions({
      chart: { type: 'bar', width: 500, height: 300 },
      series: lineSeries(3, 12),
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    vi.spyOn(
      tt.tooltipPosition,
      'moveStickyTooltipOverBars',
    ).mockImplementation(() => {})
    tt.create({ type: 'mousemove' }, tt, 0, 3, tt.ttItems)
    const seen = queriesDuring(chart, () => {
      tt.create({ type: 'mousemove' }, tt, 0, 4, tt.ttItems)
      tt.tooltipUtil.getNearestValues({
        hoverArea: chart.w.dom.Paper.node,
        clientX: 10,
        clientY: 10,
      })
    })
    expect(perRenderSelectors(seen)).toEqual([])
  })

  it('the cached facts follow a data update, a legend toggle and a type change', async () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(3, 20),
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const u = tt.tooltipUtil
    expect(u.hasBars()).toBe(false)
    const live = () =>
      u.getAllMarkers().every((m) => m && chart.w.dom.baseEl.contains(m))
    expect(u.getAllMarkers().length).toBe(3)
    expect(live()).toBe(true)

    await chart.updateSeries(lineSeries(3, 20, 5))
    expect(chart._updateStats.fast).toBe(1)
    expect(live()).toBe(true)

    chart.toggleSeries('s1')
    await tick()
    expect(u.getAllMarkers(true).length).toBe(2)
    expect(u.getAllMarkers().length).toBe(3)
    expect(live()).toBe(true)

    await chart.updateOptions({ chart: { type: 'bar' } })
    expect(u.hasBars()).toBe(true)
  })

  it('hasMarkers asks for the first marker, once per series per render', async () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(2, 80),
      markers: { size: 3 },
    })
    await tick()
    const u = chart.w.globals.tooltip.tooltipUtil
    const seen = queriesDuring(chart, () => {
      for (let k = 0; k < 3; k++) {
        u.hasMarkers(0)
        u.hasMarkers(1)
      }
    })
    expect(seen.length).toBe(2)
  })
})

describe('legend.tooltipHoverFormatter writes the legend once per change', () => {
  it('repeated moves within a column and repeated hides do not rewrite it', async () => {
    const fmt = vi.fn((name, o) => `${name}:${o.dataPointIndex}`)
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(4, 10),
      legend: { show: true, tooltipHoverFormatter: fmt },
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const tooltipEl = tt.getElTooltip()
    for (let k = 0; k < 5; k++)
      tt.create({ type: 'mousemove' }, tt, 0, 2, tt.ttItems)
    expect(fmt).toHaveBeenCalledTimes(4)
    const label = () =>
      chart.w.dom.baseEl.querySelector('.apexcharts-legend-text[i="1"]')
        .innerHTML
    expect(label()).toBe('s1:2')

    tt.create({ type: 'mousemove' }, tt, 0, 3, tt.ttItems)
    expect(fmt).toHaveBeenCalledTimes(8)
    expect(label()).toBe('s1:3')

    tt.handleMouseOut({ tooltipEl })
    expect(label()).toBe('s1')
    const els = [
      ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-legend-text'),
    ]
    const writes = vi.fn()
    els.forEach((l) =>
      Object.defineProperty(l, 'innerHTML', {
        set: writes,
        configurable: true,
      }),
    )
    tt.handleMouseOut({ tooltipEl })
    tt.handleMouseOut({ tooltipEl })
    expect(writes).not.toHaveBeenCalled()
  })

  it('formats again after a data update at the same point', async () => {
    const fmt = vi.fn(
      (name, o) =>
        `${name}:${o.w.seriesData.series[o.seriesIndex][o.dataPointIndex]}`,
    )
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(2, 10),
      legend: { show: true, tooltipHoverFormatter: fmt },
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.create({ type: 'mousemove' }, tt, 0, 2, tt.ttItems)
    const next = lineSeries(2, 10, 9)
    await chart.updateSeries(next)
    tt.create({ type: 'mousemove' }, tt, 0, 2, tt.ttItems)
    expect(
      chart.w.dom.baseEl.querySelector('.apexcharts-legend-text[i="0"]')
        .innerHTML,
    ).toBe(`s0:${next[0].data[2]}`)
  })
})
