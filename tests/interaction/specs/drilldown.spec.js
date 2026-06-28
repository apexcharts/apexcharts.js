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
    // The leftmost crumb carries a back-arrow affordance before its label.
    await expect(page.locator('.apexcharts-breadcrumb-arrow')).toHaveText('←')
    await expect(
      page.locator('button.apexcharts-breadcrumb-item .apexcharts-breadcrumb-label'),
    ).toHaveText('All')

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

  // Regression: hiding a series via the legend inside a multi-series child, then
  // drilling back, must NOT blank the chart. Legend-collapse state is stored by
  // series index in w.globals; left in place it re-collapses whatever series now
  // sits at that index in the destination level. Hiding child series 0 then
  // returning to a single-series root used to collapse the root's only series,
  // which got the `apexcharts-series-collapsed` class (opacity: 0) — a blank
  // chart with no console error. _apply() now clears that state on every drill.
  test('hiding a child series then drilling up does not blank the root', async ({ page }) => {
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

    // Drill into the 3-series child.
    await page.locator('[index="0"][j="1"]').first().click({ force: true })
    await page.waitForFunction(() => window.chart.drilldown.depth === 1)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)

    // Hide the FIRST series (index 0) via its legend item.
    await page.locator('.apexcharts-legend-series').first().click()
    await page.waitForFunction(
      () => window.chart.w.globals.collapsedSeriesIndices.length === 1,
    )

    // Drill back to the single-series root.
    await page.locator('button.apexcharts-breadcrumb-item').first().click()
    await page.waitForFunction(() => window.chart.drilldown.depth === 0)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)

    // Collapse state is cleared, and the root series is visible (opacity 1).
    expect(
      await page.evaluate(() => window.chart.w.globals.collapsedSeriesIndices),
    ).toEqual([])
    const rootOpacity = await page.evaluate(() => {
      const g = document.querySelector('.apexcharts-series')
      return g
        ? {
            collapsed: g.classList.contains('apexcharts-series-collapsed'),
            opacity: getComputedStyle(g).opacity,
          }
        : null
    })
    expect(rootOpacity).toEqual({ collapsed: false, opacity: '1' })
    // Root bars are present and drawn.
    expect(await page.locator('.apexcharts-bar-area').count()).toBeGreaterThan(0)

    expect(errors, errors.join('\n')).toHaveLength(0)
  })
})

// Trigger-point zoom: the drill transition is anchored at the clicked point so
// the chart appears to dive into it. Opt-in via drilldown.animation.zoomFromPoint.
const ZOOM_OPTIONS = {
  chart: { type: 'bar', height: 360 },
  plotOptions: { bar: { distributed: true } },
  legend: { show: false },
  series: [
    {
      name: 'Revenue',
      data: [
        { x: '2021', y: 480, drilldown: '2021' },
        { x: '2022', y: 530, drilldown: '2022' },
        { x: '2023', y: 610, drilldown: '2023' },
        { x: '2024', y: 705, drilldown: '2024' },
      ],
    },
  ],
  drilldown: {
    enabled: true,
    animation: { enabled: true, zoomFromPoint: true, speed: 200 },
    series: [
      {
        id: '2023',
        name: '2023 by Quarter',
        data: [{ x: 'Q1', y: 140 }, { x: 'Q2', y: 152 }, { x: 'Q3', y: 158 }, { x: 'Q4', y: 160 }],
      },
    ],
  },
}

