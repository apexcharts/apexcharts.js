import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Drawing the y axis used to pad yaxis[].labels.style.colors in place
// (Theme.pushExtraColors on the live config), once per label: a default
// chart ended with `[undefined x6]` in w.config, which wrappers that diff
// the config and getState read back as options the user never set.

const series = [{ name: 'a', data: [10, 40, 25, 60, 35, 80] }]

/** @param {any} chart @param {string} sel */
const fills = (chart, sel) =>
  [...chart.w.dom.baseEl.querySelectorAll(sel)].map((t) =>
    t.getAttribute('fill'),
  )

describe('y axis label colours leave the config alone', () => {
  it('a default line chart keeps colors empty, render and update', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series,
    })
    expect(chart.w.config.yaxis[0].labels.style.colors).toEqual([])
    chart.updateOptions({ yaxis: { tickAmount: 8 } }, false, false)
    expect(chart.w.config.yaxis[0].labels.style.colors).toEqual([])
  })

  it('a short user palette is cycled per label but not grown', () => {
    const colors = ['#ff0000', '#00aa00']
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      yaxis: { tickAmount: 5, labels: { style: { colors } } },
      series,
    })
    expect(colors).toEqual(['#ff0000', '#00aa00'])
    expect(chart.w.config.yaxis[0].labels.style.colors).toEqual(colors)
    // labels draw from the top tick (i = tickAmount) down to i = 0
    expect(fills(chart, '.apexcharts-yaxis-label')).toEqual([
      '#00aa00',
      '#ff0000',
      '#00aa00',
      '#ff0000',
      '#00aa00',
      '#ff0000',
    ])
  })

  it('a horizontal bar (value axis drawn as x) keeps colors untouched', () => {
    const colors = ['#ff0000']
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      plotOptions: { bar: { horizontal: true } },
      yaxis: { labels: { style: { colors } } },
      series,
    })
    expect(chart.w.config.yaxis[0].labels.style.colors).toEqual(['#ff0000'])
    // the palette is cycled to the value scale's tick count, as before
    const ticks = chart.w.globals.yAxisScale[0].result.length
    const labelFills = fills(chart, '.apexcharts-yaxis-label')
    expect(ticks).toBeGreaterThan(1)
    expect(labelFills.slice(0, ticks)).toEqual(Array(ticks).fill('#ff0000'))
  })
})
