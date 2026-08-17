// @ts-check
/**
 * The three layouts that are not outlines: concentric rings, a sphere, and a
 * triangular lattice.
 *
 * Each of these could be written as a silhouette (a disc, a disc, a triangle)
 * and each would be worse for it. A target wants dots ON rings so it reads as a
 * target rather than as the built-in packed blob; a globe wants dots on a
 * sphere, with the projection doing the curving; a pyramid wants tiers that are
 * real counts, with the dots cutting the slope. Visual quality over abstraction
 * purity: they share the allocation, ordering and radius fitting, and nothing
 * else.
 *
 * @module unit-shapes/engine/radial
 */

import { allocate, fitRadius, assign } from './pack.js'
import { defineShape } from './shape.js'

/** @typedef {import('./shape.js').ShapeMeta} ShapeMeta */
/** @typedef {import('./shape.js').UnitShape} UnitShape */
/** @typedef {import('./shape.js').UnitLayout} UnitLayout */
/** @typedef {import('./pack.js').Slot} Slot */

/** @param {number[]} w */
const sum = (w) => w.reduce((a, b) => a + b, 0)

/**
 * Concentric rings: a target.
 *
 * Ring gap and in-ring gap are the same number, so density is even instead of
 * piling up in the middle, and each ring is turned by the golden angle. That
 * last part matters: rings hold about 2*PI*k dots, so a rational turn (none, or
 * half a step) lines neighbouring rings up and the eye picks out spokes and
 * moire.
 *
 * @param {ShapeMeta} meta
 * @returns {UnitLayout}
 */
function buildRings(meta) {
  const padding = meta.padding == null ? 0.94 : meta.padding
  const inward = meta.order === 'centerIn'
  const twist = meta.twist == null ? 2.399963 : meta.twist

  return (objects, rect) => {
    const n = objects.length
    if (!n) return []
    const radius = (Math.min(rect.width, rect.height) / 2) * padding
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2

    // Ring k sits at (k + 0.5) gaps out, so at that same gap it holds about
    // 2*PI*(k + 0.5) dots. Grow the ring count until they hold n.
    /** @param {number} k */
    const weightsFor = (k) => {
      /** @type {number[]} */
      const w = []
      for (let i = 0; i < k; i++) {
        w.push(Math.max(1, Math.round(2 * Math.PI * (i + 0.5))))
      }
      return w
    }
    let count = 1
    while (count < 400 && sum(weightsFor(count)) < n) count++
    const weights = weightsFor(count)
    const gap = radius / count
    const per = allocate(weights, n)
    const r = fitRadius(objects[0].r > 0 ? objects[0].r : 3, gap)

    /** @type {Slot[]} */
    const slots = []
    for (let k = 0; k < count; k++) {
      const ring = inward ? count - 1 - k : k
      const rr = (ring + 0.5) * gap
      const m = per[ring]
      const phase = twist * ring
      for (let i = 0; i < m; i++) {
        const t = phase + (i / m) * 2 * Math.PI
        slots.push({
          x: cx + rr * Math.cos(t),
          y: cy + rr * Math.sin(t),
          r,
          row: k,
        })
      }
    }
    return assign(objects, slots, 'rows', gap)
  }
}

/**
 * A sphere: latitude bands on the hemisphere facing the viewer.
 *
 * The 3D read comes from three things, none of which is a drawing: rows converge
 * towards the pole, each row bows because the pole leans in, and dots fade
 * smaller as the surface turns away.
 *
 * What it deliberately does NOT do is space dots evenly in LONGITUDE, which is
 * the obvious way to write this and is wrong. Screen spacing along a latitude
 * falls off quadratically towards the limb, so uniform longitude piles rim dots
 * on top of each other (measured: neighbours at 0.7% of their radii at 3000
 * units, i.e. drawn on top of one another, while still looking dense enough to
 * pass the eye). Instead:
 *
 *  - dots are spread evenly in SCREEN x across each row, so no rim crowding,
 *  - latitude bands closer together than one pitch are dropped, so no polar
 *    pile-up either, which is the same failure rotated 90 degrees,
 *  - the pitch itself is bisected, exactly as the silhouette packer does it, so
 *    density follows the dot count.
 *
 * @param {ShapeMeta} meta
 * @returns {UnitLayout}
 */
