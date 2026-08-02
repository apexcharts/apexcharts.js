/**
 * Sunburst (hierarchical radial / nested pie-donut) interaction tests.
 *
 * Self-contained: injects the built UMD bundle (full.js registers `sunburst`)
 * and creates its own chart, exercising the real render + hover + legend path.
 * Covers P1: rings from a native `children` hierarchy AND from a `drilldown`
 * config (adapter), per-node tooltip, and legend-toggle hiding a whole branch.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const umdPath = resolve(rootDir, 'dist', 'apexcharts.js')

// 3 roots, 8 mid nodes, 3 deep nodes = 14 arcs total.
const NATIVE = {
  chart: { type: 'sunburst', width: 520, height: 480, animations: { enabled: false } },
  colors: ['#0EA5E9', '#14B8A6', '#F59E0B'],
  legend: { position: 'bottom' },
  plotOptions: { sunburst: { innerSize: '18%' } },
  series: [
    {
      data: [
        {
          x: 'Mobile',
          y: 55,
          children: [
            { x: 'iOS', y: 30, children: [{ x: 'iOS 17', y: 18 }, { x: 'iOS 16', y: 9 }, { x: 'iOS 15', y: 3 }] },
            { x: 'Android', y: 23 },
            { x: 'Other', y: 2 },
          ],
        },
        { x: 'Desktop', y: 33, children: [{ x: 'Windows', y: 20 }, { x: 'macOS', y: 10 }, { x: 'Linux', y: 3 }] },
        { x: 'Tablet', y: 12, children: [{ x: 'iPadOS', y: 8 }, { x: 'Android', y: 4 }] },
      ],
    },
  ],
}

// Same hierarchy expressed as a drilldown config (the adapter payoff).
const DRILLDOWN_FORM = {
  chart: { type: 'sunburst', width: 520, height: 480, animations: { enabled: false } },
  colors: ['#1565C0', '#2E7D32', '#EF6C00'],
  legend: { position: 'bottom' },
  series: [
    {
      data: [
        { x: 'Mobile', y: 55, drilldown: 'mobile' },
        { x: 'Desktop', y: 33, drilldown: 'desktop' },
        { x: 'Tablet', y: 12, drilldown: 'tablet' },
      ],
    },
  ],
  drilldown: {
    enabled: true,
    series: [
      { id: 'mobile', name: 'Mobile by OS', colors: ['#0D47A1', '#1976D2', '#64B5F6'], data: [{ x: 'iOS', y: 30, drilldown: 'mobile-ios' }, { x: 'Android', y: 23 }, { x: 'Other', y: 2 }] },
      { id: 'mobile-ios', name: 'iOS', data: [{ x: 'iOS 17', y: 18 }, { x: 'iOS 16', y: 9 }, { x: 'iOS 15', y: 3 }] },
      { id: 'desktop', name: 'Desktop by OS', data: [{ x: 'Windows', y: 20 }, { x: 'macOS', y: 10 }, { x: 'Linux', y: 3 }] },
      { id: 'tablet', name: 'Tablet by OS', data: [{ x: 'iPadOS', y: 8 }, { x: 'Android', y: 4 }] },
    ],
  },
}

/** @param {import('@playwright/test').Page} page @param {any} opts */
async function renderChart(page, opts) {
  await page.setContent('<div id="chart"></div>')
  await page.addScriptTag({ path: umdPath })
  await page.evaluate((o) => {
    window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
    return window.chart.render()
  }, opts)
  await page.waitForSelector('.apexcharts-sunburst-arc')
}

// Count arcs actually drawn (non-empty path, not hidden). P2 keeps a hidden
// <path> element per node for zoom tweens, so counting elements is not enough.
const arcCount = (page) =>
  page.evaluate(
    () =>
      Array.from(document.querySelectorAll('.apexcharts-sunburst-arc')).filter(
        (a) => a.style.display !== 'none' && (a.getAttribute('d') || '').length > 2,
      ).length,
  )
const anyNaN = (page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.apexcharts-sunburst-arc')).some((a) =>
      (a.getAttribute('d') || '').includes('NaN'),
    ),
  )
