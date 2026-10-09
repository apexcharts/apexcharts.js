import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'
import '../../src/features/renderer-canvas.js'
import { solid } from '../../src/modules/highlightFilter/util.js'

// "Whole faded, part solid in front": a plain fill carries its fill opacity in
// its colour (rgba), and a part that copied it let the faded wholes and their
// outlines under it show through, as a dark line wherever the part stack sits
// off the whole stack. A part is drawn in the whole's ink, opaque, and its
// alpha moves on the pick's clock: the whole's on frame 0 of a first pick and
// on the landing frame of a clear (the part is then on the whole's exact
// shape), 1 otherwise.

afterEach(() => vi.restoreAllMocks())

const CATS = ['a', 'b', 'c']

/** How opaque a mark paints: its colour's alpha times its fill-opacity. */
function eff(n) {
  const f = String(n.getAttribute('fill') || '')
  const [, a] = solid(f)
  const fo = parseFloat(n.getAttribute('fill-opacity') ?? '1')
  return a * (isFinite(fo) ? fo : 1)
}
const q = (c, sel) => [...c.w.dom.baseEl.querySelectorAll(sel)]
const barParts = (c) => q(c, '.apexcharts-bar-highlight-part')
const at = (n) => n.getAttribute('index') + '|' + n.getAttribute('j')
const byAt = (ns) => new Map(ns.map((n) => [at(n), n]))
const barWholes = (c) =>
  q(c, '.apexcharts-series > .apexcharts-bar-area').filter(
    (n) => !n.classList.contains('apexcharts-highlight-part'),
  )
/** Every coordinate pair in a path `d`. */
const points = (d) => {
  const nums = String(d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []
  const out = []
  for (let k = 0; k + 1 < nums.length; k += 2)
    out.push([+nums[k], +nums[k + 1]])
  return out
}
const span = (d, axis) => {
  const v = points(d).map((p) => p[axis])
  return [Math.min(...v), Math.max(...v)]
}

// The stacked demo's first two months, the search pick.
const SESSIONS = [
  { name: 'Desktop', data: [42, 45, 48] },
  { name: 'Mobile', data: [58, 62, 66] },
]
const SEARCH = [
  [20, 22, 23],
  [24, 26, 28],
]
const SOCIAL = [
  [8, 9, 10],
  [22, 24, 26],
]
const withParts = (rows) =>
  SESSIONS.map((s, i) => ({ ...s, highlightData: rows ? rows[i] : undefined }))

function stacked(extra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'bar',
      width: 600,
      height: 360,
      stacked: true,
      ...(extra.chart || {}),
    },
    colors: ['#2563eb', '#16a34a'],
    series: extra.series || withParts(SEARCH),
    xaxis: { categories: CATS },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 1, colors: ['#fff'] },
    ...(extra.options || {}),
  })
}

const animated = (chart) => {
  chart.w.config.chart.animations.enabled = true
  return chart
}

/** Hold the feature's tweens at frame 0; each can be stepped by hand. */
function holdTweens(chart) {
  const frames = []
  vi.spyOn(chart.highlightFilter, '_tween').mockImplementation(
    (d, s, onFrame, onDone) => {
      onFrame(0)
      frames.push({ onFrame, onDone })
    },
  )
  return {
    frames,
    step: (t) => frames.forEach((f) => f.onFrame(t)),
    land: () => frames.forEach((f) => f.onDone && f.onDone()),
  }
}

