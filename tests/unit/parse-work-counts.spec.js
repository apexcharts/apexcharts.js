import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Range from '../../src/modules/Range.js'
import Utils from '../../src/utils/Utils.js'

// Counts the per-point work the parse pass does for the common data shapes.
// Each case pins a cost that used to scale with the point (or series) count
// and no longer does; parse-output-pins.spec.js holds the values.

afterEach(() => vi.restoreAllMocks())

const T0 = Date.UTC(2017, 0, 1)
const DAY = 86400000
const iso = (k) => new Date(T0 + k * DAY).toISOString()
const N = 12

const render = (opts) =>
  createChartWithOptions({
    ...opts,
    chart: { type: 'line', width: 480, height: 300, ...opts.chart },
  })

describe('date parsing', () => {
  it('a category {x} name is never date-parsed', () => {
    const parse = vi.spyOn(Date, 'parse')
    const chart = render({
      series: [
        { data: Array.from({ length: N }, (_, k) => ({ x: 'n' + k, y: k })) },
      ],
    })
    // was 3 per point: isValidDate, its salvage pass and getTimeStamp
    expect(parse).toHaveBeenCalledTimes(0)
    chart.destroy()
  })

  it('a datetime {x} ISO string is parsed once', () => {
    const parse = vi.spyOn(Date, 'parse')
    const chart = render({
      xaxis: { type: 'datetime' },
      series: [
        { data: Array.from({ length: N }, (_, k) => ({ x: iso(k), y: k })) },
      ],
    })
    // was 4 per point: isValidDate and parseDate, each parsing twice
    expect(parse).toHaveBeenCalledTimes(N)
    chart.destroy()
  })

  it('datetime categories are parsed once, not once per series', () => {
    const parse = vi.spyOn(Date, 'parse')
    const chart = render({
      xaxis: { type: 'datetime', categories: [0, 1, 2, 3].map(iso) },
      series: [0, 1, 2].map(() => ({ data: [1, 2, 3, 4] })),
    })
    // was 4 per label per series (48)
    expect(parse).toHaveBeenCalledTimes(4)
    const sx = chart.w.seriesData.seriesX
    expect(sx[1]).toEqual(sx[0])
    chart.destroy()
  })
})

describe('datetime [[timestamp, y]] takes the typed parse', () => {
  it('records fused extrema for the series', () => {
    const chart = render({
      xaxis: { type: 'datetime' },
      series: [{ data: [0, 1, 2, 3].map((k) => [T0 + k * DAY, k]) }],
    })
    const pe = chart.w.seriesData._parsedExtrema?.[0]
    expect(pe).toBeTruthy()
    expect(pe.ref).toBe(chart.w.seriesData.series[0])
    expect([pe.minX, pe.maxX]).toEqual([T0, T0 + 3 * DAY])
    chart.destroy()
  })

  it('leaves Date objects and fractional timestamps to the general loop', () => {
    for (const data of [
      [[new Date(T0), 1], [new Date(T0 + DAY), 2]],
      [[T0 + 0.5, 1], [T0 + DAY, 2]],
    ]) {
      const chart = render({ xaxis: { type: 'datetime' }, series: [{ data }] })
      expect(chart.w.seriesData._parsedExtrema?.[0]).toBeUndefined()
      expect(chart.w.seriesData.seriesX[0][0]).toBe(T0)
      chart.destroy()
    }
  })
})

describe('an {x, y} series without goals keeps the plain-numeric lane', () => {
  it('holds no goals slots and scans y without isNumber', () => {
    const chart = render({
      series: [
        { data: Array.from({ length: N }, (_, k) => ({ x: 'n' + k, y: k })) },
      ],
    })
    expect(chart.w.seriesData.seriesGoals[0]).toBeUndefined()
    const isNumber = vi.spyOn(Utils, 'isNumber')
    new Range(chart.w).getMinYMaxY(0)
    // was 1 per point: the all-null goals array forced the general loop
    expect(isNumber).toHaveBeenCalledTimes(0)
    chart.destroy()
  })

  it('still gives getState() a goals row for every series', () => {
    const goal = [{ name: 'g', value: 9 }]
    const chart = render({
      series: [
        { data: [{ x: 'a', y: 1 }, { x: 'b', y: 2 }] },
        { data: [{ x: 'a', y: 3 }, { x: 'b', y: 4, goals: goal }] },
      ],
    })
    const { seriesGoals } = chart.getState()
    expect(seriesGoals).toEqual([[], [null, goal]])
    expect(seriesGoals[0][1]).toBeUndefined()
    chart.destroy()
  })
})

describe('candlestick parse', () => {
  it('allocates no empty points array per candle', () => {
    const chart = render({
      chart: { type: 'candlestick' },
      series: [
        {
          data: [0, 1, 2].map((k) => ({
            x: T0 + k * DAY,
            y: [1, 4, 0.5, 2],
          })),
        },
      ],
      xaxis: { type: 'datetime' },
    })
    const pts = chart.w.candleData.seriesBoxPoints[0]
    expect(pts).toHaveLength(3)
    expect(pts.every((p) => p === null)).toBe(true)
    chart.destroy()
  })
})

describe('range-bar overlap detection', () => {
  const timeline = (overlap) => ({
    chart: { type: 'rangeBar' },
    plotOptions: { bar: { horizontal: true, rangeBarOverlap: overlap } },
    xaxis: { type: 'datetime' },
    series: [0, 1, 2].map((s) => ({
      data: [0, 1, 2].map((k) => ({
        x: 'row',
        y: [T0 + (k + s) * DAY, T0 + (k + s + 2) * DAY],
      })),
    })),
  })
  const countOverlapAdds = (opts) => {
    const add = vi.spyOn(Set.prototype, 'add')
    const chart = render(opts)
    const sets = chart.w.rangeData.seriesRange.flatMap((r) =>
      r.map((row) => row.overlaps),
    )
    const n = add.mock.contexts.filter((s) => sets.includes(s)).length
    add.mockRestore()
    return { chart, n }
  }

  it('is skipped when overlapping bars are drawn on top of each other', () => {
    const { chart, n } = countOverlapAdds(timeline(true))
    // was 6 per series, earlier series rescanned on every parse (36)
    expect(n).toBe(0)
    chart.destroy()
  })

  it('scans each series once when overlaps are split into lanes', () => {
    const { chart, n } = countOverlapAdds(timeline(false))
    // 3 overlapping pairs per row, 2 adds each, per series; was 36
    expect(n).toBe(18)
    const rows = chart.w.rangeData.seriesRange
    const names = chart.w.globals.seriesRangeName
    // lane order is the Set's insertion order
    rows.forEach((r, i) => {
      const order = Array.from(r[0].overlaps).map((id) =>
        Object.keys(names[i]).find((j) => names[i][j] === id),
      )
      expect(order).toEqual(['0', '1', '2'])
    })
    chart.destroy()
  })
})
