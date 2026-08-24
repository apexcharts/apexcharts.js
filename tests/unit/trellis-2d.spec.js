/**
 * Trellis (#22, P4): two-dimensional faceting, in jsdom.
 *
 * The pure split/scales halves plus the orchestration contract (strips,
 * empty-panel policies, per-group bounds). The pixel gates (placeholder
 * alignment, identical ticks along a row) live in
 * tests/interaction/specs/trellis.spec.js.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/full.js'
// Trellis is Tier 2: `entries/full.js` no longer registers it, so the feature
// has to be imported the same way an application imports it.
import '../../src/features/trellis.js'
import { split, placeholderSeries } from '../../src/modules/trellis/TrellisSplit.js'
import * as TrellisScales from '../../src/modules/trellis/TrellisScales.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const walk = (n, base) =>
  Array.from({ length: n }, (_, i) => [
    Date.UTC(2025, 0, 1) + i * 86400000,
    base + i,
  ])

/** dept x quarter fixture with (Support, Q2) missing. */
const SERIES_2D = [
  { name: 'Hours', dept: 'Sales', quarter: 'Q1', data: walk(4, 10) },
  { name: 'Hours', dept: 'Sales', quarter: 'Q2', data: walk(4, 12) },
  { name: 'Hours', dept: 'Support', quarter: 'Q1', data: walk(4, 30) },
  // (Support, Q2) intentionally missing
]

describe('2-D split (pure)', () => {
  it('emits every (row, column) combination in row-major order, marking gaps', () => {
    const r = split(SERIES_2D, { row: 'dept', column: 'quarter' })
    expect(r.mode).toBe('2d')
    expect(r.rowKeys).toEqual(['Sales', 'Support'])
    expect(r.colKeys).toEqual(['Q1', 'Q2'])
    expect(r.panels.map((p) => p.key)).toEqual([
      'Sales / Q1',
      'Sales / Q2',
      'Support / Q1',
      'Support / Q2',
    ])
    expect(r.panels.map((p) => p.empty)).toEqual([false, false, false, true])
    expect(r.panels[2].rowKey).toBe('Support')
    expect(r.panels[2].colKey).toBe('Q1')
  })

  it('reference semantics per dimension: row-only spans the row, column-only the column, keyless everywhere', () => {
    const r = split(
      [
        ...SERIES_2D,
        { name: 'RowRef', dept: 'Sales', data: walk(4, 1) },
        { name: 'ColRef', quarter: 'Q2', data: walk(4, 2) },
        { name: 'AllRef', data: walk(4, 3) },
      ],
      { row: 'dept', column: 'quarter' },
    )
    const names = (key) =>
      r.panels.find((p) => p.key === key).seriesNames
    expect(names('Sales / Q1')).toEqual(['Hours', 'RowRef', 'AllRef'])
    expect(names('Sales / Q2')).toEqual(['Hours', 'RowRef', 'ColRef', 'AllRef'])
    expect(names('Support / Q1')).toEqual(['Hours', 'AllRef'])
    // The gap combination carries the column and global references only.
    expect(names('Support / Q2')).toEqual(['ColRef', 'AllRef'])
    expect(r.panels.find((p) => p.key === 'Support / Q2').empty).toBe(false)
  })

  it('row alone is a single-column strip; by is ignored with a warning', () => {
    const r = split(
      [
        { name: 's', dept: 'A', facet: 'X', data: walk(3, 1) },
        { name: 's', dept: 'B', facet: 'Y', data: walk(3, 2) },
      ],
      { row: 'dept', by: 'facet' },
    )
    expect(r.mode).toBe('2d')
    expect(r.rowKeys).toEqual(['A', 'B'])
    expect(r.colKeys).toEqual([''])
    expect(r.panels.map((p) => p.key)).toEqual(['A', 'B'])
    expect(r.warnings.some((w) => w.includes('mutually exclusive'))).toBe(true)
  })

  it('placeholderSeries aligns a valueless series to the union x in the dominant form', () => {
    const r = split(SERIES_2D, { row: 'dept', column: 'quarter' })
    const ph = placeholderSeries(r)
    expect(ph.name).toBe('Hours')
    expect(ph.data).toHaveLength(r.unionX.length)
    expect(ph.data[0]).toEqual([r.unionX[0], null])
    // Bar-family types get degenerate zero marks (the numeric bar pad only
    // engages for series that draw; nulls would misalign the placeholder).
    const bar = placeholderSeries(r, { chartType: 'bar' })
    expect(bar.data[0]).toEqual([r.unionX[0], 0])
    const ohlc = placeholderSeries(r, { chartType: 'candlestick' })
    expect(ohlc.data[0]).toEqual([r.unionX[0], [0, 0, 0, 0]])
  })
})

