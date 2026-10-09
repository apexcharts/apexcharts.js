import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import InitCtxVariables from '../../src/modules/helpers/InitCtxVariables.js'
import Filters from '../../src/modules/Filters.js'
import {
  getSeriesTransform,
  registerSeriesTransform,
  unregisterSeriesTransform,
} from '../../src/modules/SeriesTransformRegistry'
// Registered here so the "present" side of each case does not depend on what
// the default bundle carries.
import '../../src/features/waterfall'
import '../../src/features/dumbbell'
import '../../src/features/streamgraph'
import '../../src/features/drilldown'

// A type or feature a chart asks for and the bundle does not carry must fail
// LOUDLY: a blank chart and one console line naming the import. The failure
// these guard against is worse than a blank: waterfall, dumbbell and
// streamgraph route through rangeBar / rangeArea, which happily draw the
// untransformed series as a chart that is simply wrong, and a drilldown chart
// without the feature draws its root and never navigates.

const TRANSFORMS = ['waterfall', 'dumbbell', 'streamgraph']
const FEATURES = ['waterfall', 'streamgraph', 'drilldown']

let saved
beforeEach(() => {
  saved = {
    transforms: TRANSFORMS.map((n) => [n, getSeriesTransform(n)]),
    features: new Map(InitCtxVariables._featureRegistry),
  }
})
afterEach(() => {
  for (const [n, fn] of saved.transforms) registerSeriesTransform(n, fn)
  InitCtxVariables._featureRegistry.clear()
  for (const [k, v] of saved.features)
    InitCtxVariables._featureRegistry.set(k, v)
  vi.restoreAllMocks()
})

/** The page state of a bundle that never loaded these features. */
function dropFeatures() {
  for (const n of TRANSFORMS) unregisterSeriesTransform(n)
  for (const n of FEATURES) InitCtxVariables._featureRegistry.delete(n)
}

const warnings = (spy) => spy.mock.calls.map((c) => String(c[0]))

const CASES = {
  waterfall: {
    chart: { type: 'waterfall' },
    series: [
      {
        name: 'Cash',
        data: [
          { x: 'Start', y: 120 },
          { x: 'Revenue', y: 569 },
          { x: 'Costs', y: -342 },
          { x: 'Balance', isTotal: true },
        ],
      },
    ],
  },
  dumbbell: {
    chart: { type: 'dumbbell' },
    series: [
      {
        name: 'Desired',
        data: [
          { x: 'A', y: 15 },
          { x: 'B', y: 13 },
        ],
      },
      {
        name: 'Admired',
        data: [
          { x: 'A', y: 51 },
          { x: 'B', y: 70 },
        ],
      },
    ],
  },
  streamgraph: {
    chart: { type: 'streamgraph' },
    series: [
      { name: 'Alpha', data: [3, 5, 8, 6, 4] },
      { name: 'Beta', data: [7, 6, 2, 3, 9] },
    ],
  },
}

const build = (type) =>
  createChartWithOptions(
    structuredClone({
      ...CASES[type],
      chart: { ...CASES[type].chart, width: 600, height: 300 },
    }),
  )

describe.each(TRANSFORMS)('%s without its feature', (type) => {
  test('draws nothing and warns once, naming the import and the file', async () => {
    dropFeatures()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = build(type)

    for (const s of chart.w.config.series) expect(s.data).toEqual([])
    expect(chart.el.querySelectorAll('.apexcharts-rangebar-area').length).toBe(
      0,
    )
    expect(chart.el.querySelectorAll('.apexcharts-area').length).toBe(0)

    const msgs = warnings(warn).filter((m) =>
      m.includes(`requires the ${type} feature`),
    )
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toContain(`chart.type '${type}'`)
    expect(msgs[0]).toContain(`import 'apexcharts/${type}'`)
    expect(msgs[0]).toContain(`<script src='.../dist/features/${type}.js'>`)

    // An update re-parses: still blank, and the chart does not repeat itself.
    await chart.updateOptions({ title: { text: 'again' } })
    for (const s of chart.w.config.series) expect(s.data).toEqual([])
    expect(
      warnings(warn).filter((m) => m.includes(`requires the ${type} feature`)),
    ).toHaveLength(1)
  })

  test('draws the series when the feature is present', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = build(type)
    expect(chart.w.config.series.some((s) => s.data.length > 0)).toBe(true)
    expect(warnings(warn).some((m) => m.includes('requires the'))).toBe(false)
  })
})

