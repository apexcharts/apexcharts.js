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
      // eslint-disable-next-line no-eval
      eval(walkSrc)
      // eslint-disable-next-line no-eval
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
        .every((p) => p.chart && p.chart.w.globals.animationEnded === true),
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
        // eslint-disable-next-line no-eval
        eval(walkSrc)
        // eslint-disable-next-line no-eval
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
