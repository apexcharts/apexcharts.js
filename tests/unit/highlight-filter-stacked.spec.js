import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'
import '../../src/features/renderer-canvas.js'
import BarStacked from '../../src/charts/BarStacked.js'
import Bar from '../../src/charts/Bar.js'

// Stacked column and bar: the parts form their own diverging stack in each
// series group, solid over the faded whole stack, from the same baseline. These
// pin the geometry (against the renderer's own wholes where the parts equal
// them), the corners and mirrors, the axis, the labels and the totals.

const CATS = ['a', 'b', 'c']

function stacked(extra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'bar',
      width: 600,
      height: 360,
      stacked: true,
      ...(extra.chart || {}),
    },
    series: extra.series,
    xaxis: { categories: CATS, ...(extra.xaxis || {}) },
    dataLabels: { enabled: false },
    ...(extra.options || {}),
  })
}

const at = (n) => n.getAttribute('index') + '|' + n.getAttribute('j')
const partsOf = (chart) =>
  new Map(
    [
      ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-bar-highlight-part'),
    ].map((n) => [at(n), n]),
  )
const wholesOf = (chart) =>
  new Map(
    [
      ...chart.w.dom.baseEl.querySelectorAll(
        '.apexcharts-series > .apexcharts-bar-area',
      ),
    ].map((n) => [at(n), n]),
  )

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
/** Two paths with the same commands at the same coordinates (0.01 px). */
function samePath(a, b) {
  const pa = points(a)
  const pb = points(b)
  expect(String(a).replace(/[-\d.e]+/g, '#')).toBe(
    String(b).replace(/[-\d.e]+/g, '#'),
  )
  pa.forEach((p, k) => {
    expect(Math.abs(p[0] - pb[k][0])).toBeLessThan(0.01)
    expect(Math.abs(p[1] - pb[k][1])).toBeLessThan(0.01)
  })
}
const flipOf = (n) =>
  n.classList.contains('apexcharts-flip-y') ||
  n.classList.contains('apexcharts-flip-x')

const mirror = (rows) =>
  rows.map((data, i) => ({ name: 'S' + i, data, highlightData: data }))

afterEach(() => vi.restoreAllMocks())

