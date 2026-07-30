import Pie from '../../src/charts/Pie.js'
import {
  arcPoint,
  roundedDonutSegmentPath,
  roundedPieSegmentPath,
  sharpDonutSegmentPath,
} from '../../src/charts/common/arc/ArcPath.js'

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

// Inline transcription of the ORIGINAL (pre-extraction) inline geometry that
// lived in Pie.getRoundedSlicePath and Sunburst._arcPath. If the shared
// builders reproduce this byte-for-byte across an input sweep, the extraction
// (Batch E / audit M17) did not change any emitted path.
function refPoint(cx, cy, radius, deg) {
  return {
    x: cx + radius * Math.cos((deg - 90) * D2R),
    y: cy + radius * Math.sin((deg - 90) * D2R),
  }
}
const rxy = (p) => `${p.x} ${p.y}`

function refRoundedDonut(cx, cy, rIn, rOut, a0, a1, r, spanDeg) {
  const ptAt = (radius, deg) => refPoint(cx, cy, radius, deg)
  const degOut = (r / rOut) * R2D
  const oStart = ptAt(rOut, a0 + degOut)
  const oEnd = ptAt(rOut, a1 - degOut)
  const largeOut = spanDeg - 2 * degOut > 180 ? 1 : 0
  const ocEnd = ptAt(rOut, a1)
  const rEndOut = ptAt(rOut - r, a1)
  const ocStart = ptAt(rOut, a0)
  const rStartOut = ptAt(rOut - r, a0)
  const degIn = (r / rIn) * R2D
  const iEnd = ptAt(rIn, a1 - degIn)
  const iStart = ptAt(rIn, a0 + degIn)
  const largeIn = spanDeg - 2 * degIn > 180 ? 1 : 0
  const icEnd = ptAt(rIn, a1)
  const rEndIn = ptAt(rIn + r, a1)
  const icStart = ptAt(rIn, a0)
  const rStartIn = ptAt(rIn + r, a0)
  return [
    'M', rxy(oStart),
    'A', rOut, rOut, 0, largeOut, 1, rxy(oEnd),
    'Q', rxy(ocEnd), rxy(rEndOut),
    'L', rxy(rEndIn),
    'Q', rxy(icEnd), rxy(iEnd),
    'A', rIn, rIn, 0, largeIn, 0, rxy(iStart),
    'Q', rxy(icStart), rxy(rStartIn),
    'L', rxy(rStartOut),
    'Q', rxy(ocStart), rxy(oStart),
    'Z',
  ].join(' ')
}

function refRoundedPie(cx, cy, rOut, a0, a1, r, spanDeg) {
  const ptAt = (radius, deg) => refPoint(cx, cy, radius, deg)
  const degOut = (r / rOut) * R2D
  const oStart = ptAt(rOut, a0 + degOut)
  const oEnd = ptAt(rOut, a1 - degOut)
  const largeOut = spanDeg - 2 * degOut > 180 ? 1 : 0
  const ocEnd = ptAt(rOut, a1)
  const rEndOut = ptAt(rOut - r, a1)
  const ocStart = ptAt(rOut, a0)
  const rStartOut = ptAt(rOut - r, a0)
  return [
    'M', rxy(oStart),
    'A', rOut, rOut, 0, largeOut, 1, rxy(oEnd),
    'Q', rxy(ocEnd), rxy(rEndOut),
    'L', `${cx} ${cy}`,
    'L', rxy(rStartOut),
    'Q', rxy(ocStart), rxy(oStart),
    'Z',
  ].join(' ')
}

function refSharpDonut(cx, cy, rIn, rOut, a0, a1, spanDeg) {
  const ptAt = (radius, deg) => refPoint(cx, cy, radius, deg)
  const largeArc = spanDeg > 180 ? 1 : 0
  const A = ptAt(rOut, a0)
  const B = ptAt(rOut, a1)
  const C = ptAt(rIn, a1)
  const Din = ptAt(rIn, a0)
  return [
    'M', rxy(A),
    'A', rOut, rOut, 0, largeArc, 1, rxy(B),
    'L', rxy(C),
    'A', rIn, rIn, 0, largeArc, 0, rxy(Din),
    'Z',
  ].join(' ')
}

