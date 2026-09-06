/**
 * Grouped charts: every member resolves the pointer in ITS OWN space.
 *
 * `Tooltip.seriesHover` fans a hover out to every chart in the group, handing
 * each member its own grid plus the pointer translated into that grid. The
 * rule that keeps the fan-out honest is a pairing rule: wherever a coordinate
 * is measured against a chart's own grid rect, it has to be measured from that
 * chart's translated pointer, never from the raw event, which belongs to
 * whichever sibling the cursor is actually over.
 *
 * Two consumers read a pointer against the grid outside the shared/sticky path
 * that `syncing-charts.spec.js` covers, and neither is exercised by the
 * side-by-side sparkline case:
 *
 *   1. the canvas heatmap hit test (`Intersect.handleHeatTreeTooltip`), which
 *      converts to grid-local pixels and asks the renderer which cell is under
 *      them. Pair it wrongly and the sibling resolves to "no cell", so its
 *      tooltip is hidden entirely rather than merely mispositioned.
 *   2. `followCursor` placement (`Position.js`), which anchors the box to the
 *      pointer. Pair it wrongly and the box lands outside the sibling's plot.
 *
 * Both are asserted here because both are invisible to the rest of the suite:
 * the canvas renderer is not in the default bundle, and no existing spec puts
 * `followCursor` in a group.
 */

