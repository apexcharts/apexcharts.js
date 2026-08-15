/**
 * Where a pie / donut / polarArea puts the caption for the slice under the
 * cursor, when `tooltip.intersect` pins it to the mark instead of letting it
 * trail the pointer.
 *
 * Pie.js stamps each arc's centroid on the path as `data:cx` / `data:cy`, in
 * the SLICE's own user space. The anchor read them as if they were SVG-root
 * coordinates, which drops the inner group's translate, and that translate is
 * exactly the offset that centres a pie in a chart wider than it is tall. The
 * caption appeared a couple of hundred pixels to the left of the slice it
 * described, clear of the pie entirely. Nothing has to be configured to land
 * here: the bar defaults set `intersect: true`, and defaults are applied once,
 * so a column that became a donut through updateOptions arrives carrying it.
 *
 * Asserted as geometry, because the tooltip was never missing or wrong, only
 * somewhere else. Counting elements would have called this green.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const DONUT = {
  chart: { type: 'donut' },
  series: [55, 44, 41, 33, 27],
  labels: ['Direct', 'Search', 'Referral', 'Social', 'Email'],
  tooltip: { intersect: true, shared: false },
  legend: { show: false },
}

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  boot: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    /** @param {Record<string, any>} options merged over the chart defaults */
    const boot = async (options) => {
      await page.goto('about:blank')
      // Wider than it is tall: that is what gives the inner group a large
      // horizontal translate, and this bug its whole magnitude.
      await page.setContent(
        '<div id="chart" style="width:820px;height:340px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (opts) => {
        window.chart = new ApexCharts(document.querySelector('#chart'), {
          ...opts,
          chart: {
            height: 340,
            animations: { enabled: false },
            ...(opts.chart || {}),
          },
        })
        await window.chart.render()
      }, options)
      await page.waitForTimeout(250)
    }

    await use(boot)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

/**
 * Hover a point on the arc itself, pulled slightly toward the chart centre so
 * the wedge is hit rather than the gap beside it. Two moves: the first enters
 * the element, the second is the mousemove the tooltip listens for.
 */
async function hoverSlice(page, i) {
  const slices = await page.$$('.apexcharts-pie-area')
  const pt = await slices[i].evaluate((p) => {
    const at = p.getPointAtLength(p.getTotalLength() * 0.15)
    const m = p.getScreenCTM()
    const box = p.ownerSVGElement.getBoundingClientRect()
    const x = m.a * at.x + m.c * at.y + m.e
    const y = m.b * at.x + m.d * at.y + m.f
    return {
      x: x + (box.left + box.width / 2 - x) * 0.12,
      y: y + (box.top + box.height / 2 - y) * 0.12,
    }
  })
  await page.mouse.move(pt.x - 3, pt.y - 3)
  await page.waitForTimeout(100)
  await page.mouse.move(pt.x, pt.y)
  await page.waitForTimeout(250)
}

/** Where the tooltip currently is. */
async function readTooltip(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.apexcharts-tooltip')
    const r = el.getBoundingClientRect()
    return {
      active: el.classList.contains('apexcharts-active'),
      centreX: r.left + r.width / 2,
      bottom: r.bottom,
    }
  })
}

/** The slice's own extent, and the browser's mapping of its stamped centroid. */
async function readSlice(page, i) {
  return page.evaluate((i) => {
    const p = document.querySelectorAll('.apexcharts-pie-area')[i]
    const r = p.getBoundingClientRect()
    const m = p.getScreenCTM()
    const cx = parseFloat(p.getAttribute('data:cx'))
    const cy = parseFloat(p.getAttribute('data:cy'))
    return {
      left: r.left,
      right: r.right,
      centroidX: m.a * cx + m.c * cy + m.e,
      centroidY: m.b * cx + m.d * cy + m.f,
    }
  }, i)
}

test.describe('a donut anchors its caption on the slice, not on the SVG origin', () => {
  test('every slice is captioned over itself', async ({ page, boot }) => {
    await boot(DONUT)

    for (let i = 0; i < 5; i++) {
      await hoverSlice(page, i)
      const tip = await readTooltip(page)
      expect(tip.active, `slice ${i} showed no tooltip`).toBe(true)

      const slice = await readSlice(page, i)

      // The property: the caption sits over the mark it describes. Read as an
      // SVG-root coordinate the anchor missed by the inner translate, which
      // put it a couple of hundred pixels clear of the slice.
      expect(
        tip.centreX,
        `slice ${i} caption is left of the slice`,
      ).toBeGreaterThan(slice.left)
      expect(
        tip.centreX,
        `slice ${i} caption is right of the slice`,
      ).toBeLessThan(slice.right)

      // And precisely: centred on the arc centroid, resting just above it.
      expect(Math.abs(tip.centreX - slice.centroidX)).toBeLessThan(2)
      expect(Math.abs(tip.bottom - (slice.centroidY - 10))).toBeLessThan(2)
    }
  })

  test('GUARD without intersect the caption still follows the cursor', async ({
    page,
    boot,
  }) => {
    await boot({ ...DONUT, tooltip: { intersect: false, shared: false } })

    // Park the cursor well off the centroid of the slice it is over.
    const slice = await readSlice(page, 0)
    const target = await page.evaluate(() => {
      const r = document
        .querySelectorAll('.apexcharts-pie-area')[0]
        .getBoundingClientRect()
      return { x: r.left + r.width * 0.55, y: r.top + r.height * 0.25 }
    })
    await page.mouse.move(target.x - 3, target.y - 3)
    await page.waitForTimeout(100)
    await page.mouse.move(target.x, target.y)
    await page.waitForTimeout(250)

    const tip = await readTooltip(page)
    expect(tip.active).toBe(true)
    // Tracking the cursor, not the arc centroid. The few px of slack is the
    // cursor branch centring on a width measured before the content changed.
    const toCursor = Math.abs(tip.centreX - target.x)
    expect(toCursor).toBeLessThan(12)
    expect(toCursor).toBeLessThan(Math.abs(tip.centreX - slice.centroidX))
  })
})
