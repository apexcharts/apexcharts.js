/**
 * The morph piece layer's geometry helpers (MorphPieces).
 *
 * The browser specs prove the pieces land where the marks were; these pin the
 * arithmetic underneath: an exact tiling with the right count, a spatially
 * coherent sort, and a colour interpolator that refuses what it cannot blend.
 */

import {
  gridDivideRect,
  gridDivideShape,
  hilbertIndex,
  makeColorLerp,
  parseColor,
  sortByHilbert,
} from '../../src/modules/MorphPieces'
import MorphTypeChange from '../../src/modules/MorphTypeChange'

describe('gridDivideRect', () => {
  const BOX = { x: 10, y: 20, width: 40, height: 160 }

  it('returns exactly count cells for any count', () => {
    for (const n of [1, 2, 3, 7, 40, 96, 251]) {
      expect(gridDivideRect(BOX, n).length).toBe(n)
    }
    expect(gridDivideRect(BOX, 0)).toEqual([])
    expect(gridDivideRect(BOX, -3)).toEqual([])
  })

  it('tiles the box exactly: total area is conserved and no cell escapes', () => {
    for (const n of [2, 5, 40, 96]) {
      const cells = gridDivideRect(BOX, n)
      const area = cells.reduce((s, c) => s + c.width * c.height, 0)
      expect(area).toBeCloseTo(BOX.width * BOX.height, 6)
      for (const c of cells) {
        expect(c.x).toBeGreaterThanOrEqual(BOX.x - 1e-9)
        expect(c.y).toBeGreaterThanOrEqual(BOX.y - 1e-9)
        expect(c.x + c.width).toBeLessThanOrEqual(BOX.x + BOX.width + 1e-9)
        expect(c.y + c.height).toBeLessThanOrEqual(BOX.y + BOX.height + 1e-9)
      }
    }
  })

  it('runs its rows along the longer axis, so cells stay near-square', () => {
    // Tall box: rows stack along the height; a 40-cell division of a 40x160
    // box should have more rows than columns.
    const cells = gridDivideRect(BOX, 40)
    const distinctY = new Set(cells.map((c) => Math.round(c.y * 10))).size
    const distinctX = new Set(cells.map((c) => Math.round(c.x * 10))).size
    expect(distinctY).toBeGreaterThan(distinctX)

    // And the transpose behaves symmetrically.
    const flat = gridDivideRect({ x: 0, y: 0, width: 160, height: 40 }, 40)
    const fy = new Set(flat.map((c) => Math.round(c.y * 10))).size
    const fx = new Set(flat.map((c) => Math.round(c.x * 10))).size
    expect(fx).toBeGreaterThan(fy)
  })

  it('survives a degenerate zero-area box without dropping cells', () => {
    // An empty histogram bin captures one of these; the pairing must never
    // desync, so the count still has to come out exact.
    const cells = gridDivideRect({ x: 5, y: 5, width: 0, height: 0 }, 4)
    expect(cells.length).toBe(4)
  })
})

