/**
 * The tooltip must not stay visible when the pointer leaves the plot sideways.
 *
 * Reported from the field with a repro page: on a column chart configured
 * `tooltip: { shared: false, intersect: false }`, hovering the y-axis labels
 * or the padding past the last column left the card on screen. Cold, it showed
 * as an empty 2px box pinned at the chart's top-left; warm, it kept captioning
 * whichever column was hovered last. In both cases `data-positioned` was
 * absent: the card was activated but never placed.
 *
 * Root cause: `intersect: false` is what gives a plain bar chart ONE listener
 * over the whole SVG instead of one per bar, so the margin is hoverable at
 * all. `handleStickyTooltip` correctly calls `handleMouseOut` once `hoverX`
 * leaves the grid, but `axisChartsTooltips` then ended by adding
 * `apexcharts-active` unconditionally, undoing it. (The vertical guard higher
 * up in the same method returns instead, which is why hovering ABOVE the plot
 * was always fine.)
 *
 * Fix: `handleMouseOut` records the decision and `axisChartsTooltips` returns
 * rather than reactivating.
 *
 * NOTE these charts are built from scratch rather than by updating a sample:
 * the tooltip module reads `intersect` once, at construction, so configuring
 * it through `updateOptions` would leave the chart on the per-bar listeners
 * and test nothing.
 */

import { test, expect } from '../fixtures/base.js'

/** Build a column chart with the given tooltip config and return its grid box. */
async function mount(page, tooltip) {
  await page.evaluate(async (tooltip) => {
    window.chart?.destroy()
    document.querySelector('#chart').innerHTML = ''
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'bar', height: 380, animations: { enabled: false } },
      series: [{ name: 'Leads', data: [63336, 57161, 57619, 63856, 53711] }],
      xaxis: {
        categories: ['Americas', 'APAC', 'EMEA', 'India', 'Japan'],
      },
      yaxis: { labels: { formatter: (v) => Math.round(v / 1000) + 'K' } },
      tooltip,
    })
    window.chart = chart
    await chart.render()
  }, tooltip)
  await page.waitForTimeout(250)

  return page.evaluate(() => {
    const el = document.querySelector('#chart').getBoundingClientRect()
    const g = document.querySelector('.apexcharts-grid').getBoundingClientRect()
    return {
      elLeft: el.left,
      elRight: el.right,
      gridLeft: g.left,
      gridRight: g.right,
      midY: (g.top + g.bottom) / 2,
    }
  })
}

/** Tooltip state as the page sees it: visible, and did it get placed? */
const readTooltip = (page) =>
  page.evaluate(() => {
    const tip = document.querySelector('.apexcharts-tooltip')
    return {
      active: tip.classList.contains('apexcharts-active'),
      positioned: tip.getAttribute('data-positioned'),
      opacity: parseFloat(getComputedStyle(tip).opacity),
    }
  })

const CONFIGS = {
  // The exact combination from the report.
  'shared: false, intersect: false': { shared: false, intersect: false },
  // The shared variant reaches the same sticky handler.
  'shared: true, intersect: false': { shared: true, intersect: false },
}

test.describe('Tooltip in the plot margin', () => {
  for (const [name, tooltip] of Object.entries(CONFIGS)) {
    test(`stays hidden outside the plot (${name})`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('column', 'basic-column')
      const box = await mount(page, tooltip)

      // The config has to be in force, or this test proves nothing: with
      // intersect left on, the margin carries no listener to get wrong.
      expect(
        await page.evaluate(() => window.chart.tooltip.showOnIntersect),
      ).toBe(false)

      // Cold: nothing has ever been shown. Over the y-axis labels, which are
      // inside the chart element but left of the plot.
      await page.mouse.move(box.elLeft + 4, box.midY)
      await page.waitForTimeout(250)
      expect((await readTooltip(page)).active, 'left of the plot, cold').toBe(
        false,
      )

      // Warm: show a real card first, so there is something to leave behind.
      await page.mouse.move((box.gridLeft + box.gridRight) / 2, box.midY)
      await page.waitForTimeout(250)
      expect((await readTooltip(page)).active, 'over the plot').toBe(true)

      // Out to the right, past the last column, still inside the chart element.
      await page.mouse.move(box.elRight - 2, box.midY)
      await page.waitForTimeout(250)
      const right = await readTooltip(page)
      expect(right.active, 'right of the plot, warm').toBe(false)
      expect(right.opacity, 'right of the plot, warm').toBeLessThan(0.1)

      // And back out to the left, which is where the empty box used to appear.
      await page.mouse.move((box.gridLeft + box.gridRight) / 2, box.midY)
      await page.waitForTimeout(250)
      await page.mouse.move(box.elLeft + 4, box.midY)
      await page.waitForTimeout(250)
      expect((await readTooltip(page)).active, 'left of the plot, warm').toBe(
        false,
      )
    })

    test(`still tracks across the whole plot (${name})`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('column', 'basic-column')
      const box = await mount(page, tooltip)
      const width = box.gridRight - box.gridLeft

      // The plot's own edge pixels count as inside it. A grid rarely lands on
      // a whole pixel, so the leftmost column measures a hair negative, and
      // the first point of a line chart sits exactly there: bounding the hover
      // at a bare 0 hides the tooltip on the point you are pointing at.
      for (const [label, x] of [
        ['the left edge pixel', box.gridLeft],
        ['the right edge pixel', box.gridRight],
      ]) {
        await page.mouse.move(box.gridLeft + width * 0.5, box.midY)
        await page.waitForTimeout(120)
        await page.mouse.move(x, box.midY)
        await page.waitForTimeout(150)
        expect((await readTooltip(page)).active, label).toBe(true)
      }

      // A sticky tooltip answers anywhere over the plot, on a column or
      // between two: the fix must not have narrowed that to the bars.
      for (let f = 0.05; f < 1; f += 0.1) {
        await page.mouse.move(box.gridLeft + width * f, box.midY)
        await page.waitForTimeout(120)
        const state = await readTooltip(page)
        expect(state.active, `at ${Math.round(f * 100)}% across the plot`).toBe(
          true,
        )
        expect(
          state.positioned,
          `at ${Math.round(f * 100)}% across the plot`,
        ).toBe('true')
      }
    })
  }
})
