/**
 * Markers beside the bar-likes of a combo, on both renderers.
 *
 * The box plot outlier sample draws its outliers as round goal markers.
 * Goals, like a bar's data labels and the annotations, wait hidden until the
 * series have animated in; the canvas renderer paints its final frame at
 * once and never ran that reveal, so the outliers were not painted at all.
 *
 * With `tooltip.intersect` a marker over the bar-likes (a scatter of
 * outliers over box plots, line markers over columns) is what the pointer
 * is on. The SVG chart only looked for one when the chart's first series
 * had markers, so hovering one showed an empty box in the chart's corner, or
 * the box of the last bar hovered. On canvas the markers are painted, there
 * was no node to hover, and nothing showed; a plain canvas scatter or line
 * chart showed no intersect tooltip either.
 *
 * Every tooltip here is checked against the same chart drawn as SVG.
 */

import { test, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { PNG } from 'pngjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')

const TOLERANCE_PX = 1

async function loadCanvasFeature(page) {
  await page.addScriptTag({
    path: resolve(rootDir, 'dist', 'features', 'renderer-canvas.js'),
  })
}

/** A chart of its own on a blank page, as `window.chart`. */
async function mountChart(page, options) {
  await page.setContent(
    '<!doctype html><body style="margin:0"><div id="stage" style="width:700px;margin:20px"></div></body>',
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

/** Re-render on `renderer`, and make sure it took. */
async function useRenderer(page, renderer, options = {}) {
  await page.evaluate(
    async ({ renderer, options }) => {
      await window.chart.updateOptions({
        ...options,
        chart: { renderer, animations: { enabled: false } },
      })
    },
    { renderer, options },
  )
  await page.waitForTimeout(250)
  const kind = await page.evaluate(
    () => window.chart.w.globals.activeRenderer?.kind,
  )
  expect(kind).toBe(renderer)
}

/** The page, as decoded pixels. */
async function shot(page) {
  return PNG.sync.read(await page.screenshot())
}

/** Pixels close to `rgb` inside a client rect. */
function countColour(png, rect, [r, g, b], tolerance = 40) {
  let n = 0
  for (
    let y = Math.max(0, rect.top);
    y < Math.min(png.height, rect.bottom);
    y++
  ) {
    for (
      let x = Math.max(0, rect.left);
      x < Math.min(png.width, rect.right);
      x++
    ) {
      const i = (y * png.width + x) * 4
      if (
        Math.abs(png.data[i] - r) +
          Math.abs(png.data[i + 1] - g) +
          Math.abs(png.data[i + 2] - b) <
        tolerance
      ) {
        n++
      }
    }
  }
  return n
}

async function readTooltip(page) {
  return page.evaluate(() => {
    const el = document.querySelector(
      '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
    )
    const r = el.getBoundingClientRect()
    return {
      active: el.classList.contains('apexcharts-active'),
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      left: r.left,
      top: r.top,
    }
  })
}

async function hover(page, { x, y }) {
  await page.mouse.move(2, 2)
  await page.waitForTimeout(60)
  await page.mouse.move(x - 2, y - 2)
  await page.mouse.move(x, y)
  await page.waitForTimeout(150)
}

/** Centres of the markers of series `i`, measured on the SVG chart. */
async function markerCentres(page, i) {
  return page.evaluate((i) => {
    const series = [...document.querySelectorAll('.apexcharts-series')].find(
      (g) => g.getAttribute('data:realIndex') === String(i),
    )
    // a data point's marker, not the series' hover dot
    return [...series.querySelectorAll('.apexcharts-marker[rel]')].map((m) => {
      const r = m.getBoundingClientRect()
      return {
        x: Math.round(r.left + r.width / 2),
        y: Math.round(r.top + r.height / 2),
      }
    })
  }, i)
}

test.describe('Canvas renderer: box plot outliers drawn as goals', () => {
  test('are painted where the SVG chart draws them', async ({
    page,
    loadChart,
  }) => {
    await loadChart('boxPlot', 'boxplot-scatter')
    await loadCanvasFeature(page)
    const plot = await page.evaluate(() => {
      const r = document
        .querySelector('.apexcharts-svg')
        .getBoundingClientRect()
      const l = window.chart.w.layout
      return {
        left: Math.floor(r.left + l.translateX),
        top: Math.floor(r.top + l.translateY),
        right: Math.ceil(r.left + l.translateX + l.gridWidth),
        bottom: Math.ceil(r.top + l.translateY + l.gridHeight),
      }
    })
    // #FEB019, the outliers' colour
    const AMBER = [0xfe, 0xb0, 0x19]

    await useRenderer(page, 'svg')
    const svg = countColour(await shot(page), plot, AMBER)
    await useRenderer(page, 'canvas')
    const canvas = countColour(await shot(page), plot, AMBER)

    // eleven 13px dots
    expect(svg).toBeGreaterThan(11 * 80)
    expect(Math.abs(canvas - svg) / svg).toBeLessThan(0.15)
  })
})

const COMBOS = {
  'a scatter of outliers over box plots': {
    options: {
      series: [
        {
          name: 'box',
          type: 'boxPlot',
          data: [
            { x: 'a', y: [54, 66, 69, 75, 88] },
            { x: 'b', y: [43, 65, 69, 76, 81] },
            { x: 'c', y: [31, 39, 45, 51, 59] },
          ],
        },
        {
          name: 'outliers',
          type: 'scatter',
          data: [
            { x: 'a', y: 32 },
            { x: 'b', y: 25 },
            { x: 'c', y: 95 },
          ],
        },
      ],
      chart: { type: 'boxPlot', height: 350 },
    },
    series: 1,
    texts: ['outliers: 32', 'outliers: 25', 'outliers: 95'],
  },
  'line markers over columns': {
    options: {
      series: [
        { name: 'sales', type: 'column', data: [10, 20, 30, 25] },
        { name: 'trend', type: 'line', data: [15, 25, 12, 30] },
      ],
      chart: { type: 'line', height: 350 },
      markers: { size: 6 },
      xaxis: { categories: ['a', 'b', 'c', 'd'] },
    },
    series: 1,
    texts: ['trend: 15', 'trend: 25', 'trend: 12', 'trend: 30'],
  },
  'a plain scatter chart': {
    options: {
      series: [
        {
          name: 's',
          data: [
            [1, 20],
            [2, 6],
            [3, 19],
          ],
        },
      ],
      chart: { type: 'scatter', height: 350 },
    },
    series: 0,
    texts: ['s: 20', 's: 6', 's: 19'],
  },
  // A bubble's radius is its value: neither renderer grows it, so the box
  // clears the bubble alone.
  'a bubble chart': {
    options: {
      series: [
        {
          name: 'b',
          data: [
            [1, 20, 30],
            [2, 6, 10],
            [3, 19, 50],
          ],
        },
      ],
      chart: { type: 'bubble', height: 350 },
    },
    series: 0,
    texts: ['b: 20', 'b: 6', 'b: 19'],
  },
}

test.describe('Intersect tooltips on markers beside bar-likes', () => {
  for (const [name, { options, series, texts }] of Object.entries(COMBOS)) {
    test(`${name}: each marker captions itself, on SVG and on canvas alike`, async ({
      page,
    }) => {
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      await mountChart(page, {
        ...options,
        chart: { ...options.chart, animations: { enabled: false } },
        tooltip: { shared: false, intersect: true },
      })
      await useRenderer(page, 'svg')
      const centres = await markerCentres(page, series)
      expect(centres.length).toBe(texts.length)

      const svg = []
      for (const at of centres) {
        await hover(page, at)
        svg.push(await readTooltip(page))
      }
      await useRenderer(page, 'canvas')
      const canvas = []
      for (const at of centres) {
        await hover(page, at)
        canvas.push(await readTooltip(page))
      }

      for (const [k, text] of texts.entries()) {
        for (const [label, tt] of [
          ['svg', svg[k]],
          ['canvas', canvas[k]],
        ]) {
          expect(tt.active, `${label} ${k}`).toBe(true)
          expect(tt.text, `${label} ${k}`).toContain(text)
        }
        expect(canvas[k].text).toBe(svg[k].text)
        expect(Math.abs(canvas[k].left - svg[k].left)).toBeLessThanOrEqual(
          TOLERANCE_PX,
        )
        expect(Math.abs(canvas[k].top - svg[k].top)).toBeLessThanOrEqual(
          TOLERANCE_PX,
        )
      }
      expect(errors).toEqual([])
    })
  }

  test('a canvas scatter: off every marker the box closes, and a click reports its marker', async ({
    page,
  }) => {
    const { options } = COMBOS['a plain scatter chart']
    await mountChart(page, {
      ...options,
      chart: { ...options.chart, animations: { enabled: false } },
      tooltip: { shared: false, intersect: true },
    })
    await page.evaluate(() => {
      window.chart.addEventListener('markerClick', (e, ctx, opts) => {
        window.clicked = [opts.seriesIndex, opts.dataPointIndex]
      })
    })
    await useRenderer(page, 'svg')
    const [, second] = await markerCentres(page, 0)
    await useRenderer(page, 'canvas')

    await hover(page, second)
    expect((await readTooltip(page)).active).toBe(true)
    await hover(page, { x: second.x + 40, y: second.y - 60 })
    expect((await readTooltip(page)).active).toBe(false)

    await hover(page, second)
    await page.mouse.down()
    await page.mouse.up()
    await page.waitForTimeout(100)
    expect(await page.evaluate(() => window.clicked)).toEqual([0, 1])
  })
})

test.describe('A pointer resting on a painted marker', () => {
  // The series' hover dot grown over a painted marker took the pointer from
  // the canvas under it, which ended the hover: the box closed on a pointer
  // that had not moved. Past the painted rim and inside the dot, the dot read
  // as a marker node with no data point and threw on every move.
  const RESTING = {
    'a discrete marker on a line without markers': {
      chart: { type: 'line', height: 350 },
      series: [{ name: 'a', data: [10, 41, 35, 51] }],
      markers: {
        size: 0,
        discrete: [{ seriesIndex: 0, dataPointIndex: 1, size: 6 }],
      },
      xaxis: { categories: ['q', 'r', 's', 't'] },
    },
    'a bubble': {
      chart: { type: 'bubble', height: 350 },
      series: [
        {
          name: 'b',
          data: [
            [1, 20, 30],
            [2, 6, 10],
            [3, 19, 50],
          ],
        },
      ],
    },
  }
  // From afar, from nearby, and creeping in from below and from the left.
  const APPROACHES = [
    [
      [-40, -40],
      [0, 0],
    ],
    [
      [-2, -2],
      [0, 0],
    ],
    [
      [0, 30],
      [0, 3],
      [0, 0],
    ],
    [
      [-30, 0],
      [-3, 0],
      [0, 0],
    ],
  ]

  for (const [name, options] of Object.entries(RESTING)) {
    test(`${name}: keeps its box open, on SVG and on canvas alike`, async ({
      page,
    }) => {
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      await mountChart(page, {
        ...options,
        chart: { ...options.chart, animations: { enabled: false } },
        tooltip: { shared: false, intersect: true },
      })
      for (const renderer of ['svg', 'canvas']) {
        await useRenderer(page, renderer)
        const at = await page.evaluate(() => {
          const w = window.chart.w
          const r = document
            .querySelector('.apexcharts-svg')
            .getBoundingClientRect()
          return {
            x: r.left + w.layout.translateX + w.globals.seriesXvalues[0][1],
            y: r.top + w.layout.translateY + w.globals.seriesYvalues[0][1],
          }
        })
        for (const path of APPROACHES) {
          await page.mouse.move(5, 5)
          await page.waitForTimeout(50)
          for (const [dx, dy] of path) {
            await page.mouse.move(at.x + dx, at.y + dy)
            await page.waitForTimeout(60)
          }
          await page.waitForTimeout(200)
          const tt = await readTooltip(page)
          expect(tt.active, `${renderer} ${JSON.stringify(path)}`).toBe(true)
        }
        // out across the rim, a pixel at a time
        for (let d = 1; d <= 14; d++) {
          await page.mouse.move(at.x + d, at.y)
          await page.waitForTimeout(30)
        }
      }
      expect(errors).toEqual([])
    })
  }
})

test.describe('Keyboard focus on markers, on SVG and on canvas alike', () => {
  // A painted marker had no node to focus or to place the box by, so the
  // box opened in the chart's corner (a column combo's SVG chart did too:
  // its columns were taken for points of a line).
  for (const name of [
    'a plain scatter chart',
    'a scatter of outliers over box plots',
    'line markers over columns',
  ]) {
    test(`${name}: each focused mark puts the box where it goes on SVG`, async ({
      page,
    }) => {
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      const { options } = COMBOS[name]
      // Each renderer on a chart of its own, focused from the start: the
      // box's size is measured as it is shown, so a walk taken after another
      // starts from a different size.
      const mount = (renderer) =>
        mountChart(page, {
          ...options,
          chart: {
            ...options.chart,
            renderer,
            animations: { enabled: false },
            accessibility: {
              enabled: true,
              keyboard: { enabled: true, navigation: { enabled: true } },
            },
          },
          tooltip: { shared: false, intersect: true },
        })
      const walk = async () => {
        await page.evaluate(() => {
          document.activeElement?.blur?.()
          document.querySelector('.apexcharts-svg').focus()
        })
        const out = []
        for (const key of ['ArrowRight', 'ArrowRight', 'ArrowDown']) {
          await page.keyboard.press(key)
          await page.waitForTimeout(120)
          // where it was put, not where its slide there has got to
          out.push({
            ...(await readTooltip(page)),
            ...(await page.evaluate(() => {
              const el = document.querySelector(
                '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
              )
              return {
                left: parseFloat(el.style.left),
                top: parseFloat(el.style.top),
              }
            })),
          })
        }
        return out
      }
      await mount('svg')
      const svg = await walk()
      await mount('canvas')
      expect(
        await page.evaluate(() => window.chart.w.globals.activeRenderer?.kind),
      ).toBe('canvas')
      const canvas = await walk()
      for (const [k, tt] of canvas.entries()) {
        expect(tt.active, `${k}`).toBe(true)
        expect(tt.text, `${k}`).toBe(svg[k].text)
        expect(Math.abs(tt.left - svg[k].left), `${k} left`).toBeLessThan(2)
        expect(Math.abs(tt.top - svg[k].top), `${k} top`).toBeLessThan(2)
      }
      expect(errors).toEqual([])
    })
  }
})
