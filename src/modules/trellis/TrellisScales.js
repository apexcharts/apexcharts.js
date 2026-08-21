// @ts-check
/**
 * Trellis (#22): shared-scale resolution.
 *
 * Computes the union domains across all panel slices and turns them into the
 * explicit `{ min, max, tickAmount }` every panel receives. Identical scale
 * input is what makes identical geometry output (spike 22a Q1): every panel
 * runs the library's own scale code on the same bounds, so ticks, label
 * strings, measured label widths and therefore the plot rectangle all agree.
 *
 * The nice-bounds algorithm here does not need to match the library's
 * `Scales.niceScale`; it only needs to hand every panel the SAME bounds.
 * A plain 1-2-5 step keeps the labels readable.
 *
 * Pure module: no DOM, no `w`.
 *
 * @module modules/trellis/TrellisScales
 */
import { getThemePalettes } from '../../utils/ThemePalettes'

/**
 * Default tick-interval target for the shared y scale. A trellis panel is
 * small: 3 intervals means at most 4-5 labels, which is the most a
 * 100-200px plot wears without the axis outweighing the data.
 */
export const DEFAULT_TARGET_TICKS = 3

/**
 * Round an extent out to nice bounds with an integer tick count.
 *
 * Candidate steps are 1-2-(2.5)-5-10 times the magnitude; the winner is the
 * candidate whose resulting tick count lands CLOSEST to the target (the old
 * fixed thresholds could land 6 ticks against a target of 4: 0..55000 gave
 * a raw step of 13750, rounded DOWN to 10000). Ties prefer fewer ticks
 * (less label ink in a small panel), then the smaller step (less wasted
 * headroom above the data). 2.5 only competes where it keeps integer labels.
 * @param {number} min
 * @param {number} max
 * @param {number} [targetTicks]
 * @returns {{ min: number, max: number, tickAmount: number }}
 */
export function niceBounds(min, max, targetTicks = DEFAULT_TARGET_TICKS) {
  if (!isFinite(min) || !isFinite(max)) {
    return { min: 0, max: 1, tickAmount: 1 }
  }
  if (min === max) {
    // A flat domain still needs height to draw in.
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1
    min -= pad
    max += pad
  }
  const target = Math.max(1, targetTicks)
  const rawStep = (max - min) / target
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const norms = mag >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10]
  let best = { dist: Infinity, ticks: 0, min: 0, max: 1 }
  norms.forEach((n) => {
    const step = n * mag
    const lo = Math.floor(min / step) * step
    const hi = Math.ceil(max / step) * step
    const ticks = Math.max(1, Math.round((hi - lo) / step))
    const dist = Math.abs(ticks - target)
    if (dist < best.dist || (dist === best.dist && ticks < best.ticks)) {
      best = { dist, ticks, min: lo, max: hi }
    }
  })
  return { min: best.min, max: best.max, tickAmount: best.ticks }
}

/**
 * Fold every numeric value of one datum into an extent. Handles the datum
 * forms the split emits: plain numbers, `[x, y]` pairs, and `{ x, y }` objects
 * whose y may be a number, an OHLC/box summary array, or a range pair.
 * @param {any} d
 * @param {'plain'|'paired'|'object'} form
 * @param {{ min: number, max: number }} ext mutated
 */
function extendByDatum(d, form, ext) {
  if (d === null || d === undefined) return
  /** @type {any} */
  let y = d
  if (form === 'paired') y = d[1]
  else if (form === 'object') y = d.y
  if (y === null || y === undefined) return
  if (Array.isArray(y)) {
    for (let i = 0; i < y.length; i++) {
      const v = Number(y[i])
      if (isFinite(v)) {
        if (v < ext.min) ext.min = v
        if (v > ext.max) ext.max = v
      }
    }
    return
  }
  const v = Number(y)
  if (isFinite(v)) {
    if (v < ext.min) ext.min = v
    if (v > ext.max) ext.max = v
  }
}

/**
 * Decimal places of one number, capped at 4 (exponent notation counts as 4).
 * @param {any} v
 * @returns {number}
 */
export function decimalCount(v) {
  if (typeof v !== 'number' || !isFinite(v) || v % 1 === 0) return 0
  const s = String(v)
  if (s.indexOf('e') !== -1 || s.indexOf('E') !== -1) return 4
  return Math.min(4, (s.split('.')[1] || '').length)
}

/**
 * The most decimal places any y value in the trellis carries (capped at 4).
 * The library derives label decimals from each panel's OWN data, so two
 * panels with identical pushed bounds can still render "20" vs "20.00" and
 * come out with different gutters (found via the all-zero placeholder, but
 * equally true for an integer-valued panel among float siblings). The
 * trellis therefore pushes one uniform label formatter with the bounds,
 * sized by this count (and by the tick step's own decimals).
 * @param {import('./TrellisSplit').TrellisSlice[]} panels
 * @returns {number}
 */
export function maxYDecimals(panels) {
  let max = 0
  /** @param {any} v */
  const count = (v) => {
    const d = decimalCount(v)
    if (d > max) max = d
  }
  panels.forEach((p) =>
    p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return
      s.data.forEach((/** @type {any} */ d) => {
        if (d === null || d === undefined) return
        let y = d
        if (Array.isArray(d)) y = d[1]
        else if (typeof d === 'object') y = d.y
        if (Array.isArray(y)) y.forEach(count)
        else count(y)
      })
    }),
  )
  return max
}

/**
 * The union y extent over every panel's every series.
 * @param {import('./TrellisSplit').TrellisSlice[]} panels
 * @param {'plain'|'paired'|'object'} xForm
 * @returns {{ min: number, max: number } | null} null when no finite value exists
 */
