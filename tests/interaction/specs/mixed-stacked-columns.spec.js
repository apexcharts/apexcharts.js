/**
 * Mixed chart with `chart.stacked`, the columns must stack on each other.
 *
 * In a combo chart every series of a group lands in the same
 * `w.labelData.seriesGroups` bucket, columns and lines alike, but the stacked
 * renderer only draws the columns. Locating a column inside its stack by its
 * position in that bucket therefore counted the line series too, so a column
 * placed after a line looked for a layer beneath it that had never been drawn,
 * found nothing and restarted from the axis. The stack silently flattened into
 * overlapping bars (#5105).
 *
 * The defect only shows when a non-bar series sits BEFORE a column in the
 * series array, so both orders are measured here: reversing them is the whole
 * difference between a stack and a pile.
 */

import { test, expect } from '../fixtures/base.js'

const CATEGORIES = ['A', 'B', 'C', 'D']
const COLUMN_A = [100, 200, 300, 400]
const COLUMN_B = [50, 60, 70, 80]
const COLUMN_C = [30, 30, 30, 30]
const TREND = [180, 290, 400, 510]

const COLUMN_COUNT = 3
const EXPECTED_BARS = COLUMN_COUNT * CATEGORIES.length

// Stack layers are drawn edge to edge, so a closed seam is a sub-pixel affair.
// A broken stack restarts each layer at the axis, which is tens of pixels away,
// so this threshold separates the two cases by a wide margin either way.
const SEAM_TOLERANCE = 1

/**
 * Build a fresh stacked combo chart in the loaded page and wait until its
 * columns have real geometry.
 *
 * The sample is only there to provide the built bundle; the chart under test is
 * created here so the series order can be flipped. `redrawOnParentResize` is
 * off because a resize would schedule a debounced update behind the measurement.
 */
async function renderMixedStack(page, { lineFirst }) {
  await page.evaluate(
    async ({ lineFirst, categories, a, b, c, trend }) => {
      window.chart.destroy()

      const host = document.createElement('div')
      host.id = 'stack-under-test'
      host.style.width = '700px'
      document.body.appendChild(host)

      const columns = [
        { name: 'ColA', type: 'column', data: a },
        { name: 'ColB', type: 'column', data: b },
        { name: 'ColC', type: 'column', data: c },
      ]
      const line = { name: 'Trend', type: 'line', data: trend }

      // Only the line is stroked. A stroke on a column shrinks its painted box
      // by half the stroke on every side, which would move the seam the test is
      // measuring for reasons that have nothing to do with stacking.
      const chart = new ApexCharts(host, {
        series: lineFirst ? [line, ...columns] : [...columns, line],
        chart: {
          type: 'line',
          height: 400,
          stacked: true,
          animations: { enabled: false },
          redrawOnParentResize: false,
        },
        stroke: { width: lineFirst ? [3, 0, 0, 0] : [0, 0, 0, 3] },
        xaxis: { categories },
      })
      window.chart = chart
      await chart.render()
    },
    {
      lineFirst,
      categories: CATEGORIES,
      a: COLUMN_A,
      b: COLUMN_B,
      c: COLUMN_C,
      trend: TREND,
    },
  )

  await page.waitForFunction(
    (expectedBars) => {
      const bars = document.querySelectorAll(
        '#stack-under-test .apexcharts-bar-area',
      )
      return (
        bars.length === expectedBars &&
        [...bars].every((bar) => bar.getBoundingClientRect().height > 0)
      )
    },
    EXPECTED_BARS,
    { timeout: 10_000 },
  )
}

/**
 * Painted box of every column, keyed by series name and indexed by category.
 */
async function readColumnStacks(page) {
  return page.evaluate(() => {
    /** @type {Record<string, {top: number, bottom: number}[]>} */
    const stacks = {}
    const groups = document.querySelectorAll(
      '#stack-under-test .apexcharts-series',
    )
    for (const group of groups) {
      const bars = [...group.querySelectorAll('.apexcharts-bar-area')]
      if (!bars.length) continue
      stacks[group.getAttribute('seriesName')] = bars.map((bar) => {
        const box = bar.getBBox()
        return { top: box.y, bottom: box.y + box.height }
      })
    }
    return stacks
  })
}

for (const lineFirst of [false, true]) {
  const order = lineFirst
    ? 'the line series declared before the columns'
    : 'the line series declared after the columns'

  test.describe(`Stacked combo chart, ${order}`, () => {
    test('every column sits on the one below it, not on the axis', async ({
      page,
      loadChart,
    }) => {
      await loadChart('mixed', 'line-column')
      await renderMixedStack(page, { lineFirst })

      const stacks = await readColumnStacks(page)
      expect(Object.keys(stacks).sort()).toEqual(['ColA', 'ColB', 'ColC'])

      for (let j = 0; j < CATEGORIES.length; j++) {
        const base = stacks.ColA[j]
        const middle = stacks.ColB[j]
        const top = stacks.ColC[j]

        expect(
          Math.abs(middle.bottom - base.top),
          `ColB should start at the top of ColA in category ${CATEGORIES[j]}`,
        ).toBeLessThan(SEAM_TOLERANCE)
        expect(
          Math.abs(top.bottom - middle.top),
          `ColC should start at the top of ColB in category ${CATEGORIES[j]}`,
        ).toBeLessThan(SEAM_TOLERANCE)

        // The flattened stack the defect produced: every layer shares the
        // baseline of the first one. Asserted directly so a regression cannot
        // pass by collapsing the seams onto the axis together.
        expect(
          Math.abs(middle.bottom - base.bottom),
          `ColB should not be redrawn from the axis in category ${CATEGORIES[j]}`,
        ).toBeGreaterThan(SEAM_TOLERANCE)
        expect(
          Math.abs(top.bottom - base.bottom),
          `ColC should not be redrawn from the axis in category ${CATEGORIES[j]}`,
        ).toBeGreaterThan(SEAM_TOLERANCE)
      }
    })
  })
}
