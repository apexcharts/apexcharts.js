/**
 * Candles beside a line (the candlestick/candlestick-line demo: a moving
 * average over the price).
 *
 * The candles were classed by the chart's type, `line`, so they were
 * `apexcharts-line-area` paths. The intersect tooltip looks for a candle by
 * its class and found none: hovering a candle on SVG showed nothing. The
 * default shared tooltip did show, but read the candle as a bar and put the
 * crosshair half a candle off its middle. Canvas agreement is covered in
 * canvas-bar-tooltip.spec.js.
 */

import { test, expect } from '../fixtures/base.js'

async function hover(page, { x, y }) {
  await page.mouse.move(2, 2)
  await page.waitForTimeout(40)
  await page.mouse.move(x - 1, y - 1)
  await page.mouse.move(x, y)
  await page.waitForTimeout(150)
}

/** Screen points on candle `j`: the middle of its body, and its upper wick. */
async function candleSpots(page, j) {
  return page.evaluate((j) => {
    const p = document.querySelector(
      `.apexcharts-candlestick-series path[j='${j}']`,
    )
    const r = p.getBoundingClientRect()
    const m = p.getScreenCTM().inverse()
    const pt = p.ownerSVGElement.createSVGPoint()
    const cx = Math.round(r.left + r.width / 2)
    // the wick: on the stroke, clear of the body's fill
    let wick = null
    for (let y = Math.ceil(r.top); y < r.bottom && !wick; y++) {
      pt.x = cx
      pt.y = y
      const q = pt.matrixTransform(m)
      if (p.isPointInStroke(q) && !p.isPointInFill(q)) wick = { x: cx, y }
    }
    pt.y = Math.round(r.top + r.height / 2)
    let body = null
    for (let d = 0; d < r.height / 2 && !body; d++) {
      for (const y of [pt.y + d, pt.y - d]) {
        const q = p.ownerSVGElement.createSVGPoint()
        q.x = cx
        q.y = y
        if (p.isPointInFill(q.matrixTransform(m))) {
          body = { x: cx, y }
          break
        }
      }
    }
    return {
      className: p.getAttribute('class'),
      body,
      wick,
      above: { x: cx, y: Math.round(r.top - 12) },
    }
  }, j)
}

async function readTooltip(page) {
  return page.evaluate(() => {
    const el = document.querySelector(
      '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
    )
    return {
      active: el.classList.contains('apexcharts-active'),
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      j: window.chart.w.interact.capturedDataPointIndex,
    }
  })
}

test.describe('candlestick/candlestick-line', () => {
  test('intersect: a candle shows its own tooltip on its body and its wick', async ({
    page,
    loadChart,
  }) => {
    await loadChart('candlestick', 'candlestick-line')
    await page.evaluate(() =>
      window.chart.updateOptions({
        chart: { animations: { enabled: false } },
        tooltip: { shared: false, intersect: true },
      }),
    )
    await page.waitForTimeout(250)

    const j = 10
    const spots = await candleSpots(page, j)
    expect(spots.body).not.toBeNull()
    expect(spots.wick).not.toBeNull()

    const ohlc = await page.evaluate((j) => {
      const w = window.chart.w
      return ['O', 'H', 'L', 'C'].map(
        (k) => w.candleData[`seriesCandle${k}`][1][j],
      )
    }, j)
    // the demo's custom tooltip for the candle series
    const expected = `Open: ${ohlc[0]}High: ${ohlc[1]}Low: ${ohlc[2]}Close: ${ohlc[3]}`

    for (const spot of [spots.body, spots.wick]) {
      await hover(page, spot)
      const tt = await readTooltip(page)
      expect(tt.active, `(${spot.x}, ${spot.y})`).toBe(true)
      expect(tt.j).toBe(j)
      expect(tt.text).toBe(expected)
    }

    // past the candle, on nothing
    await hover(page, spots.above)
    expect((await readTooltip(page)).active).toBe(false)

    // what the tooltip, the keyboard and the focus style know a candle by
    expect(spots.className).toBe('apexcharts-candlestick-area')
  })

  test('the default shared tooltip puts the crosshair on the middle of the candle', async ({
    page,
    loadChart,
  }) => {
    await loadChart('candlestick', 'candlestick-line')
    const marks = await page.evaluate(() =>
      [...document.querySelectorAll('.apexcharts-candlestick-series path[j]')]
        .filter((p, k) => k % 5 === 0)
        .map((p) => {
          const r = p.getBoundingClientRect()
          return {
            j: Number(p.getAttribute('j')),
            x: Math.round(r.left + r.width / 2),
            y: Math.round(r.top + r.height / 2),
          }
        }),
    )
    expect(marks.length).toBeGreaterThan(5)
    for (const m of marks) {
      await hover(page, m)
      const at = await page.evaluate((j) => {
        const band = document.querySelector('.apexcharts-xcrosshairs')
        const width = window.chart.ctx.tooltip.xcrosshairsWidth
        const box = document
          .querySelector(`.apexcharts-candlestick-series path[j='${j}']`)
          .getBBox()
        return {
          active: document
            .querySelector('.apexcharts-tooltip')
            .classList.contains('apexcharts-active'),
          j: window.chart.w.interact.capturedDataPointIndex,
          offset:
            Number(band.getAttribute('x')) +
            width / 2 -
            (box.x + box.width / 2),
        }
      }, m.j)
      expect(at.active, `candle ${m.j}`).toBe(true)
      expect(at.j, `candle ${m.j}`).toBe(m.j)
      // within a pixel of the middle (it sat 2.8px off on half the candles)
      expect(Math.abs(at.offset), `candle ${m.j}`).toBeLessThanOrEqual(1)
    }
  })
})
