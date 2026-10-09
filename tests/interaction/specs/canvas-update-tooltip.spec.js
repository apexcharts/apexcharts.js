/**
 * Canvas charts keep their hover through data-only updates.
 *
 * On the canvas renderer the marks are painted, so every hover path asks the
 * active renderer (`w.globals.activeRenderer`) to hit-test the pointer: the
 * heatmap cell lookup, the intersect violin lookup, the legend dimming. That
 * handle was reset with the per-render globals on every parse but set again
 * only by a full render, so the first updateSeries() (the data-only fast
 * path) left it null: the tooltip never came back, through more updates and
 * through a resize that did not change the chart's box. Only a full redraw
 * restored it.
 *
 * Each test here hovers a painted mark after the kind of update a live chart
 * makes (one, several, after a resize, after appendData, across the 'auto'
 * renderer switching backends) and checks that the box captions that mark
 * with its current value.
 */

import { test, expect } from '../fixtures/base.js'
import { addAddons } from '../helpers/addons.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')

/** A blank page with the bundle and the canvas renderer, for own configs. */
async function blankPage(page, wrapStyle = 'width:760px') {
  await page.setContent(
    `<!doctype html><body style="margin:0"><div id="wrap" style="${wrapStyle};margin:20px auto"><div id="stage"></div></div></body>`,
  )
  await page.addScriptTag({ path: resolve(rootDir, 'dist', 'apexcharts.js') })
  await page.addScriptTag({
    path: resolve(rootDir, 'dist', 'features', 'renderer-canvas.js'),
  })
}

async function mount(page, options) {
  await page.evaluate(async (options) => {
    if (window.chart) window.chart.destroy()
    window.chart = new window.ApexCharts(
      document.querySelector('#stage'),
      options,
    )
    await window.chart.render()
  }, options)
  await page.waitForTimeout(100)
}

/** rows x cols heatmap whose values shift with `bump`, so updates show. */
function heatmap({ rows = 6, cols = 12, renderer = 'canvas', extra = {} }) {
  return {
    chart: {
      type: 'heatmap',
      height: 360,
      renderer,
      animations: { enabled: false },
      toolbar: { show: false },
      ...extra,
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    series: heatmapSeries(rows, cols, 0),
  }
}

function heatmapSeries(rows, cols, bump) {
  return Array.from({ length: rows }, (_, r) => ({
    name: 'R' + r,
    data: Array.from({ length: cols }, (_, c) => ({
      x: 'c' + c,
      y: ((r * 7 + c * 3) % 40) + bump,
    })),
  }))
}

async function updateHeatmap(page, rows, cols, bump) {
  await page.evaluate(
    async ({ series }) => {
      await window.chart.updateSeries(series, false)
    },
    { series: heatmapSeries(rows, cols, bump) },
  )
  await page.waitForTimeout(100)
}

/**
 * Screen centre of heatmap cell (i, j). On canvas the renderer keeps the box
 * it painted each cell in (plot px); `ctx.renderer` is read rather than the
 * globals mirror under test, so the probe works whatever that mirror holds.
 */
async function cellCentre(page, i, j) {
  return page.evaluate(
    ([i, j]) => {
      const chart = window.chart
      const r = chart.ctx.renderer
      if (r.kind === 'canvas') {
        const c = r.findCell(i, j)
        const svg = chart.w.dom.Paper.node.getBoundingClientRect()
        return {
          x: svg.left + chart.w.layout.translateX + c.x + c.width / 2,
          y: svg.top + chart.w.layout.translateY + c.y + c.height / 2,
        }
      }
      const b = document
        .querySelector(`.apexcharts-heatmap-rect[i='${i}'][j='${j}']`)
        .getBoundingClientRect()
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 }
    },
    [i, j],
  )
}

async function hover(page, { x, y }) {
  await page.mouse.move(2, 2)
  await page.mouse.move(x - 2, y - 1)
  await page.mouse.move(x, y)
  await page.waitForTimeout(150)
}

async function readTooltip(page) {
  return page.evaluate(() => {
    const el = document.querySelector(
      '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
    )
    return {
      active: !!el?.classList.contains('apexcharts-active'),
      value: el?.querySelector('.apexcharts-tooltip-text-y-value')?.textContent,
      i: window.chart.w.interact.capturedSeriesIndex,
      j: window.chart.w.interact.capturedDataPointIndex,
    }
  })
}

