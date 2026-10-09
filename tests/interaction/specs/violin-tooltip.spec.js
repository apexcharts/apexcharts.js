/**
 * Violin tooltips outside the default shared mode, and on canvas.
 *
 * The shared tooltip (the violin default) hovers the whole plot and resolves
 * the category by x, so it never needed a violin node under the pointer. Two
 * other paths did, and showed nothing:
 *
 *   1. `tooltip: { shared: false, intersect: true }` hovers each mark, and the
 *      hover listeners and the intersect hit test knew bars, candles and box
 *      plots but not violins.
 *   2. On the canvas renderer the bodies are painted, so no node exists to
 *      hover at all. The intersect tooltip now hovers the plot and asks the
 *      renderer which violin is under the pointer; the shared one read coords
 *      cached for the marks, which a violin never re-anchored (the box landed
 *      on the axis base, or at the plot's origin once a jitter path was the
 *      only node left in the series group).
 *
 * The intersect box sits beside the violin, as a box plot's does: left or
 * right of a vertical violin, above or below a horizontal one. On canvas
 * every placement is checked against the same chart drawn as SVG.
 */

import { test, expect } from '../fixtures/base.js'
import { addAddons } from '../helpers/addons.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')

const TOLERANCE_PX = 1
const INTERSECT = { tooltip: { shared: false, intersect: true } }

async function update(page, options) {
  await page.evaluate(async (options) => {
    await window.chart.updateOptions({
      ...options,
      chart: { ...(options.chart || {}), animations: { enabled: false } },
    })
  }, options)
  await page.waitForTimeout(250)
}

/** Load the canvas renderer, which is not in the bundle the samples load. */
async function loadCanvasFeature(page) {
  await page.addScriptTag({
    path: resolve(rootDir, 'dist', 'features', 'renderer-canvas.js'),
  })
}

/**
 * The screen rect of everything violin `j` draws in series 0: body, box lane
 * and jitter. Only measurable while the chart is SVG.
 */
async function glyphRect(page, j) {
  return page.evaluate((j) => {
    const marks = [
      ...document.querySelectorAll(
        `.apexcharts-violin-series .apexcharts-series[data\\:realIndex='0'] :is(.apexcharts-violin-area, .apexcharts-violin-points)[j='${j}']`,
      ),
    ].map((el) => el.getBoundingClientRect())
    const left = Math.min(...marks.map((r) => r.left))
    const top = Math.min(...marks.map((r) => r.top))
    const right = Math.max(...marks.map((r) => r.right))
    const bottom = Math.max(...marks.map((r) => r.bottom))
    return { left, top, right, bottom }
  }, j)
}

/** Centre of violin `j`'s body: on its centre line, so inside the shape. */
async function bodyCentre(page, j) {
  return page.evaluate((j) => {
    const body = document.querySelector(
      `.apexcharts-violin-area:not(.apexcharts-raincloud-box)[j='${j}']`,
    )
    const r = body.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }, j)
}

async function hover(page, { x, y }) {
  await page.mouse.move(x - 3, y - 3)
  await page.mouse.move(x, y)
  await page.waitForTimeout(150)
}

async function readTooltip(page) {
  return page.evaluate(() => {
    const el = document.querySelector(
      '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
    )
    const r = el.getBoundingClientRect()
    const band = document.querySelector('.apexcharts-xcrosshairs')
    const b = band?.getBoundingClientRect()
    return {
      active: el.classList.contains('apexcharts-active'),
      placement: el.dataset.placement || null,
      text: el.textContent,
      left: r.left,
      top: r.top,
      right: r.right,
      bottom: r.bottom,
      dataPointIndex: window.chart.w.interact.capturedDataPointIndex,
      bandCentre: b ? b.left + b.width / 2 : null,
    }
  })
}

async function expectSameSpot(actual, expected) {
  expect(actual.active).toBe(true)
  expect(actual.placement).toBe(expected.placement)
  expect(Math.abs(actual.left - expected.left)).toBeLessThanOrEqual(
    TOLERANCE_PX,
  )
  expect(Math.abs(actual.top - expected.top)).toBeLessThanOrEqual(TOLERANCE_PX)
}

