import { describe, it, expect, vi, beforeAll } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'

// ---------------------------------------------------------------------------
// Marks (#11): registerSeriesType + the CustomSeries adapter.
// ---------------------------------------------------------------------------

const dot = {
  renderItem({ x, y, api, color }) {
    api.circle({ cx: x, cy: y, r: 5, fill: color })
    api.text({ x, y: y - 10, text: 'v', size: '10px' })
  },
}

beforeAll(() => {
  ApexCharts.registerSeriesType('dot', dot)
})

function dotChart(type = 'dot') {
  return createChartWithOptions({
    chart: { type, animations: { enabled: false }, toolbar: { show: false } },
    legend: { show: false },
    series: [{ name: 'S1', data: [[0, 3], [1, 6], [2, 4], [3, 8]] }],
    xaxis: { type: 'numeric' },
  })
}

describe('Marks: adapter render', () => {
  it('draws tagged marks and fills the shared coordinate caches', async () => {
    const chart = dotChart()
    await chart.render()
    const el = chart.w.dom.baseEl
    const marks = el.querySelectorAll('.apexcharts-marks-mark')
    // two primitives per datum (circle + text), four data points
    expect(marks.length).toBe(8)
    expect(marks[0].getAttribute('index')).toBe('0')
    expect(marks[0].getAttribute('j')).toBe('0')
    expect(el.querySelector('.apexcharts-marks-series')).toBeTruthy()
    // pixel caches drive the shared tooltip / crosshair / keyboard nav
    expect(chart.w.globals.seriesXvalues[0].length).toBe(4)
    expect(chart.w.globals.pointsArray[0].length).toBe(4)
    chart.destroy()
  })

  it('isolates a throwing renderItem: warns once, draws the remaining data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ApexCharts.registerSeriesType('brittle', {
      renderItem({ datum, x, y, api }) {
        if (datum[1] === 6) throw new Error('boom')
        api.circle({ cx: x, cy: y, r: 4, fill: '#000' })
      },
    })
    const chart = dotChart('brittle')
    await chart.render()
    const marks = chart.w.dom.baseEl.querySelectorAll('.apexcharts-marks-mark')
    expect(marks.length).toBe(3) // one datum threw
    const thrown = warn.mock.calls.filter((c) => String(c[0]).includes('renderItem'))
    expect(thrown.length).toBe(1)
    warn.mockRestore()
    chart.destroy()
    ApexCharts.unregisterSeriesType('brittle')
  })
})

describe('Marks: registry safety', () => {
  it('rejects overriding a built-in chart type', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ApexCharts.registerSeriesType('line', { renderItem: () => {} })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('built-in'))
    expect(globalThis.__apexcharts_custom_types__.has('line')).toBe(false)
    warn.mockRestore()
  })

  it('re-registering a custom name replaces it', async () => {
    ApexCharts.registerSeriesType('dot', {
      renderItem({ x, y, api }) {
        api.rect({ x: x - 3, y: y - 3, w: 6, h: 6, fill: '#000' })
      },
    })
    const chart = dotChart()
    await chart.render()
    expect(
      chart.w.dom.baseEl.querySelectorAll('rect.apexcharts-marks-mark').length,
    ).toBe(4)
    chart.destroy()
    ApexCharts.registerSeriesType('dot', dot) // restore for other tests
  })

  it('unregisterSeriesType removes custom types only', () => {
    ApexCharts.registerSeriesType('temp', { renderItem: () => {} })
    expect(globalThis.__apexcharts_custom_types__.has('temp')).toBe(true)
    ApexCharts.unregisterSeriesType('temp')
    expect(globalThis.__apexcharts_custom_types__.has('temp')).toBe(false)
    expect(globalThis.__apexcharts_registry__.temp).toBeUndefined()

    ApexCharts.unregisterSeriesType('line') // built-in: must be a no-op
    expect(globalThis.__apexcharts_registry__.line).toBeTruthy()
  })
})
