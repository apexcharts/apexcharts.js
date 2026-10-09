import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'
import '../../src/features/drilldown.js'
import '../../src/features/stats.js'
import '../../src/features/renderer-canvas.js'
import { split } from '../../src/modules/trellis/TrellisSplit'
import * as TrellisScales from '../../src/modules/trellis/TrellisScales'
import { premiumFeaturesInUse } from '../../src/modules/license/LicenseEnforcer.js'

// The highlight filter draws each value faded and a PART of it solid in front,
// from the same baseline. The part travels with the data, so a pick and a clear
// are ordinary updates; these tests pin the drawing, the axis, the labels, the
// tooltip and legend rows, and that a clear leaves the plain chart behind.

const CATS = ['2016', '2017', '2018']

function column(extra = {}) {
  return createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 300, ...(extra.chart || {}) },
    series: extra.series || [
      { name: 'Revenue', data: [120, 140, 90], highlightData: [45, 160, null] },
      { name: 'Cost', data: [80, 60, 40], highlightData: [20, 10, 15] },
    ],
    xaxis: { categories: CATS },
    dataLabels: { enabled: true },
    ...(extra.options || {}),
  })
}

const parts = (chart) =>
  [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-highlight-part')].filter(
    (n) =>
      !n.classList.contains('apexcharts-highlight-edge') &&
      !n.classList.contains('apexcharts-highlight-hit'),
  )
const wholes = (chart) => [
  ...chart.w.dom.baseEl.querySelectorAll(
    '.apexcharts-series > .apexcharts-bar-area',
  ),
]

/** Every coordinate pair in a path `d`, in order. */
function points(d) {
  const nums = String(d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []
  const out = []
  for (let k = 0; k + 1 < nums.length; k += 2) {
    out.push([parseFloat(nums[k]), parseFloat(nums[k + 1])])
  }
  return out
}
const span = (d, axis) => {
  const v = points(d).map((p) => p[axis])
  return [Math.min(...v), Math.max(...v)]
}

/** The data-label texts of one series (jsdom's selector engine does not match
 * the mixed-case `data:realIndex` attribute, so it is read directly). */
const labelsOf = (chart, realIndex) =>
  [...chart.el.querySelectorAll('.apexcharts-datalabels')]
    .filter((g) => g.getAttribute('data:realIndex') === String(realIndex))
    .flatMap((g) => [...g.querySelectorAll('.apexcharts-datalabel')])
    .map((t) => t.textContent)

afterEach(() => vi.restoreAllMocks())

describe('drawing', () => {
  test('every whole fades and each non-null part is drawn once', () => {
    const chart = column()
    expect(chart.highlightFilter.isActive()).toBe(true)
    for (const el of wholes(chart)) {
      expect(el.getAttribute('fill-opacity')).toBe('0.2')
    }
    // 5 non-null parts across the two series
    expect(parts(chart).length).toBe(5)
  })

  test('a part shares its whole slot and baseline', () => {
    const chart = column()
    const whole = wholes(chart)[0]
    const part = parts(chart)[0]
    const wx = span(whole.getAttribute('pathTo'), 0)
    const px = span(part.getAttribute('pathTo'), 0)
    expect(px[0]).toBeCloseTo(wx[0], 3)
    expect(px[1]).toBeCloseTo(wx[1], 3)
    // same baseline (the larger y), shorter top
    const wy = span(whole.getAttribute('pathTo'), 1)
    const py = span(part.getAttribute('pathTo'), 1)
    expect(py[1]).toBeCloseTo(wy[1], 3)
    expect(py[0]).toBeGreaterThan(wy[0])
  })

  test('a part equal to its whole is drawn on exactly the same path', () => {
    const chart = column({
      series: [{ name: 'A', data: [50, 70, 30], highlightData: [50, 70, 30] }],
      options: { plotOptions: { bar: { borderRadius: 6 } } },
    })
    const w = wholes(chart).map((n) => n.getAttribute('pathTo'))
    const p = parts(chart).map((n) => n.getAttribute('pathTo'))
    expect(p).toEqual(w)
  })

  test('parts never carry a hit or capture class', () => {
    const chart = column()
    for (const n of parts(chart)) {
      expect(n.classList.contains('apexcharts-bar-area')).toBe(false)
      expect(n.getAttribute('pointer-events')).toBe('none')
      // nested, so Series.pushPaths (direct children only) never captures it
      expect(n.parentNode.classList.contains('apexcharts-bar-highlight')).toBe(
        true,
      )
    }
  })

  test('a horizontal part keeps its own sign, on the far side of zero', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 'P', data: [{ x: 'W', y: 18, highlight: -6 }] }],
    })
    const whole = wholes(chart)[0].getAttribute('pathTo')
    const part = parts(chart)[0].getAttribute('pathTo')
    const [wl] = span(whole, 0)
    const [, pr] = span(part, 0)
    // the part ends at the whole's baseline, the whole starts there
    expect(pr).toBeCloseTo(wl, 0)
  })

  test('a part past its whole traces the whole edge over it', () => {
    const chart = column()
    const edges = chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-highlight-edge',
    )
    // 160 > 140 is the only overflow
    expect(edges.length).toBe(1)
  })

  test('a funnel part is its stage scaled about the centreline, clamped to it', () => {
    const chart = createChartWithOptions({
      chart: { type: 'funnel', width: 600, height: 300 },
      series: [{ name: 'F', data: [1000, 500], highlightData: [250, 900] }],
      xaxis: { categories: ['a', 'b'] },
    })
    const w = wholes(chart).map((n) => span(n.getAttribute('pathTo'), 0))
    const p = parts(chart).map((n) => span(n.getAttribute('pathTo'), 0))
    const width = (r) => r[1] - r[0]
    expect(width(p[0]) / width(w[0])).toBeCloseTo(0.25, 2)
    // 900 on a 500 stage is clamped to the stage
    expect(width(p[1])).toBeCloseTo(width(w[1]), 2)
  })
})