describe('stacked: identity with the renderer', () => {
  const ROWS = [
    [10, -6, 8],
    [6, 7, -3],
    [-4, 5, 9],
    [3, -2, 4],
  ]
  const cases = [
    ['column', {}],
    ['bar', { plotOptions: { bar: { horizontal: true } } }],
    [
      'column, borderRadius all',
      { plotOptions: { bar: { borderRadiusWhenStacked: 'all' } } },
    ],
    ['reversed column', { yaxis: { reversed: true } }],
  ]
  test.each(cases)(
    '%s: a part equal to its whole is drawn on its whole, mirror included',
    (_n, options, chart = {}) => {
      const c = stacked({
        chart,
        series: mirror(ROWS),
        options: {
          ...options,
          plotOptions: {
            bar: {
              borderRadius: 10,
              borderRadiusApplication: 'end',
              ...(options.plotOptions?.bar || {}),
            },
          },
        },
      })
      expect(c.highlightFilter.isActive()).toBe(true)
      const parts = partsOf(c)
      const wholes = wholesOf(c)
      expect(parts.size).toBe(12)
      for (const [k, p] of parts) {
        const w = wholes.get(k)
        samePath(p.getAttribute('pathTo'), w.getAttribute('pathTo'))
        expect(flipOf(p)).toBe(flipOf(w))
      }
    },
  )

  test.each([
    ['column', {}],
    ['bar', { horizontal: true }],
  ])('100% %s: a part equal to its whole is drawn on its whole', (_n, bar) => {
    const c = stacked({
      chart: { stackType: '100%' },
      series: mirror([
        [10, 6, 8],
        [6, 7, 3],
        [4, 5, 9],
      ]),
      options: { plotOptions: { bar: { borderRadius: 10, ...bar } } },
    })
    const parts = partsOf(c)
    const wholes = wholesOf(c)
    expect(parts.size).toBe(9)
    for (const [k, p] of parts) {
      samePath(p.getAttribute('pathTo'), wholes.get(k).getAttribute('pathTo'))
      expect(flipOf(p)).toBe(flipOf(wholes.get(k)))
    }
  })

  test('series groups: each group stacks its own parts in its own slot', () => {
    const series = [
      { name: 'A', group: 'g1', data: [10, 20, 30] },
      { name: 'B', group: 'g1', data: [5, 5, 5] },
      { name: 'C', group: 'g2', data: [7, 8, 9] },
      { name: 'D', group: 'g2', data: [1, 2, 3] },
    ].map((s) => ({ ...s, highlightData: s.data }))
    const c = stacked({
      series,
      options: { plotOptions: { bar: { borderRadius: 6 } } },
    })
    const parts = partsOf(c)
    const wholes = wholesOf(c)
    expect(parts.size).toBe(12)
    for (const [k, p] of parts) {
      samePath(p.getAttribute('pathTo'), wholes.get(k).getAttribute('pathTo'))
    }
  })

  test('numeric x: a part stack restarts where the renderer restarts', () => {
    const c = stacked({
      xaxis: { type: 'numeric' },
      series: [
        {
          name: 'A',
          data: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
          ],
        },
        {
          name: 'B',
          data: [
            { x: 1, y: 5 },
            { x: 3, y: 6 },
          ],
        },
        {
          name: 'C',
          data: [
            { x: 1, y: 4 },
            { x: 3, y: 2 },
          ],
        },
      ].map((s) => ({ ...s, highlightData: s.data.map((d) => d.y) })),
    })
    const parts = partsOf(c)
    const wholes = wholesOf(c)
    expect(parts.size).toBe(6)
    for (const [k, p] of parts) {
      samePath(p.getAttribute('pathTo'), wholes.get(k).getAttribute('pathTo'))
    }
    // the feature copies the renderer's rule (BarStacked
    // drawStackedColumnPaths): B at index 1 has another x than A, C the same
    // as B
    const hf = c.highlightFilter
    expect(hf._restarts(1, 1)).toBe(true)
    expect(hf._restarts(2, 1)).toBe(false)
    expect(hf._restarts(1, 0)).toBe(false)
  })

  test('a Safari stub rounds no part, as it rounds no whole', async () => {
    const Utils = (await import('../../src/utils/Utils.js')).default
    vi.spyOn(Utils, 'isSafari').mockReturnValue(true)
    const c = stacked({
      series: mirror([
        [10, 6, 8],
        [6, 7, 3],
      ]),
      options: { plotOptions: { bar: { borderRadius: 10 } } },
    })
    for (const p of partsOf(c).values()) {
      expect(p.getAttribute('pathTo')).not.toMatch(/[CQ]/)
    }
  })
})

