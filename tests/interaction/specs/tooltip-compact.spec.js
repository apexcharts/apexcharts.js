/**
 * Two tooltip behaviours that only show up on SMALL charts.
 *
 * 1. `tooltip.compact` — a tight box instead of a card, for panels a normal
 *    card would cover. One series collapses to a single line (x label inline,
 *    no marker, no series name); several series keep their stacked rows,
 *    because the names are what tells the rows apart.
 *
 * 2. A grouped cell chart keeps its own per-CELL tooltip. Grouped charts fall
 *    back to the sticky (one x index, every series row, anchored to the axis)
 *    tooltip so siblings caption the same column, but a heatmap/treemap is
 *    hit-tested per cell: that fallback turned a one-line cell tooltip into an
 *    all-rows card pinned to the first column, which is what a trellis of
 *    heatmaps showed.
 */

import { test, expect } from '../fixtures/base.js'

const umdPath = 'dist/apexcharts.js'
// Trellis is Tier 2 and ships outside the full bundle; the grouped-panel
// cases below need the add-on layered on top, as a script-tag page would.
const trellisAddonPath = 'dist/features/trellis.js'

async function mount(page, optsSrc, { width = 640 } = {}) {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.setContent(`<div id="stage" style="width:${width}px"></div>`)
  await page.addScriptTag({ path: umdPath })
  await page.addScriptTag({ path: trellisAddonPath })
  await page.evaluate((src) => {
    const opts = eval(`(${src})`)
    window.chart = new window.ApexCharts(document.querySelector('#stage'), opts)
    return window.chart.render()
  }, optsSrc)
  await page.waitForFunction(
    () => window.chart && window.chart.w.globals.animationEnded === true,
    { timeout: 10_000 },
  )
  return errors
}

/** Hover the middle of the plot and read the tooltip box. */
async function hoverAndRead(page, selector = '.apexcharts-tooltip') {
  const box = await page.evaluate(() => {
    const g = document.querySelector('.apexcharts-grid').getBoundingClientRect()
    return { x: g.left + g.width * 0.55, y: g.top + g.height * 0.5 }
  })
  await page.mouse.move(box.x, box.y)
  await page.waitForTimeout(150)
  return page.evaluate((sel) => {
    const tt = document.querySelector(sel)
    const r = tt.getBoundingClientRect()
    const label = tt.querySelector('.apexcharts-tooltip-text-y-label')
    const marker = tt.querySelector(
      '.apexcharts-tooltip-series-group.apexcharts-active .apexcharts-tooltip-marker',
    )
    const vis = (el) => !!el && getComputedStyle(el).display !== 'none'
    return {
      classes: tt.className,
      w: Math.round(r.width),
      h: Math.round(r.height),
      rows: tt.querySelectorAll(
        '.apexcharts-tooltip-series-group.apexcharts-active',
      ).length,
      labelVisible: vis(label),
      markerVisible: vis(marker),
      direction: getComputedStyle(tt).flexDirection,
    }
  }, selector)
}

const LINE = (compact, series) => `{
  chart: { type: 'line', height: 120, animations: { enabled: false } },
  tooltip: { compact: ${compact} },
  dataLabels: { enabled: false },
  xaxis: { type: 'numeric' },
  series: ${series},
}`

const ONE = `[{ name: 'Activation rate', data: [[1,4],[2,5],[3,4.4],[4,6],[5,5.2]] }]`
const TWO = `[
  { name: 'Activation rate', data: [[1,4],[2,5],[3,4.4],[4,6],[5,5.2]] },
  { name: 'Churn rate', data: [[1,2],[2,2.4],[3,2.1],[4,3],[5,2.6]] }
]`