const breadcrumbText = (page) =>
  page.evaluate(() => {
    const n = document.querySelector('.apexcharts-breadcrumb')
    return n ? n.textContent.replace(/\s+/g, ' ').trim() : null
  })
const clickArcByName = (page, name) =>
  page.evaluate((nm) => {
    const el = Array.from(document.querySelectorAll('.apexcharts-sunburst-arc')).find(
      (a) => a.getAttribute('data:name') === nm,
    )
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }, name)

test.describe('sunburst', () => {
  test('renders one arc per node from a native children hierarchy', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await renderChart(page, NATIVE)

    expect(await arcCount(page)).toBe(14) // 3 + 8 + 3
    expect(await anyNaN(page)).toBe(false)
    // Legend shows the top level only.
    expect(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll('.apexcharts-legend-text')).map((e) => e.textContent),
      ),
    ).toEqual(['Mobile', 'Desktop', 'Tablet'])
    expect(errors, errors.join('\n')).toHaveLength(0)
  })

  test('adapter: a drilldown config renders the same rings', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await renderChart(page, DRILLDOWN_FORM)

    expect(await arcCount(page)).toBe(14)
    expect(await anyNaN(page)).toBe(false)
    expect(errors, errors.join('\n')).toHaveLength(0)
  })

  test('per-node tooltip on hover', async ({ page }) => {
    await renderChart(page, NATIVE)

    // Hover the first (inner-ring) arc.
    const box = await page.evaluate(() => {
      const s = document.querySelector('.apexcharts-sunburst-arc')
      const r = s.getBoundingClientRect()
      return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.3 }
    })
    await page.mouse.move(box.x, box.y)
    await page.waitForTimeout(120)

    const tip = await page.locator('.apexcharts-tooltip')
    await expect(tip).toHaveClass(/apexcharts-active/)
    await expect(tip).toContainText('Mobile')
  })

  test('draws curved <textPath> labels', async ({ page }) => {
    await renderChart(page, NATIVE)
    // One per visible arc wide enough to label; at least the big ones.
    const labels = await page.locator('.apexcharts-sunburst-labels textPath').count()
    expect(labels).toBeGreaterThan(5)
  })

  test('click-to-zoom focuses a branch (breadcrumb) and zooms back out', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await renderChart(page, NATIVE) // animations off -> zoom is synchronous
    expect(await arcCount(page)).toBe(14)
    expect(await breadcrumbText(page)).toBeNull()

    // Zoom into Mobile: its subtree (1 + 3 + 3 = 7) fills the chart.
    await clickArcByName(page, 'Mobile')
    await page.waitForTimeout(50)
    expect(await arcCount(page)).toBe(7)
    expect(await breadcrumbText(page)).toContain('Mobile')

    // Breadcrumb "All" zooms back out to the full tree.
    await page.locator('.apexcharts-breadcrumb-item').first().click()
    await page.waitForTimeout(50)
    expect(await arcCount(page)).toBe(14)
    expect(await breadcrumbText(page)).toBeNull()

    expect(errors, errors.join('\n')).toHaveLength(0)
  })

  test('rapid re-click mid-zoom settles cleanly (no torn/fighting animations)', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    // Animations ON so a second click lands while the first zoom is tweening —
    // the exact race that used to leave two rAF loops fighting over each arc.
    const opts = JSON.parse(JSON.stringify(NATIVE))
    opts.chart.animations = { enabled: true, speed: 500 }

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((o) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
      return window.chart.render()
    }, opts)
    await page.waitForSelector('.apexcharts-sunburst-arc')
    await page.waitForTimeout(700) // let the intro settle

    // Click Mobile, then click it again ~120ms later — well before the 500ms
    // zoom finishes. Second click on the focused branch zooms back out, so once
    // everything settles we must be back at the clean full tree.
    await clickArcByName(page, 'Mobile')
    await page.waitForTimeout(120)
    await clickArcByName(page, 'Mobile')

    await page.waitForTimeout(900) // let both transitions fully settle
    expect(await anyNaN(page)).toBe(false)
    expect(await arcCount(page)).toBe(14)
    expect(await breadcrumbText(page)).toBeNull()
    expect(errors, errors.join('\n')).toHaveLength(0)
  })

  test('intro animates as a pie-style clock sweep (arcs appear in angular order)', async ({ page }) => {
    const opts = JSON.parse(JSON.stringify(NATIVE))
    opts.chart.animations = { enabled: true, speed: 900 }

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((o) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
      window.chart.render()
    }, opts)
    await page.waitForSelector('.apexcharts-sunburst-arc')

    // Early in the sweep: some arcs drawn, but not all — and the last-in-angle
    // root (Tablet) must appear after the first (Mobile).
    await page.waitForTimeout(200)
    const early = await page.evaluate(() => {
      const arcs = Array.from(document.querySelectorAll('.apexcharts-sunburst-arc'))
      const drawn = (a) => a.style.display !== 'none' && (a.getAttribute('d') || '').length > 2
      const byName = (nm) => arcs.find((a) => a.getAttribute('data:name') === nm)
      return {
        drawnCount: arcs.filter(drawn).length,
        total: arcs.length,
        mobileDrawn: drawn(byName('Mobile')),
        tabletDrawn: drawn(byName('Tablet')),
      }
    })
    expect(early.drawnCount).toBeGreaterThan(0)
    expect(early.drawnCount).toBeLessThan(early.total)
    expect(early.mobileDrawn).toBe(true)
    expect(early.tabletDrawn).toBe(false)

    // Settled: every arc drawn.
    await page.waitForTimeout(1200)
    expect(await arcCount(page)).toBe(14)
  })

  test('data updates morph the arcs (no instant re-render)', async ({ page }) => {
    const opts = JSON.parse(JSON.stringify(NATIVE))
    opts.chart.animations = {
      enabled: true,
      speed: 300,
      dynamicAnimation: { enabled: true, speed: 800 },
    }

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((o) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
      return window.chart.render()
    }, opts)
    await page.waitForTimeout(700) // settle the intro

    await page.evaluate(() =>
      window.chart.updateSeries([
        {
          data: [
            { x: 'Mobile', y: 20, children: [{ x: 'iOS', y: 12 }, { x: 'Android', y: 8 }] },
            { x: 'Desktop', y: 60, children: [{ x: 'Windows', y: 40 }, { x: 'macOS', y: 20 }] },
            { x: 'Tablet', y: 20, children: [{ x: 'iPadOS', y: 20 }] },
          ],
        },
      ]),
    )

    // Sample the full path of the Desktop arc over the transition — several
    // distinct frames prove a tween, a single value would mean an instant snap.
    const frames = []
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(90)
      frames.push(
        await page.evaluate(() => {
          const el = Array.from(
            document.querySelectorAll('.apexcharts-sunburst-arc'),
          ).find((a) => a.getAttribute('data:name') === 'Desktop')
          return el ? el.getAttribute('d') : null
        }),
      )
    }
    expect(new Set(frames.filter(Boolean)).size).toBeGreaterThanOrEqual(3)
  })

  test('tooltip is opaque (standard theme) and flips inside the chart at the right edge', async ({
    page,
  }) => {
    await renderChart(page, NATIVE)

    // Hover a right-side arc: iOS 16 sits on the right of the circle.
    const hoverRightArc = async () => {
      const box = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('.apexcharts-sunburst-arc')).find(
          (a) => a.getAttribute('data:name') === 'iOS 16',
        )
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })
      await page.mouse.move(box.x, box.y)
      await page.waitForTimeout(120)
    }
    await hoverRightArc()

    const state = await page.evaluate(() => {
      const t = document.querySelector('.apexcharts-tooltip')
      const wrap = document.querySelector('.apexcharts-canvas').getBoundingClientRect()
      const r = t.getBoundingClientRect()
      return {
        // Standard themed tooltip: the container itself must be opaque, not a
        // read-through transparent box.
        background: getComputedStyle(t).backgroundColor,
        insideWrap: r.right <= wrap.right + 1 && r.left >= wrap.left - 1,
      }
    })
    expect(state.background).not.toBe('rgba(0, 0, 0, 0)')
    expect(state.insideWrap).toBe(true)

    // Opt-in fillSeriesColor still paints the group with the slice colour.
    const opts = JSON.parse(JSON.stringify(NATIVE))
    opts.tooltip = { fillSeriesColor: true }
    await page.evaluate((o) => {
      window.chart.destroy()
      window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
      return window.chart.render()
    }, opts)
    await page.waitForSelector('.apexcharts-sunburst-arc')
    await hoverRightArc()
    const groupBg = await page.evaluate(
      () =>
        document.querySelector('.apexcharts-tooltip .apexcharts-tooltip-series-group')?.style
          .backgroundColor,
    )
    expect(groupBg).toBeTruthy()
  })

  test('semicircle sunburst hugs the arc and keeps a bottom legend inside the wrap', async ({
    page,
  }) => {
    // A semicircle (startAngle/endAngle spanning 180°) only fills the top half,
    // so the layout must fit-to-content instead of reserving the full-circle
    // square — otherwise dead space opens between the arc and the bottom legend
    // (and, if over-hugged, the legend falls outside the shrunken wrap).
    const semi = JSON.parse(JSON.stringify(NATIVE))
    semi.chart.animations = { enabled: false }
    semi.legend = { position: 'bottom' }
    semi.plotOptions = { sunburst: { startAngle: -90, endAngle: 90 } }

    const full = JSON.parse(JSON.stringify(semi))
    full.plotOptions = { sunburst: { startAngle: 0, endAngle: 360 } }

    const geom = async (opts) => {
      await page.setContent('<div id="chart" style="width:520px"></div>')
      await page.addScriptTag({ path: umdPath })
      await page.evaluate((o) => {
        window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
        return window.chart.render()
      }, opts)
      await page.waitForSelector('.apexcharts-sunburst-arc')
      await page.waitForTimeout(80)
      return page.evaluate(() => {
        const wrap = document.querySelector('.apexcharts-canvas').getBoundingClientRect()
        const legend = document.querySelector('.apexcharts-legend').getBoundingClientRect()
        const arc = document.querySelector('.apexcharts-sunburst').getBoundingClientRect()
        return {
          wrapH: Math.round(wrap.height),
          legendInside: legend.bottom <= wrap.bottom + 1,
          gap: Math.round(legend.top - arc.bottom),
        }
      })
    }

    const s = await geom(semi)
    const f = await geom(full)

    // The bottom legend must stay within the (now shorter) wrap.
    expect(s.legendInside).toBe(true)
    // The semicircle reserves clearly less vertical space than the full circle.
    expect(s.wrapH).toBeLessThan(f.wrapH - 40)
    // No large dead band between the arc's flat side and the legend.
    expect(s.gap).toBeLessThan(60)
  })

  test('zoom breadcrumb does not overlap a left-aligned title', async ({ page }) => {
    const opts = JSON.parse(JSON.stringify(NATIVE))
    opts.title = { text: 'Website traffic by device and OS', align: 'left' }

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((o) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
      return window.chart.render()
    }, opts)
    await page.waitForSelector('.apexcharts-sunburst-arc')

    await clickArcByName(page, 'Desktop')
    await page.waitForTimeout(100)

    const overlaps = await page.evaluate(() => {
      const bc = document.querySelector('.apexcharts-breadcrumb').getBoundingClientRect()
      const ti = document.querySelector('.apexcharts-title-text').getBoundingClientRect()
      return bc.left < ti.right && bc.right > ti.left && bc.top < ti.bottom && bc.bottom > ti.top
    })
    expect(overlaps).toBe(false)
  })

  test('legend click hides a top-level branch and restores it', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await renderChart(page, NATIVE)
    expect(await arcCount(page)).toBe(14)

    // Hide Mobile: its whole branch (1 + 3 + 3 = 7 arcs) drops.
    await page.locator('.apexcharts-legend-series[rel="1"] .apexcharts-legend-text').click({ force: true })
    await page.waitForTimeout(300)
    expect(await arcCount(page)).toBe(7)
    expect(
      await page.locator('.apexcharts-legend-series[rel="1"]').getAttribute('data:collapsed'),
    ).toBe('true')

    // Restore.
    await page.locator('.apexcharts-legend-series[rel="1"] .apexcharts-legend-text').click({ force: true })
    await page.waitForTimeout(300)
    expect(await arcCount(page)).toBe(14)

    expect(errors, errors.join('\n')).toHaveLength(0)
  })
})
