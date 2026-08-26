/**
 * #4885: "Overlapping and extra wide bars in bar graph" on a datetime axis.
 *
 * Two separate defects behind that one title, both sized from
 * `w.globals.minXDiff`:
 *
 *  1. minXDiff is the smallest gap WITHIN a series, minimised across series, so
 *     it never sees the gap BETWEEN two series' x values. Series A on the 1st
 *     and the 4th plus series B on the 2nd yields 2 days, the axis really has a
 *     1 day gap, and bars drawn 1.4 days wide overlap their neighbours.
 *  2. With ONE data point there are no gaps at all, minXDiff is a 0.5 sentinel,
 *     and both bar paths fell through to a slot the width of the whole grid:
 *     the stacked path via `dataPoints > 1`, the plain path via a `!== 0.5`
 *     check. One bar covered 70% of the chart (jackrabbit-start's diagnosis in
 *     the thread).
 *
 * Both now resolve through `barHelpers.barSlotXSpan()`. For the single point it
 * uses the unit Range._handleSingleDataPoint padded the axis with (±2 days for
 * datetime, ±2 for numeric), so one bar is one day, not one chart.
 *
 * The yardstick is the axis itself, not a recorded pixel count: a daily bar may
 * not be wider than one day of axis, and no two bars at different dates may
 * overlap. Both are read off the rendered DOM.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const DAY = 86400000
const T0 = Date.UTC(2024, 0, 1)
/** @param {number[]} days @param {number[]} vals */
const pts = (days, vals) => days.map((d, i) => ({ x: T0 + d * DAY, y: vals[i] }))

const test = base.extend({
  /**
   * Renders a bar chart and reports the geometry of every rendered bar plus the
   * scale needed to judge it.
   */
  bars: async ({ page }, use) => {
    /** @param {{series: any[], stacked?: boolean, type?: string, xaxisType?: string, columnWidth?: string}} spec */
    const bars = async (spec) => {
      await page.goto('about:blank')
      await page.setContent('<div id="chart" style="width:600px"></div>')
      await page.addScriptTag({ path: distPath })
      return page.evaluate(async (spec) => {
        const opts = {
          chart: {
            type: spec.type || 'bar',
            height: 320,
            stacked: !!spec.stacked,
            animations: { enabled: false },
            toolbar: { show: false },
          },
          series: spec.series,
          xaxis: { type: spec.xaxisType || 'datetime' },
          dataLabels: { enabled: false },
        }
        if (spec.columnWidth) {
          opts.plotOptions = { bar: { columnWidth: spec.columnWidth } }
        }
        const chart = new ApexCharts(document.querySelector('#chart'), opts)
        await chart.render()
        await new Promise((r) => requestAnimationFrame(() => r()))

        const w = chart.w
        const span = w.globals.maxX - w.globals.minX
        const unitPx =
          span > 0 ? (86400000 / span) * w.layout.gridWidth : null

        const rects = [
          ...document.querySelectorAll('.apexcharts-bar-area'),
        ].map((b) => {
          const bb = b.getBBox()
          return { x: +bb.x.toFixed(2), w: +bb.width.toFixed(2) }
        })

        // Overlap between bars at DIFFERENT x. Grouping by the `j` attribute
        // would miss it: with ragged series each series numbers its own points,
        // so A's 1st-of-month bar and B's 2nd-of-month bar are both j=0.
        let overlap = 0
        for (let a = 0; a < rects.length; a++) {
          for (let b = a + 1; b < rects.length; b++) {
            const ca = rects[a].x + rects[a].w / 2
            const cb = rects[b].x + rects[b].w / 2
            if (Math.abs(ca - cb) < 1) continue
            const l = Math.max(rects[a].x, rects[b].x)
            const r = Math.min(rects[a].x + rects[a].w, rects[b].x + rects[b].w)
            if (r - l > overlap) overlap = r - l
          }
        }

        return {
          dayPx: unitPx === null ? null : +unitPx.toFixed(2),
          gridWidth: Math.round(w.layout.gridWidth),
          widths: [...new Set(rects.map((r) => r.w))],
          maxWidth: rects.length ? Math.max(...rects.map((r) => r.w)) : 0,
          overlap: +overlap.toFixed(2),
          count: rects.length,
        }
      }, spec)
    }
    await use(bars)
  },
})

