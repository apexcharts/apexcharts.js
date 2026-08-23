/**
 * markers.largeDatasetThreshold: a series' markers as ONE path element.
 *
 * One element per marker costs a node, ~16 attribute writes and an appendChild,
 * which is what makes markers dominate a large render (2000 of them were 15ms of
 * an 18ms render). Batched, the series is a single path carrying a subpath per
 * point.
 *
 * It is opt-in and stays opt-in, because it is NOT pixel-identical: one path is
 * rasterized as a single region, so overlapping markers lose their individual
 * outlines. Above ~1000 points in a normal-width chart markers always overlap,
 * so this cannot be turned on for everyone. Hence the two halves of this spec:
 * the default must keep emitting one element per point, and every gate that
 * needs per-point nodes must decline batching even when asked.
 *
 * With no `.apexcharts-marker` nodes, the tooltip serves the hover dot from its
 * own marker and positions off `w.globals.pointsArray` -- the same path a
 * markers.size: 0 chart has always taken. Those are asserted here too, since
 * that is the part a reader would expect to break.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

/** Comfortably over the threshold used below, and dense enough to overlap. */
const POINTS = 1400
const THRESHOLD = 1000

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  boot: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    /**
     * Handlers are passed as booleans, not functions: a function cannot be
     * serialized across the page boundary, and only their presence is tested.
     * @param {{points?: number, threshold?: number, series?: number,
     *          markers?: object, tooltip?: object, onDataPointSelection?: boolean,
     *          onMarkerClick?: boolean, perPointColor?: boolean, type?: string}} o
     */
    const boot = async (o = {}) => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart" style="width:1100px;height:400px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (opt) => {
        const points = opt.points ?? 1400
        const seriesCount = opt.series ?? 1
        const t0 = Date.UTC(2024, 0, 1)
        const mk = (/** @type {number} */ seed) => {
          const out = []
          for (let i = 0; i < points; i++) {
            const y = Math.round(50 + 40 * Math.sin((i + seed) / 9))
            // a per-point colour makes the series non-uniform, so it cannot
            // share one path's style attributes
            out.push(
              opt.perPointColor && i === 3
                ? { x: t0 + i * 3600_000, y, fillColor: '#ff0000' }
                : [t0 + i * 3600_000, y],
            )
          }
          return out
        }
        window.chart = new ApexCharts(document.querySelector('#chart'), {
          chart: {
            type: opt.type ?? 'line',
            height: 400,
            width: 1100,
            animations: { enabled: false },
            ...(opt.onDataPointSelection
              ? { events: { dataPointSelection: () => {} } }
              : {}),
          },
          series: Array.from({ length: seriesCount }, (_, s) => ({
            name: `s${s}`,
            data: mk(s * 11),
          })),
          xaxis: { type: 'datetime' },
          dataLabels: { enabled: false },
          markers: {
            size: 4,
            largeDatasetThreshold: opt.threshold ?? 0,
            ...(opt.markers || {}),
            ...(opt.onMarkerClick ? { onClick: () => {} } : {}),
          },
          ...(opt.tooltip ? { tooltip: opt.tooltip } : {}),
          stroke: { curve: 'straight', width: 2 },
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

/** DOM census of the marker layer. */
const census = (page) =>
  page.evaluate(() => {
    const batch = document.querySelectorAll('.apexcharts-marker-batch')
    return {
      batched: window.chart.w.globals.markers.batched,
      // legend markers also carry .apexcharts-marker, so scope to the plot
      perPoint: document.querySelectorAll(
        '.apexcharts-series-markers-wrap .apexcharts-marker',
      ).length,
      batchEls: batch.length,
      subpaths: (batch[0]?.getAttribute('d')?.match(/M/g) || []).length,
      pointsArray: (window.chart.w.globals.pointsArray[0] || []).length,
    }
  })

test.describe('Marker batching (markers.largeDatasetThreshold)', () => {
  test('is off by default: one element per point', async ({ page, boot }) => {
    await boot({ points: POINTS })

    const c = await census(page)
    expect(c.batched).toBe(false)
    expect(c.batchEls).toBe(0)
    // the marker layer holds one element per data point and nothing else
    expect(c.perPoint).toBe(POINTS)
  })

  test('opted in: one path with a subpath per point, no marker nodes', async ({
    page,
    boot,
  }) => {
    await boot({ points: POINTS, threshold: THRESHOLD })

    const c = await census(page)
    expect(c.batched).toBe(true)
    expect(c.batchEls).toBe(1)
    expect(c.subpaths).toBe(POINTS)
    // the only marker node left is the tooltip's own hover dot
    expect(c.perPoint).toBe(1)
    // and the coords the tooltip positions off are cached, as in canvas mode
    expect(c.pointsArray).toBe(POINTS)
  })

  test('one batch element per series', async ({ page, boot }) => {
    await boot({ points: POINTS, threshold: THRESHOLD, series: 3 })

    const c = await census(page)
    expect(c.batchEls).toBe(3)
    expect(c.perPoint).toBe(3) // one hover dot each
  })

  test('the batch never intercepts pointer events', async ({ page, boot }) => {
    await boot({ points: POINTS, threshold: THRESHOLD })

    const inert = await page.evaluate(() => {
      const el = document.querySelector('.apexcharts-marker-batch')
      return {
        klass: el.getAttribute('class'),
        pointerEvents: getComputedStyle(el).pointerEvents,
      }
    })
    expect(inert.pointerEvents).toBe('none')
    // NOT `apexcharts-marker`: that class is how the tooltip finds a node to
    // enlarge, and resetPointsSize rewrites the `d` of every match, so a batch
    // wearing it would lose its whole subpath list on first mouseover
    expect(inert.klass.split(/\s+/)).not.toContain('apexcharts-marker')
  })

  test('area charts batch too', async ({ page, boot }) => {
    await boot({ points: POINTS, threshold: THRESHOLD, type: 'area' })

    const c = await census(page)
    expect(c.batched).toBe(true)
    expect(c.subpaths).toBe(POINTS)
  })

  test.describe('gates: batching is declined when a point needs its own node', () => {
    test('a series under the threshold', async ({ page, boot }) => {
      await boot({ points: 400, threshold: THRESHOLD })

      const c = await census(page)
      expect(c.batched).toBe(false)
      expect(c.perPoint).toBe(400)
    })

    test('discrete markers', async ({ page, boot }) => {
      await boot({
        points: POINTS,
        threshold: THRESHOLD,
        markers: { discrete: [{ seriesIndex: 0, dataPointIndex: 5, size: 9 }] },
      })

      expect((await census(page)).batched).toBe(false)
    })

    test('a per-point fillColor', async ({ page, boot }) => {
      await boot({ points: POINTS, threshold: THRESHOLD, perPointColor: true })

      expect((await census(page)).batched).toBe(false)
    })

    test('a marker click handler', async ({ page, boot }) => {
      await boot({
        points: POINTS,
        threshold: THRESHOLD,
        onMarkerClick: true,
      })

      expect((await census(page)).batched).toBe(false)
    })

    test('an intersect tooltip, which hit-tests the markers', async ({
      page,
      boot,
    }) => {
      await boot({
        points: POINTS,
        threshold: THRESHOLD,
        tooltip: { intersect: true, shared: false },
      })

      expect((await census(page)).batched).toBe(false)
    })

    test('a dataPointSelection handler', async ({ page, boot }) => {
      await boot({
        points: POINTS,
        threshold: THRESHOLD,
        onDataPointSelection: true,
      })

      expect((await census(page)).batched).toBe(false)
    })
  })

  test.describe('the tooltip still works without marker nodes', () => {
    test('hover shows the tooltip and moves the hover dot onto the point', async ({
      page,
      boot,
    }) => {
      await boot({ points: POINTS, threshold: THRESHOLD, series: 2 })

      const box = await page.locator('#chart').boundingBox()
      await page.mouse.move(box.x + 500, box.y + 200)
      await page.waitForTimeout(200)

      const state = await page.evaluate(() => {
        const tt = document.querySelector('.apexcharts-tooltip')
        const dots = [
          ...document.querySelectorAll(
            '.apexcharts-series-markers .apexcharts-marker',
          ),
        ].map((n) => parseFloat(n.getAttribute('cx')))
        return {
          active: tt.classList.contains('apexcharts-active'),
          text: tt.textContent.replace(/\s+/g, ' ').trim(),
          crosshairX: parseFloat(
            document
              .querySelector('.apexcharts-xcrosshairs')
              .getAttribute('x') ?? 'NaN',
          ),
          dots,
        }
      })

      expect(state.active).toBe(true)
      expect(state.text).toMatch(/s0/)
      expect(state.text).toMatch(/s1/)
      // one hover dot per series, both parked on the hovered x (which is where
      // the crosshair is, give or take the dot's own half-width)
      expect(state.dots).toHaveLength(2)
      state.dots.forEach((cx) => {
        expect(Math.abs(cx - state.crosshairX)).toBeLessThan(2)
      })
    })

    test('the hover dot rides the pointer across the plot', async ({
      page,
      boot,
    }) => {
      await boot({ points: POINTS, threshold: THRESHOLD })

      const box = await page.locator('#chart').boundingBox()
      const dotX = () =>
        page.evaluate(() =>
          parseFloat(
            document
              .querySelector('.apexcharts-series-markers .apexcharts-marker')
              .getAttribute('cx'),
          ),
        )

      await page.mouse.move(box.x + 300, box.y + 200)
      await page.waitForTimeout(150)
      const near = await dotX()

      await page.mouse.move(box.x + 800, box.y + 200)
      await page.waitForTimeout(150)
      const far = await dotX()

      expect(far).toBeGreaterThan(near + 400)
    })
  })

  test('a data update keeps the batch a batch', async ({ page, boot }) => {
    await boot({ points: POINTS, threshold: THRESHOLD })

    await page.evaluate(async () => {
      const t0 = Date.UTC(2024, 0, 1)
      const data = Array.from({ length: 1200 }, (_, i) => [
        t0 + i * 3600_000,
        Math.round(60 + 20 * Math.cos(i / 7)),
      ])
      await window.chart.updateSeries([{ name: 's0', data }])
    })
    await page.waitForTimeout(200)

    const c = await census(page)
    expect(c.batched).toBe(true)
    expect(c.batchEls).toBe(1)
    expect(c.subpaths).toBe(1200)
  })

  test('a legend toggle leaves one batch per visible series', async ({
    page,
    boot,
  }) => {
    await boot({ points: POINTS, threshold: THRESHOLD, series: 2 })

    await page.locator('.apexcharts-legend-series').first().click()
    await page.waitForTimeout(250)

    const after = await page.evaluate(() => ({
      batchEls: document.querySelectorAll('.apexcharts-marker-batch').length,
      collapsed: window.chart.w.globals.collapsedSeriesIndices.length,
    }))
    expect(after.collapsed).toBe(1)
    // the collapsed series contributes no subpaths, so only the visible one
    // emits a batch
    expect(after.batchEls).toBe(1)
  })

  test('keyboard focus lands on a real element', async ({ page, boot }) => {
    await boot({ points: POINTS, threshold: THRESHOLD })

    await page.evaluate(() => document.querySelector('[tabindex]')?.focus())
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)

    const focus = await page.evaluate(() => {
      const el = document.querySelector('.apexcharts-keyboard-focused')
      return { found: !!el, aria: el?.getAttribute('aria-label') }
    })
    // without per-point nodes the ring rides the tooltip's marker, which is the
    // dot the reader actually sees on the focused point
    expect(focus.found).toBe(true)
    expect(focus.aria).toMatch(/s0:/)
  })

  test('batching is materially cheaper than one element per point', async ({
    page,
    boot,
  }) => {
    // Loose on purpose: a bound on the mechanism, not a performance target.
    // Measured ~3x (18ms -> 6ms at 2000 points) on an idle machine.
    await boot({ points: 10 })
    const time = await page.evaluate(async () => {
      const render = async (threshold) => {
        const t0 = Date.UTC(2024, 0, 1)
        const data = Array.from({ length: 2000 }, (_, i) => [
          t0 + i * 3600_000,
          Math.round(50 + 40 * Math.sin(i / 9)),
        ])
        const host = document.getElementById('chart')
        host.innerHTML =
          '<div id="inner" style="width:1100px;height:400px"></div>'
        const c = new ApexCharts(document.querySelector('#inner'), {
          chart: {
            type: 'line',
            height: 400,
            width: 1100,
            animations: { enabled: false },
          },
          series: [{ name: 'a', data }],
          xaxis: { type: 'datetime' },
          dataLabels: { enabled: false },
          markers: { size: 4, largeDatasetThreshold: threshold },
          stroke: { curve: 'straight', width: 2 },
        })
        const t = performance.now()
        await c.render()
        const ms = performance.now() - t
        c.destroy()
        return ms
      }
      // warm both shapes first: an unwarmed comparison of this pair once made
      // the slower one look faster, because the first run paid for the JIT
      await render(0)
      await render(1000)
      const med = async (threshold) => {
        const s = []
        for (let i = 0; i < 5; i++) s.push(await render(threshold))
        return s.sort((a, b) => a - b)[2]
      }
      const perPoint = await med(0)
      const batched = await med(1000)
      return { perPoint, batched, ratio: perPoint / batched }
    })

    expect(
      time.ratio,
      `batched ${time.batched.toFixed(1)}ms vs per-point ` +
        `${time.perPoint.toFixed(1)}ms (${time.ratio.toFixed(2)}x)`,
    ).toBeGreaterThan(1.6)
  })
})
