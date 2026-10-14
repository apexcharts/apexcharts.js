// Where the arrow keys can reach. What the viewer saw: with wrapAround off,
// arrowing past the last value before trailing nulls (or the first after
// leading ones) jumped to the other end of the series; on a radialBar the
// arrows never left the first ring, no focus ring showed and the tooltip
// stayed wherever it last was; and with the tooltip off, up and down could
// not reach another series.
import { describe, it, expect, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const svgOf = (c) => c.el.querySelector('.apexcharts-svg')
const press = (c, key) =>
  svgOf(c).dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  )

async function mount(options, navigation = {}) {
  document.body.innerHTML = '<div id="c"></div>'
  const chart = new ApexCharts(document.querySelector('#c'), {
    ...options,
    chart: {
      height: 300,
      animations: { enabled: false },
      accessibility: {
        enabled: true,
        keyboard: {
          enabled: true,
          navigation: { enabled: true, ...navigation },
        },
      },
      ...options.chart,
    },
  })
  await chart.render()
  svgOf(chart).focus()
  return chart
}

const line = (data) => ({
  chart: { type: 'line' },
  series: [{ name: 'A', data }],
})

describe('null skipping respects wrapAround', () => {
  it('stays on the last value before trailing nulls', async () => {
    const chart = await mount(line([1, 2, 3, null, null]), {
      wrapAround: false,
    })
    const kn = chart.keyboardNavigation
    press(chart, 'End')
    expect(kn.dataPointIndex).toBe(2)
    press(chart, 'ArrowRight')
    expect(kn.dataPointIndex).toBe(2)
    chart.destroy()
  })

  it('stays on the first value after leading nulls', async () => {
    const chart = await mount(line([null, null, 1, 2]), { wrapAround: false })
    const kn = chart.keyboardNavigation
    press(chart, 'Home')
    expect(kn.dataPointIndex).toBe(2)
    press(chart, 'ArrowLeft')
    expect(kn.dataPointIndex).toBe(2)
    chart.destroy()
  })

  it('still steps over a gap, and wraps when asked to', async () => {
    const chart = await mount(line([1, null, null, 4, null]), {
      wrapAround: true,
    })
    const kn = chart.keyboardNavigation
    press(chart, 'ArrowRight')
    expect(kn.dataPointIndex).toBe(3)
    press(chart, 'ArrowRight')
    expect(kn.dataPointIndex).toBe(0)
    press(chart, 'ArrowLeft')
    expect(kn.dataPointIndex).toBe(3)
    chart.destroy()
  })
})

describe('radialBar rings', () => {
  it('down moves to the next ring, rings it and anchors the tooltip on it', async () => {
    const chart = await mount({
      chart: { type: 'radialBar', height: 350 },
      series: [70, 40],
      labels: ['A', 'B'],
      tooltip: { enabled: true },
    })
    const tt = chart.w.globals.tooltip
    const place = vi.spyOn(tt.tooltipPosition, 'placeOverAnchor')

    press(chart, 'ArrowDown')
    expect(chart.keyboardNavigation.seriesIndex).toBe(1)
    const arc = chart.el.querySelector('.apexcharts-radialbar-slice-1')
    expect(arc.classList.contains('apexcharts-keyboard-focused')).toBe(true)
    expect(arc.getAttribute('aria-label')).toBe('B: 40')
    const anchor = tt.getSliceAnchor(arc)
    const [x, y] = place.mock.calls.at(-1)
    expect(x).toBeCloseTo(anchor.x, 1)
    expect(y).toBeCloseTo(anchor.y, 1)

    // a ring is one value: left and right keep the cursor on it
    press(chart, 'ArrowRight')
    expect(chart.keyboardNavigation.dataPointIndex).toBe(0)
    expect(arc.classList.contains('apexcharts-keyboard-focused')).toBe(true)
    chart.destroy()
  })
})

describe('without a tooltip', () => {
  it('up and down reach the other series', async () => {
    const chart = await mount({
      chart: { type: 'line' },
      markers: { size: 4 },
      series: [
        { name: 'A', data: [10, 20, 30] },
        { name: 'B', data: [15, 25, 35] },
      ],
      xaxis: { categories: ['Jan', 'Feb', 'Mar'] },
      tooltip: { enabled: false },
    })
    press(chart, 'ArrowDown')
    expect(chart.keyboardNavigation.seriesIndex).toBe(1)
    expect(chart.w.interact.capturedSeriesIndex).toBe(1)
    chart.destroy()
  })
})
