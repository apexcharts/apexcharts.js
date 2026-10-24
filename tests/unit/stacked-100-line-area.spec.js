import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import CoreUtils from '../../src/modules/CoreUtils.js'

// `stackType: '100%'` on an area or line chart (#5384). The y axis was
// pinned to 0..100 for every type, but only BarStacked drew each point's
// share of its stack; Line stacked the raw values, so with the reporter's
// data the tallest stack stopped at 40 on a 0..100 axis. Line now draws
// w.globals.seriesPercent too, every series that is a slice of a 100% stack
// counts toward its total and labels with '%', and each stack (bars, areas,
// lines, per series group in a combo) normalises to its own total.

const CATS = ['P', 'Q', 'R', 'S', 'T']
const SERIES = () => [
  { name: 'A', data: [18, 11, 6, 10, 7] },
  { name: 'B', data: [6, 1, 2, 4, 1] },
  { name: 'C', data: [8, 2, 3, 3, 2] },
  { name: 'D', data: [8, 1, 3, 3, 1] },
]

let chart
afterEach(() => {
  chart?.destroy()
  chart = null
})

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))

async function render(type, series = SERIES(), extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const { chart: chartOpts, ...rest } = extra
  chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type,
      width: 500,
      height: 300,
      stacked: true,
      stackType: '100%',
      animations: { enabled: false },
      ...chartOpts,
    },
    series,
    xaxis: { categories: CATS },
    dataLabels: { enabled: false },
    ...rest,
  })
  await chart.render()
  return chart
}

/** Pixel y of each drawn point of a series, as the tooltip reads them. */
const ys = (ri) => chart.w.globals.pointsArray[ri].map((p) => p[1])
/** The value on the y axis a pixel y reads as. */
const asValue = (y) => 100 * (1 - y / chart.w.layout.gridHeight)
const round = (a) => a.map((v) => Math.round(v * 100) / 100)

/** Label text per series name, in data-point order. */
function labelsBySeries() {
  const out = {}
  document.querySelectorAll('.apexcharts-datalabels').forEach((g) => {
    const texts = [...g.querySelectorAll('.apexcharts-datalabel')].map(
      (t) => t.textContent,
    )
    const name = chart.w.config.series[g.getAttribute('data:realIndex')].name
    out[name] = texts
  })
  return out
}

describe('100% stacked area and line draw shares (#5384)', () => {
  it.each(['area', 'line'])(
    '%s: the top series reaches 100 at every x',
    async (type) => {
      await render(type)
      expect(chart.w.globals.minY).toBe(0)
      expect(chart.w.globals.maxY).toBe(100)
      expect(round(ys(3).map(asValue))).toEqual([100, 100, 100, 100, 100])
    },
  )

  it.each(['area', 'line'])(
    '%s: each series sits at its cumulative share',
    async (type) => {
      await render(type)
      // P: 18 of 40 is 45%, then 6 (15%) on top of it.
      expect(asValue(ys(0)[0])).toBeCloseTo(45, 6)
      expect(asValue(ys(1)[0])).toBeCloseTo(60, 6)
      expect(asValue(ys(2)[0])).toBeCloseTo(80, 6)
    },
  )

  it('draws the same stack tops as the same 100% columns', async () => {
    await render('bar')
    const pct = chart.w.globals.seriesPercent.map(round)
    await render('area')
    expect(chart.w.globals.seriesPercent.map(round)).toEqual(pct)
  })

  it('keeps a null as a gap, not a 0% point', async () => {
    const series = SERIES()
    series[1].data[2] = null
    await render('area', series)
    expect(chart.w.globals.pointsArray[1][2][1]).toBeNull()
    // The series above still stacks on what is drawn below it at R.
    expect(round(ys(3).map(asValue))).toEqual([100, 100, 100, 100, 100])
  })

  it('normalises by x on a numeric axis with ragged series', async () => {
    await render(
      'area',
      [
        {
          name: 'A',
          data: [
            [1, 30],
            [2, 10],
            [3, 20],
          ],
        },
        {
          name: 'B',
          data: [
            [1, 10],
            [3, 20],
          ],
        },
      ],
      { xaxis: { type: 'numeric' } },
    )
    const pct = chart.w.globals.seriesPercent
    expect(round(pct[0])).toEqual([75, 100, 50])
    expect(round(pct[1])).toEqual([25, 50])
    // B has no x = 2; its edge passes through the stack there (_stackXs).
    expect(round(ys(1).map(asValue))).toEqual([100, 100, 100])
  })
})

