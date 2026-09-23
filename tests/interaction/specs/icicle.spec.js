/**
 * Icicle (cartesian partition) interaction tests.
 *
 * The type is opt-in, so the page loads the full UMD bundle AND the icicle
 * add-on after it, exactly as a script-tag user has to. That the add-on
 * registers at all is the first thing these tests prove: bundle composition is
 * only ever true against `dist`, never against `src`.
 *
 * Covers the real browser path the unit tests cannot: click-to-zoom and its
 * breadcrumb, the label rules (clipping, truncation, the quarter turn), the
 * hover tooltip, and the intro animation actually animating.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const umdPath = resolve(rootDir, 'dist', 'apexcharts.js')
const addonPath = resolve(rootDir, 'dist', 'icicle.js')

// 2 roots + 3 mid + 3 deep = 8 cells.
const TREE = [
  {
    data: [
      {
        x: 'Engineering',
        children: [
          {
            x: 'Platform',
            children: [
              { x: 'Build', y: 210 },
              { x: 'Runtime', y: 160 },
              { x: 'Tooling', y: 70 },
            ],
          },
          { x: 'Product', y: 300 },
          { x: 'Data', y: 140 },
        ],
      },
      { x: 'Design', y: 220 },
    ],
  },
]

const baseOptions = (plotOptions = {}) => ({
  chart: {
    type: 'icicle',
    width: 760,
    height: 420,
    animations: { enabled: false },
  },
  colors: ['#0EA5E9', '#F59E0B'],
  legend: { show: false },
  plotOptions: { icicle: { spacing: 0, ...plotOptions } },
  series: TREE,
})

/** @param {import('@playwright/test').Page} page @param {any} opts */
async function renderChart(page, opts) {
  await page.setContent('<div id="chart"></div>')
  await page.addScriptTag({ path: umdPath })
  await page.addScriptTag({ path: addonPath })
  await page.evaluate((o) => {
    window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
    return window.chart.render()
  }, opts)
  await page.waitForSelector('.apexcharts-icicle-cell')
}

const boxes = (page) =>
  page.evaluate(() => {
    const out = {}
    document.querySelectorAll('.apexcharts-icicle-cell').forEach((el) => {
      if (el.style.display === 'none') return
      out[el.getAttribute('data:name')] = {
        x: +el.getAttribute('x'),
        y: +el.getAttribute('y'),
        w: +el.getAttribute('width'),
        h: +el.getAttribute('height'),
      }
    })
    return out
  })

const labels = (page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.apexcharts-icicle-labels text')).map(
      (t) => ({
        text: t.textContent,
        rotated: (t.getAttribute('transform') || '').includes('rotate'),
      }),
    ),
  )

const breadcrumbText = (page) =>
  page.evaluate(() => {
    const n = document.querySelector('.apexcharts-breadcrumb')
    return n ? n.textContent.replace(/\s+/g, ' ').trim() : null
  })

const clickCell = (page, name) =>
  page.evaluate((nm) => {
    const el = Array.from(
      document.querySelectorAll('.apexcharts-icicle-cell'),
    ).find((c) => c.getAttribute('data:name') === nm)
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }, name)

const cursorOf = (page, name) =>
  page.evaluate((nm) => {
    const el = Array.from(
      document.querySelectorAll('.apexcharts-icicle-cell'),
    ).find((c) => c.getAttribute('data:name') === nm)
    return el.style.cursor
  }, name)