const SWEEP = []
for (const cx of [100, 137.5]) {
  for (const rOut of [80, 123.4]) {
    for (const rIn of [30, 47.2]) {
      for (const a0 of [0, 33.3, 200]) {
        for (const span of [20, 90, 190.7]) {
          const a1 = a0 + span
          const spanRad = span * D2R
          const r = Math.min(8, (spanRad * rIn) / 2, (rOut - rIn) / 2)
          SWEEP.push({ cx, cy: cx, rIn, rOut, a0, a1, r, spanDeg: span })
        }
      }
    }
  }
}

describe('ArcPath is byte-faithful to the original inline geometry', () => {
  it('roundedDonutSegmentPath matches the reference across the sweep', () => {
    for (const c of SWEEP) {
      expect(roundedDonutSegmentPath(c)).toBe(
        refRoundedDonut(c.cx, c.cy, c.rIn, c.rOut, c.a0, c.a1, c.r, c.spanDeg),
      )
    }
  })

  it('roundedPieSegmentPath matches the reference across the sweep', () => {
    for (const c of SWEEP) {
      const arg = {
        cx: c.cx,
        cy: c.cy,
        rOut: c.rOut,
        a0: c.a0,
        a1: c.a1,
        r: c.r,
        spanDeg: c.spanDeg,
      }
      expect(roundedPieSegmentPath(arg)).toBe(
        refRoundedPie(c.cx, c.cy, c.rOut, c.a0, c.a1, c.r, c.spanDeg),
      )
    }
  })

  it('sharpDonutSegmentPath matches the reference across the sweep', () => {
    for (const c of SWEEP) {
      const arg = {
        cx: c.cx,
        cy: c.cy,
        rIn: c.rIn,
        rOut: c.rOut,
        a0: c.a0,
        a1: c.a1,
        spanDeg: c.spanDeg,
      }
      expect(sharpDonutSegmentPath(arg)).toBe(
        refSharpDonut(c.cx, c.cy, c.rIn, c.rOut, c.a0, c.a1, c.spanDeg),
      )
    }
  })
})

describe('ArcPath.arcPoint', () => {
  it('places 0deg at 12 o clock and 90deg at 3 o clock', () => {
    const top = arcPoint(100, 100, 50, 0)
    expect(top.x).toBeCloseTo(100, 9)
    expect(top.y).toBeCloseTo(50, 9)
    const right = arcPoint(100, 100, 50, 90)
    expect(right.x).toBeCloseTo(150, 9)
    expect(right.y).toBeCloseTo(100, 9)
  })
})

describe('Pie.getRoundedSlicePath delegates to the shared builder', () => {
  function makePie(chartType) {
    const pie = Object.create(Pie.prototype)
    pie.centerX = 100
    pie.centerY = 100
    pie.donutSize = 40
    pie.chartType = chartType
    return pie
  }

  it('donut path equals roundedDonutSegmentPath with the clamped radius', () => {
    const me = makePie('donut')
    const startDeg = 0
    const spanDeg = 90
    const size = 80
    const borderRadius = 8
    const out = me.getRoundedSlicePath({ me, startDeg, spanDeg, size, borderRadius })

    const spanRad = spanDeg * D2R
    let r = borderRadius
    r = Math.min(r, (spanRad * size) / 2)
    r = Math.min(r, (spanRad * 40) / 2)
    r = Math.min(r, (size - 40) / 2)
    const expected = roundedDonutSegmentPath({
      cx: 100,
      cy: 100,
      rIn: 40,
      rOut: 80,
      a0: 0,
      a1: 90,
      r,
      spanDeg,
    })
    expect(out).toBe(expected)
  })

  it('pie path equals roundedPieSegmentPath with the clamped radius', () => {
    const me = makePie('pie')
    const startDeg = 10
    const spanDeg = 60
    const size = 80
    const borderRadius = 6
    const out = me.getRoundedSlicePath({ me, startDeg, spanDeg, size, borderRadius })

    const spanRad = spanDeg * D2R
    let r = borderRadius
    r = Math.min(r, (spanRad * size) / 2)
    r = Math.min(r, size / 2)
    const expected = roundedPieSegmentPath({
      cx: 100,
      cy: 100,
      rOut: 80,
      a0: 10,
      a1: 70,
      r,
      spanDeg,
    })
    expect(out).toBe(expected)
  })

  it('returns null when the slice is too small to round', () => {
    const me = makePie('donut')
    expect(
      me.getRoundedSlicePath({ me, startDeg: 0, spanDeg: 0.2, size: 80, borderRadius: 8 }),
    ).toBeNull()
  })
})
