import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'

// The Theme instance and w.config both survive updateOptions, so anything
// Theme caches or writes into config on one render is still there on the next.
// Each block below is a value that used to stick after the option that
// produced it had changed.

afterEach(() => {
  ;['nightA', 'dayB', 'plain', 'brand'].forEach((n) =>
    ApexCharts.unregisterTheme(n),
  )
  vi.restoreAllMocks()
})

const eight = [10, 20, 30, 40, 50, 60, 70, 80]

describe('Theme: distribution and colour functions are read per render', () => {
  it('turning bar.distributed on extends the palette to every bar', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [{ data: eight }],
      colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#8c564b'],
    })
    await chart.render()
    await chart.updateOptions({ plotOptions: { bar: { distributed: true } } })

    const fills = chart.w.globals.fill.colors
    expect(fills.length).toBeGreaterThanOrEqual(8)
    expect(fills.slice(0, 8).every(Boolean)).toBe(true)
    expect(warn).not.toHaveBeenCalledWith('undefined color - ApexCharts')
    chart.destroy()
  })

  it('colour functions never write into config.colors', async () => {
    const fn = () => '#2ca02c'
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [{ data: [1, 2] }, { data: [3, 4] }, { data: [5, 6] }],
      colors: [fn],
    })
    await chart.render()
    expect(chart.w.config.colors).toHaveLength(1)
    chart.destroy()
  })

  it('plain colours after colour functions resolve from the palette', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [{ data: [1, 2] }, { data: [3, 4] }],
      colors: [() => '#2ca02c'],
    })
    await chart.render()
    await chart.updateOptions({ colors: [] })

    expect(chart.w.config.colors).toEqual([])
    const fills = chart.w.globals.fill.colors
    expect(typeof fills[0]).toBe('string')
    expect(typeof fills[1]).toBe('string')
    expect(warn).not.toHaveBeenCalledWith('undefined color - ApexCharts')
    chart.destroy()
  })
})

describe('Theme: monochrome with distributed bars', () => {
  it('renders an empty series instead of throwing', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'bar', animations: { enabled: false } },
      plotOptions: { bar: { distributed: true } },
      theme: { monochrome: { enabled: true, color: '#1f77b4' } },
      series: [],
    })
    await expect(chart.render()).resolves.toBeTruthy()
    chart.destroy()
  })

  it('gives every bar its own shade when series[0] is not the longest', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      plotOptions: { bar: { distributed: true } },
      theme: { monochrome: { enabled: true, color: '#1f77b4' } },
      series: [{ data: [1, 2] }, { data: [1, 2, 3, 4] }],
    })
    await chart.render()
    const colors = chart.w.globals.colors
    expect(colors).toHaveLength(8)
    expect(new Set(colors).size).toBe(8)
    chart.destroy()
  })
})

