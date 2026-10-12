import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import { createChartWithOptions } from './utils/utils.js'

// Three edge cases in the chart's interaction controls:
// - a synced group that shows the toolbar on one chart only threw on every
//   pan or zoom tool click, since the toolbar-less members have no buttons;
// - ArrowDown/ArrowUp toward a legend-hidden edge series stepped past the
//   end, leaving the cursor on series -1 or N and throwing from the tooltip;
// - '+' on a category column chart (an axis the render does not zoom)
//   applied an inverted sentinel window and fired `zoomed` with it.

const press = (chart, key) =>
  chart.el
    .querySelector('.apexcharts-svg')
    .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))

const focus = (chart) =>
  chart.el
    .querySelector('.apexcharts-svg')
    .dispatchEvent(new FocusEvent('focus', { bubbles: true }))

describe('synced toolbar with a toolbar-less member', () => {
  const mount = async () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
    const opts = (id, toolbar) => ({
      chart: {
        id,
        group: 'synced-tb',
        type: 'line',
        height: 300,
        animations: { enabled: false },
        toolbar,
      },
      series: [
        {
          name: 'S',
          data: [
            [1, 10],
            [2, 20],
            [3, 15],
            [4, 30],
          ],
        },
      ],
      xaxis: { type: 'numeric' },
      yaxis: { labels: { minWidth: 40 } },
    })
    const a = new ApexCharts(document.querySelector('#a'), opts('sa', {}))
    const b = new ApexCharts(
      document.querySelector('#b'),
      opts('sb', { show: false }),
    )
    await a.render()
    await b.render()
    return [a, b]
  }

  it('switches every member to pan', async () => {
    const [a, b] = await mount()
    expect(() => a.ctx.toolbar.togglePanning()).not.toThrow()
    expect([a.w.interact.panEnabled, b.w.interact.panEnabled]).toEqual([
      true,
      true,
    ])
    a.destroy()
    b.destroy()
  })

  it('switches every member to zoom and selection', async () => {
    const [a, b] = await mount()
    a.ctx.toolbar.togglePanning()
    expect(() => a.ctx.toolbar.toggleZoomSelection('zoom')).not.toThrow()
    expect([a.w.interact.zoomEnabled, b.w.interact.zoomEnabled]).toEqual([
      true,
      true,
    ])
    expect(() => a.ctx.toolbar.toggleZoomSelection('selection')).not.toThrow()
    expect(b.w.interact.selectionEnabled).toBe(true)
    a.destroy()
    b.destroy()
  })
})

describe('keyboard series step past a hidden edge series', () => {
  const nav = (wrapAround) =>
    createChartWithOptions({
      chart: {
        type: 'line',
        accessibility: {
          enabled: true,
          keyboard: {
            enabled: true,
            navigation: { enabled: true, wrapAround },
          },
        },
      },
      series: [
        { name: 'A', data: [1, 2, 3, 4] },
        { name: 'B', data: [3, 4, 5, 6] },
        { name: 'C', data: [5, 6, 7, 8] },
      ],
      tooltip: { shared: false },
    })

  it('stays on the last visible series when the last is hidden', () => {
    const chart = nav(false)
    chart.toggleSeries('C')
    focus(chart)
    const kn = chart.ctx.keyboardNavigation
    press(chart, 'ArrowDown')
    press(chart, 'ArrowDown')
    press(chart, 'ArrowDown')
    expect([kn.seriesIndex, kn.dataPointIndex]).toEqual([1, 0])
  })

  it('stays on the first visible series when the first is hidden', () => {
    const chart = nav(false)
    chart.toggleSeries('A')
    focus(chart)
    const kn = chart.ctx.keyboardNavigation
    kn.seriesIndex = 2
    press(chart, 'ArrowUp')
    press(chart, 'ArrowUp')
    press(chart, 'ArrowUp')
    expect([kn.seriesIndex, kn.dataPointIndex]).toEqual([1, 0])
  })

  it('wraps over the hidden series with wrapAround', () => {
    const chart = nav(true)
    chart.toggleSeries('C')
    focus(chart)
    const kn = chart.ctx.keyboardNavigation
    kn.seriesIndex = 1
    press(chart, 'ArrowDown')
    expect(kn.seriesIndex).toBe(0)
    press(chart, 'ArrowUp')
    expect(kn.seriesIndex).toBe(1)
  })
})

describe("keyboard '+' follows the render's zoomability", () => {
  it('leaves a category column chart alone', () => {
    const zoomed = []
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
        events: { zoomed: (_c, range) => zoomed.push(range) },
      },
      series: [{ name: 'A', data: [1, 2, 3, 4, 5, 6, 7, 8] }],
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] },
    })
    focus(chart)
    press(chart, '+')
    press(chart, '-')
    expect(chart.w.interact.zoomed).toBe(false)
    expect([chart.w.config.xaxis.min, chart.w.config.xaxis.max]).toEqual([
      undefined,
      undefined,
    ])
    expect(zoomed).toEqual([])
  })

  it('still zooms a numeric line chart', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          name: 'A',
          data: [
            [1, 4],
            [2, 6],
            [3, 5],
            [4, 8],
            [5, 7],
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })
    focus(chart)
    press(chart, '+')
    const { min, max } = chart.w.config.xaxis
    expect(min).toBeGreaterThan(1)
    expect(max).toBeLessThan(5)
  })

  // A horizontal rangeBar keeps its time domain in minY/maxY, with the
  // x globals left at their sentinels.
  const timeline = (data) => {
    const zoomed = []
    const chart = createChartWithOptions({
      chart: {
        type: 'rangeBar',
        events: { zoomed: (_c, range) => zoomed.push(range) },
      },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 'T', data }],
      xaxis: { type: 'datetime' },
    })
    focus(chart)
    return { chart, zoomed }
  }
  const tasks = [
    { x: 'a', y: [1578000000000, 1578200000000] },
    { x: 'b', y: [1578100000000, 1578400000000] },
  ]

  it('zooms a horizontal rangeBar timeline', () => {
    const { chart, zoomed } = timeline(tasks)
    press(chart, '+')
    const { min, max } = chart.w.config.xaxis
    expect(chart.w.interact.zoomed).toBe(true)
    expect(min).toBeGreaterThan(1578000000000)
    expect(max).toBeLessThan(1578400000000)
    expect(zoomed).toHaveLength(1)
  })

  it('pans a horizontal rangeBar timeline', () => {
    const { chart } = timeline(tasks)
    const { minY, maxY } = chart.w.globals
    chart.el
      .querySelector('.apexcharts-svg')
      .dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          shiftKey: true,
          bubbles: true,
        }),
      )
    const { min, max } = chart.w.config.xaxis
    expect(min).toBeGreaterThan(minY)
    expect(max - min).toBeCloseTo(maxY - minY, -3)
  })

  it('leaves an empty rangeBar timeline alone', () => {
    const { chart, zoomed } = timeline([])
    press(chart, '+')
    expect(chart.w.interact.zoomed).toBe(false)
    expect(zoomed).toEqual([])
  })
})
