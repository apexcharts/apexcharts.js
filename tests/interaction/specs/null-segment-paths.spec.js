/**
 * A null-split line or area series is ONE path element (#3249).
 *
 * A null breaks the line, and that break used to be expressed by emitting a
 * separate `<path>` **element** per surviving segment. In SVG a gap is just
 * another subpath, so the whole series fits in one element and one `d`. The
 * element-per-segment version cost a DOM node, its attributes, its listeners
 * and a getBBox each, which is why a series with many nulls rendered so
 * disproportionately slowly: ~20us per null against ~0.5us for an ordinary
 * point, so 286 nulls meant 288 path elements and a 3x render at 2000 points.
 *
 * These tests assert the DOM shape rather than timings, because the element
 * count IS the mechanism and it does not flake on a loaded machine. The one
 * timing test below is written as a ratio against the same chart's clean
 * render, with a very loose bound, so it only fires if the per-null cost comes
 * back at the order of magnitude it had.
 *
 * The gap has to stay visible, so the merged `d` is also asserted to carry one
 * `M` per segment: a series drawn as a single continuous line through its own
 * gaps would be a wrong picture that this element count alone cannot catch.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  boot: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    /**
     * @param {{type?: string, points?: number, nullEvery?: number,
     *          curve?: string, series?: number, markers?: number}} o
     */
    const boot = async (o = {}) => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart" style="width:900px;height:400px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (opt) => {
        const points = opt.points ?? 300
        const seriesCount = opt.series ?? 1
        const mk = (seed) => {
          const out = []
          const t0 = Date.UTC(2024, 0, 1)
          for (let i = 0; i < points; i++) {
            const nulled = opt.nullEvery && i % opt.nullEvery === 0
            out.push([
              t0 + i * 3600_000,
              nulled ? null : Math.round(50 + 40 * Math.sin((i + seed) / 9)),
            ])
          }
          return out
        }
        window.chart = new ApexCharts(document.querySelector('#chart'), {
          chart: {
            type: opt.type ?? 'line',
            height: 400,
            width: 900,
            animations: { enabled: false },
          },
          series: Array.from({ length: seriesCount }, (_, s) => ({
            name: `s${s}`,
            data: mk(s * 5),
          })),
          xaxis: { type: 'datetime' },
          dataLabels: { enabled: false },
          markers: { size: opt.markers ?? 0 },
          stroke: { curve: opt.curve ?? 'straight', width: 2 },
        })
        await window.chart.render()
      }, o)
      await page.waitForFunction(
        () => window.chart?.w?.globals?.animationEnded === true,
        { timeout: 8000 },
      )
      await page.waitForTimeout(80)
    }

    await use(boot)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

/** Per-series stroke path elements, and the subpath count of the first one. */
const readPaths = (page, cls) =>
  page.evaluate((c) => {
    const els = Array.from(document.querySelectorAll(`.apexcharts-${c}`))
    const d = els[0]?.getAttribute('d') || ''
    return {
      count: els.length,
      moveCmds: (d.match(/M/g) || []).length,
      dLength: d.length,
    }
  }, cls)

test.describe('Null-split series render as one path element (#3249)', () => {
  test('a line with many gaps is one element with one M per segment', async ({
    page,
    boot,
  }) => {
    // 300 points, every 7th null: 43 gaps. Used to be ~44 path elements.
    await boot({ points: 300, nullEvery: 7 })

    const line = await readPaths(page, 'line')
    expect(line.count).toBe(1)
    // The gaps must still be gaps: one subpath per surviving run.
    expect(line.moveCmds).toBeGreaterThan(30)
  })

  test('an area with many gaps is two elements, fill plus stroke', async ({
    page,
    boot,
  }) => {
    await boot({ type: 'area', points: 300, nullEvery: 7 })

    // An area series emits its fill and its stroke, both classed
    // `apexcharts-area`. Two elements for the whole series, where it used to be
    // two PER segment (~88 for this data).
    const area = await readPaths(page, 'area')
    expect(area.count).toBe(2)
    // Both carry the gaps as subpaths rather than being drawn straight through.
    expect(area.moveCmds).toBeGreaterThan(30)
  })

  test('one element PER SERIES, not one for the chart', async ({
    page,
    boot,
  }) => {
    await boot({ points: 200, nullEvery: 5, series: 3 })

    const line = await readPaths(page, 'line')
    expect(line.count).toBe(3)
  })

  test('a gapless series is unchanged: one element, one M', async ({
    page,
    boot,
  }) => {
    await boot({ points: 300 })

    const line = await readPaths(page, 'line')
    expect(line.count).toBe(1)
    expect(line.moveCmds).toBe(1)
  })

  test('smooth curves merge too', async ({ page, boot }) => {
    await boot({ points: 300, nullEvery: 7, curve: 'smooth' })

    const line = await readPaths(page, 'line')
    expect(line.count).toBe(1)
    expect(line.moveCmds).toBeGreaterThan(30)
  })

  test('the per-null render cost is no longer an order of magnitude', async ({
    page,
    boot,
  }) => {
    // Deliberately loose: this is a smoke bound on the mechanism coming back,
    // not a performance target. Pre-fix this ratio was ~3x at 2000 points and
    // ~4.6x at 5000; a healthy build measures ~1.4x.
    await boot({ points: 10 }) // page scaffold + the library
    const time = await page.evaluate(async () => {
      const render = async (nullEvery) => {
        const points = 2000
        const t0 = Date.UTC(2024, 0, 1)
        const data = []
        for (let i = 0; i < points; i++) {
          data.push([
            t0 + i * 3600_000,
            nullEvery && i % nullEvery === 0
              ? null
              : Math.round(50 + 40 * Math.sin(i / 9)),
          ])
        }
        const host = document.getElementById('chart')
        host.innerHTML = '<div id="inner" style="width:900px;height:400px"></div>'
        const c = new ApexCharts(document.querySelector('#inner'), {
          chart: {
            type: 'line',
            height: 400,
            width: 900,
            animations: { enabled: false },
          },
          series: [{ name: 'a', data }],
          xaxis: { type: 'datetime' },
          dataLabels: { enabled: false },
          markers: { size: 0 },
          stroke: { curve: 'straight', width: 2 },
        })
        const t = performance.now()
        await c.render()
        const ms = performance.now() - t
        c.destroy()
        return ms
      }
      // Warm up first: an unwarmed comparison once made nulls look FASTER,
      // because the clean run paid for the JIT.
      await render(0)
      await render(7)
      const med = async (nullEvery) => {
        const s = []
        for (let i = 0; i < 5; i++) s.push(await render(nullEvery))
        return s.sort((a, b) => a - b)[2]
      }
      const clean = await med(0)
      const gaps = await med(7)
      return { clean, gaps, ratio: gaps / clean }
    })

    expect(
      time.ratio,
      `nulls cost ${time.ratio.toFixed(2)}x a clean render ` +
        `(${time.clean.toFixed(1)}ms -> ${time.gaps.toFixed(1)}ms)`,
    ).toBeLessThan(2.5)
  })
})
