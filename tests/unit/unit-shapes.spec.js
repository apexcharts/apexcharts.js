/**
 * Shape lint for `apexcharts/unit-shapes`.
 *
 * A curated collection only stays curated if quality is MECHANICAL. Judging 11
 * shapes by eye is feasible; judging 40 across four dot counts and three plot
 * sizes is not, and that is where a collection quietly rots: one shape starts
 * overlapping at high counts, another empties its last rows when trimmed, and
 * nobody notices because the screenshot that would have shown it was never
 * taken.
 *
 * So every shape is measured here, and the thresholds below are the quality bar:
 *
 *  - exact count, ids preserved, finite positions, positive radii
 *  - no overlap: the gap between the nearest pair is at least the sum of their
 *    radii (this is what caught the globe drawing rim dots on top of each other)
 *  - even density: the largest nearest-neighbour gap is close to the median one
 *    (this is what catches holes and isolated dots)
 *  - inside the shape: for silhouettes, every dot's centre is within the outline;
 *    for strokes, within half a stroke width of the centreline
 *  - honest metadata: every shape passes at its own declared `minUnits`
 *  - deterministic, and responsive to the plot rect
 *
 * Being pure JS with no DOM, the whole engine runs right here. That is the point
 * of parsing paths ourselves rather than borrowing the browser's.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  catalog,
  heart,
  house,
  globe,
  pyramid,
  shapeFrom,
  registerShapes,
  unregisterShapes,
} from '../../src/unit-shapes/index.js'
import { flattenPath, boundsOf, signedArea } from '../../src/unit-shapes/engine/path.js'
import { getUnitLayout } from '../../src/modules/UnitLayoutRegistry.js'
import { _resetWarnings } from '../../src/unit-shapes/engine/shape.js'

const RECTS = [
  { x: 0, y: 0, width: 640, height: 400 },
  { x: 12, y: 8, width: 300, height: 220 },
  { x: 0, y: 0, width: 240, height: 460 },
]

/** The chart's own dot radius for a mid-size plot; layouts may refine it. */
const ENGINE_R = 4.4

const objects = (n, r = ENGINE_R) =>
  Array.from({ length: n }, (_, i) => ({
    id: `0:${i}`,
    index: i,
    seriesIndex: 0,
    dataPointIndex: i,
    label: 'cat',
    value: 1,
    datum: undefined,
    r,
  }))

/** Nearest-neighbour distance for every dot, and the tightest pair by radii. */
function neighbours(pos) {
  const dists = []
  let tightest = Infinity
  for (let i = 0; i < pos.length; i++) {
    let best = Infinity
    let bestJ = -1
    for (let j = 0; j < pos.length; j++) {
      if (i === j) continue
      const d = Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y)
      if (d < best) {
        best = d
        bestJ = j
      }
    }
    if (bestJ < 0) continue
    dists.push(best)
    tightest = Math.min(tightest, best / (pos[i].r + pos[bestJ].r))
  }
  const sorted = [...dists].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)] || 0
  return {
    tightest,
    median,
    spread: median ? Math.max(...dists) / median : 0,
  }
}

/** Nonzero-winding point-in-polygon, written independently of the packer. */
function inside(polys, x, y) {
  let wind = 0
  for (const pts of polys) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      if (a.y === b.y) continue
      const down = b.y > a.y
      const lo = down ? a.y : b.y
      const hi = down ? b.y : a.y
      if (y < lo || y >= hi) continue
      const xAt = a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x)
      if (xAt > x) wind += down ? 1 : -1
    }
  }
  return wind !== 0
}

/** The shape's outline in the same pixel space the layout used. */
function fittedOutline(shape, rect, padding = 0.94) {
  const polys = flattenPath(shape.shape.path, shape.shape.sampling ?? 0.6)
  const b = boundsOf(polys)
  const bw = b.x1 - b.x0
  const bh = b.y1 - b.y0
  const scale = Math.min((rect.width * padding) / bw, (rect.height * padding) / bh)
  const offX = rect.x + rect.width / 2 - (b.x0 + bw / 2) * scale
  const offY = rect.y + rect.height / 2 - (b.y0 + bh / 2) * scale
  return polys.map((pts) =>
    pts.map((p) => ({ x: offX + p.x * scale, y: offY + p.y * scale })),
  )
}