function buildGlobe(meta) {
  const padding = meta.padding == null ? 0.94 : meta.padding
  const tilt = ((meta.tilt == null ? 15 : meta.tilt) * Math.PI) / 180
  const order = meta.order || 'rows'

  return (objects, rect) => {
    const n = objects.length
    if (!n) return []
    const radius = (Math.min(rect.width, rect.height) / 2) * padding
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    // Positive tilt leans the top pole towards the viewer.
    const cosT = Math.cos(tilt)
    const sinT = Math.sin(tilt)
    const SAMPLES = 40

    /**
     * Project a point on the sphere. The lean rotates the sphere, so `depth`
     * (the z of the rotated point) is what decides visibility and shading.
     * @param {number} sinPhi @param {number} cosPhi @param {number} lon
     */
    const project = (sinPhi, cosPhi, lon) => {
      const z = cosPhi * Math.cos(lon)
      return {
        x: radius * cosPhi * Math.sin(lon),
        y: radius * (sinPhi * cosT + z * sinT),
        depth: z * cosT - sinPhi * sinT,
      }
    }

    /**
     * Candidate dots at a given pitch: latitude rows, walked at one pitch of
     * SCREEN arc length, then filtered so no dot lands within a pitch of one
     * already taken.
     *
     * Two things here are easy to get wrong and both show as damage. First, a
     * leaning sphere does NOT show longitudes -90..90: the visible range widens
     * towards the near pole (whose rings become complete loops) and closes
     * towards the far one, so sampling the un-leaned half leaves a bald crescent
     * along one rim. Second, spacing has to be measured on SCREEN, not in
     * longitude, because longitudinal steps foreshorten to nothing at the limb.
     *
     * The greedy filter is the interesting part. Rows near the visible pole nest
     * inside each other, so a row's neighbour on screen is not its neighbour in
     * latitude, and no amount of comparing consecutive rows will prove they stay
     * apart (an earlier attempt at exactly that still put two polar dots 2px
     * apart). Enforcing separation directly is both simpler and airtight: it
     * thins the polar cap and the limb by construction, and it leaves the
     * graticule visible everywhere it is not crowded.
     *
     * @param {number} pitch
     */
    const candidatesAt = (pitch) => {
      const count = Math.max(3, Math.ceil((Math.PI * radius) / pitch))
      const dLat = Math.PI / count
      const near = pitch * 0.95
      const cell = near
      /** @type {Map<string, {x:number,y:number}[]>} */
      const grid = new Map()
      /** @type {{x:number,y:number,depth:number}[][]} */
      const rows = []
      let total = 0

      const keep = (/** @type {{x:number,y:number}} */ p) => {
        const gx = Math.floor(p.x / cell)
        const gy = Math.floor(p.y / cell)
        for (let a = -1; a <= 1; a++) {
          for (let b = -1; b <= 1; b++) {
            const bucket = grid.get(`${gx + a},${gy + b}`)
            if (!bucket) continue
            for (let i = 0; i < bucket.length; i++) {
              if (Math.hypot(bucket[i].x - p.x, bucket[i].y - p.y) < near) {
                return false
              }
            }
          }
        }
        const key = `${gx},${gy}`
        const own = grid.get(key)
        if (own) own.push(p)
        else grid.set(key, [p])
        return true
      }

      for (let b = 0; b < count; b++) {
        const phi = -Math.PI / 2 + (b + 0.5) * dLat
        const cosPhi = Math.cos(phi)
        const sinPhi = Math.sin(phi)

        // Visible longitudes: depth >= 0.
        const cut = (sinPhi * sinT) / (cosPhi * cosT || 1e-9)
        if (cut >= 1) continue
        const lonMax = cut <= -1 ? Math.PI : Math.acos(cut)
        const closed = lonMax >= Math.PI - 1e-9

        /** @type {{x:number,y:number,depth:number}[]} */
        const pts = []
        /** @type {number[]} */
        const cum = [0]
        for (let k = 0; k <= SAMPLES; k++) {
          const lon = -lonMax + (2 * lonMax * k) / SAMPLES
          const p = project(sinPhi, cosPhi, lon)
          pts.push(p)
          if (k > 0) {
            const q = pts[k - 1]
            cum.push(cum[k - 1] + Math.hypot(p.x - q.x, p.y - q.y))
          }
        }
        const len = cum[cum.length - 1]
        const inset = closed ? 0 : Math.min(pitch * 0.42, len / 2)
        const span = len - 2 * inset
        let m
        if (closed) m = Math.max(1, Math.round(len / pitch))
        else if (span > 0) m = Math.floor(span / pitch) + 1
        else m = len >= pitch * 0.45 ? 1 : 0
        if (!m) continue
        const step = closed ? len / m : m > 1 ? span / (m - 1) : 0

        /** @type {{x:number,y:number,depth:number}[]} */
        const row = []
        let seg = 0
        for (let j = 0; j < m; j++) {
          const s = closed ? j * step : m > 1 ? inset + j * step : len / 2
          while (seg < cum.length - 2 && cum[seg + 1] < s) seg++
          const c0 = cum[seg]
          const c1 = cum[seg + 1]
          const t = c1 > c0 ? (s - c0) / (c1 - c0) : 0
          const p0 = pts[seg]
          const p1 = pts[seg + 1]
          const p = {
            x: cx + p0.x + (p1.x - p0.x) * t,
            y: cy + p0.y + (p1.y - p0.y) * t,
            depth: p0.depth + (p1.depth - p0.depth) * t,
          }
          if (keep(p)) row.push(p)
        }
        if (!row.length) continue
        rows.push(row)
        total += row.length
      }
      return { rows, total }
    }

    // Largest pitch whose surviving candidates still hold every dot.
    let lo = 1
    let hi = 2 * radius
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2
      if (candidatesAt(mid).total >= n) lo = mid
      else hi = mid
    }
    const pitch = lo
    const { rows } = candidatesAt(pitch)
    const per = allocate(
      rows.map((r) => r.length),
      n,
    )
    const baseR = fitRadius(objects[0].r > 0 ? objects[0].r : 3, pitch)

    /** @type {Slot[]} */
    const slots = []
    rows.forEach((row, i) => {
      const take = per[i]
      if (!take) return
      // Thin each row EVENLY rather than truncating it, so trimming to the exact
      // dot count keeps the sphere covered instead of emptying its last rows.
      for (let j = 0; j < take; j++) {
        const p = row[Math.min(row.length - 1, Math.floor((j * row.length) / take))]
        slots.push({
          x: p.x,
          y: p.y,
          // Shading, not spacing: the surface turning away reads as smaller
          // dots. Spacing is already even, so this cannot open a gap.
          r: baseR * (0.62 + 0.38 * Math.sqrt(Math.max(0, p.depth))),
          row: i,
        })
      }
    })
    slots.sort((a, b) => a.y - b.y || a.x - b.x)
    return assign(objects, slots, order, pitch)
  }
}

