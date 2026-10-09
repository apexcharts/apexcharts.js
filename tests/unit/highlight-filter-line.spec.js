import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'
import '../../src/features/renderer-canvas.js'
import Line from '../../src/charts/Line.js'

// Line, spline, step line, area and stacked area: the whole is dashed (a
// line) or faded with its outline kept (an area), and the part is built by the
// renderer's own path builder from the part row, solid in front. These pin the
// part against the renderer's wholes where the two rows are equal, the dry run
// leaving nothing behind, the looks at rest, the axis, the labels and the
// stacked part stack.

const CATS = ['a', 'b', 'c', 'd', 'e']

function chart(extra = {}) {
  return createChartWithOptions({
    chart: { type: 'line', width: 600, height: 300, ...(extra.chart || {}) },
    series: extra.series || [
      { name: 'A', data: [12, 18, 9, 22, 15], highlightData: [6, 9, 3, 10, 7] },
      { name: 'B', data: [5, 9, 14, 8, 11], highlightData: [2, 4, null, 3, 5] },
    ],
    xaxis: { categories: CATS, ...(extra.xaxis || {}) },
    dataLabels: { enabled: false },
    ...(extra.options || {}),
  })
}

const q = (c, sel) => [...c.w.dom.baseEl.querySelectorAll(sel)]
const parts = (c) => q(c, '.apexcharts-line-highlight-part')
/** The whole's own marks of a series, by class, in drawing order. */
const wholes = (c, cls) =>
  q(c, `.apexcharts-series > .apexcharts-${cls}`).filter(
    (n) => !n.classList.contains('apexcharts-highlight-part'),
  )
const partsOf = (c, ri) =>
  parts(c).filter((n) => n.getAttribute('index') === String(ri))
const wholeOf = (c, ri, cls) =>
  wholes(c, cls).filter((n) => n.getAttribute('index') === String(ri))