describe('stacked: the part stack', () => {
  test('a diverging part stack: positives up, negatives down, in series order', () => {
    const c = stacked({
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [3, 3, 3] },
        { name: 'B', data: [6, 6, 6], highlightData: [-2, -2, -2] },
        { name: 'C', data: [8, 8, 8], highlightData: [4, 4, 4] },
      ],
    })
    const parts = partsOf(c)
    const zeroY = span(wholesOf(c).get('0|0').getAttribute('pathTo'), 1)[1]
    const unit =
      (span(parts.get('0|0').getAttribute('pathTo'), 1)[1] -
        span(parts.get('0|0').getAttribute('pathTo'), 1)[0]) /
      3
    const [a0, a1] = span(parts.get('0|0').getAttribute('pathTo'), 1)
    const [b0, b1] = span(parts.get('1|0').getAttribute('pathTo'), 1)
    const [c0, c1] = span(parts.get('2|0').getAttribute('pathTo'), 1)
    // A from 0 to 3, B from 0 to -2 (below the baseline), C from 3 to 7
    expect(a1).toBeCloseTo(zeroY, 1)
    expect(b0).toBeCloseTo(zeroY, 1)
    expect(b1 - b0).toBeCloseTo(2 * unit, 1)
    expect(c1).toBeCloseTo(a0, 1)
    expect(c1 - c0).toBeCloseTo(4 * unit, 1)
  })

  test('a null part moves nothing and draws nothing', () => {
    const c = stacked({
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [3, null, 3] },
        { name: 'B', data: [6, 6, 6], highlightData: [2, 2, 2] },
      ],
    })
    const parts = partsOf(c)
    expect(parts.size).toBe(5)
    const zeroY = span(wholesOf(c).get('0|0').getAttribute('pathTo'), 1)[1]
    // B at index 1 sits on the baseline, A having no part there
    expect(span(parts.get('1|1').getAttribute('pathTo'), 1)[1]).toBeCloseTo(
      zeroY,
      1,
    )
  })

  test('the top of the PART stack takes the cap; a null top hands it down', () => {
    const c = stacked({
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [3, 3, 3] },
        { name: 'B', data: [6, 6, 6], highlightData: [2, null, 2] },
      ],
      options: {
        plotOptions: {
          bar: { borderRadius: 8, borderRadiusWhenStacked: 'last' },
        },
      },
    })
    const parts = partsOf(c)
    const curved = (k) => /C|Q/.test(parts.get(k).getAttribute('pathTo'))
    expect(curved('0|0')).toBe(false)
    expect(curved('1|0')).toBe(true)
    // B has no part at index 1, so A's part tops that stack
    expect(curved('0|1')).toBe(true)
  })

  test("borderRadiusWhenStacked 'all' mirrors the baseline part; a negative part is mirrored too", () => {
    const all = stacked({
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [3, 3, 3] },
        { name: 'B', data: [6, 6, 6], highlightData: [2, 2, 2] },
      ],
      options: {
        plotOptions: {
          bar: { borderRadius: 8, borderRadiusWhenStacked: 'all' },
        },
      },
    })
    expect(flipOf(partsOf(all).get('0|0'))).toBe(true)
    expect(flipOf(partsOf(all).get('1|0'))).toBe(false)
    const neg = stacked({
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [-3, 3, 3] },
        { name: 'B', data: [6, 6, 6], highlightData: [-2, 2, 2] },
      ],
      chart: { type: 'bar' },
      options: {
        plotOptions: { bar: { borderRadius: 8, horizontal: true } },
      },
    })
    // the farthest negative part is rounded at its far (left) end, which the
    // stacked builders draw by mirroring
    const p = partsOf(neg).get('1|0')
    expect(p.classList.contains('apexcharts-flip-x')).toBe(false)
    expect(BarStacked.prototype.cornerFlip('bottom', -2)).toBe(false)
    expect(BarStacked.prototype.cornerFlip('top', -2)).toBe(true)
    expect(BarStacked.prototype.cornerFlip('bottom', 2)).toBe(true)
  })

  test('100%: a part is its share of the category total, capped at 100', () => {
    const c = stacked({
      chart: { stackType: '100%' },
      series: [
        { name: 'A', data: [30, 40, 50], highlightData: [15, 40, 80] },
        { name: 'B', data: [70, 60, 50], highlightData: [35, 60, 40] },
      ],
    })
    const parts = partsOf(c)
    const wholes = wholesOf(c)
    const h = (n) => {
      const [a, b] = span(n.getAttribute('pathTo'), 1)
      return b - a
    }
    const full = h(wholes.get('0|0')) + h(wholes.get('1|0'))
    expect(h(parts.get('0|0')) / full).toBeCloseTo(0.15, 2)
    expect(h(parts.get('1|0')) / full).toBeCloseTo(0.35, 2)
    // 80 + 40 is 120% of 100 at index 2: the second part is capped
    expect(
      parts.get('1|2').classList.contains('apexcharts-highlight-overflow'),
    ).toBe(true)
    expect(
      parts.get('0|2').classList.contains('apexcharts-highlight-overflow'),
    ).toBe(false)
    // no dashed whole edge in a stack
    expect(
      c.w.dom.baseEl.querySelectorAll('.apexcharts-highlight-edge').length,
    ).toBe(0)
    expect(c.w.globals.maxY).toBe(100)
  })
})

