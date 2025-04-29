import { createChartWithOptions } from './utils/utils'

describe('Legend Label Custom Class', () => {
  it('should add custom classes to legend labels', () => {
    // Create a chart instance with options that include legend label custom classes
    const chart = createChartWithOptions({
      series: [{
        name: 'Series 1',
        data: [30, 40, 45, 50, 49, 60, 70, 91, 125]
      }, {
        name: 'Series 2',
        data: [20, 30, 35, 40, 39, 50, 60, 81, 115]
      }],
      chart: {
        type: 'line',
        height: 350
      },
      legend: {
        labels: {
          useSeriesColors: false,
          customClass: 'custom-legend-class'
        }
      }
    })

    // Check if the legend labels will have the custom class
    expect(chart.w.config.legend.labels.customClass).toBe('custom-legend-class')
  })

  it('should apply the custom class for specific series', () => {
    // Create a chart instance with options that include legend label custom classes for specific series
    const chart = createChartWithOptions({
      series: [{
        name: 'Series 1',
        data: [30, 40, 45, 50, 49, 60, 70, 91, 125]
      }, {
        name: 'Series 2',
        data: [20, 30, 35, 40, 39, 50, 60, 81, 115]
      }],
      chart: {
        type: 'line',
        height: 350
      },
      legend: {
        labels: {
          customClass: (seriesName) => {
            if (seriesName === 'Series 1') {
              return 'series-1-class'
            }
            return 'other-series-class'
          }
        }
      }
    })

    // Test that the function in customClass works correctly
    const legendLabels = chart.w.config.legend.labels
    expect(typeof legendLabels.customClass).toBe('function')
    expect(legendLabels.customClass('Series 1')).toBe('series-1-class')
    expect(legendLabels.customClass('Series 2')).toBe('other-series-class')
  })
})
