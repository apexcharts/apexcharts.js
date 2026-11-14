/**
 * A chart with a percentage height inside a parent whose height comes from
 * its content (a card holding a heading and the chart, no height of its own)
 * grew on every redraw from 8.7.0: 300, 390, 480 ... and never stopped.
 *
 * A resize redraw measured the parent before clearing the old chart, so the
 * parent it resolved the percentage against still held the old chart and was
 * taller by it. The new chart came out taller than the old one, the parent
 * grew to fit it, its observer reported that, and the next redraw measured a
 * taller parent again. The percentage now resolves against the parent after
 * the old chart is cleared (the size before 8.7.0), and the size the chart
 * records for the next comparison is the parent with this chart in it, so the
 * parent answering the chart's own draw reads as no change.
 *
 * Two such charts in one parent each size from a parent holding the other, so
 * each redraw is the other's next resize and they grew without end (8.6.0 did
 * the same from the first window resize). A height-only redraw that follows a
 * parent growing with the chart is now refused the second time in a row.
 *
 * A percentage height in a parent with a height of its own must still follow
 * that parent when it changes.
 */

import { test, expect } from '@playwright/test'
import { BUNDLE } from '../helpers/frames.js'

test.use({ viewport: { width: 1000, height: 700 } })

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ card?: string, height?: string, animate?: boolean }} spec
 */
async function mount(page, { card = '', height = '100%', animate = false }) {
  /** @type {string[]} */
  const thrown = []
  page.on('pageerror', (e) => thrown.push(e.message))
  await page.setContent(`<!doctype html><html><head><style>
    html, body { margin: 0 }
    h3 { margin: 0; padding: 8px 0; font: 20px/24px sans-serif }
  </style></head><body>
    <div id="card" style="${card}"><h3>Revenue</h3><div id="chart"></div></div>
  </body></html>`)
  await page.addScriptTag({ path: BUNDLE })
  await page.evaluate(
    ({ height, animate }) => {
      window.updates = 0
      const update = ApexCharts.prototype.update
      ApexCharts.prototype.update = function (...args) {
        window.updates++
        return update.apply(this, args)
      }
      window.chart = new ApexCharts(document.getElementById('chart'), {
        chart: { type: 'line', height, animations: { enabled: animate } },
        series: [{ name: 'a', data: [31, 40, 28, 51, 42, 109, 100] }],
        xaxis: { categories: [1, 2, 3, 4, 5, 6, 7] },
      })
      window.chart.render()
    },
    { height, animate },
  )
  await page.waitForFunction('document.querySelector("#chart svg")')
  if (animate) {
    await page.waitForFunction('window.chart.w.globals.animationEnded')
  }
  return thrown
}

const measure = (page) =>
  page.evaluate(() => {
    const svg = document.querySelector('#chart svg')
    return {
      svgH: Math.round(svg.getBoundingClientRect().height),
      svgW: Math.round(svg.getBoundingClientRect().width),
      hostW: Math.round(
        document.getElementById('chart').getBoundingClientRect().width,
      ),
      card: Math.round(
        document.getElementById('card').getBoundingClientRect().height,
      ),
      updates: window.updates,
    }
  })

/**
 * Samples the chart's height across several observer and debounce cycles (the
 * resize redraw waits 150ms; each step leaves room for one full round).
 * @param {import('@playwright/test').Page} page
 */
async function settleSamples(page, rounds = 6) {
  const out = []
  for (let i = 0; i < rounds; i++) {
    await page.waitForTimeout(350)
    out.push((await measure(page)).svgH)
  }
  return out
}

