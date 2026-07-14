/**
 * Crossfilter (Linked Views #4, filter mode) interaction tests.
 *
 * Exercises the real render wiring with browser events (getBoundingClientRect,
 * classList, dispatch) that jsdom cannot do:
 *   - categorical click-to-filter: clicking a bucket re-aggregates the other
 *     charts and self-dims the source (crossfilter-categorical fixture)
 *   - range brush-to-filter: dragging a rectangle on a numeric histogram sets a
 *     [min,max] filter that re-aggregates a companion chart (crossfilter-range-brush)
 *   - the built-in data table stays in sync with the filtered rows (dashboard)
 *
 * All assertions poll the coordinator state / rendered series via
 * waitForFunction so enabled animations don't cause flakiness. The base fixture
 * auto-fails the test on any uncaught page error.
 */

import { test, expect } from '../fixtures/base.js'

// Dispatch a real mousedown on a pie/donut slice (fires dataPointSelection).
async function clickSlice(page, chartVar, j) {
  await page.evaluate(
    ({ chartVar, j }) => {
      const el = window[chartVar].el.querySelector(
        `.apexcharts-pie-area[j="${j}"]`,
      )
      el.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }),
      )
    },
    { chartVar, j },
  )
}

const cfState = (page, id) =>
  page.evaluate((id) => window.ApexCharts.getCrossfilter(id).state(), id)

test.describe('Crossfilter — categorical click-to-filter', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'crossfilter-categorical')
  })

  test('initial series are the injected aggregation (no empty flash)', async ({
    page,
  }) => {
    const init = await page.evaluate(() => ({
      quarter: window.chart.w.config.series, // 60 rows, 15 per quarter
      dayCats: window.chart2.w.config.xaxis.categories,
      daySum: window.chart2.w.config.series[0].data.reduce((a, b) => a + b, 0),
    }))
    expect(init.quarter).toEqual([15, 15, 15, 15])
    expect(init.dayCats.length).toBeGreaterThan(0)
    expect(init.daySum).toBe(60)
  })

  test('clicking a quarter slice filters the group and self-dims', async ({
    page,
  }) => {
    await clickSlice(page, 'chart', 0) // Q1

    // coordinator reflects the filter immediately
    await page.waitForFunction(() => {
      const s = window.ApexCharts.getCrossfilter('trades').state()
      return s.filters.byQuarter && s.filters.byQuarter[0] === 'Q1'
    })
    const s = await cfState(page, 'trades')
    expect(s.filteredCount).toBe(15)

    // the day bar re-aggregates to the Q1 subset (sum drops from 60 to 15)
    await page.waitForFunction(
      () => window.chart2.w.config.series[0].data.reduce((a, b) => a + b, 0) === 15,
    )

    // the source donut keeps its full values but dims the 3 unselected slices
    const src = await page.evaluate(() => ({
      values: window.chart.w.config.series,
      dimmed: window.chart.el.querySelectorAll(
        '.apexcharts-pie-area.apexcharts-crossfilter-dimmed',
      ).length,
    }))
    expect(src.values).toEqual([15, 15, 15, 15])
    expect(src.dimmed).toBe(3)
  })

  test('clicking the same slice again clears the filter', async ({ page }) => {
    await clickSlice(page, 'chart', 0)
    await page.waitForFunction(
      () => window.ApexCharts.getCrossfilter('trades').state().filteredCount === 15,
    )
    await clickSlice(page, 'chart', 0)
    await page.waitForFunction(
      () =>
        Object.keys(window.ApexCharts.getCrossfilter('trades').state().filters)
          .length === 0,
    )
    const daySum = await page.evaluate(() =>
      window.chart2.w.config.series[0].data.reduce((a, b) => a + b, 0),
    )
    expect(daySum).toBe(60) // fully restored
  })
})

test.describe('Crossfilter — range brush-to-filter', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'crossfilter-range-brush')
  })

  test('brushing the histogram sets a range filter and re-aggregates', async ({
    page,
  }) => {
    const total = await page.evaluate(
      () => window.ApexCharts.getCrossfilter('market').state().total,
    )

    // drag a rectangle across the right portion of the histogram grid
    await page.evaluate(() => {
      const svg = window.chart.el.querySelector('.apexcharts-svg')
      const g = window.chart.el.querySelector('.apexcharts-grid').getBoundingClientRect()
      const fire = (t, x) =>
        svg.dispatchEvent(
          new MouseEvent(t, {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: g.top + g.height / 2, button: 0, buttons: 1, which: 1,
          }),
        )
      fire('mousedown', g.left + g.width * 0.5)
      fire('mousemove', g.left + g.width * 0.85)
      fire('mouseup', g.left + g.width * 0.85)
    })

    // a [min,max] range filter appears on the fluctuation dimension
    await page.waitForFunction(() => {
      const f = window.ApexCharts.getCrossfilter('market').state().filters.fluctuation
      return Array.isArray(f) && f.length === 2 && f[0] < f[1]
    })
    const s = await cfState(page, 'market')
    expect(s.filteredCount).toBeGreaterThan(0)
    expect(s.filteredCount).toBeLessThan(total)

    // the companion quarter chart re-aggregates to the subset
    const quarterSum = await page.evaluate(() =>
      window.chart1.w.config.series[0].data.reduce((a, b) => a + b, 0),
    )
    expect(quarterSum).toBe(s.filteredCount)

    // some histogram bins dim (out-of-range indicator)
    const dimmed = await page.evaluate(
      () =>
        window.chart.el.querySelectorAll(
          '.apexcharts-bar-area.apexcharts-crossfilter-dimmed',
        ).length,
    )
    expect(dimmed).toBeGreaterThan(0)
  })
})

test.describe('Crossfilter — data table', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'crossfilter-dashboard')
  })

  test('the data table tracks the filtered rows', async ({ page }) => {
    const rowCount = () =>
      page.evaluate(() => document.querySelectorAll('#cfd-table tbody tr').length)

    expect(await rowCount()).toBe(120)

    // click Q1 on the quarter donut
    await clickSlice(page, 'chart', 0)
    await page.waitForFunction(
      () =>
        document.querySelectorAll('#cfd-table tbody tr').length ===
        window.ApexCharts.getCrossfilter('trades').state().filteredCount,
    )
    expect(await rowCount()).toBe(30)

    // reset restores the full table
    await page.click('#cfd-reset')
    await page.waitForFunction(
      () => document.querySelectorAll('#cfd-table tbody tr').length === 120,
    )
    expect(await rowCount()).toBe(120)
  })
})
