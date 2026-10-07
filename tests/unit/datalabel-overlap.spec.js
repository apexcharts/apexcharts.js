import { describe, it, expect } from 'vitest'
import { resolveLabelOverlaps } from '../../src/modules/helpers/DataLabelOverlap.js'
import DataLabels from '../../src/modules/DataLabels.js'

// The geometry half of cross-series data-label de-overlap. The DOM half
// (measure, move, hide) is covered by tests/interaction/datalabel-overlap.spec.js,
// which needs real text metrics; everything here is pure numbers.

/** @param {number} x @param {number} y @param {object} [o] */
const box = (x, y, o = {}) => ({
  x,
  y,
  width: o.width ?? 50,
  height: o.height ?? 16,
  order: o.order ?? 0,
  fixed: o.fixed ?? false,
})

const OPTS = { gap: 2, maxShift: 20, minY: -16, maxY: 400, hide: true }

/**
 * Apply the resolved shifts and report every pair still overlapping, so a test
 * asserts the thing that matters (nothing collides) rather than exact pixels.
 */
const collisionsAfter = (boxes, opts = OPTS) => {
  const res = resolveLabelOverlaps(boxes, opts)
  const live = boxes
    .map((b, i) => ({ ...b, y: b.y + res[i].dy, i, hidden: res[i].hidden }))
    .filter((b) => !b.hidden)

  const pairs = []
  for (let a = 0; a < live.length; a++) {
    for (let b = a + 1; b < live.length; b++) {
      const p = live[a]
      const q = live[b]
      const ox = Math.min(p.x + p.width, q.x + q.width) - Math.max(p.x, q.x)
      const oy = Math.min(p.y + p.height, q.y + q.height) - Math.max(p.y, q.y)
      if (ox > 0 && oy > 0) pairs.push([p.i, q.i])
    }
  }
  return { res, pairs, visible: live.length }
}

