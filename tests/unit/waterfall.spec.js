import { describe, test, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { waterfallTransform } from '../../src/features/waterfall'

// `chart.type: 'waterfall'` is written as a list of DELTAS and drawn as columns
// that float between the level each step started at and the level it left
// behind. The accumulation happens in the series transform; the columns are the
// existing vertical range-column renderer; the connectors are a layer drawn from
// the geometry the bars were committed at.

/** The canonical cash-flow walk: three gains, a subtotal, two costs, a total. */
const CASHFLOW = [
  { x: 'Start', y: 120000 },
  { x: 'Product Revenue', y: 569000 },
  { x: 'Service Revenue', y: 231000 },
  { x: 'Positive Balance', isSubtotal: true },
  { x: 'Fixed Costs', y: -342000 },
  { x: 'Variable Costs', y: -233000 },
  { x: 'Balance', isTotal: true },
]

function wfChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'waterfall', width: 700, height: 400, ...opts.chart },
    series: opts.series || [{ name: 'Cash flow', data: CASHFLOW }],
    ...(opts.plotOptions ? { plotOptions: opts.plotOptions } : {}),
    ...opts.extra,
  })
}

/** A throwaway `w` for exercising the transform on its own. */
function fakeW(overrides = {}) {
  return {
    config: { plotOptions: { waterfall: { colors: {} } }, xaxis: {} },
    globals: { collapsedSeriesIndices: [] },
    ...overrides,
  }
}

