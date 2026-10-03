/**
 * The plot area eases to its new place when the axes change size.
 *
 * Hiding a series can shrink the y-axis labels ($120k becomes $80k on the
 * stacked-column sample), new categories can rotate the x labels, a series
 * can take its y axis with it. The graphical area then moves and resizes.
 * It used to be re-placed on frame 0 while the marks inside it were only
 * beginning their tween, so the whole plot jumped ~6px sideways (found by the
 * frame recorder once it measured through transforms: every mark moved with
 * the plot, so no earlier test could see it).
 *
 * Each case records the transition and checks, besides the usual rules, that
 * the plot origin (noLayoutShift) and the chrome anchored to the plot rect
 * (chromeSteady: clip box, grid reach, y axes, x axis line and labels) are
 * where they were at frame 0 and move only in eased steps after it.
 */

import { test, expect } from '@playwright/test'
import {
  loadSample,
  mountChart,
  recordTransition,
  toggleLegend,
  checkAll,
  settles,
  noLayoutShift,
  chromeSteady,
  probes,
  expectNoViolations,
} from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

/** Record `action` with the chrome probe and run every layout rule on it. */
async function recordLayout(page, action) {
  const rec = await recordTransition(page, action, { probe: probes.chromeEdges })
  return { rec, violations: [...noLayoutShift(rec), ...chromeSteady(rec), ...checkAll(rec)] }
}

/** The plot actually moved or resized: otherwise the case proves nothing. */
function moved(rec) {
  const [a, b] = [rec.probeBefore, rec.probes[rec.probes.length - 1]]
  const keys = ['clipLeft', 'clipTop', 'clipRight', 'clipBottom'].filter((k) => k in a && k in b)
  return Math.max(...keys.map((k) => Math.abs(a[k] - b[k])))
}