describe('stacked: value axis', () => {
  test('a part stack above the whole stack raises the max', () => {
    const c = stacked({
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [30, 3, 3] },
        { name: 'B', data: [6, 6, 6], highlightData: [25, 2, 2] },
      ],
    })
    expect(c.w.globals.maxY).toBeGreaterThanOrEqual(55)
  })

  test('a negative part stack lowers the min', () => {
    const c = stacked({
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [-8, 3, 3] },
        { name: 'B', data: [6, 6, 6], highlightData: [-9, 2, 2] },
      ],
    })
    expect(c.w.globals.minY).toBeLessThanOrEqual(-17)
  })

  test("'clamp' leaves the axis to the wholes", () => {
    const c = stacked({
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [30, 3, 3] },
        { name: 'B', data: [6, 6, 6], highlightData: [25, 2, 2] },
      ],
      options: { highlightFilter: { axis: 'clamp' } },
    })
    expect(c.w.globals.maxY).toBeLessThan(55)
  })

  test('groups and restarts keep their own running sums', () => {
    const c = stacked({
      series: [
        { name: 'A', group: 'x', data: [10, 10], highlightData: [30, 3] },
        { name: 'B', group: 'y', data: [6, 6], highlightData: [25, 2] },
      ],
    })
    // two groups: each part stack is one part tall
    expect(c.w.highlightData.ext).toEqual([
      [30, 3],
      [25, 2],
    ])
    expect(c.w.globals.maxY).toBeLessThan(55)
  })

  test('100% pins the axis and folds no parts', () => {
    const c = stacked({
      chart: { stackType: '100%' },
      series: [{ name: 'A', data: [30, 40, 50], highlightData: [300, 40, 80] }],
    })
    expect(c.w.highlightData.ext).toBe(null)
    expect(c.w.globals.maxY).toBe(100)
  })

  test('autoScaleYaxis folds only the parts in the zoomed window', async () => {
    const data = [1, 2, 3, 4, 5, 6].map((x) => ({ x, y: 10 }))
    const c = stacked({
      chart: { zoom: { enabled: true }, toolbar: { show: true } },
      xaxis: { type: 'numeric' },
      options: { yaxis: { min: undefined } },
      series: [
        {
          name: 'A',
          data,
          highlightData: [5, 5, 5, 5, 5, 90],
        },
        { name: 'B', data, highlightData: [5, 5, 5, 5, 5, 90] },
      ],
    })
    c.w.config.chart.zoom.autoScaleYaxis = true
    expect(c.w.globals.maxY).toBeGreaterThanOrEqual(180)
    await c.zoomX(1, 3)
    expect(c.w.globals.maxY).toBeLessThan(180)
  })
})

