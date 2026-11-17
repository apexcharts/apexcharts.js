/**
 * Hovering the hole of a unit glyph (a ring), however its contours wind and
 * whatever rule fills it.
 *
 * Production report: the tooltip flickered between datapoints over a crowd of
 * rings. Unit hover is DOM hit-testing on each glyph's <path>, and a path is
 * hit on its ink only, so over the hole the pointer fell through to the
 * background: the series group heard a mouseout and closed the tooltip, and
 * nothing reopened it until the pointer met ink again.
 *
 * A first fix filled the whole path `nonzero` to find the outline, which
 * covers the hole only when both contours wind the same way. Icon tools
 * usually wind a hole against its outline, under either fill rule, and those
 * rings still dropped the tooltip over the hole.
 *
 * jsdom has neither Path2D nor getScreenCTM, which the hit test reads, so the
 * test supplies both: an identity screen matrix (client px are then the unit
 * root's own px) and a Path2D whose `isPointInPath` really fills polygon path
 * data (M L H V Z, absolute and relative) by its winding number under the rule
 * asked for. A fake that filled any ring's outline would hide the bug.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'
import { splitSubpaths } from '../../src/charts/Unit.js'

// Square rings in a 24 box. The outer square runs clockwise on screen.
// Hole wound the same way: only evenodd leaves it open.
const RING = 'M0 0H24V24H0Z M6 6H18V18H6Z'
// Hole wound against the outline: open under evenodd AND nonzero, the usual
// output of icon tools.
const RING_CCW = 'M0 0H24V24H0Z M6 6V18H18V6Z'
// The same counter-wound ring in relative commands, the hole placed by a
// relative `m` from where the outline closed.
const RING_REL = 'm0 0h24v24h-24z m6 6v12h12v-12z'
// A "U": a notch cut into the outline from the top. Not a hole.
const NOTCH = 'M0 0H8V16H16V0H24V24H0Z'
// The "U" with a hole in its base: the hole is the mark's, the notch is not.
const NOTCH_HOLED = 'M0 0H8V16H16V0H24V24H0Z M2 18V22H22V18Z'
// Two separate parts, a gap between: the gap is nobody's.
const TWO_PARTS = 'M0 0H24V8H0Z M0 14H24V24H0Z'

/** The polygons of M/L/H/V/Z path data, one per subpath. */
const polygons = (d) => {
  const polys = []
  let cur = null
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  for (const [, c, args] of d.matchAll(/([MLHVZmlhvz])([^MLHVZmlhvz]*)/g)) {
    const n = (args.match(/-?[\d.]+/g) || []).map(Number)
    const rel = c === c.toLowerCase()
    const C = c.toUpperCase()
    if (C === 'Z') {
      x = sx
      y = sy
      cur = null
      continue
    }
    if (C === 'M') {
      x = n[0] + (rel ? x : 0)
      y = n[1] + (rel ? y : 0)
      sx = x
      sy = y
      cur = [[x, y]]
      polys.push(cur)
      continue
    }
    if (!cur) {
      cur = [[sx, sy]]
      polys.push(cur)
    }
    if (C === 'H') x = n[0] + (rel ? x : 0)
    else if (C === 'V') y = n[0] + (rel ? y : 0)
    else {
      x = n[0] + (rel ? x : 0)
      y = n[1] + (rel ? y : 0)
    }
    cur.push([x, y])
  }
  return polys
}
/** Winding number of polygon `poly` around (px, py). */
const winding = (poly, px, py) => {
  let w = 0
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i]
    const [x1, y1] = poly[(i + 1) % poly.length]
    const cross = (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0)
    if (y0 <= py && y1 > py && cross > 0) w++
    else if (y0 > py && y1 <= py && cross < 0) w--
  }
  return w
}

class FakePath2D {
  static made = []
  constructor(d) {
    this.d = d
    FakePath2D.made.push(d)
  }
}
const pathCalls = []
const isPointInPath = (p, x, y, rule = 'nonzero') => {
  pathCalls.push(p.d)
  const w = polygons(p.d).reduce((sum, poly) => sum + winding(poly, x, y), 0)
  return rule === 'evenodd' ? w % 2 !== 0 : w !== 0
}

