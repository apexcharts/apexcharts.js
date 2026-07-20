import { describe, it, expect } from 'vitest'
import CanvasCompositor from '../../src/renderers/canvas/CanvasCompositor'
import CanvasRenderer from '../../src/renderers/canvas/CanvasRenderer'

/**
 * Strata (#2) heatmap canvas cells: dense rects are recorded COLUMNARLY (no
 * per-cell retained object) and painted as STYLE BATCHES: one fill/stroke state
 * application per run of consecutive same-style cells, then a fast fillRect per
 * cell (or a roundRect path when the shared corner radius is non-zero). Cells
 * are clipped to the plot rect, and a hover/legend dim spec applies the
 * inactive-series alpha per cell without breaking the batch.
 *
 * Mirrors canvas-marker-batching.spec.js. Run with `--environment node`.
 */

// Minimal recording stand-in for a CanvasRenderingContext2D.
function mockCtx() {
  const calls = {
    save: 0,
    restore: 0,
    clip: 0,
    beginPath: 0,
    rect: 0,
    fillRect: 0,
    strokeRect: 0,
    roundRect: 0,
    fill: 0,
    stroke: 0,
    setLineDash: 0,
    fillStyleSets: [],
    fillAlphas: [],
  }
  let _fill = ''
  return {
    calls,
    globalAlpha: 1,
    strokeStyle: '',
    lineWidth: 0,
    get fillStyle() {
      return _fill
    },
    set fillStyle(v) {
      _fill = v
      calls.fillStyleSets.push(v)
    },
    save() {
      calls.save++
    },
    restore() {
      calls.restore++
    },
    clip() {
      calls.clip++
    },
    beginPath() {
      calls.beginPath++
    },
    rect() {
      calls.rect++
    },
    fillRect() {
      calls.fillRect++
      calls.fillAlphas.push(this.globalAlpha)
    },
    strokeRect() {
      calls.strokeRect++
    },
    roundRect() {
      calls.roundRect++
    },
    fill() {
      calls.fill++
      calls.fillAlphas.push(this.globalAlpha)
    },
    stroke() {
      calls.stroke++
    },
    setLineDash() {
      calls.setLineDash++
    },
  }
}

// Columnar rect shim shaped like CanvasGraphics' cell store.
function mockShim(cells, styles, radius = 0) {
  const n = cells.length
  const shim = {
    _crx: new Float64Array(n),
    _cry: new Float64Array(n),
    _crw: new Float64Array(n),
    _crh: new Float64Array(n),
    _crstyle: new Int32Array(n),
    _crsi: new Int32Array(n),
    _cellRadius: radius,
    rectCount: () => n,
    rectStyle(i) {
      return styles[shim._crstyle[i]]
    },
    rectSeries(i) {
      return shim._crsi[i]
    },
  }
  cells.forEach((c, i) => {
    shim._crx[i] = c.x
    shim._cry[i] = c.y
    shim._crw[i] = c.w == null ? 5 : c.w
    shim._crh[i] = c.h == null ? 5 : c.h
    shim._crstyle[i] = c.style || 0
    shim._crsi[i] = c.si == null ? 0 : c.si
  })
  return shim
}

const A = { fill: '#008ffb', stroke: '#fff', strokeWidth: 1, fillOpacity: 1 }
const B = { fill: '#00e396', stroke: '#fff', strokeWidth: 1, fillOpacity: 1 }

function comp() {
  return new CanvasCompositor({ layout: { gridWidth: 600, gridHeight: 400 } })
}

