import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import BarHelpers from '../../src/charts/common/bar/Helpers.js'
import Graphics from '../../src/modules/Graphics.js'
import Series from '../../src/modules/Series.js'

// Per-bar work on the default bar path that only serves an opt-in feature.
// Each case counts the work on a default chart (it must be none) and pins
// that the feature, when on, still gets what it needs.

afterEach(() => vi.restoreAllMocks())

const cats = ['a', 'b', 'c', 'd', 'e', 'f']
const series = () => [
  { name: 'A', data: [10, 4, 30, 0, 12, 7] },
  { name: 'B', data: [5, 9, 6, 14, 0, 3] },
  { name: 'C', data: [8, 2, 11, 6, 9, 4] },
]
const column = (extra = {}) =>
  createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 300, ...(extra.chart || {}) },
    plotOptions: extra.plotOptions || {},
    dataLabels: { enabled: true },
    series: extra.series || series(),
    xaxis: { categories: cats, ...(extra.xaxis || {}) },
  })
const BARS = 18
// jsdom's selector engine does not match an escaped `data:` attribute name.
const ofSeries = (chart, sel, realIndex) =>
  [...chart.el.querySelectorAll(sel)].filter(
    (el) => el.getAttribute('data:realIndex') === String(realIndex),
  )

describe('bar labels: hidden zero bars', () => {
  it('counts zero encounters only under hideZeroBarsWhenGrouped', () => {
    const spy = vi.spyOn(BarHelpers.prototype, 'getZeroValueEncounters')
    column()
    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('still shifts the labels when the option is on', () => {
    const spy = vi.spyOn(BarHelpers.prototype, 'getZeroValueEncounters')
    const chart = column({
      plotOptions: { bar: { hideZeroBarsWhenGrouped: true } },
    })
    // the bar placement and its label each ask once per bar
    expect(spy.mock.calls.length).toBe(BARS * 2)
    // Point 3 has A = 0, so B and C close up the gap; their labels follow
    // their bars.
    for (const realIndex of [1, 2]) {
      const bar = ofSeries(
        chart,
        '.apexcharts-series',
        realIndex,
      )[0].querySelector('.apexcharts-bar-area[j="3"]')
      const xs = bar
        .getAttribute('d')
        .match(/-?[\d.]+(e-?\d+)?/g)
        .map(Number)
        .filter((_, k) => k % 2 === 0)
      const centre = (Math.min(...xs) + Math.max(...xs)) / 2
      const text = ofSeries(
        chart,
        '.apexcharts-datalabels',
        realIndex,
      )[0].querySelectorAll('text')[3]
      expect(
        Math.abs(parseFloat(text.getAttribute('x')) - centre),
      ).toBeLessThan(1)
    }
  })
})

describe('bar corners at borderRadius 0', () => {
  it('pads the path without parsing it per bar', () => {
    const spy = vi.spyOn(Graphics.prototype, 'roundPathCorners')
    const chart = column()
    expect(spy).toHaveBeenCalledTimes(0)
    // Still the padded shape: a zero-length curve on every corner (the
    // default borderRadiusApplication 'around' closes with Z, joining all 4).
    const d = chart.el.querySelector('.apexcharts-bar-area').getAttribute('d')
    expect(d.match(/C/g)).toHaveLength(4)
  })

  it.each(['around', 'end'])(
    'writes exactly the string roundPathCorners returns (%s)',
    (borderRadiusApplication) => {
      const chart = column({
        plotOptions: { bar: { borderRadiusApplication } },
      })
      const h = chart.ctx.bar.barHelpers
      const g = new Graphics(chart.w)
      let seed = 7
      const rnd = () => {
        seed = (seed * 16807) % 2147483647
        return (seed / 2147483647) * 400 - 100
      }
      for (let n = 0; n < 100; n++) {
        const r = h.barRect({
          a: rnd(),
          len: n % 7 === 0 ? 0 : Math.abs(rnd()) / 3,
          v1: rnd(),
          v2: n % 5 === 0 ? -0 : rnd(),
          strokeWidth: n % 3,
          realIndex: n % 3,
          j: n % 6,
          dir: n % 2 ? 1 : -1,
          horizontal: n % 4 === 0,
        })
        expect(r.pathTo).toBe(g.roundPathCorners(r.squarePathTo, 0))
      }
    },
  )

  it('keeps rounding a non-zero radius', () => {
    const spy = vi.spyOn(Graphics.prototype, 'roundPathCorners')
    column({ plotOptions: { bar: { borderRadius: 4 } } })
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(BARS)
  })
})

describe('bar background', () => {
  // Owner lookups made from inside barBackground.
  const ownerLookups = () => {
    let inside = false
    let n = 0
    const bg = BarHelpers.prototype.barBackground
    vi.spyOn(BarHelpers.prototype, 'barBackground').mockImplementation(
      function (...a) {
        inside = true
        try {
          return bg.apply(this, a)
        } finally {
          inside = false
        }
      },
    )
    const owner = Series.prototype.getActiveConfigSeriesIndex
    vi.spyOn(Series.prototype, 'getActiveConfigSeriesIndex').mockImplementation(
      function (...a) {
        if (inside) n++
        return owner.apply(this, a)
      },
    )
    return () => n
  }

  it('does nothing per bar without background colours', () => {
    const lookups = ownerLookups()
    column()
    expect(lookups()).toBe(0)
  })

  it('resolves the owner once per draw and still draws every slot', () => {
    const lookups = ownerLookups()
    const chart = column({
      plotOptions: { bar: { colors: { backgroundBarColors: ['#eee'] } } },
    })
    expect(lookups()).toBe(1)
    expect(chart.el.querySelectorAll('.apexcharts-backgroundBar')).toHaveLength(
      cats.length,
    )
  })
})

describe('bar slot count on a numeric axis', () => {
  const datetime = () =>
    createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      xaxis: { type: 'datetime' },
      series: [
        { data: [0, 1, 2, 3, 4].map((k) => [1e12 + k * 864e5, k + 1]) },
        { data: [0, 1, 2, 3, 4].map((k) => [1e12 + k * 864e5, 5 - k]) },
      ],
    })
  // Count the x reads one initVariables makes.
  const countReads = (w) => {
    let reads = 0
    w.seriesData.seriesX = w.seriesData.seriesX.map(
      (xs) =>
        new Proxy(xs, {
          get(t, k, r) {
            if (typeof k === 'string' && /^\d+$/.test(k)) reads++
            return Reflect.get(t, k, r)
          },
        }),
    )
    return () => reads
  }

  it('does not count the visible bars when the slot span sizes them', () => {
    const chart = datetime()
    const h = chart.ctx.bar.barHelpers
    const reads = countReads(chart.w)
    h.initVariables(chart.w.seriesData.series)
    expect(reads()).toBe(0)
  })

  it('falls back to the visible-bar count without a slot span', () => {
    const chart = datetime()
    const w = chart.w
    const h = chart.ctx.bar.barHelpers
    h.initVariables(w.seriesData.series)
    h._slotXSpan = 0
    // 1 + every x strictly inside (minX, maxX), over both series
    let n = 1
    w.seriesData.seriesX.forEach((xs) =>
      xs.forEach((x) => {
        if (x > w.globals.minX && x < w.globals.maxX) n++
      }),
    )
    expect(h.initialPositions(0).xDivision).toBeCloseTo(
      w.layout.gridWidth / n,
      9,
    )
  })
})

describe('stacked totals', () => {
  it('formats each total once, by the series that draws it', () => {
    const formatter = vi.fn((v) => 'T' + v)
    const chart = column({
      chart: { stacked: true },
      plotOptions: {
        bar: { dataLabels: { total: { enabled: true, formatter } } },
      },
    })
    expect(formatter).toHaveBeenCalledTimes(cats.length)
    const totals = [...chart.el.querySelectorAll('.apexcharts-datalabel-total')]
    expect(totals.map((t) => t.textContent)).toEqual([
      'T23',
      'T15',
      'T47',
      'T20',
      'T21',
      'T14',
    ])
  })
})