test.describe('drilldown — trigger-point zoom', () => {
  test('scales the SVG from the clicked point, then settles clean', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((opts) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), opts)
      return window.chart.render()
    }, ZOOM_OPTIONS)
    await page.waitForFunction(
      () => window.chart && window.chart.w.globals.animationEnded === true,
    )

    const svgWidth = await page.evaluate(() => window.chart.w.dom.Paper.node.getBoundingClientRect().width)

    // Click the third column (2023, j=2) — right-of-centre, so the zoom origin's
    // x should land in the right half of the SVG.
    await page.locator('[index="0"][j="2"]').first().click({ force: true })

    // Sample through the transition: only the data-mark group should scale away
    // from 1 (anchored in the right half), while the SVG frame — axes, grid,
    // title — must NOT scale.
    let sawMarkScale = false
    let sawAnimation = false
    let originX = null
    let svgStayedStill = true
    for (let i = 0; i < 18; i++) {
      const s = await page.evaluate(() => {
        const scaleOf = (t) => (t === 'none' ? 1 : new DOMMatrixReadOnly(t).a)
        const svg = window.chart.w.dom.Paper.node
        const g = svg.querySelector('.apexcharts-plot-series')
        return {
          markScale: g ? scaleOf(getComputedStyle(g).transform) : 1,
          anims: g && g.getAnimations ? g.getAnimations().length : 0,
          origin: g ? g.style.transformOrigin : '',
          svgScale: scaleOf(getComputedStyle(svg).transform),
        }
      })
      if (Math.abs(s.markScale - 1) > 0.1) sawMarkScale = true
      if (s.anims > 0) sawAnimation = true
      if (!originX && s.origin) originX = parseFloat(s.origin)
      if (Math.abs(s.svgScale - 1) > 0.001) svgStayedStill = false
      await page.waitForTimeout(25)
    }
    expect(sawMarkScale, 'the data-mark group should scale during the transition').toBe(true)
    expect(sawAnimation, 'a WAAPI animation should run on the mark group').toBe(true)
    expect(originX, 'origin should be in the right half (clicked 3rd of 4)').toBeGreaterThan(svgWidth / 2)
    expect(svgStayedStill, 'the SVG frame (axes/grid/title) must not scale').toBe(true)

    // Drill landed correctly: child data + child x-axis labels. (depth flips
    // synchronously before the async transition finishes its restore, so wait on
    // the data itself + the mark-group animation draining, not on depth.)
    await page.waitForFunction(
      () => {
        const s = window.chart.getState().series[0]
        const g = window.chart.w.dom.Paper.node.querySelector('.apexcharts-plot-series')
        return s && s[0] === 140 && (g && g.getAnimations ? g.getAnimations().length === 0 : true)
      },
      { timeout: 5000 },
    )
    expect(await page.evaluate(() => window.chart.getState().series[0])).toEqual([140, 152, 158, 160])
    // The x-axis must show the CHILD categories (Q1..Q4), not the parent years.
    expect(
      await page.evaluate(() =>
        Array.from(
          new Set(
            Array.from(document.querySelectorAll('.apexcharts-xaxis-texts-g text')).map(
              (t) => t.textContent.replace(/(.+)\1/, '$1'), // de-dupe doubled tspan text
            ),
          ),
        ),
      ),
    ).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])

    // After settling, the mark group is back to natural (no residual transform,
    // inline cleared) and the SVG frame was never transformed.
    const settled = await page.evaluate(() => {
      const norm = (t) => (t === 'none' ? 'matrix(1, 0, 0, 1, 0, 0)' : t)
      const svg = window.chart.w.dom.Paper.node
      const g = svg.querySelector('.apexcharts-plot-series')
      return {
        markTransform: norm(getComputedStyle(g).transform),
        markInline: g.style.transform,
        svgTransform: norm(getComputedStyle(svg).transform),
      }
    })
    expect(settled).toEqual({
      markTransform: 'matrix(1, 0, 0, 1, 0, 0)',
      markInline: '',
      svgTransform: 'matrix(1, 0, 0, 1, 0, 0)',
    })

    // Drill back: parent restored, no residual transform on the marks.
    await page.locator('button.apexcharts-breadcrumb-item').first().click()
    await page.waitForFunction(
      () => {
        const s = window.chart.getState().series[0]
        const g = window.chart.w.dom.Paper.node.querySelector('.apexcharts-plot-series')
        return s && s[0] === 480 && (g && g.getAnimations ? g.getAnimations().length === 0 : true)
      },
      { timeout: 5000 },
    )
    expect(await page.evaluate(() => window.chart.getState().series[0])).toEqual([480, 530, 610, 705])
    expect(
      await page.evaluate(() => {
        const g = window.chart.w.dom.Paper.node.querySelector('.apexcharts-plot-series')
        const t = getComputedStyle(g).transform
        return t === 'none' ? 'matrix(1, 0, 0, 1, 0, 0)' : t
      }),
    ).toBe('matrix(1, 0, 0, 1, 0, 0)')

    expect(errors, errors.join('\n')).toHaveLength(0)
  })
})