describe('stacked: labels and totals', () => {
  const withLabels = (extra = {}) =>
    stacked({
      ...extra,
      options: {
        dataLabels: { enabled: true },
        plotOptions: {
          bar: {
            dataLabels: { total: { enabled: true } },
            ...(extra.bar || {}),
          },
        },
        ...(extra.options || {}),
      },
    })
  const labelTexts = (c) =>
    [...c.el.querySelectorAll('.apexcharts-datalabels')].map((g) => [
      g.getAttribute('data:realIndex'),
      [...g.querySelectorAll('.apexcharts-datalabel')].map(
        (t) => t.textContent,
      ),
    ])
  const totals = (c) =>
    [...c.el.querySelectorAll('.apexcharts-datalabel-total')].map((t) => ({
      text: t.textContent,
      x: parseFloat(t.getAttribute('x')),
      y: parseFloat(t.getAttribute('y')),
    }))

  const SERIES = [
    { name: 'A', data: [40, 40, 40], highlightData: [10, 20, null] },
    { name: 'B', data: [30, 30, 30], highlightData: [15, null, null] },
  ]

  test('segment labels state the part; a null part keeps none', () => {
    const c = withLabels({ series: SERIES })
    // A null part's label is drawn blank, as a null value's is, so the
    // overlap pass (which indexes label rects by data point) stays aligned.
    expect(labelTexts(c)).toEqual([
      ['0', ['10', '20', '']],
      ['1', ['15', '', '']],
    ])
  })

  test('the total states the part sum at the part stack top; none where no part is left', () => {
    const c = withLabels({ series: SERIES })
    const t = totals(c)
    expect(t.map((x) => x.text)).toEqual(['25', '20'])
    const parts = partsOf(c)
    // above the part stack, not the whole stack
    const top0 = span(parts.get('1|0').getAttribute('pathTo'), 1)[0]
    const wholeTop = span(wholesOf(c).get('1|0').getAttribute('pathTo'), 1)[0]
    expect(t[0].y).toBeLessThan(top0)
    expect(t[0].y).toBeGreaterThan(wholeTop)
  })

  test("dataLabels.total 'whole' keeps the whole totals", () => {
    const c = withLabels({
      series: SERIES,
      options: { highlightFilter: { dataLabels: { total: 'whole' } } },
    })
    expect(totals(c).map((x) => x.text)).toEqual(['70', '70', '70'])
  })

  test('a horizontal total sits at the part stack edge', () => {
    const c = withLabels({
      series: SERIES,
      bar: { horizontal: true },
    })
    const t = totals(c)
    expect(t.map((x) => x.text)).toEqual(['25', '20'])
    const right = span(partsOf(c).get('1|0').getAttribute('pathTo'), 0)[1]
    const wholeRight = span(wholesOf(c).get('1|0').getAttribute('pathTo'), 0)[1]
    expect(t[0].x).toBeGreaterThan(right - 1)
    expect(t[0].x).toBeLessThan(wholeRight)
  })

  test('the total count-up value is the part sum', () => {
    const c = withLabels({
      series: SERIES,
      options: { dataLabels: { enabled: true, countUp: { enabled: true } } },
    })
    const vals = [...c.el.querySelectorAll('.apexcharts-datalabel-total')].map(
      (t) => t.getAttribute('data:dlTotalVal'),
    )
    expect(vals).toEqual(['25', '20'])
  })

  test('100%: a segment label prints the part share', () => {
    const c = withLabels({
      chart: { stackType: '100%' },
      series: [
        { name: 'A', data: [40, 50, 50], highlightData: [10, 25, 5] },
        { name: 'B', data: [60, 50, 50], highlightData: [30, 25, 5] },
      ],
    })
    expect(labelTexts(c)[0][1]).toEqual(['10%', '25%', '5%'])
  })

  test.each([
    ['stacked', true],
    ['unstacked', false],
  ])(
    '%s: null parts at the two leading datums draw blank labels, no throw',
    (_n, isStacked) => {
      // The overlap pass indexes label rects by data point: a datum left
      // without a label once desynchronised the two and threw.
      const c = withLabels({
        chart: { stacked: isStacked },
        series: [
          {
            name: 'S0',
            data: [12, 9, 14, 10],
            highlightData: [null, null, 7, 5],
          },
        ],
        xaxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
      })
      expect(labelTexts(c)).toEqual([['0', ['', '', '7', '5']]])
    },
  )

  test('an update that leaves the top series no parts at two leading datums', async () => {
    const W = [
      [12, 9, 14, 10],
      [8, -5, 6, 7],
      [5, 7, -4, 9],
    ]
    const series = (P) =>
      W.map((data, i) => ({ name: 'S' + i, data, highlightData: P[i] }))
    const c = withLabels({
      series: series([
        [6, 3, 7, 5],
        [4, -2, 2, 3],
        [2, 4, -1, 6],
      ]),
      xaxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
    })
    await c.updateSeries(
      series([
        [6, 3, 7, 5],
        [4, -2, 2, 3],
        [null, null, -1, 6],
      ]),
    )
    expect(labelTexts(c)[2]).toEqual(['2', ['', '', '-1', '6']])
  })

  test('100%: a part stack past 100 puts its total on the cap', () => {
    const c = withLabels({
      chart: { stackType: '100%' },
      series: [
        { name: 'A', data: [50, 50, 50], highlightData: [80, 10, 10] },
        { name: 'B', data: [50, 50, 50], highlightData: [80, 10, 10] },
      ],
    })
    const parts = partsOf(c)
    expect(
      parts.get('1|0').classList.contains('apexcharts-highlight-overflow'),
    ).toBe(true)
    const t = totals(c)
    expect(t[0].text).toBe('160%')
    // On the cap, where a plain 100% stack puts its total, not off the top
    // of the chart at the uncapped part edge.
    const plain = withLabels({
      chart: { stackType: '100%' },
      series: [
        { name: 'A', data: [50, 50, 50] },
        { name: 'B', data: [50, 50, 50] },
      ],
    })
    const capY = totals(plain)[0].y
    expect(t[0].y).toBeCloseTo(capY, 1)
    expect(t[0].y).toBeGreaterThan(-30)
    // the others sit at their own part edges, below the cap
    expect(t[1].y).toBeGreaterThan(capY + 50)
  })

  test('a part segment too thin for its label hides it', () => {
    const c = withLabels({
      series: [
        { name: 'A', data: [400, 400, 400], highlightData: [1, 200, 200] },
      ],
    })
    expect(labelTexts(c)[0][1][0]).toBe('')
  })

  test('a segment label sits inside its part segment', () => {
    const c = withLabels({
      series: SERIES,
      bar: { dataLabels: { position: 'center', total: { enabled: true } } },
    })
    const label = [...c.el.querySelectorAll('.apexcharts-datalabels')]
      .find((g) => g.getAttribute('data:realIndex') === '1')
      .querySelector('.apexcharts-datalabel')
    const y = parseFloat(label.getAttribute('y'))
    const [top, bottom] = span(partsOf(c).get('1|0').getAttribute('pathTo'), 1)
    expect(y).toBeGreaterThan(top)
    expect(y).toBeLessThan(bottom + 8)
    // and nowhere near the middle of its whole
    const [wt, wb] = span(wholesOf(c).get('1|0').getAttribute('pathTo'), 1)
    expect(Math.abs(y - (wt + wb) / 2)).toBeGreaterThan(20)
  })

  test('a mixed-sign part stack puts its total on the side core picks', () => {
    const c = withLabels({
      series: [
        { name: 'A', data: [10, 10], highlightData: [4, 4] },
        { name: 'B', data: [6, 6], highlightData: [-3, 2] },
      ],
    })
    const t = totals(c)
    expect(t.map((x) => x.text)).toEqual(['1', '6'])
    // the drawing series' part is negative at the first category, so the
    // total hangs below the negative end of the part stack
    const zeroY = span(wholesOf(c).get('0|0').getAttribute('pathTo'), 1)[1]
    const negEnd = span(partsOf(c).get('1|0').getAttribute('pathTo'), 1)[1]
    expect(negEnd).toBeGreaterThan(zeroY)
    expect(t[0].y).toBeGreaterThan(negEnd)
    expect(t[1].y).toBeLessThan(zeroY)
  })

  test('the tooltip rows carry each series part against its whole', () => {
    const c = withLabels({ series: SERIES })
    const f = { yLbFormatter: (v) => String(v) }
    const row = (whole) => {
      const yValue = document.createElement('span')
      yValue.innerHTML = whole
      return { yValue }
    }
    const text = (s, j) => {
      const r = row(String(c.w.seriesData.series[s][j]))
      c.highlightFilter.tooltipRow(r, s, j, f)
      return r.yValue.textContent
    }
    expect(text(0, 0)).toBe(`10 / ${c.w.seriesData.series[0][0]}`)
    expect(text(1, 0)).toBe(`15 / ${c.w.seriesData.series[1][0]}`)
    // no part at that datum: the whole alone
    expect(text(1, 1)).toBe(String(c.w.seriesData.series[1][1]))
  })
})

