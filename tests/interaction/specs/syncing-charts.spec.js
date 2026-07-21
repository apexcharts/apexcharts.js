/**
 * Synchronized charts (chart.group) — tooltip sync interaction test.
 *
 * Regression guard for the group-tooltip bug: hovering one chart in a group
 * must show the tooltip on EVERY chart in the group, including the chart
 * actually under the cursor. Previously seriesHover() iterated
 * getGroupedCharts() (siblings only), so the hovered chart was the single one
 * left without a tooltip. The fix iterates getSyncedCharts() (self + siblings).
 *
 * Sample: line/syncing-charts.html renders three grouped charts into
 * #chart-line, #chart-line2 and #chart-area (all share chart.group 'website').
 */

import { test, expect } from '../fixtures/base.js'

// Dispatch a mousemove over a mid-plot data point of the chart rendered into
// `containerSelector`, reading pixel coords from that chart's own globals.
async function hoverChartAt(page, chartVar, dataPointIndex) {
  await page.evaluate(
    ([varName, di]) => {
      const chart = window[varName]
      const gl = chart.w.globals
      const xVals = gl.seriesXvalues[0]
      const step = xVals.length > 1 ? xVals[1] - xVals[0] : 10
      const x = gl.translateX + xVals[di] + Math.min(step / 2, 5)
      const y = gl.translateY + gl.seriesYvalues[0][di]

      const svgEl = chart.el.querySelector('.apexcharts-svg')
      const rect = svgEl.getBoundingClientRect()
      svgEl.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + x,
          clientY: rect.top + y,
        }),
      )
    },
    [chartVar, dataPointIndex],
  )
  await page.waitForTimeout(80)
}

// How many of the three grouped charts currently show an active tooltip.
async function activeTooltipContainers(page) {
  return page.evaluate(() =>
    ['#chart-line', '#chart-line2', '#chart-area'].filter((sel) => {
      const tt = document.querySelector(`${sel} .apexcharts-tooltip`)
      return tt && tt.classList.contains('apexcharts-active')
    }),
  )
}

test.describe('Synchronized charts tooltip sync', () => {
  test('hovering any grouped chart shows the tooltip on all three, including the hovered one', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'syncing-charts')

    // Hover the FIRST chart. Its own tooltip is the one the old code skipped.
    await hoverChartAt(page, 'chart', 6)
    let active = await activeTooltipContainers(page)
    expect(active).toContain('#chart-line') // the hovered chart itself
    expect(active).toHaveLength(3)

    // Hover the SECOND chart — same expectation from a different source chart.
    await hoverChartAt(page, 'chartLine2', 10)
    active = await activeTooltipContainers(page)
    expect(active).toContain('#chart-line2') // the hovered chart itself
    expect(active).toHaveLength(3)
  })
})
