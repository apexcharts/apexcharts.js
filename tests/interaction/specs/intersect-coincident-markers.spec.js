/**
 * Markers of several series drawn at one spot, with an intersect tooltip
 * (tooltip.intersect, shared: false: what a chart with marker click events
 * gets from the wrappers). Only the marker drawn last can be under the
 * pointer, so hovering the spot listed that one series, and markerClick,
 * dataPointSelection and click named that one point: the series under it
 * could not be reached at all (apexcharts.js#4778).
 *
 * Now the tooltip lists every series drawn there, and the events keep the
 * topmost point as seriesIndex / dataPointIndex and add `coincident`, every
 * point at the spot. A spot one series has to itself is as it was.
 *
 * Real pointer moves and clicks throughout: hit testing decides which
 * marker is topmost, which a synthetic event on a chosen node would not.
 */

import { test, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
// Jul (6): all four series at 15. Jan (0): every series on its own.
const values = [
  [10, 20, 30, 40, 40, 20, 15, 40],
  [20, 20, 20, 30, 30, 15, 15, 20],
  [40, 30, 25, 10, 10, 20, 15, 35],
  [50, 40, 35, 30, 20, 25, 15, 30],
]

async function mountChart(page) {
  await page.setContent(
    '<!doctype html><body style="margin:0"><div id="stage" style="width:800px;margin:20px"></div></body>',
  )
  await page.addScriptTag({ path: resolve(rootDir, 'dist', 'apexcharts.js') })
  await page.evaluate(
    async ({ months, values }) => {
      window.__events = []
      const push = (name) => (_e, _ctx, cfg) =>
        window.__events.push({
          name,
          seriesIndex: Number(cfg.seriesIndex),
          dataPointIndex: Number(cfg.dataPointIndex),
          coincident: cfg.coincident
            ? cfg.coincident.map((p) => [p.seriesIndex, p.dataPointIndex])
            : null,
        })
      window.chart = new window.ApexCharts(document.querySelector('#stage'), {
        chart: {
          type: 'line',
          height: 400,
          animations: { enabled: false },
          events: {
            markerClick: push('markerClick'),
            dataPointSelection: push('dataPointSelection'),
            click: push('click'),
          },
        },
        series: values.map((v, i) => ({
          name: 'Series ' + (i + 1),
          data: v.map((y, j) => ({ x: months[j], y })),
        })),
        markers: { size: 6 },
        tooltip: { intersect: true, shared: false },
      })
      await window.chart.render()
    },
    { months, values },
  )
}

/** The client centre of series i's marker at point j. */
function centreOf(page, i, j) {
  return page.evaluate(
    ([i, j]) => {
      const m = document.querySelector(
        `.apexcharts-marker[index="${i}"][rel="${j}"]`,
      )
      const r = m.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    },
    [i, j],
  )
}

/** The tooltip rows on show, as "name: value", top to bottom. */
function shownRows(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.apexcharts-tooltip-series-group')]
      .filter((r) => getComputedStyle(r).display !== 'none')
      .sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
      )
      .map((r) =>
        r
          .querySelector('.apexcharts-tooltip-text')
          .textContent.replace(/\s+/g, ' ')
          .trim(),
      ),
  )
}

async function clickAt(page, { x, y }) {
  await page.evaluate(() => (window.__events = []))
  await page.mouse.click(x, y)
  await expect
    .poll(() => page.evaluate(() => window.__events.map((e) => e.name).sort()))
    .toEqual(['click', 'dataPointSelection', 'markerClick'])
  return page.evaluate(() => window.__events)
}

test.describe('intersect tooltip on markers drawn at one spot', () => {
  test('hovering the shared spot lists every series drawn there', async ({
    page,
  }) => {
    await mountChart(page)
    const p = await centreOf(page, 3, 6)
    await page.mouse.move(p.x - 30, p.y)
    await page.mouse.move(p.x, p.y)

    await expect
      .poll(() => shownRows(page))
      .toEqual(['Series 1: 15', 'Series 2: 15', 'Series 3: 15', 'Series 4: 15'])
    await expect(page.locator('.apexcharts-tooltip-title')).toHaveText('Jul')

    // The box was measured with its four rows: it stays inside the chart.
    const fits = await page.evaluate(() => {
      const tt = document
        .querySelector('.apexcharts-tooltip')
        .getBoundingClientRect()
      const chart = document
        .querySelector('.apexcharts-canvas')
        .getBoundingClientRect()
      return (
        tt.height > 0 &&
        tt.bottom <= chart.bottom + 1 &&
        tt.top >= chart.top - 1
      )
    })
    expect(fits).toBe(true)

    // A spot one series has to itself: its single row, as before.
    const alone = await centreOf(page, 2, 0)
    await page.mouse.move(alone.x, alone.y)
    await expect.poll(() => shownRows(page)).toEqual(['Series 3: 40'])
    await expect(page.locator('.apexcharts-tooltip-title')).toHaveText('Jan')

    // and back
    await page.mouse.move(p.x, p.y)
    await expect.poll(() => shownRows(page)).toHaveLength(4)
  })

  test('clicking the shared spot names the topmost point and every coincident one', async ({
    page,
  }) => {
    await mountChart(page)
    const p = await centreOf(page, 3, 6)
    await page.mouse.move(p.x, p.y)
    const events = await clickAt(page, p)

    for (const ev of events) {
      expect(ev.seriesIndex, ev.name).toBe(3)
      expect(ev.dataPointIndex, ev.name).toBe(6)
      expect(ev.coincident, ev.name).toEqual([
        [0, 6],
        [1, 6],
        [2, 6],
        [3, 6],
      ])
    }
  })

  test('clicking a marker no other series shares is unchanged', async ({
    page,
  }) => {
    await mountChart(page)
    const p = await centreOf(page, 2, 0)
    await page.mouse.move(p.x, p.y)
    const events = await clickAt(page, p)

    for (const ev of events) {
      expect(ev.seriesIndex, ev.name).toBe(2)
      expect(ev.dataPointIndex, ev.name).toBe(0)
      expect(ev.coincident, ev.name).toEqual([[2, 0]])
    }
  })
})
