/**
 * #1584: a chart in a dashboard with a collapsible sidebar keeps its old width.
 * The container changed, no window resize happened, and the chart never caught
 * up: it overflowed the content area when the sidebar opened and stayed narrow
 * when it closed.
 *
 * The parent ResizeObserver was wired up correctly. What lost the resize was the
 * gate in front of it:
 *
 *     if (this.w.globals.animationEnded && ...redrawOnParentResize)
 *
 * A ResizeObserver reports each size change exactly once, so a resize arriving
 * while the chart animated was not postponed, it was discarded, and nothing ever
 * asked again. Two everyday cases land in that window: collapsing the sidebar
 * just after load (the entrance animation runs ~1.6s for line/area), and any
 * resize on a dashboard that is calling updateSeries on a timer, where
 * animationEnded is false most of the time.
 *
 * The resize is now deferred to the end of the animation and re-checked there,
 * so the entrance animation still plays out and the size is not lost.
 *
 * Because this is the default path for every chart, most of the file is guards
 * rather than the fix: one render per resize (not one per observer callback),
 * nothing left running after destroy, the radial and cell layouts following the
 * container too, and opting out still opting out. Every assertion compares the
 * rendered SVG against the live width of its host element, so nothing here
 * depends on a recorded pixel.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

/** The dashboard from the report: fixed sidebar, chart in the fluid column. */
const dashboard = (transition = false) => `
  <style>
    * { box-sizing: border-box }
    body { margin: 0 }
    .app { display: flex; height: 100vh }
    .sb {
      flex: 0 0 var(--sb); background: #1f2937;
      ${transition ? 'transition: flex-basis .3s ease;' : ''}
    }
    /* min-width:0 lets the column shrink; without it no layout engine can */
    .content { flex: 1 1 auto; min-width: 0; padding: 12px }
    #chart, #chart2 { width: 100% }
  </style>
  <div class="app" id="app" style="--sb:260px">
    <div class="sb"></div>
    <div class="content" id="content">
      <div id="chart"></div><div id="chart2"></div>
    </div>
  </div>`

const areaChart = (chart = {}) => ({
  chart: { type: 'area', height: 260, width: '100%', ...chart },
  series: [{ name: 'a', data: [31, 40, 28, 51, 42, 109, 100] }],
  xaxis: { categories: [1, 2, 3, 4, 5, 6, 7] },
})