describe('raincloud without its feature', () => {
  test('names the violin file before the feature file for a script tag', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const raincloud = getSeriesTransform('raincloud')
    unregisterSeriesTransform('raincloud')
    try {
      createChartWithOptions({
        chart: { type: 'raincloud', width: 600, height: 300 },
        series: [{ name: 'A', data: [{ x: 'G', points: [1, 2, 3, 4, 5, 6] }] }],
      })
    } finally {
      if (raincloud) registerSeriesTransform('raincloud', raincloud)
    }
    const msg = warnings(warn).find((m) =>
      m.includes('requires the raincloud feature'),
    )
    expect(msg).toContain("import 'apexcharts/raincloud'")
    expect(msg).toContain(
      "<script src='.../dist/violin.js'> and <script src='.../dist/features/raincloud.js'>",
    )
  })
})

describe('drilldown without its feature', () => {
  const PIE = {
    chart: { type: 'pie', width: 400, height: 300 },
    series: [40, 35, 25],
    labels: ['North', 'South', 'West'],
    plotOptions: { pie: { expandOnClick: true } },
    drilldown: {
      enabled: true,
      series: [{ id: 'n', name: 'North', data: [{ x: 'N1', y: 10 }] }],
    },
  }

  test('warns once that `drilldown` needs the feature', () => {
    dropFeatures()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions(structuredClone(PIE))
    expect(chart.drilldown).toBeNull()
    const msgs = warnings(warn).filter((m) =>
      m.includes('requires the drilldown feature'),
    )
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toContain("import 'apexcharts/features/drilldown'")
    expect(msgs[0]).toContain("<script src='.../dist/features/drilldown.js'>")
  })

  test('a pie keeps its click pull-out, since the click is not navigation', () => {
    dropFeatures()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions(structuredClone(PIE))
    expect(Filters.drilldownBlocksSliceOffset(chart.w)).toBe(false)
  })

  test('with the feature, the pie gives the click to navigation', () => {
    const chart = createChartWithOptions(structuredClone(PIE))
    expect(chart.drilldown).not.toBeNull()
    expect(Filters.drilldownBlocksSliceOffset(chart.w)).toBe(true)
  })

  const TREEMAP = {
    chart: { type: 'treemap', width: 600, height: 400 },
    series: [
      {
        data: [
          {
            x: 'Tech',
            children: [
              { x: 'A', y: 30 },
              { x: 'B', y: 20 },
            ],
          },
          {
            x: 'Energy',
            children: [
              { x: 'C', y: 25 },
              { x: 'D', y: 10 },
            ],
          },
        ],
      },
    ],
    plotOptions: { treemap: { zoom: { enabled: true } } },
    drilldown: {
      enabled: true,
      series: [{ id: 'x', name: 'X', data: [{ x: 'X1', y: 1 }] }],
    },
  }
  const zoomTargets = (chart) =>
    [...chart.el.querySelectorAll('[aria-label]')].filter((e) =>
      e.getAttribute('aria-label').endsWith('Zoom in'),
    )

  test('a treemap keeps click-to-zoom, and says nothing about a conflict', () => {
    dropFeatures()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions(structuredClone(TREEMAP))
    expect(zoomTargets(chart).length).toBeGreaterThan(0)
    expect(warnings(warn).some((m) => m.includes('zoom is ignored'))).toBe(
      false,
    )
  })

  test('with the feature, drilldown owns the click and zoom stands down', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions(structuredClone(TREEMAP))
    expect(zoomTargets(chart)).toHaveLength(0)
    expect(warnings(warn).some((m) => m.includes('zoom is ignored'))).toBe(true)
  })
})

describe('changing to an opt-in type the page never loaded', () => {
  // icicle stands in for every RESERVED_TYPES name: the default bundle does
  // not register it, and this file does not import its entry.
  const bars = (chart) =>
    chart.el.querySelectorAll('.apexcharts-bar-area').length

  test('rejects before tearing anything down, and the chart keeps working', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 500, height: 300 },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    expect(bars(chart)).toBe(3)

    await expect(
      chart.updateOptions({
        chart: { type: 'icicle' },
        series: [{ data: [{ x: 'a', y: 1 }] }],
      }),
    ).rejects.toThrow('chart type "icicle" is not registered')

    expect(chart.w.config.chart.type).toBe('bar')
    expect(bars(chart)).toBe(3)

    await chart.updateOptions({ series: [{ name: 'A', data: [4, 5, 6, 7] }] })
    expect(bars(chart)).toBe(4)
  })
})