/** Every coordinate pair in a path `d`, in order. */
function points(d) {
  const nums = String(d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []
  const out = []
  for (let k = 0; k + 1 < nums.length; k += 2) {
    out.push([parseFloat(nums[k]), parseFloat(nums[k + 1])])
  }
  return out
}
/** Two paths with the same commands at the same coordinates (0.01 px). */
function samePath(a, b) {
  expect(String(a).replace(/[-\d.e]+/g, '#')).toBe(
    String(b).replace(/[-\d.e]+/g, '#'),
  )
  const pb = points(b)
  points(a).forEach((p, k) => {
    expect(Math.abs(p[0] - pb[k][0])).toBeLessThan(0.01)
    expect(Math.abs(p[1] - pb[k][1])).toBeLessThan(0.01)
  })
}

const mirror = (rows) =>
  rows.map((data, i) => ({ name: 'S' + i, data, highlightData: data }))

afterEach(() => vi.restoreAllMocks())

describe('the part is the renderer', () => {
  const rows = [
    [12, 18, 9, 22, 15],
    [5, null, 14, 8, 11],
  ]
  for (const type of ['line', 'area']) {
    for (const curve of [
      'straight',
      'smooth',
      'monotoneCubic',
      'stepline',
      'linestep',
    ]) {
      test(`${type} ${curve}: a part equal to its whole is drawn on its path`, () => {
        const c = chart({
          chart: { type },
          series: mirror(rows),
          options: { stroke: { curve } },
        })
        for (const ri of [0, 1]) {
          const ps = partsOf(c, ri)
          const own = [
            ...(type === 'area' ? wholeOf(c, ri, 'area').slice(0, 1) : []),
            ...wholeOf(c, ri, type).filter(
              (n) => n.getAttribute('fill') === 'none',
            ),
          ]
          expect(ps.length).toBe(type === 'area' ? 2 : 1)
          ps.forEach((p, k) =>
            samePath(p.getAttribute('pathTo'), own[k].getAttribute('pathTo')),
          )
        }
        c.destroy()
      })
    }
  }
})

describe('more of the renderer', () => {
  test('datetime x, nulls in both rows, a reversed and a log axis', () => {
    const dt = [
      [1e12, 3],
      [1e12 + 864e5, null],
      [1e12 + 3 * 864e5, 4],
      [1e12 + 4 * 864e5, 8],
    ]
    const cases = [
      {
        xaxis: { type: 'datetime' },
        series: [{ name: 'D', data: dt, highlightData: [3, null, 4, 8] }],
      },
      {
        options: { yaxis: { reversed: true } },
        series: mirror([[4, 9, null, 3, 6]]),
      },
      {
        options: { yaxis: { logarithmic: true } },
        series: mirror([[4, 90, 12, 300, 6]]),
      },
    ]
    for (const type of ['line', 'area']) {
      for (const k of cases) {
        const c = chart({
          chart: { type },
          xaxis: k.xaxis,
          series: k.series,
          options: k.options,
        })
        const ps = partsOf(c, 0)
        const own = [
          ...(type === 'area' ? wholeOf(c, 0, 'area').slice(0, 1) : []),
          ...wholeOf(c, 0, type).filter(
            (n) => n.getAttribute('fill') === 'none',
          ),
        ]
        ps.forEach((p, n) =>
          samePath(p.getAttribute('pathTo'), own[n].getAttribute('pathTo')),
        )
        c.destroy()
      }
    }
  })

  test('a part below its whole sits between the whole and the baseline', () => {
    const c = chart({
      series: [{ name: 'A', data: [10, 20, 30], highlightData: [5, 10, 15] }],
      options: { yaxis: { min: 0 } },
    })
    const whole = points(wholeOf(c, 0, 'line')[0].getAttribute('pathTo'))
    const part = points(partsOf(c, 0)[0].getAttribute('pathTo'))
    const zeroY = c.w.layout.gridHeight
    part.forEach(([x, y], k) => {
      expect(x).toBeCloseTo(whole[k][0], 6)
      // half the value: half way from the baseline to the whole
      expect(zeroY - y).toBeCloseTo((zeroY - whole[k][1]) / 2, 1)
    })
    c.destroy()
  })

  test('the dry run leaves nothing behind', () => {
    for (const opts of [
      // the fast straight path (no markers, no labels)
      {},
      // the per-point loop, with markers and labels
      { markers: { size: 4 }, dataLabels: { enabled: true } },
    ]) {
      const series = [
        { name: 'A', data: [12, 18, 9, 22, 15] },
        { name: 'B', data: [5, 9, 14, 8, 11] },
      ]
      const plain = chart({ series, options: opts })
      const read = (c) => ({
        points: c.w.globals.pointsArray.map((r) => r.length),
        xs: JSON.stringify(c.w.globals.seriesXvalues),
        ys: JSON.stringify(c.w.globals.seriesYvalues),
        markers: q(c, '.apexcharts-marker').length,
        wholes: wholes(c, 'line').map((n) => n.getAttribute('pathTo')),
      })
      const before = read(plain)
      plain.destroy()
      const spy = vi.spyOn(Line.prototype, '_buildSeriesPaths')
      const picked = chart({
        series: series.map((s) => ({
          ...s,
          highlightData: s.data.map((v) => v / 2),
        })),
        // the parts reach below the wholes: keep the axis the wholes set
        options: { ...opts, highlightFilter: { axis: 'clamp' } },
      })
      expect(spy.mock.calls.length).toBe(4)
      expect(read(picked)).toEqual(before)
      // the renderer's own per-series state, as the whole left it
      expect(spy.mock.instances[0]._shapeOnly).toBe(false)
      expect(spy.mock.instances[0].appendPathFrom).toBe(true)
      picked.destroy()
      spy.mockRestore()
    }
  })

  test('a flat part under a gradient keeps a box with height', () => {
    const c = chart({
      chart: { type: 'area' },
      series: [{ name: 'F', data: [5, 9, 7, 8], highlightData: [3, 3, 3, 3] }],
      options: { fill: { type: 'gradient' } },
    })
    const ys = points(partsOf(c, 0)[1].getAttribute('pathTo')).map((p) => p[1])
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0)
    c.destroy()
  })
})

