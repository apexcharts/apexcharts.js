import Range from '../../src/modules/Range.js'
import { createChartWithOptions } from './utils/utils.js'

describe('user defined Y-axis options priority', () => {
  it('tickAmount overrides default ticks', () => {
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
        min: 3.4,
        max: 4.8,
        tickAmount: 7,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.yAxisScale[0].result.length - 1).toEqual(7) // ticks
  })
})

describe('user defined Y-axis options priority', () => {
  it('stepSize', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272],
        },
      ],
      yaxis: {
        stepSize: 3000,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(24000)
    expect(yRange.yAxisScale[0].result).toEqual([
      0, 3000, 6000, 9000, 12000, 15000, 18000, 21000, 24000,
    ])
  })
})

describe('user defined Y-axis options priority', () => {
  it('The magnitude of stepSize does not matter when forceNiceScale: true, only the MSD', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272],
        },
      ],
      yaxis: {
        min: 0,
        max: 24000,
        tickAmount: 5, // overridden by stepSize but will determine magnitude,
        // as: largest (stepSize*10^n) < (range / ticks).
        // min, max, tickAmount only required here for this
        // unit test to work.
        stepSize: 3,
        forceNiceScale: true,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.yAxisScale[0].niceMin).toEqual(0)
    expect(yRange.yAxisScale[0].niceMax).toEqual(24000)
    expect(yRange.yAxisScale[0].result[1]).toEqual(3000)
  })
})

describe('user defined Y-axis options priority', () => {
  it('the default ticks is overridden to fit other user constraints', () => {
    const chart = createChartWithOptions({
      chart: {
        height: 400,
        type: 'line',
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272],
        },
      ],
      yaxis: {
        min: 0,
        max: 24000,
        stepSize: 4000,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(24000)
    expect(yRange.yAxisScale[0].result.length - 1).toEqual(6) // ticks
    expect(yRange.yAxisScale[0].result[1]).toEqual(4000)
  })
})

describe('user defined Y-axis options priority', () => {
  it('user constraints force stepSize to non-nice value', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272],
        },
      ],
      yaxis: {
        min: 0,
        max: 24000,
        tickAmount: 5,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(24000)
    expect(yRange.yAxisScale[0].result.length - 1).toEqual(5) // ticks
    expect(yRange.yAxisScale[0].result).toEqual([
      0, 4800, 9600, 14400, 19200, 24000,
    ])
  })
})

describe('user defined Y-axis options priority', () => {
  it('shrinkwrap ticks to data range', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272],
        },
      ],
      yaxis: {
        min: 0,
        stepSize: 3000,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(24000)
    expect(yRange.yAxisScale[0].result.length - 1).toEqual(8) // ticks
  })
})

describe('user defined Y-axis options priority', () => {
  it('stepSize conflicts with min..max range and is ignored', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272],
        },
      ],
      yaxis: {
        min: 0,
        max: 23000,
        stepSize: 3000,
        tickAmount: 10,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(23000)
    expect(yRange.yAxisScale[0].result).toEqual([
      0, 2300, 4600, 6900, 9200, 11500, 13800, 16100, 18400, 20700, 23000,
    ])
    expect(yRange.yAxisScale[0].result.length - 1).toEqual(10) // ticks
  })
})

describe('user defined Y-axis options priority', () => {
  it('tickAmount overridden then prime number ticks kept at 23', () => {
    const chart = createChartWithOptions({
      chart: {
        height: '200',
        width: '100%',
        type: 'line',
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272],
        },
      ],
      yaxis: {
        min: 0,
        max: 23000,
        stepSize: 1000,
        tickAmount: 10,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(23000)
    expect(yRange.yAxisScale[0].result.length - 1).toEqual(23) // ticks
  })
})

describe('user defined Y-axis options priority', () => {
  it('tickAmount overridden then prime number ticks reduced by forceNiceScale to 1 to fit svg', () => {
    const chart = createChartWithOptions({
      chart: {
        height: '200',
        width: '100%',
        type: 'line',
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272],
        },
      ],
      yaxis: {
        min: 0,
        max: 23000,
        stepSize: 1000,
        forceNiceScale: true,
      },
    })

    const range = new Range(chart.w)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(23000)
    expect(yRange.yAxisScale[0].result.length - 1).toEqual(1) // ticks
  })
})
