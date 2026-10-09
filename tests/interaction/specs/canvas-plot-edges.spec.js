/**
 * The canvas renderer paints what the SVG chart shows past the plot's edges.
 *
 * On a numeric x axis (categories converted to numbers included) the first
 * and last categories sit on the plot's left and right edges, so half of an
 * edge column, candle, box or violin hangs outside the plot. The SVG chart
 * clips bar-like marks to a rect that reaches `barPadForNumericAxis` past
 * both sides (Grid.maskRects), so that half is drawn. The canvas reached only
 * a small marker margin past the plot and cut the shape off a few px out:
 * half a violin, the cloud of a raincloud's last group, the outer edge of a
 * box or column. The other way round, markers painted past the clip the SVG
 * chart gives them: a bubble on the plot's bottom edge spilled over the axis.
 *
 * Each case draws the chart as SVG and as canvas and compares, pixel by
 * pixel, where each paints in strips just outside the plot: beside it past
 * the old canvas margin for the bar-likes, under it for the markers.
 */

import { test, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { PNG } from 'pngjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')

/** A pixel this far from white (RGB channels summed) is painted. */
const INK = 60
/** At most this share of the painted pixels in a strip may disagree. */
const MAX_DIFF_SHARE = 0.15
/** The canvas used to reach this far past the plot (marker margin + AA). */
const OLD_REACH = 10

async function loadCanvasFeature(page) {
  await page.addScriptTag({
    path: resolve(rootDir, 'dist', 'features', 'renderer-canvas.js'),
  })
}

/** A chart of its own on a blank page, as `window.chart`. */
async function mountChart(page, options) {
  await page.setContent(
    '<!doctype html><body style="margin:0"><div id="stage" style="width:700px;margin:20px auto"></div></body>',
  )
  await page.addScriptTag({ path: resolve(rootDir, 'dist', 'apexcharts.js') })
  await loadCanvasFeature(page)
  await page.evaluate(async (options) => {
    window.chart = new window.ApexCharts(
      document.querySelector('#stage'),
      options,
    )
    await window.chart.render()
  }, options)
}

/** Re-render the chart on `renderer` and screenshot it. */
async function shoot(page, renderer, options = {}) {
  await page.evaluate(
    async ({ renderer, options }) => {
      await window.chart.updateOptions({
        ...options,
        chart: {
          ...(options.chart || {}),
          renderer,
          animations: { enabled: false },
        },
      })
    },
    { renderer, options },
  )
  await page.waitForTimeout(250)
  const info = await page.evaluate(() => {
    const w = window.chart.w
    const box = document
      .querySelector('.apexcharts-canvas')
      .getBoundingClientRect()
    const svg = document
      .querySelector('.apexcharts-svg')
      .getBoundingClientRect()
    const left = Math.floor(box.left)
    const top = Math.floor(box.top)
    return {
      kind: w.globals.activeRenderer?.kind,
      clip: {
        x: left,
        y: top,
        width: Math.ceil(box.right) - left,
        height: Math.ceil(box.bottom) - top,
      },
      // the plot, in the screenshot's px
      plot: {
        left: svg.left + w.layout.translateX - left,
        top: svg.top + w.layout.translateY - top,
        right: svg.left + w.layout.translateX + w.layout.gridWidth - left,
        bottom: svg.top + w.layout.translateY + w.layout.gridHeight - top,
      },
      barPad: w.globals.barPadForNumericAxis || 0,
    }
  })
  const png = PNG.sync.read(await page.screenshot({ clip: info.clip }))
  return { ...info, png }
}

/**
 * Where the two renderers disagree on whether a pixel of a strip is painted
 * at all: `differ` pixels are painted by one and left blank by the other, a
 * share of the `painted` ones (painted by either). Colour is not compared:
 * the canvas strokes outlines a shade lighter and composites some fills
 * differently, which says nothing about where it paints.
 */
function compareStrip(svg, canvas, strip) {
  const a = svg.png
  const b = canvas.png
  /** @param {PNG} p @param {number} i */
  const ink = (p, i) => 765 - p.data[i] - p.data[i + 1] - p.data[i + 2] > INK
  let painted = 0
  let differ = 0
  const x0 = Math.max(0, Math.round(strip.left))
  const x1 = Math.min(a.width, b.width, Math.round(strip.right))
  const y0 = Math.max(0, Math.round(strip.top))
  const y1 = Math.min(a.height, b.height, Math.round(strip.bottom))
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const inA = ink(a, (y * a.width + x) * 4)
      const inB = ink(b, (y * b.width + x) * 4)
      if (inA || inB) painted++
      if (inA !== inB) differ++
    }
  }
  return { painted, differ, share: painted ? differ / painted : 0 }
}

/**
 * Beside the plot, past the old canvas margin, as far as the bar clip. The
 * edge mark fills a good part of it, which `min` (painted px) makes sure of.
 */