describe('gridDivideShape', () => {
  // A tall diamond: widest at the middle, a point at each end. Every band
  // crosses it in ONE interval, like a violin.
  const BOX = { x: 100, y: 0, width: 60, height: 240 }
  const HALF_AT = (y) => 30 * (1 - Math.abs(y - 120) / 120)
  const diamond = (bandLo, bandHi) => {
    const mid = (bandLo + bandHi) / 2
    const half = Math.max(0.5, HALF_AT(mid))
    return /** @type {Array<[number, number]>} */ ([[130 - half, 130 + half]])
  }

  // The same box hollowed out: two arms with a gap between them, which is
  // what a band across a donut ring actually crosses.
  const ring = (bandLo, bandHi) => {
    const mid = (bandLo + bandHi) / 2
    const half = Math.max(0.5, HALF_AT(mid))
    if (half < 12) return /** @type {Array<[number, number]>} */ ([[130 - half, 130 + half]])
    return /** @type {Array<[number, number]>} */ ([
      [130 - half, 130 - half + 8],
      [130 + half - 8, 130 + half],
    ])
  }

  it('returns exactly count cells, remainder included', () => {
    for (const n of [1, 2, 3, 14, 40, 97]) {
      expect(gridDivideShape(BOX, n, diamond).length).toBe(n)
    }
    expect(gridDivideShape(BOX, 0, diamond)).toEqual([])
  })

  it('follows the silhouette: rows are as wide as the shape, not the box', () => {
    const cells = gridDivideShape(BOX, 60, diamond)
    // Group cells into rows and take each row's span.
    const rows = new Map()
    cells.forEach((c) => {
      const r = rows.get(c.y) || { x0: Infinity, x1: -Infinity }
      r.x0 = Math.min(r.x0, c.x)
      r.x1 = Math.max(r.x1, c.x + c.width)
      rows.set(c.y, r)
    })
    const spans = [...rows.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([y, r]) => ({ y, w: r.x1 - r.x0 }))

    // The middle row is near the diamond's full width; the end rows are
    // slivers. A bounding-box grid would make every one of these 60.
    const first = spans[0]
    const mid = spans[Math.floor(spans.length / 2)]
    expect(mid.w).toBeGreaterThan(40)
    expect(first.w).toBeLessThan(15)
    // And every row stays inside the shape's measured interval.
    for (const s of spans) {
      expect(s.w).toBeLessThanOrEqual(60 + 1e-9)
    }
  })

  it('keeps bands thin when the count allows, so few cells still trace a curve', () => {
    // 14 cells over a tall box: the square-ish grid would cut ~10 thick
    // slabs of 1-2 cells; the shaped divider must spend all 14 on bands.
    const cells = gridDivideShape(BOX, 14, diamond)
    const distinctRows = new Set(cells.map((c) => c.y)).size
    expect(distinctRows).toBe(14)
  })

  it('falls back to the full box for bands with no measurable ink', () => {
    const cells = gridDivideShape(BOX, 8, () => null)
    for (const c of cells) {
      expect(c.x).toBeCloseTo(BOX.x, 6)
      expect(c.width).toBeCloseTo(BOX.width, 6)
    }
  })

  it('clamps a runaway extent to the box and survives degenerate boxes', () => {
    const wild = gridDivideShape(BOX, 6, () => [[0, 1000]])
    for (const c of wild) {
      expect(c.x).toBeGreaterThanOrEqual(BOX.x - 1e-9)
      expect(c.x + c.width).toBeLessThanOrEqual(BOX.x + BOX.width + 1e-9)
    }
    expect(gridDivideShape({ x: 5, y: 5, width: 0, height: 0 }, 4, diamond).length).toBe(4)
  })

  it('splits a band between its intervals and never fills the hole', () => {
    // The case a bounding-box grid cannot express and the reason this takes
    // intervals: a donut's band is two arms with a gap, and a cell landing in
    // the gap would be ink where the mark has none.
    const cells = gridDivideShape(BOX, 80, ring)
    expect(cells.length).toBe(80)

    // Every cell sits inside one of the intervals its own band reported.
    let inHole = 0
    for (const c of cells) {
      const spans = ring(c.y, c.y + c.height)
      const cx = c.x + c.width / 2
      if (!spans.some(([lo, hi]) => cx >= lo - 1e-6 && cx <= hi + 1e-6)) inHole++
    }
    expect(inHole).toBe(0)

    // And both arms are actually used, rather than one arm taking everything.
    const wide = cells.filter((c) => {
      const spans = ring(c.y, c.y + c.height)
      return spans.length === 2
    })
    const left = wide.filter((c) => c.x + c.width / 2 < 130).length
    const right = wide.length - left
    expect(left).toBeGreaterThan(0)
    expect(right).toBeGreaterThan(0)
  })

  it('probes the minor axis of a squat shape (rows run along the width)', () => {
    const squat = { x: 0, y: 100, width: 240, height: 60 }
    const seen = []
    gridDivideShape(squat, 30, (lo, hi, horizontal) => {
      seen.push(horizontal)
      const mid = (lo + hi) / 2
      const half = Math.max(0.5, 30 * (1 - Math.abs(mid - 120) / 120))
      return [[130 - half, 130 + half]]
    })
    // Rows run along the longer axis (x), so the prober is asked for
    // vertical extents.
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every((h) => h === true)).toBe(true)
  })
})