describe('value axis', () => {
  test("'extend' stretches the axis to a part past its whole", () => {
    const chart = column()
    expect(chart.w.globals.maxY).toBeGreaterThanOrEqual(160)
  })

  test("'clamp' leaves the axis as the wholes set it", () => {
    const chart = column({ options: { highlightFilter: { axis: 'clamp' } } })
    expect(chart.w.globals.maxY).toBeLessThan(160)
  })

  test('a negative part drops an all-positive column floor below zero', () => {
    const chart = column({
      series: [{ name: 'A', data: [30, 40, 20], highlightData: [-15, 10, 5] }],
    })
    expect(chart.w.globals.minY).toBeLessThanOrEqual(-15)
  })

  test('a part on a null whole still extends the axis', () => {
    const chart = column({
      series: [{ name: 'A', data: [30, null, 20], highlightData: [10, 90, 5] }],
    })
    expect(chart.w.globals.maxY).toBeGreaterThanOrEqual(90)
  })
})

describe('labels, tooltip, legend', () => {
  test('labels state the part; a datum without one keeps no label', () => {
    const chart = column()
    const texts = labelsOf(chart, 0)
    // drawn blank, as a null value's label is
    expect(texts).toEqual(['45', '160', ''])
  })

  test("dataLabels.value: 'whole' keeps the whole values", () => {
    const chart = column({
      options: { highlightFilter: { dataLabels: { value: 'whole' } } },
    })
    const texts = labelsOf(chart, 0)
    expect(texts).toEqual(['120', '140', '90'])
  })

  /** A tooltip row's marker (with its shape) and value cell, the whole
   * already written into it the way the tooltip writes it. */
  const ttRow = (whole) => {
    const marker = document.createElement('span')
    marker.appendChild(
      document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
    )
    const yValue = document.createElement('span')
    yValue.innerHTML = whole
    return { marker, yValue }
  }
  const f = { yLbFormatter: (v) => String(v) }

  test('each tooltip row reads part / whole with a two-tone marker', () => {
    const hf = column().highlightFilter
    const r = ttRow('140')
    hf.tooltipRow(r, 0, 1, f)
    expect(r.yValue.textContent).toBe('160 / 140')
    expect(r.marker.firstElementChild.style.display).toBe('none')
    // no part: the whole alone, muted
    const n = ttRow('90')
    hf.tooltipRow(n, 0, 2, f)
    expect(n.yValue.textContent).toBe('90')
    expect(n.yValue.querySelector('.apexcharts-highlight-total')).not.toBe(null)
  })

  test('tooltip.share adds the share; tooltip.formatter owns the text', () => {
    const shared = column({
      options: { highlightFilter: { tooltip: { share: true } } },
    }).highlightFilter
    const r = ttRow('120')
    shared.tooltipRow(r, 0, 0, f)
    expect(r.yValue.textContent).toBe('45 / 120 \u00b7 38%')
    const seen = []
    const own = column({
      options: {
        highlightFilter: {
          tooltip: {
            formatter: (part, whole, o) => {
              seen.push([part, whole, o.seriesIndex, o.dataPointIndex])
              return `${part} of ${whole}`
            },
          },
        },
      },
    }).highlightFilter
    const q = ttRow('80')
    own.tooltipRow(q, 1, 0, f)
    expect(q.yValue.textContent).toBe('20 of 80')
    expect(seen).toEqual([[20, 80, 1, 0]])
  })

  test('a row with nothing highlighted keeps its plain marker and value', async () => {
    const chart = column()
    const r = ttRow('140')
    chart.highlightFilter.tooltipRow(r, 0, 1, f)
    await chart.highlightFilter.clear()
    r.yValue.innerHTML = '140'
    chart.highlightFilter.tooltipRow(r, 0, 1, f)
    expect(r.yValue.textContent).toBe('140')
    expect(r.marker.firstElementChild.style.display).toBe('')
    expect(r.marker.style.boxShadow).toBe('')
  })

  test('the legend lists the series and nothing else', () => {
    const texts = (chart) =>
      [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-legend-text')].map(
        (t) => t.textContent,
      )
    expect(texts(column())).toEqual(['Revenue', 'Cost'])
    // a single series keeps the chart's own rule: no legend
    expect(
      texts(
        column({
          series: [
            { name: 'Only', data: [10, 20, 30], highlightData: [5, 5, 5] },
          ],
        }),
      ),
    ).toEqual([])
  })
})