describe('canvas rect-cell painting (heatmap)', () => {
  it('uniform-style cells: ONE fillStyle batch, one fillRect per cell, grid-clipped', () => {
    const c = comp()
    const ctx = mockCtx()
    const cells = Array.from({ length: 200 }, (_, i) => ({ x: i, y: 0 }))
    c._paintRects(ctx, mockShim(cells, [A]))
    // one fill state application for the whole same-style run
    expect(ctx.calls.fillStyleSets.length).toBe(1)
    expect(ctx.calls.fillRect).toBe(200)
    expect(ctx.calls.roundRect).toBe(0)
    // clipped to the plot rect exactly once (save + clip + restore)
    expect(ctx.calls.save).toBe(1)
    expect(ctx.calls.clip).toBe(1)
    expect(ctx.calls.restore).toBe(1)
  })

  it('two style runs -> two fill state applications', () => {
    const c = comp()
    const ctx = mockCtx()
    const cells = [
      ...Array.from({ length: 20 }, (_, i) => ({ x: i, y: 0, style: 0 })),
      ...Array.from({ length: 20 }, (_, i) => ({ x: i, y: 10, style: 1 })),
    ]
    c._paintRects(ctx, mockShim(cells, [A, B]))
    expect(ctx.calls.fillStyleSets.length).toBe(2)
    expect(ctx.calls.fillRect).toBe(40)
  })

  it('non-zero radius uses roundRect + fill (no fillRect)', () => {
    const c = comp()
    const ctx = mockCtx()
    const cells = Array.from({ length: 50 }, (_, i) => ({ x: i, y: 0 }))
    c._paintRects(ctx, mockShim(cells, [A], 3))
    expect(ctx.calls.roundRect).toBe(50)
    expect(ctx.calls.fill).toBe(50)
    expect(ctx.calls.fillRect).toBe(0)
  })

  it('zero-size cells are skipped', () => {
    const c = comp()
    const ctx = mockCtx()
    const cells = [
      { x: 0, y: 0, w: 5, h: 5 },
      { x: 1, y: 0, w: 0, h: 5 },
      { x: 2, y: 0, w: 5, h: 0 },
      { x: 3, y: 0, w: 5, h: 5 },
    ]
    c._paintRects(ctx, mockShim(cells, [A]))
    expect(ctx.calls.fillRect).toBe(2)
  })

  it('dim spec applies the inactive-series alpha per cell within one batch', () => {
    const c = comp()
    const ctx = mockCtx()
    // same style (one run); series 0 active, series 1 dimmed to 0.2
    const cells = [
      { x: 0, y: 0, si: 0 },
      { x: 1, y: 0, si: 1 },
    ]
    c._dim = { active: 0, opacity: 0.2 }
    c._paintRects(ctx, mockShim(cells, [A]))
    expect(ctx.calls.fillStyleSets.length).toBe(1)
    expect(ctx.calls.fillAlphas).toEqual([1, 0.2])
  })

  it('no cells -> nothing painted and no clip set up', () => {
    const c = comp()
    const ctx = mockCtx()
    c._paintRects(ctx, mockShim([], [A]))
    expect(ctx.calls.fillRect).toBe(0)
    expect(ctx.calls.save).toBe(0)
  })
})

describe('canvas heatmap hitTest (cell under a point)', () => {
  function renderer() {
    const w = {
      config: { series: [{ data: new Array(4) }] },
      layout: { gridWidth: 100, gridHeight: 100 },
    }
    const r = new CanvasRenderer(w, {})
    r.beginSeries() // sizes + resets the columnar store
    return r
  }

  it('returns the cell under a point with series/dataPoint index + geometry', () => {
    const r = renderer()
    r.drawRectCell(0, 0, 10, 10, { fill: '#a', seriesIndex: 0, dataPointIndex: 0 })
    r.drawRectCell(10, 0, 10, 10, { fill: '#b', seriesIndex: 0, dataPointIndex: 1 })
    r.drawRectCell(0, 10, 10, 10, { fill: '#c', seriesIndex: 1, dataPointIndex: 0 })
    expect(r.hitTest(5, 5)).toMatchObject({
      seriesIndex: 0,
      dataPointIndex: 0,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    })
    expect(r.hitTest(15, 5)).toMatchObject({ seriesIndex: 0, dataPointIndex: 1 })
    expect(r.hitTest(5, 15)).toMatchObject({ seriesIndex: 1, dataPointIndex: 0 })
  })

  it('returns null when the point is off every cell', () => {
    const r = renderer()
    r.drawRectCell(0, 0, 10, 10, { fill: '#a', seriesIndex: 0, dataPointIndex: 0 })
    expect(r.hitTest(50, 50)).toBe(null)
    expect(r.hitTest(-1, -1)).toBe(null)
  })

  it('overlapping cells: the later-painted cell wins (reverse scan)', () => {
    const r = renderer()
    r.drawRectCell(0, 0, 20, 20, { fill: '#a', seriesIndex: 0, dataPointIndex: 0 })
    r.drawRectCell(10, 0, 20, 20, { fill: '#b', seriesIndex: 0, dataPointIndex: 1 })
    // (15,5) lies in both; the second cell (j=1) is on top
    expect(r.hitTest(15, 5).dataPointIndex).toBe(1)
  })

  it('no cells -> null', () => {
    expect(renderer().hitTest(5, 5)).toBe(null)
  })
})
