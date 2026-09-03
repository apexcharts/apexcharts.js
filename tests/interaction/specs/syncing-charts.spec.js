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

  test('side-by-side sparklines translate the pointer into each chart', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'syncing-charts')
    await page.evaluate(async () => {
      window.chart.destroy()
      window.chartLine2.destroy()
      window.chartArea.destroy()
      document.body.innerHTML =
        '<div style="display:flex"><div id="spark-a"></div><div id="spark-b"></div></div>'

      const options = (id, data) => ({
        chart: {
          id,
          group: 'sparks',
          type: 'line',
          width: 300,
          height: 80,
          sparkline: { enabled: true },
          animations: { enabled: false },
        },
        series: [{ data }],
        grid: { padding: { left: 110 } },
        markers: { size: 0 },
      })

      window.sparkA = new ApexCharts(
        document.querySelector('#spark-a'),
        options('spark-a', [25, 66, 41, 59, 25, 44, 12, 36, 9, 21]),
      )
      window.sparkB = new ApexCharts(
        document.querySelector('#spark-b'),
        options('spark-b', [12, 14, 2, 47, 32, 44, 14, 55, 41, 69]),
      )
      await Promise.all([window.sparkA.render(), window.sparkB.render()])
    })

    const box = await page.locator('#spark-a .apexcharts-svg').boundingBox()
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2)
    await page.waitForTimeout(80)

    for (const id of ['#spark-a', '#spark-b']) {
      await expect(page.locator(`${id} .apexcharts-tooltip`)).not.toHaveText('')
      await expect(page.locator(`${id} .apexcharts-xcrosshairs`)).toHaveClass(
        /apexcharts-active/,
      )
    }
    const indices = await page.evaluate(() => [
      window.sparkA.w.interact.capturedDataPointIndex,
      window.sparkB.w.interact.capturedDataPointIndex,
    ])
    expect(indices[1]).toBe(indices[0])
  })
})
