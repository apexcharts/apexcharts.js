/**
 * Audit row C11 (plans/34-shadow-dom-audit.md): CSS variables as series
 * colours. `colors: ['var(--c1)', 'var(--c2)']` must reach the screen as the
 * variable's resolved colour on every surface that paints a series colour,
 * including the ones that do colour math (shades, alpha, gradients, tweens).
 *
 * Every check runs three ways:
 *  - light:  the variables sit on the light DOM element that holds the chart,
 *  - shadow: the chart sits in an open shadow root, the variables on its host,
 *  - nested: two open shadow roots deep, the variables on the OUTER host only.
 *
 * A check reads computed styles from the rendered DOM. A paint passes when it
 * computes to the expected rgb (within 3 per channel); `var(...)`, black,
 * NaN or a missing paint all fail. Each test appends its observation as one
 * JSON line to $C11_OUT when that is set, which is where the findings table
 * in plans/34-findings-charts-color.md comes from.
 *
 * Reproduction only: a failing test here is a recorded defect, not a broken
 * test.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { appendFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '..', '..', '..', 'dist')
const BUNDLE = resolve(DIST, 'apexcharts.js')
const HF = resolve(DIST, 'features', 'highlight-filter.js')

const VARS = { c1: '#e4572e', c2: '#17bebb', c1New: '#2e86ab' }
const MODES = ['light', 'shadow', 'nested']
const CATS = ['A', 'B', 'C', 'D', 'E']
const DATA1 = [30, 60, 45, 80, 20]
const DATA2 = [50, 25, 70, 35, 65]
const two = () => [
  { name: 's1', data: DATA1 },
  { name: 's2', data: DATA2 },
]
const base = (type, extra = {}) => ({
  series: two(),
  xaxis: { categories: CATS },
  dataLabels: { enabled: false },
  ...extra,
  chart: {
    type,
    height: 320,
    toolbar: { show: false },
    animations: { enabled: false },
    ...(extra.chart || {}),
  },
  colors: ['var(--c1)', 'var(--c2)'],
})

/* ---------------------------------------------------------------- checks --
 * `run` executes in the page as (ctx) => result, ctx = { root, chart, H, V,
 * varHost }. It must be self-contained (it is serialised). `point` names a
 * selector whose first match the real mouse moves onto before `run`; `click`
 * clicks it too.
 */