describe('updates and clearing', () => {
  test('updateSeries without the parts restores the plain chart', async () => {
    const chart = column()
    await chart.updateSeries([
      { name: 'Revenue', data: [120, 140, 90] },
      { name: 'Cost', data: [80, 60, 40] },
    ])
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    for (const el of wholes(chart)) {
      expect(el.getAttribute('fill-opacity')).not.toBe('0.2')
    }
    const texts = [
      ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-legend-text'),
    ].map((t) => t.textContent)
    expect(texts).toEqual(['Revenue', 'Cost'])
  })

  test('updateOptions({ series }) without highlightData clears it', async () => {
    const chart = column()
    await chart.updateOptions({
      series: [
        { name: 'Revenue', data: [120, 140, 90] },
        { name: 'Cost', data: [80, 60, 40] },
      ],
    })
    expect(chart.highlightFilter.isActive()).toBe(false)
  })

  test('enabled: false keeps the parts in the data but draws normally', () => {
    const chart = column({ options: { highlightFilter: { enabled: false } } })
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
  })

  test('set() and clear() redraw from the raw series', async () => {
    const chart = column({
      series: [{ name: 'A', data: [10, 20, 30] }],
    })
    await chart.highlightFilter.set([[1, 2, 3]])
    expect(chart.highlightFilter.valueAt(0, 2)).toBe(3)
    await chart.highlightFilter.set(({ value }) => value / 2)
    expect(chart.highlightFilter.valueAt(0, 1)).toBe(10)
    await chart.highlightFilter.clear()
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(chart.w.config.series[0].data).toEqual([10, 20, 30])
  })

  test('highlightFilterChanged fires enter, update and clear', async () => {
    const phases = []
    const chart = column({
      series: [{ name: 'A', data: [10, 20, 30] }],
      chart: {
        events: { highlightFilterChanged: (c, o) => phases.push(o.phase) },
      },
    })
    await chart.highlightFilter.set([[1, 2, 3]])
    await chart.highlightFilter.set([[3, 2, 1]])
    await chart.highlightFilter.clear()
    expect(phases).toEqual(['enter', 'update', 'clear'])
  })

  test('a capture records the wholes as marks and the parts on their own', () => {
    const chart = column()
    chart.series.capturePreviousPaths()
    const prev = chart.w.globals.previousPaths
    expect(prev.map((s) => s.paths.length)).toEqual([3, 3])
    // the feature's own map: every datum drawn under the pick keeps its fade,
    // and the five with a part keep its path too
    const prevParts = [...chart.w.globals.prevHighlightParts.values()]
    expect(prevParts.length).toBe(6)
    expect(prevParts.every((t) => t.f === 0.2)).toBe(true)
    expect(prevParts.filter((t) => t.d).length).toBe(5)
  })

  test('an update that is not captured leaves only what it drew', async () => {
    const chart = column()
    await chart.highlightFilter.clear({ animate: false })
    // nothing captured the picked render, and the clear drew no parts
    expect(chart.highlightFilter._targets.size).toBe(0)
  })

  test('a chart without parts builds no per-point rows', () => {
    const chart = column({
      series: [{ name: 'A', data: [10, 20, 30] }],
    })
    expect(chart.w.highlightData.active).toBe(false)
    expect(chart.w.highlightData.parts).toEqual([])
  })
})