describe('hilbert ordering', () => {
  it('is deterministic and keeps every item', () => {
    const items = [
      { x: 9, y: 1 },
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 1, y: 9 },
      { x: 9, y: 9 },
    ]
    const a = sortByHilbert(items, (p) => [p.x, p.y])
    const b = sortByHilbert(items.slice(), (p) => [p.x, p.y])
    expect(a).toEqual(b)
    expect(a.length).toBe(items.length)
    expect(new Set(a).size).toBe(items.length)
  })

  it('keeps neighbours together better than raw order does', () => {
    // A 6x6 grid walked in the sorted order: consecutive hops must stay
    // short, which is the property that stops pieces criss-crossing the plot.
    const pts = []
    for (let gx = 0; gx < 6; gx++) {
      for (let gy = 0; gy < 6; gy++) pts.push({ x: gx * 10, y: gy * 10 })
    }
    const sorted = sortByHilbert(pts, (p) => [p.x, p.y])
    let worst = 0
    for (let k = 1; k < sorted.length; k++) {
      const d = Math.hypot(sorted[k].x - sorted[k - 1].x, sorted[k].y - sorted[k - 1].y)
      worst = Math.max(worst, d)
    }
    // On a Hilbert walk of a grid the longest hop stays within a couple of
    // cells; a row-major walk would hop the full row width (50) every turn.
    expect(worst).toBeLessThanOrEqual(20)
  })

  it('indexes corners of the extent at distinct positions', () => {
    const d00 = hilbertIndex(0, 0, 0, 0, 10, 10)
    const d11 = hilbertIndex(10, 10, 0, 0, 10, 10)
    const dMid = hilbertIndex(5, 5, 0, 0, 10, 10)
    expect(new Set([d00, d11, dMid]).size).toBe(3)
  })
})

describe('colour blending', () => {
  it('parses hex and rgb() and refuses gradients', () => {
    expect(parseColor('#000000')).toEqual([0, 0, 0, 1])
    expect(parseColor('#abc')).toEqual([170, 187, 204, 1])
    expect(parseColor('rgb(10, 20, 30)')).toEqual([10, 20, 30, 1])
    expect(parseColor('rgba(10, 20, 30, 0.5)')).toEqual([10, 20, 30, 0.5])
    expect(parseColor('url(#gradient1)')).toBe(null)
    expect(parseColor(null)).toBe(null)
    expect(parseColor('none')).toBe(null)
  })

  it('interpolates between two solids and lands on both endpoints', () => {
    const lerp = makeColorLerp('#000000', '#ffffff')
    expect(lerp(0)).toBe('rgb(0,0,0)')
    expect(lerp(1)).toBe('rgb(255,255,255)')
    expect(lerp(0.5)).toBe('rgb(128,128,128)')
  })

  it('returns null when either end cannot be blended', () => {
    expect(makeColorLerp('url(#g)', '#fff')).toBe(null)
    expect(makeColorLerp('#fff', undefined)).toBe(null)
  })
})

describe('piece eligibility on the morph engine', () => {
  const stub = () => ({
    config: { chart: { animations: { enabled: true } } },
    globals: { dom: {} },
    layout: {},
    dom: {},
  })

  it('claimsTargetMark answers only for mapped marks of a piece-in morph', () => {
    const m = new MorphTypeChange(/** @type {any} */ (stub()), /** @type {any} */ ({}))
    expect(m.claimsTargetMark(0, 0)).toBe(false)

    m._snapshot = /** @type {any} */ ({
      fromType: 'unit',
      toType: 'boxPlot',
      mapping: new Map([['0:0', { d: 'M 0 0', fill: null }]]),
      oldLayout: { translateX: 0, translateY: 0 },
      pieceIn: true,
    })
    expect(m.claimsTargetMark(0, 0)).toBe(true)
    expect(m.claimsTargetMark(0, 1)).toBe(false)

    m._snapshot.pieceIn = false
    expect(m.claimsTargetMark(0, 0)).toBe(false)
  })

  it('usesPieceTakeover reflects the capture-time decision', () => {
    const m = new MorphTypeChange(/** @type {any} */ (stub()), /** @type {any} */ ({}))
    expect(m.usesPieceTakeover()).toBe(false)
    m._snapshot = /** @type {any} */ ({
      fromType: 'bar',
      toType: 'unit',
      mapping: new Map(),
      oldLayout: { translateX: 0, translateY: 0 },
      pieceOut: true,
    })
    expect(m.usesPieceTakeover()).toBe(true)
  })

  it('counts only the object form of a unit series', () => {
    const m = new MorphTypeChange(/** @type {any} */ (stub()), /** @type {any} */ ({}))
    expect(m._countUnitSeries([{ data: [1, 2, 3] }, { data: [4] }])).toBe(4)
    // The numeric form scales by unitValue and cannot be counted pre-merge.
    expect(m._countUnitSeries([3, 5])).toBe(0)
    expect(m._countUnitSeries(null)).toBe(0)
  })
})