// Treemap drilldown. Treemap is an axis chart whose tiles carry [index][j]
// attrs and preserve a per-point `drilldown` field, so the same click wiring
// drives it with no chart-type-specific code. A single-series tile hierarchy
// drills into deeper single-series levels (sector → industry → company).
const TREEMAP_OPTIONS = {
  chart: { type: 'treemap', height: 360 },
  legend: { show: false },
  colors: ['#1565C0', '#2E7D32', '#C62828'],
  plotOptions: { treemap: { distributed: true, enableShades: false } },
  series: [
    {
      data: [
        { x: 'Technology', y: 620, drilldown: 'tech' },
        { x: 'Financials', y: 430, drilldown: 'fin' },
        { x: 'Healthcare', y: 380 }, // not drillable
      ],
    },
  ],
  drilldown: {
    enabled: true,
    series: [
      {
        id: 'tech',
        name: 'Technology',
        colors: ['#0D47A1', '#1976D2', '#42A5F5'], // per-level palette
        plotOptions: { treemap: { distributed: true, enableShades: false } },
        data: [
          { x: 'Cloud', y: 260, drilldown: 'tech-cloud' }, // drills deeper
          { x: 'Devices', y: 190 },
          { x: 'Software', y: 120 },
        ],
      },
      {
        id: 'tech-cloud',
        name: 'Cloud',
        plotOptions: { treemap: { distributed: true, enableShades: false } },
        data: [
          { x: 'Compute', y: 110 },
          { x: 'Storage', y: 80 },
        ],
      },
      {
        id: 'fin',
        name: 'Financials',
        data: [
          { x: 'Banking', y: 210 },
          { x: 'Insurance', y: 140 },
        ],
      },
    ],
  },
}

test.describe('drilldown — treemap', () => {
  test('drills sector → industry → company and back, with per-level colours', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((opts) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), opts)
      return window.chart.render()
    }, TREEMAP_OPTIONS)
    await page.waitForFunction(
      () => window.chart && window.chart.w.globals.animationEnded === true,
    )

    // Three sectors; the two with a `drilldown` field are marked drillable.
    expect(await page.locator('.apexcharts-treemap-rect').count()).toBe(3)
    expect(await page.locator('.apexcharts-drilldown-target').count()).toBe(2)

    // Drill into Technology (index 0, j 0).
    await page.locator('.apexcharts-treemap-rect[index="0"][j="0"]').first().click({ force: true })
    await page.waitForFunction(() => window.chart.drilldown.depth === 1)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)
    await expect(page.locator('.apexcharts-breadcrumb-current')).toHaveText('Technology')
    expect(await page.locator('.apexcharts-treemap-rect').count()).toBe(3) // Cloud/Devices/Software
    // Per-level palette applied to the tiles.
    expect(
      await page.evaluate(() => window.chart.w.globals.colors.slice(0, 3)),
    ).toEqual(['#0D47A1', '#1976D2', '#42A5F5'])

    // Drill deeper into Cloud (index 0, j 0) → company level (depth 2).
    await page.locator('.apexcharts-treemap-rect[index="0"][j="0"]').first().click({ force: true })
    await page.waitForFunction(() => window.chart.drilldown.depth === 2)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)
    await expect(page.locator('.apexcharts-breadcrumb-current')).toHaveText('Cloud')
    expect(await page.locator('.apexcharts-treemap-rect').count()).toBe(2) // Compute/Storage

    // Breadcrumb back to the root.
    await page.locator('button.apexcharts-breadcrumb-item').first().click()
    await page.waitForFunction(() => window.chart.drilldown.depth === 0)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)
    expect(await page.locator('.apexcharts-treemap-rect').count()).toBe(3)
    expect(
      await page.evaluate(() => window.chart.w.globals.colors.slice(0, 3)),
    ).toEqual(['#1565C0', '#2E7D32', '#C62828']) // root palette restored
    await expect(page.locator('.apexcharts-breadcrumb')).toHaveCount(0)

    expect(errors, errors.join('\n')).toHaveLength(0)
  })
})