test.describe('percentage height in a parent sized by its content', () => {
  for (const animate of [false, true]) {
    test(`100% height stays put over observer cycles and window resizes${animate ? ' (animated)' : ''}`, async ({
      page,
    }) => {
      const thrown = await mount(page, { animate })
      const first = await measure(page)
      expect(first.svgH).toBeGreaterThan(0)

      // Left alone, nothing changes: every sample is the first height.
      const idle = await settleSamples(page)
      expect(idle).toEqual(idle.map(() => first.svgH))
      // At most the one redraw the first observer callback may ask for.
      const idleUpdates = (await measure(page)).updates
      expect(idleUpdates).toBeLessThanOrEqual(1)

      // A window resize redraws for the new width and keeps the height.
      for (const width of [800, 1100, 1000]) {
        await page.setViewportSize({ width, height: 700 })
        const samples = await settleSamples(page, 4)
        expect(samples).toEqual(samples.map(() => first.svgH))
        const m = await measure(page)
        expect(Math.abs(m.svgW - m.hostW)).toBeLessThanOrEqual(1)
      }
      // One redraw per window width, never a chain of them.
      expect((await measure(page)).updates).toBeLessThanOrEqual(idleUpdates + 3)
      expect(thrown).toEqual([])
    })
  }
})

test.describe('percentage height in a parent sized by its content', () => {
  test('follows a heading that grows', async ({ page }) => {
    const thrown = await mount(page, {})
    const first = await measure(page)
    await page.evaluate(() => {
      document.querySelector('h3').innerHTML = 'A<br>B<br>C'
    })
    const grown = await settleSamples(page, 4)
    // The heading's two extra 24px lines, once, then no further change.
    expect(grown).toEqual(grown.map(() => first.svgH + 48))
    expect(thrown).toEqual([])
  })

  test('two 100% charts in one parent stop growing', async ({ page }) => {
    /** @type {string[]} */
    const thrown = []
    page.on('pageerror', (e) => thrown.push(e.message))
    await page.setContent(`<!doctype html><html><head><style>
      html, body { margin: 0 }
      h3 { margin: 0; padding: 8px 0; font: 20px/24px sans-serif }
    </style></head><body>
      <div id="card"><h3>Revenue</h3><div id="chart"></div><div id="chart2"></div></div>
    </body></html>`)
    await page.addScriptTag({ path: BUNDLE })
    await page.evaluate(() => {
      window.updates = 0
      const update = ApexCharts.prototype.update
      ApexCharts.prototype.update = function (...args) {
        window.updates++
        return update.apply(this, args)
      }
      for (const id of ['chart', 'chart2']) {
        new ApexCharts(document.getElementById(id), {
          chart: { type: 'line', height: '100%', animations: { enabled: false } },
          series: [{ name: 'a', data: [31, 40, 28, 51, 42, 109, 100] }],
        }).render()
      }
    })
    await page.waitForFunction('document.querySelector("#chart2 svg")')

    const heights = () =>
      page.evaluate(() =>
        ['#chart svg', '#chart2 svg'].map((s) =>
          Math.round(document.querySelector(s).getBoundingClientRect().height),
        ),
      )
    /** Waits out the redraws a change may cause, then samples a quiet chart. */
    const settled = async () => {
      await page.waitForTimeout(1500)
      const at = { h: await heights(), updates: (await measure(page)).updates }
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(350)
        expect(await heights()).toEqual(at.h)
      }
      expect((await measure(page)).updates).toBe(at.updates)
      return at
    }

    const load = await settled()
    expect(load.updates).toBeLessThanOrEqual(6)
    await page.setViewportSize({ width: 800, height: 700 })
    const resized = await settled()
    expect(resized.updates - load.updates).toBeLessThanOrEqual(6)
    expect(thrown).toEqual([])
  })
})

test.describe('percentage height in a parent with a height of its own', () => {
  test('follows the parent when its height changes', async ({ page }) => {
    const thrown = await mount(page, {
      card: 'height:400px',
      height: '100%',
    })
    await page.waitForTimeout(400)
    expect((await measure(page)).svgH).toBe(400)

    for (const h of [520, 300, 450]) {
      await page.evaluate((h) => {
        document.getElementById('card').style.height = `${h}px`
      }, h)
      const samples = await settleSamples(page, 3)
      expect(samples).toEqual(samples.map(() => h))
    }
    expect(thrown).toEqual([])
  })

  test('50% follows the parent and does not drift', async ({ page }) => {
    await mount(page, { card: 'height:600px', height: '50%' })
    await page.waitForTimeout(400)
    expect((await measure(page)).svgH).toBe(300)

    await page.evaluate(() => {
      document.getElementById('card').style.height = '400px'
    })
    const samples = await settleSamples(page, 4)
    expect(samples).toEqual(samples.map(() => 200))
  })
})