/** Every coordinate pair in a path `d`, in order. */
function pathPoints(d) {
  const nums = String(d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []
  const out = []
  for (let k = 0; k + 1 < nums.length; k += 2) {
    out.push([parseFloat(nums[k]), parseFloat(nums[k + 1])])
  }
  return out
}

describe('Accumulation — deltas become floating pairs', () => {
  test('each step starts where the last one finished', () => {
    const w = fakeW()
    const out = waterfallTransform([{ data: CASHFLOW }], w)
    const ys = out[0].data.map((d) => d.y)

    expect(ys[0]).toEqual([0, 120000])
    expect(ys[1]).toEqual([120000, 689000])
    expect(ys[2]).toEqual([689000, 920000])
  })

  test('a negative step walks the level back down', () => {
    const w = fakeW()
    const out = waterfallTransform([{ data: CASHFLOW }], w)
    const ys = out[0].data.map((d) => d.y)

    expect(ys[4]).toEqual([920000, 578000])
    expect(ys[5]).toEqual([578000, 345000])
  })

  test('isSubtotal spans from the previous cut to the running total', () => {
    const w = fakeW()
    const out = waterfallTransform([{ data: CASHFLOW }], w)
    // No earlier subtotal, so the cut is still the start of the walk.
    expect(out[0].data[3].y).toEqual([0, 920000])
  })

  test('a second isSubtotal measures only the steps since the first', () => {
    const w = fakeW()
    const out = waterfallTransform(
      [
        {
          data: [
            { x: 'a', y: 10 },
            { x: 'b', y: 5 },
            { x: 'H1', isSubtotal: true },
            { x: 'c', y: 20 },
            { x: 'd', y: -4 },
            { x: 'H2', isSubtotal: true },
          ],
        },
      ],
      w,
    )
    const ys = out[0].data.map((d) => d.y)
    expect(ys[2]).toEqual([0, 15]) // a + b
    expect(ys[5]).toEqual([15, 31]) // c + d, measured from the H1 cut
  })

  test('isTotal spans from zero and does not move the running total', () => {
    const w = fakeW()
    const out = waterfallTransform(
      [
        {
          data: [
            { x: 'a', y: 10 },
            { x: 'T', isTotal: true },
            { x: 'b', y: 5 },
          ],
        },
      ],
      w,
    )
    const ys = out[0].data.map((d) => d.y)
    expect(ys[1]).toEqual([0, 10])
    // The step after a total continues the walk from 10, not from 0.
    expect(ys[2]).toEqual([10, 15])
  })

  test('a subtotal with no steps since the last cut is a zero-height bar', () => {
    const w = fakeW()
    const out = waterfallTransform(
      [
        {
          data: [
            { x: 'a', y: 10 },
            { x: 'S1', isSubtotal: true },
            { x: 'S2', isSubtotal: true },
          ],
        },
      ],
      w,
    )
    expect(out[0].data[2].y).toEqual([10, 10])
  })
})

describe('Accumulation — the value a label reads', () => {
  test('a step reports its delta, a running total reports its sum', () => {
    const w = fakeW()
    waterfallTransform([{ data: CASHFLOW }], w)

    expect(w.waterfallData.values[0]).toEqual([
      120000, 569000, 231000, 920000, -342000, -233000, 345000,
    ])
  })

  test('every bar’s value is its own signed height', () => {
    const w = fakeW()
    const out = waterfallTransform([{ data: CASHFLOW }], w)

    out[0].data.forEach((d, j) => {
      expect(w.waterfallData.values[0][j]).toBe(d.y[1] - d.y[0])
    })
  })

  test('the running total after each bar is recorded for the connectors', () => {
    const w = fakeW()
    waterfallTransform([{ data: CASHFLOW }], w)

    expect(w.waterfallData.cumulative[0]).toEqual([
      120000, 689000, 920000, 920000, 578000, 345000, 345000,
    ])
  })

  test('the running total is always the bar’s own far edge', () => {
    const w = fakeW()
    const out = waterfallTransform([{ data: CASHFLOW }], w)

    // This is what lets the connector layer work from geometry alone.
    out[0].data.forEach((d, j) => {
      expect(w.waterfallData.cumulative[0][j]).toBe(d.y[1])
    })
  })

  test('each bar is classified so it can be coloured', () => {
    const w = fakeW()
    waterfallTransform([{ data: CASHFLOW }], w)

    expect(w.waterfallData.kinds[0]).toEqual([
      'positive',
      'positive',
      'positive',
      'subtotal',
      'negative',
      'negative',
      'total',
    ])
  })
})

describe('Accumulation — input shapes', () => {
  test('[x, y] tuples accumulate and come out labelled', () => {
    const w = fakeW()
    const out = waterfallTransform(
      [
        {
          data: [
            ['a', 10],
            ['b', -4],
            ['c', 7],
          ],
        },
      ],
      w,
    )
    expect(out[0].data.map((d) => d.x)).toEqual(['a', 'b', 'c'])
    expect(out[0].data.map((d) => d.y)).toEqual([
      [0, 10],
      [10, 6],
      [6, 13],
    ])
  })

  test('bare numbers take their x from xaxis.categories', () => {
    const w = fakeW({
      config: {
        plotOptions: { waterfall: { colors: {} } },
        xaxis: { categories: ['Jan', 'Feb', 'Mar'] },
      },
    })
    const out = waterfallTransform([{ data: [10, -4, 7] }], w)
    expect(out[0].data.map((d) => d.x)).toEqual(['Jan', 'Feb', 'Mar'])
  })

  test('bare numbers with no categories fall back to a 1-based index', () => {
    const w = fakeW()
    const out = waterfallTransform([{ data: [10, -4] }], w)
    expect(out[0].data.map((d) => d.x)).toEqual([1, 2])
  })

  test('a hole leaves the level where it was and keeps its category', () => {
    const w = fakeW()
    const out = waterfallTransform(
      [
        {
          data: [
            { x: 'a', y: 10 },
            { x: 'gap', y: null },
            { x: 'b', y: 5 },
          ],
        },
      ],
      w,
    )
    expect(out[0].data[1].y).toBe(null)
    expect(out[0].data[1].x).toBe('gap')
    // The step after the hole resumes from 10, so the bars either side line up.
    expect(out[0].data[2].y).toEqual([10, 15])
    expect(w.waterfallData.values[0][1]).toBe(null)
  })

  test('supplied pairs pass through untouched', () => {
    const w = fakeW()
    const data = [
      { x: 'a', y: [0, 10] },
      { x: 'b', y: [10, 6] },
    ]
    const out = waterfallTransform([{ data }], w)
    expect(out[0].data).toEqual(data)
    // Their heights are still recorded, so a label reads the step either way.
    expect(w.waterfallData.values[0]).toEqual([10, -4])
  })

  test('series accumulate independently of each other', () => {
    const w = fakeW()
    const out = waterfallTransform(
      [
        {
          data: [
            { x: 'a', y: 10 },
            { x: 'b', y: 5 },
          ],
        },
        {
          data: [
            { x: 'a', y: 100 },
            { x: 'b', y: -20 },
          ],
        },
      ],
      w,
    )
    expect(out[0].data.map((d) => d.y)).toEqual([
      [0, 10],
      [10, 15],
    ])
    expect(out[1].data.map((d) => d.y)).toEqual([
      [0, 100],
      [100, 80],
    ])
  })

  test('a collapsed series draws nothing rather than being resurrected', () => {
    // The transform rebuilds from the raw stash, which still holds every
    // series, so it has to honour the collapse itself.
    const w = fakeW({ globals: { collapsedSeriesIndices: [0] } })
    const out = waterfallTransform(
      [{ data: [{ x: 'a', y: 10 }] }, { data: [{ x: 'a', y: 100 }] }],
      w,
    )
    expect(out[0].data).toEqual([])
    expect(out[1].data.length).toBe(1)
  })
})

describe('Accumulation — re-entry', () => {
  test('a second pass over the same state does not accumulate twice', () => {
    // parseData writes the transform's output back to config.series, so this is
    // what every re-render (a resize, a legend toggle, updateOptions) does. If
    // the transform read `ser` instead of the stash, the walk would climb away
    // one level per render.
    const w = fakeW()
    const first = waterfallTransform([{ data: CASHFLOW }], w)
    const second = waterfallTransform(first, w)

    expect(second[0].data.map((d) => d.y)).toEqual(
      first[0].data.map((d) => d.y),
    )
  })

  test('option changes are re-derived rather than frozen in', () => {
    const w = fakeW()
    waterfallTransform([{ data: CASHFLOW }], w)

    w.config.plotOptions.waterfall.colors = { positive: '#123456' }
    const again = waterfallTransform(w.config.series || [], w)
    expect(again[0].data[0].fillColor).toBe('#123456')
  })
})

describe('Colours', () => {
  test('steps take the semantic up / down defaults', () => {
    const chart = wfChart()
    const data = chart.w.config.series[0].data

    expect(data[0].fillColor).toBe('#00A86F')
    expect(data[4].fillColor).toBe('#FF4560')
  })

  test('running totals are left to the palette so they follow the theme', () => {
    const chart = wfChart()
    const data = chart.w.config.series[0].data

    expect(data[3].fillColor).toBeUndefined()
    expect(data[6].fillColor).toBeUndefined()
  })

  test('a datum’s own fillColor wins over the semantic default', () => {
    const w = fakeW()
    const out = waterfallTransform(
      [{ data: [{ x: 'a', y: 10, fillColor: '#abcdef' }] }],
      w,
    )
    expect(out[0].data[0].fillColor).toBe('#abcdef')
  })

  test('named subtotal / total colours are applied', () => {
    const w = fakeW({
      config: {
        plotOptions: {
          waterfall: { colors: { subtotal: '#111111', total: '#222222' } },
        },
        xaxis: {},
      },
    })
    const out = waterfallTransform([{ data: CASHFLOW }], w)
    expect(out[0].data[3].fillColor).toBe('#111111')
    expect(out[0].data[6].fillColor).toBe('#222222')
  })
})

describe('Rendering', () => {
  test('the type routes to the range-column renderer', () => {
    const chart = wfChart()
    expect(chart.w.config.chart.requestedType).toBe('waterfall')
    expect(chart.w.config.chart.type).toBe('rangeBar')
  })

  test('one column per row, drawn as a float', () => {
    wfChart()
    const bars = document.querySelectorAll('.apexcharts-rangebar-area')
    expect(bars.length).toBe(CASHFLOW.length)
  })

  test('the axis covers both ends of the walk', () => {
    const chart = wfChart()
    // The lowest level touched is 0 and the highest is 920000.
    expect(chart.w.globals.minY).toBeLessThanOrEqual(0)
    expect(chart.w.globals.maxY).toBeGreaterThanOrEqual(920000)
  })

  test('stacking is refused: the bars are already cumulative', () => {
    const chart = wfChart({ chart: { stacked: true } })
    expect(chart.w.config.chart.stacked).toBe(false)
  })

  test('the legend is off, so one series cannot be toggled into nothing', () => {
    const chart = wfChart()
    expect(chart.w.config.legend.show).toBe(false)
  })

  test('the data label on each bar is the step, not the level', () => {
    wfChart()
    const labels = [...document.querySelectorAll('.apexcharts-datalabel')].map(
      (t) => t.textContent,
    )
    expect(labels).toEqual([
      '120000',
      '569000',
      '231000',
      '920000',
      '-342000',
      '-233000',
      '345000',
    ])
  })

  test('a data-label formatter is handed the step, not the level reached', () => {
    // Called more than once per bar (measured, then drawn) and every call has
    // to agree, or the label is clamped against a string it never becomes.
    const seen = new Map()
    wfChart({
      extra: {
        dataLabels: {
          formatter: (val, { dataPointIndex }) => {
            const at = seen.get(dataPointIndex) || new Set()
            at.add(val)
            seen.set(dataPointIndex, at)
            return String(val)
          },
        },
      },
    })

    const steps = [120000, 569000, 231000, 920000, -342000, -233000, 345000]
    steps.forEach((step, j) => {
      expect([...(seen.get(j) || [])]).toEqual([step])
    })
  })

  test('the tooltip prints the step, not the "start - end" of the float', () => {
    const chart = wfChart()
    const labels = chart.w.globals.tooltip.tooltipLabels
    const f = { yLbFormatter: (v) => String(v) }

    expect(labels.formatYValue(f, 0, 1)).toBe('569000')
    expect(labels.formatYValue(f, 0, 4)).toBe('-342000')
  })
})

describe('Connectors', () => {
  test('one segment per gap between bars', () => {
    wfChart()
    const lines = document.querySelectorAll('.apexcharts-waterfall-connector')
    expect(lines.length).toBe(CASHFLOW.length - 1)
  })

  test('every segment has real coordinates', () => {
    // jsdom reports a zero-sized box for everything, which lets NaN geometry
    // sail through a "did it draw?" assertion.
    wfChart()
    const lines = [
      ...document.querySelectorAll('.apexcharts-waterfall-connector'),
    ]

    lines.forEach((l) => {
      ;['x1', 'y1', 'x2', 'y2'].forEach((a) => {
        expect(Number.isFinite(parseFloat(l.getAttribute(a)))).toBe(true)
      })
    })
  })

  test('each segment lands exactly on the bars it joins', () => {
    // The guard that matters: the connector level and the bar edge come from
    // two different places (a recorded box, and the path the renderer built),
    // so this fails the moment one of them starts re-deriving geometry.
    const chart = wfChart()
    const bars = [...document.querySelectorAll('.apexcharts-rangebar-area')]
    const lines = [
      ...document.querySelectorAll('.apexcharts-waterfall-connector'),
    ]
    const values = chart.w.waterfallData.values[0]

    lines.forEach((line, j) => {
      const from = pathPoints(bars[j].getAttribute('d'))
      const to = pathPoints(bars[j + 1].getAttribute('d'))
      const x1 = parseFloat(line.getAttribute('x1'))
      const x2 = parseFloat(line.getAttribute('x2'))
      const y = parseFloat(line.getAttribute('y1'))

      // Horizontal, from this bar's right edge to the next bar's left edge.
      expect(parseFloat(line.getAttribute('y2'))).toBe(y)
      expect(x1).toBeCloseTo(Math.max(...from.map((p) => p[0])), 6)
      expect(x2).toBeCloseTo(Math.min(...to.map((p) => p[0])), 6)

      // At the level this bar left behind: its top when it stepped up, its
      // bottom when it stepped down.
      const ys = from.map((p) => p[1])
      expect(y).toBeCloseTo(
        values[j] >= 0 ? Math.min(...ys) : Math.max(...ys),
        6,
      )

      // Which is also where the next bar starts.
      expect(to.map((p) => p[1])).toContain(y)
    })
  })

  test('connectors.show: false draws none', () => {
    wfChart({ plotOptions: { waterfall: { connectors: { show: false } } } })
    expect(
      document.querySelectorAll('.apexcharts-waterfall-connector').length,
    ).toBe(0)
  })

  test('the dash and width are configurable, the colour follows the grid', () => {
    const chart = wfChart({
      plotOptions: {
        waterfall: { connectors: { strokeWidth: 2, strokeDashArray: 0 } },
      },
    })
    const line = document.querySelector('.apexcharts-waterfall-connector')

    expect(line.getAttribute('stroke-width')).toBe('2')
    expect(line.getAttribute('stroke-dasharray')).toBe('0')
    expect(line.getAttribute('stroke')).toBe(chart.w.config.grid.borderColor)
  })

  test('a hole is not bridged', () => {
    wfChart({
      series: [
        {
          data: [
            { x: 'a', y: 10 },
            { x: 'gap', y: null },
            { x: 'b', y: 5 },
          ],
        },
      ],
    })
    // Two gaps between three categories, but neither touches a drawn bar on
    // both sides.
    expect(
      document.querySelectorAll('.apexcharts-waterfall-connector').length,
    ).toBe(0)
  })

  test('a horizontal waterfall joins its bars with vertical segments', () => {
    const chart = wfChart({
      plotOptions: { bar: { horizontal: true } },
      series: [
        {
          data: [
            { x: 'Opening', y: 412 },
            { x: 'Hires', y: 68 },
            { x: 'Exits', y: -57 },
            { x: 'Closing', isTotal: true },
          ],
        },
      ],
    })
    expect(chart.w.globals.isBarHorizontal).toBe(true)

    const bars = [...document.querySelectorAll('.apexcharts-rangebar-area')]
    const lines = [
      ...document.querySelectorAll('.apexcharts-waterfall-connector'),
    ]
    expect(lines.length).toBe(bars.length - 1)

    lines.forEach((line, j) => {
      const from = pathPoints(bars[j].getAttribute('d'))
      const to = pathPoints(bars[j + 1].getAttribute('d'))
      const x = parseFloat(line.getAttribute('x1'))

      // Vertical, at the level this bar reached, spanning the two slots.
      expect(parseFloat(line.getAttribute('x2'))).toBe(x)
      expect(from.map((p) => p[0])).toContain(x)
      expect(to.map((p) => p[0])).toContain(x)
      expect(parseFloat(line.getAttribute('y1'))).toBeCloseTo(
        Math.max(...from.map((p) => p[1])),
        6,
      )
      expect(parseFloat(line.getAttribute('y2'))).toBeCloseTo(
        Math.min(...to.map((p) => p[1])),
        6,
      )
    })
  })

  test('a non-waterfall range column gets no connector layer and no sink', () => {
    const chart = createChartWithOptions({
      chart: { type: 'rangeBar', width: 600, height: 400 },
      series: [
        {
          data: [
            { x: 'a', y: [1, 5] },
            { x: 'b', y: [3, 8] },
          ],
        },
      ],
    })
    expect(chart.w.waterfallData.geometry).toBe(null)
    expect(
      document.querySelectorAll('.apexcharts-waterfall-connectors').length,
    ).toBe(0)
  })
})

describe('Updates', () => {
  test('updateOptions redraws the same walk, it does not re-accumulate', async () => {
    const chart = wfChart()
    const before = JSON.stringify(chart.w.rangeData.seriesRangeEnd)

    await chart.updateOptions({ title: { text: 'Cash flow' } })
    expect(JSON.stringify(chart.w.rangeData.seriesRangeEnd)).toBe(before)
  })

  test('updateSeries accumulates the new deltas from scratch', async () => {
    const chart = wfChart()
    await chart.updateSeries([
      {
        name: 'Cash flow',
        data: [
          { x: 'a', y: 50 },
          { x: 'b', y: 25 },
        ],
      },
    ])

    expect(chart.w.rangeData.seriesRangeStart[0]).toEqual([0, 50])
    expect(chart.w.rangeData.seriesRangeEnd[0]).toEqual([50, 75])
  })

  test('appendData extends the walk rather than restarting it', async () => {
    const chart = wfChart({
      series: [
        {
          data: [
            { x: 'a', y: 10 },
            { x: 'b', y: 5 },
          ],
        },
      ],
    })
    await chart.appendData([{ data: [{ x: 'c', y: 7 }] }])

    expect(chart.w.rangeData.seriesRangeEnd[0]).toEqual([10, 15, 22])
  })

  test('the connector layer is replaced, not stacked up, on each update', async () => {
    const chart = wfChart()
    await chart.updateSeries([{ name: 'Cash flow', data: CASHFLOW }])
    await chart.updateSeries([{ name: 'Cash flow', data: CASHFLOW }])

    expect(
      document.querySelectorAll('.apexcharts-waterfall-connectors').length,
    ).toBe(1)
    expect(
      document.querySelectorAll('.apexcharts-waterfall-connector').length,
    ).toBe(CASHFLOW.length - 1)
  })

  test('the reset baseline holds deltas, not accumulated levels', () => {
    // resetSeries re-submits initialSeries. Snapshotting the drawn rows would
    // put the PAIRS in there, and the reset would restore a chart whose input
    // is no longer deltas: option changes could never be re-derived from it.
    const chart = wfChart()
    const initial = chart.w.globals.initialSeries

    expect(initial[0].data[1].y).toBe(569000)
    expect(initial[0].data[3].isSubtotal).toBe(true)
  })

  test('changing type away from waterfall drops the steps it left behind', async () => {
    // The steps are read by the label and the tooltip without asking what type
    // the chart is now. Left behind, they made a plain bar chart print the
    // numbers of the waterfall it used to be.
    const chart = wfChart({
      series: [
        {
          name: 'S',
          data: [
            { x: 'a', y: 100 },
            { x: 'b', y: 50 },
            { x: 'c', y: -30 },
          ],
        },
      ],
    })
    expect(chart.w.waterfallData.values[0]).toEqual([100, 50, -30])

    await chart.updateOptions({
      chart: { type: 'bar' },
      series: [{ name: 'S', data: [7, 8, 9] }],
    })

    expect(chart.w.waterfallData.geometry).toBe(null)
    expect(chart.w.waterfallData.values).toEqual([])
    expect(
      [...document.querySelectorAll('.apexcharts-datalabel')].map(
        (t) => t.textContent,
      ),
    ).toEqual(['7', '8', '9'])
  })

  test('changing type INTO waterfall accumulates the bar chart’s values', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 700, height: 400 },
      series: [{ name: 'S', data: [{ x: 'a', y: 10 }, { x: 'b', y: -4 }] }],
    })
    await chart.updateOptions({ chart: { type: 'waterfall' } })

    expect(chart.w.config.chart.requestedType).toBe('waterfall')
    expect(chart.w.rangeData.seriesRangeStart[0]).toEqual([0, 10])
    expect(chart.w.rangeData.seriesRangeEnd[0]).toEqual([10, 6])
  })

  test('resetSeries redraws the same walk', async () => {
    const chart = wfChart()
    await chart.resetSeries()

    expect(chart.w.rangeData.seriesRangeEnd[0]).toEqual([
      120000, 689000, 920000, 920000, 578000, 345000, 345000,
    ])
  })
})
