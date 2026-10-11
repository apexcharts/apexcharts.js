/**
 * What building a chart does to the options it is handed, and how it reads
 * options that leave sections out.
 *
 * Config.init used to write into the caller's object: the defaulted chart
 * type, alias rewrites, the defaulted y-axis array, dark-theme colours. An
 * object reused for a second chart then carried the first one's settings, and
 * a histogram's options handed back to updateOptions had become a bar's.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/entries/histogram.js'
import '../../src/entries/candlestick.js'
import './__mocks__/ResizeObserver.js'

function host(id) {
  const d = document.createElement('div')
  d.id = id
  document.body.appendChild(d)
  return d
}

const LINE = { type: 'line', animations: { enabled: false } }

afterEach(() => {
  document.body.innerHTML = ''
  window.Apex = {}
})

describe("construction leaves the caller's options alone", () => {
  it('the options object comes back exactly as it went in', () => {
    const opts = {
      chart: { ...LINE },
      series: [{ name: 'a', data: [1, 2, 3] }],
      yaxis: { min: 0 },
      xaxis: { categories: ['a', 'b', 'c'] },
      theme: { mode: 'dark' },
      annotations: { yaxis: [{ y: 2 }] },
      plotOptions: { bar: { horizontal: false } },
    }
    const before = JSON.stringify(opts)
    new ApexCharts(host('m1'), opts)
    expect(JSON.stringify(opts)).toBe(before)
  })

  it('a dark chart does not leak its styling into a second chart', () => {
    const opts = {
      chart: { ...LINE },
      series: [{ name: 'a', data: [1, 2, 3] }],
      theme: { mode: 'dark' },
    }
    new ApexCharts(host('d1'), opts)
    opts.theme.mode = 'light'
    const reused = new ApexCharts(host('d2'), opts)
    const fresh = new ApexCharts(host('d3'), {
      chart: { ...LINE },
      series: [{ name: 'a', data: [1, 2, 3] }],
      theme: { mode: 'light' },
    })
    expect(reused.w.config.chart.foreColor).toBe(fresh.w.config.chart.foreColor)
    expect(reused.w.config.theme.palette).toBe(fresh.w.config.theme.palette)
    expect(reused.w.config.tooltip.theme).toBe(fresh.w.config.tooltip.theme)
  })

  it('a histogram keeps its type when its options are handed back', async () => {
    const opts = {
      chart: { type: 'histogram', animations: { enabled: false } },
      series: [{ name: 'a', data: [1, 2, 2, 3, 3, 3, 4, 5, 6] }],
    }
    const chart = new ApexCharts(host('h1'), opts)
    await chart.render()
    expect(opts.chart.type).toBe('histogram')
    await expect(chart.updateOptions(opts)).resolves.toBeDefined()
    expect(chart.w.config.chart.requestedType).toBe('histogram')
  })

  it('window.Apex.xaxis is not marked by one chart for the next', () => {
    window.Apex = { xaxis: { tickAmount: 3 } }
    new ApexCharts(host('g1'), {
      chart: { ...LINE },
      series: [{ data: [1, 2, 3] }],
    })
    expect(window.Apex.xaxis).toEqual({ tickAmount: 3 })
  })
})

describe('options with no chart section', () => {
  it('default to a line chart', () => {
    const a = new ApexCharts(host('n1'), { series: [{ data: [1, 2] }] })
    expect(a.w.config.chart.type).toBe('line')
    const b = new ApexCharts(host('n2'), {
      chart: undefined,
      series: [{ data: [1, 2] }],
    })
    expect(b.w.config.chart.type).toBe('line')
  })
})

describe('options with no series', () => {
  it('a logarithmic y-axis chart can start without series', () => {
    expect(
      () =>
        new ApexCharts(host('l1'), {
          chart: { ...LINE },
          yaxis: { logarithmic: true },
        }),
    ).not.toThrow()
  })
})

describe('window.Apex.yaxis', () => {
  it("fills in what the chart leaves unset, and the chart's own wins", () => {
    window.Apex = { yaxis: { min: 0, tickAmount: 4 } }
    const chart = new ApexCharts(host('y1'), {
      chart: { ...LINE },
      series: [{ data: [10, 20, 30] }],
      yaxis: { min: 10 },
    })
    expect(chart.w.config.yaxis[0].min).toBe(10)
    expect(chart.w.config.yaxis[0].tickAmount).toBe(4)
  })
})
