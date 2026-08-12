/**
 * Stacked *total* dataLabels: per-group totals, and room to draw them.
 *
 * Two long-standing defects are guarded here.
 *
 * #4173 — grouped stacked bars drew ONE total per data point, summing every
 * series in the chart and centred on the whole cluster. With `series[].group`
 * each group is its own stack, so each needs its own total. Three things had to
 * agree for that: which series draws the label (the cap of each group, not the
 * chart-wide `lastActiveBarSerieIndex`), what value it shows
 * (`stackedSeriesTotalsByGroups`, not `stackedSeriesTotals`), and where it sits
 * (this group's `prevY`/`prevX` extremum and this group's bar centre).
 *
 * #3579 — under `stackType: '100%'` every horizontal stack ends at the axis
 * maximum, i.e. exactly at the right edge of the plot, so the total label was
 * drawn outside the grid and clipped away. `gridPadForStackedTotalDataLabels`
 * reserves the width it needs via `xPadRight`.
 *
 * Both come with a guard for the shape that must NOT move: an ungrouped stacked
 * column, and an ordinary (non-100%) horizontal stacked bar.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

// Total dataLabels are plain <text> inside .apexcharts-datalabels and carry no
// class of their own, so the specs below set `dataLabels.enabled: false` and
// everything left in that group is a total.
const TOTALS = '.apexcharts-datalabels text'

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  boot: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    const boot = async (options) => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart" style="width:800px;height:400px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (opts) => {
        window.chart = new ApexCharts(document.querySelector('#chart'), opts)
        await window.chart.render()
      }, options)
      await page.waitForFunction(
        () => window.chart?.w?.globals?.animationEnded === true,
        { timeout: 8000 },
      )
    }

    await use(boot)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

/** Text + rounded x of every total dataLabel currently drawn. */
const readTotals = (page) =>
  page.evaluate(
    (sel) =>
      Array.from(document.querySelectorAll(sel))
        .map((t) => ({
          text: t.textContent.trim(),
          x: Math.round(Number(t.getAttribute('x'))),
        }))
        .filter((t) => t.text !== ''),
    TOTALS,
  )

test.describe('Stacked total dataLabels — per group (#4173)', () => {
  const groupedOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      height: 400,
      animations: { enabled: false },
    },
    plotOptions: { bar: { dataLabels: { total: { enabled: true } } } },
    dataLabels: { enabled: false },
    series: [
      { name: 'G1a', group: 'g1', data: [10, 10] },
      { name: 'G1b', group: 'g1', data: [5, 5] },
      { name: 'G2a', group: 'g2', data: [40, 40] },
      { name: 'G2b', group: 'g2', data: [20, 20] },
    ],
    xaxis: { categories: ['x', 'y'] },
  }

  test('each group gets its own total, summing only that group', async ({
    page,
    boot,
  }) => {
    await boot(groupedOptions)
    const totals = await readTotals(page)

    // g1 = 10 + 5 = 15, g2 = 40 + 20 = 60, for each of two categories.
    // The chart-wide sum (75) must not appear.
    expect(totals).toHaveLength(4)
    expect(totals.map((t) => t.text).sort()).toEqual(['15', '15', '60', '60'])
    expect(totals.map((t) => t.text)).not.toContain('75')
  })

  test('the two totals of a category sit over their own bars', async ({
    page,
    boot,
  }) => {
    await boot(groupedOptions)
    const totals = await readTotals(page)

    // Four labels at four distinct x positions: one per group bar, rather than
    // two labels centred on the middle of the cluster.
    expect(new Set(totals.map((t) => t.x)).size).toBe(4)

    // Within a category the g1 label must be left of the g2 label, matching the
    // draw order of the group bars.
    const byX = [...totals].sort((a, b) => a.x - b.x)
    expect(byX[0].text).toBe('15')
    expect(byX[1].text).toBe('60')
  })

  test('a collapsed cap series hands the total to the next series in its group', async ({
    page,
    boot,
  }) => {
    await boot(groupedOptions)
    // G2b caps group g2. Hiding it must leave g2 with a total of 40 (G2a alone)
    // rather than dropping g2's total entirely.
    await page.evaluate(() => window.chart.toggleSeries('G2b'))
    await page.waitForTimeout(500)

    const totals = await readTotals(page)
    const texts = totals.map((t) => t.text).sort()
    expect(texts).toEqual(['15', '15', '40', '40'])
  })

  test('GUARD ungrouped stacked columns keep one chart-wide total', async ({
    page,
    boot,
  }) => {
    await boot({
      chart: {
        type: 'bar',
        stacked: true,
        height: 400,
        animations: { enabled: false },
      },
      plotOptions: { bar: { dataLabels: { total: { enabled: true } } } },
      dataLabels: { enabled: false },
      series: [
        { name: 'A', data: [10, 10] },
        { name: 'B', data: [5, 5] },
      ],
      xaxis: { categories: ['x', 'y'] },
    })

    // Without groups there is one stack per category, so one total of 15 each,
    // positioned exactly as before the per-group work.
    const totals = await readTotals(page)
    expect(totals).toHaveLength(2)
    expect(totals.map((t) => t.text)).toEqual(['15', '15'])
  })
})

test.describe('Stacked total dataLabels — 100% horizontal clipping (#3579)', () => {
  test('total labels stay inside the SVG viewport', async ({ page, boot }) => {
    await boot({
      chart: {
        type: 'bar',
        stacked: true,
        stackType: '100%',
        height: 400,
        animations: { enabled: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          dataLabels: { total: { enabled: true, style: { fontSize: '13px' } } },
        },
      },
      dataLabels: { enabled: false },
      series: [
        { name: 'A', data: [4400, 5500] },
        { name: 'B', data: [1300, 2300] },
      ],
      xaxis: { categories: ['one', 'two'] },
    })

    const overhang = await page.evaluate((sel) => {
      const svgRight = document
        .querySelector('.apexcharts-svg')
        .getBoundingClientRect().right
      return Array.from(document.querySelectorAll(sel))
        .filter((t) => t.textContent.trim() !== '')
        .map((t) => t.getBoundingClientRect().right - svgRight)
    }, TOTALS)

    expect(overhang).toHaveLength(2)
    // Every label ends at or before the right edge. Before the reserve these
    // overhung by ~20px and were clipped.
    overhang.forEach((o) => expect(o).toBeLessThanOrEqual(0))
  })

  test('GUARD an ordinary horizontal stacked bar reserves nothing', async ({
    page,
    boot,
  }) => {
    const opts = (stackType) => ({
      chart: {
        type: 'bar',
        stacked: true,
        height: 400,
        animations: { enabled: false },
        ...(stackType ? { stackType } : {}),
      },
      plotOptions: {
        bar: { horizontal: true, dataLabels: { total: { enabled: true } } },
      },
      dataLabels: { enabled: false },
      series: [
        { name: 'A', data: [4400, 5500] },
        { name: 'B', data: [1300, 2300] },
      ],
      xaxis: { categories: ['one', 'two'] },
    })

    await boot(opts(null))
    const plain = await page.evaluate(() => window.chart.w.layout.gridWidth)

    await boot(opts('100%'))
    const hundred = await page.evaluate(() => window.chart.w.layout.gridWidth)

    // Non-100% stacking already has room under its rounded axis maximum, so its
    // plot width must be untouched — only the 100% case gives width away.
    expect(hundred).toBeLessThan(plain)
    expect(plain).toBeGreaterThan(600)
  })
})
