/**
 * Blazor-ApexCharts #509: a line chart of {x, y} points whose string x
 * repeats (two readings landing in the same second of a live feed) drew no
 * line at all, while its tooltips kept updating.
 *
 * The x slots of a converted category axis were counted with each series
 * deduped by x, a rule meant for boxplot outliers stacked on one category
 * (#2706). A line came up one slot short per repeat, its last points had no x,
 * and the path was dropped. A line or area series now counts every point.
 *
 * Points are still placed by their array index, so the events report the
 * index of the point in the series the caller passed.
 */

import { test, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { hoverDataPoint, clickDataPoint, captureEvent } from '../helpers/chart.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const dup = [
  { x: '10:00:00', y: 5 },
  { x: '10:00:01', y: 6 },
  { x: '10:00:01', y: 9 },
]

async function mount(page, consoleErrors, series, type = 'line') {
  page.on('pageerror', (err) => consoleErrors.push(err.message))
  await page.setContent('<div id="chart" style="width:700px"></div>')
  await page.addScriptTag({ path: distPath })
  await page.evaluate(
    async ({ series, type }) => {
      window.chart = new ApexCharts(document.querySelector('#chart'), {
        // No toolbar, and headroom above the top point: the last point sits
        // in the plot's top-right corner, under the toolbar, where a hover
        // never reaches its marker.
        chart: {
          type,
          height: 300,
          animations: { enabled: false },
          toolbar: { show: false },
        },
        yaxis: { min: 0, max: 12 },
        stroke: { curve: 'straight' },
        series,
      })
      await window.chart.render()
    },
    { series, type },
  )
}

/** The drawn line of each series: its point count and whether it is finite. */
const lines = (page) =>
  page.$$eval('.apexcharts-series path.apexcharts-line', (paths) =>
    paths.map((p) => {
      const d = p.getAttribute('d') || ''
      return { points: (d.match(/[ML]/g) || []).length, nan: /NaN/.test(d) }
    }),
  )

test.describe('Repeated string x on a line series', () => {
  test.afterEach(({ consoleErrors }) => {
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  })

  test('the line is drawn through every point', async ({ page, consoleErrors }) => {
    await mount(page, consoleErrors, [{ name: 's', data: dup }])

    await expect(page.locator('path.apexcharts-line')).toHaveCount(1)
    expect(await lines(page)).toEqual([{ points: 3, nan: false }])

    const labels = await page.$$eval('.apexcharts-xaxis-label', (els) =>
      els.map((t) => t.textContent.trim()),
    )
    expect(labels).toEqual(['10:00:00', '10:00:01', '10:00:01'])
  })

  test('a repeat in a later series draws both lines', async ({
    page,
    consoleErrors,
  }) => {
    await mount(page, consoleErrors, [
      { name: 's', data: dup.slice(0, 2) },
      { name: 't', data: dup },
    ])

    await expect(page.locator('path.apexcharts-line')).toHaveCount(2)
    expect(await lines(page)).toEqual([
      { points: 2, nan: false },
      { points: 3, nan: false },
    ])
  })

  test('events report the array index of the point', async ({
    page,
    consoleErrors,
  }) => {
    await mount(page, consoleErrors, [{ name: 's', data: dup }])

    // the two points sharing x '10:00:01' are told apart by their index
    for (const j of [0, 1, 2]) {
      // Arming the capture re-renders the chart. Park the pointer off the
      // plot first, or the re-render fires mouseenter on whichever marker
      // the previous step left it over.
      await page.mouse.move(0, 0)
      const hovered = await captureEvent(page, 'dataPointMouseEnter', () =>
        hoverDataPoint(page, 0, j),
      )
      expect(hovered).toEqual({ seriesIndex: 0, dataPointIndex: j })

      const clicked = await captureEvent(page, 'dataPointSelection', () =>
        clickDataPoint(page, 0, j),
      )
      expect(clicked).toEqual({ seriesIndex: 0, dataPointIndex: j })
    }

    // the user's series is left as it was passed
    const data = await page.evaluate(() => window.chart.w.config.series[0].data)
    expect(data).toEqual(dup)
  })
})