describe('looks at rest', () => {
  test('a line whole is dashed at full strength; the part is solid, nested, inert', () => {
    const c = chart()
    for (const w of wholes(c, 'line')) {
      expect(w.getAttribute('stroke-dasharray')).toBe('4')
      expect(w.getAttribute('stroke-opacity')).toBe('1')
    }
    for (const p of parts(c)) {
      expect(p.classList.contains('apexcharts-highlight-part')).toBe(true)
      expect(p.classList.contains('apexcharts-series')).toBe(false)
      expect(p.getAttribute('pointer-events')).toBe('none')
      expect(p.getAttribute('stroke-dasharray')).not.toBe('4')
      expect(p.parentNode.classList.contains('apexcharts-line-highlight')).toBe(
        true,
      )
      expect(p.getAttribute('stroke')).toBe(
        wholeOf(c, p.getAttribute('index'), 'line')[0].getAttribute('stroke'),
      )
    }
    c.destroy()
  })

  test('line.dashArray sets the dash; a dash the user set stays on the part', () => {
    const c = chart({
      options: {
        highlightFilter: { line: { dashArray: 7 } },
        stroke: { dashArray: [0, 3] },
      },
    })
    for (const w of wholes(c, 'line')) {
      expect(w.getAttribute('stroke-dasharray')).toBe('7')
    }
    expect(partsOf(c, 1)[0].getAttribute('stroke-dasharray')).toBe('3')
    c.destroy()
  })

  test('an area whole fades its fill and keeps its stroke as the outline', () => {
    const c = chart({
      chart: { type: 'area' },
      options: { stroke: { width: 3 } },
    })
    const fills = wholes(c, 'area').filter(
      (n) => n.getAttribute('fill') !== 'none',
    )
    const strokes = wholes(c, 'area').filter(
      (n) => n.getAttribute('fill') === 'none',
    )
    expect(fills.length).toBe(2)
    expect(strokes.length).toBe(2)
    for (const f of fills) expect(f.getAttribute('fill-opacity')).toBe('0.2')
    for (const s of strokes) {
      expect(s.getAttribute('stroke-width')).toBe('1')
      expect(s.getAttribute('stroke-opacity')).toBe('1')
    }
    // the part: a fill with the whole's paint, then its own stroke
    const [pf, ps] = partsOf(c, 0)
    expect(pf.getAttribute('fill')).toBe(fills[0].getAttribute('fill'))
    expect(pf.getAttribute('stroke')).toBe('none')
    expect(ps.getAttribute('fill')).toBe('none')
    expect(ps.getAttribute('stroke-width')).toBe('3')
    c.destroy()
  })

  test('a capture records only the wholes as the series paths', () => {
    const c = chart({ chart: { type: 'area' } })
    c.series.capturePreviousPaths()
    const pp = c.w.globals.previousPaths.filter((p) => p.type === 'area')
    expect(pp.length).toBe(2)
    for (const p of pp) {
      expect(p.paths.length).toBe(2)
      const ri = p.realIndex
      const [fill, stroke] = wholeOf(c, ri, 'area')
      expect(p.paths[0].d).toBe(fill.getAttribute('pathTo'))
      expect(p.paths[1].d).toBe(stroke.getAttribute('pathTo'))
    }
    const keys = [...c.w.globals.prevHighlightParts.keys()]
    expect(keys.sort()).toEqual(['l:0', 'l:1'])
    c.destroy()
  })
})