// Heatmap drilldown. Heatmap is multi-series (each series = a row); a cell
// carries [index][j] and a `drilldown` field, so a click drills into a full
// child heatmap with a different row/column shape (a full rebuild, since the
// series count changes) plus a per-level colorScale override.
const HEATMAP_OPTIONS = {
  chart: { type: 'heatmap', height: 360 },
  dataLabels: { enabled: false },
  plotOptions: {
    heatmap: {
      colorScale: {
        ranges: [
          { from: 0, to: 50, color: '#C8E6C9' },
          { from: 51, to: 100, color: '#E53935' },
        ],
      },
    },
  },
  series: [
    { name: 'North', data: [{ x: 'Q1', y: 22, drilldown: 'north-q1' }, { x: 'Q2', y: 70 }, { x: 'Q3', y: 31 }] },
    { name: 'South', data: [{ x: 'Q1', y: 41 }, { x: 'Q2', y: 35 }, { x: 'Q3', y: 28 }] },
    { name: 'East', data: [{ x: 'Q1', y: 18 }, { x: 'Q2', y: 24 }, { x: 'Q3', y: 33 }] },
  ],
  drilldown: {
    enabled: true,
    series: [
      {
        id: 'north-q1',
        name: 'North / Q1',
        plotOptions: {
          heatmap: {
            colorScale: {
              ranges: [
                { from: 0, to: 5, color: '#C8E6C9' },
                { from: 6, to: 10, color: '#FB8C00' },
              ],
            },
          },
        },
        series: [
          { name: 'Jan', data: [{ x: 'Wk1', y: 5 }, { x: 'Wk2', y: 7 }, { x: 'Wk3', y: 9 }, { x: 'Wk4', y: 6 }] },
          { name: 'Feb', data: [{ x: 'Wk1', y: 8 }, { x: 'Wk2', y: 6 }, { x: 'Wk3', y: 7 }, { x: 'Wk4', y: 5 }] },
        ],
      },
    ],
  },
}

test.describe('drilldown — heatmap', () => {
  test('drills a cell into a child heatmap and back', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((opts) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), opts)
      return window.chart.render()
    }, HEATMAP_OPTIONS)
    await page.waitForFunction(
      () => window.chart && window.chart.w.globals.animationEnded === true,
    )

    // 3 rows × 3 cols = 9 cells; only North/Q1 carries a drilldown id.
    expect(await page.locator('.apexcharts-heatmap-rect').count()).toBe(9)
    expect(await page.locator('.apexcharts-drilldown-target').count()).toBe(1)

    // Click North/Q1 (row index 0, col j 0).
    await page.locator('.apexcharts-heatmap-rect[index="0"][j="0"]').first().click({ force: true })
    await page.waitForFunction(() => window.chart.drilldown.depth === 1)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)

    await expect(page.locator('.apexcharts-breadcrumb-current')).toHaveText('North / Q1')
    // Child heatmap: 2 rows (Jan/Feb) × 4 weeks = 8 cells.
    expect(await page.evaluate(() => window.chart.w.config.series.length)).toBe(2)
    expect(await page.evaluate(() => window.chart.w.globals.seriesNames)).toEqual(['Jan', 'Feb'])
    expect(await page.locator('.apexcharts-heatmap-rect').count()).toBe(8)

    // Back to the root grid.
    await page.locator('button.apexcharts-breadcrumb-item').first().click()
    await page.waitForFunction(() => window.chart.drilldown.depth === 0)
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)
    expect(await page.evaluate(() => window.chart.w.config.series.length)).toBe(3)
    expect(await page.locator('.apexcharts-heatmap-rect').count()).toBe(9)
    await expect(page.locator('.apexcharts-breadcrumb')).toHaveCount(0)

    expect(errors, errors.join('\n')).toHaveLength(0)
  })
})

