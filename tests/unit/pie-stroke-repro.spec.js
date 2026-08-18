import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

describe('Pie chart stroke with single series (Closes #5084)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('single-slice pie chart should not have stroke-width applied', () => {
    const chart = createChartWithOptions({
      chart: { type: 'pie', width: 800 },
      series: [44], // single slice = full circle
      stroke: { show: true, width: 4, colors: ['#fff'] },
      labels: ['Single'],
    })

    const slice = chart.w.dom.baseEl.querySelector('.apexcharts-pie-area')
    expect(slice).toBeTruthy()

    // The stroke-width should be 0 for single-slice pie charts
    const strokeWidth = parseFloat(slice.getAttribute('stroke-width'))
    expect(strokeWidth).toBe(0)
  })

  it('multi-slice pie chart should still have stroke', () => {
    const chart = createChartWithOptions({
      chart: { type: 'pie', width: 800 },
      series: [44, 55, 67], // multiple slices
      stroke: { show: true, width: 4, colors: ['#fff'] },
      labels: ['A', 'B', 'C'],
    })

    const slices = chart.w.dom.baseEl.querySelectorAll('.apexcharts-pie-area')
    expect(slices.length).toBe(3)

    // Each slice should have the configured stroke-width
    slices.forEach((slice) => {
      const strokeWidth = parseFloat(slice.getAttribute('stroke-width'))
      expect(strokeWidth).toBe(4)
    })
  })
})