describe('solid(): a plain colour as its ink and alpha', () => {
  test('the forms fill opacity reaches a colour in', () => {
    expect(solid('rgba(22,163,74,0.85)')).toEqual(['rgb(22,163,74)', 0.85])
    expect(solid('rgba(22, 163, 74, 0.5)')).toEqual(['rgb(22, 163, 74)', 0.5])
    expect(solid('color-mix(in srgb, var(--brand) 85%, transparent)')).toEqual([
      'var(--brand)',
      0.85,
    ])
    const [ink, a] = solid('#16a34a80')
    expect(ink).toBe('#16a34a')
    expect(a).toBeCloseTo(128 / 255, 6)
  })

  test('anything opaque, invisible or not a colour is left as it is', () => {
    for (const p of [
      '#16a34a',
      'rgb(1,2,3)',
      'rgba(1,2,3,1)',
      'rgba(1,2,3,0)',
      'red',
      'url(#SvgjsPattern1)',
      'none',
      '',
    ]) {
      expect(solid(p)).toEqual([p, 1])
    }
    const gradient = { id: 'g' }
    expect(solid(gradient)).toEqual([gradient, 1])
    expect(solid(undefined)).toEqual([undefined, 1])
  })
})

describe('bars: the part is solid at rest', () => {
  test('stacked: nothing shows through a part where the whole stack edge runs under it', () => {
    const c = stacked()
    const ps = byAt(barParts(c))
    const ws = byAt(barWholes(c))
    expect(ps.size).toBe(6)
    // The whole keeps its own translucent paint, faded.
    expect(ws.get('0|0').getAttribute('fill')).toBe('rgba(37,99,235,0.85)')
    // The Desktop whole's top edge runs inside the Mobile part (the demo's
    // dark line): the part over it paints fully opaque.
    for (const j of [0, 1, 2]) {
      const edge = span(ws.get(`0|${j}`).getAttribute('d'), 1)[0]
      const [top, bottom] = span(ps.get(`1|${j}`).getAttribute('d'), 1)
      expect(edge).toBeGreaterThan(top + 1)
      expect(edge).toBeLessThan(bottom - 1)
      expect(eff(ps.get(`1|${j}`))).toBe(1)
    }
    for (const p of ps.values()) {
      expect(eff(p)).toBe(1)
      expect(p.getAttribute('fill')).toMatch(/^rgb\(/)
    }
    c.destroy()
  })

  test('horizontal 100%, unstacked columns and the funnel too', () => {
    const shares = stacked({
      chart: { stackType: '100%' },
      options: { plotOptions: { bar: { horizontal: true } } },
    })
    expect(barParts(shares).length).toBe(6)
    for (const p of barParts(shares)) expect(eff(p)).toBe(1)
    shares.destroy()

    const cols = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      series: [{ name: 'A', data: [40, 30, 50], highlightData: [20, 45, 10] }],
      xaxis: { categories: CATS },
    })
    expect(barParts(cols).length).toBe(3)
    for (const p of barParts(cols)) expect(eff(p)).toBe(1)
    cols.destroy()

    const funnel = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      plotOptions: { bar: { horizontal: true, isFunnel: true } },
      series: [{ name: 'A', data: [100, 70, 40], highlightData: [60, 30, 20] }],
      xaxis: { categories: CATS },
    })
    expect(barParts(funnel).length).toBe(3)
    for (const p of barParts(funnel)) expect(eff(p)).toBe(1)
    funnel.destroy()
  })

  test('a CSS variable colour: the part takes the variable itself', () => {
    const c = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      colors: ['var(--brand, #16a34a)'],
      series: [{ name: 'A', data: [40, 30], highlightData: [20, 10] }],
      xaxis: { categories: ['a', 'b'] },
    })
    const w = barWholes(c)[0]
    expect(w.getAttribute('fill')).toMatch(/^color-mix\(/)
    for (const p of barParts(c)) {
      expect(p.getAttribute('fill')).toBe('var(--brand, #16a34a)')
      expect(p.getAttribute('fill-opacity')).toBe('1')
    }
    c.destroy()
  })

  test('gradient, pattern and image fills: the part keeps the whole paint as drawn', () => {
    for (const fill of [
      { type: 'gradient', gradient: { opacityFrom: 0.9, opacityTo: 0.6 } },
      { type: 'pattern' },
      {
        type: 'image',
        image: { src: ['data:image/gif;base64,R0lGODlhAQABAAAAACw='] },
      },
    ]) {
      const c = stacked({ options: { fill } })
      const ws = byAt(barWholes(c))
      const ps = barParts(c)
      expect(ps.length).toBe(6)
      for (const p of ps) {
        const w = ws.get(at(p))
        expect(p.getAttribute('fill')).toBe(w.getAttribute('fill'))
        expect(p.getAttribute('fill')).toMatch(/^url\(/)
        expect(p.getAttribute('fill-opacity')).toBe('1')
      }
      c.destroy()
    }
  })

  test('the canvas records a solid part with no opacity of its own', () => {
    const c = stacked({ chart: { renderer: 'canvas' } })
    expect(c.ctx.renderer.kind).toBe('canvas')
    const list = c.ctx.renderer._g.displayList()
    const fills = list.filter((x) => x.tag === 'path').map((x) => x.fill)
    // six wholes at 0.85, six parts solid
    expect(fills.filter((f) => /^rgba\(.*0\.85\)$/.test(f)).length).toBe(6)
    const solidParts = list.filter(
      (x) => x.tag === 'path' && /^rgb\(/.test(x.fill),
    )
    expect(solidParts.length).toBe(6)
    for (const x of solidParts) expect(x.fillOpacity).toBeUndefined()
    c.destroy()
  })
})

