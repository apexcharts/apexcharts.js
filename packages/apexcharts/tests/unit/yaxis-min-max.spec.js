import Range from '../../src/modules/Range.js'
import { createChartWithOptions } from './utils/utils.js'

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

    const range = new Range(chart)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(3.175199)
    expect(yRange.maxY).toEqual(4.755433)
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

    const range = new Range(chart)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(25000)
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

    const range = new Range(chart)
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

    const range = new Range(chart)
    const yRange = range.setYRange()

    expect(yRange.yAxisScale[0].niceMin).toEqual(400)
    expect(yRange.yAxisScale[0].niceMax).toEqual(1000)
    expect(yRange.yAxisScale[1].niceMin).toEqual(0)
    expect(yRange.yAxisScale[1].niceMax).toEqual(9)
  })
})
