import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'

// A data-only update (fastUpdate) keeps the tooltip box and its rows and
// binds the hover again, rather than rebuilding them: the rebuild cost a row
// of nodes and an SVG parse per series per update, and closed a tooltip the
// user had open on every update.

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))

/** Until the series tween has landed and no replay waits on it. */
const landed = async (c) => {
  for (
    let i = 0;
    i < 250 &&
    (!c.w.globals.animationEnded || c.w.globals.tooltip.pendingReplay);
    i++
  )
    await tick(20)
}

const lineSeries = (n, len, k = 0) =>
  Array.from({ length: n }, (_, i) => ({
    name: `s${i}`,
    data: Array.from({ length: len }, (_, j) => ((i + 1) * (j + 3) + k) % 37),
  }))

/** A pointer move over the plot at data index j of a category line. */
const moveAt = (chart, j, type = 'mousemove') => {
  const w = chart.w
  const n = w.globals.dataPoints
  const x = w.layout.translateX + (w.layout.gridWidth / (n - 1)) * j
  const y = w.layout.translateY + w.layout.gridHeight / 2
  w.dom.Paper.node.dispatchEvent(
    new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }),
  )
}

let chart
afterEach(() => {
  chart?.destroy()
  chart = null
  vi.restoreAllMocks()
})

describe('a data-only update keeps the tooltip', () => {
  const streaming = () =>
    createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(5, 12),
      tooltip: { shared: true, intersect: false },
    })

  it('reuses the box and its rows instead of rebuilding them', async () => {
    chart = streaming()
    await tick()
    const tt = chart.w.globals.tooltip
    const el = tt.getElTooltip()
    const rows = tt.ttItems
    const build = vi.spyOn(tt, 'createTTElements')
    await chart.updateSeries(lineSeries(5, 12, 3))
    await chart.updateSeries(lineSeries(5, 12, 7))
    expect(chart._updateStats.fast).toBe(2)
    expect(build).not.toHaveBeenCalled()
    expect(tt.getElTooltip()).toBe(el)
    expect(tt.ttItems).toBe(rows)
    expect(
      chart.w.dom.baseEl.querySelectorAll(
        '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
      ).length,
    ).toBe(1)
  })

  it('an open tooltip stays open across the update and shows the new values', async () => {
    chart = streaming()
    await tick()
    const tt = chart.w.globals.tooltip
    await tick(30)
    moveAt(chart, 4)
    await tick(30)
    const el = tt.getElTooltip()
    expect(el.classList.contains('apexcharts-active')).toBe(true)
    const value = () =>
      el.querySelector(
        '.apexcharts-tooltip-series-group-0 .apexcharts-tooltip-text-y-value',
      ).textContent
    expect(value()).toBe(String(chart.w.seriesData.series[0][4]))

    const next = lineSeries(5, 12, 11)
    await chart.updateSeries(next)
    expect(chart._updateStats.fast).toBe(1)
    expect(tt.getElTooltip()).toBe(el)
    expect(el.classList.contains('apexcharts-active')).toBe(true)
    expect(value()).toBe(String(next[0].data[4]))
  })

  // An animated update: the box and the crosshair show the new data at
  // once, but the hover dot waits for the series tween to land, or (drawn
  // at the new value) it floats off the line while the line eases there.
  // A second show once the tween lands draws it.
  const animated = () => {
    document.body.innerHTML = '<div id="chart" />'
    const c = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { speed: 100, dynamicAnimation: { speed: 200 } },
      },
      series: lineSeries(2, 12),
      tooltip: { shared: true, intersect: false },
    })
    c.render()
    return c
  }

  it('an animated update shows the new data at once, the hover again once its tween has landed', async () => {
    chart = animated()
    await landed(chart)
    const tt = chart.w.globals.tooltip
    moveAt(chart, 4)
    await tick(30)
    const el = tt.getElTooltip()
    expect(el.classList.contains('apexcharts-active')).toBe(true)
    const hover = vi.spyOn(tt, 'seriesHover')

    const next = lineSeries(2, 12, 11)
    await chart.updateSeries(next)
    await tick(30)
    const shown = () =>
      el.querySelector(
        '.apexcharts-tooltip-series-group-0 .apexcharts-tooltip-text-y-value',
      ).textContent
    // mid-tween: shown once, on the new value, crosshair included
    expect(chart.w.globals.animationEnded).toBe(false)
    expect(hover).toHaveBeenCalledTimes(1)
    expect(el.classList.contains('apexcharts-active')).toBe(true)
    expect(shown()).toBe(String(next[0].data[4]))
    expect(
      tt.getElXCrosshairs().classList.contains('apexcharts-active'),
    ).toBe(true)
    // the marker ease is off while the marks ride the tween
    expect(
      chart.w.dom.baseEl.classList.contains('apexcharts-tooltip-active'),
    ).toBe(false)

    await landed(chart)
    expect(hover).toHaveBeenCalledTimes(2)
    expect(shown()).toBe(String(next[0].data[4]))
  })

  it('a mouseout or a second update during the tween drops the pending replay', async () => {
    chart = animated()
    await landed(chart)
    const tt = chart.w.globals.tooltip
    moveAt(chart, 4)
    await tick(30)
    const el = tt.getElTooltip()
    const hover = vi.spyOn(tt, 'seriesHover')

    // two updates inside one tween: each shown at once, one replay once it
    // lands, for the last
    await chart.updateSeries(lineSeries(2, 12, 5))
    await chart.updateSeries(lineSeries(2, 12, 9))
    expect(hover).toHaveBeenCalledTimes(2)
    hover.mockClear()
    await landed(chart)
    expect(hover).toHaveBeenCalledTimes(1)

    await chart.updateSeries(lineSeries(2, 12, 13))
    tt.handleMouseOut({ tooltipEl: el })
    hover.mockClear()
    await landed(chart)
    expect(hover).not.toHaveBeenCalled()
    expect(el.classList.contains('apexcharts-active')).toBe(false)
  })

  it('a full render builds a new box, and new series colours reach the kept one', async () => {
    chart = streaming()
    await tick()
    const tt = chart.w.globals.tooltip
    const el = tt.getElTooltip()
    await chart.updateOptions({ tooltip: { theme: 'dark' } })
    const el2 = tt.getElTooltip()
    expect(el2).not.toBe(el)
    expect(el2.classList.contains('apexcharts-theme-dark')).toBe(true)

    await chart.updateSeries(
      lineSeries(5, 12, 2).map((s, i) => ({
        ...s,
        color: i ? '#123456' : '#abcdef',
      })),
    )
    // the row takes the new colour when it is next shown
    const el3 = tt.getElTooltip()
    expect(el3.isConnected).toBe(true)
    tt.create({ type: 'mousemove' }, tt, 0, 2, tt.ttItems)
    expect(
      el3.querySelector(
        '.apexcharts-tooltip-series-group-0 .apexcharts-tooltip-marker',
      ).style.color,
    ).toBe('rgb(171, 205, 239)')
  })
})