describe('bars: the alpha moves on the pick clock, never snaps', () => {
  test('a first pick: frame 0 is the whole look, then the part comes up to solid', async () => {
    const c = animated(stacked({ series: withParts(null) }))
    const t = holdTweens(c)
    await c.updateSeries(withParts(SEARCH))
    const ps = barParts(c)
    expect(ps.length).toBe(6)
    // frame 0: each part on its whole, painting exactly as the whole did
    for (const p of ps) expect(eff(p)).toBeCloseTo(0.85, 6)
    t.step(0.5)
    for (const p of ps) expect(eff(p)).toBeCloseTo(0.925, 6)
    t.step(1)
    for (const p of ps) expect(eff(p)).toBe(1)
    c.destroy()
  })

  test('a clear: from solid down to the whole look, then the plain chart', async () => {
    const c = animated(stacked())
    const t = holdTweens(c)
    await c.updateSeries(withParts(null))
    const ps = barParts(c)
    expect(ps.length).toBe(6)
    for (const p of ps) expect(eff(p)).toBe(1)
    t.step(0.5)
    for (const p of ps) expect(eff(p)).toBeCloseTo(0.925, 6)
    t.step(1)
    for (const p of ps) expect(eff(p)).toBeCloseTo(0.85, 6)
    t.land()
    expect(barParts(c).length).toBe(0)
    for (const w of barWholes(c)) {
      expect(w.getAttribute('fill-opacity')).toBe('1')
      expect(w.getAttribute('fill')).toMatch(/^rgba\(.*0\.85\)$/)
    }
    c.destroy()
  })

  test('a re-pick stays solid on every frame', async () => {
    const c = animated(stacked())
    const t = holdTweens(c)
    await c.updateSeries(withParts(SOCIAL))
    for (const p of barParts(c)) expect(eff(p)).toBe(1)
    t.step(0.5)
    for (const p of barParts(c)) expect(eff(p)).toBe(1)
    c.destroy()
  })

  test('a re-pick mid-clear moves on from the alpha on screen', async () => {
    const c = animated(stacked())
    const t = holdTweens(c)
    await c.updateSeries(withParts(null))
    t.step(0.5)
    const mid = barParts(c).map(eff)
    for (const a of mid) expect(a).toBeCloseTo(0.925, 6)
    // a frame paints, so the next capture reads the screen
    c.w.globals.pendingCapture.pending = false
    const t2 = holdTweens(c)
    await c.updateSeries(withParts(SEARCH))
    const now = barParts(c).filter((n) => n.isConnected)
    for (const p of now) expect(eff(p)).toBeCloseTo(0.925, 6)
    t2.step(1)
    for (const p of now) expect(eff(p)).toBe(1)
    void t
    c.destroy()
  })

  test('without animation a pick and a clear land at once', async () => {
    const c = stacked({ series: withParts(null) })
    await c.updateSeries(withParts(SEARCH))
    for (const p of barParts(c)) expect(eff(p)).toBe(1)
    await c.updateSeries(withParts(null))
    expect(barParts(c).length).toBe(0)
    c.destroy()
  })

  test('a chart picked and cleared is the chart never picked', async () => {
    const c = stacked({ series: withParts(null) })
    // (the plot's series, labels and totals; the chrome is redrawn by core)
    const html = () =>
      c.w.dom.baseEl
        .querySelector('.apexcharts-bar-series')
        .outerHTML.replace(/Svgjs\w+\d+/g, 'ID')
    // an ordinary update first: a mount orders its empty groups differently
    await c.updateSeries(withParts(null))
    const plain = html()
    await c.updateSeries(withParts(SEARCH))
    await c.updateSeries(withParts(null))
    expect(html()).toBe(plain)
    c.destroy()
  })
})

