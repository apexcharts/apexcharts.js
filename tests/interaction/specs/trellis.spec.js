/**
 * Trellis (#22) interaction tests — the P1 exit gates, in a real browser.
 *
 * The two invariants that ARE the feature (plan 22 §9.7, spike 22a):
 *   1. Alignment: every panel has a pixel-identical plot rectangle
 *      (gridWidth / gridHeight / translateX), in shared AND independent scale
 *      modes — including a RAGGED COLUMN fixture, because ragged line panels
 *      align even when the union-x mechanism is broken (22a D6).
 *   2. Shared ticks: identical rendered y-label lists under a shared scale.
 *
 * Plus the inherited group behaviour (crosshair sweep, panel-scoped tooltip,
 * zoom sync asserted on RENDERED labels), the trellis-owned relayout, and
 * registry hygiene on destroy.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const umdPath = resolve(rootDir, 'dist', 'apexcharts.js')

/** Deterministic daily walk, magnitude-scaled; `n` points from 2025-01-01. */
const WALK_SRC = `
  function walk(seed, n, mag) {
    function mulberry32(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;var t=Math.imul(a^a>>>15,1|a);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296}}
    var r = mulberry32(seed), v = 2.5, d = [], ts = Date.UTC(2025, 0, 1)
    for (var i = 0; i < n; i++) {
      v += (r() - 0.5) * 0.8
      if (v < 0.5) v = 0.5
      d.push([ts, Math.round(v * mag * 100) / 100])
      ts += 86400000
    }
    return d
  }
`

async function mountTrellis(page, buildOptsSrc, { width = 1200 } = {}) {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))

  await page.setContent(
    `<div id="stage" style="width:${width}px"><div id="trellis"></div></div>`,
  )
  await page.addScriptTag({ path: umdPath })
  await page.evaluate(
    ([walkSrc, optsSrc]) => {
       
      eval(walkSrc)
       
      const opts = eval(`(${optsSrc})`)
      window.chart = new window.ApexCharts(
        document.querySelector('#trellis'),
        opts,
      )
      return window.chart.render()
    },
    [WALK_SRC, buildOptsSrc],
  )
  // Ready = every panel's own animationEnded, or the HOST flag the trellis
  // sets at eager-render end (after all panels mounted). The host flag is the
  // documented readiness signal and covers heatmap panels, which never flip
  // their own flag when animations are disabled (pre-existing core quirk).
  await page.waitForFunction(
    () =>
      window.chart &&
      window.chart.getPanels().length > 0 &&
      (window.chart.w.globals.animationEnded === true ||
        window.chart
          .getPanels()
          .every((p) => p.chart && p.chart.w.globals.animationEnded === true)),
    { timeout: 10_000 },
  )
  return errors
}

/** Per-panel geometry + rendered y-label text, read off the live instances. */
function readPanels(page) {
  return page.evaluate(() =>
    window.chart.getPanels().map((p) => {
      const g = p.chart.w.globals
      return {
        key: p.key,
        gridWidth: +g.gridWidth.toFixed(2),
        gridHeight: +g.gridHeight.toFixed(2),
        translateX: +g.translateX.toFixed(2),
        yLabels: Array.from(
          p.el.querySelectorAll('.apexcharts-yaxis-label'),
          (n) => n.textContent,
        ),
        xLabels: Array.from(
          p.el.querySelectorAll('.apexcharts-xaxis-label'),
          (n) => n.textContent,
        ),
      }
    }),
  )
}

function expectAligned(panels) {
  const first = panels[0]
  for (const p of panels) {
    expect(p.gridWidth, `gridWidth of ${p.key}`).toBe(first.gridWidth)
    expect(p.gridHeight, `gridHeight of ${p.key}`).toBe(first.gridHeight)
    expect(p.translateX, `translateX of ${p.key}`).toBe(first.translateX)
  }
}

