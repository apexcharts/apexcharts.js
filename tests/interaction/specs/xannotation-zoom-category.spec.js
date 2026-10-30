/**
 * An x range annotation on a zoomed converted category axis
 * (Blazor-ApexCharts #557).
 *
 * A line chart whose x values are strings and which names no xaxis.type (ISO
 * dates as a .NET DateTime serializes) gets a category axis converted to
 * numeric. After a zoom its label list only holds the visible window's ticks,
 * so an annotation end outside the window found nothing to look up and was
 * clamped to the left edge. Zoomed entirely inside a band, the band drew 0px
 * wide and vanished; zoomed over the start of a band, the clamped x2 swapped
 * with x and the band was painted over the part of the window it does not
 * cover.
 *
 * Each case is measured against the grid and the zoom window rather than a
 * recorded pixel count, and the same chart on a datetime axis is the control.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const test = base.extend({
  /**
   * Renders a 24h line chart (one point per 10 minutes) with a 00:00 to 12:00
   * band and a 13:00 to 20:00 band. `mode` is 'iso' (strings, no xaxis.type)
   * or 'datetime' (epoch ms on a datetime axis).
   */
  chart: async ({ page }, use) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))

    /** @param {'iso' | 'datetime'} mode */
    const render = async (mode) => {
      await page.goto('about:blank')
      await page.setContent('<div id="chart" style="width:900px"></div>')
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (mode) => {
        const day = Date.UTC(2024, 11, 19)
        const hour = 3600000
        const toX = (ms) =>
          mode === 'iso'
            ? new Date(ms).toISOString().replace('.000Z', '')
            : ms
        const data = []
        for (let t = day; t < day + 24 * hour; t += 600000) {
          data.push({ x: toX(t), y: Math.round(50 + 40 * Math.sin(t / hour)) })
        }
        const chart = new ApexCharts(document.querySelector('#chart'), {
          chart: { type: 'line', height: 400, animations: { enabled: false } },
          series: [{ name: 'Net Profit', data }],
          xaxis: mode === 'iso' ? {} : { type: 'datetime' },
          annotations: {
            xaxis: [
              { id: 'am', x: toX(day), x2: toX(day + 12 * hour) },
              { id: 'pm', x: toX(day + 13 * hour), x2: toX(day + 20 * hour) },
            ],
            points: [
              {
                id: 'pt-1am',
                x: toX(day + hour),
                y: 50,
                marker: { size: 5 },
              },
              {
                id: 'pt-4am',
                x: toX(day + 4 * hour),
                y: 50,
                marker: { size: 5 },
              },
            ],
          },
        })
        window.chart = chart
        // A category axis zooms by 1-based point index.
        window.zoomHours = (a, b) =>
          mode === 'iso'
            ? chart.zoomX(a * 6 + 1, b * 6 + 1)
            : chart.zoomX(day + a * hour, day + b * hour)
        await chart.render()
      }, mode)
    }

    /** Zoom to [a, b] hours and report the bands and markers. */
    const zoom = async (a, b) => {
      const before = await page.evaluate(() => window.chart.w.globals.minX)
      await page.evaluate(([a, b]) => window.zoomHours(a, b), [a, b])
      await page.waitForFunction(
        (before) => window.chart.w.globals.minX !== before,
        before,
      )
      return state()
    }

    const state = () =>
      page.evaluate(() => {
        const w = window.chart.w
        const band = (id) => {
          const r = document.querySelector(`.apexcharts-annotation-rect.${id}`)
          return r
            ? { x: Number(r.getAttribute('x')), width: Number(r.getAttribute('width')) }
            : null
        }
        return {
          converted: w.config.xaxis.convertedCatToNumeric,
          gridWidth: w.layout.gridWidth,
          am: band('am'),
          pm: band('pm'),
          pt1: document.querySelectorAll('.apexcharts-point-annotation-marker.pt-1am').length,
          pt4: document.querySelectorAll('.apexcharts-point-annotation-marker.pt-4am').length,
        }
      })

    await use({ render, zoom, state })
    expect(errors).toEqual([])
  },
})

for (const mode of ['iso', 'datetime']) {
  test.describe(`x range annotation zoomed on a ${mode} axis`, () => {
    test('zoomed inside a band, the band fills the plot', async ({ chart }) => {
      await chart.render(mode)
      expect((await chart.state()).converted).toBe(mode === 'iso')
      const s = await chart.zoom(2, 6)
      expect(s.am.x).toBeCloseTo(0, 1)
      expect(s.am.width).toBeCloseTo(s.gridWidth, 1)
      // the afternoon band lies right of the window
      expect(s.pm.width).toBeCloseTo(0, 1)
      // a marker left of the window is hidden, one inside it is drawn
      expect(s.pt1).toBe(0)
      expect(s.pt4).toBe(1)
    })

    test('zoomed across both bands, each covers only its own part', async ({
      chart,
    }) => {
      await chart.render(mode)
      // 10:00 to 14:00: the morning band ends at 12:00 (the middle), the
      // afternoon band starts at 13:00 (three quarters in)
      const s = await chart.zoom(10, 14)
      expect(s.am.x).toBeCloseTo(0, 1)
      expect(Math.abs(s.am.width - s.gridWidth / 2)).toBeLessThan(2)
      expect(Math.abs(s.pm.x - (s.gridWidth * 3) / 4)).toBeLessThan(2)
      expect(s.pm.x + s.pm.width).toBeCloseTo(s.gridWidth, 1)
    })

    test('zoomed outside a band, the band is not drawn over the plot', async ({
      chart,
    }) => {
      await chart.render(mode)
      // 20:30 to 23:30 is past both bands
      const s = await chart.zoom(20.5, 23.5)
      expect(s.am.width).toBeCloseTo(0, 1)
      expect(s.pm.width).toBeCloseTo(0, 1)
    })
  })
}
