import { createChartWithOptions } from './utils/utils.js'

describe('x-axis with very small numeric values', () => {
  it('should generate unique labels for x-axis values between 0.001 and 0.009', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            { x: 0.001, y: 30 },
            { x: 0.002, y: 40 },
            { x: 0.003, y: 45 },
            { x: 0.004, y: 50 },
            { x: 0.005, y: 49 },
            { x: 0.006, y: 60 },
            { x: 0.007, y: 70 },
            { x: 0.008, y: 91 },
            { x: 0.009, y: 125 },
          ],
        },
      ],
      xaxis: {
        type: 'numeric',
        labels: {
          formatter: function (val) {
            return val.toFixed(6) + ' s'
          },
        },
      },
    })

    const xAxisScale = chart.w.globals.xAxisScale.result
    
    // Check that we have generated scale values
    expect(xAxisScale.length).toBeGreaterThan(0)
    
    // Check that all values are unique (convert to fixed strings for comparison)
    const uniqueValues = new Set(xAxisScale.map(v => v.toFixed(6)))
    expect(uniqueValues.size).toBe(xAxisScale.length)
    
    // Check that values are within the expected range
    expect(Math.min(...xAxisScale)).toBeLessThanOrEqual(0.001)
    expect(Math.max(...xAxisScale)).toBeGreaterThanOrEqual(0.009)
  })

  it('should generate unique labels for x-axis values between 0.01 and 0.09', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            { x: 0.01, y: 30 },
            { x: 0.02, y: 40 },
            { x: 0.03, y: 45 },
            { x: 0.04, y: 50 },
            { x: 0.05, y: 49 },
            { x: 0.06, y: 60 },
            { x: 0.07, y: 70 },
            { x: 0.08, y: 91 },
            { x: 0.09, y: 125 },
          ],
        },
      ],
      xaxis: {
        type: 'numeric',
        labels: {
          formatter: function (val) {
            return val.toFixed(6) + ' s'
          },
        },
      },
    })

    const xAxisScale = chart.w.globals.xAxisScale.result
    
    // Check that we have generated scale values
    expect(xAxisScale.length).toBeGreaterThan(0)
    
    // Check that all values are unique (convert to fixed strings for comparison)
    const uniqueValues = new Set(xAxisScale.map(v => v.toFixed(6)))
    expect(uniqueValues.size).toBe(xAxisScale.length)
    
    // Check that values are within the expected range
    expect(Math.min(...xAxisScale)).toBeLessThanOrEqual(0.01)
    expect(Math.max(...xAxisScale)).toBeGreaterThanOrEqual(0.09)
  })

  it('should handle even smaller values (0.0001 to 0.0009)', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            { x: 0.0001, y: 30 },
            { x: 0.0002, y: 40 },
            { x: 0.0003, y: 45 },
            { x: 0.0004, y: 50 },
            { x: 0.0005, y: 49 },
            { x: 0.0006, y: 60 },
            { x: 0.0007, y: 70 },
            { x: 0.0008, y: 91 },
            { x: 0.0009, y: 125 },
          ],
        },
      ],
      xaxis: {
        type: 'numeric',
      },
    })

    const xAxisScale = chart.w.globals.xAxisScale.result
    
    // Check that we have generated scale values
    expect(xAxisScale.length).toBeGreaterThan(0)
    
    // Check that all values are unique
    const uniqueValues = new Set(xAxisScale)
    expect(uniqueValues.size).toBe(xAxisScale.length)
    
    // Check that values are within the expected range
    expect(Math.min(...xAxisScale)).toBeLessThanOrEqual(0.0001)
    expect(Math.max(...xAxisScale)).toBeGreaterThanOrEqual(0.0009)
  })
})
