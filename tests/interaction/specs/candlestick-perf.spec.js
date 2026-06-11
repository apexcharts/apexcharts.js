/**
 * Candlestick large-dataset performance behaviours.
 *
 * The large-dataset sample (2000 daily candles, datetime axis) ships with
 * chart.dataReducer enabled, chart.zoom.autoScaleYaxis on, and exercises three
 * rendering paths that are only observable in a real browser:
 *
 *   1. dataReducer — 2000 raw candles can't be resolved at the chart's width, so
 *      they're OHLC-bucket-aggregated down to ~targetPoints for a cheap render.
 *      It's zoom-aware: each zoom re-slices the raw series to the visible window
 *      and re-aggregates, so a window holding fewer than targetPoints candles is
 *      shown in full detail. This caps the per-zoom render cost (which otherwise
 *      scales with visible-candle count: ~590ms at 2000 vs ~16ms at 250).
 *
 *   2. Bulk reveal — above chart.animations.largeDatasetThreshold the renderer
 *      skips the per-path morph (morphSVG chains three JS-driven tweens *per
 *      candle*) and reveals the whole series with one GPU-composited opacity
 *      fade, reusing delayedElements + apexcharts-element-hidden /
 *      apexcharts-hidden-element-shown. Tested with dataReducer OFF + the raw
 *      2000-point series restored, so the dataset crosses the threshold.
 *
 *   3. autoScaleYaxis — Range.js narrows the y-scan to the candles inside the
 *      zoomed x-window, so the y-axis tightens to the visible price range.
 *
 * Note: with dataReducer on, the windowed/downsampled view leaks into
 * w.config.series (intentional — keeps resetZoom correct), so the full-
 * resolution series is read from w.globals.dataReducerRawSeries here.
 *
 * Fixture: samples/vanilla-js/candlestick/large-dataset.html
 */

import { test, expect } from '../fixtures/base.js'

const CHART = 'candlestick'
const FIXTURE = 'large-dataset'
const TOTAL = 2000

/** Count the rendered candlestick <path> elements. */
async function renderedCandles(page) {
  return page.locator('.apexcharts-candlestick-area').count()
}

test.describe('Candlestick — large-dataset perf', () => {
  test('dataReducer caps rendered candles, reveals detail on zoom', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)

    const target = await page.evaluate(
      () => window.chart.w.config.chart.dataReducer.targetPoints,
    )

    // Zoomed out: 2000 raw candles are aggregated down to ~targetPoints, not
    // drawn one-for-one — that's what keeps the render cheap.
    const zoomedOut = await renderedCandles(page)
    expect(zoomedOut).toBeLessThan(TOTAL / 4)
    expect(zoomedOut).toBeLessThanOrEqual(target + 5)

    // Zoom into a window holding far fewer candles than targetPoints → the
    // reducer re-slices the *raw* series to that window and shows every candle
    // in it (full detail), so the rendered count tracks the window size, not
    // targetPoints. Raw x-values come from the stash (config.series is reduced).
    const SPAN = 60
    await page.evaluate((span) => {
      const raw = window.chart.w.globals.dataReducerRawSeries[0].data
      return window.chart.updateOptions(
        { xaxis: { min: raw[950].x, max: raw[950 + span].x } },
        false,
        false,
      )
    }, SPAN)
    await page.waitForTimeout(150)

    const zoomedIn = await renderedCandles(page)
    expect(zoomedIn).toBeGreaterThan(SPAN / 2)
    expect(zoomedIn).toBeLessThan(SPAN * 3)
  })

  test('bulk-renders with a single opacity fade above the threshold', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)

    // Turn the reducer OFF and restore the full 2000-point series so it crosses
    // the largeDatasetThreshold (1000) → bulk-render path. (The reducer has
    // already collapsed config.series to ~targetPoints, hence the raw restore.)
    await page.evaluate(() => {
      const raw = window.chart.w.globals.dataReducerRawSeries[0].data
      return window.chart.updateOptions({
        chart: { dataReducer: { enabled: false } },
        series: [{ data: raw }],
      })
    })
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 6_000 },
    )

    const stats = await page.evaluate(() => {
      const w = window.chart.w
      const paths = [
        ...document.querySelectorAll('.apexcharts-candlestick-area'),
      ]
      const revealed = paths.filter((p) =>
        p.classList.contains('apexcharts-hidden-element-shown'),
      ).length
      return {
        dataPoints: w.globals.dataPoints,
        threshold: w.config.chart.animations.largeDatasetThreshold,
        total: paths.length,
        revealed,
        animationEnded: w.globals.animationEnded,
      }
    })

    expect(stats.dataPoints).toBeGreaterThan(stats.threshold)
    expect(stats.total).toBeGreaterThan(0)
    // Every rendered candle reveals through the single group-fade mechanism,
    // proving the per-path morph was skipped.
    expect(stats.revealed).toBe(stats.total)
    expect(stats.animationEnded).toBe(true)
  })

  test('updates reveal via opacity fade, not the index-based morph', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)

    // The sample renders ~targetPoints (250) candles, well below the bulk
    // threshold — yet candlestick/boxPlot data-change updates must still take
    // the subtle fade path (render in place + opacity fade) rather than the
    // per-path morph that slides candles around on zoom.
    const stats = await page.evaluate(async () => {
      const w = window.chart.w
      const raw = w.globals.dataReducerRawSeries[0].data
      w.globals.animationEnded = false
      // Animated data-change (zoom to a sub-window).
      await window.chart.updateOptions(
        { xaxis: { min: raw[400].x, max: raw[700].x } },
        false,
        true,
      )
      // let the single reveal rAF run
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r)),
      )
      const paths = [
        ...document.querySelectorAll('.apexcharts-candlestick-area'),
      ]
      const faded = paths.filter(
        (p) =>
          p.classList.contains('apexcharts-hidden-element-shown') ||
          p.classList.contains('apexcharts-element-hidden'),
      ).length
      return {
        dataPoints: w.globals.dataPoints,
        threshold: w.config.chart.animations.largeDatasetThreshold,
        total: paths.length,
        faded,
      }
    })

    // Below the bulk threshold, but the fade reveal still drove every candle.
    expect(stats.dataPoints).toBeLessThan(stats.threshold)
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.faded).toBe(stats.total)
  })

  test('rescales the y-axis to the zoomed window (autoScaleYaxis)', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)

    const before = await page.evaluate(() => ({
      minY: window.chart.w.globals.minY,
      maxY: window.chart.w.globals.maxY,
    }))

    // Zoom to a 100-candle window in the middle of the series. Axis-only update
    // with animation off — await the promise, then settle (the animationEnded
    // flag isn't a reliable signal for axis-only updates).
    await page.evaluate(() => {
      const raw = window.chart.w.globals.dataReducerRawSeries[0].data
      return window.chart.updateOptions(
        { xaxis: { min: raw[950].x, max: raw[1050].x } },
        false,
        false,
      )
    })
    await page.waitForTimeout(150)

    const after = await page.evaluate(() => ({
      minY: window.chart.w.globals.minY,
      maxY: window.chart.w.globals.maxY,
    }))

    // The narrow window spans a far smaller price range than the full series,
    // so autoscale must tighten the y-bounds.
    expect(after.maxY - after.minY).toBeLessThan(before.maxY - before.minY)
  })
})