const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, inverse: () => identity }
const realCTM = SVGElement.prototype.getScreenCTM
const realGetContext = HTMLCanvasElement.prototype.getContext

let chart
beforeEach(() => {
  FakePath2D.made = []
  pathCalls.length = 0
  globalThis.Path2D = FakePath2D
  SVGElement.prototype.getScreenCTM = () => identity
  HTMLCanvasElement.prototype.getContext = () => ({ isPointInPath })
})
afterEach(() => {
  vi.useRealTimers()
  chart?.destroy()
  chart = null
  delete globalThis.Path2D
  SVGElement.prototype.getScreenCTM = realCTM
  HTMLCanvasElement.prototype.getContext = realGetContext
  vi.restoreAllMocks()
})

async function mount(mark, tooltip = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'unit',
      width: 600,
      height: 400,
      animations: { enabled: false },
    },
    tooltip,
    series: [
      { name: 'A', data: [{ id: 'a0' }, { id: 'a1' }, { id: 'a2' }] },
      { name: 'B', data: [{ id: 'b0' }, { id: 'b1' }] },
    ],
    plotOptions: {
      unit: {
        layout: 'packed',
        shape: 'pictogram',
        pictogram: { mark },
        clusterLabels: { show: false },
      },
    },
  })
  await chart.render()
  return chart
}

const glyphs = () => [
  ...chart.w.dom.baseEl.querySelectorAll('path.apexcharts-unit-area'),
]
/** A glyph's slot centre and px per viewBox unit, read back off its transform. */
const slot = (el) => {
  const m = /translate\((-?[\d.e-]+),(-?[\d.e-]+)\) scale\(([\d.e-]+)\)/.exec(
    el.getAttribute('transform'),
  )
  const s = +m[3]
  return { x: +m[1] + 12 * s, y: +m[2] + 12 * s, s }
}
const tooltipEl = () => chart.w.dom.baseEl.querySelector('.apexcharts-tooltip')
const tooltipOpen = () => tooltipEl().classList.contains('apexcharts-active')

/** Dispatch a pointer event as a browser would, past the hover throttle. */
const fire = (target, type, x, y, relatedTarget = null) => {
  chart.w.globals.tooltip.lastHoverTime = 0
  target.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      clientX: x,
      clientY: y,
      relatedTarget,
    }),
  )
}

// Every ring form: the hole is open in each (checked below against the fake
// fill, so the forms really are rings), and the mark owns it in each.
const RINGS = [
  ['evenodd, hole wound with the outline', RING, 'evenodd'],
  ['evenodd, hole wound against the outline', RING_CCW, 'evenodd'],
  ['nonzero, hole wound against the outline', RING_CCW, undefined],
  ['evenodd, relative commands', RING_REL, 'evenodd'],
  ['nonzero, relative commands', RING_REL, undefined],
]

