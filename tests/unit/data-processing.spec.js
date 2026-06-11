import Data from '../../src/modules/Data'
import ApexCharts from '../../src/entries/full'
import seriesxy from './data/seriesxy.js'
import { createChart } from './utils/utils.js'

describe('Parse Data', () => {
  it('should parse data for cartesian charts', () => {
    const chart = createChart('line', seriesxy, 'datetime')
    chart.w.globals.series = []
    chart.w.globals.seriesX = []
    chart.w.globals.labels = []

    const data = new Data(chart.w, chart)
    const w = data.parseDataAxisCharts(seriesxy, seriesxy, chart)

    expect(w.globals.series).toEqual([[300, 230, 210]])
    expect(w.globals.seriesX).toEqual([
      [1262304000000, 1262390400000, 1262476800000],
    ])
    expect(w.globals.labels).toEqual([
      [1262304000000, 1262390400000, 1262476800000],
    ])
  })

  it('should parse data for non-cartesian charts', () => {
    const series = [30, 23, 12, 43]
    const chart = createChart('donut', series)

    chart.w.globals.series = []
    chart.w.globals.seriesNames = []

    const data = new Data(chart.w, chart)
    const w = data.parseDataNonAxisCharts(series)

    expect(w.globals.series).toEqual([30, 23, 12, 43])
    expect(w.globals.seriesNames).toEqual([
      'series-1',
      'series-2',
      'series-3',
      'series-4',
    ])
  })
})

describe('Data Processing', () => {
  let ctx
  let dataModule

  beforeEach(() => {
    const el = document.createElement('div')
    ctx = new ApexCharts(el, {
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
    })
    dataModule = new Data(ctx.w, ctx)
  })

  afterEach(() => {
    ctx = null
  })

  describe('getNestedValue', () => {
    it('should get simple property', () => {
      const obj = { name: 'John', age: 30 }
      expect(dataModule.getNestedValue(obj, 'name')).toBe('John')
      expect(dataModule.getNestedValue(obj, 'age')).toBe(30)
    })

    it('should get nested property with dot notation', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
            email: 'john@example.com',
          },
        },
      }
      expect(dataModule.getNestedValue(obj, 'user.profile.name')).toBe('John')
      expect(dataModule.getNestedValue(obj, 'user.profile.email')).toBe(
        'john@example.com'
      )
    })

    it('should return undefined for non-existent properties', () => {
      const obj = { name: 'John' }
      expect(dataModule.getNestedValue(obj, 'age')).toBeUndefined()
      expect(
        dataModule.getNestedValue(obj, 'user.profile.name')
      ).toBeUndefined()
    })

    it('should return undefined for null/undefined objects', () => {
      expect(dataModule.getNestedValue(null, 'name')).toBeUndefined()
      expect(dataModule.getNestedValue(undefined, 'name')).toBeUndefined()
    })

    it('should return undefined for invalid paths', () => {
      const obj = { name: 'John' }
      expect(dataModule.getNestedValue(obj, null)).toBeUndefined()
      expect(dataModule.getNestedValue(obj, '')).toBeUndefined()
    })

    it('should handle deep nesting', () => {
      const obj = { a: { b: { c: { d: { e: 'value' } } } } }
      expect(dataModule.getNestedValue(obj, 'a.b.c.d.e')).toBe('value')
    })

    it('should return undefined when encountering null in path', () => {
      const obj = { user: { profile: null } }
      expect(
        dataModule.getNestedValue(obj, 'user.profile.name')
      ).toBeUndefined()
    })
  })

  describe('extractPieDataFromSeries', () => {
    it('should extract data from series objects with {x, y} format', () => {
      const series = [
        {
          data: [
            { x: 'Category A', y: 10 },
            { x: 'Category B', y: 20 },
            { x: 'Category C', y: 30 },
          ],
        },
      ]

      const result = dataModule.extractPieDataFromSeries(series)

      expect(result.labels).toEqual(['Category A', 'Category B', 'Category C'])
      expect(result.values).toEqual([10, 20, 30])
    })

    it('should handle multiple series', () => {
      const series = [
        {
          data: [
            { x: 'A', y: 10 },
            { x: 'B', y: 20 },
          ],
        },
        {
          data: [
            { x: 'C', y: 30 },
            { x: 'D', y: 40 },
          ],
        },
      ]

      const result = dataModule.extractPieDataFromSeries(series)

      expect(result.labels).toEqual(['A', 'B', 'C', 'D'])
      expect(result.values).toEqual([10, 20, 30, 40])
    })

    it('should return empty arrays for invalid series', () => {
      const result1 = dataModule.extractPieDataFromSeries([])
      expect(result1.labels).toEqual([])
      expect(result1.values).toEqual([])

      const result2 = dataModule.extractPieDataFromSeries(null)
      expect(result2.labels).toEqual([])
      expect(result2.values).toEqual([])
    })

    it('should handle series with missing data', () => {
      const series = [{ data: [] }, { data: [{ x: 'A', y: 10 }] }]

      const result = dataModule.extractPieDataFromSeries(series)

      expect(result.labels).toEqual(['A'])
      expect(result.values).toEqual([10])
    })

    it('should convert x values to strings for labels', () => {
      const series = [
        {
          data: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
          ],
        },
      ]

      const result = dataModule.extractPieDataFromSeries(series)

      expect(result.labels).toEqual(['1', '2'])
      expect(typeof result.labels[0]).toBe('string')
    })
  })
})