describe('resolveLabelOverlaps', () => {
  it('leaves a single label alone', () => {
    expect(resolveLabelOverlaps([box(0, 100)], OPTS)).toEqual([
      { dy: 0, hidden: false },
    ])
  })

  it('leaves labels that do not collide alone', () => {
    // Same row, far apart horizontally.
    const boxes = [box(0, 100), box(200, 100)]
    const res = resolveLabelOverlaps(boxes, OPTS)
    expect(res.map((r) => r.dy)).toEqual([0, 0])
    expect(res.some((r) => r.hidden)).toBe(false)
  })

  it('separates two labels that landed on exactly the same spot', () => {
    // The reported dual-axis case: two series, same pixel row.
    const boxes = [box(100, 200, { order: 0 }), box(100, 200, { order: 1 })]
    const { res, pairs, visible } = collisionsAfter(boxes)

    expect(pairs).toEqual([])
    expect(visible).toBe(2) // neither is dropped; there was room for both
    // Split symmetrically: first-drawn up, second down.
    expect(res[0].dy).toBeLessThan(0)
    expect(res[1].dy).toBeGreaterThan(0)
  })

  it('breaks an exact tie by draw order, so a re-render cannot flip the pair', () => {
    const a = resolveLabelOverlaps(
      [box(100, 200, { order: 0 }), box(100, 200, { order: 1 })],
      OPTS,
    )
    const b = resolveLabelOverlaps(
      [box(100, 200, { order: 0 }), box(100, 200, { order: 1 })],
      OPTS,
    )
    expect(a).toEqual(b)
    expect(a[0].dy).toBeLessThan(a[1].dy)
  })

  it('keeps the requested gap between separated labels', () => {
    const boxes = [box(100, 200, { order: 0 }), box(100, 200, { order: 1 })]
    const res = resolveLabelOverlaps(boxes, { ...OPTS, gap: 6 })
    const top = Math.min(boxes[0].y + res[0].dy, boxes[1].y + res[1].dy)
    const bottom = Math.max(boxes[0].y + res[0].dy, boxes[1].y + res[1].dy)
    expect(bottom - (top + 16)).toBeGreaterThanOrEqual(6 - 0.01)
  })

  it('separates partially overlapping neighbours (the waterfall case)', () => {
    // Adjacent bars, labels wider than their slots: a few px of overlap on
    // both axes rather than a direct hit.
    const boxes = [box(100, 200, { order: 0 }), box(140, 206, { order: 1 })]
    const { pairs, visible } = collisionsAfter(boxes)
    expect(pairs).toEqual([])
    expect(visible).toBe(2)
  })

  it('pushes the whole separation downwards when the upper label is against the ceiling', () => {
    // A mark at the very top of the plot: its label cannot move up, so its
    // partner has to absorb the full push.
    const boxes = [box(100, -16, { order: 0 }), box(100, -16, { order: 1 })]
    const { res, pairs } = collisionsAfter(boxes, { ...OPTS, minY: -16 })

    expect(pairs).toEqual([])
    expect(res[0].dy).toBe(0) // pinned at minY
    expect(res[1].dy).toBeGreaterThan(0)
  })

  it('does not push a label off the bottom of the plot', () => {
    const boxes = [box(100, 384, { order: 0 }), box(100, 384, { order: 1 })]
    const res = resolveLabelOverlaps(boxes, { ...OPTS, maxY: 400 })
    for (let i = 0; i < boxes.length; i++) {
      if (res[i].hidden) continue
      expect(boxes[i].y + res[i].dy + boxes[i].height).toBeLessThanOrEqual(400.01)
      expect(boxes[i].y + res[i].dy).toBeGreaterThanOrEqual(-16.01)
    }
  })

  it('never moves a label further than maxShift from its own mark', () => {
    // Six labels stacked on one spot: far more than the budget can separate.
    const boxes = Array.from({ length: 6 }, (_, i) =>
      box(100, 200, { order: i }),
    )
    const res = resolveLabelOverlaps(boxes, { ...OPTS, maxShift: 10 })
    for (const r of res) {
      expect(Math.abs(r.dy)).toBeLessThanOrEqual(10.01)
    }
  })

  it('leaves what it cannot separate alone by default (hide is opt-in)', () => {
    const boxes = Array.from({ length: 6 }, (_, i) =>
      box(100, 200, { order: i }),
    )
    const res = resolveLabelOverlaps(boxes, { ...OPTS, maxShift: 10, hide: false })
    expect(res.some((r) => r.hidden)).toBe(false)
  })

  it('never drops a label that was never allowed to move', () => {
    // Two rotated labels on the same spot: neither can be separated, so both
    // stay. Deleting one would lose a value the chart drew before this pass.
    const boxes = [
      box(100, 200, { order: 0, fixed: true }),
      box(100, 200, { order: 1, fixed: true }),
    ]
    const res = resolveLabelOverlaps(boxes, { ...OPTS, hide: true })
    expect(res.map((r) => r.dy)).toEqual([0, 0])
    expect(res.some((r) => r.hidden)).toBe(false)
  })

  it('treats a fixed label as an obstacle: the movable one goes around it', () => {
    const boxes = [
      box(100, 200, { order: 0, fixed: true }),
      box(100, 200, { order: 1 }),
    ]
    const { res, pairs } = collisionsAfter(boxes)
    expect(pairs).toEqual([])
    expect(res[0].dy).toBe(0)
    expect(Math.abs(res[1].dy)).toBeGreaterThan(0)
  })

  it('hides what it cannot separate when hide is on', () => {
    const boxes = Array.from({ length: 6 }, (_, i) =>
      box(100, 200, { order: i }),
    )
    const { pairs, res } = collisionsAfter(boxes, { ...OPTS, maxShift: 10 })

    expect(pairs).toEqual([])
    expect(res.some((r) => r.hidden)).toBe(true)
    // The earliest-drawn label is the one that survives.
    expect(res[0].hidden).toBe(false)
  })

  it('does not chain a dense row into one tall column', () => {
    // Twenty labels marching right, each overlapping only its neighbour.
    // Column packing would stack them all; pairwise relaxation must not.
    const boxes = Array.from({ length: 20 }, (_, i) =>
      box(i * 40, 200, { order: i }),
    )
    const res = resolveLabelOverlaps(boxes, OPTS)
    const span =
      Math.max(...res.map((r) => r.dy)) - Math.min(...res.map((r) => r.dy))
    expect(span).toBeLessThanOrEqual(2 * OPTS.maxShift + 0.01)
  })

  it('is stable: resolving an already-resolved layout changes nothing', () => {
    const boxes = [box(100, 200, { order: 0 }), box(140, 206, { order: 1 })]
    const first = resolveLabelOverlaps(boxes, OPTS)
    const settled = boxes.map((b, i) => ({ ...b, y: b.y + first[i].dy }))
    const second = resolveLabelOverlaps(settled, OPTS)
    expect(second.map((r) => r.dy)).toEqual([0, 0])
    expect(second.some((r) => r.hidden)).toBe(false)
  })
})