/**
 * The same fit for a stroke, whose box is grown by half the stroke width before
 * being fitted (otherwise the glyph is scaled to the plot and then clipped by
 * exactly that margin). Returns the centreline in pixels plus the half width in
 * pixels, which is the containment radius.
 */
function fittedCentreline(shape, rect, padding = 0.94) {
  const half = (shape.shape.width ?? 16) / 2
  const polys = flattenPath(shape.shape.path, shape.shape.sampling ?? 0.6, true)
  const b = boundsOf(polys)
  const bw = b.x1 - b.x0 + half * 2
  const bh = b.y1 - b.y0 + half * 2
  const scale = Math.min((rect.width * padding) / bw, (rect.height * padding) / bh)
  const offX = rect.x + rect.width / 2 - (b.x0 - half + bw / 2) * scale
  const offY = rect.y + rect.height / 2 - (b.y0 - half + bh / 2) * scale
  return {
    polys: polys.map((pts) =>
      pts.map((p) => ({ x: offX + p.x * scale, y: offY + p.y * scale })),
    ),
    r: half * scale,
  }
}

/** Distance from a point to the nearest segment of any polyline. */
function distToCentreline(polys, x, y) {
  let best = Infinity
  polys.forEach((pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const ax = pts[i].x
      const ay = pts[i].y
      const dx = pts[i + 1].x - ax
      const dy = pts[i + 1].y - ay
      const len2 = dx * dx + dy * dy
      let t = len2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / len2 : 0
      t = Math.max(0, Math.min(1, t))
      const d = Math.hypot(x - (ax + t * dx), y - (ay + t * dy))
      if (d < best) best = d
    }
  })
  return best
}

