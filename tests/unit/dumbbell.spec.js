import { describe, test, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { dumbbellTransform } from '../../src/features/dumbbell'
import Helpers from '../../src/charts/common/bar/Helpers'

// `chart.type: 'dumbbell'` compares two (or more) measures over the same
// categories. The measures arrive as ordinary series and the renderer draws one
// interval per row, so the transform merges them and keeps the endpoint
// identities alongside, which is what lets a dot, a label, a gradient and a
// tooltip still say WHICH measure they belong to after the merge.

const DESIRED = [
  { x: 'Terraform', y: 15.7 },
  { x: 'Homebrew', y: 15.2 },
  { x: 'Cargo', y: 13.9 },
]
const ADMIRED = [
  { x: 'Terraform', y: 51.8 },
  { x: 'Homebrew', y: 56.4 },
  { x: 'Cargo', y: 70.8 },
]

/** A throwaway `w` for exercising the transform on its own. */
function fakeW(overrides = {}) {
  return {
    config: { xaxis: {} },
    globals: { collapsedSeriesIndices: [] },
    ...overrides,
  }
}

function pair() {
  return [
    { name: 'Desired', data: DESIRED },
    { name: 'Admired', data: ADMIRED },
  ]
}

function dumbbellChart(opts = {}) {
  return createChartWithOptions({
    chart: { type: 'dumbbell', width: 700, height: 400, ...opts.chart },
    series: opts.series || pair(),
    colors: opts.colors || ['#3B82F6', '#EF4444'],
    ...(opts.plotOptions ? { plotOptions: opts.plotOptions } : {}),
    ...opts.extra,
  })
}

/** A Helpers bound to just enough barCtx to answer endpoint questions. */
function helpersFor(w, barOptions = {}) {
  return new Helpers({
    w,
    barOptions: { isDumbbell: true, dumbbellColors: undefined, ...barOptions },
    isHorizontal: true,
  })
}

describe('Merge: two measures become one interval', () => {
  test('the rows carry both values, low end first', () => {
    const w = fakeW()
    const out = dumbbellTransform(pair(), w)

    expect(out[0].data.map((d) => d.y)).toEqual([
      [15.7, 51.8],
      [15.2, 56.4],
      [13.9, 70.8],
    ])
  })

  test('only one series carries the rows, and the rest keep their names', () => {
    const w = fakeW()
    const out = dumbbellTransform(pair(), w)

    // Drawing the same rows twice would stack two identical connectors, but
    // dropping the second series would take the legend name with it.
    expect(out).toHaveLength(2)
    expect(out[1].data).toEqual([])
    expect(out.map((s) => s.name)).toEqual(['Desired', 'Admired'])
    expect(w.dumbbellData.carrier).toBe(0)
  })

  test('the endpoint identities survive the merge', () => {
    const w = fakeW()
    dumbbellTransform(pair(), w)

    expect(w.dumbbellData.form).toBe('series')
    expect(w.dumbbellData.names).toEqual(['Desired', 'Admired'])
    expect(w.dumbbellData.values[0]).toEqual([15.7, 51.8])
    // Endpoint 0 is at the low end of this row, endpoint 1 at the high end.
    expect(w.dumbbellData.order[0]).toEqual([0, 1])
  })

  test('a row where the measures cross keeps them apart', () => {
    const w = fakeW()
    dumbbellTransform(
      [
        { name: 'Before', data: [{ x: 'Alpha', y: 62 }] },
        { name: 'After', data: [{ x: 'Alpha', y: 24 }] },
      ],
      w,
    )

    // The interval is still emitted low-to-high...
    expect(w.dumbbellData.values[0]).toEqual([62, 24])
    // ...and `order` is what says the LOW end belongs to 'After'. Without it,
    // the drawn interval alone would colour this row backwards.
    expect(w.dumbbellData.order[0]).toEqual([1, 0])
  })
})

describe('Merge: joining the measures up', () => {
  test('rows are joined on x, not on position', () => {
    const w = fakeW()
    const out = dumbbellTransform(
      [
        { name: 'A', data: [{ x: 'p', y: 1 }, { x: 'q', y: 2 }] },
        // Same categories, written in the other order.
        { name: 'B', data: [{ x: 'q', y: 20 }, { x: 'p', y: 10 }] },
      ],
      w,
    )

    expect(out[0].data.map((d) => [d.x, d.y])).toEqual([
      ['p', [1, 10]],
      ['q', [2, 20]],
    ])
  })

  test('a category only one measure has still gets its row', () => {
    const w = fakeW()
    const out = dumbbellTransform(
      [
        { name: 'A', data: [{ x: 'p', y: 1 }, { x: 'q', y: 2 }] },
        { name: 'B', data: [{ x: 'p', y: 10 }] },
      ],
      w,
    )

    // One endpoint, so a lone dot rather than a dropped row: dropping it would
    // shift every category below it.
    expect(out[0].data[1].y).toEqual([2, 2])
    expect(w.dumbbellData.values[1]).toEqual([2, null])
  })

  test('categories and bare numbers are accepted as input', () => {
    const w = fakeW({ config: { xaxis: { categories: ['p', 'q'] } } })
    const out = dumbbellTransform(
      [{ name: 'A', data: [1, 2] }, { name: 'B', data: [10, 20] }],
      w,
    )

    expect(out[0].data.map((d) => [d.x, d.y])).toEqual([
      ['p', [1, 10]],
      ['q', [2, 20]],
    ])
  })

  test('a row with no values at all is kept as a hole', () => {
    const w = fakeW()
    const out = dumbbellTransform(
      [
        { name: 'A', data: [{ x: 'p', y: 1 }, { x: 'q', y: null }] },
        { name: 'B', data: [{ x: 'p', y: 10 }, { x: 'q', y: null }] },
      ],
      w,
    )

    expect(out[0].data[1].y).toBeNull()
    expect(w.dumbbellData.order[1]).toBeNull()
  })
})

describe('Merge: the y: [lo, hi] form', () => {
  test('pairs are passed straight through', () => {
    const w = fakeW()
    const ser = [{ name: 'Range', data: [{ x: 'p', y: [20, 62] }] }]
    const out = dumbbellTransform(ser, w)

    expect(out).toBe(ser)
    expect(w.dumbbellData.form).toBe('pairs')
    // Nothing to identify, so the legacy dumbbellColors pathway draws it.
    expect(w.dumbbellData.names).toEqual([])
  })
})

describe('Merge: re-entry', () => {
  test('a second parse merges from the stash, not from its own output', () => {
    const w = fakeW()
    const first = dumbbellTransform(pair(), w)
    // parseData writes the merged rows back to config.series, so this is what
    // the next render hands in. Merging THAT would pair a pair.
    const second = dumbbellTransform(first, w)

    expect(second[0].data.map((d) => d.y)).toEqual(
      first[0].data.map((d) => d.y),
    )
    expect(w.dumbbellData.form).toBe('series')
  })

  test('a collapsed measure leaves the row and the rest close up', () => {
    const w = fakeW({ globals: { collapsedSeriesIndices: [1] } })
    const out = dumbbellTransform(pair(), w)

    // A two-endpoint dumbbell becomes a one-endpoint lollipop.
    expect(out[0].data.map((d) => d.y)).toEqual([
      [15.7, 15.7],
      [15.2, 15.2],
      [13.9, 13.9],
    ])
    expect(w.dumbbellData.hidden).toEqual([1])
  })

  test('collapsing the carrier hands the rows to the next visible measure', () => {
    const w = fakeW({ globals: { collapsedSeriesIndices: [0] } })
    const out = dumbbellTransform(pair(), w)

    // The carrier must be a series that still draws, or the collapse would
    // empty the whole chart rather than one of its ends.
    expect(w.dumbbellData.carrier).toBe(1)
    expect(out[0].data).toEqual([])
    expect(out[1].data.map((d) => d.y)).toEqual([
      [51.8, 51.8],
      [56.4, 56.4],
      [70.8, 70.8],
    ])
  })
})

describe('Endpoints: which dot is which', () => {
  test('each end takes the colour of the measure it came from', () => {
    const w = fakeW({
      globals: { collapsedSeriesIndices: [], colors: ['#blue', '#red'] },
    })
    dumbbellTransform(pair(), w)
    const ends = helpersFor(w).getDumbbellEnds(0, 0)

    expect(ends).toEqual([
      { value: 15.7, color: '#blue', index: 0 },
      { value: 51.8, color: '#red', index: 1 },
    ])
  })

  test('a crossed row is coloured by measure, not by side', () => {
    const w = fakeW({
      globals: { collapsedSeriesIndices: [], colors: ['#blue', '#red'] },
    })
    dumbbellTransform(
      [
        { name: 'Before', data: [{ x: 'Alpha', y: 62 }] },
        { name: 'After', data: [{ x: 'Alpha', y: 24 }] },
      ],
      w,
    )
    const ends = helpersFor(w).getDumbbellEnds(0, 0)

    // 'Before' is on the RIGHT of this row and still blue.
    expect(ends.find((e) => e.value === 62).color).toBe('#blue')
    expect(ends.find((e) => e.value === 24).color).toBe('#red')
  })

  test('a collapsed measure has no dot', () => {
    const w = fakeW({
      globals: { collapsedSeriesIndices: [1], colors: ['#blue', '#red'] },
    })
    dumbbellTransform(pair(), w)

    expect(helpersFor(w).getDumbbellEnds(0, 0)).toEqual([
      { value: 15.7, color: '#blue', index: 0 },
    ])
  })

  test('the y: [lo, hi] form keeps the positional dumbbellColors', () => {
    const w = fakeW({
      globals: { collapsedSeriesIndices: [], colors: ['#one'] },
      rangeData: {
        seriesRange: [[{}]],
        seriesRangeStart: [[20]],
        seriesRangeEnd: [[62]],
      },
    })
    dumbbellTransform([{ data: [{ x: 'p', y: [20, 62] }] }], w)
    const ends = helpersFor(w, {
      dumbbellColors: [['#start', '#end']],
    }).getDumbbellEnds(0, 0)

    expect(ends.map((e) => e.color)).toEqual(['#start', '#end'])
  })
})

describe('Connector', () => {
  test('the gradient runs from the low end’s colour to the high end’s', () => {
    const w = fakeW({
      globals: { collapsedSeriesIndices: [], colors: ['#blue', '#red'] },
      config: {
        xaxis: {},
        plotOptions: { bar: { dumbbell: { connector: { opacity: 0.5 } } } },
      },
    })
    dumbbellTransform(pair(), w)
    const fill = helpersFor(w).getDumbbellConnectorFill(0, 0)

    expect(fill.type).toBe('gradient')
    expect(fill.gradient.gradientFrom).toBe('#blue')
    expect(fill.gradient.gradientTo).toBe('#red')
    expect(fill.gradient.opacityFrom).toBe(0.5)
  })

  test('a crossed row gets its gradient the other way round', () => {
    const w = fakeW({
      globals: { collapsedSeriesIndices: [], colors: ['#blue', '#red'] },
      config: {
        xaxis: {},
        plotOptions: { bar: { dumbbell: { connector: { opacity: 0.5 } } } },
      },
    })
    dumbbellTransform(
      [
        { name: 'Before', data: [{ x: 'Alpha', y: 62 }] },
        { name: 'After', data: [{ x: 'Alpha', y: 24 }] },
      ],
      w,
    )
    const fill = helpersFor(w).getDumbbellConnectorFill(0, 0)

    // Left-to-right it now runs red → blue, so it still meets each dot in that
    // dot's own colour.
    expect(fill.gradient.gradientFrom).toBe('#red')
    expect(fill.gradient.gradientTo).toBe('#blue')
  })

  test('a set connector colour leaves the fill alone', () => {
    const w = fakeW({
      globals: { collapsedSeriesIndices: [], colors: ['#blue', '#red'] },
      config: {
        xaxis: {},
        plotOptions: { bar: { dumbbell: { connector: { color: '#ccc' } } } },
      },
    })
    dumbbellTransform(pair(), w)

    expect(helpersFor(w).getDumbbellConnectorFill(0, 0)).toBeNull()
  })
})

describe('Config', () => {
  test('the type routes to the range-bar renderer, in rows', () => {
    const chart = dumbbellChart()
    const w = chart.w

    expect(w.config.chart.type).toBe('rangeBar')
    expect(w.config.chart.requestedType).toBe('dumbbell')
    expect(w.config.plotOptions.bar.isDumbbell).toBe(true)
    expect(w.config.plotOptions.bar.horizontal).toBe(true)
    expect(w.config.chart.stacked).toBe(false)
  })

  test('the column form is a plain opt-out', () => {
    const chart = dumbbellChart({
      plotOptions: { bar: { horizontal: false } },
    })

    expect(chart.w.config.plotOptions.bar.horizontal).toBe(false)
  })

  test('end labels are on, and the centred range label is off', () => {
    const w = dumbbellChart().w

    // The two values ARE the comparison. The range bar's centred label reads
    // out `end - start`, which is the one number a dumbbell already shows.
    expect(w.config.plotOptions.bar.dumbbell.dataLabels.enabled).toBe(true)
    expect(w.config.dataLabels.enabled).toBe(false)
  })

  test('the connector is thicker than the bare isDumbbell flag’s 2px', () => {
    expect(dumbbellChart().w.config.plotOptions.bar.barHeight).toBe(6)
    // ...while the flag on a plain range bar still gets its hairline.
    const bare = createChartWithOptions({
      chart: { type: 'rangeBar', width: 700, height: 400 },
      series: [{ data: [{ x: 'p', y: [20, 62] }] }],
      plotOptions: { bar: { horizontal: true, isDumbbell: true } },
    })
    expect(bare.w.config.plotOptions.bar.barHeight).toBe(2)
  })

  test('the type is drawn without leaving a waterfall’s numbers behind', () => {
    // Both types route through rangeBar, and both keep a transform-derived
    // slice; whichever one is not in play must be cleared or its labels and
    // tooltips read out the other one's arithmetic.
    const w = dumbbellChart().w
    expect(w.dumbbellData.form).toBe('series')
    expect(w.waterfallData.geometry).toBeNull()
  })
})
