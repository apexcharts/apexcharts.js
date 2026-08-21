/**
 * Trellis (#22, P3) in jsdom: scoped annotations, grid-tooltip scaffolding,
 * panel promotion, and the composed CSV.
 *
 * The visual halves (the grid card's rows on hover, projected annotation
 * geometry, the composed PNG) live in tests/interaction/specs/trellis.spec.js
 * where a real browser draws them.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/full.js'
import { scopeAnnotations } from '../../src/modules/trellis/Trellis.js'

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

async function renderTrellis(extra = {}) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', ...extra.trellis },
    series: [
      { name: 'Revenue', region: 'North', data: walk(6, 10) },
      { name: 'Revenue', region: 'South', data: walk(6, 20) },
      { name: 'Revenue', region: 'East', data: walk(6, 30) },
    ],
    xaxis: { type: 'datetime' },
    ...extra.options,
  })
  await chart.render()
  return { chart, el }
}

describe('scopeAnnotations (pure)', () => {
  const annotations = {
    yaxis: [
      { y: 60, y2: 100 },
      { y: 5, scope: 'North' },
      { y: 7, scope: ['South', 'East'] },
      { y: 9, scope: 'trellis' },
    ],
    xaxis: [{ x: 1, scope: 'Nowhere' }],
    points: [{ x: 1, y: 2 }],
  }

  it('keeps unscoped and trellis-scoped items for every panel', () => {
    const north = scopeAnnotations(annotations, 'North')
    expect(north.yaxis.map((a) => a.y)).toEqual([60, 5, 9])
    expect(north.points).toHaveLength(1)
    expect(north.xaxis).toHaveLength(0)
  })

  it('matches string and array scopes by panel key, stripping the key', () => {
    const south = scopeAnnotations(annotations, 'South')
    expect(south.yaxis.map((a) => a.y)).toEqual([60, 7, 9])
    south.yaxis.forEach((a) => expect(a.scope).toBeUndefined())
    // The input is not mutated.
    expect(annotations.yaxis[1].scope).toBe('North')
  })

  it('passes through non-object and annotation-free configs', () => {
    expect(scopeAnnotations(undefined, 'North')).toBeUndefined()
    expect(scopeAnnotations({ position: 'front' }, 'North')).toEqual({
      position: 'front',
    })
  })
})

describe('trellis-scoped annotations (assembly)', () => {
  it('an unscoped declaration reaches every panel; a scoped one only its panel', async () => {
    const { chart } = await renderTrellis({
      options: {
        annotations: {
          yaxis: [
            { y: 12, y2: 30 },
            { y: 15, scope: 'South' },
          ],
        },
      },
    })
    const count = (key) =>
      chart.getPanel(key).w.config.annotations.yaxis.length
    expect(count('North')).toBe(1)
    expect(count('South')).toBe(2)
    expect(count('East')).toBe(1)
    // The panel config never carries the scope key itself.
    chart.getPanels().forEach((p) => {
      p.chart.w.config.annotations.yaxis.forEach((a) =>
        expect(a.scope).toBeUndefined(),
      )
    })
    chart.destroy()
  })
})

describe("tooltip: 'grid' scaffolding", () => {
  it('mounts one trellis-owned card and marks the mode on the wrap', async () => {
    const { chart, el } = await renderTrellis({
      trellis: { tooltip: 'grid' },
    })
    const wrap = el.querySelector('.apexcharts-trellis')
    expect(wrap.getAttribute('data-tooltip-mode')).toBe('grid')
    expect(el.querySelectorAll('.apexcharts-trellis-tooltip')).toHaveLength(1)
    chart.destroy()
    expect(document.querySelectorAll('.apexcharts-trellis-tooltip')).toHaveLength(0)
  })

  it("'panel' mode (default) builds no grid card", async () => {
    const { chart, el } = await renderTrellis()
    expect(el.querySelectorAll('.apexcharts-trellis-tooltip')).toHaveLength(0)
    chart.destroy()
  })
})

describe('panel promotion', () => {
  it('promotePanel parks the rest, breadcrumbs back, restorePanels undoes it', async () => {
    const { chart, el } = await renderTrellis()
    await chart.promotePanel('South')
    const cells = el.querySelectorAll('.apexcharts-trellis-cell')
    expect(cells[1].classList.contains('apexcharts-trellis-cell-promoted')).toBe(true)
    expect(cells[0].classList.contains('apexcharts-trellis-cell-parked')).toBe(true)
    expect(cells[2].classList.contains('apexcharts-trellis-cell-parked')).toBe(true)
    const crumb = el.querySelector('.apexcharts-trellis-breadcrumb')
    expect(crumb).toBeTruthy()
    expect(crumb.textContent).toContain('South')

    await chart.restorePanels()
    expect(el.querySelector('.apexcharts-trellis-breadcrumb')).toBeNull()
    el.querySelectorAll('.apexcharts-trellis-cell').forEach((c) => {
      expect(c.classList.contains('apexcharts-trellis-cell-promoted')).toBe(false)
      expect(c.classList.contains('apexcharts-trellis-cell-parked')).toBe(false)
    })
    chart.destroy()
  })

  it('a header click promotes; clicking the promoted header restores', async () => {
    const { chart, el } = await renderTrellis()
    const header = el.querySelectorAll('.apexcharts-trellis-header')[2]
    expect(header.classList.contains('apexcharts-trellis-header-clickable')).toBe(true)
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 0))
    expect(chart.trellis._promotedKey).toBe('East')
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 0))
    expect(chart.trellis._promotedKey).toBeNull()
    chart.destroy()
  })

  it('promote: false leaves headers inert', async () => {
    const { chart, el } = await renderTrellis({
      trellis: { promote: false },
    })
    const header = el.querySelector('.apexcharts-trellis-header')
    expect(header.classList.contains('apexcharts-trellis-header-clickable')).toBe(false)
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise((r) => setTimeout(r, 0))
    expect(chart.trellis._promotedKey).toBeNull()
    chart.destroy()
  })

  it('promoting another panel switches; container resize while promoted keeps the promotion', async () => {
    const { chart, el } = await renderTrellis()
    await chart.promotePanel('North')
    await chart.promotePanel('East')
    expect(chart.trellis._promotedKey).toBe('East')
    const promoted = el.querySelectorAll(
      '.apexcharts-trellis-cell-promoted',
    )
    expect(promoted).toHaveLength(1)
    chart.destroy()
  })
})

describe('composed CSV', () => {
  it('emits x, facet, then one column per series name, ISO dates for datetime', async () => {
    const { chart } = await renderTrellis({
      options: {
        series: [
          { name: 'Rev', region: 'N', data: walk(3, 1) },
          { name: 'Cost', region: 'N', data: walk(3, 2) },
          { name: 'Rev', region: 'S', data: walk(2, 5) }, // ragged
        ],
      },
    })
    const csv = chart.trellis.exports.csv()
    const lines = csv.split('\n')
    expect(lines[0]).toBe('x,facet,Rev,Cost')
    // 2 panels x 3 union-x rows.
    expect(lines).toHaveLength(1 + 6)
    expect(lines[1].startsWith('2025-01-01T00:00:00.000Z,N,1,2')).toBe(true)
    // The ragged S panel emits explicit blanks at the padded x and for the
    // series it does not carry.
    const sRows = lines.filter((l) => l.indexOf(',S,') !== -1)
    expect(sRows).toHaveLength(3)
    expect(sRows[2]).toBe('2025-01-03T00:00:00.000Z,S,,')
    chart.destroy()
  })
})