describe('review fixes', () => {
  const fills = [
    ['gradient', { fill: { type: 'gradient' } }],
    ['pattern', { fill: { type: 'pattern' } }],
    [
      'distributed gradient',
      {
        fill: { type: 'gradient' },
        plotOptions: { bar: { distributed: true } },
      },
    ],
  ]
  test.each(fills)('a %s fill draws every whole and part', (_n, options) => {
    const chart = column({
      series: [{ name: 'A', data: [10, 20, 30], highlightData: [5, 10, 15] }],
      options,
    })
    expect(wholes(chart).length).toBe(3)
    expect(parts(chart).length).toBe(3)
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-xaxis-label').length,
    ).toBe(3)
    // the outline is a plain colour even when the paint is not
    for (const el of wholes(chart)) {
      expect(el.getAttribute('stroke')).toMatch(/^#|^rgb/)
    }
  })

  test('per-point parts count when only later points carry them', () => {
    const chart = column({
      series: [
        {
          name: 'A',
          data: [
            { x: 'a', y: 10 },
            { x: 'b', y: 20, highlight: 5 },
            { x: 'c', y: 30, highlight: 12 },
          ],
        },
      ],
    })
    expect(chart.highlightFilter.isActive()).toBe(true)
    expect(parts(chart).length).toBe(2)
  })

  test('a log axis places each part inside its whole', () => {
    const chart = column({
      series: [
        { name: 'A', data: [20, 100, 1000], highlightData: [15, 50, 500] },
      ],
      options: { yaxis: { logarithmic: true } },
    })
    const w = wholes(chart).map((n) => span(n.getAttribute('pathTo'), 1))
    const p = parts(chart).map((n) => span(n.getAttribute('pathTo'), 1))
    // a part under the axis floor (the log base) sits on it
    const floor = column({
      series: [{ name: 'A', data: [20, 100], highlightData: [5, 50] }],
      options: { yaxis: { logarithmic: true } },
    })
    const fy = span(parts(floor)[0].getAttribute('pathTo'), 1)
    expect(fy[1] - fy[0]).toBeLessThan(0.01)
    for (let k = 0; k < 3; k++) {
      // same baseline, top between the baseline and the whole's top
      expect(p[k][1]).toBeCloseTo(w[k][1], 1)
      expect(p[k][0]).toBeGreaterThan(w[k][0])
      expect(p[k][0]).toBeLessThan(w[k][1])
    }
  })

  test('a re-pick that moves the part to another series stays on the fast path', async () => {
    const chart = column({
      series: [
        { name: 'A', data: [1, 2, 3], highlightData: [1, 1, 1] },
        { name: 'B', data: [4, 5, 6] },
      ],
    })
    const stats = chart._updateStats
    const full = stats.full
    await chart.updateSeries([
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [4, 5, 6], highlightData: [2, 2, 2] },
    ])
    expect(chart.highlightFilter.valueAt(1, 0)).toBe(2)
    expect(chart.highlightFilter.valueAt(0, 0)).toBe(null)
    expect(stats.full).toBe(full)
  })

  test('hiding a series is not a change of pick', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const phases = []
    const chart = column({
      series: [
        { name: 'Revenue', data: [120, 140, 90] },
        { name: 'Cost', data: [80, 60, 40] },
      ],
      chart: {
        events: { highlightFilterChanged: (c, o) => phases.push(o.phase) },
      },
    })
    await chart.highlightFilter.set([
      [45, 160, null],
      [20, 10, 15],
    ])
    expect(phases).toEqual(['enter'])
    chart.toggleSeries('Cost')
    await new Promise((r) => setTimeout(r, 0))
    chart.toggleSeries('Cost')
    await new Promise((r) => setTimeout(r, 0))
    expect(phases).toEqual(['enter'])
    const ours = warn.mock.calls.filter((c) =>
      String(c[0]).includes('differ in length'),
    )
    expect(ours.length).toBe(0)
  })

  test('set(fn, { series }) reads the values of the new series', async () => {
    const chart = column({ series: [{ name: 'A', data: [10, 20, 30] }] })
    const seen = []
    await chart.highlightFilter.set(
      ({ value }) => {
        seen.push(value)
        return value / 2
      },
      { series: [{ name: 'A', data: [100, 200, 300] }] },
    )
    expect(seen).toEqual([100, 200, 300])
    expect(chart.highlightFilter.valueAt(0, 2)).toBe(150)
  })

  test('a histogram warns and draws no parts', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'histogram', width: 600, height: 300 },
      series: [
        {
          name: 'Ages',
          data: [21, 22, 25, 31, 33, 40, 41, 45, 52, 60],
          highlightData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        },
      ],
    })
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('histogram')),
    ).toBe(true)
  })

  test('a trellis panel keeps each part on its own x', () => {
    const res = split(
      [
        {
          name: 'A',
          facet: 'East',
          data: [
            { x: 'Q1', y: 10 },
            { x: 'Q2', y: 20 },
          ],
          highlightData: [4, 8],
        },
        {
          name: 'B',
          facet: 'West',
          data: [
            { x: 'Q2', y: 30 },
            { x: 'Q3', y: 5 },
          ],
          highlightData: [12, 2],
        },
      ],
      { by: 'facet' },
      { chartType: 'bar' },
    )
    const west = res.panels.find((p) => p.key === 'West').series[0]
    const east = res.panels.find((p) => p.key === 'East').series[0]
    expect(west.data.map((d) => d && d.x)).toEqual(['Q1', 'Q2', 'Q3'])
    expect(west.highlightData).toEqual([null, 12, 2])
    expect(east.highlightData).toEqual([4, 8, null])
  })
})

