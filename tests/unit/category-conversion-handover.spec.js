/**
 * Whether a category x axis is drawn as numbers (a category line or area) or
 * as names (a horizontal bar, a heatmap) depends on the type and orientation.
 * It was decided once at construction, so a category line switched to a
 * horizontal bar by updateOptions kept the numeric axis: the bars were
 * labelled 1, 2, 3 and the value labels were empty.
 */
import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'

afterEach(() => {
  document.body.innerHTML = ''
})

function host() {
  const d = document.createElement('div')
  document.body.appendChild(d)
  return d
}

const CHART = { width: 500, height: 300, animations: { enabled: false } }
const SERIES = [{ name: 's', data: [5, 3, 4] }]
const CATS = ['Jan', 'Feb', 'Mar']
const HBAR = { chart: { type: 'bar' }, plotOptions: { bar: { horizontal: true } } }

const texts = (el, sel) =>
  [...el.querySelectorAll(`${sel} text`)].map((t) => t.textContent)

describe('category to numeric conversion on a type change', () => {
  it('a category line switched to a horizontal bar reads like a fresh one', async () => {
    const chart = new ApexCharts(host(), {
      chart: { ...CHART, type: 'line' },
      series: SERIES,
      xaxis: { categories: CATS },
    })
    await chart.render()
    expect(chart.w.config.xaxis.convertedCatToNumeric).toBe(true)

    await chart.updateOptions(HBAR)
    const x = chart.w.config.xaxis
    expect(x.convertedCatToNumeric).toBe(false)
    expect(x.type).toBe('category')
    expect(x.tickAmount).toBeUndefined()

    const fresh = new ApexCharts(host(), {
      chart: { ...CHART, type: 'bar' },
      plotOptions: { bar: { horizontal: true } },
      series: SERIES,
      xaxis: { categories: CATS },
    })
    await fresh.render()
    expect(texts(chart.el, '.apexcharts-yaxis-texts-g')).toEqual(CATS)
    expect(texts(chart.el, '.apexcharts-xaxis-texts-g')).toEqual(
      texts(fresh.el, '.apexcharts-xaxis-texts-g'),
    )
    chart.destroy()
    fresh.destroy()
  })

  it("restores the user's own formatter when the conversion is dropped", async () => {
    const fmt = (v) => `<${v}>`
    const chart = new ApexCharts(host(), {
      chart: { ...CHART, type: 'line' },
      series: SERIES,
      xaxis: { categories: CATS, labels: { formatter: fmt } },
    })
    await chart.render()
    await chart.updateOptions(HBAR)
    expect(chart.w.config.xaxis.labels.formatter).toBe(fmt)
    expect(chart.w.config.xaxis.categories).toEqual(CATS)
    chart.destroy()
  })

  it('a horizontal bar switched to a line converts like a fresh line', async () => {
    const chart = new ApexCharts(host(), {
      chart: { ...CHART, type: 'bar' },
      plotOptions: { bar: { horizontal: true } },
      series: SERIES,
      xaxis: { categories: CATS },
    })
    await chart.render()
    expect(chart.w.config.xaxis.convertedCatToNumeric).toBe(false)
    await chart.updateOptions({
      chart: { type: 'line' },
      plotOptions: { bar: { horizontal: false } },
    })
    expect(chart.w.config.xaxis.convertedCatToNumeric).toBe(true)
    expect(chart.w.config.xaxis.type).toBe('numeric')
    expect(texts(chart.el, '.apexcharts-xaxis-texts-g')).toEqual(CATS)
    chart.destroy()
  })
})
