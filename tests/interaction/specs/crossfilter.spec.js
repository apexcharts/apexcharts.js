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

test.describe('Crossfilter: categorical click-to-filter', () => {
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

  test('a crossfilter click does not leave the mark stuck in the darken/active state', async ({
    page,
  }) => {
    // Regression: clicking a bucket on a filter-mode chart must act as a filter
    // gesture only. The core point-selection state (selected attr + darken
    // brightness filter + selectedDataPoints tracking) used to apply too,
    // leaving the clicked bar permanently dark next to the engine's own
    // self-dim visuals.
    const bar = () =>
      page.evaluate(() => {
        const el = window.chart2.el.querySelector('.apexcharts-bar-area[j="4"]')
        return {
          selected: el.getAttribute('selected'),
          filter: el.getAttribute('filter'),
          tracked: window.chart2.w.interact.selectedDataPoints.reduce(
            (a, arr) => a + ((arr && arr.length) || 0),
            0,
          ),
        }
      })
    const before = await bar()

    await page.evaluate(() => {
      window.chart2.el
        .querySelector('.apexcharts-bar-area[j="4"]')
        .dispatchEvent(
          new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }),
        )
    })
    // the click still filters (the engine listens to dataPointSelection)
    await page.waitForFunction(
      () =>
        Object.keys(window.ApexCharts.getCrossfilter('trades').state().filters)
          .length === 1,
    )

    const after = await bar()
    expect(after.selected).not.toBe('true')
    expect(after.filter).toBe(before.filter) // no darken brightness filter added
    expect(after.tracked).toBe(0) // no point-selection bookkeeping
  })

  test('hovering one chart never paints a sibling tooltip (no index-synced leak)', async ({
    page,
  }) => {
    // Regression: the demo charts used to share chart.group, so hovering the
    // outcome donut's "Loss" slice painted an index-matched "Q1" tooltip on
    // the quarter donut (and vice versa). Hover must stay local.
    const r = await page.evaluate(async () => {
      const slice = window.chart1.el.querySelector('.apexcharts-pie-area')
      const b = slice.getBoundingClientRect()
      const opts = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: b.x + b.width / 2,
        clientY: b.y + b.height / 2,
      }
      slice.dispatchEvent(new MouseEvent('mouseenter', opts))
      slice.dispatchEvent(new MouseEvent('mousemove', opts))
      await new Promise((res) => setTimeout(res, 200))
      const active = (c) => {
        const t = c.el.querySelector('.apexcharts-tooltip')
        return !!t && t.classList.contains('apexcharts-active')
      }
      return {
        own: active(window.chart1),
        quarter: active(window.chart),
        day: active(window.chart2),
      }
    })
    expect(r.own).toBe(true)
    expect(r.quarter).toBe(false)
    expect(r.day).toBe(false)
  })

  test('grouped filter-mode members still opt out of index-synced tooltips', async ({
    page,
  }) => {
    // Even when a user DOES put crossfilter members in a chart.group, the
    // tooltip sync must skip them: their dimensions are unrelated, so an
    // index match across charts is meaningless.
    const r = await page.evaluate(async () => {
      window.ApexCharts.crossfilter({
        id: 'cfg2',
        records: [
          { k: 'A', g: 'X' },
          { k: 'B', g: 'Y' },
          { k: 'A', g: 'Y' },
        ],
      })
      const mk = (el, dim) =>
        new window.ApexCharts(el, {
          chart: {
            type: 'donut',
            width: 240,
            group: 'g2',
            animations: { enabled: false },
            link: { id: 'cfg2', dimension: dim, reduce: 'count' },
          },
          series: [],
        })
      const d1 = document.createElement('div')
      const d2 = document.createElement('div')
      document.body.appendChild(d1)
      document.body.appendChild(d2)
      const c1 = mk(d1, (rec) => rec.k)
      const c2 = mk(d2, (rec) => rec.g)
      await c1.render()
      await c2.render()

      const slice = d1.querySelector('.apexcharts-pie-area')
      const b = slice.getBoundingClientRect()
      const opts = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: b.x + b.width / 2,
        clientY: b.y + b.height / 2,
      }
      slice.dispatchEvent(new MouseEvent('mouseenter', opts))
      slice.dispatchEvent(new MouseEvent('mousemove', opts))
      await new Promise((res) => setTimeout(res, 200))
      const active = (root) => {
        const t = root.querySelector('.apexcharts-tooltip')
        return !!t && t.classList.contains('apexcharts-active')
      }
      const out = { own: active(d1), sibling: active(d2) }
      c1.destroy()
      c2.destroy()
      d1.remove()
      d2.remove()
      return out
    })
    expect(r.own).toBe(true)
    expect(r.sibling).toBe(false) // the index-synced leak
  })

  test('outcome donut orders Gain before Loss with semantic pastel colors', async ({
    page,
  }) => {
    const r = await page.evaluate(() => ({
      labels: window.chart1.w.config.labels,
      colors: window.chart1.w.globals.colors.slice(0, 2),
    }))
    expect(r.labels).toEqual(['Gain', 'Loss'])
    expect(r.colors).toEqual(['#86efac', '#fca5a5']) // green = Gain, red = Loss
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

test.describe('Crossfilter: range brush-to-filter', () => {
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

test.describe('Crossfilter: heatmap 2D target', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'crossfilter-heatmap')
  })

  const heatSum = (page) =>
    page.evaluate(() =>
      window.chart.w.config.series.reduce(
        (a, s) => a + s.data.reduce((b, c) => b + c.y, 0),
        0,
      ),
    )

  test('the heatmap re-aggregates when another chart filters', async ({ page }) => {
    // initial matrix: 4 quarters x 5 days, summing to all 90 trades
    const init = await page.evaluate(() => ({
      series: window.chart.w.config.series.length,
      cells: window.chart.el.querySelectorAll('.apexcharts-heatmap-rect').length,
    }))
    expect(init.series).toBe(4)
    expect(init.cells).toBe(20)
    expect(await heatSum(page)).toBe(90)

    // click "Gain" on the outcome donut (chart1) -> heatmap re-aggregates
    await page.evaluate(() => {
      const j = window.chart1.w.config.labels.indexOf('Gain')
      window.chart1.el
        .querySelector(`.apexcharts-pie-area[j="${j}"]`)
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }))
    })
    await page.waitForFunction(
      () =>
        window.chart.w.config.series.reduce(
          (a, s) => a + s.data.reduce((b, c) => b + c.y, 0),
          0,
        ) === 60,
    )
    expect(await heatSum(page)).toBe(60) // 60 Gain trades

    // Phase A: clicking a heatmap CELL must not add a filter (target-only)
    await page.evaluate(() => {
      window.chart.el
        .querySelector('.apexcharts-heatmap-rect')
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }))
    })
    await page.waitForTimeout(150)
    const filters = await page.evaluate(() =>
      Object.keys(window.ApexCharts.getCrossfilter('trades').state().filters),
    )
    expect(filters).toEqual(['byOutcome'])
  })

  // Regression: a companion bar chart re-aggregated via the updateSeries fast
  // path must rescale its rendered y-axis to the new domain. Previously the
  // bars shrank to the new max but the y-axis ruler stayed at the old top, so
  // a bar worth 6 was drawn full-height against a 0-20 ruler.
  const yAxisTop = (page, chartVar) =>
    page.evaluate((chartVar) => {
      const vals = Array.from(
        window[chartVar].el.querySelectorAll('.apexcharts-yaxis-label tspan'),
      )
        .map((s) => parseFloat(s.textContent))
        .filter((n) => !isNaN(n))
      return vals.length ? Math.max(...vals) : null
    }, chartVar)

  test('a companion bar chart rescales its y-axis when the filtered domain drops', async ({
    page,
  }) => {
    // chart2 = "Day of week" bar; unfiltered it scales to ~18 trades/day.
    expect(await yAxisTop(page, 'chart2')).toBeGreaterThanOrEqual(15)

    // Filter to Loss on the outcome donut -> each day drops to 6 Loss trades.
    await page.evaluate(() => {
      const j = window.chart1.w.config.labels.indexOf('Loss')
      window.chart1.el
        .querySelector(`.apexcharts-pie-area[j="${j}"]`)
        .dispatchEvent(
          new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }),
        )
    })

    // The rendered ruler must follow the data down (poll to ride out animation).
    await page.waitForFunction(() => {
      const vals = Array.from(
        window.chart2.el.querySelectorAll('.apexcharts-yaxis-label tspan'),
      )
        .map((s) => parseFloat(s.textContent))
        .filter((n) => !isNaN(n))
      return vals.length && Math.max(...vals) <= 12
    })

    const after = await page.evaluate(() => {
      const vals = Array.from(
        window.chart2.el.querySelectorAll('.apexcharts-yaxis-label tspan'),
      )
        .map((s) => parseFloat(s.textContent))
        .filter((n) => !isNaN(n))
      const top = Math.max(...vals)
      const maxVal = Math.max(
        ...window.chart2.w.config.series[0].data.map((v) =>
          typeof v === 'object' ? v.y : v,
        ),
      )
      return { top, maxVal }
    })
    // ruler covers the tallest bar and no longer sits at the stale ~20 top
    expect(after.top).toBeGreaterThanOrEqual(after.maxVal)
    expect(after.top).toBeLessThanOrEqual(12)
  })
})

test.describe('Crossfilter: data table', () => {
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