test.describe('trellis', () => {
  test('alignment + shared ticks: ragged COLUMN panels (22a D5/D6)', async ({
    page,
  }) => {
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'bar', height: 480, animations: { enabled: false } },
        trellis: { by: 'region', columns: 3 },
        series: [
          { name: 'Units', region: 'North', data: walk(7, 40, 1) },
          { name: 'Units', region: 'South', data: walk(8, 12, 1000) },
          { name: 'Units', region: 'East',  data: walk(9, 40, 1000000) },
        ],
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
      }`,
    )
    const panels = await readPanels(page)
    expect(panels).toHaveLength(3)
    // The alignment invariant: THE feature. A ragged 12-point column panel
    // between 40-point neighbours, magnitudes 1 vs 1e6 — same plot rect.
    expectAligned(panels)
    // Shared scale => identical rendered tick labels in every panel.
    expect(panels[0].yLabels.length).toBeGreaterThan(1)
    for (const p of panels) {
      expect(p.yLabels, `yLabels of ${p.key}`).toEqual(panels[0].yLabels)
    }
    expect(errors).toHaveLength(0)
  })

  test('alignment in INDEPENDENT y mode: the gutter pass converges', async ({
    page,
  }) => {
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'line', height: 420, animations: { enabled: false } },
        trellis: { by: 'k', columns: 4, scales: { y: 'independent' } },
        series: [
          { name: 's', k: 'a', data: walk(7, 40, 1) },
          { name: 's', k: 'b', data: walk(8, 40, 1000) },
          { name: 's', k: 'c', data: walk(9, 40, 1000000) },
          { name: 's', k: 'd', data: walk(10, 40, 0.001) },
        ],
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
      }`,
    )
    const panels = await readPanels(page)
    expect(panels).toHaveLength(4)
    expectAligned(panels)
    // Independent domains: the labels must NOT all agree (that would mean the
    // scale silently shared) — but the geometry above already did.
    const allSame = panels.every(
      (p) => JSON.stringify(p.yLabels) === JSON.stringify(panels[0].yLabels),
    )
    expect(allSame).toBe(false)
    // The measurement pass is done: the wrap is visible.
    await expect(page.locator('.apexcharts-trellis')).toBeVisible()
    expect(errors).toHaveLength(0)
  })

  test('compact panel chrome: the plot fills the panel, few y labels', async ({
    page,
  }) => {
    // The standalone chart's breathing room (no-title gutter, bottom slack)
    // is dead space inside a small panel: the reclaim in
    // _assemblePanelOptions must leave the plot MOST of the panel height,
    // and the shared scale must not cram more than ~4 labels into it
    // (the 7-label / 44%-plot regression this test pins).
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'area', height: 300, animations: { enabled: false } },
        trellis: { by: 'k', columns: 2, panelHeight: 120 },
        series: [
          { name: 's', k: 'a', data: walk(5, 60, 20000) },
          { name: 's', k: 'b', data: walk(6, 60, 8000) },
          { name: 's', k: 'c', data: walk(7, 60, 3000) },
          { name: 's', k: 'd', data: walk(8, 60, 400) },
        ],
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
      }`,
    )
    const geom = await page.evaluate(() =>
      window.chart.getPanels().map((p) => {
        const g = p.chart.w.globals
        const svgRect = p.el
          .querySelector('svg.apexcharts-svg')
          .getBoundingClientRect()
        // Deepest x-label INK vs the svg's clip edge: timescale labels draw
        // deeper than the category path, and an over-eager bottom reclaim
        // CROPS them (a real regression: dates lost their bottom half).
        const xBottoms = Array.from(
          p.el.querySelectorAll('.apexcharts-xaxis-label'),
          (n) => n.getBoundingClientRect().bottom,
        )
        return {
          key: p.key,
          translateY: g.translateY,
          plotShare: g.gridHeight / svgRect.height,
          yLabelCount: p.el.querySelectorAll('.apexcharts-yaxis-label').length,
          xLabelClearance: xBottoms.length
            ? svgRect.bottom - Math.max(...xBottoms)
            : null,
        }
      }),
    )
    for (const p of geom) {
      // Top air above the first gridline: was 35px of a 120px panel.
      expect(p.translateY, `translateY of ${p.key}`).toBeLessThanOrEqual(10)
      // The plot rectangle owns most of the panel: was 44%. (Datetime keeps
      // a little more bottom slack than category: its labels sit deeper.)
      expect(p.plotShare, `plot share of ${p.key}`).toBeGreaterThanOrEqual(0.65)
      // Default targetTicks 3: at most ~4-5 labels, never the crammed 7.
      expect(p.yLabelCount, `y labels of ${p.key}`).toBeLessThanOrEqual(5)
      expect(p.yLabelCount, `y labels of ${p.key}`).toBeGreaterThanOrEqual(2)
      // No cropped x labels: every glyph fully inside the svg.
      if (p.xLabelClearance !== null) {
        expect(
          p.xLabelClearance,
          `x-label clearance of ${p.key}`,
        ).toBeGreaterThanOrEqual(1)
      }
    }
    expect(errors).toHaveLength(0)
  })

  test('crosshair sweeps every panel; tooltip stays in the hovered panel', async ({
    page,
  }) => {
    // A 2-ROW grid, hovering a NON-corner cell: the native group fan-out only
    // reaches the hovered COLUMN (D7), so 4 of the 6 panels depend on the
    // trellis mirror. Asserted at REST (400ms after the last move): the
    // group's tooltip pipeline clears sibling crosshairs asynchronously, so a
    // transient flash during movement must not pass this test.
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'line', height: 560, animations: { enabled: false } },
        trellis: { by: 'k', columns: 3 },
        series: [
          { name: 's', k: 'a', data: walk(7, 30, 10) },
          { name: 's', k: 'b', data: walk(8, 30, 10) },
          { name: 's', k: 'c', data: walk(9, 30, 10) },
          { name: 's', k: 'd', data: walk(10, 30, 10) },
          { name: 's', k: 'e', data: walk(11, 30, 10) },
          { name: 's', k: 'f', data: walk(12, 30, 10) },
        ],
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
        tooltip: { enabled: true },
      }`,
    )
    const cell0 = page.locator('.apexcharts-trellis-cell').first()
    const box = await cell0.boundingBox()
    // Sweep across the first panel to activate the group tooltip path.
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.6)
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6, {
      steps: 5,
    })
    // Every panel's x-crosshair is active AT REST, at the SAME plot x.
    await page.waitForTimeout(400)
    const rest = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('.apexcharts-trellis-cell'),
        (cell) => {
          const x = cell.querySelector('.apexcharts-xcrosshairs')
          return {
            active: !!x && x.classList.contains('apexcharts-active'),
            x: x ? +(+x.getAttribute('x1')).toFixed(2) : null,
          }
        },
      ),
    )
    expect(rest).toHaveLength(6)
    for (const r of rest) {
      expect(r.active).toBe(true)
      expect(r.x).toBe(rest[0].x)
    }
    // tooltip: 'panel' (default): the hovered cell shows its card...
    const hoveredTip = page.locator(
      '.apexcharts-trellis-cell:nth-child(1) .apexcharts-tooltip',
    )
    await expect(hoveredTip).toHaveClass(/apexcharts-active/)
    expect(
      await hoveredTip.evaluate((n) => getComputedStyle(n).opacity),
    ).not.toBe('0')
    // ...while a sibling cell's card is CSS-suppressed even though the group
    // drew it (its active class may be present; its ink may not).
    expect(
      await page
        .locator('.apexcharts-trellis-cell:nth-child(3) .apexcharts-tooltip')
        .evaluate((n) => getComputedStyle(n).opacity),
    ).toBe('0')
    expect(errors).toHaveLength(0)
  })

  test('zoom in one panel moves every panel (rendered labels), reset restores', async ({
    page,
  }) => {
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'line', height: 420, animations: { enabled: false } },
        trellis: { by: 'k', columns: 3 },
        series: [
          { name: 's', k: 'a', data: walk(7, 60, 10) },
          { name: 's', k: 'b', data: walk(8, 60, 10) },
          { name: 's', k: 'c', data: walk(9, 60, 10) },
        ],
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
      }`,
    )
    const before = await readPanels(page)
    expect(before[0].xLabels.length).toBeGreaterThan(1)

    // Drag a zoom selection across the middle of panel 0.
    const cell0 = page.locator('.apexcharts-trellis-cell').first()
    const box = await cell0.boundingBox()
    const y = box.y + box.height * 0.5
    await page.mouse.move(box.x + box.width * 0.3, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.7, y, { steps: 8 })
    await page.mouse.up()

    // Assert on RENDERED labels, not minX/maxX (the resetSeries lesson): all
    // panels changed, and identically.
    await page.waitForFunction(
      (prev) => {
        const cur = Array.from(
          document.querySelectorAll(
            '.apexcharts-trellis-cell:nth-child(1) .apexcharts-xaxis-label',
          ),
          (n) => n.textContent,
        )
        return JSON.stringify(cur) !== JSON.stringify(prev)
      },
      before[0].xLabels,
      { timeout: 5_000 },
    )
    const zoomed = await readPanels(page)
    for (const p of zoomed) {
      expect(p.xLabels).toEqual(zoomed[0].xLabels)
    }
    expectAligned(zoomed)

    // The shared toolbar reset restores the full domain everywhere.
    await page.locator('.apexcharts-trellis-tool-reset').click()
    await page.waitForFunction(
      (prev) => {
        const cur = Array.from(
          document.querySelectorAll(
            '.apexcharts-trellis-cell:nth-child(1) .apexcharts-xaxis-label',
          ),
          (n) => n.textContent,
        )
        return JSON.stringify(cur) === JSON.stringify(prev)
      },
      before[0].xLabels,
      { timeout: 5_000 },
    )
    const reset = await readPanels(page)
    for (const p of reset) {
      expect(p.xLabels).toEqual(before[0].xLabels)
    }
    expect(errors).toHaveLength(0)
  })

  test('container resize recolumns without re-creating panels', async ({
    page,
  }) => {
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'line', height: 420, animations: { enabled: false } },
        trellis: { by: 'k', minPanelWidth: 220 },
        series: [
          { name: 's', k: 'a', data: walk(7, 20, 10) },
          { name: 's', k: 'b', data: walk(8, 20, 10) },
          { name: 's', k: 'c', data: walk(9, 20, 10) },
          { name: 's', k: 'd', data: walk(10, 20, 10) },
          { name: 's', k: 'e', data: walk(11, 20, 10) },
          { name: 's', k: 'f', data: walk(12, 20, 10) },
        ],
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
      }`,
      { width: 1200 },
    )
    const idsBefore = await page.evaluate(() =>
      window.chart.getPanels().map((p) => p.chart.w.globals.cuid),
    )
    const colsAt = () =>
      page.evaluate(
        () =>
          getComputedStyle(
            document.querySelector('.apexcharts-trellis-grid'),
          ).gridTemplateColumns.split(' ').length,
      )
    expect(await colsAt()).toBe(5) // 1200px / 220 min

    await page.evaluate(() => {
      document.getElementById('stage').style.width = '700px'
    })
    await page.waitForFunction(
      () =>
        getComputedStyle(
          document.querySelector('.apexcharts-trellis-grid'),
        ).gridTemplateColumns.split(' ').length === 3,
      { timeout: 5_000 },
    )
    const idsAfter = await page.evaluate(() =>
      window.chart.getPanels().map((p) => p.chart.w.globals.cuid),
    )
    // Same instances: relayout is coordination, never re-creation.
    expect(idsAfter).toEqual(idsBefore)
    // Panels re-measured their new width and still agree.
    const panels = await readPanels(page)
    expectAligned(panels)
    expect(errors).toHaveLength(0)
  })

  test('destroy() empties Apex._chartInstances and the DOM', async ({
    page,
  }) => {
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'line', height: 420, animations: { enabled: false } },
        trellis: { by: 'k', columns: 2 },
        series: [
          { name: 's', k: 'a', data: walk(7, 10, 10) },
          { name: 's', k: 'b', data: walk(8, 10, 10) },
        ],
        xaxis: { type: 'datetime' },
      }`,
    )
    expect(
      await page.evaluate(() => window.Apex._chartInstances.length),
    ).toBe(2)
    await page.evaluate(() => window.chart.destroy())
    expect(
      await page.evaluate(() => window.Apex._chartInstances.length),
    ).toBe(0)
    expect(await page.locator('.apexcharts-trellis').count()).toBe(0)
    expect(errors).toHaveLength(0)
  })
})

/**
 * P2 exit gates: a 200-panel trellis virtualizes (auto, above the 64-panel
 * budget). Scrolling stays inside the frame budget, offscreen panels are
 * PROVABLY unmounted (their cells hold skeletons, not charts), page height
 * never shifts, and a zoom survives unmount/remount and reaches panels that
 * mount long after the gesture.
 */
test.describe('trellis virtualization (P2)', () => {
  const GRID_200 = `{
    chart: { type: 'line', animations: { enabled: false } },
    trellis: { by: 'k', columns: 4, panelHeight: 160 },
    series: (function () {
      var s = []
      for (var i = 0; i < 200; i++) {
        s.push({ name: 'M', k: 'P' + i, data: walk(i + 7, 12, 10) })
      }
      return s
    })(),
    xaxis: { type: 'datetime' },
    dataLabels: { enabled: false },
  }`

  /** Mount a VIRTUALIZED trellis: render() resolves with skeletons, so wait
   *  for the observer's initial batch instead of for every panel. */
  async function mountVirtual(page, buildOptsSrc, { width = 1200 } = {}) {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.setContent(
      `<div id="stage" style="width:${width}px"><div id="trellis"></div></div>`,
    )
    await page.addScriptTag({ path: umdPath })
    await page.evaluate(
      ([walkSrc, optsSrc]) => {
         
        eval(walkSrc)
         
        const opts = eval(`(${optsSrc})`)
        window.chart = new window.ApexCharts(
          document.querySelector('#trellis'),
          opts,
        )
        return window.chart.render()
      },
      [WALK_SRC, buildOptsSrc],
    )
    await page.waitForFunction(
      () =>
        window.chart &&
        window.chart.getPanels().length > 0 &&
        window.chart
          .getPanels()
          .some((p) => p.chart && p.chart.w.globals.animationEnded === true),
      { timeout: 10_000 },
    )
    return errors
  }

  /** Wait until the mounted-panel count has been stable for ~400ms. */
  async function waitMountsSettled(page) {
    await page.evaluate(() => {
      window.__lastCount = undefined
      window.__lastCountTs = undefined
    })
    await page.waitForFunction(
      () => {
        const count = window.chart.getPanels().filter((p) => p.chart).length
        if (window.__lastCount !== count) {
          window.__lastCount = count
          window.__lastCountTs = performance.now()
          return false
        }
        return performance.now() - window.__lastCountTs > 400
      },
      { timeout: 15_000, polling: 100 },
    )
  }

  const mountedCount = (page) =>
    page.evaluate(() => window.chart.getPanels().filter((p) => p.chart).length)

  const cellLabels = (page, nth) =>
    page.evaluate(
      (n) =>
        Array.from(
          document.querySelectorAll(
            `.apexcharts-trellis-cell:nth-child(${n}) .apexcharts-xaxis-label`,
          ),
          (el) => el.textContent,
        ),
      nth,
    )

  test('200 panels: bounded mounts, height-stable, frame budget held while scrolling', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const errors = await mountVirtual(page, GRID_200)

    // The scaffold is complete up front: every cell and header exists.
    expect(await page.locator('.apexcharts-trellis-cell').count()).toBe(200)
    expect(await page.locator('.apexcharts-trellis-header').count()).toBe(200)
    await waitMountsSettled(page)

    const heightBefore = await page.evaluate(() => document.body.scrollHeight)
    const mountedAtTop = await mountedCount(page)
    expect(mountedAtTop).toBeGreaterThan(0)
    expect(mountedAtTop).toBeLessThanOrEqual(40)
    // A far-away cell is a skeleton, not a chart.
    expect(
      await page
        .locator('.apexcharts-trellis-cell:nth-child(150) .apexcharts-canvas')
        .count(),
    ).toBe(0)
    expect(
      await page
        .locator(
          '.apexcharts-trellis-cell:nth-child(150) .apexcharts-trellis-skeleton',
        )
        .count(),
    ).toBe(1)

    // Sweep to the bottom, one 200px step per frame, sampling frame deltas.
    const sweep = await page.evaluate(
      () =>
        new Promise((resolveDone) => {
          const deltas = []
          let last = performance.now()
          function tick() {
            const now = performance.now()
            deltas.push(now - last)
            last = now
            const max = document.body.scrollHeight - window.innerHeight
            if (window.scrollY < max) {
              window.scrollTo(0, Math.min(window.scrollY + 200, max))
              requestAnimationFrame(tick)
            } else {
              resolveDone({
                maxDelta: Math.max(...deltas.slice(1)),
                frames: deltas.length,
              })
            }
          }
          requestAnimationFrame(tick)
        }),
    )
    expect(sweep.frames).toBeGreaterThan(10)
    // Mount batches may cost a frame; a lockup (mounting dozens of charts
    // synchronously) costs seconds. The budget catches the latter.
    expect(sweep.maxDelta).toBeLessThan(250)

    await waitMountsSettled(page)
    // Offscreen panels are PROVABLY unmounted: the first cell holds a
    // skeleton again, while the bottom row is mounted.
    expect(
      await page
        .locator('.apexcharts-trellis-cell:nth-child(1) .apexcharts-canvas')
        .count(),
    ).toBe(0)
    expect(
      await page
        .locator('.apexcharts-trellis-cell:nth-child(200) .apexcharts-canvas')
        .count(),
    ).toBe(1)
    expect(await mountedCount(page)).toBeLessThanOrEqual(40)
    // Page height never shifts: skeletons reserve exactly the panel height.
    const heightAfter = await page.evaluate(() => document.body.scrollHeight)
    expect(Math.abs(heightAfter - heightBefore)).toBeLessThanOrEqual(2)
    expect(errors).toHaveLength(0)
  })

  test('200 panels: a zoom survives unmount and reaches late-mounted panels', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const errors = await mountVirtual(page, GRID_200)
    await waitMountsSettled(page)

    const before = await cellLabels(page, 1)
    expect(before.length).toBeGreaterThan(0)

    // Drag a zoom selection across panel 0.
    const cell0 = page.locator('.apexcharts-trellis-cell').first()
    const box = await cell0.boundingBox()
    const y = box.y + box.height * 0.55
    await page.mouse.move(box.x + box.width * 0.3, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.7, y, { steps: 8 })
    await page.mouse.up()
    await page.waitForFunction(
      (prev) => {
        const cur = Array.from(
          document.querySelectorAll(
            '.apexcharts-trellis-cell:nth-child(1) .apexcharts-xaxis-label',
          ),
          (n) => n.textContent,
        )
        return cur.length > 0 && JSON.stringify(cur) !== JSON.stringify(prev)
      },
      before,
      { timeout: 5_000 },
    )
    const zoomed = await cellLabels(page, 1)

    // To the bottom: panel 0 unmounts, and the bottom row mounts ALREADY
    // zoomed (live-sibling overlay) even though it never saw the gesture.
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight),
    )
    await page.waitForFunction(
      () =>
        !document.querySelector(
          '.apexcharts-trellis-cell:nth-child(1) .apexcharts-canvas',
        ),
      { timeout: 10_000 },
    )
    await waitMountsSettled(page)
    expect(await cellLabels(page, 200)).toEqual(zoomed)

    // And back: panel 0 remounts with its zoom window restored.
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForFunction(
      () =>
        !!document.querySelector(
          '.apexcharts-trellis-cell:nth-child(1) .apexcharts-canvas',
        ),
      { timeout: 10_000 },
    )
    await waitMountsSettled(page)
    expect(await cellLabels(page, 1)).toEqual(zoomed)
    expect(
      await page.evaluate(
        () => window.chart.getPanel('P0').w.interact.zoomed,
      ),
    ).toBe(true)
    expect(errors).toHaveLength(0)
  })
})

/**
 * P3 exit gates: the grid reads as ONE chart.
 *   - tooltip: 'grid': hovering any panel yields exactly one card with one
 *     row per panel (per-panel tooltip ink suppressed), asserted at rest.
 *   - one scope-free annotation declaration projects into EVERY panel through
 *     each panel's own scale (positions differ under independent y).
 *   - dataURI() returns one PNG of the whole grid.
 *   - a header click promotes the panel to full grid width; the breadcrumb
 *     restores.
 */
test.describe('trellis P3 (one chart)', () => {
  const GRID6 = (extraTrellis = '', extraOptions = '') => `{
    chart: { type: 'line', height: 560, animations: { enabled: false } },
    trellis: { by: 'k', columns: 3${extraTrellis} },
    series: [
      { name: 's', k: 'a', data: walk(7, 30, 10) },
      { name: 's', k: 'b', data: walk(8, 30, 10) },
      { name: 's', k: 'c', data: walk(9, 30, 10) },
      { name: 's', k: 'd', data: walk(10, 30, 10) },
      { name: 's', k: 'e', data: walk(11, 30, 10) },
      { name: 's', k: 'f', data: walk(12, 30, 10) },
    ],
    xaxis: { type: 'datetime' },
    dataLabels: { enabled: false },
    tooltip: { enabled: true }${extraOptions}
  }`

  test("tooltip: 'grid' shows ONE card with one row per panel, at rest", async ({
    page,
  }) => {
    const errors = await mountTrellis(
      page,
      GRID6(`, tooltip: 'grid'`),
    )
    const cell0 = page.locator('.apexcharts-trellis-cell').first()
    const box = await cell0.boundingBox()
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.6)
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.6, {
      steps: 5,
    })
    await page.waitForTimeout(400)

    const card = page.locator('.apexcharts-trellis-tooltip')
    await expect(card).toHaveCount(1)
    await expect(card).toHaveClass(/apexcharts-trellis-tooltip-active/)
    const rows = page.locator('.apexcharts-trellis-tooltip-row')
    await expect(rows).toHaveCount(6)
    // The hovered panel's row is marked.
    await expect(
      page.locator(
        '.apexcharts-trellis-tooltip-row-active[data-key="a"]',
      ),
    ).toHaveCount(1)
    // Every per-panel tooltip's ink is suppressed, including the hovered one.
    const opacities = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          '.apexcharts-trellis-cell .apexcharts-tooltip',
        ),
        (n) => getComputedStyle(n).opacity,
      ),
    )
    expect(opacities.every((o) => o === '0')).toBe(true)
    // Rows carry the panels' own formatted values (marker + number).
    const firstRow = await rows.first().innerText()
    expect(firstRow.length).toBeGreaterThan(1)
    expect(errors).toHaveLength(0)
  })

  test('one annotation declaration projects into every panel, per panel scale', async ({
    page,
  }) => {
    // Explicit domains built to CONTAIN the band everywhere (an annotation
    // outside a panel's y-domain is culled entirely, so a fixture must earn
    // its N-panels claim): a spans ~1..4, b ~2..9, c ~1.5..4.5; the band
    // 2.5..3.0 is inside all three, at a different relative position in
    // each. The scoped line y=5 is inside b only, by scope AND by domain.
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'line', height: 420, animations: { enabled: false } },
        trellis: { by: 'k', columns: 3, scales: { y: 'independent' } },
        series: [
          { name: 's', k: 'a', data: [[Date.UTC(2025,0,1), 1], [Date.UTC(2025,0,2), 2], [Date.UTC(2025,0,3), 4]] },
          { name: 's', k: 'b', data: [[Date.UTC(2025,0,1), 2], [Date.UTC(2025,0,2), 5], [Date.UTC(2025,0,3), 9]] },
          { name: 's', k: 'c', data: [[Date.UTC(2025,0,1), 1.5], [Date.UTC(2025,0,2), 3], [Date.UTC(2025,0,3), 4.5]] },
        ],
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
        annotations: {
          yaxis: [
            { y: 2.5, y2: 3.0, fillColor: '#16A34A', opacity: 0.15 },
            { y: 5, scope: 'b', borderColor: '#DC2626' },
          ],
        },
      }`,
    )
    // The unscoped band is drawn once per panel (3 band rects)...
    const bands = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('.apexcharts-trellis-cell'),
        (cell) =>
          Array.from(
            cell.querySelectorAll(
              '.apexcharts-yaxis-annotations .apexcharts-annotation-rect',
            ),
            (r) => +(+r.getAttribute('y')).toFixed(1),
          ),
      ),
    )
    expect(bands.map((b) => b.length)).toEqual([1, 1, 1])
    // ...projected through each panel's OWN scale: the same 2.6..3.0 band
    // lands at different plot positions in magnitude-1 vs magnitude-2 panels.
    expect(bands[0][0]).not.toBe(bands[1][0])
    // The scoped line lands only in panel b.
    const lines = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll('.apexcharts-trellis-cell'),
        (cell) => cell.querySelectorAll('.apexcharts-yaxis-annotations line')
          .length,
      ),
    )
    expect(lines).toEqual([0, 1, 0])
    expect(errors).toHaveLength(0)
  })

  test('dataURI() composes ONE image of the whole grid', async ({ page }) => {
    const errors = await mountTrellis(page, GRID6())
    const result = await page.evaluate(async () => {
      const { imgURI } = await window.chart.dataURI()
      const img = new Image()
      await new Promise((resolveLoad, rejectLoad) => {
        img.onload = resolveLoad
        img.onerror = rejectLoad
        img.src = imgURI
      })
      const wrap = document.querySelector('.apexcharts-trellis')
      const rect = wrap.getBoundingClientRect()
      return {
        prefix: imgURI.slice(0, 22),
        w: img.naturalWidth,
        h: img.naturalHeight,
        wrapW: Math.ceil(rect.width),
        wrapH: Math.ceil(rect.height),
        len: imgURI.length,
      }
    })
    expect(result.prefix).toBe('data:image/png;base64,')
    expect(result.w).toBe(result.wrapW)
    expect(result.h).toBe(result.wrapH)
    // A composed grid is not a blank canvas.
    expect(result.len).toBeGreaterThan(20000)
    expect(errors).toHaveLength(0)
  })

  test('header click promotes the panel full-width; breadcrumb restores', async ({
    page,
  }) => {
    const errors = await mountTrellis(page, GRID6())
    const gridW = await page.evaluate(
      () =>
        document
          .querySelector('.apexcharts-trellis-grid')
          .getBoundingClientRect().width,
    )
    const widthBefore = await page.evaluate(
      () =>
        document
          .querySelectorAll('.apexcharts-trellis-cell')[2]
          .getBoundingClientRect().width,
    )

    await page.locator('.apexcharts-trellis-header').nth(2).click()
    await page.waitForFunction(
      () =>
        document.querySelectorAll('.apexcharts-trellis-cell-parked').length ===
        5,
      { timeout: 5_000 },
    )
    const promotedW = await page.evaluate(
      () =>
        document
          .querySelector('.apexcharts-trellis-cell-promoted')
          .getBoundingClientRect().width,
    )
    expect(Math.abs(promotedW - gridW)).toBeLessThanOrEqual(2)
    // The chart inside re-measured to the promoted width.
    await page.waitForFunction(
      (want) => {
        const p = window.chart.getPanel('c')
        return p && Math.abs(p.w.globals.svgWidth - want) < 8
      },
      gridW,
      { timeout: 5_000 },
    )
    await expect(page.locator('.apexcharts-trellis-breadcrumb')).toHaveCount(1)

    await page.locator('.apexcharts-trellis-breadcrumb-back').click()
    await page.waitForFunction(
      () =>
        document.querySelectorAll('.apexcharts-trellis-cell-parked').length ===
        0,
      { timeout: 5_000 },
    )
    const widthAfter = await page.evaluate(
      () =>
        document
          .querySelectorAll('.apexcharts-trellis-cell')[2]
          .getBoundingClientRect().width,
    )
    expect(Math.abs(widthAfter - widthBefore)).toBeLessThanOrEqual(2)
    // Geometry re-derived: the grid still satisfies the alignment invariant.
    const panels = await readPanels(page)
    expectAligned(panels)
    expect(errors).toHaveLength(0)
  })
})

