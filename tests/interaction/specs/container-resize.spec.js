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
 * Every assertion compares the rendered SVG against the live width of its host
 * element, so nothing here depends on a recorded pixel.
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
    #chart { width: 100% }
  </style>
  <div class="app" id="app" style="--sb:260px">
    <div class="sb"></div>
    <div class="content"><div id="chart"></div></div>
  </div>`

const areaChart = (animations = true) => ({
  chart: { type: 'area', height: 300, width: '100%', animations: { enabled: animations } },
  series: [{ name: 'a', data: [31, 40, 28, 51, 42, 109, 100] }],
  xaxis: { categories: [1, 2, 3, 4, 5, 6, 7] },
})

const test = base.extend({
  /**
   * Renders a chart in the dashboard, moves the sidebar at a chosen moment, and
   * reports the host and SVG widths plus how often the chart re-rendered.
   */
  dash: async ({ page }, use) => {
    /**
     * @param {{
     *   opts?: any, transition?: boolean, sidebar?: number,
     *   waitFor?: 'animation' | number, settle?: number,
     *   pushData?: boolean, then?: number,
     * }} spec
     */
    const dash = async (spec) => {
      await page.goto('about:blank')
      await page.setContent(dashboard(spec.transition))
      await page.addScriptTag({ path: distPath })
      await page.evaluate((opts) => {
        window.updates = 0
        const proto = ApexCharts.prototype
        const update = proto.update
        proto.update = function (...args) {
          window.updates++
          return update.apply(this, args)
        }
        window.chart = new ApexCharts(document.querySelector('#chart'), opts)
        window.chart.render()
        window.measure = () => {
          const host = document.querySelector('#chart')
          const svg = host.querySelector('svg')
          return {
            host: Math.round(host.getBoundingClientRect().width),
            svg: svg ? Math.round(svg.getBoundingClientRect().width) : null,
            overflow:
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
            updates: window.updates,
          }
        }
      }, spec.opts || areaChart())
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
      if (spec.sidebar !== undefined) {
        await page.evaluate(
          (px) =>
            document.getElementById('app').style.setProperty('--sb', px + 'px'),
          spec.sidebar,
        )
      }
      await page.waitForTimeout(spec.settle ?? 800)
      const after = await page.evaluate('window.measure()')
      if (spec.then !== undefined) {
        await page.evaluate(
          (px) =>
            document.getElementById('app').style.setProperty('--sb', px + 'px'),
          spec.then,
        )
        await page.waitForTimeout(spec.settle ?? 800)
      }
      return { after, final: await page.evaluate('window.measure()') }
    }
    await use(dash)
  },
})

test.describe('container resize without a window resize (#1584)', () => {
  test('the chart follows the container once the animation is over', async ({
    dash,
  }) => {
    // The case that always worked, kept as the control.
    const r = await dash({ waitFor: 'animation', sidebar: 500 })
    expect(r.after.svg).toBeCloseTo(r.after.host, -0.5)
    expect(r.after.overflow).toBeLessThanOrEqual(2)
  })

  test('a resize during the entrance animation is not lost', async ({
    dash,
  }) => {
    // Someone collapsing the sidebar as the dashboard loads. Pre-fix the SVG
    // stayed at its first width for good, so the chart hung out of its column.
    const r = await dash({ waitFor: 300, sidebar: 500, settle: 2500 })
    expect(r.after.svg).toBeCloseTo(r.after.host, -0.5)
    expect(r.after.overflow).toBeLessThanOrEqual(2)
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
    expect(r.after.svg).toBeCloseTo(r.after.host, -0.5)
  })

  test('the sidebar can be animated with a CSS transition', async ({ dash }) => {
    // The observer fires many times across the transition; the chart has to end
    // up at the width the column settles on, not at an intermediate one.
    const r = await dash({
      transition: true,
      waitFor: 'animation',
      sidebar: 500,
      settle: 1200,
    })
    expect(r.after.svg).toBeCloseTo(r.after.host, -0.5)
  })

  test('expanding and collapsing in quick succession lands on the last size', async ({
    dash,
  }) => {
    const r = await dash({
      waitFor: 'animation',
      sidebar: 500,
      settle: 120,
      then: 120,
    })
    expect(r.final.svg).toBeCloseTo(r.final.host, -0.5)
  })

  test('the deferred resize does not redraw a chart whose box did not change', async ({
    dash,
  }) => {
    // The chart's own render resizes its container (the host gets a min-height),
    // which fires the same observer. Waiting for the animation instead of
    // dropping the callback must not turn that into a redraw, let alone a loop.
    const r = await dash({ waitFor: 'animation', settle: 2000 })
    expect(r.after.updates).toBe(0)
  })

  test('a pixel-width chart keeps its width when the container moves', async ({
    dash,
  }) => {
    const r = await dash({
      opts: { ...areaChart(), chart: { ...areaChart().chart, width: 600 } },
      waitFor: 300,
      sidebar: 500,
      settle: 2000,
    })
    expect(r.after.svg).toBe(600)
  })

  test('redrawOnParentResize:false still opts out', async ({ dash }) => {
    const opts = areaChart()
    const r = await dash({
      opts: { ...opts, chart: { ...opts.chart, redrawOnParentResize: false } },
      waitFor: 300,
      sidebar: 500,
      settle: 2000,
    })
    expect(r.after.updates).toBe(0)
    expect(r.after.svg).not.toBeCloseTo(r.after.host, -0.5)
  })
})
