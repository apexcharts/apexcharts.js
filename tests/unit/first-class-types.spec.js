import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Plan 03 — promotion of 'funnel', 'pyramid', 'gauge' to first-class chart.type
// values. These aliases normalize to existing renderers (bar with isFunnel,
// radialBar) while preserving the requested name on `chart.requestedType`.

describe("chart.type: 'funnel' first-class alias", () => {
  it('normalizes chart.type to bar and preserves requestedType', () => {
    const chart = createChartWithOptions({
      chart: { type: 'funnel' },
      series: [{ name: 'Funnel', data: [1380, 1100, 990, 880] }],
      xaxis: { categories: ['A', 'B', 'C', 'D'] },
    })
    expect(chart.w.config.chart.type).toBe('bar')
    expect(chart.w.config.chart.requestedType).toBe('funnel')
  })

  it('auto-enables isFunnel and horizontal bar', () => {
    const chart = createChartWithOptions({
      chart: { type: 'funnel' },
      series: [{ name: 'Funnel', data: [1380, 1100, 990, 880] }],
      xaxis: { categories: ['A', 'B', 'C', 'D'] },
    })
    expect(chart.w.config.plotOptions.bar.isFunnel).toBe(true)
    expect(chart.w.config.plotOptions.bar.horizontal).toBe(true)
  })

  it('renders the funnel SVG without errors', () => {
    createChartWithOptions({
      chart: { type: 'funnel' },
      series: [{ name: 'Funnel', data: [1380, 1100, 990, 880] }],
      xaxis: { categories: ['A', 'B', 'C', 'D'] },
    })
    expect(document.querySelector('.apexcharts-svg')).toBeTruthy()
    expect(
      document.querySelectorAll('.apexcharts-bar-area').length,
    ).toBeGreaterThan(0)
  })
})

describe("chart.type: 'pyramid' first-class alias", () => {
  it('normalizes chart.type to bar and preserves requestedType', () => {
    const chart = createChartWithOptions({
      chart: { type: 'pyramid' },
      series: [{ name: 'Pyramid', data: [200, 800, 2000, 5000] }],
      xaxis: { categories: ['CEO', 'VPs', 'Managers', 'ICs'] },
    })
    expect(chart.w.config.chart.type).toBe('bar')
    expect(chart.w.config.chart.requestedType).toBe('pyramid')
  })

  it('auto-enables isFunnel and horizontal bar (same renderer as funnel)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'pyramid' },
      series: [{ name: 'Pyramid', data: [200, 800, 2000, 5000] }],
      xaxis: { categories: ['CEO', 'VPs', 'Managers', 'ICs'] },
    })
    expect(chart.w.config.plotOptions.bar.isFunnel).toBe(true)
    expect(chart.w.config.plotOptions.bar.horizontal).toBe(true)
  })
})

describe("chart.type: 'gauge' first-class alias", () => {
  it('normalizes chart.type to radialBar and preserves requestedType', () => {
    const chart = createChartWithOptions({
      chart: { type: 'gauge' },
      series: [72],
    })
    expect(chart.w.config.chart.type).toBe('radialBar')
    expect(chart.w.config.chart.requestedType).toBe('gauge')
  })

  it('applies half-circle gauge defaults (startAngle/endAngle)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'gauge' },
      series: [72],
    })
    expect(chart.w.config.plotOptions.radialBar.startAngle).toBe(-135)
    expect(chart.w.config.plotOptions.radialBar.endAngle).toBe(135)
  })

  it('lets user override gauge defaults', () => {
    const chart = createChartWithOptions({
      chart: { type: 'gauge' },
      series: [50],
      plotOptions: {
        radialBar: { startAngle: -90, endAngle: 90 },
      },
    })
    expect(chart.w.config.plotOptions.radialBar.startAngle).toBe(-90)
    expect(chart.w.config.plotOptions.radialBar.endAngle).toBe(90)
  })

  it('renders the gauge SVG without errors', () => {
    createChartWithOptions({
      chart: { type: 'gauge' },
      series: [72],
    })
    expect(document.querySelector('.apexcharts-svg')).toBeTruthy()
    expect(document.querySelector('.apexcharts-radialbar')).toBeTruthy()
  })
})

describe('legacy paths remain unaffected', () => {
  it("chart.type: 'bar' + plotOptions.bar.isFunnel: true still works (no requestedType set)", () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [{ name: 'Funnel', data: [1380, 1100, 990, 880] }],
      xaxis: { categories: ['A', 'B', 'C', 'D'] },
      plotOptions: { bar: { isFunnel: true, horizontal: true } },
    })
    expect(chart.w.config.chart.type).toBe('bar')
    expect(chart.w.config.chart.requestedType).toBeUndefined()
    expect(chart.w.config.plotOptions.bar.isFunnel).toBe(true)
  })

  it("chart.type: 'radialBar' still works without alias normalization", () => {
    const chart = createChartWithOptions({
      chart: { type: 'radialBar' },
      series: [50],
    })
    expect(chart.w.config.chart.type).toBe('radialBar')
    expect(chart.w.config.chart.requestedType).toBeUndefined()
  })
})
