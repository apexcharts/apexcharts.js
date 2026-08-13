/**
 * The two explode demos, driven the way a reader would drive them.
 *
 * The e2e snapshots cover how each sample first renders; nothing else covers
 * the button, which is the entire point of both pages. These also pin the two
 * claims the demos make in prose, so the writing cannot quietly stop being
 * true: that the histogram gives back every one of its observations, and that
 * the three box plots really do share one five-number summary.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

test.describe('histogram explode demo', () => {
  test('bars become every delivery, and come back', async ({
    page,
    loadChart,
    consoleErrors,
  }) => {
    await loadChart('histogram', 'explode-to-observations')

    const before = await page.evaluate(() => ({
      bars: document.querySelectorAll('.apexcharts-bar-series path[pathTo]').length,
      dots: document.querySelectorAll('.apexcharts-unit-area').length,
    }))

    await page.click('[data-explode="true"]')
    await page.waitForTimeout(1600)

    const exploded = await page.evaluate(() => ({
      dots: document.querySelectorAll('.apexcharts-unit-area').length,
      bars: document.querySelectorAll('.apexcharts-bar-series path[pathTo]').length,
      readout: document.querySelector('#readout')?.textContent?.trim() ?? '',
      // The demo colours each bar's dots by how late that bar was, so an
      // anonymous blob would show up here as a single colour.
      colours: new Set(
        [...document.querySelectorAll('.apexcharts-unit-area')].map((d) =>
          d.getAttribute('fill'),
        ),
      ).size,
      // The transition is over: the outgoing bars must not be left behind.
      ghosts: document.querySelectorAll('.apexcharts-morph-ghost').length,
    }))

    await page.click('[data-explode="false"]')
    await page.waitForTimeout(1600)

    const back = await page.evaluate(() => ({
      bars: document.querySelectorAll('.apexcharts-bar-series path[pathTo]').length,
      dots: document.querySelectorAll('.apexcharts-unit-area').length,
      ghosts: document.querySelectorAll('.apexcharts-morph-ghost').length,
    }))

    expect(before.bars).toBe(22)
    expect(before.dots).toBe(0)
    // One dot per delivery: the sample is 640 observations and none may be
    // lost or invented on the way through rowSeries().
    expect(exploded.dots).toBe(640)
    expect(exploded.bars).toBe(0)
    expect(exploded.readout).toContain('640')
    expect(exploded.colours).toBeGreaterThan(8)
    expect(exploded.ghosts).toBe(0)
    // Round trip: the same 22 bars, no dots stranded behind them.
    expect(back.bars).toBe(22)
    expect(back.dots).toBe(0)
    expect(back.ghosts).toBe(0)
    expect(consoleErrors).toEqual([])
  })
})

test.describe('same box, different data demo', () => {
  test('all three groups share one summary, and hold different samples', async ({
    page,
    loadChart,
    consoleErrors,
  }) => {
    await loadChart('boxPlot', 'same-box-different-data')

    const summaries = await page.evaluate(() => {
      const chart = window.ApexCharts.getChartByID('sameBox')
      return {
        derived: chart.w.config.series[0].data.map((d) => d.y),
        boxes: document.querySelectorAll('.apexcharts-boxPlot-area').length,
      }
    })

    // The claim the whole page rests on. Derived by the library from the raw
    // observations, not supplied, so this is a real check rather than an echo.
    expect(summaries.derived[0]).toEqual([20, 35, 50, 65, 80])
    expect(summaries.derived[1]).toEqual(summaries.derived[0])
    expect(summaries.derived[2]).toEqual(summaries.derived[0])
    expect(summaries.boxes).toBe(6)

    await page.click('[data-explode="true"]')
    await page.waitForTimeout(1800)

    const exploded = await page.evaluate(() => {
      const byLane = {}
      const spanByLane = {}
      document.querySelectorAll('.apexcharts-unit-area').forEach((d) => {
        const i = +d.getAttribute('i')
        const cx = d.getAttribute('cx')
        const x = cx != null ? +cx : +d.getAttribute('x')
        byLane[i] = (byLane[i] || 0) + 1
        const s = (spanByLane[i] = spanByLane[i] || { min: 1e9, max: -1e9 })
        s.min = Math.min(s.min, x)
        s.max = Math.max(s.max, x)
      })
      // How tightly each lane's readings bunch around its own middle: the
      // fraction of dots within the central third of its span. The three
      // groups are supposed to differ here even though their boxes do not.
      const central = Object.keys(spanByLane).map((i) => {
        const s = spanByLane[i]
        const lo = s.min + (s.max - s.min) / 3
        const hi = s.max - (s.max - s.min) / 3
        let n = 0
        document.querySelectorAll('.apexcharts-unit-area').forEach((d) => {
          if (+d.getAttribute('i') !== +i) return
          const cx = d.getAttribute('cx')
          const x = cx != null ? +cx : +d.getAttribute('x')
          if (x >= lo && x <= hi) n++
        })
        return n
      })
      return {
        dots: document.querySelectorAll('.apexcharts-unit-area').length,
        byLane,
        central,
        ghosts: document.querySelectorAll('.apexcharts-morph-ghost').length,
      }
    })

    await page.click('[data-explode="false"]')
    await page.waitForTimeout(1800)
    const back = await page.evaluate(() => ({
      boxes: document.querySelectorAll('.apexcharts-boxPlot-area').length,
      dots: document.querySelectorAll('.apexcharts-unit-area').length,
    }))

    expect(exploded.dots).toBe(180)
    expect(exploded.byLane).toEqual({ 0: 60, 1: 60, 2: 60 })
    expect(exploded.ghosts).toBe(0)

    // "Two camps" hollows out its middle, "Bunched in the middle" piles into
    // it, and the even one sits between. If the three ever collapse onto the
    // same shape the page stops making its point, which is exactly the way
    // this demo failed the first time it was built.
    const [camps, even, bunched] = exploded.central
    expect(bunched).toBeGreaterThan(even)
    expect(even).toBeGreaterThan(camps)

    expect(back.boxes).toBe(6)
    expect(back.dots).toBe(0)
    expect(consoleErrors).toEqual([])
  })
})
