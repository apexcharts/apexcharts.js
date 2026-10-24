/**
 * A trellis panel drops the band a standalone axis chart keeps above its plot
 * (the no-title gutter plus the fixed axis offset) and keeps only the
 * clearance its top ink needs. The logic ships in the trellis add-on
 * (TrellisTopClearance), attached to each panel chart as the
 * `panelTopBand` hook; core only consults the hook. A chart without it
 * must lay out exactly as before.
 *
 * Text is measured through a stubbed getTextRects so the arithmetic is exact:
 * every string is 12px tall with its centre 2px above the baseline, i.e. an
 * em box rising 6 + 2 = 8px above the baseline.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import Graphics from '../../src/modules/Graphics.js'
import { dropPanelTopBand } from '../../src/modules/trellis/TrellisTopClearance.js'

const ASCENT = 8
const TEXT_H = 12

beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
  vi.spyOn(Graphics.prototype, 'getTextRects').mockReturnValue({
    width: 20,
    height: TEXT_H,
    centerOffset: TEXT_H / 2 - ASCENT,
  })
})
afterEach(() => vi.restoreAllMocks())

/** Render one chart, optionally flagged as a trellis panel. */
async function layout(opts, panel) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    ...opts,
    chart: {
      height: 200,
      width: 400,
      animations: { enabled: false },
      ...(opts.chart || {}),
    },
  })
  if (panel) chart.panelTopBand = dropPanelTopBand
  await chart.render()
  const l = chart.w.layout
  return {
    chart,
    translateY: l.translateY,
    gridHeight: l.gridHeight,
    bottom: l.translateY + l.gridHeight,
  }
}

const line = (extra = {}) => ({
  chart: { type: 'line' },
  series: [{ name: 'a', data: [10, 40, 100, 60] }],
  xaxis: { categories: ['a', 'b', 'c', 'd'] },
  dataLabels: { enabled: false },
  ...extra,
})