describe('value axis', () => {
  test('a part past every whole raises the axis, one below lowers it', () => {
    const up = chart({
      series: [{ name: 'A', data: [10, 20, 30], highlightData: [10, 50, 30] }],
    })
    expect(up.w.globals.maxY).toBeGreaterThanOrEqual(50)
    up.destroy()
    const down = chart({
      series: [{ name: 'A', data: [10, 20, 30], highlightData: [-8, 5, 3] }],
    })
    expect(down.w.globals.minY).toBeLessThanOrEqual(-8)
    down.destroy()
    const clamp = chart({
      series: [{ name: 'A', data: [10, 20, 30], highlightData: [10, 50, 30] }],
      options: { highlightFilter: { axis: 'clamp' } },
    })
    expect(clamp.w.globals.maxY).toBeLessThan(50)
    clamp.destroy()
  })

  test('a stacked area part stack above the whole stack raises the axis', () => {
    const c = chart({
      chart: { type: 'area', stacked: true },
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [30, 5, 5] },
        { name: 'B', data: [10, 10, 10], highlightData: [30, 5, null] },
      ],
    })
    expect(c.w.globals.maxY).toBeGreaterThanOrEqual(60)
    c.destroy()
  })
})

describe('stacked area', () => {
  const series = [
    { name: 'A', data: [10, 20, 15, 30], highlightData: [4, 6, 5, 10] },
    { name: 'B', data: [8, 6, 12, 10], highlightData: [2, null, 6, 1] },
    { name: 'C', data: [5, 9, 7, 11], highlightData: [3, 3, 3, 3] },
  ]

  test('each part stands on the parts below it, the wholes on the wholes', () => {
    const c = chart({
      chart: { type: 'area', stacked: true },
      series,
      options: { stroke: { curve: 'straight' } },
    })
    const yRatio = c.w.globals.yRange[0] / c.w.layout.gridHeight
    const zero = c.w.layout.gridHeight
    const top = (ri) =>
      points(partsOf(c, ri)[1].getAttribute('pathTo')).map((p) => p[1])
    // C's part top at each x: the running part sum (a null part adds nothing)
    const sums = [9, 9, 14, 14]
    top(2).forEach((y, k) => expect(y).toBeCloseTo(zero - sums[k] / yRatio, 1))
    // the whole stack is the renderer's, as drawn without a pick
    const wholesNow = wholes(c, 'area').map((n) => n.getAttribute('pathTo'))
    c.destroy()
    const plain = chart({
      chart: { type: 'area', stacked: true },
      series: series.map(({ highlightData: _h, ...s }) => s),
      options: { stroke: { curve: 'straight' } },
    })
    expect(wholes(plain, 'area').map((n) => n.getAttribute('pathTo'))).toEqual(
      wholesNow,
    )
    plain.destroy()
  })

  test('parts stack by x on ragged datetime series (#4886)', () => {
    const d = (k) => 1e12 + k * 864e5
    const c = chart({
      chart: { type: 'area', stacked: true },
      xaxis: { type: 'datetime' },
      series: [
        {
          name: 'A',
          data: [
            [d(0), 10],
            [d(1), 10],
            [d(3), 10],
          ],
          highlightData: [5, 5, 5],
        },
        {
          name: 'B',
          data: [
            [d(0), 4],
            [d(2), 4],
            [d(3), 4],
          ],
          highlightData: [2, 2, 2],
        },
      ],
      options: { stroke: { curve: 'straight' } },
    })
    const yRatio = c.w.globals.yRange[0] / c.w.layout.gridHeight
    const zero = c.w.layout.gridHeight
    const tops = points(partsOf(c, 1)[1].getAttribute('pathTo')).map(
      (p) => p[1],
    )
    // B at d0 and d3 stands on A's 5; at d2, where A has no point, on nothing
    expect(tops[0]).toBeCloseTo(zero - 7 / yRatio, 1)
    expect(tops[1]).toBeCloseTo(zero - 2 / yRatio, 1)
    expect(tops[2]).toBeCloseTo(zero - 7 / yRatio, 1)
    c.destroy()
  })
})