const besidePlot = {
  left: {
    min: 150,
    rect: ({ plot, barPad }) => ({
      left: plot.left - barPad - 2,
      right: plot.left - OLD_REACH,
      top: plot.top,
      bottom: plot.bottom,
    }),
  },
  right: {
    min: 150,
    rect: ({ plot, barPad }) => ({
      left: plot.right + OLD_REACH,
      right: plot.right + barPad + 2,
      top: plot.top,
      bottom: plot.bottom,
    }),
  },
}

/** Draw the chart both ways and expect each strip painted alike. */
async function expectSameEdges(page, strips, options = {}) {
  const svg = await shoot(page, 'svg', options)
  expect(svg.kind).toBe('svg')
  const canvas = await shoot(page, 'canvas', options)
  // Guard the guard: an SVG fallback would pass without covering canvas.
  expect(canvas.kind).toBe('canvas')
  expect(canvas.plot).toEqual(svg.plot)

  for (const [name, { rect, min }] of Object.entries(strips)) {
    const r = compareStrip(svg, canvas, rect(svg))
    expect(r.painted, `${name}: the strip shows the edge mark`).toBeGreaterThan(
      min,
    )
    expect(
      r.share,
      `${name}: ${r.differ} of ${r.painted} px painted by one renderer only`,
    ).toBeLessThan(MAX_DIFF_SHARE)
  }
}

test.describe('Canvas renderer: marks hanging past the plot edges', () => {
  for (const [type, sample, sides] of [
    // Group A and Group G: half of each violin is outside the plot
    ['violin', 'basic-violin', ['left', 'right']],
    // Tokyo and Berlin, under their jitter
    ['violin', 'violin-with-jitter', ['left', 'right']],
    // RR's cloud hangs entirely right of the plot (DD's rain is SVG anyway)
    ['raincloud', 'basic-raincloud', ['right']],
    // the first and last boxes
    ['boxPlot', 'basic', ['left', 'right']],
  ]) {
    test(`${type}/${sample}: the edge marks are drawn as on SVG`, async ({
      page,
      loadChart,
    }) => {
      await loadChart(type, sample)
      await loadCanvasFeature(page)
      const strips = Object.fromEntries(sides.map((s) => [s, besidePlot[s]]))
      await expectSameEdges(page, strips)
    })
  }

  test('columns on a datetime axis: the first and last are drawn whole', async ({
    page,
  }) => {
    const day = 86400000
    await mountChart(page, {
      chart: { type: 'bar', height: 320, animations: { enabled: false } },
      series: [
        {
          name: 'A',
          data: [30, 50, 42, 61, 48].map((v, k) => [
            Date.UTC(2024, 0, 1) + k * day,
            v,
          ]),
        },
      ],
      xaxis: { type: 'datetime' },
      dataLabels: { enabled: false },
    })
    await expectSameEdges(page, besidePlot)
  })

  test('a bubble on the bottom edge is clipped where the SVG chart clips it', async ({
    page,
  }) => {
    await mountChart(page, {
      chart: { type: 'bubble', height: 320, animations: { enabled: false } },
      series: [
        {
          name: 'A',
          data: [
            [10, 0, 60],
            [20, 30, 50],
            [30, 15, 20],
          ],
        },
      ],
      xaxis: { type: 'numeric', min: 0, max: 40, tickAmount: 4 },
      yaxis: { min: 0, max: 40 },
      dataLabels: { enabled: false },
    })
    // The bubble at y = 0 straddles the plot's bottom edge. Its upper half
    // shows on both; under the plot, below the axis line and above the axis
    // labels, only the ticks (SVG on both) may: the clip cuts its lower half.
    await expectSameEdges(page, {
      above: {
        min: 150,
        rect: ({ plot }) => ({
          left: plot.left,
          right: plot.right,
          top: plot.bottom - 8,
          bottom: plot.bottom - 2,
        }),
      },
      below: {
        min: 0,
        rect: ({ plot }) => ({
          left: plot.left,
          right: plot.right,
          top: plot.bottom + 2,
          bottom: plot.bottom + 8,
        }),
      },
    })
  })

  test('a violin hovered on its half outside the plot gets the SVG tooltip', async ({
    page,
    loadChart,
  }) => {
    // The hit test and the painted region agree: the outer half of Group A
    // is hovered past the old canvas margin, where it was not painted.
    await loadChart('violin', 'basic-violin')
    await loadCanvasFeature(page)
    const intersect = { tooltip: { shared: false, intersect: true } }
    const at = async () => {
      await shoot(page, 'svg', intersect)
      return page.evaluate((reach) => {
        const w = window.chart.w
        const svg = document
          .querySelector('.apexcharts-svg')
          .getBoundingClientRect()
        const body = document
          .querySelector(".apexcharts-violin-area[j='0']")
          .getBoundingClientRect()
        const plotLeft = svg.left + w.layout.translateX
        return {
          x: (body.left + plotLeft - reach) / 2,
          y: body.top + body.height / 2,
          outside: plotLeft - reach - body.left,
        }
      }, OLD_REACH)
    }
    const point = await at()
    expect(point.outside).toBeGreaterThan(10)

    const read = () =>
      page.evaluate(() => {
        const el = document.querySelector('.apexcharts-tooltip')
        const r = el.getBoundingClientRect()
        return {
          active: el.classList.contains('apexcharts-active'),
          left: Math.round(r.left),
          top: Math.round(r.top),
          j: window.chart.w.interact.capturedDataPointIndex,
        }
      })
    const hover = async () => {
      await page.mouse.move(2, 2)
      await page.mouse.move(point.x - 3, point.y - 3)
      await page.mouse.move(point.x, point.y)
      await page.waitForTimeout(150)
      return read()
    }

    const svg = await hover()
    expect(svg).toMatchObject({ active: true, j: 0 })
    const canvas = await shoot(page, 'canvas', intersect)
    expect(canvas.kind).toBe('canvas')
    expect(await hover()).toEqual(svg)
  })
})

