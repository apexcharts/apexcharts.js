import Range from '../../src/modules/Range.js'
import { createChartWithOptions } from './utils/utils.js'

describe('Y-axis with ultra-small values', () => {
  it('should return small range of min/max when ultra small values are provided', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            [1553258700000, 0.0037721],
            [1553259000000, 0.0037814],
            [1553261100000, 0.003799],
            [1553262900000, 0.0037601],
          ],
        },
      ],
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        decimalsInFloat: 7,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY.toFixed(6)).toEqual('0.003760')
    expect(yRange.maxY.toFixed(6)).toEqual('0.003800')
  })

  it('should not apply nice scale for small values', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            [1553258700000, 1],
            [1553259000000, 2],
            [1553261100000, 4],
          ],
        },
      ],
      xaxis: {
        type: 'datetime',
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(1)
    expect(yRange.maxY).toEqual(4)
  })
})

describe('yaxis scale to ignore duplication if fractions are present in series', () => {
  it('yaxis scale should ignore duplication of labels when non integers are provided', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            1.2321908386878013, 1.956555241215017, 1.8841188009622953,
            1.8116823607095738, 1.7392459204568522, 1.6668094802041307,
            1.594373039951409, 1.5219365996986876, 1.449500159445966,
            1.3770637191932444, 1.3046272789405229, 1.2321908386878013,
          ],
        },
      ],
      xaxis: {
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
      },
      yaxis: {
        tickAmount: 8,
        labels: {
          formatter: (val) => {
            return val.toFixed(2)
          },
        },
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.yAxisScale[0].result).toEqual([
      1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2,
    ])
  })
})

describe('user defined Y-axis min/max', () => {
  it('should set the min and max of y-axis based on user input', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            3.536028, 3.470967000000001, 4.4500410000000015, 4.263021,
            4.471937999999999, 4.791986999999999, 3.6769680000000005,
          ],
        },
      ],
      yaxis: {
        min: 3.175199,
        max: 4.755433,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(3.175199)
    expect(yRange.maxY).toEqual(4.755433)
  })

  it('should swap min and max when min > max', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [10, 20, 30, 40, 50],
        },
      ],
      yaxis: {
        min: 100,
        max: 0,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(100)
    expect(yRange.yAxisScale[0].result).toEqual([0, 20, 40, 60, 80, 100])
  })
})

describe('yaxis range to not contain negative values', () => {
  it('yaxis should not contain negative values if all values are positive', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272],
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(25000)
  })

  it('yaxis should produce a small positive range for all zero values', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [0, 0, 0, 0, 0],
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(2)
  })

  it('yaxis should compute correct scale for only negative values', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [-10, -20, -30, -40, -50],
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(-50)
    expect(yRange.maxY).toEqual(-10)
    expect(yRange.yAxisScale[0].result).toEqual([-50, -40, -30, -20, -10])
  })

  it('yaxis should compute symmetric scale for mixed positive and negative values', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [-50, -25, 0, 25, 50],
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(-60)
    expect(yRange.maxY).toEqual(60)
    expect(yRange.yAxisScale[0].result).toEqual([-60, -40, -20, 0, 20, 40, 60])
  })
})

describe('single yaxis - functions in min and max', () => {
  it('min and max functions in single yaxis should return correct values in params', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [1, 1, 1, -10, 10, 22, 8],
        },
        {
          data: [2, 2, 2, -10, 10, 22, 8],
        },
        {
          data: [-18.5, -23, -22.5, -20, -21.5, -16, -16],
        },
      ],
      yaxis: {
        max: (max) => {
          return Math.ceil(max) <= 10 ? max * 1.01 : Math.floor(max)
        },
        min: (min) => {
          return Math.floor(min) >= 0 ? Math.floor(min) : Math.ceil(min)
        },
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(-23)
    expect(yRange.maxY).toEqual(22)
  })
})