// updateOptions, appendData and an updateSeries that changes the point count
// redraw the whole chart, and with it the tooltip box, as does a fast update
// once a custom tooltip has replaced the rows. A box that was open under the
// pointer is open again afterwards, at the same pointer, with the new data
// (#2883).
describe('an update that rebuilds the box keeps an open tooltip open', () => {
  const visits = [30, 40, 35, 50, 49, 60, 70, 91]
  const mount = (tooltip = {}) =>
    createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ name: 'Visits', data: visits }],
      tooltip: { shared: true, intersect: false, ...tooltip },
    })
  const openAtLastPoint = async () => {
    await tick(30)
    moveAt(chart, visits.length - 1)
    await tick(30)
    expect(isOpen()).toBe(true)
  }
  const isOpen = () =>
    chart.w.globals.tooltip
      .getElTooltip()
      .classList.contains('apexcharts-active')
  const value = () =>
    chart.w.globals.tooltip
      .getElTooltip()
      .querySelector('.apexcharts-tooltip-text-y-value').textContent

  it('updateSeries with one more point', async () => {
    chart = mount()
    await openAtLastPoint()
    await chart.updateSeries([{ name: 'Visits', data: [...visits, 12] }])
    await tick(30)
    expect(chart._updateStats.full).toBe(1)
    expect(isOpen()).toBe(true)
    expect(value()).toBe('12')
  })

  it('updateOptions with new series', async () => {
    chart = mount()
    await openAtLastPoint()
    await chart.updateOptions({
      series: [{ name: 'Visits', data: [5, 6, 7, 8, 9, 10, 11, 64] }],
    })
    await tick(30)
    expect(isOpen()).toBe(true)
    expect(value()).toBe('64')
  })

  it('updateOptions that leaves the data alone', async () => {
    chart = mount()
    await openAtLastPoint()
    await chart.updateOptions({ title: { text: 'Visits per day' } })
    await tick(30)
    expect(isOpen()).toBe(true)
    expect(value()).toBe('91')
  })

  it('appendData', async () => {
    chart = mount()
    await openAtLastPoint()
    await chart.appendData([{ data: [77] }])
    await tick(30)
    expect(isOpen()).toBe(true)
    expect(value()).toBe('77')
  })

  it('a data-only update of a custom tooltip', async () => {
    chart = mount({
      custom: ({ series, seriesIndex, dataPointIndex }) =>
        `<div class="apexcharts-tooltip-text-y-value">${series[seriesIndex][dataPointIndex]}</div>`,
    })
    await openAtLastPoint()
    expect(value()).toBe('91')
    await chart.updateSeries([
      { name: 'Visits', data: [5, 6, 7, 8, 9, 10, 11, 64] },
    ])
    await tick(30)
    expect(chart._updateStats.full).toBe(0)
    expect(isOpen()).toBe(true)
    expect(value()).toBe('64')
  })

  // Each full render builds a new box and shows it at once; the replay
  // waiting for the tween is the last render's alone.
  it('two full renders inside one tween replay once, a mouseout drops it', async () => {
    document.body.innerHTML = '<div id="chart" />'
    chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        animations: { speed: 100, dynamicAnimation: { speed: 200 } },
      },
      series: [{ name: 'Visits', data: visits }],
      tooltip: { shared: true, intersect: false },
    })
    chart.render()
    await landed(chart)
    await openAtLastPoint()
    const tt = chart.w.globals.tooltip
    const hover = vi.spyOn(tt, 'seriesHover')

    await chart.appendData([{ data: [12] }])
    await chart.appendData([{ data: [77] }])
    expect(hover).toHaveBeenCalledTimes(2)
    expect(isOpen()).toBe(true)
    expect(value()).toBe('77')
    hover.mockClear()
    await landed(chart)
    expect(hover).toHaveBeenCalledTimes(1)
    expect(isOpen()).toBe(true)
    expect(value()).toBe('77')

    await chart.appendData([{ data: [64] }])
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    hover.mockClear()
    await landed(chart)
    expect(hover).not.toHaveBeenCalled()
    expect(isOpen()).toBe(false)
  })

  it('a tooltip the pointer has left stays closed', async () => {
    chart = mount()
    await openAtLastPoint()
    moveAt(chart, visits.length - 1, 'mouseout')
    await tick(30)
    expect(isOpen()).toBe(false)
    await chart.updateOptions({ title: { text: 'Visits per day' } })
    await tick(30)
    expect(isOpen()).toBe(false)
  })
})