/**
 * A triangular lattice: a pyramid.
 *
 * Tier t holds t + 1 dots, so the dots themselves cut the slope and every tier
 * is a real count rather than a clipped rectangle. Filled from the base, a head
 * count turns into the hierarchy it describes.
 *
 * @param {ShapeMeta} meta
 * @returns {UnitLayout}
 */
function buildTiers(meta) {
  const padding = meta.padding == null ? 0.94 : meta.padding
  const rowRatio = meta.rowRatio == null ? 0.9 : meta.rowRatio
  const order = meta.order || 'rowsUp'

  return (objects, rect) => {
    const n = objects.length
    if (!n) return []
    const tiers = Math.max(1, Math.round((Math.sqrt(8 * n + 1) - 1) / 2))
    /** @type {number[]} */
    const weights = []
    for (let t = 0; t < tiers; t++) weights.push(t + 1)
    const per = allocate(weights, n)
    const widest = Math.max(...per)

    const dx = Math.min(
      (rect.width * padding) / Math.max(1, widest - 1 + 1.6),
      (rect.height * padding) / (tiers * rowRatio),
    )
    const dy = dx * rowRatio
    const cx = rect.x + rect.width / 2
    const top = rect.y + (rect.height - tiers * dy) / 2
    const r = fitRadius(objects[0].r > 0 ? objects[0].r : 3, dx)

    /** @type {Slot[]} */
    const slots = []
    for (let i = 0; i < tiers; i++) {
      for (let j = 0; j < per[i]; j++) {
        slots.push({
          x: cx + (j - (per[i] - 1) / 2) * dx,
          y: top + (i + 0.5) * dy,
          r,
          row: i,
        })
      }
    }
    return assign(objects, slots, order, dx)
  }
}

/**
 * @param {ShapeMeta} meta
 * @returns {UnitShape}
 */
export function rings(meta) {
  return defineShape({ ...meta, kind: 'rings' }, buildRings)
}

/**
 * @param {ShapeMeta} meta
 * @returns {UnitShape}
 */
export function sphere(meta) {
  return defineShape({ ...meta, kind: 'globe' }, buildGlobe)
}

/**
 * @param {ShapeMeta} meta
 * @returns {UnitShape}
 */
export function tiers(meta) {
  return defineShape({ ...meta, kind: 'tiers' }, buildTiers)
}
