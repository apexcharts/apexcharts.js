/**
 * A series colour written in CSS Color 4/5 syntax must render the same,
 * within rounding, as the same colour written as hex, on every surface that
 * paints a series colour: solid fills with fill.opacity, line strokes,
 * gradient stops, patterns, heatmap and treemap value shades, legend markers,
 * and the hover and active states.
 *
 * Fill used to route these by a substring test for "rgb", which also matches
 * srgb, a98-rgb and color-mix(in srgb ...), and the hex maths behind it reads
 * only integer comma rgb(), so the marks went #999999 grey and gradient stops
 * black. jsdom cannot compute these colours, hence real Chromium.
 *
 * Each test renders the chart twice, once with the input and once with its
 * hex (the browser's own sRGB reading of the input), and compares what each
 * surface paints: every colour is composited over white and over black on a
 * 1px canvas, its opacity attribute applied, so colour and alpha both count.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
// APEX_BUNDLE runs the same tests against another build (its canvas
// renderer is read from the features folder next to it).
const BUNDLE = process.env.APEX_BUNDLE
  ? resolve(process.env.APEX_BUNDLE)
  : resolve(__dirname, '..', '..', '..', 'dist', 'apexcharts.js')
const CANVAS = resolve(dirname(BUNDLE), 'features', 'renderer-canvas.js')

// #e4572e in each syntax, and in-gamut colours for the spaces that need
// conversion. The control is whatever hex the browser paints the input as.
const INPUTS = {
  rgbSpace: 'rgb(228 87 46)',
  rgbDecimal: 'rgb(228.2, 87.4, 46)',
  rgbPercent: 'rgb(89.4118%, 34.1176%, 18.0392%)',
  rgbaSlash: 'rgba(228 87 46 / 0.5)',
  rgbSlash: 'rgb(228 87 46 / 0.5)',
  srgb: 'color(srgb 0.894118 0.341176 0.180392)',
  srgbLinear: 'color(srgb-linear 0.7758 0.0954 0.0273)',
  a98: 'color(a98-rgb 0.83 0.37 0.22)',
  colorMixSrgb: 'color-mix(in srgb, #e4572e 70%, #17bebb)',
  rgbFrom: 'rgb(from #e4572e r g b)',
}
// The maths cannot read these at all; their solid fills keep dropping
// fill.opacity as named colours do (a separate decision), so only the value
// shades, which used to go grey, are held to the hex here.
const SHADE_ONLY = {
  oklch: 'oklch(0.63 0.19 37)',
  displayP3: 'color(display-p3 0.83 0.37 0.22)',
}
const DELIVERY = ['colors', 'series token', 'accent token', 'var()']

const S2 = [
  { name: 's1', data: [30, 60, 45] },
  { name: 's2', data: [20, 40, 50] },
]
const XY = (type, extra = {}) => ({
  series: S2,
  xaxis: { categories: ['A', 'B', 'C'] },
  dataLabels: { enabled: false },
  ...extra,
  chart: {
    type,
    height: 240,
    toolbar: { show: false },
    animations: { enabled: false },
    ...(extra.chart || {}),
  },
})
const CELLS = [
  {
    name: 's1',
    data: [
      { x: 'a', y: 10 },
      { x: 'b', y: 50 },
      { x: 'c', y: 90 },
    ],
  },
]
const SURFACES = {
  barSolid: XY('bar', { fill: { opacity: 0.5 } }),
  barGradient: XY('bar', { fill: { type: 'gradient' } }),
  area: XY('area'),
  line: XY('line'),
  pattern: XY('bar', { fill: { type: 'pattern' } }),
  pie: {
    series: [40, 60],
    labels: ['a', 'b'],
    dataLabels: { enabled: false },
    fill: { opacity: 0.5 },
    chart: { type: 'pie', height: 240, animations: { enabled: false } },
  },
  heatmap: {
    series: CELLS,
    dataLabels: { enabled: false },
    chart: { type: 'heatmap', height: 200, animations: { enabled: false } },
  },
  treemap: {
    series: CELLS,
    chart: { type: 'treemap', height: 200, animations: { enabled: false } },
  },
}

/* ------------------------------------------------------------ page helpers */
function installHelpers() {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const over = (css, op, bg) => {
    ctx.globalAlpha = 1
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1, 1)
    ctx.globalAlpha = op
    ctx.fillStyle = '#ff00ff' // shows through when css does not parse
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3)
  }
  /** A colour and an opacity, as six numbers: over white, then over black. */
  const paint = (css, op = 1) => [
    ...over(css, +op, '#fff'),
    ...over(css, +op, '#000'),
  ]
  const hexOf = (css) =>
    '#' +
    over(css, 1, '#fff')
      .map((v) => (v | 256).toString(16).slice(1))
      .join('')
  const all = (root, sel) => [...root.querySelectorAll(sel)]
  const ref = (root, el) => {
    const m = /url\(\s*['"]?#([^'")]+)/.exec(el.getAttribute('fill') || '')
    return m && root.querySelector(`#${CSS.escape(m[1])}`)
  }
  const fillOf = (el) => {
    const cs = getComputedStyle(el)
    return {
      raw: el.getAttribute('fill'),
      paint: paint(cs.fill, cs.fillOpacity),
    }
  }
  const series1 = '.apexcharts-series[rel="1"]'

  /** What each surface paints, as a list of { raw, paint }. */
  const READ = {
    barSolid: (root) =>
      all(root, `${series1} .apexcharts-bar-area`).map(fillOf),
    barGradient: (root) => READ.stops(root, `${series1} .apexcharts-bar-area`),
    area: (root) => READ.stops(root, `${series1} path.apexcharts-area`),
    stops(root, sel) {
      const el = all(root, sel).find((e) => ref(root, e))
      if (!el) return [{ raw: 'no gradient', paint: [] }]
      return all(ref(root, el), 'stop').map((s) => {
        const cs = getComputedStyle(s)
        return {
          raw: s.getAttribute('stop-color'),
          paint: paint(cs.stopColor, cs.stopOpacity),
        }
      })
    },
    line: (root) =>
      all(root, `${series1} path.apexcharts-line`).map((el) => {
        const cs = getComputedStyle(el)
        return {
          raw: el.getAttribute('stroke'),
          paint: paint(cs.stroke, cs.strokeOpacity),
        }
      }),
    pattern: (root) => {
      const el = all(root, `${series1} .apexcharts-bar-area`)[0]
      const p = el && ref(root, el)
      if (!p) return [{ raw: 'no pattern', paint: [] }]
      return all(p, '[stroke]').map((n) => ({
        raw: n.getAttribute('stroke'),
        paint: paint(getComputedStyle(n).stroke),
      }))
    },
    pie: (root) => all(root, '.apexcharts-pie-slice-0').map(fillOf),
    heatmap: (root) => all(root, '.apexcharts-heatmap-rect').map(fillOf),
    treemap: (root) => all(root, '.apexcharts-treemap-rect').map(fillOf),
    legend: (root) => {
      const m = root.querySelector(
        '.apexcharts-legend-series[rel="1"] .apexcharts-legend-marker',
      )
      for (const n of m ? [m, ...m.querySelectorAll('*')] : []) {
        const cs = getComputedStyle(n)
        for (const v of [cs.fill, cs.backgroundColor]) {
          if (v && v !== 'none' && !/rgba\(0, 0, 0, 0\)/.test(v)) {
            return [{ raw: v, paint: paint(v) }]
          }
        }
      }
      return [{ raw: 'no legend marker', paint: [] }]
    },
  }

  /** Mount `options` with CSS custom properties on its container. */
  async function mount(options, vars) {
    const host = document.getElementById('mount')
    host.innerHTML = ''
    const box = document.createElement('div')
    box.style.width = '480px'
    for (const [k, v] of Object.entries(vars)) box.style.setProperty(k, v)
    host.appendChild(box)
    const target = document.createElement('div')
    box.appendChild(target)
    if (window.chart) window.chart.destroy()
    window.chart = new ApexCharts(target, options)
    await window.chart.render()
    return box
  }

  window.__M = { paint, hexOf, READ, mount }
}

/** Options and container vars that deliver `color` as series 1's colour. */
function deliver(delivery, color, options) {
  const o = JSON.parse(JSON.stringify(options))
  switch (delivery) {
    case 'colors':
      return { options: { ...o, colors: [color, '#17bebb'] }, vars: {} }
    case 'series token':
      return {
        options: o,
        vars: { '--apx-series-1': color, '--apx-series-2': '#17bebb' },
      }
    case 'accent token':
      return { options: o, vars: { '--apx-accent': color } }
    case 'var()':
      return {
        options: { ...o, colors: ['var(--c)', '#17bebb'] },
        vars: { '--c': color },
      }
  }
}

async function setup(page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('about:blank')
  await page.setContent('<div id="mount"></div>')
  await page.addScriptTag({ path: BUNDLE })
  await page.evaluate(installHelpers)
  return errors
}

/** Render `surface` once per colour and read what it paints. */
async function read(page, surface, delivery, color, readKey = surface) {
  const { options, vars } = deliver(
    delivery,
    color,
    SURFACES[surface] || SURFACES.barSolid,
  )
  return page.evaluate(
    async ({ options, vars, readKey }) => {
      const box = await window.__M.mount(options, vars)
      return window.__M.READ[readKey](box)
    },
    { options, vars, readKey },
  )
}

const TOL = 4
function compare(label, got, want) {
  const bad = []
  if (got.length !== want.length || !got.length) {
    bad.push(`${label}: ${got.length} paints vs ${want.length} for the hex`)
  }
  got.forEach((g, i) => {
    const w = want[i]
    if (!w) return
    const off =
      g.paint.length !== 6 ||
      g.paint.some((v, k) => Math.abs(v - w.paint[k]) > TOL)
    if (off) {
      bad.push(
        `${label}[${i}]: ${g.raw} paints ${JSON.stringify(g.paint)}, hex ${w.raw} paints ${JSON.stringify(w.paint)}`,
      )
    }
  })
  return bad
}

async function hexFor(page, color) {
  return page.evaluate((c) => window.__M.hexOf(c), color)
}

for (const [name, color] of Object.entries(INPUTS)) {
  test.describe(`${name}: ${color}`, () => {
    for (const delivery of DELIVERY) {
      test(`renders as its hex, delivered through ${delivery}`, async ({
        page,
      }) => {
        const errors = await setup(page)
        // A slash alpha reads against the comma rgba(), its legacy spelling
        // (an 8-digit hex takes a different, older route through gradients).
        const control =
          name === 'rgbaSlash' || name === 'rgbSlash'
            ? 'rgba(228,87,46,0.5)'
            : await hexFor(page, color)
        const bad = []
        const reads = [...Object.keys(SURFACES), 'legend']
        for (const key of reads) {
          const surface = key === 'legend' ? 'barSolid' : key
          const got = await read(page, surface, delivery, color, key)
          const want = await read(page, surface, delivery, control, key)
          bad.push(...compare(key, got, want))
          if (key !== 'legend' && key !== 'pattern') {
            const grey = got.filter((g) =>
              /153,\s*153,\s*153/.test(g.raw || ''),
            )
            if (grey.length) bad.push(`${key}: grey ${grey[0].raw}`)
          }
        }
        expect(errors).toEqual([])
        expect(bad, bad.join('\n')).toEqual([])
      })
    }
  })
}

for (const [name, color] of Object.entries(SHADE_ONLY)) {
  test.describe(`${name}: ${color}`, () => {
    for (const delivery of DELIVERY) {
      test(`heatmap and treemap shades match its hex, through ${delivery}`, async ({
        page,
      }) => {
        const errors = await setup(page)
        const control = await hexFor(page, color)
        const bad = []
        for (const key of ['heatmap', 'treemap']) {
          const got = await read(page, key, delivery, color)
          const want = await read(page, key, delivery, control)
          bad.push(...compare(key, got, want))
        }
        expect(errors).toEqual([])
        expect(bad, bad.join('\n')).toEqual([])
      })
    }
  })
}

/* --------------------------------------------- hover and active states */
test.describe('hover and active states', () => {
  for (const [name, color] of Object.entries({
    srgb: INPUTS.srgb,
    rgbSpace: INPUTS.rgbSpace,
  })) {
    test(`${name}: the state filter lands on the same paint as the hex`, async ({
      page,
    }) => {
      await setup(page)
      const control = await hexFor(page, color)
      const states = async (c) => {
        const { options } = deliver('colors', c, SURFACES.barSolid)
        await page.evaluate(
          async ({ options }) => {
            await window.__M.mount(options, {})
          },
          { options },
        )
        const box = await page
          .locator('.apexcharts-series[rel="1"] .apexcharts-bar-area')
          .first()
          .boundingBox()
        const cx = box.x + box.width / 2
        const cy = box.y + box.height / 2
        const sample = () =>
          page.evaluate(() => {
            const el = document.querySelector(
              '.apexcharts-series[rel="1"] .apexcharts-bar-area',
            )
            const cs = getComputedStyle(el)
            return {
              filter:
                (el.getAttribute('filter') || cs.filter || 'none') !== 'none',
              paint: window.__M.paint(cs.fill, cs.fillOpacity),
            }
          })
        await page.mouse.move(cx - 3, cy - 3)
        await page.mouse.move(cx, cy, { steps: 3 })
        const hover = await sample()
        await page.mouse.click(cx, cy)
        const active = await sample()
        await page.mouse.move(0, 0)
        return { hover, active }
      }
      const got = await states(color)
      const want = await states(control)
      expect(got.hover.filter, 'hover filter').toBe(want.hover.filter)
      expect(got.active.filter, 'active filter').toBe(want.active.filter)
      for (const k of ['hover', 'active']) {
        got[k].paint.forEach((v, i) =>
          expect(
            Math.abs(v - want[k].paint[i]),
            `${k} paint ${i}`,
          ).toBeLessThanOrEqual(TOL),
        )
      }
    })
  }
})

/* ------------------------------------------------------ canvas renderer */
test.describe('canvas renderer', () => {
  // The canvas takes the fill string as its fillStyle; a color-mix() of a
  // literal colour parses there, so the bitmap matches the hex one.
  for (const [surface, options] of Object.entries({
    bar: SURFACES.barSolid,
    heatmap: SURFACES.heatmap,
  })) {
    for (const color of [INPUTS.srgb, INPUTS.colorMixSrgb, SHADE_ONLY.oklch]) {
      if (surface === 'bar' && color === SHADE_ONLY.oklch) continue
      test(`${surface} ${color} paints its hex`, async ({ page }) => {
        const errors = await setup(page)
        await page.addScriptTag({ path: CANVAS })
        const control = await hexFor(page, color)
        const bitmap = (c) =>
          page.evaluate(
            async ({ options }) => {
              await window.__M.mount(options, {})
              await new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
              )
              const kind = window.chart.w.globals.activeRenderer?.kind
              const cv = document.querySelector('#mount canvas')
              if (!cv) return { kind, data: [] }
              const d = cv
                .getContext('2d')
                .getImageData(0, 0, cv.width, cv.height).data
              return { kind, data: Array.from(d) }
            },
            {
              options: {
                ...deliver('colors', c, options).options,
                chart: { ...options.chart, renderer: 'canvas' },
              },
            },
          )
        const got = await bitmap(color)
        const want = await bitmap(control)
        expect(got.kind).toBe('canvas')
        expect(got.data.length).toBe(want.data.length)
        let worst = 0
        let painted = 0
        for (let i = 0; i < got.data.length; i++) {
          worst = Math.max(worst, Math.abs(got.data[i] - want.data[i]))
          if (i % 4 === 3 && got.data[i] > 0) painted++
        }
        expect(painted).toBeGreaterThan(0)
        expect(worst).toBeLessThanOrEqual(TOL)
        expect(errors).toEqual([])
      })
    }
  }
})