describe('100% stacked area and line labels and tooltip', () => {
  it('labels an area point with its share and a %', async () => {
    await render(
      'area',
      [
        { name: 'North', data: [30, 40, 25, 50] },
        { name: 'South', data: [10, 60, 75, 50] },
      ],
      {
        xaxis: { categories: ['A', 'B', 'C', 'D'] },
        dataLabels: { enabled: true },
      },
    )
    expect(labelsBySeries()).toEqual({
      North: ['75%', '40%', '25%', '50%'],
      South: ['25%', '60%', '75%', '50%'],
    })
  })

  it('labels a line point with its share and a %', async () => {
    await render(
      'line',
      [
        { name: 'North', data: [30, 40] },
        { name: 'South', data: [10, 60] },
      ],
      { xaxis: { categories: ['A', 'B'] }, dataLabels: { enabled: true } },
    )
    expect(labelsBySeries()).toEqual({
      North: ['75%', '40%'],
      South: ['25%', '60%'],
    })
  })

  // Bars show the raw value in the tooltip, the share is the axis' job; a
  // 100% area does the same.
  it.each(['bar', 'area'])(
    '%s: the tooltip reads the raw value',
    async (type) => {
      await render(type, SERIES(), {
        tooltip: { shared: true, intersect: false },
      })
      const w = chart.w
      const n = w.globals.dataPoints
      const x =
        type === 'bar'
          ? w.layout.translateX + (w.layout.gridWidth / n) * 0.5
          : w.layout.translateX
      w.dom.Paper.node.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: x,
          clientY: w.layout.translateY + w.layout.gridHeight / 2,
          bubbles: true,
        }),
      )
      await tick(30)
      const vals = [
        ...w.dom.baseEl.querySelectorAll('.apexcharts-tooltip-text-y-value'),
      ].map((e) => e.textContent)
      expect(vals.slice(0, 4).sort()).toEqual(['18', '6', '8', '8'].sort())
    },
  )
})

describe('100% stacked combo: each stack normalises within its own kind', () => {
  const combo = (stackOnlyBar) =>
    render(
      'line',
      [
        { name: 'ColA', type: 'column', data: [30, 10, 20] },
        { name: 'ColB', type: 'column', data: [10, 30, 20] },
        { name: 'AreaA', type: 'area', data: [5, 1, 2] },
        { name: 'AreaB', type: 'area', data: [15, 3, 2] },
      ],
      {
        chart: { stackOnlyBar },
        xaxis: { categories: ['A', 'B', 'C'] },
        dataLabels: { enabled: true },
      },
    )

  it('with stackOnlyBar off the columns and the areas each reach 100', async () => {
    await combo(false)
    const pct = chart.w.globals.seriesPercent.map(round)
    expect(pct[0]).toEqual([75, 25, 50])
    expect(pct[1]).toEqual([25, 75, 50])
    expect(pct[2]).toEqual([25, 25, 50])
    expect(pct[3]).toEqual([75, 75, 50])
    // The top area reaches the top of the plot at every x.
    expect(round(ys(3).map(asValue))).toEqual([100, 100, 100])
    // Area labels read their share too.
    expect(labelsBySeries().AreaA).toEqual(['25%', '25%', '50%'])
  })

  it('with the default stackOnlyBar the areas are drawn raw and labelled plain', async () => {
    await combo(true)
    const pct = chart.w.globals.seriesPercent.map(round)
    // The columns' shares are unchanged by the unstacked areas.
    expect(pct[0]).toEqual([75, 25, 50])
    expect(pct[1]).toEqual([25, 75, 50])
    expect(round(ys(2).map(asValue))).toEqual([5, 1, 2])
    expect(round(ys(3).map(asValue))).toEqual([15, 3, 2])
    expect(labelsBySeries().AreaB).toEqual(['15', '3', '2'])
  })

  it('normalises each series group of areas to its own total', async () => {
    await render(
      'line',
      [
        { name: 'C', type: 'column', group: 'g1', data: [30, 10] },
        { name: 'A1', type: 'area', group: 'g1', data: [1, 3] },
        { name: 'A2', type: 'area', group: 'g1', data: [3, 1] },
        { name: 'B1', type: 'area', group: 'g2', data: [2, 2] },
        { name: 'B2', type: 'area', group: 'g2', data: [6, 2] },
      ],
      { chart: { stackOnlyBar: false }, xaxis: { categories: ['A', 'B'] } },
    )
    const pct = chart.w.globals.seriesPercent.map(round)
    expect(pct[0]).toEqual([100, 100])
    expect(pct[1]).toEqual([25, 75])
    expect(pct[3]).toEqual([25, 50])
    expect(round(ys(2).map(asValue))).toEqual([100, 100])
    expect(round(ys(4).map(asValue))).toEqual([100, 100])
  })
})