describe('labels', () => {
  const opts = { dataLabels: { enabled: true } }
  const texts = (c, ri) =>
    q(c, '.apexcharts-datalabels')
      .filter((g) => g.getAttribute('data:realIndex') === String(ri))
      .flatMap((g) => [...g.querySelectorAll('.apexcharts-datalabel')])

  test('labels state the part at its point; a null part keeps none', () => {
    const c = chart({ options: opts })
    expect(texts(c, 0).map((t) => t.textContent)).toEqual([
      '6',
      '9',
      '3',
      '10',
      '7',
    ])
    expect(texts(c, 1).map((t) => t.textContent)).toEqual(['2', '4', '3', '5'])
    const part = points(partsOf(c, 0)[0].getAttribute('pathTo'))
    texts(c, 0).forEach((t, k) => {
      expect(parseFloat(t.getAttribute('cx'))).toBeCloseTo(part[k][0], 1)
    })
    // the overlap test sees what was drawn: the parts
    expect(c.w.globals.lastDrawnDataLabelsIndexes[1]).toEqual([0, 1, 3, 4])
    c.destroy()
  })

  test("value: 'whole' keeps the renderer's labels", () => {
    const c = chart({
      options: { ...opts, highlightFilter: { dataLabels: { value: 'whole' } } },
    })
    expect(texts(c, 0).map((t) => t.textContent)).toEqual([
      '12',
      '18',
      '9',
      '22',
      '15',
    ])
    c.destroy()
  })

  test('a stacked part label sits on the part stack and states the part', () => {
    const c = chart({
      chart: { type: 'area', stacked: true },
      series: [
        { name: 'A', data: [10, 20], highlightData: [4, 6] },
        { name: 'B', data: [8, 6], highlightData: [2, 1] },
      ],
      xaxis: { categories: ['a', 'b'] },
      options: opts,
    })
    expect(texts(c, 1).map((t) => t.textContent)).toEqual(['2', '1'])
    c.destroy()
  })
})