describe('stacked: scope', () => {
  test('a stacked combo still warns once and draws without parts', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = stacked({
      series: [
        {
          name: 'A',
          type: 'column',
          data: [1, 2, 3],
          highlightData: [1, 1, 1],
        },
        { name: 'B', type: 'line', data: [1, 2, 3] },
      ],
    })
    expect(c.highlightFilter.isActive()).toBe(false)
    expect(partsOf(c).size).toBe(0)
    expect(
      warn.mock.calls.filter((x) => String(x[0]).includes('highlightFilter'))
        .length,
    ).toBe(1)
  })

  test.each([
    ['two y axes', { yaxis: [{}, { opposite: true }] }],
    ['a log axis', { yaxis: { logarithmic: true } }],
  ])('a stack over %s warns once and draws without parts', (_n, options) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = stacked({
      series: [
        { name: 'A', data: [10, 20, 30], highlightData: [1, 2, 3] },
        { name: 'B', data: [10, 20, 30], highlightData: [1, 2, 3] },
      ],
      options,
    })
    expect(c.highlightFilter.isActive()).toBe(false)
    expect(partsOf(c).size).toBe(0)
    expect(
      warn.mock.calls.filter((x) => String(x[0]).includes('highlightFilter'))
        .length,
    ).toBe(1)
  })

  test('extra y axes mapped onto the one scale are one axis: parts are drawn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const c = stacked({
      series: [
        { name: 'A', data: [10, 20, 30], highlightData: [1, 2, 3] },
        { name: 'B', data: [10, 20, 30], highlightData: [1, 2, 3] },
      ],
      options: {
        yaxis: [{ seriesName: 'A' }, { seriesName: 'A', show: false }],
      },
    })
    expect(c.highlightFilter.isActive()).toBe(true)
    expect(partsOf(c).size).toBe(6)
    expect(
      warn.mock.calls.filter((x) => String(x[0]).includes('highlightFilter'))
        .length,
    ).toBe(0)
  })

  test('a collapsed series keeps a zero part, and the parts above it sit lower', async () => {
    const c = stacked({
      series: [
        { name: 'A', data: [10, 10, 10], highlightData: [4, 4, 4] },
        { name: 'B', data: [6, 6, 6], highlightData: [3, 3, 3] },
      ],
    })
    const before = span(partsOf(c).get('1|0').getAttribute('pathTo'), 1)
    c.toggleSeries('A')
    await new Promise((r) => setTimeout(r, 0))
    expect(c.w.highlightData.parts[0]).toEqual([0, 0, 0])
    const after = span(partsOf(c).get('1|0').getAttribute('pathTo'), 1)
    expect(after[1]).toBeGreaterThan(before[1])
  })
})