describe('2-D group scales (pure)', () => {
  it('independent-row: one bounds set per row over that row union', () => {
    const r = split(SERIES_2D, { row: 'dept', column: 'quarter' })
    const scales = TrellisScales.resolve(
      r,
      { scales: { y: 'independent-row' } },
      { chartType: 'line' },
    )
    expect(scales.y).toBeNull()
    expect(scales.rowY.size).toBe(2)
    const sales = scales.rowY.get('Sales')
    const support = scales.rowY.get('Support')
    // Sales spans 10..15 across Q1+Q2; Support spans 30..33.
    expect(sales.max).toBeLessThan(support.min + support.max)
    expect(sales.min).not.toBe(support.min)
    expect(sales.tickAmount).toBeGreaterThan(0)
  })

  it('independent-column: one bounds set per column', () => {
    const r = split(SERIES_2D, { row: 'dept', column: 'quarter' })
    const scales = TrellisScales.resolve(
      r,
      { scales: { y: 'independent-column' } },
      { chartType: 'line' },
    )
    expect(scales.colY.size).toBe(2)
    // Q1 union covers Sales 10.. and Support ..33; Q2 covers Sales only.
    expect(scales.colY.get('Q1').max).toBeGreaterThan(
      scales.colY.get('Q2').max,
    )
  })
})

describe('2-D lifecycle', () => {
  async function render2d(extra = {}) {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 500, animations: { enabled: false } },
      trellis: { row: 'dept', column: 'quarter', ...extra.trellis },
      series: SERIES_2D,
      xaxis: { type: 'datetime' },
      ...extra.options,
    })
    await chart.render()
    return { chart, el }
  }

  it('renders R x C cells with column strips once on top, row strips once on the left', async () => {
    const { chart, el } = await render2d()
    expect(el.querySelectorAll('.apexcharts-trellis-cell')).toHaveLength(4)
    expect(el.querySelectorAll('.apexcharts-trellis-strip-column')).toHaveLength(2)
    expect(el.querySelectorAll('.apexcharts-trellis-strip-row')).toHaveLength(2)
    expect(el.querySelectorAll('.apexcharts-trellis-corner')).toHaveLength(1)
    // No per-cell headers in 2-D: the strips replace them.
    expect(el.querySelectorAll('.apexcharts-trellis-header')).toHaveLength(0)
    const grid = el.querySelector('.apexcharts-trellis-grid')
    expect(grid.style.gridTemplateColumns).toContain('auto repeat(2')
    chart.destroy()
  })

  it("'placeholder' (default) mounts a REAL panel for the missing combination", async () => {
    const { chart, el } = await render2d()
    const gap = chart.getPanel('Support / Q2')
    expect(gap).toBeTruthy()
    expect(gap.w.config.series[0].name).toBe('Hours')
    expect(
      gap.w.config.series[0].data.every((d) => d[1] === null),
    ).toBe(true)
    // Same shared bounds as every other panel: the alignment precondition.
    const ref = chart.getPanel('Sales / Q1').w.config.yaxis[0]
    expect(gap.w.config.yaxis[0].min).toBe(ref.min)
    expect(gap.w.config.yaxis[0].max).toBe(ref.max)
    expect(
      el.querySelectorAll('.apexcharts-trellis-empty-label'),
    ).toHaveLength(1)
    chart.destroy()
  })

  it("'skip' and 'hide' keep the slot but mount nothing", async () => {
    for (const mode of ['skip', 'hide']) {
      const { chart, el } = await render2d({
        trellis: { emptyPanels: mode },
      })
      expect(chart.getPanel('Support / Q2')).toBeNull()
      expect(el.querySelectorAll('.apexcharts-trellis-cell')).toHaveLength(4)
      expect(el.querySelectorAll('.apexcharts-canvas')).toHaveLength(3)
      if (mode === 'hide') {
        expect(
          el.querySelectorAll('.apexcharts-trellis-cell-hidden'),
        ).toHaveLength(1)
      }
      chart.destroy()
    }
  })

  it('independent-row pushes identical bounds along a row, different across rows', async () => {
    const { chart } = await render2d({
      trellis: { scales: { y: 'independent-row' } },
    })
    const y = (key) => chart.getPanel(key).w.config.yaxis[0]
    expect(y('Sales / Q1').min).toBe(y('Sales / Q2').min)
    expect(y('Sales / Q1').max).toBe(y('Sales / Q2').max)
    expect(y('Sales / Q1').tickAmount).toBe(y('Sales / Q2').tickAmount)
    expect(y('Support / Q1').max).not.toBe(y('Sales / Q1').max)
    chart.destroy()
  })

  it('header.formatter names the dimension for strips', async () => {
    const seen = []
    const { chart } = await render2d({
      trellis: {
        header: {
          formatter: (key, o) => {
            seen.push(o.dimension)
            return key.toUpperCase()
          },
        },
      },
    })
    expect(seen.sort()).toEqual(['column', 'column', 'row', 'row'])
    chart.destroy()
  })

  it('2-D ignores trellis.limit with a warning and keeps a fixed column count', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { chart } = await render2d({ trellis: { limit: 1 } })
    expect(chart.getPanels()).toHaveLength(4)
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('not applied to a 2-D')),
    ).toBe(true)
    warn.mockRestore()
    chart.destroy()
  })
})