describe('unit chart: a glyph with a hole owns its hole', () => {
  it.each(RINGS)('the fake fill leaves the hole open: %s', (_, path, rule) => {
    const p = new FakePath2D(path)
    expect(isPointInPath(p, 12, 12, rule)).toBe(false)
    expect(isPointInPath(p, 3, 12, rule)).toBe(true)
    // The first fix's outline, the whole path nonzero, misses the hole of
    // every counter-wound ring: the case it got wrong.
    if (path !== RING) expect(isPointInPath(p, 12, 12, 'nonzero')).toBe(false)
  })

  it.each(RINGS)('the hit test finds the ring under its hole, and nothing off its outline: %s', async (_, path, fillRule) => {
    await mount({ path, viewBox: [0, 0, 24, 24], fillRule })
    const hit = chart.w.globals.unitHoleHit
    expect(typeof hit).toBe('function')
    glyphs().forEach((g) => {
      const c = slot(g)
      // Dead centre is the hole: the ring itself, not the background.
      expect(hit(c.x, c.y)).toBe(g)
      // Ink, hole, ink across the ring: the same mark all the way.
      for (let u = -11.5; u <= 11.5; u += 0.5) {
        expect(hit(c.x + u * c.s, c.y)).toBe(g)
        expect(hit(c.x, c.y + u * c.s)).toBe(g)
      }
      // Just past the outer edge is nobody's, so no hit area spills.
      expect(hit(c.x + 12.5 * c.s, c.y)).toBe(null)
      expect(hit(c.x, c.y - 12.5 * c.s)).toBe(null)
    })
    // One Path2D per subpath of the one distinct glyph, however many marks
    // and queries.
    expect(FakePath2D.made).toHaveLength(2)
  })

  it.each(RINGS)('the tooltip stays on the ring while the pointer crosses its hole: %s', async (_, path, fillRule) => {
    await mount({ path, viewBox: [0, 0, 24, 24], fillRule })
    const svg = chart.w.dom.Paper.node
    const ring = glyphs()[1]
    const c = slot(ring)
    const inkX = c.x - 9 * c.s

    fire(ring, 'mousemove', inkX, c.y)
    expect(tooltipOpen()).toBe(true)
    const shown = tooltipEl().textContent

    // Off the ink into the hole: the browser targets what is under the hole.
    fire(ring, 'mouseout', c.x, c.y, svg)
    expect(tooltipOpen()).toBe(true)
    fire(svg, 'mousemove', c.x, c.y)
    expect(tooltipOpen()).toBe(true)
    expect(tooltipEl().textContent).toBe(shown)

    // Out of the hole and off every mark: it closes, as leaving ink does.
    fire(svg, 'mousemove', c.x + 40 * c.s, c.y + 40 * c.s)
    expect(tooltipOpen()).toBe(false)

    // And straight into a hole from outside opens that ring's tooltip.
    const other = glyphs()[4]
    const o = slot(other)
    fire(svg, 'mousemove', o.x, o.y)
    expect(tooltipOpen()).toBe(true)
    expect(tooltipEl().textContent).toContain('B')
  })

  it('a glyph without a hole keeps its ink-only hit area: a notch is a miss', async () => {
    await mount({ path: NOTCH, viewBox: [0, 0, 24, 24], fillRule: 'evenodd' })
    // One contour, whatever its fill rule: nothing to resolve, so no plot
    // listener and no hit test at all.
    expect(chart.w.globals.unitHoleHit).toBe(null)
    expect(FakePath2D.made).toHaveLength(0)
    const svg = chart.w.dom.Paper.node
    const g = glyphs()[0]
    const c = slot(g)
    fire(g, 'mousemove', c.x - 9 * c.s, c.y)
    expect(tooltipOpen()).toBe(true)
    // Into the notch: closes, exactly as before.
    fire(g, 'mouseout', c.x, c.y - 8 * c.s, svg)
    expect(tooltipOpen()).toBe(false)
  })

  it.each([['evenodd'], [undefined]])(
    'with a hole in it, the notch is still a miss and the hole a hit (%s)',
    async (fillRule) => {
      await mount({ path: NOTCH_HOLED, viewBox: [0, 0, 24, 24], fillRule })
      const hit = chart.w.globals.unitHoleHit
      glyphs().forEach((g) => {
        const c = slot(g)
        // The hole in the base (viewBox 12, 20).
        expect(hit(c.x, c.y + 8 * c.s)).toBe(g)
        // The notch (viewBox 12, 4) is outside the outline.
        expect(hit(c.x, c.y - 8 * c.s)).toBe(null)
        expect(hit(c.x - 3.5 * c.s, c.y - 8 * c.s)).toBe(null)
      })
    },
  )

  it('the gap between two separate parts is nobody\'s', async () => {
    await mount({ path: TWO_PARTS, viewBox: [0, 0, 24, 24] })
    const hit = chart.w.globals.unitHoleHit
    glyphs().forEach((g) => {
      const c = slot(g)
      expect(hit(c.x, c.y - 8 * c.s)).toBe(g)
      expect(hit(c.x, c.y + 6 * c.s)).toBe(g)
      expect(hit(c.x, c.y - 1 * c.s)).toBe(null)
    })
  })
})