test.describe('Violin: intersect tooltip (shared: false)', () => {
  test('a vertical violin shows its tooltip beside it, the band on it', async ({
    page,
    loadChart,
  }) => {
    await loadChart('violin', 'basic-violin')
    await update(page, INTERSECT)

    const glyph = await glyphRect(page, 2)
    await hover(page, await bodyCentre(page, 2))
    const tt = await readTooltip(page)

    expect(tt.active).toBe(true)
    expect(tt.dataPointIndex).toBe(2)
    expect(['left', 'right']).toContain(tt.placement)
    // beside the violin, not over it
    if (tt.placement === 'right') {
      expect(tt.left).toBeGreaterThanOrEqual(glyph.right)
    } else {
      expect(tt.right).toBeLessThanOrEqual(glyph.left)
    }
    // the crosshair band runs through the violin it captions
    const glyphCentre = (glyph.left + glyph.right) / 2
    expect(Math.abs(tt.bandCentre - glyphCentre)).toBeLessThanOrEqual(1.5)
  })

  test('a horizontal violin shows its tooltip above or below it', async ({
    page,
    loadChart,
  }) => {
    await loadChart('violin', 'horizontal-violin')
    await update(page, INTERSECT)

    const glyph = await glyphRect(page, 1)
    await hover(page, await bodyCentre(page, 1))
    const tt = await readTooltip(page)

    expect(tt.active).toBe(true)
    expect(tt.dataPointIndex).toBe(1)
    expect(['top', 'bottom']).toContain(tt.placement)
    if (tt.placement === 'top') {
      expect(tt.bottom).toBeLessThanOrEqual(glyph.top)
    } else {
      expect(tt.top).toBeGreaterThanOrEqual(glyph.bottom)
    }
  })

  test('a raincloud box clears the rain lane as well as the cloud', async ({
    page,
    loadChart,
  }) => {
    await loadChart('raincloud', 'basic-raincloud')
    await update(page, INTERSECT)

    const rain = await page.evaluate(() =>
      document
        .querySelector(".apexcharts-violin-points[j='1']")
        .getBoundingClientRect()
        .toJSON(),
    )
    await hover(page, await bodyCentre(page, 1))
    const tt = await readTooltip(page)

    expect(tt.active).toBe(true)
    expect(tt.dataPointIndex).toBe(1)
    const overlapsRain =
      tt.left < rain.right &&
      tt.right > rain.left &&
      tt.top < rain.bottom &&
      tt.bottom > rain.top
    expect(overlapsRain).toBe(false)
  })
})

test.describe('Violin: tooltips on the canvas renderer', () => {
  for (const sample of ['basic-violin', 'horizontal-violin']) {
    test(`${sample}: intersect tooltip matches the SVG chart and hides off the violins`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('violin', sample)
      await loadCanvasFeature(page)
      await update(page, INTERSECT)

      const at = await bodyCentre(page, 1)
      const glyph = await glyphRect(page, 1)
      await hover(page, at)
      const svg = await readTooltip(page)
      expect(svg.active).toBe(true)
      await page.mouse.move(5, 5)

      await update(page, { ...INTERSECT, chart: { renderer: 'canvas' } })
      const canvas = await page.evaluate(() => ({
        kind: window.chart.w.globals.activeRenderer?.kind,
        bodies: document.querySelectorAll('.apexcharts-violin-area').length,
      }))
      // Guard the guard: an SVG fallback would pass without covering canvas.
      expect(canvas).toEqual({ kind: 'canvas', bodies: 0 })

      await hover(page, at)
      const tt = await readTooltip(page)
      await expectSameSpot(tt, svg)
      expect(tt.dataPointIndex).toBe(1)

      // Still on the plot, but past the end of the violin: nothing is under
      // the pointer, so nothing is captioned.
      const horizontal = sample.startsWith('horizontal')
      await hover(page, {
        x: horizontal ? glyph.right + 12 : at.x,
        y: horizontal ? at.y : glyph.top - 12,
      })
      expect((await readTooltip(page)).active).toBe(false)
    })
  }

  // The tooltip that hovers the plot rather than a violin: shared on the
  // basic sample (no jitter, so only the re-anchor was missing), shared: false
  // without intersect on the jitter one, whose series group still holds a
  // `path[j]` on canvas: the jitter path, which the positioner took for the
  // violin.
  for (const sample of ['basic-violin', 'violin-with-jitter']) {
    test(`${sample}: the plot-hover tooltip sits where the SVG chart puts it`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('violin', sample)
      await loadCanvasFeature(page)

      const at = await bodyCentre(page, 1)
      await hover(page, at)
      const svg = await readTooltip(page)
      expect(svg.active).toBe(true)
      await page.mouse.move(5, 5)

      await update(page, { chart: { renderer: 'canvas' } })
      expect(
        await page.evaluate(() => window.chart.w.globals.activeRenderer?.kind),
      ).toBe('canvas')

      await hover(page, at)
      const tt = await readTooltip(page)
      await expectSameSpot(tt, svg)
      expect(Math.abs(tt.bandCentre - svg.bandCentre)).toBeLessThanOrEqual(
        TOLERANCE_PX,
      )
    })
  }
})