describe('Data.lttbDownsample', () => {
  it('returns original data when length <= targetPoints', () => {
    const data = [{ x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 3 }]
    expect(Data.lttbDownsample(data, 5)).toBe(data)
  })

  it('returns original data when targetPoints < 3', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ x: i, y: i }))
    expect(Data.lttbDownsample(data, 2)).toBe(data)
  })

  it('always includes first and last points', () => {
    const data = Array.from({ length: 200 }, (_, i) => ({ x: i, y: Math.sin(i / 10) }))
    const result = Data.lttbDownsample(data, 50)
    expect(result[0]).toBe(data[0])
    expect(result[result.length - 1]).toBe(data[data.length - 1])
  })

  it('reduces to exactly targetPoints', () => {
    const data = Array.from({ length: 500 }, (_, i) => ({ x: i, y: Math.sin(i / 20) }))
    const result = Data.lttbDownsample(data, 100)
    expect(result.length).toBe(100)
  })

  it('works with 2D array format [[x, y]]', () => {
    const data = Array.from({ length: 200 }, (_, i) => [i, Math.cos(i / 10)])
    const result = Data.lttbDownsample(data, 50)
    expect(result.length).toBe(50)
    expect(result[0]).toBe(data[0])
    expect(result[result.length - 1]).toBe(data[data.length - 1])
    expect(Array.isArray(result[1])).toBe(true)
  })

  it('preserves visual peaks (picks max-area point in each bucket)', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ x: i, y: i === 50 ? 100 : 0 }))
    const result = Data.lttbDownsample(data, 10)
    const ys = result.map((p) => p.y)
    expect(ys).toContain(100)
  })
})

describe('Data.ohlcAggregate', () => {
  // y = [open, high, low, close]
  const mkXY = (n) =>
    Array.from({ length: n }, (_, i) => ({ x: i, y: [i, i + 1, i - 1, i + 0.5] }))

  it('returns original data when length <= targetPoints', () => {
    const data = mkXY(3)
    expect(Data.ohlcAggregate(data, 5)).toBe(data)
  })

  it('reduces to exactly targetPoints', () => {
    const result = Data.ohlcAggregate(mkXY(500), 100)
    expect(result.length).toBe(100)
  })

  it('rolls up open=first, close=last, high=max, low=min per bucket', () => {
    // 4 candles → 1 bucket. open=10 (first), close=13 (last), high=99, low=1.
    const data = [
      { x: 0, y: [10, 20, 5, 11] },
      { x: 1, y: [11, 99, 8, 12] }, // the high
      { x: 2, y: [12, 30, 1, 13] }, // the low
      { x: 3, y: [13, 25, 9, 13] },
    ]
    const [candle] = Data.ohlcAggregate(data, 1)
    expect(candle.x).toBe(0)
    expect(candle.y).toEqual([10, 99, 1, 13])
  })

  it('does NOT drop high/low extremes (the LTTB-on-OHLC bug)', () => {
    // A spike high in the middle must survive aggregation.
    const data = mkXY(100).map((p, i) =>
      i === 50 ? { x: i, y: [i, 1000, -1000, i + 0.5] } : p,
    )
    const result = Data.ohlcAggregate(data, 10)
    const highs = result.map((p) => p.y[1])
    const lows = result.map((p) => p.y[2])
    expect(Math.max(...highs)).toBe(1000)
    expect(Math.min(...lows)).toBe(-1000)
  })

  it('works with 2D array format [[x, [o,h,l,c]]]', () => {
    const data = Array.from({ length: 200 }, (_, i) => [i, [i, i + 1, i - 1, i + 0.5]])
    const result = Data.ohlcAggregate(data, 50)
    expect(result.length).toBe(50)
    expect(Array.isArray(result[0])).toBe(true)
    expect(Array.isArray(result[0][1])).toBe(true)
  })

  it('keeps the final close (last bucket absorbs the remainder)', () => {
    // 10 points, 3 buckets → uneven; last close must be the series last close.
    const data = mkXY(10)
    const result = Data.ohlcAggregate(data, 3)
    expect(result[result.length - 1].y[3]).toBe(data[9].y[3])
  })
})