/** Hover cell (i, j) and expect the box to caption it with `value`. */
async function expectCellTooltip(page, i, j, value, label) {
  await hover(page, await cellCentre(page, i, j))
  const tt = await readTooltip(page)
  expect(tt.active, `${label}: the box opens`).toBe(true)
  expect([tt.i, tt.j], `${label}: on the hovered cell`).toEqual([i, j])
  expect(tt.value, `${label}: with the current value`).toBe(String(value))
}

const cellValue = (i, j, bump) => ((i * 7 + j * 3) % 40) + bump

async function rendererKinds(page) {
  return page.evaluate(() => ({
    controller: window.chart.getActiveRenderer(),
    mirror: window.chart.w.globals.activeRenderer?.kind ?? null,
  }))
}

function collectErrors(page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test.describe('Canvas heatmap: tooltip after data updates', () => {
  test('the canvas heatmap demo keeps its tooltip through updateSeries', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await page.goto(
      `file://${resolve(rootDir, 'samples/vanilla-js/heatmap/heatmap-canvas-renderer.html')}`,
    )
    // A canvas heatmap paints its cells rather than animating them in, so it
    // never raises animationEnded; wait for the renderer instead.
    await page.waitForFunction(
      () => window.chart?.w.globals.activeRenderer?.kind === 'canvas',
    )
    await page.waitForTimeout(200)

    const probe = async (label) => {
      const at = await cellCentre(page, 20, 100)
      await hover(page, at)
      const tt = await readTooltip(page)
      expect(tt.active, label).toBe(true)
      expect([tt.i, tt.j], label).toEqual([20, 100])
      return tt.value
    }
    const before = await probe('before any update')

    for (let k = 1; k <= 3; k++) {
      await page.evaluate(async () => {
        const s = window.chart.w.config.series.map((r) => ({
          name: r.name,
          data: r.data.map((p) => ({ x: p.x, y: p.y + 1 })),
        }))
        await window.chart.updateSeries(s)
      })
      await page.waitForTimeout(150)
      expect(await probe(`after update ${k}`)).not.toBe(before)
      expect(await rendererKinds(page)).toEqual({
        controller: 'canvas',
        mirror: 'canvas',
      })
    }
    expect(errors).toEqual([])
  })

  test('after one update and after several', async ({ page }) => {
    const errors = collectErrors(page)
    await blankPage(page)
    await mount(page, heatmap({}))
    await expectCellTooltip(page, 2, 5, cellValue(2, 5, 0), 'first render')

    for (let bump = 1; bump <= 4; bump++) {
      await updateHeatmap(page, 6, 12, bump)
      // a data-only update: the fast path, which never resolves again
      expect(await page.evaluate(() => window.chart._updateStats.full)).toBe(0)
      await expectCellTooltip(
        page,
        bump % 6,
        (bump * 2) % 12,
        cellValue(bump % 6, (bump * 2) % 12, bump),
        `update ${bump}`,
      )
    }
    expect(errors).toEqual([])
  })

  test('after a resize, whether or not it redraws the chart', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await blankPage(page)
    await mount(page, heatmap({}))

    // Update, then a window resize that leaves the chart's box as it was:
    // the chart is not redrawn, so nothing on the way could have restored a
    // lost renderer handle.
    await updateHeatmap(page, 6, 12, 1)
    const svgBefore = await page.evaluateHandle(
      () => window.chart.w.dom.Paper.node,
    )
    await page.setViewportSize({ width: 1000, height: 800 })
    await page.waitForTimeout(400)
    expect(
      await page.evaluate(
        (svg) => window.chart.w.dom.Paper.node === svg,
        svgBefore,
      ),
      'the resize did not redraw',
    ).toBe(true)
    await expectCellTooltip(page, 3, 4, cellValue(3, 4, 1), 'no-op resize')

    // A resize that does redraw, then a data update on the new layout.
    await page.evaluate(() => {
      document.querySelector('#wrap').style.width = '600px'
    })
    await page.waitForFunction(
      () => Math.round(window.chart.w.globals.svgWidth) === 600,
    )
    await page.waitForTimeout(150)
    await expectCellTooltip(page, 3, 4, cellValue(3, 4, 1), 'redrawn')
    await updateHeatmap(page, 6, 12, 2)
    await expectCellTooltip(page, 1, 9, cellValue(1, 9, 2), 'resize + update')
    expect(errors).toEqual([])
  })

  test('after appendData, and the updates that follow it', async ({ page }) => {
    const errors = collectErrors(page)
    await blankPage(page)
    await mount(page, heatmap({}))

    // one more column on every row: a full render
    const appendColumn = (c, bump) =>
      page.evaluate(
        async ({ c, bump }) => {
          await window.chart.appendData(
            window.chart.w.config.series.map((_, r) => ({
              data: [{ x: 'c' + c, y: ((r * 7 + c * 3) % 40) + bump }],
            })),
          )
        },
        { c, bump },
      )
    await appendColumn(12, 0)
    await page.waitForTimeout(100)
    await expectCellTooltip(page, 4, 12, cellValue(4, 12, 0), 'appended cell')

    await updateHeatmap(page, 6, 13, 3)
    await expectCellTooltip(page, 4, 12, cellValue(4, 12, 3), 'append + update')
    await updateHeatmap(page, 6, 13, 5)
    await expectCellTooltip(page, 0, 6, cellValue(0, 6, 5), 'second update')
    expect(await rendererKinds(page)).toEqual({
      controller: 'canvas',
      mirror: 'canvas',
    })
    expect(errors).toEqual([])
  })

  test("'auto' switching backends on update keeps the hover on both", async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await blankPage(page)
    // 96 cells: below the threshold, so SVG
    await mount(
      page,
      heatmap({
        cols: 16,
        renderer: 'auto',
        extra: { rendererThreshold: 100 },
      }),
    )
    expect(await rendererKinds(page)).toEqual({
      controller: 'svg',
      mirror: 'svg',
    })
    await expectCellTooltip(page, 2, 3, cellValue(2, 3, 0), 'svg')

    // appendData crosses it: 102 cells, painted
    await page.evaluate(async () => {
      await window.chart.appendData(
        window.chart.w.config.series.map((_, r) => ({
          data: [{ x: 'c16', y: ((r * 7 + 16 * 3) % 40) + 0 }],
        })),
      )
    })
    await page.waitForTimeout(100)
    expect(await rendererKinds(page)).toEqual({
      controller: 'canvas',
      mirror: 'canvas',
    })
    expect(await page.locator('.apexcharts-heatmap-rect').count()).toBe(0)
    await expectCellTooltip(page, 2, 16, cellValue(2, 16, 0), 'auto canvas')

    // a same-shape update stays on canvas, on the fast path
    await updateHeatmap(page, 6, 17, 2)
    await expectCellTooltip(page, 5, 1, cellValue(5, 1, 2), 'canvas update')
    expect(await rendererKinds(page)).toEqual({
      controller: 'canvas',
      mirror: 'canvas',
    })

    // fewer cells again: back to SVG, hovered through its own cells
    await updateHeatmap(page, 6, 10, 4)
    expect(await rendererKinds(page)).toEqual({
      controller: 'svg',
      mirror: 'svg',
    })
    expect(await page.locator('.apexcharts-heatmap-rect').count()).toBe(60)
    await expectCellTooltip(page, 1, 8, cellValue(1, 8, 4), 'back on svg')
    expect(errors).toEqual([])
  })
})