describe('multiple yaxis - functions in min and max', () => {
  it('min and max functions in multiple yaxis should return correct values in params', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series 1',
          data: [400, 410, 420, 430, 500, 600, 700, 800, 900, 1000],
        },
        {
          name: 'Series 2',
          data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        },
      ],
      yaxis: [
        {
          min: (min) => {
            return min
          },
          max: (max) => {
            return max
          },
        },
        {
          min: (min) => {
            return min
          },
          max: (max) => {
            return max
          },
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.yAxisScale[0].niceMin).toEqual(400)
    expect(yRange.yAxisScale[0].niceMax).toEqual(1000)
    expect(yRange.yAxisScale[1].niceMin).toEqual(0)
    expect(yRange.yAxisScale[1].niceMax).toEqual(9)
  })

  it('should handle multiple yaxis with different scales', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series 1',
          data: [1000, 2000, 3000, 4000, 5000],
        },
        {
          name: 'Series 2',
          data: [10, 20, 30, 40, 50],
        },
      ],
      yaxis: [
        {
          min: 0,
          max: 6000,
        },
        {
          min: 0,
          max: 100,
          opposite: true,
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.yAxisScale[0].niceMin).toEqual(0)
    expect(yRange.yAxisScale[0].niceMax).toEqual(6000)
    expect(yRange.yAxisScale[1].niceMin).toEqual(0)
    expect(yRange.yAxisScale[1].niceMax).toEqual(100)
  })

  it('should handle 3 or more yaxis configurations', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series 1',
          data: [100, 200, 300],
        },
        {
          name: 'Series 2',
          data: [10, 20, 30],
        },
        {
          name: 'Series 3',
          data: [1, 2, 3],
        },
      ],
      yaxis: [
        {
          min: 0,
          max: 400,
        },
        {
          min: 0,
          max: 40,
        },
        {
          min: 0,
          max: 4,
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.yAxisScale.length).toEqual(3)
    expect(yRange.yAxisScale[0].niceMax).toEqual(400)
    expect(yRange.yAxisScale[1].niceMax).toEqual(40)
    expect(yRange.yAxisScale[2].niceMax).toEqual(4)
  })
})

describe('yaxis edge cases', () => {
  it('should expand range around a single data point', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [42],
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(41)
    expect(yRange.maxY).toEqual(43)
  })

  it('should expand range around all identical values', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [100, 100, 100, 100, 100],
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(99)
    expect(yRange.maxY).toEqual(101)
  })

  it('should produce a default scale for empty series data', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [],
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(6)
  })

  it('should handle floating point precision', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [0.1 + 0.2, 0.3, 0.4, 0.5],
        },
      ],
      yaxis: {
        min: 0,
        max: 1,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(1)
  })

  it('should handle extreme values without NaN', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [Number.MIN_VALUE, 100, Number.MAX_SAFE_INTEGER],
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(10000000000000000)
  })

  it('should handle negative zero', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [-0, 0, 1, 2, 3],
        },
      ],
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
  })
})

describe('yaxis with tickAmount', () => {
  it('should respect tickAmount setting', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [10, 20, 30, 40, 50],
        },
      ],
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(100)
  })

  it('should produce correct scale for tickAmount with decimal series', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [1.1, 2.2, 3.3, 4.4, 5.5],
        },
      ],
      yaxis: {
        tickAmount: 10,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(1)
    expect(yRange.maxY).toEqual(5.5)
    expect(yRange.yAxisScale[0].result.length).toBe(10)
  })
})

describe('yaxis with forceNiceScale', () => {
  it('should create nice round scale when forceNiceScale is true', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [13, 27, 31, 44, 58],
        },
      ],
      yaxis: {
        forceNiceScale: true,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(10)
    expect(yRange.maxY).toEqual(60)
    expect(yRange.yAxisScale[0].result).toEqual([10, 20, 30, 40, 50, 60])
  })

  it('should handle forceNiceScale with user-defined min/max', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [13, 27, 31, 44, 58],
        },
      ],
      yaxis: {
        min: 10,
        max: 60,
        forceNiceScale: true,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(10)
    expect(yRange.maxY).toEqual(60)
  })
})

describe('yaxis with logarithmic scale', () => {
  it('should compute correct logarithmic scale with base 10', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [1, 10, 100, 1000, 10000],
        },
      ],
      yaxis: {
        logarithmic: true,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(1)
    expect(yRange.maxY).toEqual(10000)
    expect(yRange.yAxisScale[0].result).toEqual([1, 10, 100, 1000, 10000])
  })

  it('should compute correct logarithmic scale with base 2', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [1, 2, 4, 8, 16, 32, 64],
        },
      ],
      yaxis: {
        logarithmic: true,
        logBase: 2,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(1)
    expect(yRange.maxY).toEqual(64)
    expect(yRange.yAxisScale[0].result).toEqual([1, 2, 4, 8, 16, 32, 64])
  })
})

describe('yaxis with stepSize', () => {
  it('should produce evenly spaced scale matching stepSize', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [5, 15, 25, 35, 45],
        },
      ],
      yaxis: {
        min: 0,
        max: 50,
        stepSize: 10,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(50)
    expect(yRange.yAxisScale[0].result).toEqual([0, 10, 20, 30, 40, 50])
  })
})