const test = base.extend({
  /**
   * Renders one or two charts in the dashboard, moves the sidebar at a chosen
   * moment, and reports host vs SVG width, how often the chart re-rendered, and
   * anything the page threw.
   */
  dash: async ({ page }, use) => {
    /**
     * @param {{
     *   opts?: any, opts2?: any, transition?: boolean, sidebar?: number,
     *   waitFor?: 'animation' | number, settle?: number, pushData?: boolean,
     *   then?: number, finalSettle?: number, destroyAt?: number, hideAt?: number,
     * }} spec
     */
    const dash = async (spec) => {
      /** @type {string[]} */
      const thrown = []
      page.on('pageerror', (e) => thrown.push(e.message))
      await page.goto('about:blank')
      await page.setContent(dashboard(spec.transition))
      await page.addScriptTag({ path: distPath })
      await page.evaluate(
        ({ opts, opts2 }) => {
          window.updates = 0
          window.animEnds = 0
          const proto = ApexCharts.prototype
          const update = proto.update
          proto.update = function (...args) {
            window.updates++
            return update.apply(this, args)
          }
          const make = (sel, o) => {
            o.chart.events = {
              ...o.chart.events,
              animationEnd: () => window.animEnds++,
            }
            const c = new ApexCharts(document.querySelector(sel), o)
            c.render()
            return c
          }
          window.chart = make('#chart', opts)
          if (opts2) window.chart2 = make('#chart2', opts2)
          window.measure = (sel = '#chart') => {
            const host = document.querySelector(sel)
            const svg = host.querySelector('svg')
            return {
              host: Math.round(host.getBoundingClientRect().width),
              svg: svg ? Math.round(svg.getBoundingClientRect().width) : null,
              overflow:
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth,
              updates: window.updates,
              animEnds: window.animEnds,
            }
          }
        },
        { opts: spec.opts || areaChart(), opts2: spec.opts2 },
      )
      await page.waitForFunction('document.querySelector("#chart svg")')

      if (spec.waitFor === 'animation') {
        await page.waitForFunction('window.chart.w.globals.animationEnded')
      } else if (typeof spec.waitFor === 'number') {
        await page.waitForTimeout(spec.waitFor)
      }
      if (spec.pushData) {
        await page.evaluate(() =>
          window.chart.updateSeries([
            { name: 'a', data: [50, 62, 44, 80, 66, 130, 120] },
          ]),
        )
        await page.waitForTimeout(120)
      }
      const moveSidebar = (px) =>
        page.evaluate(
          (v) =>
            document.getElementById('app').style.setProperty('--sb', v + 'px'),
          px,
        )
      if (spec.sidebar !== undefined) await moveSidebar(spec.sidebar)

      // Tear the chart down, or hide it, while the deferred resize is waiting.
      if (spec.destroyAt !== undefined) {
        await page.waitForTimeout(spec.destroyAt)
        await page.evaluate(() => window.chart.destroy())
      }
      if (spec.hideAt !== undefined) {
        await page.waitForTimeout(spec.hideAt)
        await page.evaluate(() => {
          document.getElementById('content').style.display = 'none'
        })
      }

      await page.waitForTimeout(spec.settle ?? 800)
      const measure = async () => ({
        first: await page.evaluate('window.measure("#chart")'),
        second: spec.opts2
          ? await page.evaluate('window.measure("#chart2")')
          : null,
      })
      const after = await measure()
      if (spec.then !== undefined) {
        await moveSidebar(spec.then)
        await page.waitForTimeout(spec.finalSettle ?? spec.settle ?? 800)
      }
      const final = await measure()
      return { ...after.first, second: after.second, final: final.first, thrown }
    }
    await use(dash)
  },
})

/** The SVG has to be as wide as the element it lives in, to the pixel. */
const fits = (m) => expect(Math.abs(m.svg - m.host)).toBeLessThanOrEqual(2)