test.describe('tooltip.compact', () => {
  test('one series collapses to a single line, no marker, no series name', async ({
    page,
  }) => {
    const errors = await mount(page, LINE(true, ONE))
    const compact = await hoverAndRead(page)
    expect(compact.classes).toContain('apexcharts-tooltip-compact')
    expect(compact.classes).toContain('apexcharts-tooltip-value-only')
    // One line: the x label sits beside the value, not above it.
    expect(compact.direction).toBe('row')
    expect(compact.labelVisible).toBe(false)
    expect(compact.markerVisible).toBe(false)
    expect(compact.h).toBeLessThan(32)

    // The default card, same chart, for the comparison the option exists for.
    await mount(page, LINE(false, ONE))
    const card = await hoverAndRead(page)
    expect(card.classes).not.toContain('apexcharts-tooltip-compact')
    expect(card.direction).toBe('column')
    expect(card.labelVisible).toBe(true)
    expect(card.h).toBeGreaterThan(compact.h)
    expect(errors).toHaveLength(0)
  })

  test('several series keep their names and stay stacked', async ({ page }) => {
    const errors = await mount(page, LINE(true, TWO))
    const t = await hoverAndRead(page)
    expect(t.classes).toContain('apexcharts-tooltip-compact')
    // Not value-only: the names are the only thing distinguishing the rows.
    expect(t.classes).not.toContain('apexcharts-tooltip-value-only')
    expect(t.direction).toBe('column')
    expect(t.rows).toBe(2)
    expect(t.labelVisible).toBe(true)
    expect(errors).toHaveLength(0)
  })
})

test.describe('grouped heatmaps keep their per-cell tooltip', () => {
  const GROUPED = (id) => `{
    chart: {
      id: '${id}', group: 'cells', type: 'heatmap', height: 220,
      animations: { enabled: false },
    },
    dataLabels: { enabled: false },
    series: ['Mon','Tue','Wed'].map(function (r, ri) {
      return {
        name: r,
        data: Array.from({ length: 6 }, function (_, i) {
          return { x: 'h' + i, y: 10 + ri * 20 + i * 7 }
        }),
      }
    }),
  }`

  test('the card names ONE cell and follows it across the row', async ({
    page,
  }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.setContent(
      '<div id="a" style="width:520px"></div><div id="b" style="width:520px"></div>',
    )
    await page.addScriptTag({ path: umdPath })
    await page.addScriptTag({ path: trellisAddonPath })
    await page.evaluate(
      ([srcA, srcB]) => {
        window.a = new window.ApexCharts(
          document.querySelector('#a'),
          eval(`(${srcA})`),
        )
        window.b = new window.ApexCharts(
          document.querySelector('#b'),
          eval(`(${srcB})`),
        )
        return Promise.all([window.a.render(), window.b.render()])
      },
      [GROUPED('cellsA'), GROUPED('cellsB')],
    )
    await page.waitForTimeout(400)

    const cells = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#a .apexcharts-heatmap-rect'))
        .filter((_, i) => i === 1 || i === 4)
        .map((r) => {
          const b = r.getBoundingClientRect()
          return {
            val: r.getAttribute('val'),
            x: b.x + b.width / 2,
            y: b.y + b.height / 2,
          }
        }),
    )
    const seen = []
    for (const c of cells) {
      await page.mouse.move(c.x, c.y)
      await page.waitForTimeout(150)
      seen.push(
        await page.evaluate(() => {
          const tt = document.querySelector('#a .apexcharts-tooltip')
          const r = tt.getBoundingClientRect()
          return {
            rows: tt.querySelectorAll(
              '.apexcharts-tooltip-series-group.apexcharts-active',
            ).length,
            text: tt.textContent.replace(/\s+/g, ' ').trim(),
            left: Math.round(r.left),
          }
        }),
      )
    }
    // ONE row, naming the hovered cell's own series (not every row at that x).
    expect(seen[0].rows).toBe(1)
    expect(seen[1].rows).toBe(1)
    expect(seen[0].text).toContain(cells[0].val)
    expect(seen[1].text).toContain(cells[1].val)
    // And it MOVES: the sticky fallback pinned it to the first column.
    expect(Math.abs(seen[0].left - seen[1].left)).toBeGreaterThan(20)
    expect(errors).toHaveLength(0)
  })
})