// Pie/donut drilldown. Slices carry index=0 / j=<sliceIndex> and fire
// dataPointSelection on mousedown, so a click drills exactly like a bar. The one
// requirement is object-form data ([{ x, y, drilldown }]) so each slice can carry
// its own child id — flat numeric pie can't. Clicks are dispatched as a mousedown
// on the arc path (the donut's bbox centre is the empty hole, so a centre-click
// would miss the wedge).
const DONUT_OPTIONS_DD = {
  chart: { type: 'donut', height: 360 },
  colors: ['#1565C0', '#2E7D32', '#EF6C00'],
  legend: { show: true, position: 'bottom' },
  series: [
    {
      data: [
        { x: 'Mobile', y: 55, drilldown: 'mobile' },
        { x: 'Desktop', y: 33, drilldown: 'desktop' },
        { x: 'Tablet', y: 12 }, // no id → not drillable
      ],
    },
  ],
  drilldown: {
    enabled: true,
    series: [
      {
        id: 'mobile',
        name: 'Mobile by OS',
        colors: ['#0D47A1', '#1976D2', '#64B5F6'], // per-level palette
        data: [
          { x: 'iOS', y: 30, drilldown: 'mobile-ios' }, // drills deeper
          { x: 'Android', y: 23 },
          { x: 'Other', y: 2 },
        ],
      },
      {
        id: 'mobile-ios',
        name: 'iOS Versions',
        data: [{ x: 'iOS 17', y: 18 }, { x: 'iOS 16', y: 9 }, { x: 'iOS 15', y: 3 }],
      },
      {
        id: 'desktop',
        name: 'Desktop by OS',
        data: [{ x: 'Windows', y: 20 }, { x: 'macOS', y: 10 }, { x: 'Linux', y: 3 }],
      },
    ],
  },
}

test.describe('drilldown — pie/donut', () => {
  test('clicking a slice drills into its breakdown (and deeper), then back', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.stack || err.message))

    await page.setContent('<div id="chart"></div>')
    await page.addScriptTag({ path: umdPath })
    await page.evaluate((opts) => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), opts)
      return window.chart.render()
    }, DONUT_OPTIONS_DD)
    await page.waitForFunction(
      () => window.chart && window.chart.w.globals.animationEnded === true,
    )

    const legend = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('.apexcharts-legend-text')).map((e) => e.textContent),
      )

    // Three slices; the two carrying a drilldown id are marked drillable.
    expect(await page.locator('.apexcharts-pie-area').count()).toBe(3)
    expect(await page.locator('.apexcharts-drilldown-target').count()).toBe(2)
    expect(await legend()).toEqual(['Mobile', 'Desktop', 'Tablet'])

    // Drill into Mobile (slice j=0) via a mousedown on the arc path.
    await page.locator('.apexcharts-pie-area[j="0"]').first().dispatchEvent('mousedown')
    await page.waitForFunction(() => window.chart.drilldown.depth === 1, { timeout: 5000 })
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)
    await expect(page.locator('.apexcharts-breadcrumb-current')).toHaveText('Mobile by OS')
    expect(await legend()).toEqual(['iOS', 'Android', 'Other'])
    // Per-level palette applied to the slices.
    expect(await page.evaluate(() => window.chart.w.globals.colors.slice(0, 3))).toEqual([
      '#0D47A1', '#1976D2', '#64B5F6',
    ])

    // Drill deeper into iOS (slice j=0) → iOS Versions (depth 2).
    await page.locator('.apexcharts-pie-area[j="0"]').first().dispatchEvent('mousedown')
    await page.waitForFunction(() => window.chart.drilldown.depth === 2, { timeout: 5000 })
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)
    await expect(page.locator('.apexcharts-breadcrumb-current')).toHaveText('iOS Versions')
    expect(await legend()).toEqual(['iOS 17', 'iOS 16', 'iOS 15'])

    // Breadcrumb back to the root donut: colours and slices restored.
    await page.locator('button.apexcharts-breadcrumb-item').first().click()
    await page.waitForFunction(() => window.chart.drilldown.depth === 0, { timeout: 5000 })
    await page.waitForFunction(() => window.chart.w.globals.animationEnded === true)
    expect(await page.locator('.apexcharts-pie-area').count()).toBe(3)
    expect(await legend()).toEqual(['Mobile', 'Desktop', 'Tablet'])
    expect(await page.evaluate(() => window.chart.w.globals.colors.slice(0, 3))).toEqual([
      '#1565C0', '#2E7D32', '#EF6C00',
    ])
    await expect(page.locator('.apexcharts-breadcrumb')).toHaveCount(0)

    expect(errors, errors.join('\n')).toHaveLength(0)
  })
})