test.describe('Bar widths on a datetime axis (#4885)', () => {
  for (const stacked of [true, false]) {
    test(`a single data point gets one day, not the whole grid (stacked=${stacked})`, async ({
      bars,
    }) => {
      const r = await bars({
        stacked,
        series: [
          { name: 'a', data: pts([0], [30]) },
          { name: 'b', data: pts([0], [20]) },
        ],
      })

      expect(r.count).toBeGreaterThan(0)
      // pre-fix: 385px of a 551px grid when stacked, 193px when not
      expect(r.maxWidth).toBeLessThanOrEqual(r.dayPx)

      // Stacked series share the slot; grouped series split it between them, so
      // the expected width is the slot's 70% over the number of bars per date.
      const perDate = stacked ? 1 : 2
      expect(r.maxWidth).toBeCloseTo((r.dayPx * 0.7) / perDate, 0)
    })
  }

  test('series on different dates do not overlap', async ({ bars }) => {
    // minXDiff sees 2 days here (series b, the 2nd to the 4th) but the axis has
    // a 1 day gap between a's 1st and b's 2nd. Pre-fix: 9.5px of overlap.
    const r = await bars({
      stacked: true,
      series: [
        { name: 'a', data: pts([0, 3, 10], [30, 25, 20]) },
        { name: 'b', data: pts([1, 3, 20], [20, 15, 18]) },
      ],
    })

    expect(r.overlap).toBe(0)
    expect(r.maxWidth).toBeLessThanOrEqual(r.dayPx)
  })

  test('evenly spaced daily data is unchanged, and one width for all bars', async ({
    bars,
  }) => {
    // The common case, and the one that must not move: every series shares the
    // same x values, so the merged gap IS minXDiff.
    const r = await bars({
      stacked: true,
      series: [
        { name: 'a', data: pts([0, 1, 2, 3, 4], [30, 25, 20, 28, 22]) },
        { name: 'b', data: pts([0, 1, 2, 3, 4], [20, 15, 18, 12, 16]) },
      ],
    })

    expect(r.widths).toHaveLength(1) // uniform
    expect(r.overlap).toBe(0)
    // default columnWidth is 70% of the slot, and the slot is one day
    expect(r.maxWidth).toBeCloseTo(r.dayPx * 0.7, 0)
  })

  test('a sparse axis still buckets by its own spacing', async ({ bars }) => {
    // 30 days apart: a bar is 70% of THAT spacing, which is 21 days wide. Not a
    // defect, there is no daily granularity in this data, and it must keep
    // working: an over-eager "never wider than a day" rule would shrink these
    // to slivers.
    const r = await bars({
      stacked: true,
      series: [
        { name: 'a', data: pts([0, 30], [30, 25]) },
        { name: 'b', data: pts([0, 30], [20, 15]) },
      ],
    })

    expect(r.overlap).toBe(0)
    expect(r.maxWidth).toBeGreaterThan(r.dayPx * 5)
  })

  test('a single numeric point behaves like a single datetime point', async ({
    bars,
  }) => {
    const r = await bars({
      xaxisType: 'numeric',
      series: [{ name: 'a', data: [{ x: 10, y: 30 }] }],
    })

    // padded ±2 units, so a quarter of the span is one unit
    expect(r.maxWidth).toBeLessThan(r.gridWidth / 3)
    expect(r.maxWidth).toBeGreaterThan(1)
  })

  for (const stacked of [false, true]) {
    test(`an explicit pixel columnWidth wins whatever the data (stacked=${stacked})`, async ({
      bars,
    }) => {
      // The stacked numeric path read '18' as 18 PERCENT, so the same option
      // produced 24.8px, 40.6px and 18.4px for 1, 3 and 6 points. That is the
      // reporter's follow-up: a fixed width that still was not uniform.
      for (const days of [[0], [0, 1, 2], [0, 1, 2, 3, 4, 5]]) {
        const r = await bars({
          stacked,
          columnWidth: '18',
          series: [
            { name: 'a', data: pts(days, days.map(() => 20)) },
            { name: 'b', data: pts(days, days.map(() => 10)) },
          ],
        })
        expect(r.widths, `days=${days.length}`).toHaveLength(1)
        expect(r.maxWidth, `days=${days.length}`).toBeCloseTo(18, 0)
      }
    })
  }
})