test.describe('Canvas violin: intersect tooltip after data updates', () => {
  const INTERSECT = { tooltip: { shared: false, intersect: true } }

  /** Centre of violin `j`'s body, measured while the chart is SVG. */
  async function bodyCentre(page, j) {
    return page.evaluate((j) => {
      const r = document
        .querySelector(
          `.apexcharts-violin-area:not(.apexcharts-raincloud-box)[j='${j}']`,
        )
        .getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }, j)
  }

  for (const sample of ['basic-violin', 'horizontal-violin']) {
    test(`${sample}: hovering a painted violin after updateSeries`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('violin', sample)
      await page.addScriptTag({
        path: resolve(rootDir, 'dist', 'features', 'renderer-canvas.js'),
      })
      // the demo's own violins (density + points), to hand back unchanged
      expect(
        await page.evaluate(() => {
          window.violins = JSON.parse(JSON.stringify(window.options.series))
          return Array.isArray(window.violins[0].data[0].y?.density)
        }),
      ).toBe(true)
      const at = await bodyCentre(page, 1)
      await page.evaluate(async (opts) => {
        await window.chart.updateOptions({
          ...opts,
          chart: { renderer: 'canvas', animations: { enabled: false } },
        })
      }, INTERSECT)
      await page.waitForTimeout(200)
      expect(await rendererKinds(page)).toEqual({
        controller: 'canvas',
        mirror: 'canvas',
      })

      const probe = async (label) => {
        await hover(page, at)
        const tt = await readTooltip(page)
        expect(tt.active, label).toBe(true)
        expect(tt.j, label).toBe(1)
      }
      await probe('before any update')

      // The same observations again: the violins stay where they are, so
      // the pointer is still on violin 1, and the update is data-only.
      for (let k = 1; k <= 3; k++) {
        await page.evaluate(async () => {
          await window.chart.updateSeries(
            JSON.parse(JSON.stringify(window.violins)),
            false,
          )
        })
        await page.waitForTimeout(150)
        expect(
          await page.evaluate(() => window.chart._updateStats.full),
          'the update took the fast path',
        ).toBe(0)
        await probe(`after update ${k}`)
        expect(await rendererKinds(page)).toEqual({
          controller: 'canvas',
          mirror: 'canvas',
        })
      }
    })
  }

  /**
   * Six violins whose shapes move with `shift` (each group's mean), as
   * `{ density, points }` so no sampling runs in the page.
   */
  function violinSeries(shift, groups = 6) {
    return [
      {
        name: 'M',
        data: Array.from({ length: groups }, (_, g) => {
          const mean = 45 + ((g * 7) % 15) + shift
          const sd = 6 + (g % 3)
          const density = []
          for (let k = -18; k <= 18; k++) {
            density.push([mean + (k * sd) / 6, Math.exp(-0.5 * (k / 6) ** 2)])
          }
          return {
            x: 'Group ' + String.fromCharCode(65 + g),
            y: { density, points: [mean - sd, mean, mean + sd] },
          }
        }),
      },
    ]
  }

  /**
   * Screen centre of painted violin j's extent, from the coords the canvas
   * pass cached for it, so it follows the violin wherever an update moved it.
   */
  async function paintedCentre(page, j) {
    return page.evaluate((j) => {
      const w = window.chart.w
      const b = w.globals.barCanvasCoords?.[0]?.[j]?.bounds
      if (!b) return null
      const svg = w.dom.Paper.node.getBoundingClientRect()
      const z = svg.width / w.globals.svgWidth
      return {
        x: svg.left + (w.layout.translateX + (b.left + b.right) / 2) * z,
        y: svg.top + (w.layout.translateY + (b.top + b.bottom) / 2) * z,
      }
    }, j)
  }

  for (const horizontal of [false, true]) {
    test(`${horizontal ? 'horizontal' : 'vertical'} violins whose shapes change: after updates, resizes and appendData`, async ({
      page,
    }) => {
      const errors = collectErrors(page)
      await blankPage(page)
      await addAddons(page, 'violin')
      await mount(page, {
        chart: {
          type: 'violin',
          height: 420,
          renderer: 'canvas',
          animations: { enabled: false },
          toolbar: { show: false },
        },
        plotOptions: {
          bar: { horizontal },
          violin: { points: { show: false } },
        },
        ...INTERSECT,
        series: violinSeries(0),
      })
      expect(await rendererKinds(page)).toEqual({
        controller: 'canvas',
        mirror: 'canvas',
      })

      const probe = async (j, label) => {
        const at = await paintedCentre(page, j)
        expect(at, `${label}: violin ${j} painted`).not.toBeNull()
        await hover(page, at)
        const tt = await readTooltip(page)
        expect(tt.active, `${label}: the box opens`).toBe(true)
        expect(tt.j, `${label}: on violin ${j}`).toBe(j)
      }
      const update = async (shift, groups = 6) => {
        await page.evaluate(
          async (series) => window.chart.updateSeries(series, false),
          violinSeries(shift, groups),
        )
        await page.waitForTimeout(150)
      }

      await probe(1, 'first render')
      // Each update moves every violin, so a hit test still holding the
      // shapes of the render before would miss.
      for (let k = 1; k <= 3; k++) {
        await update(k * 4)
        await probe((k + 1) % 6, `update ${k}`)
      }

      // A window resize that leaves the chart's box as it was: no redraw.
      const svgBefore = await page.evaluateHandle(
        () => window.chart.w.dom.Paper.node,
      )
      await page.setViewportSize({ width: 1100, height: 900 })
      await page.waitForTimeout(400)
      expect(
        await page.evaluate(
          (svg) => window.chart.w.dom.Paper.node === svg,
          svgBefore,
        ),
        'the resize did not redraw',
      ).toBe(true)
      await probe(2, 'no-op resize')

      // A container resize, which redraws, then an update on that layout.
      await page.evaluate(() => {
        document.querySelector('#wrap').style.width = '600px'
      })
      await page.waitForFunction(
        () => Math.round(window.chart.w.globals.svgWidth) === 600,
      )
      await page.waitForTimeout(150)
      await probe(3, 'container resize')
      await update(9)
      await probe(4, 'resize + update')

      // appendData adds a seventh group: the new violin and an old one
      // both answer, and so do they after a same-shape update.
      await page.evaluate(
        async (series) => {
          await window.chart.appendData([{ data: [series[0].data[6]] }])
        },
        violinSeries(3, 7),
      )
      await page.waitForTimeout(200)
      await probe(6, 'appendData, the new violin')
      await probe(1, 'appendData, an old violin')
      await update(5, 7)
      await probe(5, 'append + update')
      expect(errors).toEqual([])
    })
  }
})

