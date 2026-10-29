/**
 * react-apexcharts#187: a chart is too wide for its container from the moment
 * it loads, and stays that way until the window is resized.
 *
 * Three things lost the resize, and each one hid the next:
 *
 * 1. The parent ResizeObserver threw away its first callback, on the belief
 *    that it only repeats the size the chart was just drawn at. It does not:
 *    the observer reports its first size at the next layout, after the chart
 *    has drawn, so a container that moved in that frame (the page gaining a
 *    scrollbar because the chart made it taller, a grid or sidebar settling)
 *    was reported only there, and dropped.
 * 2. The size a render was drawn at was recorded after the chart had written
 *    its own height into the page. When that write brought the scrollbar in,
 *    the record already held the narrower width, so the resize that followed
 *    read as no change.
 * 3. A resize redraw cleared the old chart before measuring, so for that
 *    instant the page was short enough to lose its scrollbar again. The new
 *    chart was sized for a page the reader never sees, and the page settled
 *    back where it was, so no observer reported the mismatch.
 *
 * Fixing 3 opened a loop at the exact height where an auto-height chart is
 * what decides whether the page needs a scrollbar, so the last group pins
 * that down too.
 *
 * Real scrollbars are the reported case, and headless Chromium hides them by
 * default, which forces the whole file into its own browser launch. Where the
 * platform draws overlay scrollbars (zero width) those tests have nothing to
 * measure and skip.
 */

import { test, expect } from '@playwright/test'
import { BUNDLE } from '../helpers/frames.js'

test.use({
  launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] },
  viewport: { width: 1000, height: 700 },
})

const area = (chart = {}) => ({
  chart: { type: 'area', parentHeightOffset: 15, ...chart },
  series: [{ name: 'a', data: [31, 40, 28, 51, 42, 109, 100] }],
  xaxis: { categories: [1, 2, 3, 4, 5, 6, 7] },
})

/**
 * Loads a page, renders one chart into #chart and runs `afterRender` in the
 * same task, before the browser has laid anything out. `spacer` is evaluated
 * in the page to size the block below the chart, so a test can put the page
 * height exactly where it needs it.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ opts: any, wrap?: string, spacer?: string, afterRender?: string }} spec
 */
async function mount(page, { opts, wrap = 'auto', spacer = '0', afterRender = '' }) {
  /** @type {string[]} */
  const thrown = []
  page.on('pageerror', (e) => thrown.push(e.message))
  await page.setContent(`<!doctype html><html><head><style>
    html, body { margin: 0 }
    #probe { position: absolute; top: -200px; width: 100px; height: 100px; overflow: scroll }
  </style></head><body>
    <div id="probe"></div>
    <div id="wrap" style="width:${wrap}"><div id="chart"></div></div>
    <div id="spacer"></div>
  </body></html>`)
  await page.addScriptTag({ path: BUNDLE })
  await page.evaluate(
    ({ opts, spacer, afterRender }) => {
      const probe = document.getElementById('probe')
      window.scrollbar = probe.offsetWidth - probe.clientWidth
      document.getElementById('spacer').style.height =
        new Function('scrollbar', `return ${spacer}`)(window.scrollbar) + 'px'

      window.updates = 0
      const update = ApexCharts.prototype.update
      ApexCharts.prototype.update = function (...args) {
        window.updates++
        return update.apply(this, args)
      }
      window.chart = new ApexCharts(document.getElementById('chart'), opts)
      window.chart.render()
      new Function(afterRender)()
    },
    { opts, spacer, afterRender },
  )
  await page.waitForFunction('document.querySelector("#chart svg")')
  return thrown
}

/** Host vs SVG width, page overflow, and how often the chart redrew. */
const measure = (page) =>
  page.evaluate(() => {
    const host = document.getElementById('chart')
    const svg = host.querySelector('svg')
    return {
      host: Math.round(host.getBoundingClientRect().width),
      svg: Math.round(svg.getBoundingClientRect().width),
      overflowX:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      scrollbar: window.innerWidth - document.documentElement.clientWidth,
      updates: window.updates,
    }
  })

const fits = (m) => expect(Math.abs(m.svg - m.host)).toBeLessThanOrEqual(1)

const skipWithoutScrollbars = async (page) => {
  await page.setContent(
    '<div id="p" style="width:100px;height:100px;overflow:scroll"></div>',
  )
  const w = await page.evaluate(() => {
    const p = document.getElementById('p')
    return p.offsetWidth - p.clientWidth
  })
  test.skip(w === 0, 'this platform draws overlay scrollbars')
}

test.describe('a container that moves in the frame the chart draws (react-apexcharts#187)', () => {
  test('narrowed in the same task as render(): the chart follows', async ({
    page,
  }) => {
    const thrown = await mount(page, {
      opts: area({ height: 300, animations: { enabled: false } }),
      wrap: '800px',
      afterRender: "document.getElementById('wrap').style.width = '600px'",
    })
    await page.waitForTimeout(800)
    const m = await measure(page)
    expect(m.host).toBe(600)
    fits(m)
    expect(m.updates).toBe(1)
    expect(thrown).toEqual([])
  })

  test('widened in the same task as render(): the chart follows', async ({
    page,
  }) => {
    await mount(page, {
      opts: area({ height: 300, animations: { enabled: false } }),
      wrap: '600px',
      afterRender: "document.getElementById('wrap').style.width = '800px'",
    })
    await page.waitForTimeout(800)
    const m = await measure(page)
    expect(m.host).toBe(800)
    fits(m)
    expect(m.updates).toBe(1)
  })

  test('nothing moved: the first observer callback costs no redraw', async ({
    page,
  }) => {
    // The first callback is now delivered for every chart on every page, so
    // the ordinary case is the one that has to stay free.
    await mount(page, {
      opts: area({ height: 300, animations: { enabled: false } }),
    })
    await page.waitForTimeout(800)
    const m = await measure(page)
    fits(m)
    expect(m.updates).toBe(0)
  })

  test('nothing moved, animated: the entrance animation runs to the end untouched', async ({
    page,
  }) => {
    await mount(page, { opts: area({ height: 300 }) })
    await page.waitForFunction('window.chart.w.globals.animationEnded')
    await page.waitForTimeout(600)
    const m = await measure(page)
    fits(m)
    expect(m.updates).toBe(0)
  })
})

