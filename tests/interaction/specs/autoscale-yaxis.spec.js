/**
 * #1260: zoom + autoScaleYaxis. Reported in 2020 against two series sharing one
 * y-axis, then joined by three more variants over 14 comments: a single series
 * whose min stayed at 0, candlestick, and synchronised charts.
 *
 * Re-measured on 7.0.0 first: the original report, the single series, combo
 * axes, candlestick, the brush path and both synced-chart directions were all
 * already correct. What was still broken traced back to one line, the trim
 * loops in Range.getMinYMaxY:
 *
 *     for (; firstXIndex < lastXIndex && xs[firstXIndex] < lo; firstXIndex++)
 *
 * They stop as soon as the two indices meet, so a series with NOTHING inside
 * the window is left pointing at one surviving point, and that point's y sized
 * the axis even though the series draws no ink in view. Two consequences:
 *
 *   - zoom into a range a second series does not cover, and the axis stayed on
 *     the full-data domain instead of hugging the series you can see;
 *   - a series that straddles the window with no point inside collapsed the
 *     axis onto ONE of its two ends, clipping the segment drawn across it.
 *
 * Separately, _setStackedMinMax summed every point regardless of the window, so
 * zooming a stacked chart moved the x axis and nothing else.
 *
 * The expectation everywhere is computed from the data, never a recorded pixel:
 * the y domain must bracket what is inside the window and must not be inflated
 * by what is outside it.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const DAY = 86400000
const T0 = Date.UTC(2024, 0, 1)
/** y = base + i*step, one point per day from `from` */
const ramp = (n, base, step, from = 0) =>
  Array.from({ length: n }, (_, i) => ({
    x: T0 + (i + from) * DAY,
    y: base + i * step,
  }))

const chartBase = {
  chart: {
    type: 'line',
    height: 280,
    animations: { enabled: false },
    zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
  },
  xaxis: { type: 'datetime' },
  dataLabels: { enabled: false },
}

const test = base.extend({
  /**
   * Renders one chart (optionally a synced sibling), zooms to a day window, and
   * reports the y domain before and after.
   */
  zoomTo: async ({ page }, use) => {
    /** @param {{opts: any, opts2?: any, window: [number, number], measure?: 'sibling'}} spec */
    const zoomTo = async (spec) => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart" style="width:700px"></div><div id="chart2" style="width:700px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      return page.evaluate(
        async ({ spec, T0, DAY }) => {
          const chart = new ApexCharts(
            document.querySelector('#chart'),
            spec.opts,
          )
          await chart.render()
          let sibling = null
          if (spec.opts2) {
            sibling = new ApexCharts(
              document.querySelector('#chart2'),
              spec.opts2,
            )
            await sibling.render()
          }
          await new Promise((r) => setTimeout(r, 200))

          const measured = spec.measure === 'sibling' ? sibling : chart
          const before = {
            min: measured.w.globals.minY,
            max: measured.w.globals.maxY,
          }
          chart.zoomX(T0 + spec.window[0] * DAY, T0 + spec.window[1] * DAY)
          await new Promise((r) => setTimeout(r, 400))

          return {
            before,
            after: {
              min: measured.w.globals.minY,
              max: measured.w.globals.maxY,
            },
            labels: [
              ...measured.w.dom.baseEl.querySelectorAll(
                '.apexcharts-yaxis-texts-g text',
              ),
            ].map((t) => t.textContent.trim()),
          }
        },
        { spec, T0, DAY },
      )
    }
    await use(zoomTo)
  },
})

