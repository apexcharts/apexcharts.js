import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import CanvasCompositor from '../../src/renderers/canvas/CanvasCompositor'

/**
 * Phase-2 marker batching (per the render-2026 perf work): markers paint as
 * STYLE BATCHES, one fill/stroke state application per run of consecutive
 * same-style markers. A single-series scatter with uniform markers must
 * collapse to exactly ONE batch; per-marker geometry stays painter's-ordered
 * inside the run. Non-circle shapes reuse a unit Path2D per (shape, size)
 * translated via setTransform: no per-marker d-string, no per-marker Path2D.
 */

// Minimal recording stand-in for a CanvasRenderingContext2D.
function mockCtx() {
  const calls = {
    beginPath: 0,
    arc: 0,
    fill: 0,
    stroke: 0,
    setTransform: 0,
    setLineDash: 0,
    fillPathArgs: [],
    transforms: [],
  }
  return {
    calls,
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    beginPath() {
      calls.beginPath++
    },
    arc() {
      calls.arc++
    },
    fill(p) {
      calls.fill++
      if (p) calls.fillPathArgs.push(p)
    },
    stroke() {
      calls.stroke++
    },
    setTransform(...args) {
      calls.setTransform++
      calls.transforms.push(args)
    },
    setLineDash() {
      calls.setLineDash++
    },
  }
}

// Columnar marker shim shaped like CanvasGraphics' marker store.
function mockShim(markers, styles) {
  const n = markers.length
  const shim = {
    _mx: new Float64Array(n),
    _my: new Float64Array(n),
    _msize: new Float64Array(n),
    _mshape: new Int16Array(n),
    _mstyle: new Int32Array(n),
    markerCount: () => n,
    markerStyle(i) {
      return styles[shim._mstyle[i]]
    },
    markerSeries() {
      return 0
    },
    markerPath(x, y, shapeId, size) {
      return `M ${x - size} ${y - size} L ${x + size} ${y + size} Z`
    },
  }
  markers.forEach((m, i) => {
    shim._mx[i] = m.x
    shim._my[i] = m.y
    shim._msize[i] = m.size
    shim._mshape[i] = m.shape || 0
    shim._mstyle[i] = m.style || 0
  })
  return shim
}

const SOLID = { fill: '#008ffb', stroke: '#fff', strokeWidth: 2 }
const SOLID2 = { fill: '#00e396', stroke: '#fff', strokeWidth: 2 }

describe('canvas marker style-batching', () => {
  let origPath2D

  beforeEach(() => {
    // jsdom has no Path2D; the compositor only needs an opaque handle
    origPath2D = globalThis.Path2D
    globalThis.Path2D = class FakePath2D {
      constructor(d) {
        this.d = d
      }
    }
  })

  afterEach(() => {
    globalThis.Path2D = origPath2D
  })

  it('uniform single-series circles collapse to exactly ONE batch', () => {
    const comp = new CanvasCompositor({})
    const ctx = mockCtx()
    const markers = Array.from({ length: 500 }, (_, i) => ({
      x: i,
      y: 10,
      size: 2,
    }))
    comp._paintMarkers(ctx, mockShim(markers, [SOLID]))

    expect(comp.markerBatchCount()).toBe(1)
    // painter's order preserved: one fill (and stroke) per marker
    expect(ctx.calls.fill).toBe(500)
    expect(ctx.calls.stroke).toBe(500)
    expect(ctx.calls.beginPath).toBe(500)
  })

  it('two style runs (two series) -> two batches', () => {
    const comp = new CanvasCompositor({})
    const ctx = mockCtx()
    const markers = [
      ...Array.from({ length: 50 }, (_, i) => ({ x: i, y: 5, size: 2, style: 0 })),
      ...Array.from({ length: 50 }, (_, i) => ({ x: i, y: 9, size: 2, style: 1 })),
    ]
    comp._paintMarkers(ctx, mockShim(markers, [SOLID, SOLID2]))
    expect(comp.markerBatchCount()).toBe(2)
  })

  it('non-circle run reuses ONE unit Path2D and translates per marker', () => {
    const comp = new CanvasCompositor({})
    const ctx = mockCtx()
    // shape 1 = square in the SHAPE_ID table
    const markers = Array.from({ length: 100 }, (_, i) => ({
      x: i * 3,
      y: 20,
      size: 4,
      shape: 1,
    }))
    comp._paintMarkers(ctx, mockShim(markers, [SOLID]))

    expect(comp.markerBatchCount()).toBe(1)
    expect(ctx.calls.fill).toBe(100)
    // every fill received the SAME unit path instance (no per-marker Path2D)
    const unique = new Set(ctx.calls.fillPathArgs)
    expect(unique.size).toBe(1)
    // unit geometry is origin-based; position comes from the transform
    expect([...unique][0].d).toContain('M -4 -4')
    // per-marker setTransform + one restore at the end of the run
    expect(ctx.calls.setTransform).toBe(101)
  })

  it('invalid points (NaN y / zero size) skip geometry but keep the batch', () => {
    const comp = new CanvasCompositor({})
    const ctx = mockCtx()
    const markers = [
      { x: 1, y: 5, size: 2 },
      { x: 2, y: NaN, size: 2 },
      { x: 3, y: 6, size: 0 },
      { x: 4, y: 7, size: 2 },
    ]
    comp._paintMarkers(ctx, mockShim(markers, [SOLID]))
    expect(comp.markerBatchCount()).toBe(1)
    expect(ctx.calls.fill).toBe(2)
  })
})