test.describe('the chart itself brings in the page scrollbar (react-apexcharts#187)', () => {
  test.beforeEach(async ({ page }) => skipWithoutScrollbars(page))

  // The page still fits while the chart measures (its SVG has no size yet and
  // is the browser's default 150px tall) and overflows once it is drawn.
  const tallEnough = 'innerHeight - 200'

  test('a fixed-height chart redraws once to the narrower width', async ({
    page,
  }) => {
    await mount(page, {
      opts: area({ height: 300, animations: { enabled: false } }),
      spacer: tallEnough,
    })
    await page.waitForTimeout(800)
    const m = await measure(page)
    expect(m.scrollbar).toBeGreaterThan(0)
    fits(m)
    expect(m.overflowX).toBe(0)
    expect(m.updates).toBe(1)
  })

  test('with the entrance animation, the redraw waits for it and then fits', async ({
    page,
  }) => {
    await mount(page, { opts: area({ height: 300 }), spacer: tallEnough })
    await page.waitForFunction('window.chart.w.globals.animationEnded')
    await page.waitForTimeout(800)
    const m = await measure(page)
    fits(m)
    expect(m.overflowX).toBe(0)
    expect(m.updates).toBe(1)
  })

  test('an auto-height chart fits too', async ({ page }) => {
    // Well past the threshold: once drawn, the page scrolls at either width.
    await mount(page, {
      opts: area({ animations: { enabled: false } }),
      spacer: tallEnough,
    })
    await page.waitForTimeout(800)
    const m = await measure(page)
    fits(m)
    expect(m.overflowX).toBe(0)
    expect(m.updates).toBe(1)
  })
})

test.describe('an auto-height chart that decides whether the page scrolls', () => {
  test.beforeEach(async ({ page }) => skipWithoutScrollbars(page))

  // An auto-height axis chart is width / 1.61 tall, plus parentHeightOffset.
  // This spacer leaves the page 4px short of scrolling with the chart drawn
  // narrow (viewport minus scrollbar) and ~5px over it with the chart drawn at
  // the full viewport width, so each width brings about the other one.
  const onTheEdge =
    'innerHeight - ((document.documentElement.clientWidth - scrollbar) / 1.61 + 15) - 4'

  test('settles instead of redrawing forever, and never overflows', async ({
    page,
  }) => {
    const thrown = await mount(page, {
      opts: area({ animations: { enabled: false } }),
      spacer: onTheEdge,
    })
    await page.waitForTimeout(1200)
    const settled = await measure(page)
    await page.waitForTimeout(1500)
    const later = await measure(page)

    // Unguarded this redrew several times a second for as long as the page
    // stayed open. Guarded it goes narrow, back once, narrow, and stops.
    expect(later.updates).toBe(settled.updates)
    expect(later.updates).toBeLessThanOrEqual(3)
    // It settles on the narrower width: a little short of the box is
    // acceptable, hanging out of it is the bug this file is about.
    expect(later.svg).toBeLessThanOrEqual(later.host)
    expect(later.overflowX).toBe(0)
    expect(thrown).toEqual([])
  })

  test('a container moved straight back after a redraw still follows', async ({
    page,
  }) => {
    // What the loop looks like from the chart's side, made on purpose: a
    // sidebar opened and closed at once. One return is never refused.
    await mount(page, {
      opts: area({ animations: { enabled: false } }),
      wrap: '800px',
    })
    await page.waitForTimeout(400)
    await page.evaluate(() => {
      document.getElementById('wrap').style.width = '600px'
    })
    await page.waitForFunction('window.updates === 1')
    await page.evaluate(() => {
      document.getElementById('wrap').style.width = '800px'
    })
    await page.waitForTimeout(800)
    const m = await measure(page)
    expect(m.host).toBe(800)
    fits(m)
    expect(m.updates).toBe(2)
  })

  test('a window resized straight back after a redraw still follows', async ({
    page,
  }) => {
    // The page answering the chart never changes the window size; a person
    // resizing the window always does, so it is never taken for the loop.
    await mount(page, { opts: area({ animations: { enabled: false } }) })
    await page.waitForTimeout(400)
    for (const width of [800, 1000, 800, 1000]) {
      const before = await page.evaluate('window.updates')
      await page.setViewportSize({ width, height: 700 })
      await page.waitForFunction((b) => window.updates > b, before)
    }
    await page.waitForTimeout(800)
    const m = await measure(page)
    fits(m)
    expect(m.updates).toBe(4)
  })

  test('a real resize afterwards still redraws', async ({ page }) => {
    // The loop guard refuses one specific echo for a moment; it must not
    // swallow a resize somebody actually made.
    await mount(page, {
      opts: area({ animations: { enabled: false } }),
      spacer: onTheEdge,
    })
    await page.waitForTimeout(1500)
    await page.evaluate(() => {
      document.getElementById('wrap').style.width = '600px'
    })
    await page.waitForTimeout(800)
    const m = await measure(page)
    expect(m.host).toBe(600)
    fits(m)
  })
})
