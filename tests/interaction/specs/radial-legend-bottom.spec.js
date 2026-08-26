/**
 * #4875: "Legend position bottom regression since v3.54". On a radialBar in a
 * container taller than it is wide, the legend is not under the rings, and on
 * 3.54 through 5.x it hung outside the SVG entirely (clipped, or invisible).
 *
 * Cause, recovered from the reporter's fiddle (250x500 box, chart.height 350):
 * Pie's constructor set the vertical centre from `defaultSize`, which is
 * min(gridWidth, gridHeight). When the height is the LARGER side that is the
 * width, so the circle was centred as if the band were only as tall as it is
 * wide: the rings stuck to the top of the band and the entire vertical surplus
 * piled up underneath them, with the bottom legend still pinned to the band's
 * bottom edge. Measured on the reporter's config, the void between rings and
 * legend was 111px of a 350px chart.
 *
 * The tell is that the pre-fix centre does not depend on the height at all:
 * make the container 200px taller and the rings do not move. That is what the
 * first test pins, because it separates the two behaviours by ~100px rather
 * than by a few px of tolerance.
 *
 * Every square or wide layout is untouched: there defaultSize already IS
 * gridHeight, so the arithmetic is unchanged. The last test is that invariant.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const test = base.extend({
  /**
   * Renders one chart in a box of the given size and reports where the drawn
   * circle sits relative to the SVG, the band it was given, and the legend.
   */
  measure: async ({ page }, use) => {
    /**
     * @param {{type: string, boxW: number, boxH: number, chartH: number,
     *          position?: string}} spec
     */
    const measure = async (spec) => {
      await page.goto('about:blank')
      await page.setContent(
        `<body style="margin:0"><div id="c" style="width:${spec.boxW}px;height:${spec.boxH}px"></div></body>`,
      )
      await page.addScriptTag({ path: distPath })
      return page.evaluate(async (spec) => {
        const isRadial = spec.type === 'radialBar'
        const chart = new ApexCharts(document.querySelector('#c'), {
          chart: {
            type: spec.type,
            height: spec.chartH,
            animations: { enabled: false },
          },
          series: isRadial ? [25, 35] : [25, 35, 20],
          labels: isRadial ? ['Min', 'Max'] : ['A', 'B', 'C'],
          legend: { show: true, position: spec.position || 'bottom' },
        })
        await chart.render()
        await new Promise((r) => requestAnimationFrame(() => r()))

        const svg = document
          .querySelector('.apexcharts-svg')
          .getBoundingClientRect()
        const plot = document
          .querySelector('.apexcharts-radialbar, .apexcharts-pie')
          .getBoundingClientRect()
        const legend = document
          .querySelector('.apexcharts-legend')
          .getBoundingClientRect()
        const w = chart.w
        return {
          svgH: Math.round(svg.height),
          gridH: Math.round(w.layout.gridHeight),
          gridW: Math.round(w.layout.gridWidth),
          translateY: Math.round(w.layout.translateY),
          plotTop: Math.round(plot.top - svg.top),
          plotBottom: Math.round(plot.bottom - svg.top),
          plotCenter: Math.round((plot.top + plot.bottom) / 2 - svg.top),
          legendTop: Math.round(legend.top - svg.top),
          legendBottom: Math.round(legend.bottom - svg.top),
        }
      }, spec)
    }
    await use(measure)
  },
})

test.describe('Radial and pie centring with a bottom legend (#4875)', () => {
  for (const type of ['radialBar', 'pie', 'donut', 'polarArea']) {
    test(`${type}: the circle follows the height it is given`, async ({
      measure,
    }) => {
      // Same width, 200px more height. The circle cannot grow (it is
      // width-limited either way), so its CENTRE should drop by about half the
      // extra height. Pre-fix it did not move at all.
      const short = await measure({ type, boxW: 250, boxH: 400, chartH: 300 })
      const tall = await measure({ type, boxW: 250, boxH: 600, chartH: 500 })

      expect(tall.gridH - short.gridH).toBe(200) // the band really did grow
      const moved = tall.plotCenter - short.plotCenter
      expect(moved).toBeGreaterThan(85)
      expect(moved).toBeLessThan(115)
    })
  }

  test('radialBar: the surplus is split above and below, not dumped below', async ({
    measure,
  }) => {
    // The reporter's exact fiddle: #apexChart { width: 250px; height: 500px }
    // with chart.height 350.
    const m = await measure({
      type: 'radialBar',
      boxW: 250,
      boxH: 500,
      chartH: 350,
    })

    const above = m.plotTop - m.translateY
    const below = m.translateY + m.gridH - m.plotBottom
    // pre-fix: 46 above, 92 below
    expect(Math.abs(above - below)).toBeLessThan(30)
    expect(below).toBeLessThan(above + 30)
  })

  test('the legend stays inside the SVG, which is what was clipped', async ({
    measure,
  }) => {
    for (const spec of [
      { type: 'radialBar', boxW: 250, boxH: 500, chartH: 350 },
      { type: 'radialBar', boxW: 200, boxH: 220, chartH: 220 },
      { type: 'pie', boxW: 250, boxH: 500, chartH: 350 },
    ]) {
      const m = await measure(spec)
      // 3.54 through 5.x put the legend up to 65px past the bottom edge
      expect(m.legendBottom).toBeLessThanOrEqual(m.svgH)
      expect(m.legendTop).toBeGreaterThan(m.plotTop)
    }
  })

  test('square and wide layouts are untouched by the change', async ({
    measure,
  }) => {
    // Here gridHeight is already the smaller side, so the old and new
    // expressions are the same number. Asserted as a centring invariant that
    // held before the fix too.
    for (const spec of [
      { type: 'radialBar', boxW: 320, boxH: 320, chartH: 320 },
      { type: 'radialBar', boxW: 600, boxH: 300, chartH: 300 },
      { type: 'pie', boxW: 400, boxH: 320, chartH: 320 },
    ]) {
      const m = await measure(spec)
      expect(m.gridW).toBeGreaterThanOrEqual(m.gridH)
      const bandCenter = m.translateY + m.gridH / 2
      expect(Math.abs(m.plotCenter - bandCenter)).toBeLessThan(20)
    }
  })
})