// The bounds avoidOverlaps hands the resolver are the plot's edges, in the
// screen space the label boxes are measured in. On a chart's first render
// the pass runs before the grid is drawn and before the plot group is moved
// into place, so the edges come from that group's own screen matrix, not from
// the `.apexcharts-grid` box (absent then, and a pixel short of the plot top
// once it exists).
describe('DataLabels.avoidOverlaps keeps labels inside the plot', () => {
  const SVGNS = 'http://www.w3.org/2000/svg'
  const PLOT = { left: 40, top: 400, width: 300, height: 200 }

  /** Two coincident 12px labels whose top is 5px under the plot's top. */
  function mountLabels() {
    const baseEl = document.createElement('div')
    const svg = document.createElementNS(SVGNS, 'svg')
    const plotGroup = document.createElementNS(SVGNS, 'g')
    const labels = document.createElementNS(SVGNS, 'g')
    labels.setAttribute('class', 'apexcharts-datalabels')
    svg.appendChild(plotGroup)
    svg.appendChild(labels)
    baseEl.appendChild(svg)
    const matrix = (e, f) => ({ a: 1, b: 0, c: 0, d: 1, e, f })
    const texts = [0, 1].map(() => {
      const t = document.createElementNS(SVGNS, 'text')
      t.setAttribute('class', 'apexcharts-datalabel')
      t.setAttribute('y', '17')
      t.getBoundingClientRect = () => ({
        left: PLOT.left + 100,
        top: PLOT.top + 5,
        width: 30,
        height: 12,
        right: PLOT.left + 130,
        bottom: PLOT.top + 17,
      })
      t.getScreenCTM = () => matrix(PLOT.left, PLOT.top)
      labels.appendChild(t)
      return t
    })
    // the plot group's corner is the plot's corner on screen
    plotGroup.getScreenCTM = () => matrix(PLOT.left, PLOT.top)
    const w = {
      config: {
        chart: { type: 'line' },
        dataLabels: { avoidOverlap: true, background: { enabled: false } },
        plotOptions: {},
      },
      dom: { baseEl, elGraphical: { node: plotGroup } },
      layout: { gridWidth: PLOT.width, gridHeight: PLOT.height },
    }
    return { w, texts }
  }

  it('stops the upper label at the plot top and gives the rest to the lower one', () => {
    const { w, texts } = mountLabels()
    new DataLabels(w).avoidOverlaps()
    const moved = texts.map((t) => parseFloat(t.getAttribute('y')) - 17)
    // 14px to separate (12 + the 2px gap): 5 up to the plot top, 9 down
    expect(moved[0]).toBeCloseTo(-5, 5)
    expect(moved[1]).toBeCloseTo(9, 5)
  })
})
