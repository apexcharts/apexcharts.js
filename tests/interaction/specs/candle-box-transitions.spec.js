/**
 * Candlestick and box plot updates morph each mark from its own previous shape.
 *
 * Their data changes used to skip the morph and fade instead: every candle
 * and box was hidden and faded back in at its final shape, the unchanged ones
 * included, so any update (a value change, a zoom, a legend toggle) made the
 * whole series blink. The fade had been chosen because the morph was
 * index-based, and on a zoom candle j is a different candle. Marks are now
 * matched by datum key, like bars, so each morphs from where it was, and
 * candles that leave shrink away as exit ghosts. Every frame is checked
 * against the shared rules (helpers/frames.js); the rest state against a
 * fresh render.
 */

import { test, expect } from '@playwright/test'
import { mountChart, recordTransition, checkAll, settles, expectNoViolations } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const T0 = Date.UTC(2026, 0, 1)
const DAY = 864e5

// Self-contained: these are also serialised into the page for updateSeries.
function candles(k = 1) {
  return Array.from({ length: 12 }, (_, i) => {
    const o = 40 + ((i * 37) % 25)
    return { x: Date.UTC(2026, 0, 1) + i * 864e5, y: [o, o + 10 * k, o - 8 * k, o + (i % 2 ? 6 : -5) * k] }
  })
}

function boxes(shift = 0) {
  return ['C1', 'C2', 'C3', 'C4', 'C5'].map((x, i) => ({
    x,
    y: [10 + i + shift, 20 + i + shift, 30 + i + shift, 40 + i + shift * 2, 50 + i + shift * 2],
  }))
}

const base = (type, extra) => ({
  chart: { type, height: 320, toolbar: { show: false }, animations: { dynamicAnimation: { speed: 350 } } },
  dataLabels: { enabled: false },
  ...extra,
})

test.describe('Candlestick updates morph', () => {
  test('updateSeries: every candle reshapes in place, nothing blinks', async ({ page }) => {
    const errors = await mountChart(page, base('candlestick', { series: [{ name: 'P', data: candles() }], xaxis: { type: 'datetime' } }))
    const next = `() => [{ name: 'P', data: (${candles})(1.6) }]`
    const rec = await recordTransition(page, () =>
      page.evaluate((src) => window.chart.updateSeries((0, eval)(`(${src})`)()), next),
    )

    // A value update can widen the y-axis labels and so narrow the plot,
    // which legitimately moves candles sideways: no xStable here.
    expectNoViolations(checkAll(rec), 'candlestick updateSeries')
    expectNoViolations(await settles(page, rec, { transform: `(o) => ({ series: (${next})() })` }), 'at rest')
    expect(errors).toEqual([])
  })

  test('zoom: candles in view morph to their new place, nothing blinks', async ({ page }) => {
    const errors = await mountChart(page, base('candlestick', { series: [{ name: 'P', data: candles() }], xaxis: { type: 'datetime' } }))
    const [lo, hi] = [T0 + 3 * DAY, T0 + 8 * DAY]
    const rec = await recordTransition(page, () =>
      page.evaluate(([lo, hi]) => window.chart.zoomX(lo, hi), [lo, hi]),
    )

    // A zoom changes the x scale, so xStable does not apply. noJump holds the
    // candles leaving the view to where they were on frame 0 (they used to
    // be culled at once and vanish while the rest were still moving).
    expectNoViolations(checkAll(rec), 'candlestick zoom')
    // ...and once they have slid out, nothing is left lying off-screen.
    const offscreen = await page.evaluate(() => {
      const gw = window.chart.w.layout.gridWidth
      return [...document.querySelectorAll('.apexcharts-candlestick-area')]
        .filter((p) => (p.getAttribute('d') || '').trim())
        .map((p) => p.getBBox())
        .filter((b) => b.x + b.width < -b.width || b.x > gw + b.width).length
    })
    expect(offscreen, 'candles left off-screen after the zoom').toBe(0)
    expect(errors).toEqual([])
  })
})

test.describe('Box plot updates morph', () => {
  test('updateSeries: every box reshapes in place, nothing blinks', async ({ page }) => {
    const errors = await mountChart(page, base('boxPlot', { series: [{ name: 'B', type: 'boxPlot', data: boxes() }] }))
    const next = `() => [{ name: 'B', type: 'boxPlot', data: (${boxes})(6) }]`
    const rec = await recordTransition(page, () =>
      page.evaluate((src) => window.chart.updateSeries((0, eval)(`(${src})`)()), next),
    )

    expectNoViolations(checkAll(rec), 'boxPlot updateSeries')
    expectNoViolations(await settles(page, rec, { transform: `(o) => ({ series: (${next})() })` }), 'at rest')
    // It actually moves (box plots used to default to no update animation).
    const sig = (s) => JSON.stringify(s.series.map((x) => x.marks.map((m) => m.bbox.map(Math.round))))
    expect(new Set(rec.frames.map(sig)).size, 'the boxes never moved').toBeGreaterThan(5)
    expect(errors).toEqual([])
  })
})