test.describe('Violin: grouped violins on canvas', () => {
  // Two series side by side in each category. On SVG the shared tooltip
  // anchors to the category (the band on its middle, the box down from the
  // series the positioner picks) whichever violin is hovered; on canvas it
  // took the hovered violin's own centre, half a slot off either way.
  /** Seeded normal samples, so every run draws the same violins. */
  const GEN = `(mu, sd, n, seed) => {
    let s = seed
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    return Array.from({ length: n }, () => {
      const u = rnd() || 1e-9
      const v = rnd()
      return +(mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)).toFixed(2)
    })
  }`

  async function render(page, { renderer, horizontal, tooltip, hide = null }) {
    await page.evaluate(
      async ({ renderer, horizontal, tooltip, hide, GEN }) => {
        const gen = eval(GEN)
        if (window.chart) window.chart.destroy()
        window.chart = new window.ApexCharts(document.querySelector('#stage'), {
          chart: {
            type: 'violin',
            height: 420,
            renderer,
            animations: { enabled: false },
          },
          series: [
            {
              name: 'S1',
              data: [
                { x: 'A', y: gen(50, 8, 200, 1) },
                { x: 'B', y: gen(60, 5, 200, 2) },
                { x: 'C', y: gen(45, 10, 200, 3) },
              ],
            },
            {
              name: 'S2',
              data: [
                { x: 'A', y: gen(40, 6, 200, 4) },
                { x: 'B', y: gen(55, 9, 200, 5) },
                { x: 'C', y: gen(65, 4, 200, 6) },
              ],
            },
          ],
          plotOptions: {
            violin: { points: { show: false } },
            bar: { horizontal },
          },
          tooltip,
        })
        await window.chart.render()
        if (hide) window.chart.hideSeries(hide)
      },
      { renderer, horizontal, tooltip, hide, GEN },
    )
    await page.waitForTimeout(250)
    return page.evaluate(() => window.chart.w.globals.activeRenderer?.kind)
  }

  for (const horizontal of [false, true]) {
    for (const [mode, tooltip] of [
      ['shared', {}],
      ['intersect', { shared: false, intersect: true }],
    ]) {
      test(`${horizontal ? 'horizontal' : 'vertical'}, ${mode}: canvas matches the SVG chart on either series`, async ({
        page,
      }) => {
        await page.setContent(
          '<!doctype html><body style="margin:0"><div id="stage" style="width:760px;margin:20px auto"></div></body>',
        )
        await page.addScriptTag({
          path: resolve(rootDir, 'dist', 'apexcharts.js'),
        })
        // Not in the default bundle since 8.0.
        await addAddons(page, 'violin')
        await loadCanvasFeature(page)

        expect(
          await render(page, { renderer: 'svg', horizontal, tooltip }),
        ).toBe('svg')
        const targets = await page.evaluate(() =>
          [0, 1].map((s) => {
            const r = document
              .querySelector(
                `.apexcharts-violin-series .apexcharts-series[data\\:realIndex='${s}'] .apexcharts-violin-area[j='1']`,
              )
              .getBoundingClientRect()
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
          }),
        )

        for (const [s, at] of targets.entries()) {
          await render(page, { renderer: 'svg', horizontal, tooltip })
          await page.mouse.move(2, 2)
          await hover(page, at)
          const svg = await readTooltip(page)
          expect(svg.active, `series ${s} on SVG`).toBe(true)

          expect(
            await render(page, { renderer: 'canvas', horizontal, tooltip }),
          ).toBe('canvas')
          await page.mouse.move(2, 2)
          await hover(page, at)
          const canvas = await readTooltip(page)
          await expectSameSpot(canvas, svg)
          if (!horizontal) {
            expect(
              Math.abs(canvas.bandCentre - svg.bandCentre),
              `series ${s}: the band`,
            ).toBeLessThanOrEqual(TOLERANCE_PX)
          }
        }
      })
    }
  }

  // With one series hidden the shared tooltip goes to the middle of the
  // violins still drawn, which is the one left. SVG read the middle off the
  // cx of the series its query picked, counting the hidden one, so the band
  // stood on the left or right edge of the violin; canvas, which skipped the
  // hidden series, put it on the violin. Both now take the visible ones.
  for (const hide of ['S1', 'S2']) {
    test(`vertical, shared, ${hide} hidden: canvas matches the SVG chart, the band on the violin left`, async ({
      page,
    }) => {
      await page.setContent(
        '<!doctype html><body style="margin:0"><div id="stage" style="width:760px;margin:20px auto"></div></body>',
      )
      await page.addScriptTag({
        path: resolve(rootDir, 'dist', 'apexcharts.js'),
      })
      // Not in the default bundle since 8.0.
      await addAddons(page, 'violin')
      await loadCanvasFeature(page)

      const opts = { horizontal: false, tooltip: {}, hide }
      expect(await render(page, { ...opts, renderer: 'svg' })).toBe('svg')
      // The violin left at j = 1: symmetric without its points, so its
      // centre line runs through the middle of its box.
      const body = await page.evaluate(() => {
        const r = document
          .querySelector(
            ".apexcharts-violin-series .apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-violin-area[j='1']",
          )
          .getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })

      await page.mouse.move(2, 2)
      await hover(page, body)
      const svg = await readTooltip(page)
      expect(svg.active).toBe(true)
      expect(svg.dataPointIndex).toBe(1)
      expect(Math.abs(svg.bandCentre - body.x), 'SVG band').toBeLessThanOrEqual(
        1.5,
      )

      expect(await render(page, { ...opts, renderer: 'canvas' })).toBe('canvas')
      await page.mouse.move(2, 2)
      await hover(page, body)
      const canvas = await readTooltip(page)
      await expectSameSpot(canvas, svg)
      expect(
        Math.abs(canvas.bandCentre - svg.bandCentre),
        'the band',
      ).toBeLessThanOrEqual(TOLERANCE_PX)
    })
  }
})