test.describe('autoScaleYaxis (#1260)', () => {
  test('two series on one y-axis scale to the window (the original report)', async ({
    zoomTo,
  }) => {
    const r = await zoomTo({
      window: [10, 14],
      opts: {
        ...chartBase,
        series: [
          { name: 'a', data: ramp(30, 100, 10) }, // 200..240 in window
          { name: 'b', data: ramp(30, 500, -10) }, // 400..360 in window
        ],
      },
    })

    expect(r.after.min).toBeGreaterThanOrEqual(150)
    expect(r.after.max).toBeLessThanOrEqual(450)
  })

  test('a series with no points in the window does not inflate the axis', async ({
    zoomTo,
  }) => {
    // Series b lives on days 20..29 only. Zoomed to days 2..4 it draws nothing,
    // so its 900..990 must not size the axis. Pre-fix: the full [0, 1000].
    const r = await zoomTo({
      window: [2, 4],
      opts: {
        ...chartBase,
        series: [
          { name: 'a', data: ramp(30, 100, 10) }, // 120..140 in window
          { name: 'b', data: ramp(10, 900, 10, 20) },
        ],
      },
    })

    expect(r.after.max).toBeLessThan(300)
    expect(r.after.min).toBeGreaterThan(50)
  })

  test('a series straddling the window keeps the segment drawn across it', async ({
    zoomTo,
  }) => {
    // Points at day 0 (y 100) and day 20 (y 900), window days 5..8: no point is
    // inside, but the line is drawn straight through, so both ends bound what is
    // visible. Pre-fix the axis collapsed onto one end, at [899, 901], and
    // clipped the segment.
    const r = await zoomTo({
      window: [5, 8],
      opts: {
        ...chartBase,
        series: [
          {
            name: 'a',
            data: [
              { x: T0, y: 100 },
              { x: T0 + 20 * DAY, y: 900 },
            ],
          },
        ],
      },
    })

    expect(r.after.min).toBeLessThanOrEqual(100)
    expect(r.after.max).toBeGreaterThanOrEqual(900)
  })

  for (const type of ['area', 'bar']) {
    test(`a stacked ${type} chart scales its total to the window`, async ({
      zoomTo,
    }) => {
      // Pre-fix _setStackedMinMax summed every point, so the max stayed on the
      // full-data total and the zoom changed nothing.
      const r = await zoomTo({
        window: [10, 14],
        opts: {
          ...chartBase,
          chart: { ...chartBase.chart, type, stacked: true },
          series: [
            { name: 'a', data: ramp(30, 100, 10) }, // 200..240
            { name: 'b', data: ramp(30, 50, 5) }, // 100..120
          ],
        },
      })

      // full-data total is 390 + 195 = 585; in the window it is at most 360
      expect(r.before.max).toBeGreaterThan(500)
      expect(r.after.max).toBeLessThan(450)
      expect(r.after.max).toBeGreaterThanOrEqual(360)
    })
  }

  test('a window with no data at all falls back to the full extent', async ({
    zoomTo,
  }) => {
    // Panning past the end of the series must not leave the axis on its
    // sentinels: there is nothing to scale to, so show what the data spans.
    const r = await zoomTo({
      window: [40, 44],
      opts: { ...chartBase, series: [{ name: 'a', data: ramp(5, 100, 1) }] },
    })

    expect(Number.isFinite(r.after.min)).toBe(true)
    expect(Number.isFinite(r.after.max)).toBe(true)
    expect(r.after.max).toBeGreaterThan(r.after.min)
    expect(r.after.min).toBeLessThanOrEqual(100)
    expect(r.after.max).toBeGreaterThanOrEqual(104)
    expect(r.labels.every((l) => l && l !== 'NaN')).toBe(true)
  })

  test('a synced sibling scales its own axis, and opts out when told to', async ({
    zoomTo,
  }) => {
    const on = await zoomTo({
      window: [10, 14],
      measure: 'sibling',
      opts: {
        ...chartBase,
        chart: { ...chartBase.chart, id: 'A', group: 'g' },
        series: [{ name: 'a', data: ramp(30, 100, 10) }],
      },
      opts2: {
        ...chartBase,
        chart: { ...chartBase.chart, id: 'B', group: 'g' },
        series: [{ name: 'b', data: ramp(30, 1000, 25) }], // 1250..1350 in window
      },
    })
    expect(on.after.min).toBeGreaterThan(1100)
    expect(on.after.max).toBeLessThan(1500)

    const off = await zoomTo({
      window: [10, 14],
      measure: 'sibling',
      opts: {
        ...chartBase,
        chart: { ...chartBase.chart, id: 'A2', group: 'g2' },
        series: [{ name: 'a', data: ramp(30, 100, 10) }],
      },
      opts2: {
        ...chartBase,
        chart: {
          ...chartBase.chart,
          id: 'B2',
          group: 'g2',
          zoom: { enabled: true, type: 'x', autoScaleYaxis: false },
        },
        series: [{ name: 'b', data: ramp(30, 1000, 25) }],
      },
    })
    expect(off.after.min).toBe(off.before.min)
    expect(off.after.max).toBe(off.before.max)
  })

  test('explicit yaxis bounds and a percent axis are left alone', async ({
    zoomTo,
  }) => {
    const fixed = await zoomTo({
      window: [10, 14],
      opts: {
        ...chartBase,
        series: [{ name: 'a', data: ramp(30, 100, 10) }],
        yaxis: { min: 0, max: 2000 },
      },
    })
    expect(fixed.after).toEqual({ min: 0, max: 2000 })

    const pct = await zoomTo({
      window: [10, 14],
      opts: {
        ...chartBase,
        chart: {
          ...chartBase.chart,
          type: 'bar',
          stacked: true,
          stackType: '100%',
        },
        series: [
          { name: 'a', data: ramp(30, 100, 10) },
          { name: 'b', data: ramp(30, 50, 5) },
        ],
      },
    })
    expect(pct.after.max).toBe(100)
  })
})
