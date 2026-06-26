/**
 * Drilldown interaction tests (real browser).
 *
 * Self-contained: injects the built UMD bundle (which registers the drilldown
 * feature via features/all) and creates its own chart, so this exercises the
 * real DOM click path — Graphics.pathMouseDown → dataPointSelection → drill —
 * that the jsdom unit tests can only call synthetically.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const umdPath = resolve(rootDir, 'dist', 'apexcharts.js')

const CHART_OPTIONS = {
  chart: { type: 'bar', height: 360, animations: { enabled: false } },
  series: [
    {
      name: 'Sales',
      data: [
        { x: '2023', y: 100, drilldown: '2023-q' },
        { x: '2024', y: 150, drilldown: '2024-q' },
        { x: '2025', y: 200 },
      ],
    },
  ],
  drilldown: {
    enabled: true,
    series: [
      {
        id: '2023-q',
        name: '2023 by Quarter',
        data: [
          { x: 'Q1', y: 20 },
          { x: 'Q2', y: 30 },
          { x: 'Q3', y: 25 },
          { x: 'Q4', y: 25 },
        ],
      },
      {
        id: '2024-q',
        name: '2024 by Quarter',
        data: [
          { x: 'Q1', y: 35 },
          { x: 'Q2', y: 40 },
          { x: 'Q3', y: 38 },
          { x: 'Q4', y: 37 },
        ],
      },
    ],
  },
}

async function mountChart(page) {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))

  await page.setContent('<div id="chart"></div>')
  await page.addScriptTag({ path: umdPath })
  await page.evaluate((opts) => {
    window.chart = new window.ApexCharts(document.querySelector('#chart'), opts)
    return window.chart.render()
  }, CHART_OPTIONS)
  await page.waitForFunction(
    () => window.chart && window.chart.w.globals.animationEnded === true,
    { timeout: 10_000 },
  )
  return errors
}

function getSeries(page) {
  return page.evaluate(() => window.chart.getState().series[0])
}

function getDepth(page) {
  return page.evaluate(() => window.chart.drilldown.depth)
}

test.describe('drilldown', () => {
  test('clicking a drillable bar drills in and shows a breadcrumb', async ({ page }) => {
    const errors = await mountChart(page)

    // The bars carry [index][j] attributes; click the 2024 column (j=1).
    await page.locator('[index="0"][j="1"]').first().click({ force: true })

    // Breadcrumb appears once drilled in.
    await page.waitForSelector('.apexcharts-breadcrumb', { timeout: 5_000 })
    await expect(page.locator('.apexcharts-breadcrumb-current')).toHaveText(
      '2024 by Quarter',
    )

    expect(await getDepth(page)).toBe(1)
    expect(await getSeries(page)).toEqual([35, 40, 38, 37])
    expect(errors, errors.join('\n')).toHaveLength(0)
  })

  test('breadcrumb root button drills back to the parent', async ({ page }) => {
    await mountChart(page)

    await page.locator('[index="0"][j="0"]').first().click({ force: true })
    await page.waitForSelector('.apexcharts-breadcrumb')
    expect(await getSeries(page)).toEqual([20, 30, 25, 25]) // 2023 quarters

    // Click the "All" root crumb to go back.
    await page.locator('button.apexcharts-breadcrumb-item').first().click()
    await page.waitForFunction(() => window.chart.drilldown.depth === 0, {
      timeout: 5_000,
    })

    expect(await getSeries(page)).toEqual([100, 150, 200])
    await expect(page.locator('.apexcharts-breadcrumb')).toHaveCount(0)
  })

  test('non-drillable bar does nothing', async ({ page }) => {
    await mountChart(page)

    // 2025 (j=2) has no drilldown field.
    await page.locator('[index="0"][j="2"]').first().click({ force: true })
    await page.waitForTimeout(200)

    expect(await getDepth(page)).toBe(0)
    await expect(page.locator('.apexcharts-breadcrumb')).toHaveCount(0)
  })

  test('imperative drillDown() / drillUp() work', async ({ page }) => {
    await mountChart(page)

    await page.evaluate(() => window.chart.drillDown('2023-q'))
    await page.waitForFunction(() => window.chart.drilldown.depth === 1)
    expect(await getSeries(page)).toEqual([20, 30, 25, 25])

    await page.evaluate(() => window.chart.drillUp())
    await page.waitForFunction(() => window.chart.drilldown.depth === 0)
    expect(await getSeries(page)).toEqual([100, 150, 200])
  })
})

// Cross-type drill: a column root whose levels override chart.type to 'donut'.
// Animations are ON so the bar↔radial morph runs in both directions.
const DONUT_OPTIONS = {
  chart: { type: 'bar', height: 360 },
  series: [
    {
      name: 'Sales',
      data: [
        { x: '2023', y: 100, drilldown: '2023-q' },
        { x: '2024', y: 150, drilldown: '2024-q' },
      ],
    },
  ],
  drilldown: {
    enabled: true,
    series: [
      {
        id: '2023-q',
        name: '2023 by Quarter',
        chart: { type: 'donut' },
        legend: { show: true, position: 'bottom' },
        data: [
          { x: 'Q1', y: 20 },
          { x: 'Q2', y: 30 },
          { x: 'Q3', y: 25 },
          { x: 'Q4', y: 25 },
        ],
      },
      {
        id: '2024-q',
        name: '2024 by Quarter',
        chart: { type: 'donut' },
        legend: { show: true, position: 'bottom' },
        data: [
          { x: 'Q1', y: 35 },
          { x: 'Q2', y: 40 },
          { x: 'Q3', y: 38 },
          { x: 'Q4', y: 37 },
        ],
      },
    ],
  },
}

test.describe('drilldown — cross-type (bar → donut)', () => {
  test('morphs both ways, sets animationEnded, no console errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((opts) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), opts)
      // Record each cross-type morph capture + eligibility result.
      window.__morphs = []
      const m = window.chart.morphTypeChange
      const orig = m.captureBeforeDestroy.bind(m)
      m.captureBeforeDestroy = (args) => {
        const result = orig(args)
        window.__morphs.push({ from: args.fromType, to: args.toType, result })
        return result
      }
      return window.chart.render()
    }, DONUT_OPTIONS)
    await page.waitForFunction(
      () => window.chart && window.chart.w.globals.animationEnded === true,
    )

    // Column root: no donut slices.
    expect(await page.evaluate(() => window.chart.w.config.chart.type)).toBe('bar')
    expect(await page.locator('.apexcharts-pie-area').count()).toBe(0)

    // Drill into 2024 → donut. Morph engaged, animation completes.
    await page.locator('[index="0"][j="1"]').first().click({ force: true })
    await page.waitForFunction(() => window.chart.drilldown.depth === 1)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)
    expect(await page.evaluate(() => window.chart.w.config.chart.type)).toBe('donut')
    expect(await page.locator('.apexcharts-pie-area').count()).toBeGreaterThan(0)

    // Drill back up → column restored, animation completes again.
    await page.locator('button.apexcharts-breadcrumb-item').first().click()
    await page.waitForFunction(() => window.chart.drilldown.depth === 0)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)
    expect(await page.evaluate(() => window.chart.w.config.chart.type)).toBe('bar')

    // Both directions engaged the morph.
    const morphs = await page.evaluate(() => window.__morphs)
    expect(morphs).toContainEqual({ from: 'bar', to: 'donut', result: true })
    expect(morphs).toContainEqual({ from: 'donut', to: 'bar', result: true })

    expect(errors, errors.join('\n')).toHaveLength(0)
  })

  // Regression: clicking a non-first column must still morph EVERY donut slice.
  // Previously the click-selection carried into the child, and pieClicked()'s
  // "reset all elems" pass snapped slices 0..clickedIndex straight to their
  // final arc instead of morphing them from the outgoing bars. Uses a fixture
  // whose root column count matches the child slice count (4 → 4), so every
  // slice goes through the morph branch.
  test('every donut slice animates regardless of which column is clicked', async ({ page }) => {
    const fourToFour = {
      chart: { type: 'bar', height: 360 },
      series: [
        {
          name: 'Sales',
          data: [
            { x: 'A', y: 10, drilldown: 'a' },
            { x: 'B', y: 20, drilldown: 'b' },
            { x: 'C', y: 30, drilldown: 'c' },
            { x: 'D', y: 40, drilldown: 'd' },
          ],
        },
      ],
      drilldown: {
        enabled: true,
        series: ['a', 'b', 'c', 'd'].map((id) => ({
          id,
          name: `${id} detail`,
          chart: { type: 'donut' },
          data: [
            { x: 'Q1', y: 25 },
            { x: 'Q2', y: 30 },
            { x: 'Q3', y: 22 },
            { x: 'Q4', y: 28 },
          ],
        })),
      },
    }

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((opts) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), opts)
      return window.chart.render()
    }, fourToFour)
    await page.waitForFunction(
      () => window.chart && window.chart.w.globals.animationEnded === true,
    )

    // Click a middle column (index 2) — the worst case under the old bug
    // (slices 0,1,2 would have snapped to final instantly).
    await page.locator('[index="0"][j="2"]').first().click({ force: true })
    await page.waitForFunction(() => window.chart.drilldown.depth === 1)

    // Sample each slice's leading x-coordinate over the morph; all must move.
    const firstX = (d) => {
      const m = (d || '').match(/M\s*([\d.]+)/)
      return m ? Math.round(parseFloat(m[1])) : null
    }
    const frames = []
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(40)
      frames.push(
        await page.evaluate(() =>
          Array.from(document.querySelectorAll('.apexcharts-pie-area')).map((p) =>
            p.getAttribute('d'),
          ),
        ),
      )
    }
    const sliceCount = frames[0].length
    expect(sliceCount).toBe(4)
    for (let s = 0; s < sliceCount; s++) {
      const xs = frames.map((f) => firstX(f[s]))
      expect(new Set(xs).size, `slice ${s} should animate (xs=${xs})`).toBeGreaterThan(1)
    }
  })
})

// Multi-series drill: a single-series root whose levels declare a full `series`
// array, so a drill reveals a 3-series grouped breakdown.
const MULTI_OPTIONS = {
  // Root is a distributed single-series bar (mirrors the demo). This is the
  // case that exposed the stale `isBarsDistributed` legend bug: the flag was
  // cached in the Legend constructor and stayed true after drilling into the
  // non-distributed multi-series child, so the legend showed category labels
  // (Q1, Q2, ...) instead of the series names.
  chart: { type: 'bar', height: 360 },
  plotOptions: { bar: { distributed: true } },
  legend: { show: false },
  series: [
    {
      name: 'Total',
      data: [
        { x: '2023', y: 100, drilldown: '2023' },
        { x: '2024', y: 150, drilldown: '2024' },
      ],
    },
  ],
  drilldown: {
    enabled: true,
    series: [
      {
        id: '2024',
        name: '2024 by Channel',
        plotOptions: { bar: { distributed: false } },
        legend: { show: true },
        colors: ['#1565C0', '#42A5F5', '#90CAF9'], // per-level palette
        series: [
          { name: 'Online', data: [{ x: 'Q1', y: 35 }, { x: 'Q2', y: 40 }] },
          { name: 'Retail', data: [{ x: 'Q1', y: 25 }, { x: 'Q2', y: 28 }] },
          { name: 'Wholesale', data: [{ x: 'Q1', y: 18 }, { x: 'Q2', y: 20 }] },
        ],
      },
    ],
  },
}

test.describe('drilldown — multi-series child', () => {
  test('single-series root drills into a 3-series grouped breakdown and back', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((opts) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), opts)
      return window.chart.render()
    }, MULTI_OPTIONS)
    await page.waitForFunction(
      () => window.chart && window.chart.w.globals.animationEnded === true,
    )

    expect(await page.evaluate(() => window.chart.getState().series.length)).toBe(1)

    // Click 2024 (j=1) → 3-series breakdown.
    await page.locator('[index="0"][j="1"]').first().click({ force: true })
    await page.waitForFunction(() => window.chart.drilldown.depth === 1)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)

    expect(await page.evaluate(() => window.chart.getState().series.length)).toBe(3)
    expect(await page.evaluate(() => window.chart.w.globals.seriesNames)).toEqual([
      'Online',
      'Retail',
      'Wholesale',
    ])
    await expect(page.locator('.apexcharts-legend')).toBeVisible()
    // The legend must show the SERIES names, not the per-category labels.
    expect(
      await page.evaluate(() =>
        Array.from(document.querySelectorAll('.apexcharts-legend-text')).map(
          (e) => e.textContent,
        ),
      ),
    ).toEqual(['Online', 'Retail', 'Wholesale'])
    // 3 series × 2 quarters = 6 column rects.
    expect(await page.locator('.apexcharts-bar-area').count()).toBe(6)
    // The per-level palette is applied (one shade per series).
    expect(
      await page.evaluate(() => window.chart.w.globals.colors.slice(0, 3)),
    ).toEqual(['#1565C0', '#42A5F5', '#90CAF9'])

    // Back to the single-series root.
    await page.locator('button.apexcharts-breadcrumb-item').first().click()
    await page.waitForFunction(() => window.chart.drilldown.depth === 0)
    expect(await page.evaluate(() => window.chart.getState().series.length)).toBe(1)

    expect(errors, errors.join('\n')).toHaveLength(0)
  })
})