/**
 * P4 exit gates: two-dimensional faceting.
 *   - a 2-D grid with a MISSING combination keeps every panel pixel-aligned
 *     in 'placeholder' mode (the placeholder is a real panel on the same
 *     scales), on a COLUMN fixture (the strict geometry, 22a D6).
 *   - independent-row produces IDENTICAL rendered ticks along a row and
 *     DIFFERENT ticks across rows, with the grid still pixel-aligned.
 */
test.describe('trellis 2-D (P4)', () => {
  test("missing combination stays pixel-aligned in 'placeholder' mode", async ({
    page,
  }) => {
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'bar', height: 460, animations: { enabled: false } },
        trellis: { row: 'dept', column: 'quarter' },
        series: [
          { name: 'Hours', dept: 'Sales',   quarter: 'Q1', data: walk(7, 12, 10) },
          { name: 'Hours', dept: 'Sales',   quarter: 'Q2', data: walk(8, 12, 10) },
          { name: 'Hours', dept: 'Sales',   quarter: 'Q3', data: walk(9, 12, 10) },
          { name: 'Hours', dept: 'Support', quarter: 'Q1', data: walk(10, 12, 10) },
          { name: 'Hours', dept: 'Support', quarter: 'Q3', data: walk(11, 12, 10) },
        ],
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
      }`,
    )
    const panels = await readPanels(page)
    expect(panels).toHaveLength(6)
    expect(panels.map((p) => p.key)).toEqual([
      'Sales / Q1',
      'Sales / Q2',
      'Sales / Q3',
      'Support / Q1',
      'Support / Q2',
      'Support / Q3',
    ])
    // THE gate: the placeholder for (Support, Q2) has the identical plot
    // rectangle, on a column-geometry fixture.
    expectAligned(panels)
    // Same rendered ticks everywhere (shared scale includes the placeholder).
    for (const p of panels) {
      expect(p.yLabels, `yLabels of ${p.key}`).toEqual(panels[0].yLabels)
    }
    // The placeholder carries its quiet label; strips drew once per key.
    await expect(page.locator('.apexcharts-trellis-empty-label')).toHaveCount(1)
    await expect(page.locator('.apexcharts-trellis-strip-column')).toHaveCount(3)
    await expect(page.locator('.apexcharts-trellis-strip-row')).toHaveCount(2)
    expect(errors).toHaveLength(0)
  })

  test('independent-row: identical ticks along a row, different across rows', async ({
    page,
  }) => {
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'line', height: 460, animations: { enabled: false } },
        trellis: { row: 'metric', column: 'unit', scales: { y: 'independent-row' } },
        series: [
          { name: 'v', metric: 'Revenue',   unit: 'East', data: walk(7, 20, 1000000) },
          { name: 'v', metric: 'Revenue',   unit: 'West', data: walk(8, 20, 1000000) },
          { name: 'v', metric: 'Headcount', unit: 'East', data: walk(9, 20, 10) },
          { name: 'v', metric: 'Headcount', unit: 'West', data: walk(10, 20, 10) },
        ],
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
      }`,
    )
    const panels = await readPanels(page)
    expect(panels).toHaveLength(4)
    // Identical rendered ticks ALONG each row...
    expect(panels[0].yLabels).toEqual(panels[1].yLabels)
    expect(panels[2].yLabels).toEqual(panels[3].yLabels)
    expect(panels[0].yLabels.length).toBeGreaterThan(1)
    // ...different ACROSS rows (magnitude 1e6 vs 10)...
    expect(panels[0].yLabels).not.toEqual(panels[2].yLabels)
    // ...and the grid is still pixel-aligned (the cross-group gutter pass).
    expectAligned(panels)
    expect(errors).toHaveLength(0)
  })
})

