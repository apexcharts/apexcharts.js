import Range from '../../src/modules/Range.js'
import series2dArrayNumeric from './data/series2dArrayNumeric.js'
import { createChartWithOptions } from './utils/utils.js'

describe('x-axis when 2 datapoints area provided in a line chart', () => {
  it('should set the x-axis min and max from the 2 points for a line chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
            {
              x: 2022,
              y: 15336,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.xAxisScale.result).toEqual([2021, 2022])
  })
})

describe('x-axis when 2 datapoints area provided in a column chart', () => {
  it('should set the x-axis min and max from the 2 points in a column chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
            {
              x: 2022,
              y: 15336,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.minX).toEqual(2021)
    expect(chart.w.globals.maxX).toEqual(2022)
  })
})

describe('x-axis when 1 datapoint is provided in a line chart', () => {
  it('should set the x-axis min and max from a single data-points in a line chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.xAxisScale.result).toEqual([2021])
  })
})

describe('x-axis when 1 datapoint is provided in a column chart', () => {
  it('should set the x-axis min and max from a single data-points in a column chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.xAxisScale.result).toEqual([2021])
  })
})

describe('x-axis when more than 10 datapoints are provided in a line chart', () => {
  it('should set the x-axis min and max from 10 data-points in a line chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
            {
              x: 2022,
              y: 15336,
            },
            {
              x: 2023,
              y: 15951,
            },
            {
              x: 2024,
              y: 11343,
            },
            {
              x: 2025,
              y: 18845,
            },
            {
              x: 2026,
              y: 15104,
            },
            {
              x: 2027,
              y: 10596,
            },
            {
              x: 2028,
              y: 18725,
            },
            {
              x: 2029,
              y: 17630,
            },
            {
              x: 2030,
              y: 13692,
            },
            {
              x: 2031,
              y: 17766,
            },
            {
              x: 2032,
              y: 23432,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.xAxisScale.result).toEqual([
      2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032,
    ])
  })
})

describe('x-axis when more than 10 datapoints are provided in a column chart', () => {
  it('should set the x-axis min and max from 10 data-points in a column chart', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
      },
      series: [
        {
          data: [
            {
              x: 2021,
              y: 13271,
            },
            {
              x: 2022,
              y: 15336,
            },
            {
              x: 2023,
              y: 15951,
            },
            {
              x: 2024,
              y: 11343,
            },
            {
              x: 2025,
              y: 18845,
            },
            {
              x: 2026,
              y: 15104,
            },
            {
              x: 2027,
              y: 10596,
            },
            {
              x: 2028,
              y: 18725,
            },
            {
              x: 2029,
              y: 17630,
            },
            {
              x: 2030,
              y: 13692,
            },
            {
              x: 2031,
              y: 17766,
            },
            {
              x: 2032,
              y: 23432,
            },
          ],
        },
      ],
    })

    expect(chart.w.globals.minX).toEqual(2021)
    expect(chart.w.globals.maxX).toEqual(2032)
  })
})

describe('User defined X-axis min/max', () => {
  it('should set the min and max of x-axis based on user input', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: series2dArrayNumeric,
      xaxis: {
        min: 0,
        max: 40,
      },
    })

    const range = new Range(chart)
    const xRange = range.setXRange()

    expect(xRange.minX).toEqual(0)
    expect(xRange.maxX).toEqual(40)
  })
})

describe('Timeline Series', () => {
  it.only('globals.seriesXvalues[index] should have a correct length', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: "blue",
          data: [[1697511654207, 2.46]]
        },
        {
          name: "green",
          data: [[1697511328360, 2.53]]
        },
        {
          name: "yellow",
          data: [[1697511328360, 2.33]]
        }
      ],
      xaxis: {
        type: 'datetime',
        max: 1697522893476,
        min: 1697263693476,
        tickAmount: 10,
        convertedCatToNumeric: false,
        labels: {
          datetimeUTC: false,
          formatter: undefined,
          datetimeFormatter: {
            year: 'yyyy',
            month: 'MMM yyyy',
            day: 'dd MMM',
            hour: 'HH:mm'
          }
        }
      },
      yaxis: {
        tickAmount: 10,
        title: {
          text: 'Odds'
        },
        labels: {
          formatter: (val) => {
            return parseFloat(val).toFixed(2)
          }
        },
        min: (min) => min - 0.5,
        max: 3.03
      },
      grid: {
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      stroke: {
        width: 3,
        curve: 'stepline',
        dashArray: [0, 0, 0, 4],
        show: true
      }
    })
    const iterations = chart.w.globals.dataPoints > 1
      ? chart.w.globals.dataPoints - 1
      : chart.w.globals.dataPoints
    chart.w.globals.seriesXvalues.forEach(item => {
      expect(item.length === iterations)
    })
  })
})