describe('areas: solid in a stack, translucent where areas overlap', () => {
  const area = (stackedArea) =>
    createChartWithOptions({
      chart: { type: 'area', width: 600, height: 300, stacked: stackedArea },
      fill: { type: 'solid', opacity: 0.85 },
      series: [
        { name: 'A', data: [40, 45, 50, 42], highlightData: [20, 22, 25, 21] },
        { name: 'B', data: [30, 35, 32, 38], highlightData: [15, 20, 12, 18] },
      ],
      dataLabels: { enabled: false },
    })
  const areaParts = (c) =>
    q(c, '.apexcharts-line-highlight-part').filter(
      (n) => n.getAttribute('fill') !== 'none',
    )

  test('a stacked area part is solid', () => {
    const c = area(true)
    expect(areaParts(c).length).toBe(2)
    for (const p of areaParts(c)) {
      expect(p.getAttribute('fill')).toMatch(/^rgb\(/)
      expect(eff(p)).toBe(1)
    }
    c.destroy()
  })

  test('an unstacked area part keeps the fill alpha, so the series behind stay seen', () => {
    const c = area(false)
    expect(areaParts(c).length).toBe(2)
    for (const p of areaParts(c)) expect(eff(p)).toBeCloseTo(0.85, 6)
    c.destroy()
  })

  test('a stacked area pick and clear ease the alpha on the clock', async () => {
    const c = animated(
      createChartWithOptions({
        chart: { type: 'area', width: 600, height: 300, stacked: true },
        fill: { type: 'solid', opacity: 0.85 },
        series: [
          { name: 'A', data: [40, 45, 50] },
          { name: 'B', data: [30, 35, 32] },
        ],
        dataLabels: { enabled: false },
      }),
    )
    const t = holdTweens(c)
    await c.updateSeries([
      { name: 'A', data: [40, 45, 50], highlightData: [20, 22, 25] },
      { name: 'B', data: [30, 35, 32], highlightData: [15, 20, 12] },
    ])
    for (const p of areaParts(c)) expect(eff(p)).toBeCloseTo(0.85, 6)
    t.step(1)
    for (const p of areaParts(c)) expect(eff(p)).toBe(1)
    const t2 = holdTweens(c)
    await c.updateSeries([
      { name: 'A', data: [40, 45, 50] },
      { name: 'B', data: [30, 35, 32] },
    ])
    for (const p of areaParts(c)) expect(eff(p)).toBe(1)
    t2.step(1)
    for (const p of areaParts(c)) expect(eff(p)).toBeCloseTo(0.85, 6)
    void t
    c.destroy()
  })
})

describe('circles', () => {
  const circle = (type, extra = {}) =>
    createChartWithOptions({
      chart: { type, width: 420, height: 420 },
      series: [40, 30, 50, 20],
      labels: ['a', 'b', 'c', 'd'],
      ...extra,
      highlightFilter: { data: [20, 45, 10, 25] },
    })

  test('pie, donut and polarArea parts are solid, the slice keeping its own paint', () => {
    for (const type of ['pie', 'donut', 'polarArea']) {
      const c = circle(type, { fill: { opacity: 0.7 } })
      const ws = q(c, '.apexcharts-pie-area')
      const ps = q(c, '.apexcharts-pie-highlight-part')
      expect(ps.length).toBe(4)
      expect(ws[0].getAttribute('fill')).toMatch(/0\.7\)$/)
      for (const p of ps) {
        expect(p.getAttribute('fill')).toMatch(/^rgb\(/)
        expect(eff(p)).toBe(1)
      }
      c.destroy()
    }
  })

  test('radial parts keep the ring paint: they lie on their own band alone', () => {
    const c = createChartWithOptions({
      chart: { type: 'radialBar', width: 420, height: 420 },
      series: [70, 50],
      labels: ['a', 'b'],
      highlightFilter: { data: [40, 30] },
    })
    const ps = q(c, '.apexcharts-radialbar-highlight-part')
    expect(ps.length).toBe(2)
    ps.forEach((p, k) => {
      const ring = q(c, `.apexcharts-radialbar-slice-${k}`)[0]
      expect(p.getAttribute('stroke')).toBe(ring.getAttribute('stroke'))
      expect(p.getAttribute('stroke')).toMatch(/0\.85\)$/)
    })
    c.destroy()
  })
})