describe('stacked: renderers', () => {
  test('a canvas pick paints the landed fade, with no tween left running', async () => {
    const series = [
      { name: 'A', data: [10, 20, 30] },
      { name: 'B', data: [5, 6, 7] },
    ]
    const c = stacked({ chart: { renderer: 'canvas' }, series })
    c.w.config.chart.animations.enabled = true
    expect(c.ctx.renderer.kind).toBe('canvas')
    await c.updateSeries(
      series.map((s) => ({ ...s, highlightData: s.data.map((v) => v / 2) })),
    )
    const hf = c.highlightFilter
    expect(hf.isActive()).toBe(true)
    expect(hf._live.size).toBe(0)
    const faded = c.ctx.renderer._g
      .displayList()
      .filter((x) => x.fillOpacity !== undefined)
    expect(faded.length).toBe(6)
    for (const x of faded) expect(Number(x.fillOpacity)).toBeCloseTo(0.2, 6)
    c.destroy()
  })
})

describe('stacked: forecast', () => {
  const series = [
    { name: 'A', data: [10, 20, 30], highlightData: [4, 8, 12] },
    { name: 'B', data: [5, 6, 7], highlightData: [2, 3, 4] },
  ]
  const forecast = { forecastDataPoints: { count: 1, fillOpacity: 0.5 } }

  test('a forecast datum draws its part lighter, as its whole', () => {
    const c = stacked({ series, options: forecast })
    const ps = partsOf(c)
    const ws = wholesOf(c)
    for (const ri of [0, 1]) {
      expect(ps.get(`${ri}|0`).getAttribute('fill-opacity')).not.toBe('0.5')
      expect(ps.get(`${ri}|2`).getAttribute('fill-opacity')).toBe('0.5')
      // the fade multiplies the forecast's own opacity
      expect(
        Number(ws.get(`${ri}|2`).getAttribute('fill-opacity')),
      ).toBeCloseTo(0.1, 6)
      expect(
        Number(ws.get(`${ri}|0`).getAttribute('fill-opacity')),
      ).toBeCloseTo(0.2, 6)
    }
    c.destroy()
  })

  test('on the canvas too', () => {
    const c = stacked({
      chart: { renderer: 'canvas' },
      series,
      options: forecast,
    })
    expect(c.ctx.renderer.kind).toBe('canvas')
    const ops = c.ctx.renderer._g
      .displayList()
      .filter((x) => x.tag === 'path' && x.fillOpacity !== undefined)
      .map((x) => Number(x.fillOpacity))
      .sort()
    // two forecast wholes (0.5 x 0.2), four plain wholes, two forecast parts
    expect(ops.map((v) => Math.round(v * 100) / 100)).toEqual([
      0.1, 0.1, 0.2, 0.2, 0.2, 0.2, 0.5, 0.5,
    ])
    c.destroy()
  })
})