// The hole listener sits on the whole plot, so it hears every move over bare
// plot too. Away from a hole it must close exactly as leaving ink always has:
// at once for a plain tooltip, and for an interactive one only after the
// grace that lets the pointer cross bare plot to reach the box, which
// entering the box calls off.
describe('unit chart: the hole listener leaves closing off a hole alone', () => {
  // Past the interactive grace, whatever travel allowance it adds.
  const PAST_GRACE = 1000

  /** A ring, the point at its ink's middle, its hole, and bare plot. */
  const setup = async (tooltip) => {
    await mount({ path: RING_CCW, viewBox: [0, 0, 24, 24] }, tooltip)
    vi.useFakeTimers()
    const svg = chart.w.dom.Paper.node
    const ring = glyphs()[1]
    const c = slot(ring)
    const bare = { x: c.x + 40 * c.s, y: c.y + 40 * c.s }
    // The bare point really is on no mark, hole or not.
    expect(chart.w.globals.unitHoleHit(bare.x, bare.y)).toBe(null)
    return { svg, ring, c, ink: { x: c.x - 9 * c.s, y: c.y }, bare }
  }

  it('an interactive box stays reachable across bare plot after leaving the ink', async () => {
    const { svg, ring, c, ink, bare } = await setup({ interactive: true })
    fire(ring, 'mousemove', ink.x, ink.y)
    expect(tooltipOpen()).toBe(true)

    // Off the ink onto bare plot, then on across it toward the box.
    fire(ring, 'mouseout', bare.x, bare.y, svg)
    fire(svg, 'mousemove', bare.x, bare.y)
    fire(svg, 'mousemove', bare.x + 2 * c.s, bare.y)
    expect(tooltipOpen()).toBe(true)

    // Into the box before the grace runs out: it stays.
    tooltipEl().dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(PAST_GRACE)
    expect(tooltipOpen()).toBe(true)
  })

  it('an interactive box left on bare plot closes once its grace runs out', async () => {
    const { svg, ring, c, ink, bare } = await setup({ interactive: true })
    fire(ring, 'mousemove', ink.x, ink.y)
    fire(ring, 'mouseout', bare.x, bare.y, svg)
    // Moves over bare plot neither close it early nor put the close off.
    for (let k = 0; k < 5; k++) {
      fire(svg, 'mousemove', bare.x + k * c.s, bare.y)
      vi.advanceTimersByTime(20)
    }
    expect(tooltipOpen()).toBe(true)
    vi.advanceTimersByTime(PAST_GRACE)
    expect(tooltipOpen()).toBe(false)
  })

  it('out of a hole onto bare plot, an interactive box gets the same grace', async () => {
    const { svg, c, bare } = await setup({ interactive: true })
    fire(svg, 'mousemove', c.x, c.y)
    expect(tooltipOpen()).toBe(true)
    fire(svg, 'mousemove', bare.x, bare.y)
    fire(svg, 'mousemove', bare.x + 2 * c.s, bare.y)
    expect(tooltipOpen()).toBe(true)
    tooltipEl().dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(PAST_GRACE)
    expect(tooltipOpen()).toBe(true)

    // And without the box, the close it started lands.
    fire(svg, 'mousemove', c.x, c.y)
    fire(svg, 'mousemove', bare.x, bare.y)
    vi.advanceTimersByTime(PAST_GRACE)
    expect(tooltipOpen()).toBe(false)
  })

  it('a plain tooltip still closes at once on bare plot, from ink or from a hole', async () => {
    const { svg, ring, c, ink, bare } = await setup({})
    fire(ring, 'mousemove', ink.x, ink.y)
    fire(ring, 'mouseout', bare.x, bare.y, svg)
    expect(tooltipOpen()).toBe(false)
    fire(svg, 'mousemove', bare.x, bare.y)
    expect(tooltipOpen()).toBe(false)

    fire(svg, 'mousemove', c.x, c.y)
    expect(tooltipOpen()).toBe(true)
    fire(svg, 'mousemove', bare.x, bare.y)
    expect(tooltipOpen()).toBe(false)
  })

  it.each([[{}], [{ interactive: true }]])(
    'the hole still holds its mark, past any grace (%j)',
    async (tooltip) => {
      const { svg, ring, c, ink } = await setup(tooltip)
      fire(ring, 'mousemove', ink.x, ink.y)
      const shown = tooltipEl().textContent
      fire(ring, 'mouseout', c.x, c.y, svg)
      fire(svg, 'mousemove', c.x, c.y)
      vi.advanceTimersByTime(PAST_GRACE)
      expect(tooltipOpen()).toBe(true)
      fire(svg, 'mousemove', c.x + 2 * c.s, c.y - 2 * c.s)
      vi.advanceTimersByTime(PAST_GRACE)
      expect(tooltipOpen()).toBe(true)
      expect(tooltipEl().textContent).toBe(shown)
    },
  )

  it('a touch dragged out of a hole keeps the box until it lifts, as one off ink does', async () => {
    const { svg, c, bare } = await setup({})
    const touch = (type, x, y) => {
      chart.w.globals.tooltip.lastHoverTime = 0
      const e = new Event(type, { bubbles: true })
      const pts = type === 'touchend' ? [] : [{ clientX: x, clientY: y }]
      Object.defineProperty(e, 'touches', { value: pts })
      svg.dispatchEvent(e)
    }
    touch('touchmove', c.x, c.y)
    expect(tooltipOpen()).toBe(true)
    touch('touchmove', bare.x, bare.y)
    expect(tooltipOpen()).toBe(true)
    touch('touchend')
    expect(tooltipOpen()).toBe(false)
  })
})