test.describe('Plot area eases when the axes change size', () => {
  test('stacked column: hiding the series that sets the y-axis width widens the plot', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')
    const { rec, violations } = await recordLayout(page, () => page.locator('.apexcharts-legend-series').nth(0).click())
    test.expect(moved(rec)).toBeGreaterThan(3)
    expectNoViolations(violations)
    test.expect(errors).toEqual([])
  })

  test('stacked column: showing it again narrows the plot', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')
    await page.locator('.apexcharts-legend-series').nth(0).click()
    await advance(page, 4000)
    const { rec, violations } = await recordLayout(page, () => page.locator('.apexcharts-legend-series').nth(0).click())
    test.expect(moved(rec)).toBeGreaterThan(3)
    expectNoViolations(violations)
    test.expect(errors).toEqual([])
  })

  test('stacked column: a second toggle mid-flight continues from where the plot is', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')
    await page.locator('.apexcharts-legend-series').nth(0).click()
    await advance(page, 120)
    const rec = await recordTransition(page, () => page.locator('.apexcharts-legend-series').nth(0).click(), {
      probe: probes.chromeEdges,
    })
    // Marks restart from where their previous tween was headed (they always
    // have); the plot and its chrome must not.
    expectNoViolations([...noLayoutShift(rec), ...chromeSteady(rec)])
    test.expect(errors).toEqual([])
  })

  test('a pointer pressed on the plot mid-flight lands the move first', async ({ page }) => {
    // Hit-testing, zoom and selection map the pointer through the final
    // layout, so a gesture that acts on a position must see the plot there.
    const errors = await loadSample(page, 'column', 'stacked-column')
    const origin = () =>
      page.evaluate(() => {
        const m = document.querySelector('.apexcharts-graphical').getCTM()
        return [m.e, m.f]
      })
    await page.locator('.apexcharts-legend-series').nth(0).click()
    await advance(page, 60)
    const midway = await origin()
    const box = await page.locator('.apexcharts-grid').boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    const landed = await origin()
    await page.mouse.up()
    await advance(page, 4000)
    const settled = await origin()
    test.expect(Math.abs(midway[0] - settled[0])).toBeGreaterThan(1)
    test.expect(Math.abs(landed[0] - settled[0])).toBeLessThan(0.01)
    test.expect(errors).toEqual([])
  })

  test('line: updateSeries with wider y labels narrows the plot', async ({ page }) => {
    const errors = await mountChart(page, {
      chart: { type: 'line', height: 320 },
      series: [{ name: 'A', data: [12, 30, 22, 41, 35, 28] }],
      xaxis: { categories: MONTHS },
    })
    const { rec, violations } = await recordLayout(page, () =>
      page.evaluate(() => window.chart.updateSeries([{ name: 'A', data: [12000, 30000, 22000, 41000, 35000, 28000] }])),
    )
    test.expect(moved(rec)).toBeGreaterThan(3)
    expectNoViolations(violations)
    expectNoViolations(
      await settles(page, rec, {
        transform: `(o) => ({ series: [{ name: 'A', data: [12000, 30000, 22000, 41000, 35000, 28000] }] })`,
      }),
    )
    test.expect(errors).toEqual([])
  })

  test('column: categories that rotate the x labels shorten the plot', async ({ page }) => {
    const short = 'ABCDEFGH'.split('')
    const long = short.map((c) => `Regional office ${c}, north`)
    const data = (names) => names.map((x, i) => ({ x, y: [10, 20, 15, 30, 25, 18, 22, 27][i] }))
    const errors = await mountChart(page, {
      chart: { type: 'bar', height: 340 },
      series: [{ name: 'A', data: data(short) }],
    })
    const { rec, violations } = await recordLayout(page, () =>
      page.evaluate((d) => window.chart.updateSeries([{ name: 'A', data: d }]), data(long)),
    )
    test.expect(moved(rec)).toBeGreaterThan(3)
    expectNoViolations(violations)
    test.expect(errors).toEqual([])
  })

  test('dual axis: hiding the series that owns the left axis', async ({ page }) => {
    const errors = await mountChart(page, {
      chart: { type: 'line', height: 340 },
      series: [
        { name: 'Revenue', type: 'column', data: [440000, 505000, 414000, 671000, 227000, 413000] },
        { name: 'Orders', type: 'line', data: [23, 42, 35, 27, 43, 22] },
      ],
      xaxis: { categories: MONTHS },
      yaxis: [{ title: { text: 'Revenue' } }, { opposite: true, title: { text: 'Orders' } }],
    })
    const { rec, violations } = await recordLayout(page, () => toggleLegend(page, 'Revenue'))
    test.expect(moved(rec)).toBeGreaterThan(3)
    expectNoViolations(violations)
    test.expect(errors).toEqual([])
  })

  test('horizontal bar: longer category names push the plot right', async ({ page }) => {
    const data = (names) => names.map((x, i) => ({ x, y: [40, 55, 30, 47][i] }))
    const errors = await mountChart(page, {
      chart: { type: 'bar', height: 300 },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 'A', data: data(['UK', 'US', 'FR', 'DE']) }],
    })
    const { rec, violations } = await recordLayout(page, () =>
      page.evaluate(
        (d) => window.chart.updateSeries([{ name: 'A', data: d }]),
        data(['United Kingdom', 'United States', 'France', 'Germany']),
      ),
    )
    test.expect(moved(rec)).toBeGreaterThan(3)
    expectNoViolations(violations)
    test.expect(errors).toEqual([])
  })

  // A same-shape update on the fast path reuses the chrome nodes. If an
  // earlier update's tick tweens were still moving them, the layout tween
  // used to read their mid-flight positions as final: the vertical gridlines
  // stayed put there, out of line with their labels and past the plot.
  test('a fast update mid-flight lands every gridline with its label', async ({ page }) => {
    const errors = await mountChart(page, {
      chart: { type: 'line', height: 320, toolbar: { show: false } },
      grid: { xaxis: { lines: { show: true } } },
      series: [{ name: 'A', data: [12, 30, 22, 41, 35] }],
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
    })
    await page.evaluate(() =>
      window.chart.updateOptions({ yaxis: { labels: { formatter: (v) => `$${v.toFixed(0)},000.00` } } }),
    )
    await advance(page, 120)
    await page.evaluate(() => window.chart.updateSeries([{ name: 'A', data: [35, 44, 28, 51, 42] }]))
    await advance(page, 4000)
    const r = await page.evaluate(() => ({
      stats: window.chart._updateStats,
      width: window.chart.w.layout.gridWidth,
      lines: [...document.querySelectorAll('.apexcharts-gridlines-vertical line')].map((l) => +l.getAttribute('x1')),
      labels: [...document.querySelectorAll('.apexcharts-xaxis-texts-g text')].map((t) => +t.getAttribute('x')),
    }))
    expect(r.stats.fast + r.stats.fastWithAxes, 'the second update took the fast path').toBeGreaterThan(0)
    for (const x of r.lines) expect(x).toBeLessThanOrEqual(r.width + 0.5)
    for (const x of r.labels) expect(r.lines.some((l) => Math.abs(l - x) < 0.5), `a gridline at ${x}`).toBe(true)
    expect(errors).toEqual([])
  })

  // A chart detached for a moment (a hidden tab, a re-parented widget) keeps
  // its graphical group: its tween must run on and land, not stop mid-way.
  test('a chart detached mid-flight still lands its layout', async ({ page }) => {
    const errors = await mountChart(page, {
      chart: { type: 'line', height: 320, toolbar: { show: false } },
      series: [{ name: 'A', data: [12, 30, 22, 41, 35] }],
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
    })
    await page.evaluate(() => window.chart.updateSeries([{ name: 'A', data: [120000, 300000, 220000, 410000, 350000] }]))
    await advance(page, 100)
    await page.evaluate(() => {
      const el = document.querySelector('#chart')
      window.__parent = el.parentNode
      el.remove()
    })
    await advance(page, 100)
    await page.evaluate(() => window.__parent.appendChild(document.querySelector('#chart') || window.chart.el))
    await advance(page, 4000)
    const r = await page.evaluate(() => {
      const l = window.chart.w.layout
      const t = document.querySelector('.apexcharts-graphical').getAttribute('transform')
      return { t, want: `translate(${l.translateX}, ${l.translateY})` }
    })
    expect(r.t).toBe(r.want)
    expect(errors).toEqual([])
  })

  // Ticks that leave fade out as ghosts sliding to where their value lands;
  // a ghost gridline must ride with its ghost label, not be held in place.
  test('ghost gridlines ride with their ghost labels', async ({ page }) => {
    const errors = await mountChart(page, {
      chart: { type: 'line', height: 320, toolbar: { show: false } },
      grid: { xaxis: { lines: { show: true } } },
      xaxis: { type: 'numeric' },
      series: [{ name: 'A', data: Array.from({ length: 8 }, (_, i) => [i * 10, 20 + ((i * 7) % 11)]) }],
    })
    await page.evaluate(() =>
      window.chart.updateSeries([{ name: 'A', data: Array.from({ length: 30 }, (_, i) => [i * 10, 20000 + ((i * 7) % 11) * 1000]) }]),
    )
    await advance(page, 120)
    const r = await page.evaluate(() => ({
      lines: [...document.querySelectorAll('.apexcharts-gridlines-vertical line.apexcharts-tick-ghost')].map((l) => +l.getAttribute('x1')),
      labels: [...document.querySelectorAll('.apexcharts-xaxis-texts-g text.apexcharts-tick-ghost')].map((t) => +t.getAttribute('x')),
    }))
    expect(r.lines.length, 'the update retired some ticks').toBeGreaterThan(0)
    for (const x of r.lines) expect(r.labels.some((lx) => Math.abs(lx - x) < 1.5), `a ghost label at ${x}`).toBe(true)
    expect(errors).toEqual([])
  })

  // A horizontal bar chart with its category axis on the right: the labels
  // sit at the plot's right edge and must follow it, not jump ahead of it.
  test('horizontal bar, category axis on the right: labels follow the plot edge', async ({ page }) => {
    const data = (names) => names.map((x, i) => ({ x, y: [40, 55, 30, 47][i] }))
    const errors = await mountChart(page, {
      chart: { type: 'bar', height: 300, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true } },
      yaxis: { opposite: true },
      series: [{ name: 'A', data: data(['UK', 'US', 'FR', 'DE']) }],
    })
    const probe = () => {
      const t = [...document.querySelectorAll('.apexcharts-yaxis text')].find((n) => n.textContent === 'FR')
      const g = document.querySelector('.apexcharts-graphical')
      const clip = document.querySelector('clipPath[id^="gridRectMask"] rect')
      if (!t || !g || !clip) return {}
      const m = t.getCTM()
      const gm = g.getCTM()
      return { label: m.e + m.a * +t.getAttribute('x'), plotRight: gm.e + +clip.getAttribute('x') + +clip.getAttribute('width') }
    }
    const rec = await recordTransition(
      page,
      () => page.evaluate((d) => window.chart.updateSeries([{ name: 'A', data: d }]), data(['United Kingdom', 'US', 'FR', 'DE'])),
      { probe },
    )
    // The label keeps its distance to the plot's right edge on every frame.
    const gaps = [rec.probeBefore, ...rec.probes].filter((p) => p && 'label' in p).map((p) => p.label - p.plotRight)
    const end = gaps[gaps.length - 1]
    expect(Math.max(...gaps.map((g) => Math.abs(g - end)))).toBeLessThan(1.5)
    expect(errors).toEqual([])
  })
})