export function yExtent(panels, xForm) {
  const ext = { min: Infinity, max: -Infinity }
  panels.forEach((p) =>
    p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return
      s.data.forEach((/** @type {any} */ d) => extendByDatum(d, xForm, ext))
    }),
  )
  if (!isFinite(ext.min) || !isFinite(ext.max)) return null
  return ext
}

/**
 * The union y extent restricted to an x window (numeric x only). Backs the
 * shared-scale autoscale on zoom: the y domain must be the union of what is
 * VISIBLE in every panel, or the first zoom silently un-shares the scale.
 * @param {import('./TrellisSplit').TrellisSlice[]} panels
 * @param {'plain'|'paired'|'object'} xForm
 * @param {number} xMin
 * @param {number} xMax
 * @returns {{ min: number, max: number } | null}
 */
export function yExtentInWindow(panels, xForm, xMin, xMax) {
  const ext = { min: Infinity, max: -Infinity }
  panels.forEach((p) =>
    p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return
      s.data.forEach((/** @type {any} */ d) => {
        if (d === null || d === undefined) return
        const rawX = xForm === 'paired' ? d[0] : xForm === 'object' ? d.x : null
        const x = rawX instanceof Date ? rawX.getTime() : Number(rawX)
        if (!isFinite(x) || x < xMin || x > xMax) return
        extendByDatum(d, xForm, ext)
      })
    }),
  )
  if (!isFinite(ext.min) || !isFinite(ext.max)) return null
  return ext
}

/**
 * Resolve the shared domains and the trellis-wide color map.
 *
 * @param {import('./TrellisSplit').TrellisSplitResult} splitResult
 * @param {{ scales?: { x?: string, y?: string, color?: string }, targetTicks?: number }} cfg
 * @param {{ chartType?: string, userColors?: any[], yExtentOverride?: { min: number, max: number } | null }} host
 * @returns {{
 *   x: { min: number, max: number } | null,
 *   y: { min: number, max: number, tickAmount: number } | null,
 *   rowY: Map<string, { min: number, max: number, tickAmount: number }> | null,
 *   colY: Map<string, { min: number, max: number, tickAmount: number }> | null,
 *   colorOf: (name: string) => string,
 *   palette: string[],
 * }}
 */
export function resolve(splitResult, cfg = {}, host = {}) {
  const scales = cfg.scales || {}
  const xMode = scales.x || 'shared'
  const yMode = scales.y || 'shared'

  // x: only meaningful for a numeric/datetime union; category alignment is
  // done by the union list itself (every panel carries every category).
  /** @type {{ min: number, max: number } | null} */
  let x = null
  if (xMode === 'shared' && splitResult.xIsNumeric && splitResult.unionX.length) {
    const xs = /** @type {number[]} */ (splitResult.unionX)
    x = { min: xs[0], max: xs[xs.length - 1] }
  }

  // Bars measure LENGTH from a baseline: an all-positive bar trellis must
  // share the zero baseline or panel heights lie. Histogram counts likewise.
  // Positional range marks (candlestick, boxPlot, rangeBar, violin) encode
  // POSITION, not length: a candlestick trellis at price 800-900 must not
  // scale from 0 (P5; P1 wrongly floored these).
  const barFamily = ['bar', 'column', 'histogram'].includes(host.chartType || '')
  /** @param {{min:number,max:number}|null} ext */
  const toBounds = (ext) => {
    if (!ext) return null
    if (barFamily && ext.min > 0) ext.min = 0
    return niceBounds(ext.min, ext.max, cfg.targetTicks || DEFAULT_TARGET_TICKS)
  }

  /** @type {{ min: number, max: number, tickAmount: number } | null} */
  let y = null
  if (yMode === 'shared') {
    // A type frame (P5) can supply the y extent when the DRAWN domain is not
    // the data's own values (histogram: bin counts, not observations).
    y = toBounds(host.yExtentOverride || yExtent(splitResult.panels, splitResult.xForm))
  }

  // 2-D group scales (P4): one shared domain per row (comparable along a
  // row, free across rows) or per column. Identical bounds into every panel
  // of the group means identical ticks out: the exit-gate invariant.
  /** @type {Map<string, { min: number, max: number, tickAmount: number }> | null} */
  let rowY = null
  if (yMode === 'independent-row') {
    rowY = new Map()
    const groups = new Map()
    splitResult.panels.forEach((p) => {
      const k = p.rowKey ?? ''
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(p)
    })
    groups.forEach((panels, k) => {
      const b = toBounds(yExtent(panels, splitResult.xForm))
      if (b) rowY?.set(k, b)
    })
  }
  /** @type {Map<string, { min: number, max: number, tickAmount: number }> | null} */
  let colY = null
  if (yMode === 'independent-column') {
    colY = new Map()
    const groups = new Map()
    splitResult.panels.forEach((p) => {
      const k = p.colKey ?? ''
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(p)
    })
    groups.forEach((panels, k) => {
      const b = toBounds(yExtent(panels, splitResult.xForm))
      if (b) colY?.set(k, b)
    })
  }

  // Color: one series-name -> color mapping for the whole trellis. The user's
  // `colors` array wins; the default palette otherwise. Function entries in
  // `colors` are per-datapoint resolvers the trellis cannot index by name, so
  // they fall back to the palette for the shared map.
  const palettes = getThemePalettes()
  const fallback = palettes.palette1
  const userColors = Array.isArray(host.userColors)
    ? host.userColors.filter((c) => typeof c === 'string')
    : []
  const palette = userColors.length ? userColors : fallback
  const names = splitResult.seriesNames
  /** @param {string} name */
  const colorOf = (name) => {
    const idx = names.indexOf(name)
    return palette[(idx === -1 ? 0 : idx) % palette.length]
  }

  return { x, y, rowY, colY, colorOf, palette }
}