test.describe('Canvas renderer: the shared box over an edge candle or box', () => {
  // The sticky (shared) path centres the crosshair band and the box on the
  // mark. A candle or box on a numeric x axis is drawn from `cx - barWidth/2`;
  // the SVG path corrects the cached centre for that, and the canvas took the
  // cached centre as it was, so its band and box stood half a mark right of
  // the SVG ones, the last mark's past the plot's right edge.
  const day = 86400000
  const CASES = {
    'candles on a datetime axis': {
      chart: { type: 'candlestick', height: 320 },
      series: [
        {
          name: 'c',
          data: [0, 1, 2, 3].map((k) => [
            Date.UTC(2024, 0, 1) + k * day,
            [30 + k, 40 + k, 25 + k, 35 + k],
          ]),
        },
      ],
      xaxis: { type: 'datetime' },
    },
    'boxes on a category axis': {
      chart: { type: 'boxPlot', height: 320 },
      series: [
        {
          name: 'b',
          data: ['a', 'b', 'c', 'd'].map((x, k) => ({
            x,
            y: [10 + k, 20 + k, 30 + k, 40 + k, 50 + k],
          })),
        },
      ],
    },
  }

  for (const [label, options] of Object.entries(CASES)) {
    test(`${label}: band and box sit where the SVG chart puts them`, async ({
      page,
    }) => {
      await mountChart(page, {
        ...options,
        chart: { ...options.chart, animations: { enabled: false } },
      })
      await page.addStyleTag({
        content:
          '.apexcharts-tooltip,.apexcharts-xcrosshairs{transition:none !important}',
      })

      const points = async () => {
        await shoot(page, 'svg')
        return page.evaluate(() => {
          const w = window.chart.w
          const svg = document
            .querySelector('.apexcharts-svg')
            .getBoundingClientRect()
          const left = svg.left + w.layout.translateX
          const pad = w.globals.barPadForNumericAxis
          const y = svg.top + w.layout.translateY + w.layout.gridHeight / 2
          const n = w.globals.dataPoints
          const step = n > 1 ? w.layout.gridWidth / (n - 1) : 0
          return [
            // the outer halves of the first and last marks
            { x: left - pad / 4, y, pad },
            { x: left + w.layout.gridWidth + pad / 4, y, pad },
            // and each mark's own x
            ...Array.from({ length: n }, (_, j) => ({ x: left + step * j, y })),
          ]
        })
      }
      const read = () =>
        page.evaluate(() => {
          const el = document.querySelector(
            '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
          )
          const r = el.getBoundingClientRect()
          const band = document
            .querySelector('.apexcharts-xcrosshairs')
            .getBoundingClientRect()
          return {
            active: el.classList.contains('apexcharts-active'),
            j: window.chart.w.interact.capturedDataPointIndex,
            left: r.left,
            top: r.top,
            band: band.left + band.width / 2,
          }
        })
      const hover = async (p) => {
        await page.mouse.move(2, 2)
        await page.mouse.move(p.x - 3, p.y - 3)
        await page.mouse.move(p.x, p.y)
        await page.waitForTimeout(150)
        return read()
      }

      const spots = await points()
      expect(spots[0].pad, 'the edge marks hang past the plot').toBeGreaterThan(
        20,
      )
      const svg = []
      for (const p of spots) {
        svg.push(await hover(p))
        expect(svg.at(-1).active, 'the SVG box opens').toBe(true)
      }
      const canvas = await shoot(page, 'canvas')
      expect(canvas.kind).toBe('canvas')
      for (const [k, p] of spots.entries()) {
        const at = `(${Math.round(p.x)}, ${Math.round(p.y)})`
        const got = await hover(p)
        expect(got.active, at).toBe(true)
        expect(got.j, at).toBe(svg[k].j)
        expect(Math.abs(got.band - svg[k].band), `${at} band`).toBeLessThan(1.5)
        expect(Math.abs(got.left - svg[k].left), `${at} box left`).toBeLessThan(
          1.5,
        )
        expect(Math.abs(got.top - svg[k].top), `${at} box top`).toBeLessThan(
          1.5,
        )
      }
    })
  }
})