describe('drilldown', () => {
  function drillChart(events = {}) {
    return createChartWithOptions({
      chart: { type: 'bar', animations: { enabled: false }, events },
      series: [
        {
          name: 'Revenue',
          data: [
            { x: '2023', y: 100, drilldown: '2023-q' },
            { x: '2024', y: 150 },
          ],
          highlightData: [40, 60],
        },
      ],
      drilldown: {
        enabled: true,
        series: [
          {
            id: '2023-q',
            name: '2023 by Quarter',
            data: [
              { x: 'Q1', y: 20 },
              { x: 'Q2', y: 30 },
              { x: 'Q3', y: 25 },
              { x: 'Q4', y: 25 },
            ],
          },
        ],
      },
    })
  }

  test('drilling with a pick reports one clear, after the level is drawn', async () => {
    const seen = []
    const chart = drillChart({
      highlightFilterChanged: (c, o) =>
        seen.push([o.phase, c.w.globals.labels.slice()]),
    })
    // the test mount fires no 'mounted', so the pick is made as an update
    await chart.highlightFilter.set([[40, 60]])
    await chart.drillDown('2023-q')
    expect(seen.map((e) => e[0])).toEqual(['enter', 'clear'])
    expect(seen[1][1]).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
  })

  test('set() and clear() at a drill level keep that level', async () => {
    const chart = drillChart()
    await chart.drillDown('2023-q')
    const values = []
    await chart.highlightFilter.set(({ value }) => {
      values.push(value)
      return value / 2
    })
    expect(values).toEqual([20, 30, 25, 25])
    expect(chart.w.globals.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
    expect(chart.highlightFilter.valueAt(0, 1)).toBe(15)
    expect(chart.drilldown.depth).toBe(1)
    await chart.highlightFilter.clear()
    expect(chart.w.globals.labels).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
    expect(chart.highlightFilter.isActive()).toBe(false)
    // the top level is still the baseline the chart returns to
    await chart.drillToRoot()
    expect(chart.w.globals.labels).toEqual(['2023', '2024'])
  })
})

describe('drilldown, trellis and histogram: stacked and line charts', () => {
  const drillLevel = {
    id: 'q',
    name: 'By quarter',
    series: [
      {
        name: 'A',
        data: [
          { x: 'Q1', y: 4 },
          { x: 'Q2', y: 6 },
        ],
      },
      {
        name: 'B',
        data: [
          { x: 'Q1', y: 2 },
          { x: 'Q2', y: 3 },
        ],
      },
    ],
  }
  const lineParts = (chart) => [
    ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-line-highlight-part'),
  ]

  test('a stacked column drops the pick in both directions and reports one clear', async () => {
    const seen = []
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
        stacked: true,
        events: { highlightFilterChanged: (c, o) => seen.push(o.phase) },
      },
      series: [
        {
          name: 'A',
          data: [
            { x: '2023', y: 10, drilldown: 'q' },
            { x: '2024', y: 12 },
          ],
        },
        {
          name: 'B',
          data: [
            { x: '2023', y: 5 },
            { x: '2024', y: 6 },
          ],
        },
      ],
      drilldown: { enabled: true, series: [drillLevel] },
    })
    await chart.highlightFilter.set([
      [4, 6],
      [2, 3],
    ])
    expect(parts(chart).length).toBe(4)
    await chart.drillDown('q')
    expect(chart.w.globals.labels).toEqual(['Q1', 'Q2'])
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    expect(seen).toEqual(['enter', 'clear'])
    await chart.drillToRoot()
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    for (const w of wholes(chart)) {
      expect(w.getAttribute('fill-opacity')).toBe('1')
    }
    chart.destroy()
  })

  test('a line drops the pick at the level it drills to, its whole plain again', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          name: 'A',
          data: [
            { x: '2023', y: 10, drilldown: 'q' },
            { x: '2024', y: 12 },
          ],
          highlightData: [4, 6],
        },
      ],
      drilldown: { enabled: true, series: [drillLevel] },
    })
    expect(lineParts(chart).length).toBe(1)
    await chart.drillDown('q')
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(lineParts(chart).length).toBe(0)
    const dashed = [
      ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-series path'),
    ].filter((n) => n.getAttribute('stroke-dasharray') === '4')
    expect(dashed.length).toBe(0)
    chart.destroy()
  })

  test('trellis aligns each panel part to the panel x, stacked and line alike', () => {
    for (const chartType of ['bar', 'line']) {
      const res = split(
        [
          {
            name: 'A',
            facet: 'East',
            data: [
              { x: 'Q1', y: 10 },
              { x: 'Q2', y: 20 },
            ],
            highlightData: [4, 8],
          },
          {
            name: 'B',
            facet: 'East',
            data: [
              { x: 'Q2', y: 30 },
              { x: 'Q3', y: 5 },
            ],
            highlightData: [12, 2],
          },
        ],
        { by: 'facet' },
        { chartType, stacked: chartType === 'bar' },
      )
      const [a, b] = res.panels[0].series
      expect(a.highlightData).toEqual([4, 8, null])
      expect(b.highlightData).toEqual([null, 12, 2])
    }
  })

  test('a shared trellis scale reaches the parts, unstacked and stacked', () => {
    const res = split(
      [
        {
          name: 'A',
          facet: 'East',
          data: [
            { x: 1, y: 10, highlight: 50 },
            { x: 2, y: 20 },
          ],
        },
        {
          name: 'B',
          facet: 'West',
          data: [
            { x: 1, y: 30 },
            { x: 2, y: 5 },
          ],
          highlightData: [-12, 40],
        },
      ],
      { by: 'facet' },
      { chartType: 'line' },
    )
    const xf = res.xForm
    // without the feature's say-so the wholes alone set the scale
    expect(TrellisScales.yExtent(res.panels, xf)).toEqual({ min: 5, max: 30 })
    expect(TrellisScales.yExtent(res.panels, xf, true)).toEqual({
      min: -12,
      max: 50,
    })
    expect(TrellisScales.yExtentInWindow(res.panels, xf, 2, 2, true)).toEqual({
      min: 5,
      max: 40,
    })
    // stacked: the parts pile on parts, signs apart, beside the wholes' piles
    const st = split(
      [
        { name: 'A', facet: 'E', data: [10, 20], highlightData: [30, -4] },
        { name: 'B', facet: 'E', data: [5, 5], highlightData: [25, -6] },
      ],
      { by: 'facet' },
      { chartType: 'bar', stacked: true },
    )
    expect(TrellisScales.stackedYExtent(st.panels, st.xForm)).toEqual({
      min: 0,
      max: 25,
    })
    expect(
      TrellisScales.stackedYExtent(st.panels, st.xForm, { parts: true }),
    ).toEqual({ min: -10, max: 55 })
    // resolve() hands the panels bounds over both
    const y = TrellisScales.resolve(
      st,
      {},
      { chartType: 'bar', stacked: true, parts: true },
    ).y
    expect(y.min).toBeLessThanOrEqual(-10)
    expect(y.max).toBeGreaterThanOrEqual(55)
  })

  test('a stacked histogram still warns and draws no parts', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'histogram', stacked: true, width: 600, height: 300 },
      series: [
        {
          name: 'Ages',
          data: [21, 22, 25, 31, 33, 40, 41, 45, 52, 60],
          highlightData: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        },
      ],
    })
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('histogram')),
    ).toBe(true)
  })
})