// The whole's own stroke is centred on its edge, so a part on the whole's
// exact shape (frame 0 of a first pick, the landing frame of a clear) covers
// the inner half of it: the stacked demo's 1px white seam vanished on frame 0
// and came back the frame a clear landed. The part carries that stroke while
// it sits there, over the whole's own (hidden under it), and eases it out as
// it leaves the whole's shape (in, as it comes back). At rest a part has none.
describe("bars: the whole's own stroke rides the part on the whole's shape", () => {
  const strokeOf = (n) =>
    ['stroke', 'stroke-width', 'stroke-opacity'].map((a) => n.getAttribute(a))
  const SO = (n) => parseFloat(n.getAttribute('stroke-opacity'))

  test('a first pick: frame 0 strokes each part as its whole was, then eases it out', async () => {
    const c = animated(stacked({ series: withParts(null) }))
    const t = holdTweens(c)
    await c.updateSeries(withParts(SEARCH))
    const ps = byAt(barParts(c))
    const ws = byAt(barWholes(c))
    expect(ps.size).toBe(6)
    for (const [k, p] of ps) {
      expect(strokeOf(p)).toEqual(['#fff', '1', '1'])
      // the whole's own stroke is under it, and hidden
      expect(ws.get(k).getAttribute('stroke')).toBe('#fff')
      expect(SO(ws.get(k))).toBe(0)
    }
    t.step(0.5)
    for (const [k, p] of ps) {
      expect(SO(p)).toBeCloseTo(0.5, 6)
      // the whole's outline is coming in
      expect(ws.get(k).getAttribute('stroke')).toMatch(/^rgba\(/)
    }
    t.step(1)
    for (const p of ps.values()) {
      // as a part drawn at rest is
      expect(strokeOf(p)).toEqual(['none', '0', '1'])
    }
    c.destroy()
  })

  test('a clear: the stroke eases in as the part returns, and the whole lands with its own', async () => {
    const c = animated(stacked())
    const t = holdTweens(c)
    await c.updateSeries(withParts(null))
    const ps = byAt(barParts(c))
    expect(ps.size).toBe(6)
    for (const p of ps.values()) {
      expect(p.getAttribute('stroke')).toBe('#fff')
      expect(SO(p)).toBe(0)
    }
    t.step(0.5)
    for (const p of ps.values()) expect(SO(p)).toBeCloseTo(0.5, 6)
    t.step(1)
    const ws = byAt(barWholes(c))
    for (const [k, p] of ps) {
      expect(strokeOf(p)).toEqual(['#fff', '1', '1'])
      expect(SO(ws.get(k))).toBe(0)
    }
    t.land()
    expect(barParts(c).length).toBe(0)
    for (const w of barWholes(c)) {
      expect(w.getAttribute('stroke')).toBe('#fff')
      expect(SO(w)).toBe(1)
    }
    c.destroy()
  })

  test('a re-pick mid-pick moves the stroke on from the screen', async () => {
    const c = animated(stacked({ series: withParts(null) }))
    const t = holdTweens(c)
    await c.updateSeries(withParts(SEARCH))
    t.step(0.4)
    for (const p of barParts(c)) expect(SO(p)).toBeCloseTo(0.6, 6)
    // a frame paints, so the next capture reads the screen
    c.w.globals.pendingCapture.pending = false
    const t2 = holdTweens(c)
    await c.updateSeries(withParts(SOCIAL))
    const now = barParts(c).filter((n) => n.isConnected)
    expect(now.length).toBe(6)
    for (const p of now) {
      expect(p.getAttribute('stroke')).toBe('#fff')
      expect(SO(p)).toBeCloseTo(0.6, 6)
    }
    t2.step(0.5)
    for (const p of now) expect(SO(p)).toBeCloseTo(0.3, 6)
    t2.step(1)
    for (const p of now) expect(p.getAttribute('stroke')).toBe('none')
    c.destroy()
  })

  test('a re-pick, no animation, a transparent stroke and the canvas never stroke a part', async () => {
    const c = animated(stacked())
    const t = holdTweens(c)
    await c.updateSeries(withParts(SOCIAL))
    for (const p of barParts(c)) expect(p.getAttribute('stroke')).toBe('none')
    t.step(0.5)
    for (const p of barParts(c)) expect(p.getAttribute('stroke')).toBe('none')
    c.destroy()

    const still = stacked({ series: withParts(null) })
    await still.updateSeries(withParts(SEARCH))
    for (const p of barParts(still)) {
      expect(p.getAttribute('stroke')).toBe('none')
    }
    still.destroy()

    const clear = animated(
      stacked({
        series: withParts(null),
        options: { stroke: { show: true, width: 2, colors: ['transparent'] } },
      }),
    )
    holdTweens(clear)
    await clear.updateSeries(withParts(SEARCH))
    for (const p of barParts(clear)) {
      expect(p.getAttribute('stroke')).toBe('none')
    }
    clear.destroy()

    const cv = stacked({ chart: { renderer: 'canvas' } })
    const list = cv.ctx.renderer._g.displayList()
    const parts = list.filter((x) => x.tag === 'path' && /^rgb\(/.test(x.fill))
    expect(parts.length).toBe(6)
    for (const x of parts) expect(x.stroke ?? 'none').toBe('none')
    cv.destroy()
  })
})

// barRect centres the whole's stroke on each end, so a bar thinner than its
// stroke turns inside out into a stroke-wide sliver past its baseline (a 0, a
// series the legend hides or brings back). The whole's stroke paints over its
// own; a part has none, and showed a solid 1px line. A part that thin is the
// line it collapses to.
describe('bars: a part of nothing draws nothing', () => {
  const height = (n, axis = 1) => {
    const [a, b] = span(n.getAttribute('d'), axis)
    return b - a
  }

  test('a zero part, stacked, horizontal 100% and unstacked', () => {
    const rows = [
      [0, 22, 23],
      [24, 0, 28],
    ]
    const c = stacked({ series: withParts(rows) })
    const ps = byAt(barParts(c))
    expect(height(ps.get('0|0'))).toBeLessThan(1e-6)
    expect(height(ps.get('1|1'))).toBeLessThan(1e-6)
    // the rest keep their size, and sit on the part below as before
    expect(height(ps.get('0|1'))).toBeGreaterThan(5)
    c.destroy()

    const h = stacked({
      series: withParts(rows),
      chart: { stackType: '100%' },
      options: { plotOptions: { bar: { horizontal: true } } },
    })
    expect(height(byAt(barParts(h)).get('0|0'), 0)).toBeLessThan(1e-6)
    h.destroy()

    const cols = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      series: [{ name: 'A', data: [40, 30, 50], highlightData: [0, 45, 10] }],
      xaxis: { categories: CATS },
    })
    expect(height(byAt(barParts(cols)).get('0|0'))).toBeLessThan(1e-6)
    cols.destroy()
  })
})