describe('percentStackKinds is the one 100% classification', () => {
  it('classifies bars, stacked areas and lines, and unstacked combo lines', () => {
    const cfg = (series, stackOnlyBar) => ({
      chart: { type: 'line', stacked: true, stackOnlyBar },
      series,
    })
    expect(
      CoreUtils.percentStackKinds(
        cfg([{ type: 'column' }, { type: 'area' }, { type: 'line' }], false),
      ),
    ).toEqual(['bar', 'area', 'line'])
    // Unset stackOnlyBar is its default (on): a raw user config.
    expect(
      CoreUtils.percentStackKinds(cfg([{ type: 'column' }, { type: 'line' }])),
    ).toEqual(['bar', null])
    // Not a combo: every line stacks, stackOnlyBar or not.
    expect(CoreUtils.percentStackKinds(cfg([{}, {}], true))).toEqual([
      'line',
      'line',
    ])
    expect(
      CoreUtils.percentStackKinds({
        chart: { type: 'scatter' },
        series: [{}],
      }),
    ).toEqual([null])
  })
})

describe('100% stacked area across updates', () => {
  it('re-normalises the rest when a series is hidden from the legend', async () => {
    await render('area')
    chart.hideSeries('D')
    await tick()
    // A, B, C now share each stack: P is 18 + 6 + 8 = 32.
    expect(asValue(ys(0)[0])).toBeCloseTo((100 * 18) / 32, 6)
    expect(round(ys(2).map(asValue))).toEqual([100, 100, 100, 100, 100])
    chart.showSeries('D')
    await tick()
    expect(asValue(ys(0)[0])).toBeCloseTo(45, 6)
    expect(round(ys(3).map(asValue))).toEqual([100, 100, 100, 100, 100])
  })

  it('updateSeries redraws at the new shares and tweens from the old shape', async () => {
    await render('area', SERIES(), {
      chart: { animations: { enabled: true, speed: 50 } },
    })
    await tick(400)
    const area = () =>
      [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-series')]
        .find((g) => g.getAttribute('data:realIndex') === '0')
        .querySelector('.apexcharts-area')
    const before = area().getAttribute('d')
    const next = SERIES()
    next[0].data = [8, 1, 2, 4, 1]
    await chart.updateSeries(next)
    // The tween starts from what was on screen: the old share shape.
    expect(area().getAttribute('pathFrom')).toBe(before)
    await tick(400)
    // P: 8 of 30 now.
    expect(asValue(ys(0)[0])).toBeCloseTo((100 * 8) / 30, 6)
    expect(round(ys(3).map(asValue))).toEqual([100, 100, 100, 100, 100])
  })
})

describe('100% stacked area with a highlight filter', () => {
  it('draws a part equal to its whole on the whole', async () => {
    await import('../../src/features/highlight-filter.js')
    const rows = [
      [12, 18, 9, 22],
      [5, 9, 14, 8],
    ]
    await render(
      'area',
      rows.map((data, i) => ({ name: 'S' + i, data, highlightData: data })),
      { xaxis: { categories: ['A', 'B', 'C', 'D'] } },
    )
    const q = (sel) => [...chart.w.dom.baseEl.querySelectorAll(sel)]
    const nums = (d) =>
      (String(d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number)
    for (const ri of ['0', '1']) {
      const part = q('.apexcharts-line-highlight-part').find(
        (n) => n.getAttribute('index') === ri,
      )
      const whole = q('.apexcharts-series > .apexcharts-area').find(
        (n) =>
          n.getAttribute('index') === ri &&
          !n.classList.contains('apexcharts-highlight-part'),
      )
      const a = nums(part.getAttribute('pathTo'))
      const b = nums(whole.getAttribute('pathTo'))
      expect(a.length).toBe(b.length)
      a.forEach((v, k) => expect(Math.abs(v - b[k])).toBeLessThan(0.01))
    }
  })
})