describe('trellis panel top band', () => {
  it('leaves a standalone chart exactly as it was', async () => {
    // The pre-change layout of these charts: the 10px axis offset plus the
    // 20px no-title gutter above the plot.
    const a = await layout(line(), false)
    expect(a.chart.panelTopBand).toBeUndefined()
    expect(a.translateY).toBe(30)
    const b = await layout(line({ grid: { padding: { top: 6 } } }), false)
    expect(b.translateY).toBe(36)
  })

  it('drops the band and keeps only the top y label overhang', async () => {
    const solo = await layout(line(), false)
    const panel = await layout(line(), true)
    // y label: ascent 8 - 11px / 3 = 4.33; line stroke 5 / 2 = 2.5 -> 5.
    expect(panel.translateY).toBe(5)
    // The plot grows by exactly what came off the top: its bottom stays.
    expect(panel.gridHeight).toBe(solo.gridHeight + solo.translateY - 5)
    expect(panel.bottom).toBe(solo.bottom)
  })

  it("composes with the user's own grid.padding.top", async () => {
    const panel = await layout(line({ grid: { padding: { top: 6 } } }), true)
    expect(panel.translateY).toBe(11)
    const neg = await layout(line({ grid: { padding: { top: -3 } } }), true)
    expect(neg.translateY).toBe(2)
  })

  it('without y labels keeps only half the stroke', async () => {
    const panel = await layout(line({ yaxis: { show: false } }), true)
    expect(panel.translateY).toBe(3) // ceil(5 / 2)
  })

  it('reserves a marker on the top value, radius plus half its stroke', async () => {
    const panel = await layout(
      line({ markers: { size: 6, strokeWidth: 2 } }),
      true,
    )
    expect(panel.translateY).toBe(7)
  })

  it('reserves a point data label above the top value', async () => {
    // baseline = max(0, 0 + 2) + 0 = 2 -> ascent 8 - 2 = 6 (beats 4.33).
    const on = await layout(line({ dataLabels: { enabled: true } }), true)
    expect(on.translateY).toBe(6)
    // A negative offsetY lifts it: baseline = max(0, -8) - 6 = -6 -> 14.
    const up = await layout(
      line({ dataLabels: { enabled: true, offsetY: -6 } }),
      true,
    )
    expect(up.translateY).toBe(14)
  })

  it('reserves a stacked column total above its stack', async () => {
    const panel = await layout(
      {
        chart: { type: 'bar', stacked: true },
        series: [
          { name: 'a', data: [10, 20] },
          { name: 'b', data: [30, 40] },
        ],
        xaxis: { categories: ['x', 'y'] },
        dataLabels: { enabled: false },
        plotOptions: { bar: { dataLabels: { total: { enabled: true } } } },
      },
      true,
    )
    // ascent 8 + 0.3 * 12 = 11.6 -> 12.
    expect(panel.translateY).toBe(12)
  })

  it('lets a horizontal bar keep its category labels inside their rows', async () => {
    const hbar = (n) => ({
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 'a', data: Array.from({ length: n }, (_, i) => i + 1) }],
      xaxis: { categories: Array.from({ length: n }, (_, i) => 'c' + i) },
      dataLabels: { enabled: false },
    })
    // Tall rows: the label sits well inside the first row, so at most the
    // bar stroke's half width is left.
    const roomy = await layout(hbar(3), true)
    expect(roomy.translateY).toBeLessThanOrEqual(1)
    // Rows shorter than the label: the first one rises over the plot top,
    // never by more than its whole ascent.
    const dense = await layout(hbar(200), true)
    expect(dense.translateY).toBeGreaterThan(1)
    expect(dense.translateY).toBeLessThanOrEqual(ASCENT)
    // Solved, not estimated: the first label's em box top lands on the svg
    // top (within the ceil) once the plot is laid out.
    const row = dense.gridHeight / 200
    const firstBaseline = dense.translateY + row * (1 - 1 / 2.2)
    expect(firstBaseline - ASCENT).toBeGreaterThanOrEqual(0)
    expect(firstBaseline - ASCENT).toBeLessThan(1)
  })

  it('leaves an x axis drawn on top alone (it is chrome, not a gap)', async () => {
    const solo = await layout(line({ xaxis: { position: 'top' } }), false)
    const panel = await layout(line({ xaxis: { position: 'top' } }), true)
    // Only the title gutter goes; the axis band stays.
    expect(solo.translateY - panel.translateY).toBeCloseTo(20, 6)
  })
})

async function mountTrellis(opts) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    trellis: { by: 'k', virtualize: false },
    ...opts,
  })
  await chart.render()
  return chart
}

describe('trellis panels carry the hook, and pass the top pad through', () => {
  it('hooks every mounted panel and sets no top pad of its own', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'k', virtualize: false },
      grid: { padding: { top: 4 } },
      series: [
        { name: 's', k: 'a', data: [1, 5, 3] },
        { name: 's', k: 'b', data: [2, 4, 3] },
      ],
      xaxis: { categories: ['x', 'y', 'z'] },
    })
    await chart.render()
    const panels = chart.getPanels()
    expect(panels).toHaveLength(2)
    for (const p of panels) {
      expect(p.chart.panelTopBand).toBe(dropPanelTopBand)
      // The user's top pad reaches the panel untouched (no reclaim folded in).
      expect(p.chart.w.config.grid.padding.top).toBe(4)
    }
  })

  it('leaves sparkline and radar panels without the hook', async () => {
    const spark = await mountTrellis({
      chart: { type: 'line', height: 300, sparkline: { enabled: true } },
      series: [
        { name: 's', k: 'a', data: [1, 5, 3] },
        { name: 's', k: 'b', data: [2, 4, 3] },
      ],
    })
    const radar = await mountTrellis({
      chart: { type: 'radar', height: 300 },
      series: [
        { name: 's', k: 'a', data: [10, 20, 30] },
        { name: 's', k: 'b', data: [60, 70, 90] },
      ],
      xaxis: { categories: ['x', 'y', 'z'] },
    })
    for (const chart of [spark, radar]) {
      const panels = chart.getPanels()
      expect(panels.length).toBeGreaterThan(0)
      for (const p of panels) {
        expect(p.chart.panelTopBand).toBeUndefined()
      }
    }
  })
})