import { test, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')

// Sub-pixel tolerance for comparing two charts' box offsets.
const TOLERANCE_PX = 1

/** Two heatmaps side by side in one group, sharing an x domain. */
async function buildGroupedHeatmaps(page, { renderer }) {
  await page.evaluate(
    async ({ renderer }) => {
      window.chart.destroy()
      document.body.innerHTML =
        '<div style="display:flex"><div id="hm-a"></div><div id="hm-b"></div></div>'

      const series = (seed) =>
        ['R1', 'R2', 'R3'].map((name, si) => ({
          name,
          data: Array.from({ length: 8 }, (_, i) => ({
            x: 'C' + i,
            y: ((i * 7 + si * 3 + seed) % 20) + 1,
          })),
        }))

      const options = (id, seed) => ({
        chart: {
          id,
          group: 'hm',
          type: 'heatmap',
          width: 320,
          height: 220,
          animations: { enabled: false },
          renderer,
          // Force the renderer choice rather than waiting for the point count
          // to cross the default threshold.
          rendererThreshold: 1,
        },
        series: series(seed),
        dataLabels: { enabled: false },
      })

      window.hmA = new ApexCharts(document.querySelector('#hm-a'), options('hm-a', 0))
      window.hmB = new ApexCharts(document.querySelector('#hm-b'), options('hm-b', 5))
      await Promise.all([window.hmA.render(), window.hmB.render()])
    },
    { renderer },
  )
  // A canvas heatmap paints its cells instead of animating them in, so it never
  // raises `animationEnded`. Wait on the renderer being live in both charts,
  // which is the state this test actually needs.
  await page.waitForFunction(
    () =>
      !!window.hmA?.w.globals.activeRenderer &&
      !!window.hmB?.w.globals.activeRenderer,
    { timeout: 10_000 },
  )
}

/** Which cell each member of the group thinks is hovered. */
function readCapturedCells(page) {
  return page.evaluate(() => ({
    a: {
      i: window.hmA.w.interact.capturedSeriesIndex,
      j: window.hmA.w.interact.capturedDataPointIndex,
    },
    b: {
      i: window.hmB.w.interact.capturedSeriesIndex,
      j: window.hmB.w.interact.capturedDataPointIndex,
    },
    bActive: !!document.querySelector('#hm-b .apexcharts-tooltip.apexcharts-active'),
    bText: (
      document.querySelector('#hm-b .apexcharts-tooltip')?.textContent || ''
    ).trim(),
  }))
}

test.describe('Grouped charts translate the pointer per member', () => {
  test('a canvas heatmap sibling resolves the same cell as the hovered one', async ({
    page,
    loadChart,
  }) => {
    await loadChart('heatmap', 'basic')
    // The canvas renderer is an opt-in feature, not part of the default bundle
    // the samples load, so pull it in explicitly.
    await page.addScriptTag({
      path: resolve(rootDir, 'dist', 'features', 'renderer-canvas.js'),
    })
    await buildGroupedHeatmaps(page, { renderer: 'canvas' })

    const kinds = await page.evaluate(() => ({
      a: window.hmA.w.globals.activeRenderer?.kind,
      b: window.hmB.w.globals.activeRenderer?.kind,
    }))
    // Guard the guard: if the feature stops loading, this test would otherwise
    // pass as an SVG heatmap and quietly stop covering the canvas path.
    expect(kinds, 'expected both charts on the canvas renderer').toEqual({
      a: 'canvas',
      b: 'canvas',
    })

    const box = await page.locator('#hm-a .apexcharts-svg').boundingBox()
    await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.55)
    await page.waitForTimeout(150)

    const captured = await readCapturedCells(page)

    expect(captured.a.i, 'the hovered chart resolved no cell').toBeGreaterThan(-1)
    // The two charts share an x domain and identical geometry, so the sibling
    // must land on the same cell rather than off the plot.
    expect(
      captured.b,
      'the sibling resolved a different cell than the hovered chart',
    ).toEqual(captured.a)
    expect(captured.bActive, 'the sibling tooltip is hidden').toBe(true)
    expect(captured.bText, 'the sibling tooltip is empty').not.toBe('')
  })

  test('followCursor anchors each member inside its own plot', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'syncing-charts')
    await page.evaluate(async () => {
      window.chart.destroy()
      window.chartLine2.destroy()
      window.chartArea.destroy()
      document.body.innerHTML =
        '<div style="display:flex"><div id="fc-a"></div><div id="fc-b"></div></div>'

      const options = (id, data) => ({
        chart: {
          id,
          group: 'fc',
          type: 'line',
          width: 320,
          height: 200,
          animations: { enabled: false },
        },
        series: [{ name: 's', data }],
        tooltip: { followCursor: true },
        xaxis: { categories: data.map((_, i) => 'p' + i) },
      })

      window.fcA = new ApexCharts(
        document.querySelector('#fc-a'),
        options('fc-a', [10, 41, 35, 51, 49, 62, 69, 91, 148]),
      )
      window.fcB = new ApexCharts(
        document.querySelector('#fc-b'),
        options('fc-b', [22, 15, 60, 30, 44, 12, 80, 33, 70]),
      )
      await Promise.all([window.fcA.render(), window.fcB.render()])
    })
    await page.waitForFunction(
      () =>
        window.fcA?.w.globals.animationEnded === true &&
        window.fcB?.w.globals.animationEnded === true,
      { timeout: 10_000 },
    )

    const grid = await page.locator('#fc-a .apexcharts-grid').boundingBox()
    await page.mouse.move(grid.x + grid.width * 0.7, grid.y + grid.height / 2)
    await page.waitForTimeout(150)

    const boxes = await page.evaluate(() => {
      const read = (id) => {
        const tooltip = document.querySelector(`${id} .apexcharts-tooltip`)
        const gridRect = document
          .querySelector(`${id} .apexcharts-grid`)
          .getBoundingClientRect()
        const rect = tooltip.getBoundingClientRect()
        return {
          // Offset of the box inside its OWN plot: the number that has to match
          // across members, since the absolute positions never can.
          offsetInGrid: rect.left - gridRect.left,
          gridWidth: gridRect.width,
          text: tooltip.textContent.trim(),
        }
      }
      return { a: read('#fc-a'), b: read('#fc-b') }
    })

    expect(boxes.a.text, 'the hovered chart tooltip is empty').not.toBe('')
    expect(boxes.b.text, 'the sibling tooltip is empty').not.toBe('')

    // The charts are the same size and share an x domain, so the sibling's box
    // sits at the same offset inside its own plot as the hovered chart's.
    expect(
      Math.abs(boxes.b.offsetInGrid - boxes.a.offsetInGrid),
      'the sibling box is not at the same offset inside its own plot',
    ).toBeLessThanOrEqual(TOLERANCE_PX)

    // Stated directly, since the offset comparison alone would be satisfied by
    // both boxes being outside their plots by the same amount.
    expect(
      boxes.b.offsetInGrid,
      'the sibling box is left of its own plot',
    ).toBeGreaterThanOrEqual(-TOLERANCE_PX)
  })
})
