// The radialBar centre labels append '%' only on the default 0..100 domain:
// a custom min/max (a speedometer) prints the plain reading.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

function gauge(radialBar = {}, series = [72]) {
  return createChartWithOptions({
    chart: { type: 'gauge', height: 350 },
    series,
    plotOptions: { radialBar },
  })
}

describe('radialBar default formatters', () => {
  const valueText = () =>
    document.querySelector('.apexcharts-datalabel-value').textContent

  it('append % on the default 0..100 domain', () => {
    gauge({}, [72])
    expect(valueText()).toBe('72%')
  })

  it('print the plain reading on a custom domain', () => {
    gauge({ min: 0, max: 240 }, [180])
    expect(valueText()).toBe('180')
  })

  it('print the plain average as the total on a custom domain', () => {
    createChartWithOptions({
      chart: { type: 'radialBar', height: 350 },
      series: [180, 60],
      plotOptions: {
        radialBar: { min: 0, max: 240, dataLabels: { total: { show: true } } },
      },
    })
    expect(valueText()).toBe('120')
  })

  it('keep % on the total for the default domain', () => {
    createChartWithOptions({
      chart: { type: 'radialBar', height: 350 },
      series: [40, 60],
      plotOptions: { radialBar: { dataLabels: { total: { show: true } } } },
    })
    expect(valueText()).toBe('50%')
  })
})