test.describe('Violin: keyboard focus on a horizontal violin', () => {
  // The keyboard box went to the chart's top-left corner here (the row
  // placement did not know violins, and nothing else placed it), and before
  // that past the violin's end, out of the plot. It now goes where the
  // pointer puts it: above or below the row of violins at the focused index,
  // read as whole glyphs, so a raincloud's rain lane is cleared too.
  for (const [type, sample] of [
    ['violin', 'horizontal-violin'],
    ['violin', 'horizontal-bimodal'],
    ['raincloud', 'horizontal-raincloud'],
  ]) {
    test(`${sample}: the box sits next to the focused violin, where the pointer puts it`, async ({
      page,
      loadChart,
    }) => {
      await loadChart(type, sample)
      await page.evaluate(() => {
        document.activeElement?.blur?.()
        document.querySelector('.apexcharts-svg').focus()
      })
      for (let step = 0; step < 3; step++) {
        if (step > 0) await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(300)
        const j = await page.evaluate(
          () => window.chart.ctx.keyboardNavigation.dataPointIndex,
        )
        // everything the violins at j draw: bodies, box lanes, jitter or rain
        const row = await page.evaluate((j) => {
          const rs = [
            ...document.querySelectorAll(
              `.apexcharts-violin-series :is(.apexcharts-violin-area, .apexcharts-violin-points)[j='${j}']`,
            ),
          ]
            .map((el) => el.getBoundingClientRect())
            .filter((r) => r.width > 0 || r.height > 0)
          return {
            left: Math.min(...rs.map((r) => r.left)),
            top: Math.min(...rs.map((r) => r.top)),
            right: Math.max(...rs.map((r) => r.right)),
            bottom: Math.max(...rs.map((r) => r.bottom)),
          }
        }, j)
        const byKey = await readTooltip(page)
        const label = `${sample}, violin ${j}`
        expect(byKey.active, label).toBe(true)
        expect(['top', 'bottom'], label).toContain(byKey.placement)
        // next to the violins, clear of all of them
        const gap =
          byKey.placement === 'top'
            ? row.top - byKey.bottom
            : byKey.top - row.bottom
        expect(gap, `${label}: gap ${gap}`).toBeGreaterThan(5)
        expect(gap, `${label}: gap ${gap}`).toBeLessThan(9)
        const across = (row.left + row.right) / 2
        expect(across, `${label}: across the row`).toBeGreaterThan(byKey.left)
        expect(across, `${label}: across the row`).toBeLessThan(byKey.right)
        expect(byKey.left, `${label}: on screen`).toBeGreaterThanOrEqual(0)
        expect(byKey.top, `${label}: on screen`).toBeGreaterThanOrEqual(0)

        // The pointer on the same violin puts the box in the same place.
        const body = await page.evaluate((j) => {
          const r = document
            .querySelector(
              `.apexcharts-violin-area:not(.apexcharts-raincloud-box)[j='${j}']`,
            )
            .getBoundingClientRect()
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        }, j)
        await hover(page, body)
        const byPointer = await readTooltip(page)
        await expectSameSpot(byPointer, byKey)
        await page.mouse.move(2, 2)
        await page.evaluate(() =>
          document.querySelector('.apexcharts-svg').focus(),
        )
      }
    })
  }
})