describe('frames and renderers', () => {
  const plain = [
    { name: 'Revenue', data: [120, 140, 90] },
    { name: 'Cost', data: [80, 60, 40] },
  ]
  const picked = [
    { name: 'Revenue', data: [120, 140, 90], highlightData: [45, 160, null] },
    { name: 'Cost', data: [80, 60, 40], highlightData: [20, 10, 15] },
  ]

  // The test mount turns animations off; updates here are animated.
  const animated = (chart) => {
    chart.w.config.chart.animations.enabled = true
    return chart
  }

  test('a canvas pick paints the landed fade, with no tween left running', async () => {
    const chart = animated(
      createChartWithOptions({
        chart: { type: 'bar', width: 600, height: 300, renderer: 'canvas' },
        series: plain,
        xaxis: { categories: CATS },
      }),
    )
    expect(chart.ctx.renderer.kind).toBe('canvas')
    await chart.updateSeries(picked)
    const hf = chart.highlightFilter
    expect(hf.isActive()).toBe(true)
    // the canvas paints once, inside the render: a tween's first frame
    // would be what stays on screen
    expect(hf._live.size).toBe(0)
    const faded = chart.ctx.renderer._g
      .displayList()
      .filter((c) => c.fillOpacity !== undefined)
    expect(faded.length).toBe(6)
    for (const c of faded) expect(Number(c.fillOpacity)).toBeCloseTo(0.2, 6)
    chart.destroy()
  })

  test('a first pick starts each whole under its part at 0, then fades it in', async () => {
    const chart = animated(column({ series: plain }))
    const hf = chart.highlightFilter
    // Hold the feature's tweens at their first frame.
    const frames = []
    vi.spyOn(hf, '_tween').mockImplementation((d, s, onFrame, onDone) => {
      onFrame(0)
      frames.push({ onFrame, onDone })
    })
    await chart.updateSeries(picked)
    // frame 0: a part on every non-null datum, on its whole's exact shape,
    // with the whole under it at 0 and keeping its own stroke
    const ws = wholes(chart)
    const ps = parts(chart)
    expect(ps.length).toBe(5)
    for (const p of ps) {
      const w = ws.find(
        (n) =>
          n.getAttribute('index') === p.getAttribute('index') &&
          n.getAttribute('j') === p.getAttribute('j'),
      )
      expect(p.getAttribute('pathFrom')).toBe(w.getAttribute('pathFrom'))
      expect(w.getAttribute('fill-opacity')).toBe('0')
      expect(w.getAttribute('stroke-opacity')).not.toBe('0')
    }
    // the datum with no part fades from the plain chart
    const lone = ws.find(
      (n) => n.getAttribute('index') === '0' && n.getAttribute('j') === '2',
    )
    expect(lone.getAttribute('fill-opacity')).toBe('1')
    // landed: every whole at the tint with its outline
    for (const f of frames) f.onFrame(1)
    for (const w of ws) expect(w.getAttribute('fill-opacity')).toBe('0.2')
    chart.destroy()
  })

  test('a clear lands each part on its whole at 0, then shows the plain chart', async () => {
    const chart = animated(column({ series: picked }))
    const hf = chart.highlightFilter
    const frames = []
    vi.spyOn(hf, '_tween').mockImplementation((d, s, onFrame, onDone) => {
      onFrame(0)
      frames.push({ onFrame, onDone })
    })
    await chart.updateSeries(plain)
    expect(parts(chart).length).toBe(5)
    // one frame short of landing: the parts sit on their wholes, which have
    // all but gone under them
    for (const f of frames) f.onFrame(1)
    const ws = wholes(chart)
    const covered = ws.filter((n) => n.getAttribute('fill-opacity') === '0')
    expect(covered.length).toBe(5)
    // landing: the parts leave and the wholes are plain on the same frame
    for (const f of frames) f.onDone && f.onDone()
    expect(parts(chart).length).toBe(0)
    for (const w of ws) expect(w.getAttribute('fill-opacity')).toBe('1')
    chart.destroy()
  })

  test('each family keys its records under its own prefix', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      series: [{ name: 'A', data: [10, 20], highlightData: [5, 5] }],
      xaxis: { categories: ['line', 'area'] },
    })
    chart.series.capturePreviousPaths()
    const keys = [...chart.w.globals.prevHighlightParts.keys()]
    expect(keys.length).toBe(2)
    for (const k of keys) expect(k.startsWith('b:0::')).toBe(true)
  })

  test('running part sums: per key in series order, signs kept apart when split', () => {
    const chart = column()
    const hf = chart.highlightFilter
    const parts = [
      [3, null, 4],
      [-2, 5, 1],
      [4, -1, null],
    ]
    expect(hf._runningExt(parts, null)).toBe(parts)
    const byJ = (i, j) => String(j)
    expect(hf._runningExt(parts, byJ)).toEqual([
      [3, null, 4],
      [1, 5, 5],
      [5, 4, null],
    ])
    expect(hf._runningExt(parts, byJ, true)).toEqual([
      [3, null, 4],
      [-2, 5, 5],
      [7, -1, null],
    ])
  })
})

describe('scope', () => {
  test('a stacked chart draws its parts; a combo warns once and draws without', () => {
    expect(
      column({ chart: { stacked: true } }).highlightFilter.isActive(),
    ).toBe(true)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = column({
      chart: { stacked: true },
      series: [
        {
          name: 'A',
          type: 'column',
          data: [1, 2, 3],
          highlightData: [1, 1, 1],
        },
        { name: 'B', type: 'line', data: [3, 2, 1] },
      ],
    })
    expect(chart.highlightFilter.isActive()).toBe(false)
    expect(parts(chart).length).toBe(0)
    const ours = warn.mock.calls.filter((c) =>
      String(c[0]).includes('highlightFilter'),
    )
    expect(ours.length).toBe(1)
  })

  test('premium usage is flagged only while parts are drawn', async () => {
    const chart = column()
    expect(premiumFeaturesInUse(chart.w, chart)).toContain('highlight-filter')
    await chart.highlightFilter.clear()
    expect(premiumFeaturesInUse(chart.w, chart)).not.toContain(
      'highlight-filter',
    )
  })
})