describe('frames', () => {
  const plain = [
    { name: 'A', data: [12, 18, 9, 22, 15] },
    { name: 'B', data: [5, 9, 14, 8, 11] },
  ]
  const picked = [
    { name: 'A', data: [12, 18, 9, 22, 15], highlightData: [6, 9, 3, 10, 7] },
    { name: 'B', data: [5, 9, 14, 8, 11], highlightData: [2, 4, null, 3, 5] },
  ]
  const animated = (c) => {
    c.w.config.chart.animations.enabled = true
    return c
  }
  const hold = (hf) => {
    const frames = []
    vi.spyOn(hf, '_tween').mockImplementation((d, s, onFrame, onDone) => {
      onFrame(0)
      frames.push({ onFrame, onDone })
    })
    return frames
  }

  for (const type of ['line', 'area']) {
    test(`${type}: a first pick starts each part as its whole, which is hidden under it`, async () => {
      const c = animated(chart({ chart: { type }, series: plain }))
      const frames = hold(c.highlightFilter)
      await c.updateSeries(picked)
      for (const ri of [0, 1]) {
        const ps = partsOf(c, ri)
        const own = wholeOf(c, ri, type)
        ps.forEach((p, k) =>
          expect(p.getAttribute('pathFrom')).toBe(
            own[k].getAttribute('pathFrom'),
          ),
        )
        for (const w of own) {
          const fill = w.getAttribute('fill') !== 'none'
          expect(w.getAttribute(fill ? 'fill-opacity' : 'stroke-opacity')).toBe(
            '0',
          )
        }
      }
      for (const f of frames) f.onFrame(1)
      const w0 = wholeOf(c, 0, type)
      if (type === 'line')
        expect(w0[0].getAttribute('stroke-dasharray')).toBe('4')
      else expect(w0[0].getAttribute('fill-opacity')).toBe('0.2')
      c.destroy()
    })

    test(`${type}: a clear lands each part on its whole, then leaves the plain chart`, async () => {
      const c = animated(chart({ chart: { type }, series: plain }))
      const fresh = wholes(c, type).map((n) =>
        [
          'fill-opacity',
          'stroke-opacity',
          'stroke-width',
          'stroke-dasharray',
        ].map((a) => n.getAttribute(a)),
      )
      c.w.config.chart.animations.enabled = false
      await c.updateSeries(picked)
      c.w.config.chart.animations.enabled = true
      const frames = hold(c.highlightFilter)
      await c.updateSeries(plain)
      expect(parts(c).length).toBe(type === 'area' ? 4 : 2)
      for (const ri of [0, 1]) {
        const own = wholeOf(c, ri, type)
        partsOf(c, ri).forEach((p, k) =>
          expect(p.getAttribute('pathTo')).toBe(own[k].getAttribute('pathTo')),
        )
      }
      for (const f of frames) f.onFrame(1)
      for (const w of wholes(c, type)) {
        const fill = w.getAttribute('fill') !== 'none'
        expect(w.getAttribute(fill ? 'fill-opacity' : 'stroke-opacity')).toBe(
          '0',
        )
      }
      for (const f of frames) f.onDone && f.onDone()
      expect(parts(c).length).toBe(0)
      expect(
        wholes(c, type).map((n) =>
          [
            'fill-opacity',
            'stroke-opacity',
            'stroke-width',
            'stroke-dasharray',
          ].map((a) => n.getAttribute(a)),
        ),
      ).toEqual(fresh)
      c.destroy()
    })
  }

  test('forecast: the part is cut where its whole is, dashed past it, and leaves with it', async () => {
    const c = animated(
      chart({
        series: picked,
        options: {
          forecastDataPoints: { count: 2, dashArray: 6, strokeWidth: 3 },
        },
      }),
    )
    for (const ri of [0, 1]) {
      const main = wholeOf(c, ri, 'line').find((n) =>
        /nonForecastMask/.test(n.getAttribute('clip-path')),
      )
      const [p, f, ...rest] = partsOf(c, ri)
      expect(rest.length).toBe(0)
      expect(p.getAttribute('clip-path')).toBe(main.getAttribute('clip-path'))
      expect(f.getAttribute('clip-path')).toMatch(/url\(#forecastMask/)
      expect(f.getAttribute('stroke-dasharray')).toBe('6')
      expect(f.getAttribute('stroke-width')).toBe('3')
      expect(f.getAttribute('pathTo')).toBe(p.getAttribute('pathTo'))
    }
    const frames = hold(c.highlightFilter)
    await c.updateSeries(plain)
    for (const f of frames) {
      f.onFrame(1)
      f.onDone && f.onDone()
    }
    expect(parts(c).length).toBe(0)
    c.destroy()
  })

  test("forecast: an area's dashed stroke copy takes the outline and gets its own look back", async () => {
    const opts = {
      forecastDataPoints: { count: 2, dashArray: 6, strokeWidth: 3 },
    }
    const copies = (c) =>
      wholes(c, 'area').filter((n) =>
        /#forecastMask/.test(n.getAttribute('clip-path') || ''),
      )
    const plainChart = chart({
      chart: { type: 'area' },
      series: plain,
      options: opts,
    })
    const own = copies(plainChart).map((n) => [
      n.getAttribute('stroke-width'),
      n.getAttribute('stroke-dasharray'),
      n.getAttribute('stroke-opacity'),
    ])
    expect(own.length).toBe(2)
    plainChart.destroy()

    const c = animated(
      chart({ chart: { type: 'area' }, series: plain, options: opts }),
    )
    const frames = hold(c.highlightFilter)
    await c.updateSeries(picked)
    // frame 0 of a first pick: hidden under the part's own copy, as the
    // whole's main stroke is
    for (const n of copies(c))
      expect(n.getAttribute('stroke-opacity')).toBe('0')
    for (const f of frames) f.onFrame(1)
    for (const n of copies(c)) {
      expect(n.getAttribute('stroke-width')).toBe('1')
      expect(n.getAttribute('stroke-opacity')).toBe('1')
      expect(n.getAttribute('stroke-dasharray')).toBe('6')
    }
    c.w.config.chart.animations.enabled = false
    await c.updateSeries(plain)
    expect(
      copies(c).map((n) => [
        n.getAttribute('stroke-width'),
        n.getAttribute('stroke-dasharray'),
        n.getAttribute('stroke-opacity'),
      ]),
    ).toEqual(own)
    c.destroy()
  })

  test('a re-pick moves each part on from where it was, the whole stays as it is', async () => {
    const c = animated(chart({ series: picked }))
    const before = partsOf(c, 0)[0].getAttribute('pathTo')
    hold(c.highlightFilter)
    await c.updateSeries(
      picked.map((s) => ({ ...s, highlightData: s.data.map((v) => v - 1) })),
    )
    expect(partsOf(c, 0)[0].getAttribute('pathFrom')).toBe(before)
    expect(wholeOf(c, 0, 'line')[0].getAttribute('stroke-dasharray')).toBe('4')
    c.destroy()
  })

  test("enter: 'baseline' rises from the baseline as the dash opens", async () => {
    const c = animated(
      chart({
        series: plain,
        options: { highlightFilter: { enter: 'baseline' } },
      }),
    )
    const frames = hold(c.highlightFilter)
    await c.updateSeries(picked)
    const from = points(partsOf(c, 0)[0].getAttribute('pathFrom'))
    for (const [, y] of from) expect(y).toBeCloseTo(c.w.layout.gridHeight, 1)
    const w0 = wholeOf(c, 0, 'line')[0]
    expect(w0.getAttribute('stroke-opacity')).not.toBe('0')
    for (const f of frames) f.onFrame(0.5)
    expect(w0.getAttribute('stroke-dasharray')).toBe('4 2')
    c.destroy()
  })

  test('a series losing its part under the pick drains it to the baseline', async () => {
    const c = animated(chart({ series: picked }))
    const frames = hold(c.highlightFilter)
    await c.updateSeries(
      picked.map((s, i) =>
        i ? { ...s, highlightData: s.data.map(() => null) } : s,
      ),
    )
    const p = partsOf(c, 1)
    expect(p.length).toBe(1)
    for (const [, y] of points(p[0].getAttribute('pathTo')))
      expect(y).toBeCloseTo(c.w.layout.gridHeight, 1)
    for (const f of frames) f.onFrame(1)
    for (const f of frames) f.onDone && f.onDone()
    expect(partsOf(c, 1).length).toBe(0)
    expect(wholeOf(c, 1, 'line')[0].getAttribute('stroke-dasharray')).toBe('4')
    c.destroy()
  })

  test('in a stack, a part that leaves drains onto the part stack below it', async () => {
    const rows = [
      { name: 'A', data: [10, 20, 15], highlightData: [4, 6, 5] },
      { name: 'B', data: [8, 6, 12], highlightData: [2, 3, 6] },
    ]
    const c = animated(
      chart({
        chart: { type: 'area', stacked: true },
        series: rows,
        xaxis: { categories: ['a', 'b', 'c'] },
        options: { stroke: { curve: 'straight' } },
      }),
    )
    const aTop = points(partsOf(c, 0)[1].getAttribute('pathTo'))
    hold(c.highlightFilter)
    await c.updateSeries([
      rows[0],
      { ...rows[1], highlightData: [null, null, null] },
    ])
    const leaving = points(partsOf(c, 1)[1].getAttribute('pathTo'))
    leaving.forEach(([x, y], k) => {
      expect(x).toBeCloseTo(aTop[k][0], 6)
      expect(y).toBeCloseTo(aTop[k][1], 6)
    })
    c.destroy()
  })

  test("a stacked enter: 'baseline' rises from the part stack below, not its own top", async () => {
    const rows = [
      { name: 'A', data: [10, 20, 15] },
      { name: 'B', data: [8, 6, 12] },
    ]
    const c = animated(
      chart({
        chart: { type: 'area', stacked: true },
        series: rows,
        xaxis: { categories: ['a', 'b', 'c'] },
        options: {
          stroke: { curve: 'straight' },
          highlightFilter: { enter: 'baseline' },
        },
      }),
    )
    hold(c.highlightFilter)
    await c.updateSeries([
      { ...rows[0], highlightData: [4, 6, 5] },
      { ...rows[1], highlightData: [2, 3, 6] },
    ])
    const aTop = points(partsOf(c, 0)[1].getAttribute('pathTo'))
    const bFrom = points(partsOf(c, 1)[1].getAttribute('pathFrom'))
    bFrom.forEach(([, y], k) => expect(y).toBeCloseTo(aTop[k][1], 6))
    c.destroy()
  })

  test('hiding a highlighted series flattens its part with it', async () => {
    const c = animated(chart({ series: picked }))
    hold(c.highlightFilter)
    c.toggleSeries('B')
    await new Promise((r) => setTimeout(r, 0))
    const whole = wholeOf(c, 1, 'line')[0].getAttribute('pathTo')
    const p = partsOf(c, 1)
    expect(p.length).toBe(1)
    expect(p[0].getAttribute('pathTo')).toBe(whole)
    c.destroy()
  })
})

describe('renderers and scope', () => {
  test('canvas: the part is recorded after its whole, the whole dashed with a number', () => {
    const c = chart({ chart: { renderer: 'canvas' } })
    expect(c.ctx.renderer.kind).toBe('canvas')
    const list = c.ctx.renderer._g.displayList().filter((d) => d.tag === 'path')
    const dashed = list.filter((d) => d.strokeDash === '4')
    expect(dashed.length).toBe(2)
    expect(list.length).toBe(4)
    // the fast path hands the part its numeric coordinates
    const part = list[1]
    expect(part.nxs && part.nxs.length).toBe(5)
    expect(c.highlightFilter._live.size).toBe(0)
    c.destroy()
  })

  test('a canvas pick paints the landed look, with no tween left running', async () => {
    const c = chart({
      chart: { type: 'area', renderer: 'canvas' },
      series: [
        { name: 'A', data: [12, 18, 9, 22, 15] },
        { name: 'B', data: [5, 9, 14, 8, 11] },
      ],
      // (the canvas declines gradient fills)
      options: { fill: { type: 'solid' } },
    })
    expect(c.ctx.renderer.kind).toBe('canvas')
    c.w.config.chart.animations.enabled = true
    await c.updateSeries([
      { name: 'A', data: [12, 18, 9, 22, 15], highlightData: [6, 9, 3, 10, 7] },
      { name: 'B', data: [5, 9, 14, 8, 11], highlightData: [2, 4, 1, 3, 5] },
    ])
    expect(c.highlightFilter._live.size).toBe(0)
    const list = c.ctx.renderer._g.displayList().filter((d) => d.tag === 'path')
    const faded = list.filter((d) => Number(d.fillOpacity) === 0.2)
    expect(faded.length).toBe(2)
    c.destroy()
  })

  test('streaming with highlightData warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = chart({ chart: { streaming: { enabled: true } } })
    const ours = warn.mock.calls.filter((m) =>
      String(m[0]).includes('chart.streaming'),
    )
    expect(ours.length).toBe(1)
    c.destroy()
  })

  test('a range area and a combo warn once and draw no parts', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = chart({
      series: [
        {
          name: 'C',
          type: 'column',
          data: [3, 4, 5],
          highlightData: [1, 1, 1],
        },
        { name: 'L', type: 'line', data: [5, 2, 4], highlightData: [1, 1, 1] },
      ],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    expect(c.highlightFilter.isActive()).toBe(false)
    expect(q(c, '.apexcharts-highlight-part').length).toBe(0)
    expect(
      warn.mock.calls.filter((m) => String(m[0]).includes('highlightFilter'))
        .length,
    ).toBe(1)
    c.destroy()
  })
})