describe('splitSubpaths', () => {
  it('gives each subpath an absolute start, so it stands alone', () => {
    expect(splitSubpaths(RING_REL)).toEqual(['M0 0h24v24h-24Z', 'M6 6v12h12v-12Z'])
    // A relative move with no close before it is placed from the last point.
    expect(splitSubpaths('M1 1h4v4 m2 2h3v3z')).toEqual(['M1 1h4v4', 'M7 7h3v3Z'])
    // Further pairs after a move are lines of the same relativity.
    expect(splitSubpaths('m1 1 4 0 0 4z m1 1 2 0 0 2z')).toEqual([
      'M1 1l4 0l0 4Z',
      'M2 2l2 0l0 2Z',
    ])
  })

  it('reads compact arc flags and tracks an arc\'s end point', () => {
    const ring = 'M12 1a11 11 0 1 1 0 22a11 11 0 1 1 0-22Z M12 6a6 6 0 1 0 0 12a6 6 0 1 0 0-12Z'
    expect(splitSubpaths(ring)).toEqual([
      'M12 1a11 11 0 1 1 0 22a11 11 0 1 1 0 -22Z',
      'M12 6a6 6 0 1 0 0 12a6 6 0 1 0 0 -12Z',
    ])
    // Flags written together ('110' is 1, 1, 0), then a relative move.
    expect(splitSubpaths('M0 0a5 5 0 110 10z m3 0h1v1z')).toEqual([
      'M0 0a5 5 0 1 1 0 10Z',
      'M3 0h1v1Z',
    ])
    // Curves end on their last pair.
    expect(splitSubpaths('M0 0c1 1 2 2 3 3 m1 1h1z')).toEqual([
      'M0 0c1 1 2 2 3 3',
      'M4 4h1Z',
    ])
  })

  it('starts a new subpath where the last began after a close, and drops bare moves', () => {
    expect(splitSubpaths('M5 5h2v2z l1 0 0 1z')).toEqual(['M5 5h2v2Z', 'M5 5l1 0l0 1Z'])
    expect(splitSubpaths('M0 0H24V24H0Z M5 5')).toEqual(['M0 0H24V24H0Z'])
    expect(splitSubpaths('L1 1')).toEqual([])
    // Stops at a malformed token, as a browser stops drawing there.
    expect(splitSubpaths('M0 0h4v4z M1 1h2 #v2z')).toEqual(['M0 0h4v4Z', 'M1 1h2'])
  })
})
