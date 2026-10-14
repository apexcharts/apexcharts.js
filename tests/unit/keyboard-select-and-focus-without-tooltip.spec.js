// Keyboard Enter/Space and the focus cue. What the viewer saw: Enter on a
// focused bar or slice fired only markerClick, so a keyboard user could not
// select it, drill down or drive linked views (no dataPointSelection); and
// with tooltip.enabled false the arrow keys were swallowed while nothing
// showed or announced which point had focus.
import { describe, it, expect, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const svgOf = (c) => c.el.querySelector('.apexcharts-svg')
const press = (c, key) =>
  svgOf(c).dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  )
const a11y = {
  enabled: true,
  keyboard: { enabled: true, navigation: { enabled: true } },
}

async function mount(options) {
  document.body.innerHTML = '<div id="c"></div>'
  const chart = new ApexCharts(document.querySelector('#c'), {
    ...options,
    chart: {
      height: 300,
      animations: { enabled: false },
      accessibility: a11y,
      ...options.chart,
    },
  })
  await chart.render()
  svgOf(chart).focus()
  return chart
}

describe('Enter and Space do what a click does', () => {
  it('select the focused bar and fire markerClick', async () => {
    const dataPointSelection = vi.fn()
    const markerClick = vi.fn()
    const chart = await mount({
      chart: { type: 'bar', events: { dataPointSelection, markerClick } },
      series: [{ name: 'A', data: [10, 20, 30] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    press(chart, 'ArrowRight')
    press(chart, 'Enter')

    expect(dataPointSelection).toHaveBeenCalledTimes(1)
    expect(dataPointSelection.mock.calls[0][2]).toMatchObject({
      seriesIndex: 0,
      dataPointIndex: 1,
    })
    expect(chart.w.interact.selectedDataPoints[0]).toEqual([1])
    expect(markerClick).toHaveBeenCalledTimes(1)
    expect(markerClick.mock.calls[0][2]).toMatchObject({
      seriesIndex: 0,
      dataPointIndex: 1,
    })

    // Space toggles the same selection back off
    press(chart, ' ')
    expect(dataPointSelection).toHaveBeenCalledTimes(2)
    expect(chart.w.interact.selectedDataPoints[0]).toEqual([])
    chart.destroy()
  })

  it('select the focused pie slice and slide it out', async () => {
    const dataPointSelection = vi.fn()
    const chart = await mount({
      chart: { type: 'pie', events: { dataPointSelection } },
      series: [10, 20, 30],
      labels: ['a', 'b', 'c'],
    })
    const slice = (i) => chart.el.querySelector(`.apexcharts-pie-slice-${i}`)
    press(chart, 'ArrowRight')
    press(chart, 'ArrowRight')
    press(chart, 'Enter')
    expect(dataPointSelection).toHaveBeenCalledTimes(1)
    expect(dataPointSelection.mock.calls[0][2].dataPointIndex).toBe(2)
    expect(slice(2).getAttribute('data:pieClicked')).toBe('true')

    // Space slides it back in, as a second click does
    press(chart, ' ')
    expect(slice(2).getAttribute('data:pieClicked')).toBe('false')
    chart.destroy()
  })

  it('leave a slice in place when expandOnClick is off', async () => {
    const chart = await mount({
      chart: { type: 'donut' },
      plotOptions: { pie: { expandOnClick: false } },
      series: [10, 20, 30],
      labels: ['a', 'b', 'c'],
    })
    press(chart, 'Enter')
    const slice = chart.el.querySelector('.apexcharts-donut-slice-0')
    expect(slice.getAttribute('data:pieClicked')).not.toBe('true')
    chart.destroy()
  })
})

describe('with the tooltip off, the focused point still shows', () => {
  const lines = {
    chart: { type: 'line' },
    markers: { size: 4 },
    series: [
      { name: 'A', data: [10, 20, 30] },
      { name: 'B', data: [15, 25, 35] },
    ],
    xaxis: { categories: ['Jan', 'Feb', 'Mar'] },
    tooltip: { enabled: false },
  }

  it('rings, names and announces the focused marker', async () => {
    const chart = await mount(lines)
    press(chart, 'ArrowRight')

    expect(chart.w.interact.capturedDataPointIndex).toBe(1)
    const focused = chart.el.querySelector('.apexcharts-keyboard-focused')
    expect(focused).not.toBeNull()
    expect(focused.getAttribute('rel')).toBe('1')
    expect(focused.getAttribute('aria-label')).toBe('A: 20, Feb')

    await new Promise((r) => setTimeout(r, 0))
    const status = chart.el.querySelector('.apexcharts-sr-status')
    expect(status.textContent).toBe('A: 20, Feb')
    chart.destroy()
  })
})