test.describe('icicle', () => {
  test('the add-on registers the type on a page that already has the full bundle', async ({
    page,
  }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    // The full bundle alone must NOT know the type: that is what opt-in means,
    // and a throw here naming both routes is the intended failure.
    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    const withoutAddon = await page.evaluate(async (o) => {
      try {
        const c = new window.ApexCharts(document.querySelector('#chart'), o)
        await c.render()
        return 'rendered'
      } catch (e) {
        return String(e.message || e)
      }
    }, baseOptions())
    expect(withoutAddon).toContain('icicle')
    expect(withoutAddon).toContain('apexcharts/icicle')

    await renderChart(page, baseOptions())
    expect(await page.locator('.apexcharts-icicle-cell').count()).toBe(8)
    expect(errors).toEqual([])
  })

  test('children tile their parent exactly, at every depth', async ({
    page,
  }) => {
    await renderChart(page, baseOptions())
    const b = await boxes(page)

    expect(b.Platform.x).toBeCloseTo(b.Engineering.x, 1)
    expect(b.Data.x + b.Data.w).toBeCloseTo(
      b.Engineering.x + b.Engineering.w,
      1,
    )
    expect(b.Build.x).toBeCloseTo(b.Platform.x, 1)
    expect(b.Tooling.x + b.Tooling.w).toBeCloseTo(b.Platform.x + b.Platform.w, 1)
    // Depth is the other axis: a child band sits below its parent.
    expect(b.Platform.y).toBeGreaterThan(b.Engineering.y)
    expect(b.Build.y).toBeGreaterThan(b.Platform.y)
  })

  test('click-to-zoom fills the chart with a branch, and the breadcrumb walks back', async ({
    page,
  }) => {
    await renderChart(page, baseOptions())
    expect(await breadcrumbText(page)).toBe(null)

    const before = await boxes(page)
    await clickCell(page, 'Platform')
    await page.waitForTimeout(80)

    const after = await boxes(page)
    expect(after.Platform.w).toBeGreaterThan(before.Platform.w)
    expect(after.Platform.x).toBeCloseTo(0, 0)
    // Its siblings are gone from the view.
    expect(after.Design).toBeUndefined()
    // The default zoom rescales the VALUE axis only, so the branch stretches
    // and its band does not move. The ancestor stays above it as context.
    expect(after.Platform.y).toBeCloseTo(before.Platform.y, 1)
    expect(after.Platform.h).toBeCloseTo(before.Platform.h, 1)
    expect(after.Engineering).toBeDefined()
    expect(after.Engineering.y).toBeCloseTo(before.Engineering.y, 1)

    const crumbs = await breadcrumbText(page)
    expect(crumbs).toContain('Platform')
    expect(crumbs).toContain('All')

    // Back to the root via the breadcrumb.
    await page.evaluate(() => {
      document.querySelector('.apexcharts-breadcrumb button').click()
    })
    await page.waitForTimeout(80)
    expect(await breadcrumbText(page)).toBe(null)
    const back = await boxes(page)
    expect(back.Design).toBeDefined()
    expect(back.Platform.w).toBeCloseTo(before.Platform.w, 0)
  })

  test('the breadcrumb sits in reserved space, never on top of a cell', async ({
    page,
  }) => {
    await renderChart(page, baseOptions())
    await clickCell(page, 'Platform')
    await page.waitForTimeout(80)

    const overlap = await page.evaluate(() => {
      const nav = document.querySelector('.apexcharts-breadcrumb')
      const n = nav.getBoundingClientRect()
      return Array.from(
        document.querySelectorAll('.apexcharts-icicle-cell'),
      ).some((c) => {
        if (c.style.display === 'none') return false
        const r = c.getBoundingClientRect()
        if (!r.width || !r.height) return false
        return (
          n.left < r.right && n.right > r.left && n.top < r.bottom && n.bottom > r.top
        )
      })
    })
    expect(overlap).toBe(false)
  })

  test('a click with nowhere to zoom does nothing, and the cursor says so first', async ({
    page,
  }) => {
    // One root, which is the ordinary shape for this chart: it already owns
    // the whole value axis, so there is no view for a click on it to move to.
    const opts = baseOptions()
    opts.series = [{ data: [{ x: 'All code', children: TREE[0].data }] }]
    await renderChart(page, opts)

    expect(await cursorOf(page, 'All code')).toBe('default')
    // A leaf resolves to its parent branch, which here is that same root.
    expect(await cursorOf(page, 'Design')).toBe('default')
    expect(await cursorOf(page, 'Platform')).toBe('pointer')

    const before = await boxes(page)
    await clickCell(page, 'All code')
    await page.waitForTimeout(120)
    expect(await boxes(page)).toEqual(before)
    expect(await breadcrumbText(page)).toBe(null)

    // The branches under it still zoom, and the trail leaves the root out
    // rather than repeating the crumb that already stands for it.
    await clickCell(page, 'Platform')
    await page.waitForTimeout(120)
    const crumbs = await breadcrumbText(page)
    expect(crumbs).toContain('Platform')
    expect(crumbs).toContain('Engineering')
    expect(crumbs).not.toContain('All code')
  })

  test('a label appears only where its cell has room for it', async ({
    page,
  }) => {
    const shownAt = async (minSizeToShow) => {
      await renderChart(page, baseOptions({ dataLabels: { minSizeToShow } }))
      return (await labels(page)).map((l) => l.text)
    }

    // The rule is monotone: raising the threshold can only drop labels.
    const loose = await shownAt(10)
    const tight = await shownAt(150)
    expect(loose.length).toBeGreaterThan(tight.length)
    expect(tight.every((t) => loose.includes(t))).toBe(true)
  })

  test('no label spills out of the cell it belongs to', async ({ page }) => {
    await renderChart(page, baseOptions({ dataLabels: { minSizeToShow: 10 } }))

    const spills = await page.evaluate(() => {
      const cells = Array.from(
        document.querySelectorAll('.apexcharts-icicle-cell'),
      ).map((c) => ({
        name: c.getAttribute('data:name'),
        r: c.getBoundingClientRect(),
      }))
      return Array.from(
        document.querySelectorAll('.apexcharts-icicle-labels text'),
      )
        .map((t) => {
          const r = t.getBoundingClientRect()
          // The label's own cell is the one whose centre it sits nearest.
          const cx = (r.left + r.right) / 2
          const cy = (r.top + r.bottom) / 2
          const own = cells.find(
            (c) =>
              cx >= c.r.left - 1 &&
              cx <= c.r.right + 1 &&
              cy >= c.r.top - 1 &&
              cy <= c.r.bottom + 1,
          )
          if (!own) return null
          const out =
            r.left < own.r.left - 2 ||
            r.right > own.r.right + 2 ||
            r.top < own.r.top - 2 ||
            r.bottom > own.r.bottom + 2
          return out ? `${t.textContent} escapes ${own.name}` : null
        })
        .filter(Boolean)
    })
    expect(spills).toEqual([])
  })

  test('a label turns a quarter turn exactly when its cell is taller than wide', async ({
    page,
  }) => {
    // The rule, not a guess at which cells satisfy it: a sideways icicle makes
    // tall narrow cells and a vertical one makes wide short cells, but either
    // can produce the other shape at some depth, and the label has to follow
    // the cell rather than the direction.
    for (const direction of ['down', 'right']) {
      await renderChart(
        page,
        baseOptions({ direction, dataLabels: { minSizeToShow: 10 } }),
      )
      const mismatched = await page.evaluate(() => {
        const cells = {}
        document.querySelectorAll('.apexcharts-icicle-cell').forEach((c) => {
          cells[c.getAttribute('data:name')] = {
            w: +c.getAttribute('width'),
            h: +c.getAttribute('height'),
          }
        })
        return Array.from(
          document.querySelectorAll('.apexcharts-icicle-labels text'),
        )
          .map((t) => {
            const name = (t.textContent || '').replace(/…$/, '')
            const cell = Object.keys(cells).find((k) => k.startsWith(name))
            if (!cell) return null
            const rotated = (t.getAttribute('transform') || '').includes(
              'rotate',
            )
            const shouldRotate = cells[cell].h > cells[cell].w
            return rotated === shouldRotate ? null : `${cell}: ${rotated}`
          })
          .filter(Boolean)
      })
      expect(mismatched, `direction ${direction}`).toEqual([])
    }

    // 'never' opts out entirely.
    await renderChart(
      page,
      baseOptions({ direction: 'right', dataLabels: { rotate: 'never' } }),
    )
    expect((await labels(page)).some((l) => l.rotated)).toBe(false)
  })

  test('per-node tooltip shows the share of parent and of total', async ({
    page,
  }) => {
    await renderChart(page, baseOptions())
    const cell = page.locator('[data\\:name="Product"]')
    await cell.hover({ force: true })
    await page.waitForTimeout(60)

    const tip = await page.evaluate(() => {
      const t = document.querySelector('.apexcharts-tooltip')
      return { text: t.textContent, active: t.classList.contains('apexcharts-active') }
    })
    expect(tip.active).toBe(true)
    expect(tip.text).toContain('Product')
    expect(tip.text).toContain('% of parent')
    expect(tip.text).toContain('% of total')
  })

  test('the intro animates: cells are not at their final size on frame one', async ({
    page,
  }) => {
    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.addScriptTag({ path: addonPath })
    await page.evaluate((o) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
      window.chart.render()
    }, {
      ...baseOptions(),
      chart: {
        type: 'icicle',
        width: 760,
        height: 420,
        animations: { enabled: true, speed: 800 },
      },
    })

    await page.waitForSelector('.apexcharts-icicle-cell')
    await page.waitForTimeout(120)
    const mid = await boxes(page)
    await page.waitForTimeout(1200)
    const settled = await boxes(page)

    // Something grew. Compare the whole set, not one cell: a wipe leaves the
    // first cell's x and y untouched, so a single sample can look static.
    const grew = Object.keys(settled).some(
      (k) => mid[k] && settled[k].w - mid[k].w > 1,
    )
    expect(grew).toBe(true)
    expect(settled.Engineering.w).toBeGreaterThan(1)
  })

  test('a zoom runs on the interaction clock, not the first-render one', async ({
    page,
  }) => {
    // The two clocks are set far apart so the assertion cannot pass by luck:
    // a zoom reading `animations.speed` would still be moving at 400ms.
    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.addScriptTag({ path: addonPath })
    await page.evaluate((o) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
      window.chart.render()
    }, {
      ...baseOptions(),
      chart: {
        type: 'icicle',
        width: 760,
        height: 420,
        animations: {
          enabled: true,
          speed: 3000,
          dynamicAnimation: { enabled: true, speed: 150 },
        },
      },
    })
    await page.waitForSelector('.apexcharts-icicle-cell')
    // Let the (deliberately slow) intro finish before timing the zoom.
    await page.waitForTimeout(3400)

    const width = () =>
      page.evaluate(
        () =>
          +Array.from(document.querySelectorAll('.apexcharts-icicle-cell'))
            .find((c) => c.getAttribute('data:name') === 'Platform')
            .getAttribute('width'),
      )

    const before = await width()
    await clickCell(page, 'Platform')
    await page.waitForTimeout(400)
    const settled = await width()
    await page.waitForTimeout(600)
    const later = await width()

    expect(settled).toBeGreaterThan(before)
    // Still moving at 400ms would mean it took the 3000ms clock.
    expect(Math.abs(later - settled)).toBeLessThan(1)
  })

  test('the drilldown config renders as one icicle, with no drilldown feature', async ({
    page,
  }) => {
    await renderChart(page, {
      ...baseOptions(),
      series: [
        {
          data: [
            { x: 'Search', y: 790, drilldown: 'search' },
            { x: 'Direct', y: 240 },
          ],
        },
      ],
      drilldown: {
        series: [
          {
            id: 'search',
            data: [
              { x: 'Organic', y: 420 },
              { x: 'Paid', y: 260 },
              { x: 'Brand', y: 110 },
            ],
          },
        ],
      },
    })
    const b = await boxes(page)
    expect(Object.keys(b).sort()).toEqual([
      'Brand',
      'Direct',
      'Organic',
      'Paid',
      'Search',
    ])
    expect(b.Organic.y).toBeGreaterThan(b.Search.y)
  })
})