describe('unit-shapes: catalog hygiene', () => {
  it('every shape carries the metadata the collection is curated on', () => {
    const allowed = [
      'nature',
      'objects',
      'people',
      'business',
      'technology',
      'symbols',
      'geography',
    ]
    catalog.forEach((shape) => {
      const meta = shape.shape
      expect(typeof shape).toBe('function')
      expect(meta.name).toMatch(/^[a-z][a-z0-9-]*$/)
      expect(allowed).toContain(meta.category)
      expect(meta.minUnits).toBeGreaterThan(0)
      expect(meta.source).toBeTruthy()
      // The provenance rule, enforced rather than trusted: an outline is either
      // ours ('original') or does not exist ('generated'). A third-party path is
      // not admissible even under a permissive licence, because it ships
      // verbatim inside dist/unit-shapes.js and its notice would then have to
      // travel into every consumer's bundle. A new value here means someone
      // brought an outline in from outside; that is the decision to revisit, not
      // the assertion to relax.
      expect(['original', 'generated']).toContain(meta.source)
      expect(['silhouette', 'stroke', 'rings', 'globe', 'tiers']).toContain(meta.kind)
      if (meta.kind === 'silhouette') expect(meta.path).toBeTruthy()
      if (meta.kind === 'stroke') {
        expect(meta.path).toBeTruthy()
        expect(meta.width).toBeGreaterThan(0)
      }
    })
  })

  it('names are unique, since they are the registered and imported API', () => {
    const names = catalog.map((s) => s.shape.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('metadata is frozen, so a shape cannot be mutated in place', () => {
    expect(Object.isFrozen(heart.shape)).toBe(true)
  })

  it('every shape is annotated pure, or importing one ships all of them', () => {
    // One module per shape only tree-shakes from SOURCE. Through the published
    // bundle, where Rollup has already merged the modules into one file, a
    // bundler cannot tell that an unused shape is safe to drop: it sees a
    // top-level call. The annotation is what tells it (measured: 3.8 KB gz for
    // one shape versus 5.9 KB for the catalog). A new shape without it silently
    // takes the whole collection with it.
    const dir = join(process.cwd(), 'src/unit-shapes/shapes')
    const files = readdirSync(dir).filter((f) => f.endsWith('.js'))
    expect(files.length).toBe(catalog.length)
    files.forEach((f) => {
      const src = readFileSync(join(dir, f), 'utf8')
      expect(src, `${f} is missing its /* @__PURE__ */ annotation`).toMatch(
        /export const \w+ = \/\* @__PURE__ \*\//,
      )
    })
  })

  it('the catalog, the package exports and the types all agree', () => {
    // Three lists have to be kept in step by hand, and a shape missing from any
    // one of them fails in a way nothing else catches: absent from the catalog it
    // is invisible to every test in this file, and absent from the .d.ts it ships
    // untyped while still working perfectly in JavaScript.
    const read = (f) => readFileSync(join(process.cwd(), f), 'utf8')
    const names = (src, re) => new Set(Array.from(src.matchAll(re), (m) => m[1]))

    const exported = names(
      read('src/unit-shapes/index.js'),
      /export \{ (\w+) \} from '\.\/shapes\//g,
    )
    const imported = names(
      read('src/unit-shapes/catalog.js'),
      /import \{ (\w+) \} from '\.\/shapes\//g,
    )
    const typed = names(
      read('types/unit-shapes.d.ts'),
      /^export const (\w+): ApexUnitShape$/gm,
    )
    const inCatalog = new Set(catalog.map((s) => s.shape.name))

    expect([...exported].sort()).toEqual([...inCatalog].sort())
    expect([...imported].sort()).toEqual([...inCatalog].sort())
    expect([...typed].sort()).toEqual([...inCatalog].sort())
  })

  it('no shape carries an attribution, because none may need one', () => {
    // Backstop for the provenance rule. The `source` enum blocks the honest
    // route in; this catches the other one, where a third-party outline arrives
    // labelled 'original' with a credit tacked on beside it. If a shape ever
    // legitimately needs attribution, the catalog policy has changed and that is
    // a decision to make deliberately, not a test to delete.
    const dir = join(process.cwd(), 'src/unit-shapes/shapes')
    readdirSync(dir)
      .filter((f) => f.endsWith('.js'))
      .forEach((f) => {
        const src = readFileSync(join(dir, f), 'utf8')
        expect(src, `${f} looks like it carries third-party provenance`).not.toMatch(
          /\b(licen[cs]e|attribution|copyright|\(c\)\s*\d{4})\b/i,
        )
      })
  })
})

describe('unit-shapes: every shape, every count, every plot size', () => {
  catalog.forEach((shape) => {
    const { name, minUnits, lint } = shape.shape
    const counts = [minUnits, 220, 820, 2000]

    it(`${name}: places exactly the dots it is given, keeping their ids`, () => {
      counts.forEach((n) => {
        RECTS.forEach((rect) => {
          const objs = objects(n)
          const pos = shape(objs, rect)
          expect(pos).toHaveLength(n)
          expect(pos.map((p) => p.id)).toEqual(objs.map((o) => o.id))
          pos.forEach((p) => {
            expect(Number.isFinite(p.x)).toBe(true)
            expect(Number.isFinite(p.y)).toBe(true)
            expect(p.r).toBeGreaterThan(0)
          })
        })
      })
    })

    it(`${name}: stays inside the plot rect`, () => {
      RECTS.forEach((rect) => {
        shape(objects(820), rect).forEach((p) => {
          expect(p.x).toBeGreaterThanOrEqual(rect.x - p.r)
          expect(p.x).toBeLessThanOrEqual(rect.x + rect.width + p.r)
          expect(p.y).toBeGreaterThanOrEqual(rect.y - p.r)
          expect(p.y).toBeLessThanOrEqual(rect.y + rect.height + p.r)
        })
      })
    })

    it(`${name}: no two dots overlap`, () => {
      // 1.0 would be exactly touching. Only the outermost ring of a target at a
      // very high count grazes it, hence the 2% of slack.
      const floor = lint?.minSeparation ?? 0.98
      counts.forEach((n) => {
        const { tightest } = neighbours(shape(objects(n), RECTS[0]))
        expect(
          tightest,
          `${name} at ${n} units: nearest pair is ${tightest.toFixed(3)} of their radii`,
        ).toBeGreaterThan(floor)
      })
    })

    it(`${name}: density is even, with no isolated dots or holes`, () => {
      counts.forEach((n) => {
        const { spread } = neighbours(shape(objects(n), RECTS[0]))
        expect(
          spread,
          `${name} at ${n} units: widest gap is ${spread.toFixed(2)}x the median`,
        ).toBeLessThan(1.9)
      })
    })

    it(`${name}: is deterministic`, () => {
      const a = shape(objects(220), RECTS[0])
      const b = shape(objects(220), RECTS[0])
      expect(a).toEqual(b)
    })

    if (shape.shape.kind === 'silhouette') {
      it(`${name}: every dot sits inside the outline`, () => {
        const rect = RECTS[0]
        const polys = fittedOutline(shape, rect)
        const pos = shape(objects(820), rect)
        const strays = pos.filter((p) => !inside(polys, p.x, p.y))
        expect(strays, `${strays.length} dots outside the outline`).toHaveLength(0)
      })
    }

    if (shape.shape.kind === 'stroke') {
      it(`${name}: every dot sits on the stroke`, () => {
        // The stroke equivalent of the point-in-polygon check, and independent of
        // the engine in the same way: refit the centreline here and measure each
        // dot's distance to it, rather than trusting the region that placed them.
        const rect = RECTS[0]
        const { polys, r } = fittedCentreline(shape, rect)
        const pos = shape(objects(820), rect)
        const strays = pos.filter(
          (p) => distToCentreline(polys, p.x, p.y) > r + 0.75,
        )
        expect(strays, `${strays.length} dots off the stroke`).toHaveLength(0)
      })
    }
  })
})

describe('unit-shapes: outlines', () => {
  it('holes are wound against their outline, which is what punches them', () => {
    // The house has a door and two windows; the rocket has a porthole. If one
    // were wound the same way as its outline it would fill in silently.
    const polys = flattenPath(house.shape.path, 0.6)
    const areas = polys.map((p) => Math.sign(signedArea(p)))
    expect(areas[0]).not.toBe(0)
    expect(areas.slice(1).every((a) => a === -areas[0])).toBe(true)
    expect(areas).toHaveLength(4)
  })

  it("the house's openings are actually empty", () => {
    const rect = RECTS[0]
    const pos = house(objects(820), rect)
    const polys = flattenPath(house.shape.path, 0.6)
    const b = boundsOf(polys)
    const bw = b.x1 - b.x0
    const bh = b.y1 - b.y0
    const scale = Math.min((rect.width * 0.94) / bw, (rect.height * 0.94) / bh)
    const offX = rect.x + rect.width / 2 - (b.x0 + bw / 2) * scale
    const offY = rect.y + rect.height / 2 - (b.y0 + bh / 2) * scale
    // The door, in path units, inset by a dot so edge dots do not count.
    const door = { x0: 46, x1: 54, y0: 74, y1: 92 }
    const held = pos.filter(
      (p) =>
        p.x > offX + door.x0 * scale &&
        p.x < offX + door.x1 * scale &&
        p.y > offY + door.y0 * scale &&
        p.y < offY + door.y1 * scale,
    )
    expect(held).toHaveLength(0)
  })
})

describe('unit-shapes: the path parser', () => {
  it('handles relative commands', () => {
    const abs = flattenPath('M 10 10 L 30 10 L 30 30 L 10 30 Z', 0.6)
    const rel = flattenPath('m 10 10 l 20 0 l 0 20 l -20 0 z', 0.6)
    expect(boundsOf(rel)).toEqual(boundsOf(abs))
  })

  it('reads arc flags packed together, as a minifier emits them', () => {
    // "a5 5 0 0110 0" is largeArc=0, sweep=1, endpoint 10,0.
    const spaced = flattenPath('M 0 0 a 5 5 0 0 1 10 0 z', 0.6)
    const packed = flattenPath('M 0 0a5 5 0 0110 0z', 0.6)
    const a = boundsOf(spaced)
    const b = boundsOf(packed)
    expect(b.x1 - b.x0).toBeCloseTo(a.x1 - a.x0, 6)
    expect(b.y1 - b.y0).toBeCloseTo(a.y1 - a.y0, 6)
  })

  it('reflects the control point for S and T', () => {
    const explicit = flattenPath('M 0 0 C 0 10 10 10 10 0 C 10 -10 20 -10 20 0 Z', 0.6)
    const smooth = flattenPath('M 0 0 C 0 10 10 10 10 0 S 20 -10 20 0 Z', 0.6)
    expect(boundsOf(smooth)).toEqual(boundsOf(explicit))
  })

  it('closes an unclosed subpath, so a shape is never an open outline', () => {
    const polys = flattenPath('M 0 0 L 10 0 L 10 10', 0.6)
    expect(polys).toHaveLength(1)
    expect(Math.abs(signedArea(polys[0]))).toBeGreaterThan(0)
  })

  it('survives nonsense without throwing', () => {
    expect(() => flattenPath('', 0.6)).not.toThrow()
    expect(() => flattenPath('M', 0.6)).not.toThrow()
    expect(() => flattenPath('L 5 5 banana', 0.6)).not.toThrow()
    expect(flattenPath('nonsense', 0.6)).toEqual([])
  })
})

describe('unit-shapes: shape objects', () => {
  it('.with() returns a variant and leaves the original alone', () => {
    const rect = RECTS[0]
    const objs = objects(220)
    const rows = heart(objs, rect)
    const cols = heart.with({ order: 'cols' })(objs, rect)
    expect(cols.map((p) => p.id)).toEqual(rows.map((p) => p.id))
    expect(cols).not.toEqual(rows)
    // The original still orders by rows.
    expect(heart(objs, rect)).toEqual(rows)
    expect(heart.shape.order ?? 'rows').toBe('rows')
  })

  it('warns once when a chart has fewer units than the shape needs', () => {
    _resetWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const small = shapeFrom(heart.shape.path, { name: 'tiny-heart', minUnits: 200 })
    small(objects(20), RECTS[0])
    small(objects(20), RECTS[0])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toMatch(/tiny-heart/)
    warn.mockRestore()
  })

  it('shapeFrom packs a caller-supplied outline', () => {
    const diamond = shapeFrom('M 50 0 L 100 50 L 50 100 L 0 50 Z', {
      name: 'diamond',
    })
    const pos = diamond(objects(300), RECTS[0])
    expect(pos).toHaveLength(300)
    const { tightest } = neighbours(pos)
    expect(tightest).toBeGreaterThan(0.98)
  })

  it('an empty chart lays out nothing rather than throwing', () => {
    catalog.forEach((shape) => {
      expect(shape([], RECTS[0])).toEqual([])
    })
  })
})

describe('unit-shapes: registration', () => {
  it('registers into the same slot the chart resolves names from', () => {
    // The registry writes to the globalThis key UnitLayoutRegistry owns, rather
    // than importing the chart. This test is what keeps that coupling honest.
    expect(getUnitLayout('heart')).toBe(null)
    const names = registerShapes([heart, globe])
    expect(names).toEqual(['heart', 'globe'])
    expect(getUnitLayout('heart')).toBe(heart)
    expect(getUnitLayout('globe')).toBe(globe)
    unregisterShapes(names)
    expect(getUnitLayout('heart')).toBe(null)
  })

  it('a map registers a shape under a name of your own', () => {
    registerShapes({ 'org-chart': pyramid })
    expect(getUnitLayout('org-chart')).toBe(pyramid)
    unregisterShapes('org-chart')
    expect(getUnitLayout('org-chart')).toBe(null)
  })
})
