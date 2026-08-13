/**
 * The morph piece layer's geometry helpers (MorphPieces).
 *
 * The browser specs prove the pieces land where the marks were; these pin the
 * arithmetic underneath: an exact tiling with the right count, a spatially
 * coherent sort, and a colour interpolator that refuses what it cannot blend.
 */

import {
  gridDivideRect,
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