/**
 * P5 exit gates: the type guardrails, at the pixel.
 *   - histogram: one shared bin frame means every panel renders its bars at
 *     IDENTICAL x positions (different samples, same edges).
 *   - heatmap: one shared color scale means the same value paints the same
 *     fill in every panel, under ONE shared gradient strip.
 */
test.describe('trellis type guardrails (P5)', () => {
  test('histogram: shared bin edges render identical bar geometry', async ({
    page,
  }) => {
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'histogram', height: 420, animations: { enabled: false } },
        trellis: { by: 'k', columns: 3 },
        series: [
          { name: 'd', k: 'a', data: Array.from({length: 80}, (_, i) => 10 + ((i * 37) % 250) / 10) },
          { name: 'd', k: 'b', data: Array.from({length: 80}, (_, i) => 25 + ((i * 53) % 250) / 10) },
          { name: 'd', k: 'c', data: Array.from({length: 80}, (_, i) => 18 + ((i * 71) % 250) / 10) },
        ],
        dataLabels: { enabled: false },
      }`,
    )
    const geom = await page.evaluate(() =>
      window.chart.getPanels().map((p) => ({
        key: p.key,
        // A shared bin frame = identical bar x layout in every panel.
        barX: Array.from(
          p.el.querySelectorAll('.apexcharts-bar-area'),
          (b) => Math.round(Number(b.getAttribute('barWidth') || 0)),
        ),
        edges: p.chart.w.histogramData.edges.map((e) => +e.toFixed(6)),
        yLabels: Array.from(
          p.el.querySelectorAll('.apexcharts-yaxis-label'),
          (n) => n.textContent,
        ),
      })),
    )
    expect(geom).toHaveLength(3)
    for (const p of geom) {
      expect(p.edges, `edges of ${p.key}`).toEqual(geom[0].edges)
      expect(p.barX.length, `bar count of ${p.key}`).toBe(geom[0].barX.length)
      expect(p.barX, `bar widths of ${p.key}`).toEqual(geom[0].barX)
      // Shared COUNT domain: identical rendered y labels, starting at 0.
      expect(p.yLabels, `yLabels of ${p.key}`).toEqual(geom[0].yLabels)
    }
    const panels = await readPanels(page)
    expectAligned(panels)
    expect(errors).toHaveLength(0)
  })

  test('heatmap: the same value paints the same fill; ONE gradient strip', async ({
    page,
  }) => {
    // Both panels carry a cell with value 50 but have very different extents:
    // without the shared color frame, 50 would be panel-a's hottest color and
    // panel-b's coldest.
    const errors = await mountTrellis(
      page,
      `{
        chart: { type: 'heatmap', height: 420, animations: { enabled: false } },
        trellis: { by: 'k', columns: 2 },
        series: [
          { name: 'r1', k: 'a', data: [{ x: 'c1', y: 5 }, { x: 'c2', y: 50 }] },
          { name: 'r2', k: 'a', data: [{ x: 'c1', y: 10 }, { x: 'c2', y: 20 }] },
          { name: 'r1', k: 'b', data: [{ x: 'c1', y: 50 }, { x: 'c2', y: 95 }] },
          { name: 'r2', k: 'b', data: [{ x: 'c1', y: 80 }, { x: 'c2', y: 99 }] },
        ],
        dataLabels: { enabled: false },
      }`,
    )
    const out = await page.evaluate(() => {
      const fillOfValue = (panel, value) => {
        const rects = panel.el.querySelectorAll('.apexcharts-heatmap-rect')
        for (const r of rects) {
          if (Number(r.getAttribute('val')) === value) {
            return r.getAttribute('color') || r.getAttribute('fill')
          }
        }
        return null
      }
      const [a, b] = window.chart.getPanels()
      return {
        fillA50: fillOfValue(a, 50),
        fillB50: fillOfValue(b, 50),
        fillA5: fillOfValue(a, 5),
        fillB99: fillOfValue(b, 99),
        strips: document.querySelectorAll(
          '.apexcharts-trellis-gradient-legend svg',
        ).length,
      }
    })
    expect(out.fillA50).toBeTruthy()
    // THE gate: identical value, identical ink, across panels.
    expect(out.fillA50).toBe(out.fillB50)
    // And the scale is not degenerate: the extremes differ from the midpoint.
    expect(out.fillA5).not.toBe(out.fillA50)
    expect(out.fillB99).not.toBe(out.fillB50)
    // One shared strip is the grid's legend.
    expect(out.strips).toBe(1)
    expect(errors).toHaveLength(0)
  })
})