/* ------------------------------------------- a gradient that fades to 0 */
test.describe('a gradient that fades to opacity 0', () => {
  // The end stop is hidden by its stop-opacity, but its colour is what the
  // gradient fades through. Given as 'transparent' (transparent black), a
  // fade-out area passed through a grey band; it must fade as the hex does.
  const FADE = (color, to) => ({
    series: [{ name: 's1', data: [10, 10, 10, 10] }],
    colors: [color],
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        opacityFrom: 1,
        opacityTo: 0,
        stops: [0, 100],
        ...(to ? { gradientToColors: [to] } : {}),
      },
    },
    stroke: { width: 0 },
    chart: {
      type: 'area',
      height: 200,
      width: 300,
      sparkline: { enabled: true },
      animations: { enabled: false },
    },
  })

  /** The area's pixels at 30, 50, 70 and 90% of its height. */
  async function column(page, options) {
    await page.evaluate(
      async ({ options }) => {
        await window.__M.mount(options, {})
      },
      { options },
    )
    const box = await page.locator('path.apexcharts-area').first().boundingBox()
    const x = Math.round(box.x + box.width / 2)
    const y = Math.round(box.y)
    const h = Math.round(box.height)
    const png = await page.screenshot({ clip: { x, y, width: 1, height: h } })
    return page.evaluate(
      async ({ b64 }) => {
        const img = new Image()
        img.src = 'data:image/png;base64,' + b64
        await img.decode()
        const cv = document.createElement('canvas')
        cv.width = img.width
        cv.height = img.height
        const cx = cv.getContext('2d')
        cx.drawImage(img, 0, 0)
        return [0.3, 0.5, 0.7, 0.9].map((f) => {
          const py = Math.min(img.height - 1, Math.round(f * img.height))
          return [...cx.getImageData(0, py, 1, 1).data].slice(0, 3)
        })
      },
      { b64: png.toString('base64') },
    )
  }

  const near = (got, want) =>
    got.every((px, i) => px.every((v, k) => Math.abs(v - want[i][k]) <= 6))

  for (const color of [
    SHADE_ONLY.oklch,
    SHADE_ONLY.displayP3,
    'lab(55 50 50)',
  ]) {
    test(`${color} fades as its hex does`, async ({ page }) => {
      const errors = await setup(page)
      const control = await hexFor(page, color)
      const got = await column(page, FADE(color))
      const want = await column(page, FADE(control))
      expect(
        near(got, want),
        `${JSON.stringify(got)} vs hex ${JSON.stringify(want)}`,
      ).toBe(true)
      expect(errors).toEqual([])
    })
  }

  test('a color(srgb ...) gradientToColors fades as its hex does', async ({
    page,
  }) => {
    const errors = await setup(page)
    const to = 'color(srgb 0.0902 0.745 0.733)'
    const control = await hexFor(page, to)
    const got = await column(page, FADE('#e4572e', to))
    const ends = await page.evaluate(() =>
      [...document.querySelectorAll('#mount linearGradient stop')].map((s) =>
        s.getAttribute('stop-color'),
      ),
    )
    expect(ends.slice(1)).toEqual([to, to])
    const want = await column(page, FADE('#e4572e', control))
    // Chromium blends a color() stop with a different hue in premultiplied
    // space and a legacy rgba() one without, so the two fades differ in hue
    // along the way. What must not happen is the darkening of a fade through
    // transparent black: no channel may fall below the hex's.
    const darker = got.some((px, i) => px.some((v, k) => v < want[i][k] - 6))
    expect(
      darker,
      `${JSON.stringify(got)} vs hex ${JSON.stringify(want)}`,
    ).toBe(false)
    expect(errors).toEqual([])
  })
})