const CHECKS = [
  {
    id: 'C11-bar',
    surface: 'bar series fill and stroke',
    options: base('bar'),
    run: ({ root, H, V }) => {
      const els = H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area')
      return H.allPaint(els, ['fill', 'stroke'], V.c1, { strokeMayBeOther: true })
    },
  },
  {
    id: 'C11-line',
    surface: 'line series stroke',
    options: base('line'),
    run: ({ root, H, V }) =>
      H.allPaint(H.all(root, '.apexcharts-series[rel="1"] path.apexcharts-line'), ['stroke'], V.c1),
  },
  {
    id: 'C11-area',
    surface: 'area series stroke and gradient fill',
    options: base('area'),
    run: ({ root, H, V }) => {
      const a = H.allPaint(H.all(root, '.apexcharts-series[rel="1"] path.apexcharts-area').filter((e) => e.getAttribute('stroke') !== 'none'), ['stroke'], V.c1)
      const b = H.gradient(root, H.all(root, '.apexcharts-series[rel="1"] path.apexcharts-area').find((e) => /url/.test(e.getAttribute('fill') || '')), V.c1)
      return H.both(a, b)
    },
  },
  {
    id: 'C11-pie',
    surface: 'pie slice fill',
    options: {
      series: [40, 60],
      labels: ['a', 'b'],
      dataLabels: { enabled: false },
      chart: { type: 'pie', height: 320, animations: { enabled: false } },
      colors: ['var(--c1)', 'var(--c2)'],
    },
    run: ({ root, H, V }) =>
      H.both(
        H.allPaint(H.all(root, '.apexcharts-pie-slice-0'), ['fill'], V.c1),
        H.allPaint(H.all(root, '.apexcharts-pie-slice-1'), ['fill'], V.c2)
      ),
  },
  {
    id: 'C11-radialBar',
    surface: 'radialBar arc stroke',
    options: {
      series: [40, 70],
      labels: ['a', 'b'],
      chart: { type: 'radialBar', height: 320, animations: { enabled: false } },
      colors: ['var(--c1)', 'var(--c2)'],
    },
    run: ({ root, H, V }) =>
      H.both(
        H.allPaint(H.all(root, 'path.apexcharts-radialbar-slice-0'), ['stroke'], V.c1),
        H.allPaint(H.all(root, 'path.apexcharts-radialbar-slice-1'), ['stroke'], V.c2)
      ),
  },
  {
    id: 'C11-treemap',
    surface: 'treemap tile fill (default value shades)',
    options: {
      series: [{ data: [{ x: 'a', y: 50 }, { x: 'b', y: 30 }, { x: 'c', y: 10 }] }],
      chart: { type: 'treemap', height: 320, animations: { enabled: false } },
      colors: ['var(--c1)', 'var(--c2)'],
    },
    run: ({ root, H, V }) => H.allHue(H.all(root, '.apexcharts-treemap-rect'), 'fill', V.c1),
  },
  {
    id: 'C11-hover',
    surface: 'hover state (states.hover lighten) on a bar',
    options: base('bar'),
    point: '.apexcharts-series[rel="1"] .apexcharts-bar-area',
    run: async ({ root, H, V }) => {
      await H.frames(4)
      const el = H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area')[0]
      return H.both(H.allPaint([el], ['fill'], V.c1), H.filterRef(root, el, true))
    },
  },
  {
    id: 'C11-active',
    surface: 'active state (states.active darken) on a clicked bar',
    options: base('bar'),
    point: '.apexcharts-series[rel="1"] .apexcharts-bar-area',
    click: true,
    run: async ({ root, H, V }) => {
      await H.frames(4)
      const el = H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area')[0]
      return H.both(H.allPaint([el], ['fill'], V.c1), H.filterRef(root, el, true))
    },
  },
  {
    id: 'C11-gradient',
    surface: 'fill.type gradient on bars (stops are derived shades)',
    options: base('bar', { fill: { type: 'gradient' } }),
    run: ({ root, H, V }) =>
      H.gradient(root, H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area')[0], V.c1),
  },
  {
    id: 'C11-opacity',
    surface: 'fill.opacity 0.5 on bars',
    options: base('bar', { fill: { opacity: 0.5 } }),
    run: ({ root, H, V }) => {
      const els = H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area')
      const r = H.allPaint(els, ['fill'], V.c1)
      const a = els.map((e) => H.effAlpha(e))
      const okA = a.length > 0 && a.every((x) => Math.abs(x - 0.5) < 0.03)
      return { ok: r.ok && okA, detail: `${r.detail}; effective alpha ${JSON.stringify(a)}` }
    },
  },
  {
    id: 'C11-legend',
    surface: 'legend marker',
    options: base('bar', { legend: { show: true } }),
    run: ({ root, H, V }) => {
      const m = H.all(root, '.apexcharts-legend-series').map((s) => s.querySelector('.apexcharts-legend-marker'))
      return H.both(H.markerPaint(m[0], V.c1), H.markerPaint(m[1], V.c2))
    },
  },
  {
    id: 'C11-tooltip',
    surface: 'tooltip marker',
    options: base('bar', { tooltip: { shared: true, intersect: false } }),
    point: '.apexcharts-series[rel="1"] .apexcharts-bar-area',
    run: async ({ root, H, V }) => {
      await H.frames(6)
      const m = H.all(root, '.apexcharts-tooltip .apexcharts-tooltip-marker')
      if (!m.length) return { ok: false, detail: 'no tooltip marker rendered' }
      return H.both(H.markerPaint(m[0], V.c1), H.markerPaint(m[1], V.c2))
    },
  },
  {
    id: 'C11-dlbg',
    surface: 'data label background (line, background enabled)',
    options: base('line', {
      dataLabels: { enabled: true, background: { enabled: true } },
    }),
    run: ({ root, H, V }) => {
      const rects = H.all(root, '.apexcharts-series[rel="1"] .apexcharts-data-labels rect, .apexcharts-datalabels-group rect')
      const all = rects.length ? rects : H.all(root, '.apexcharts-data-labels rect')
      if (!all.length) return { ok: false, detail: 'no data label background rect' }
      return H.allPaint([all[0]], ['fill'], V.c1)
    },
  },
  {
    id: 'C11-barRanges',
    surface: 'plotOptions.bar.colors.ranges colour',
    options: base('bar', {
      series: [{ name: 's1', data: DATA1 }],
      plotOptions: { bar: { colors: { ranges: [{ from: 0, to: 40, color: 'var(--c2)' }] } } },
    }),
    run: ({ root, H, V }) => {
      const els = H.all(root, '.apexcharts-bar-area')
      // DATA1 values <= 40 are at j = 0 and 4.
      const low = els.filter((e) => ['0', '4'].includes(e.getAttribute('j')))
      const high = els.filter((e) => !['0', '4'].includes(e.getAttribute('j')))
      return H.both(H.allPaint(low, ['fill'], V.c2), H.allPaint(high, ['fill'], V.c1))
    },
  },
  {
    id: 'C11-heatmapShade',
    surface: 'heatmap default value shades from the series colour',
    options: base('heatmap', { series: [{ name: 's1', data: DATA1 }] }),
    run: ({ root, H, V }) => H.allHue(H.all(root, '.apexcharts-heatmap-rect'), 'fill', V.c1),
  },
  {
    id: 'C11-heatmapScale',
    surface: 'heatmap colorScale.ranges colour',
    options: base('heatmap', {
      series: [{ name: 's1', data: DATA1 }],
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [
              { from: 0, to: 40, color: 'var(--c2)' },
              { from: 41, to: 100, color: 'var(--c1)' },
            ],
          },
        },
      },
    }),
    run: ({ root, H, V }) => {
      const els = H.all(root, '.apexcharts-heatmap-rect')
      const low = els.filter((e) => ['0', '4'].includes(e.getAttribute('j')))
      const high = els.filter((e) => !['0', '4'].includes(e.getAttribute('j')))
      return H.both(H.allHue(low, 'fill', V.c2), H.allHue(high, 'fill', V.c1))
    },
  },
  {
    id: 'C11-highlightFilter',
    surface: 'highlightFilter part fill (features/highlight-filter.js)',
    hf: true,
    options: base('bar', { highlightFilter: { data: null } }),
    run: async ({ root, chart, H, V }) => {
      chart.highlightFilter.set([[10, 30, 20, 40, 5], [20, 10, 30, 10, 30]], { animate: false })
      await H.frames(4)
      const p1 = H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-highlight-part')
      const p2 = H.all(root, '.apexcharts-series[rel="2"] .apexcharts-bar-highlight-part')
      if (!p1.length) return { ok: false, detail: 'no highlight parts rendered' }
      return H.both(H.allPaint(p1, ['fill'], V.c1), H.allPaint(p2, ['fill'], V.c2))
    },
  },
  {
    id: 'C11-tween',
    surface: 'animated updateSeries, fill read every frame mid-tween',
    options: base('bar', { chart: { animations: { enabled: true, speed: 600, dynamicAnimation: { enabled: true, speed: 600 } } } }),
    settle: 1500,
    run: async ({ root, chart, H, V }) => {
      chart.updateSeries([
        { name: 's1', data: window.DATA2_ },
        { name: 's2', data: window.DATA1_ },
      ])
      const seen = []
      for (let f = 0; f < 30; f++) {
        await H.frames(1)
        const el = H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area')[0]
        if (el) seen.push(H.paint(el, 'fill', V.c1))
      }
      const bad = seen.filter((s) => !s.ok)
      return {
        ok: seen.length > 0 && bad.length === 0,
        detail: `${seen.length} frames, ${bad.length} off; first bad: ${bad[0] ? bad[0].detail : 'none'}`,
      }
    },
  },
  {
    id: 'C11-tweenColour',
    surface: 'animated updateOptions colours var(--c1) to var(--c2), every frame',
    options: base('bar', { chart: { animations: { enabled: true, speed: 600, dynamicAnimation: { enabled: true, speed: 600 } } } }),
    settle: 1500,
    run: async ({ root, chart, H, V }) => {
      chart.updateOptions({ colors: ['var(--c2)', 'var(--c1)'] })
      const seen = []
      for (let f = 0; f < 40; f++) {
        await H.frames(1)
        const el = H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area')[0]
        if (el) seen.push(H.concrete(el, 'fill'))
      }
      await H.wait(700)
      const end = H.paint(H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area')[0], 'fill', V.c2)
      const bad = seen.filter((s) => !s.ok)
      return {
        ok: seen.length > 0 && bad.length === 0 && end.ok,
        detail: `${seen.length} frames, ${bad.length} non-concrete (first: ${bad[0] ? bad[0].detail : 'none'}); end ${end.detail}`,
      }
    },
  },
  {
    id: 'C11-exportSvg',
    surface: 'getSvgString() carries concrete colours',
    options: base('bar'),
    run: async ({ chart, H, V }) => {
      const svg = await chart.getSvgString()
      const hasVar = /var\(--c[12]/.test(svg)
      const hex = new RegExp(V.c1.slice(1), 'i').test(svg)
      const rgb = H.rgbOf(V.c1)
      const rgbHit = svg.includes(`rgb(${rgb.join(', ')}`) || svg.includes(`rgb(${rgb.join(',')}`)
      const m = svg.match(/fill="(var\([^"]*|color-mix[^"]*)"/)
      return {
        ok: !hasVar && (hex || rgbHit),
        detail: `contains var(--c): ${hasVar}; contains c1 concrete: ${hex || rgbHit}; sample: ${m ? m[1] : 'n/a'}`,
      }
    },
  },
  {
    id: 'C11-varChange',
    surface: 'change --c1 on the host, then updateOptions({}) (plain fill)',
    options: base('bar'),
    run: async ({ root, chart, H, V, varHost }) => {
      varHost.style.setProperty('--c1', V.c1New)
      await chart.updateOptions({})
      await H.frames(2)
      return H.allPaint(H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area'), ['fill'], V.c1New)
    },
  },
  {
    id: 'C11-varChangeGradient',
    surface: 'change --c1 on the host, then updateOptions({}) (gradient fill)',
    options: base('bar', { fill: { type: 'gradient' } }),
    run: async ({ root, chart, H, V, varHost }) => {
      varHost.style.setProperty('--c1', V.c1New)
      await chart.updateOptions({})
      await H.frames(2)
      return H.gradient(root, H.all(root, '.apexcharts-series[rel="1"] .apexcharts-bar-area')[0], V.c1New)
    },
  },
]

/* ------------------------------------------------------------ page helpers */
function installHelpers() {
  const rgbOf = (hex) => {
    const h = hex.replace('#', '')
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  }
  /** Computed colour -> [r,g,b,a] (0-255, alpha 0-1) or null. */
  const parse = (c) => {
    if (!c || typeof c !== 'string') return null
    let m = /^rgba?\(([^)]+)\)$/.exec(c.trim())
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
      if (p.slice(0, 3).some((x) => !Number.isFinite(x))) return null
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]
    }
    m = /^color\(srgb ([^)]+)\)$/.exec(c.trim())
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number)
      if (p.slice(0, 3).some((x) => !Number.isFinite(x))) return null
      return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]
    }
    return null
  }
  const near = (a, b, tol = 3) => a && b && [0, 1, 2].every((i) => Math.abs(a[i] - b[i]) <= tol)
  const hue = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
    if (d < 1e-6) return null
    let h
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    return (h * 60 + 360) % 360
  }
  const raw = (el, prop) =>
    (el.getAttribute(prop) || '') + (el.style && el.style[prop] ? ` style:${el.style[prop]}` : '')
  const comp = (el, prop) => getComputedStyle(el)[prop === 'stroke' ? 'stroke' : prop]
  const frames = (n) =>
    new Promise((res) => {
      let k = 0
      const step = () => (++k >= n ? res() : requestAnimationFrame(step))
      requestAnimationFrame(step)
    })
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  const H = {
    rgbOf,
    parse,
    frames,
    wait,
    all: (root, sel) => [...root.querySelectorAll(sel)],
    both: (...rs) => ({ ok: rs.every((r) => r.ok), detail: rs.map((r) => r.detail).join(' | ') }),
    /** A paint equal to `hex`. */
    paint(el, prop, hex) {
      if (!el) return { ok: false, detail: `${prop}: element missing` }
      const c = comp(el, prop)
      const p = parse(c)
      const ok = !!p && near(p, rgbOf(hex)) && p[3] > 0
      return { ok, detail: `${prop} raw="${raw(el, prop)}" computed="${c}"` }
    },
    /** Any concrete, visible, non-black colour. */
    concrete(el, prop) {
      if (!el) return { ok: false, detail: `${prop}: element missing` }
      const c = comp(el, prop)
      const p = parse(c)
      const black = p && p[0] < 2 && p[1] < 2 && p[2] < 2
      return { ok: !!p && !black && p[3] > 0, detail: `${prop} raw="${raw(el, prop)}" computed="${c}"` }
    },
    allPaint(els, props, hex, { strokeMayBeOther } = {}) {
      if (!els.length) return { ok: false, detail: 'no elements' }
      const out = []
      let ok = true
      for (const prop of props) {
        const r = H.paint(els[0], prop, hex)
        let pass = els.every((e) => H.paint(e, prop, hex).ok)
        // A bar stroke that is not the series colour by configuration (no var
        // in it) is not this row's business; one that names a var must resolve.
        if (!pass && prop === 'stroke' && strokeMayBeOther) {
          const rw = raw(els[0], 'stroke')
          if (!/var\(|color-mix/.test(rw)) pass = H.concrete(els[0], 'stroke').ok || /none|transparent/.test(rw)
        }
        ok = ok && pass
        out.push(r.detail)
      }
      return { ok, detail: out.join('; ') }
    },
    /** Every element's paint is concrete and of the same hue as `hex`. */
    allHue(els, prop, hex) {
      if (!els.length) return { ok: false, detail: 'no elements' }
      const h0 = hue(rgbOf(hex))
      const res = els.map((e) => {
        const c = comp(e, prop)
        const p = parse(c)
        const black = p && p[0] < 2 && p[1] < 2 && p[2] < 2
        const h = p ? hue(p) : null
        const dh = h == null ? 999 : Math.min(Math.abs(h - h0), 360 - Math.abs(h - h0))
        return { ok: !!p && !black && p[3] > 0 && dh < 20, c, r: raw(e, prop) }
      })
      return {
        ok: res.every((r) => r.ok),
        detail: `${prop} raw="${res[0].r}" computed=[${res.map((r) => r.c).join(', ')}]`,
      }
    },
    /** A url(#id) fill must point at a gradient in the same root whose stops
     * are concrete, and one of them must be `hex`. */
    gradient(root, el, hex) {
      if (!el) return { ok: false, detail: 'element missing' }
      const f = el.getAttribute('fill') || ''
      const m = /url\(\s*['"]?#([^'")]+)/.exec(f)
      if (!m) return { ok: false, detail: `fill is not a gradient url: "${f}"` }
      const g = root.getElementById ? root.getElementById(m[1]) : root.querySelector(`#${CSS.escape(m[1])}`)
      if (!g) return { ok: false, detail: `gradient #${m[1]} not found in the chart's root` }
      const stops = [...g.querySelectorAll('stop')]
      const cs = stops.map((s) => ({ raw: s.getAttribute('stop-color'), c: getComputedStyle(s).stopColor }))
      const ps = cs.map((s) => parse(s.c))
      const concrete = ps.every((p) => p && !(p[0] < 2 && p[1] < 2 && p[2] < 2))
      const hit = ps.some((p) => near(p, rgbOf(hex), 4))
      return {
        ok: stops.length > 0 && concrete && hit,
        detail: `stops raw=[${cs.map((s) => s.raw).join(', ')}] computed=[${cs.map((s) => s.c).join(', ')}]`,
      }
    },
    /** Effective fill alpha: colour alpha times fill-opacity. */
    effAlpha(el) {
      const cs = getComputedStyle(el)
      const p = parse(cs.fill)
      return (p ? p[3] : NaN) * parseFloat(cs.fillOpacity || '1')
    },
    /** A state filter, if any, must resolve inside the same root. */
    filterRef(root, el, required) {
      const f = el.getAttribute('filter') || getComputedStyle(el).filter || ''
      const m = /url\(\s*['"]?#([^'")]+)/.exec(f)
      if (!m) return { ok: !required || f !== 'none', detail: `filter="${f}"` }
      const g = root.getElementById ? root.getElementById(m[1]) : root.querySelector(`#${CSS.escape(m[1])}`)
      return { ok: !!g, detail: `filter="${f}" target ${g ? 'found' : 'MISSING'} in root` }
    },
    /** A legend or tooltip marker: whichever of background, fill or stroke
     * carries the colour, on the marker or a descendant. */
    markerPaint(m, hex) {
      if (!m) return { ok: false, detail: 'marker missing' }
      const nodes = [m, ...m.querySelectorAll('*')]
      const seen = []
      for (const n of nodes) {
        const cs = getComputedStyle(n)
        for (const prop of ['backgroundColor', 'fill', 'stroke']) {
          const v = cs[prop]
          const p = parse(v)
          if (p && p[3] > 0) {
            seen.push(`${n.tagName.toLowerCase()}.${prop}=${v}`)
            if (near(p, rgbOf(hex))) return { ok: true, detail: `${n.tagName.toLowerCase()}.${prop}=${v}` }
          }
        }
        const rf = n.getAttribute && (n.getAttribute('fill') || n.getAttribute('style') || '')
        if (rf && /var\(/.test(rf)) seen.push(`raw:${rf.slice(0, 60)}`)
      }
      return { ok: false, detail: `no ${hex} found; saw [${seen.slice(0, 6).join(', ')}]` }
    },
  }
  window.__H = H
}

/* ------------------------------------------------------------------ mount */
async function mount(page, mode, check) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('about:blank')
  await page.setContent('<div id="mount"></div>')
  await page.addScriptTag({ path: BUNDLE })
  if (check.hf) await page.addScriptTag({ path: HF })
  await page.evaluate(installHelpers)
  await page.evaluate(
    async ({ mode, options, V }) => {
      const mountEl = document.getElementById('mount')
      const setVars = (el) => {
        el.style.setProperty('--c1', V.c1)
        el.style.setProperty('--c2', V.c2)
      }
      let root = mountEl
      let varHost = mountEl
      if (mode === 'light') {
        setVars(mountEl)
      } else {
        const outer = document.createElement('div')
        mountEl.appendChild(outer)
        setVars(outer)
        varHost = outer
        root = outer.attachShadow({ mode: 'open' })
        if (mode === 'nested') {
          const inner = document.createElement('div')
          root.appendChild(inner)
          root = inner.attachShadow({ mode: 'open' })
        }
      }
      const target = document.createElement('div')
      target.style.width = '600px'
      root.appendChild(target)
      window.__root = root
      window.__varHost = varHost
      window.chart = new ApexCharts(target, options)
      await window.chart.render()
    },
    { mode, options: check.options, V: VARS }
  )
  if (check.settle) await page.waitForTimeout(check.settle)
  if (check.point) {
    const pt = await page.evaluate((sel) => {
      const el = window.__root.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }, check.point)
    if (pt) {
      await page.mouse.move(pt.x - 5, pt.y - 5)
      await page.mouse.move(pt.x, pt.y, { steps: 3 })
      if (check.click) await page.mouse.click(pt.x, pt.y)
    }
  }
  return errors
}

async function runCheck(page, check) {
  return page.evaluate(
    async ({ src, V, D1, D2 }) => {
      // The tween check refers to these by name.
      window.DATA1_ = D1
      window.DATA2_ = D2
      const fn = (0, eval)(`(${src})`)
      try {
        return await fn({
          root: window.__root,
          chart: window.chart,
          H: window.__H,
          V,
          varHost: window.__varHost,
        })
      } catch (e) {
        return { ok: false, detail: `threw: ${e && e.message}` }
      }
    },
    { src: check.run.toString(), V: VARS, D1: DATA1, D2: DATA2 }
  )
}

for (const check of CHECKS) {
  test.describe(`${check.id}: ${check.surface}`, () => {
    for (const mode of MODES) {
      test(`${check.id} [${mode}]`, async ({ page }) => {
        const errors = await mount(page, mode, check)
        const r = await runCheck(page, check)
        if (errors.length) r.detail += ` | pageerror: ${errors.join('; ')}`
        if (process.env.C11_OUT) {
          appendFileSync(
            process.env.C11_OUT,
            JSON.stringify({ id: check.id, surface: check.surface, mode, ok: r.ok, detail: r.detail }) + '\n'
          )
        }
        expect(r.ok, r.detail).toBe(true)
      })
    }
  })
}