test.describe('container resize without a window resize (#1584)', () => {
  test('the chart follows the container once the animation is over', async ({
    dash,
  }) => {
    // The case that always worked, kept as the control.
    const r = await dash({ waitFor: 'animation', sidebar: 500 })
    fits(r)
    expect(r.overflow).toBeLessThanOrEqual(2)
  })

  test('a resize during the entrance animation is not lost', async ({
    dash,
  }) => {
    // Someone collapsing the sidebar as the dashboard loads. Pre-fix the SVG
    // stayed at its first width for good, so the chart hung out of its column.
    const r = await dash({ waitFor: 300, sidebar: 500, settle: 2500 })
    fits(r)
    expect(r.overflow).toBeLessThanOrEqual(2)
  })

  test('a resize during an updateSeries animation is not lost', async ({
    dash,
  }) => {
    // A live dashboard spends most of its time animating, so this is where the
    // dropped resize was most likely to be seen.
    const r = await dash({
      waitFor: 'animation',
      pushData: true,
      sidebar: 500,
      settle: 2500,
    })
    fits(r)
  })

  test('the sidebar can be animated with a CSS transition', async ({ dash }) => {
    const r = await dash({
      transition: true,
      waitFor: 'animation',
      sidebar: 500,
      settle: 1200,
    })
    fits(r)
  })

  test('one transition costs one render, not one per observer callback', async ({
    dash,
  }) => {
    // A container animated with a CSS transition reports a new size every frame.
    // _windowResize() queued a render per callback and cleared none of them, so
    // a single 300ms sidebar transition rebuilt the chart 16 times.
    const r = await dash({
      transition: true,
      waitFor: 'animation',
      sidebar: 500,
      settle: 1500,
    })
    fits(r)
    expect(r.updates).toBe(1)
  })

  test('expanding and collapsing in quick succession lands on the last size', async ({
    dash,
  }) => {
    // The second move lands inside the first one's debounce window, so the
    // chart must draw once, at the size it ended on. The final wait has to
    // clear the debounce: with it shortened the chart is legitimately still
    // mid-debounce and this measures nothing.
    const r = await dash({
      waitFor: 'animation',
      sidebar: 500,
      settle: 120,
      then: 120,
      finalSettle: 900,
    })
    fits(r.final)
    expect(r.final.updates).toBe(1)
  })

  test('the deferred resize does not redraw a chart whose box did not change', async ({
    dash,
  }) => {
    // The chart's own render resizes its container (the host gets a min-height),
    // which fires the same observer. Waiting for the animation instead of
    // dropping the callback must not turn that into a redraw, let alone a loop.
    const r = await dash({ waitFor: 'animation', settle: 2000 })
    expect(r.updates).toBe(0)
    expect(r.animEnds).toBe(1)
  })

  test('destroy() while a resize is waiting leaves nothing running', async ({
    dash,
  }) => {
    const r = await dash({
      waitFor: 250,
      sidebar: 500,
      destroyAt: 150,
      settle: 3000,
    })
    expect(r.updates).toBe(0)
    expect(r.thrown).toEqual([])
  })

  test('hiding the container while a resize is waiting does not throw', async ({
    dash,
  }) => {
    const r = await dash({
      waitFor: 250,
      sidebar: 500,
      hideAt: 150,
      settle: 3000,
    })
    expect(r.thrown).toEqual([])
  })

  test('a slow animation still gets its resize when it ends', async ({
    dash,
  }) => {
    // The wait is bounded by the animation's own duration, so a chart asking
    // for a 3s entrance animation resizes when that finishes rather than never.
    const r = await dash({
      opts: areaChart({ animations: { enabled: true, speed: 3000 } }),
      waitFor: 250,
      sidebar: 500,
      settle: 8000,
    })
    fits(r)
    expect(r.updates).toBe(1)
  })

  test('the radial layout follows the container mid-animation too', async ({
    dash,
  }) => {
    // Pie/radial size themselves from min(gridWidth, gridHeight) rather than
    // from an axis, so they take a different path to the same numbers.
    const r = await dash({
      opts: {
        chart: { type: 'pie', height: 260, width: '100%' },
        series: [44, 55, 13],
        labels: ['a', 'b', 'c'],
      },
      waitFor: 250,
      sidebar: 500,
      settle: 2500,
    })
    fits(r)
  })

  test('a cell chart follows the container mid-animation too', async ({
    dash,
  }) => {
    const r = await dash({
      opts: {
        chart: { type: 'heatmap', height: 260, width: '100%' },
        series: [
          { name: 'r1', data: [{ x: 'a', y: 10 }, { x: 'b', y: 20 }] },
          { name: 'r2', data: [{ x: 'a', y: 30 }, { x: 'b', y: 40 }] },
        ],
      },
      waitFor: 250,
      sidebar: 500,
      settle: 2500,
    })
    fits(r)
  })

  test('two charts in the same column each resize once', async ({ dash }) => {
    const r = await dash({
      opts: areaChart(),
      opts2: areaChart(),
      waitFor: 250,
      sidebar: 500,
      settle: 2500,
    })
    fits(r)
    fits(r.second)
    expect(r.updates).toBe(2) // one each, not one per chart per callback
  })

  test('a pixel-width chart keeps its width when the container moves', async ({
    dash,
  }) => {
    const r = await dash({
      opts: areaChart({ width: 600 }),
      waitFor: 300,
      sidebar: 500,
      settle: 2000,
    })
    expect(r.svg).toBe(600)
  })

  test('redrawOnParentResize:false still opts out', async ({ dash }) => {
    const r = await dash({
      opts: areaChart({ redrawOnParentResize: false }),
      waitFor: 300,
      sidebar: 500,
      settle: 2000,
    })
    expect(r.updates).toBe(0)
    expect(Math.abs(r.svg - r.host)).toBeGreaterThan(2)
  })
})