describe('stacked: byte-neutral extractions', () => {
  test('cornerMorph pads a corner hand-off exactly as getPreviousPath did', () => {
    const c = stacked({
      series: mirror([
        [10, 6, 8],
        [6, 7, 3],
      ]),
      options: {
        plotOptions: {
          bar: { borderRadius: 8, borderRadiusWhenStacked: 'last' },
        },
      },
    })
    const parts = partsOf(c)
    const rounded = parts.get('1|0').getAttribute('pathTo')
    const square = parts.get('0|0').getAttribute('pathTo')
    const shrunk = parts.get('1|1').getAttribute('pathTo')
    const bar = new Bar(c.w, c, { yRatio: [1], invertedYRatio: 1, xRatio: 1 })
    const n = Bar.pathCommandCount(rounded)
    expect(Bar.pathCommandCount(square)).toBeLessThan(n)
    // gaining a corner from a rect with real extent (a hand-off): the old
    // rect is padded, and the tween aims at the square slot, rounding on
    // arrival
    bar._pathToInterp = null
    const from = bar.cornerMorph(square, rounded, square)
    expect(Bar.pathCommandCount(from)).toBe(n)
    expect(Bar.pathCommandCount(bar._pathToInterp)).toBe(n)
    expect(span(bar._pathToInterp, 1)).toEqual(span(square, 1))
    // losing one while the target keeps extent: start square in its own box,
    // aim at a padded twin of the target
    bar._pathToInterp = null
    const back = bar.cornerMorph(rounded, shrunk.replace(/[CQ][^LMZz]*/g, ''))
    expect(Bar.pathCommandCount(back)).toBe(n)
    // square (its corners padded by zero), in the rounded rect's own box
    expect(back).not.toBe(rounded)
    expect(span(back, 1)[0]).toBeCloseTo(span(rounded, 1)[0], 6)
    expect(bar._pathToInterp).not.toBe(null)
    // the same count is no hand-off
    bar._pathToInterp = null
    expect(bar.cornerMorph(square, square)).toBe(square)
    expect(bar._pathToInterp).toBe(null)
  })
})