test.describe('Canvas legend hover after data updates', () => {
  // Hovering a legend item dims the other series. On canvas that is a
  // repaint (renderer.restyle) reached through the same renderer handle, so
  // it stopped dimming anything after the first data update.
  async function opaquePixels(page) {
    return page.evaluate(() => {
      const canvas = document.querySelector('canvas.apexcharts-series-canvas')
      const ctx = canvas.getContext('2d')
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let n = 0
      for (let k = 3; k < data.length; k += 4) if (data[k] > 200) n++
      return n
    })
  }

  async function hoverLegend(page, rel) {
    const box = await page
      .locator(`.apexcharts-legend-series[rel='${rel}']`)
      .boundingBox()
    await page.mouse.move(box.x + box.width / 2 - 2, box.y + box.height / 2)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(100)
  }

  const columns = (bump) =>
    ['A', 'B', 'C'].map((name, s) => ({
      name,
      data: Array.from(
        { length: 8 },
        (_, j) => ((j * 5 + s * 11) % 30) + 10 + bump,
      ),
    }))

  test('a legend hover still dims the painted series after updateSeries', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await blankPage(page)
    await mount(page, {
      chart: {
        type: 'bar',
        height: 340,
        renderer: 'canvas',
        animations: { enabled: false },
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      legend: { show: true, onItemHover: { highlightDataSeries: true } },
      series: columns(0),
      xaxis: { categories: Array.from({ length: 8 }, (_, j) => 'c' + j) },
    })
    expect((await rendererKinds(page)).controller).toBe('canvas')

    const check = async (label) => {
      await page.mouse.move(2, 2)
      await page.waitForTimeout(100)
      const full = await opaquePixels(page)
      expect(full, `${label}: bars painted`).toBeGreaterThan(1000)
      await hoverLegend(page, 2)
      const dimmed = await opaquePixels(page)
      // series A and C fade to a fifth; only B stays opaque
      expect(dimmed, `${label}: the others dim`).toBeLessThan(full * 0.6)
      await page.mouse.move(2, 2)
      await page.waitForTimeout(100)
      expect(await opaquePixels(page), `${label}: and come back`).toBe(full)
    }

    const update = async (bump) => {
      await page.evaluate(async (series) => {
        await window.chart.updateSeries(series, false)
      }, columns(bump))
      await page.waitForTimeout(100)
    }

    await check('first render')
    for (let k = 1; k <= 2; k++) {
      await update(k * 3)
      await check(`update ${k}`)
    }

    // A legend toggle there and back (full renders), then data again.
    for (let click = 0; click < 2; click++) {
      await page
        .locator(".apexcharts-legend-series[rel='3'] .apexcharts-legend-text")
        .click()
      await page.waitForTimeout(200)
    }
    expect(
      await page.evaluate(() => window.chart.w.globals.collapsedSeries.length),
    ).toBe(0)
    const fastUpdates = () =>
      page.evaluate(
        () =>
          window.chart._updateStats.fast +
          window.chart._updateStats.fastWithAxes,
      )
    const fastBefore = await fastUpdates()
    await update(10)
    expect(await fastUpdates(), 'a data-only update').toBe(fastBefore + 1)
    await check('legend toggle + update')
    expect(errors).toEqual([])
  })
})
