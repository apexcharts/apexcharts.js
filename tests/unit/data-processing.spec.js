import Data from '../../src/modules/Data'
import ApexCharts from '../../src/apexcharts'
import seriesxy from './data/seriesxy.js'
import { createChart } from './utils/utils.js'

describe('Parse Data', () => {
  it('should parse data for cartesian charts', () => {
    const chart = createChart('line', seriesxy, 'datetime')
    chart.w.globals.series = []
    chart.w.globals.seriesX = []
    chart.w.globals.labels = []

    const data = new Data(chart)
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

    const data = new Data(chart)
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
    dataModule = new Data(ctx)
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