// The slide-out on zoom lives in the shared bar renderer (Bar._wasOnScreen),
// so columns get it too: their outer bars used to vanish on frame 0 as well.
test.describe('Column zoom', () => {
  test('bars leaving the view slide out, then nothing is left off-screen', async ({ page }) => {
    const data = Array.from({ length: 12 }, (_, i) => ({ x: Date.UTC(2026, 0, 1) + i * 864e5, y: 30 + ((i * 37) % 25) }))
    const errors = await mountChart(page, base('bar', { series: [{ name: 'C', data }], xaxis: { type: 'datetime' } }))
    const rec = await recordTransition(page, () =>
      page.evaluate(() => window.chart.zoomX(Date.UTC(2026, 0, 4), Date.UTC(2026, 0, 9))),
    )

    expectNoViolations(checkAll(rec), 'column zoom')
    const offscreen = await page.evaluate(() => {
      const gw = window.chart.w.layout.gridWidth
      return [...document.querySelectorAll('.apexcharts-bar-area')]
        .filter((p) => (p.getAttribute('d') || '').trim())
        .map((p) => p.getBBox())
        .filter((b) => b.x + b.width < -b.width || b.x > gw + b.width).length
    })
    expect(offscreen, 'bars left off-screen after the zoom').toBe(0)
    expect(errors).toEqual([])
  })
})

// Candles fade instead of morphing when an update keeps too few of them (the
// window moved past most of them). A line beside them still morphs, and the
// animation is not over until it lands: the fade used to end it for the whole
// chart on its first frame, so the line's labels appeared mid-morph, off the
// line, and animationEnd fired before anything had finished.
test.describe('A candle fade beside a morphing line', () => {
  test('the line keeps its labels hidden until it lands; animationEnd waits for it', async ({ page }) => {
    const mk = (start) => {
      const c = []
      const l = []
      for (let k = start; k < start + 10; k++) {
        const o = 50 + ((k * 37) % 20)
        const cl = 50 + ((k * 53) % 20)
        c.push({ x: T0 + k * DAY, y: [o, Math.max(o, cl) + 3, Math.min(o, cl) - 3, cl] })
        l.push({ x: T0 + k * DAY, y: (o + cl) / 2 + (k % 3) * 8 })
      }
      return [
        { name: 'L', type: 'line', data: l },
        { name: 'C', type: 'candlestick', data: c },
      ]
    }
    const errors = await mountChart(page, {
      ...base('line', { dataLabels: { enabled: true, enabledOnSeries: [0] }, stroke: { width: [2, 1] } }),
      series: mk(0),
      xaxis: { type: 'datetime' },
    })
    await page.evaluate(() => {
      window.__ended = 0
      window.chart.updateOptions({ chart: { events: { animationEnd: () => window.__ended++ } } }, false, false)
    })
    await advance(page, 2000)
    await page.evaluate(() => (window.__ended = 0))
    await page.evaluate((s) => window.chart.updateSeries(s), mk(7))
    const state = () =>
      page.evaluate(() => ({
        labelsHidden: document
          .querySelector('.apexcharts-datalabels[data\\:realIndex="0"]')
          ?.classList.contains('apexcharts-element-hidden'),
        candlesHidden: [...document.querySelectorAll('.apexcharts-candlestick-area')].some((p) =>
          p.classList.contains('apexcharts-element-hidden'),
        ),
        ended: window.__ended,
      }))
    await advance(page, 100)
    const mid = await state()
    expect(mid.candlesHidden, 'the candles faded in on their own').toBe(false)
    expect(mid.labelsHidden, 'the line is still morphing').toBe(true)
    expect(mid.ended, 'animationEnd before the line landed').toBe(0)
    await advance(page, 1500)
    const end = await state()
    expect(end.labelsHidden).toBe(false)
    expect(end.ended).toBe(1)
    expect(errors).toEqual([])
  })
})

// Several series centre their group on each category, so the outer series'
// boxes hang into the plot's side pad, inside the bar clip and on screen. The
// cull margin was one box wide, and with five series it culled them.
test('boxPlot, five series: every box is drawn, at mount and after an update', async ({ page }) => {
  const series = (shift) =>
    ['A', 'B', 'C', 'D', 'E'].map((name, c) => ({ name, type: 'boxPlot', data: boxes(shift + c * 2) }))
  const errors = await mountChart(page, { ...base('boxPlot'), series: series(0) })
  const count = () => page.evaluate(() => document.querySelectorAll('.apexcharts-boxPlot-area').length)
  expect(await count(), 'at mount').toBe(5 * 5 * 2)
  await page.evaluate((s) => window.chart.updateSeries(s), series(1))
  await advance(page, 4000)
  expect(await count(), 'after an update').toBe(5 * 5 * 2)
  expect(errors).toEqual([])
})
