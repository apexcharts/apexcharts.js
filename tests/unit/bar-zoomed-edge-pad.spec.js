import { describe, it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import AxisMapping from '../../src/modules/AxisMapping.js'

// #5368 (and #2651): a zoomed column chart on a numeric x axis cut its first
// and last bars at the plot edges. The edge pad was sized from the full data
// range while the bars are sized from the window on screen, so zooming in
// widened the bars and left the pad where it was: zoomed to 4..6, about 50px
// of each 172px edge bar hung outside the padded grid. A category axis with
// tickPlacement 'on' is converted to numeric, so it, numeric and datetime all
// took the same path.

const DAY = 86400000
const T0 = Date.UTC(2024, 0, 1)

const categoryOn = () => ({
  series: [{ name: 'S', data: [5, 9, 3, 7, 12, 6, 8, 4, 10, 11, 2, 7] }],
  xaxis: {
    categories: Array.from({ length: 12 }, (_, i) => 'C' + (i + 1)),
    tickPlacement: 'on',
  },
})
const numeric = () => ({
  series: [
    { name: 'S', data: Array.from({ length: 12 }, (_, i) => ({ x: i + 1, y: 3 + i })) },
  ],
  xaxis: { type: 'numeric' },
})
const datetime = () => ({
  series: [
    {
      name: 'S',
      data: Array.from({ length: 12 }, (_, i) => ({ x: T0 + i * DAY, y: 3 + i })),
    },
  ],
  xaxis: { type: 'datetime' },
})

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

async function mount(opts, chartOpts = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = new ApexCharts(document.getElementById('chart'), {
    chart: {
      type: 'bar',
      width: 600,
      height: 300,
      animations: { enabled: false },
      zoom: { enabled: true, type: 'x' },
      ...chartOpts,
    },
    ...opts,
  })
  await chart.render()
  return chart
}

// [left, right] of each drawn bar, in px from the plot origin
const bars = (c) =>
  [...c.el.querySelectorAll('.apexcharts-bar-area')]
    .map((p) => {
      const xs = [...p.getAttribute('d').matchAll(/[MLCQ]\s*(-?[\d.]+)/g)].map(
        (m) => +m[1],
      )
      return [Math.min(...xs), Math.max(...xs)]
    })
    .filter((b) => b[1] - b[0] > 0.01)

const layout = (c) => ({
  pad: c.w.globals.barPadForNumericAxis,
  gridWidth: c.w.layout.gridWidth,
  translateX: c.w.layout.translateX,
})

// The un-zoomed 12-bar chart at 600px, as measured before the fix.
const UNZOOMED = { pad: 35.83, gridWidth: 491.35, translateX: 62.83 }

function expectUnzoomedLayout(c) {
  const l = layout(c)
  expect(l.pad).toBeCloseTo(UNZOOMED.pad, 2)
  expect(l.gridWidth).toBeCloseTo(UNZOOMED.gridWidth, 2)
  expect(l.translateX).toBeCloseTo(UNZOOMED.translateX, 2)
  const b = bars(c)
  expect(b).toHaveLength(12)
  expect(b[0][0]).toBeCloseTo(-15.6, 1)
  expect(b[0][1]).toBeCloseTo(15.6, 1)
  expect(b[11][0]).toBeCloseTo(475.7, 1)
  expect(b[11][1]).toBeCloseTo(507, 1)
}

function expectBarsInsidePlot(c) {
  const { pad, gridWidth } = layout(c)
  const b = bars(c)
  expect(b.length).toBeGreaterThan(0)
  for (const [l, r] of b) {
    expect(l).toBeGreaterThanOrEqual(-pad)
    expect(r).toBeLessThanOrEqual(gridWidth + pad)
  }
}

const cases = [
  ['category, tickPlacement on', categoryOn, 4, 6],
  ['numeric', numeric, 4, 6],
  ['datetime', datetime, T0 + 3 * DAY, T0 + 5 * DAY],
]

describe('zoomed column chart keeps its edge bars inside the plot (#5368)', () => {
  for (const [name, opts, lo, hi] of cases) {
    it(`${name}: un-zoomed layout is unchanged`, async () => {
      await mount(opts())
      expectUnzoomedLayout(chart)
    })

    it(`${name}: zoomed to three bars, the edge bars are whole`, async () => {
      await mount(opts())
      await chart.zoomX(lo, hi)
      const b = bars(chart)
      expect(b).toHaveLength(3)
      expectBarsInsidePlot(chart)
    })
  }

  it('the updateOptions window from the report fits too', async () => {
    await mount(categoryOn())
    await chart.updateOptions({ xaxis: { min: 4, max: 6 } })
    expectBarsInsidePlot(chart)
  })

  it('grouped and stacked bars fit the zoomed window', async () => {
    const base = categoryOn()
    const two = [base.series[0], { name: 'T', data: base.series[0].data }]
    await mount({ ...base, series: two })
    await chart.zoomX(4, 6)
    expect(bars(chart)).toHaveLength(6)
    expectBarsInsidePlot(chart)
    chart.destroy()

    await mount({ ...base, series: two }, { stacked: true })
    await chart.zoomX(4, 6)
    expect(bars(chart)).toHaveLength(6)
    expectBarsInsidePlot(chart)
  })

  it('bars stay on the shared data-to-px mapping', async () => {
    await mount(categoryOn())
    await chart.zoomX(4, 6)
    // the pad moves the plot origin and width, never the mapping: each bar is
    // centred where AxisMapping (selection, brush, tooltip) puts its x
    const centres = bars(chart).map(([l, r]) => (l + r) / 2)
    ;[4, 5, 6].forEach((x, i) => {
      expect(centres[i]).toBeCloseTo(AxisMapping.dataXToPx(chart.w, x), 1)
    })
    expect(AxisMapping.pxToDataX(chart.w, chart.w.layout.gridWidth)).toBeCloseTo(
      6,
      6,
    )
  })

  it('a moderate zoom keeps the un-zoomed plot width', async () => {
    // the full range pad already fits these edge bars, so the layout does not
    // move: the pad only grows once the window is narrow enough to need it
    await mount(categoryOn())
    await chart.zoomX(3, 9)
    const l = layout(chart)
    expect(l.pad).toBeCloseTo(UNZOOMED.pad, 2)
    expect(l.gridWidth).toBeCloseTo(UNZOOMED.gridWidth, 2)
    expectBarsInsidePlot(chart)
  })

  it('a dense chart zoomed a little keeps its layout', async () => {
    const dense = {
      series: [
        {
          name: 'S',
          data: Array.from({ length: 60 }, (_, i) => ({ x: T0 + i * DAY, y: 3 + i })),
        },
      ],
      xaxis: { type: 'datetime' },
    }
    await mount(dense)
    const before = layout(chart)
    await chart.zoomX(T0 + 5 * DAY, T0 + 50 * DAY)
    expect(layout(chart).pad).toBeCloseTo(before.pad, 6)
    expect(layout(chart).gridWidth).toBeCloseTo(before.gridWidth, 6)
  })

  it('zoom reset gives back the un-zoomed layout', async () => {
    await mount(categoryOn())
    await chart.zoomX(4, 6)
    expect(layout(chart).gridWidth).toBeLessThan(UNZOOMED.gridWidth - 10)
    chart.ctx.toolbar.handleZoomReset()
    await new Promise((r) => setTimeout(r, 30))
    expectUnzoomedLayout(chart)
  })

  it('resetSeries() after a zoom gives back the exact un-zoomed layout', async () => {
    // the reset takes the fast update path, which keeps the layout frozen; it
    // used to keep the zoomed pad and draw the full range ~80px narrow
    await mount(categoryOn())
    await chart.zoomX(4, 6)
    expect(layout(chart).gridWidth).toBeLessThan(UNZOOMED.gridWidth - 10)
    chart.resetSeries()
    await new Promise((r) => setTimeout(r, 30))
    expect(chart._fastAxisBailReason).toMatch(/^barPad/)
    expectUnzoomedLayout(chart)
  })

  // A keepView re-feed (highlightFilter, crossfilter) leaves the window where
  // it is, so the zoomed pad must survive it, whichever update path it takes.
  const keepViewRefeed = async () => {
    const data = categoryOn().series[0].data.map((v) => v * 2)
    await chart._replaceSeries([{ name: 'S', data }], false, false, {
      keepView: true,
    })
  }
  const expectSameLayout = (before) => {
    expect(chart.w.globals.minX).toBe(4)
    expect(chart.w.globals.maxX).toBe(6)
    const l = layout(chart)
    expect(l.pad).toBeCloseTo(before.pad, 6)
    expect(l.gridWidth).toBeCloseTo(before.gridWidth, 6)
    expect(l.translateX).toBeCloseTo(before.translateX, 6)
    expect(bars(chart)).toHaveLength(3)
    expectBarsInsidePlot(chart)
  }

  it('a keepView re-feed while zoomed keeps the zoomed layout', async () => {
    await mount(categoryOn())
    await chart.zoomX(4, 6)
    const zoomed = layout(chart)
    await keepViewRefeed()
    expectSameLayout(zoomed)
  })

  it('a keepView re-feed on a fast update keeps the windowed pad', async () => {
    // a window from config is not a zoom, so the re-feed takes the fast path;
    // the pad re-solves to the same value and the frozen layout is kept
    const opts = categoryOn()
    opts.xaxis.min = 4
    opts.xaxis.max = 6
    await mount(opts)
    const windowed = layout(chart)
    expect(windowed.gridWidth).toBeLessThan(UNZOOMED.gridWidth - 10)
    const st = chart._updateStats
    const before = { ...st }
    await keepViewRefeed()
    expect(st.full).toBe(before.full)
    expect(st.fast + st.fastWithAxes).toBe(before.fast + before.fastWithAxes + 1)
    expectSameLayout(windowed)
  })

  it('a px columnWidth does not widen with zoom, so its pad does not move', async () => {
    const full = await mount({
      ...numeric(),
      plotOptions: { bar: { columnWidth: '20' } },
    })
    const before = layout(full)
    await full.zoomX(4, 6)
    expect(layout(full).pad).toBeCloseTo(before.pad, 6)
    expectBarsInsidePlot(full)
  })
})
