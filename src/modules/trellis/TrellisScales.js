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
 * Round an extent out to 1-2-5-nice bounds with an integer tick count.
 * @param {number} min
 * @param {number} max
 * @param {number} [targetTicks]
 * @returns {{ min: number, max: number, tickAmount: number }}
 */
export function niceBounds(min, max, targetTicks = 4) {
  if (!isFinite(min) || !isFinite(max)) {
    return { min: 0, max: 1, tickAmount: 1 }
  }
  if (min === max) {
    // A flat domain still needs height to draw in.
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1
    min -= pad
    max += pad
  }
  const rawStep = (max - min) / Math.max(1, targetTicks)
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const norm = rawStep / mag
  // Threshold selection (not a ceiling): the 1-2-5 step whose tick count
  // lands CLOSEST to the target, so a 0..97 domain gets steps of 20 (5
  // ticks), not 50 (2 ticks).
  const step = (norm <= 1.5 ? 1 : norm <= 3 ? 2 : norm <= 7 ? 5 : 10) * mag
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  return {
    min: niceMin,
    max: niceMax,
    tickAmount: Math.max(1, Math.round((niceMax - niceMin) / step)),
  }
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
 * @param {{ chartType?: string, userColors?: any[] }} host
 * @returns {{
 *   x: { min: number, max: number } | null,
 *   y: { min: number, max: number, tickAmount: number } | null,
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

  /** @type {{ min: number, max: number, tickAmount: number } | null} */
  let y = null
  if (yMode === 'shared') {
    const ext = yExtent(splitResult.panels, splitResult.xForm)
    if (ext) {
      // Bars measure from a baseline: an all-positive bar trellis must share
      // the zero baseline or panel heights lie.
      const barFamily = ['bar', 'column', 'rangeBar', 'candlestick', 'boxPlot'].includes(
        host.chartType || '',
      )
      if (barFamily && ext.min > 0) ext.min = 0
      y = niceBounds(ext.min, ext.max, cfg.targetTicks || 4)
    }
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

  return { x, y, colorOf, palette }
}
