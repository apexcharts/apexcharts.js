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
 * A datum's highlight-filter part (drawn solid over its faded whole), or
 * null: the point's own `highlight` wins over the series' `highlightData`,
 * as the feature reads them. The split aligns both with the data.
 * @param {any} s
 * @param {any} d
 * @param {number} j
 * @returns {number | null}
 */
function partOf(s, d, j) {
  const p =
    d && typeof d === 'object' && !Array.isArray(d) && 'highlight' in d
      ? d.highlight
      : Array.isArray(s.highlightData)
        ? s.highlightData[j]
        : null
  return typeof p === 'number' && isFinite(p) ? p : null
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
 * @param {boolean} [parts] highlight-filter parts reach the axis too (a part
 *   can pass its whole, and a shared bound would clip it)
 * @returns {{ min: number, max: number } | null} null when no finite value exists
 */
export function yExtent(panels, xForm, parts = false) {
  const ext = { min: Infinity, max: -Infinity }
  panels.forEach((p) =>
    p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return
      s.data.forEach((/** @type {any} */ d, /** @type {number} */ j) => {
        extendByDatum(d, xForm, ext)
        const v = parts ? partOf(s, d, j) : null
        if (v !== null) extendByDatum(v, 'plain', ext)
      })
    }),
  )
  if (!isFinite(ext.min) || !isFinite(ext.max)) return null
  return ext
}

/**
 * Does this series add its values to a stack, given the chart's stacking
 * config? Mirrors the rule `Range._getMinYMaxY` applies: everything stacks
 * when the chart is stacked, except that `stackOnlyBar` keeps non-bar series
 * (a reference line over stacked columns) out of the pile.
 * @param {any} s
 * @param {{ stackOnlyBar?: boolean }} opts
 * @returns {boolean}
 */
function stacksInto(s, opts) {
  if (!opts.stackOnlyBar) return true
  const t = s && s.type
  return t === undefined || t === null || t === 'bar' || t === 'column'
}

/**
 * The union y extent of a STACKED trellis: the extent of the per-x stack
 * TOTALS, not of the individual values.
 *
 * A stacked panel draws to the height of its tallest pile, so sharing a scale
 * built from single values clips exactly the panels the shared scale exists to
 * make comparable. Positive and negative runs accumulate separately (they grow
 * in opposite directions from the baseline), series are grouped by
 * `series[i].group` the way the core groups them, and anything that does not
 * stack still contributes its own raw values.
 *
 * Alignment is what makes index `j` mean the same x in every series of a
 * panel — the split has already re-emitted each panel against the union x
 * list, with explicit nulls.
 *
 * With `parts`, highlight-filter parts form their own piles beside the
 * wholes' (the feature stacks parts on parts), each folded the same way.
 *
 * @param {import('./TrellisSplit').TrellisSlice[]} panels
 * @param {'plain'|'paired'|'object'} xForm
 * @param {{ stackOnlyBar?: boolean, parts?: boolean }} [opts]
 * @returns {{ min: number, max: number } | null}
 */
export function stackedYExtent(panels, xForm, opts = {}) {
  const ext = { min: Infinity, max: -Infinity }
  /** @param {number} v */
  const fold = (v) => {
    if (!isFinite(v)) return
    if (v < ext.min) ext.min = v
    if (v > ext.max) ext.max = v
  }
  /** @param {any} d */
  const scalarY = (d) => {
    if (d === null || d === undefined) return null
    const y = xForm === 'paired' ? d[1] : xForm === 'object' ? d.y : d
    if (y === null || y === undefined || Array.isArray(y)) return null
    const v = Number(y)
    return isFinite(v) ? v : null
  }

  panels.forEach((p) => {
    /** @type {Map<string, {pos: number[], neg: number[]}>} */
    const groups = new Map()
    p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return
      if (!stacksInto(s, opts)) {
        // Not in the pile, but still on the axis.
        s.data.forEach((/** @type {any} */ d) => extendByDatum(d, xForm, ext))
        return
      }
      const key = String(s.group ?? '')
      /** @param {string} k */
      const pile = (k) => {
        const acc = groups.get(k) || { pos: [], neg: [] }
        groups.set(k, acc)
        return acc
      }
      const acc = pile(key)
      const parts = opts.parts ? pile('~' + key) : null
      s.data.forEach((/** @type {any} */ d, /** @type {number} */ j) => {
        ;[acc, parts].forEach((a, k) => {
          if (!a) return
          if (a.pos[j] === undefined) {
            a.pos[j] = 0
            a.neg[j] = 0
          }
          const v = k ? partOf(s, d, j) : scalarY(d)
          if (v === null) return
          if (v > 0) a.pos[j] += v
          else a.neg[j] += v
        })
      })
    })
    groups.forEach((acc) => {
      acc.pos.forEach(fold)
      acc.neg.forEach(fold)
    })
  })

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
 * @param {boolean} [parts] highlight-filter parts in the window count too
 * @returns {{ min: number, max: number } | null}
 */
export function yExtentInWindow(panels, xForm, xMin, xMax, parts = false) {
  const ext = { min: Infinity, max: -Infinity }
  panels.forEach((p) =>
    p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return
      s.data.forEach((/** @type {any} */ d, /** @type {number} */ j) => {
        if (d === null || d === undefined) return
        const rawX = xForm === 'paired' ? d[0] : xForm === 'object' ? d.x : null
        const x = rawX instanceof Date ? rawX.getTime() : Number(rawX)
        if (!isFinite(x) || x < xMin || x > xMax) return
        extendByDatum(d, xForm, ext)
        const v = parts ? partOf(s, d, j) : null
        if (v !== null) extendByDatum(v, 'plain', ext)
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
 * @param {{ chartType?: string, userColors?: any[], yExtentOverride?: { min: number, max: number } | null, stacked?: boolean, stackType?: string, stackOnlyBar?: boolean, parts?: boolean }} host
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

  // A stacked panel is as tall as its tallest PILE, so a shared scale built
  // from single values clips the very panels it exists to make comparable.
  //
  // '100%' draws percentages, so its domain is 0..100 whatever the numbers are.
  // Deriving it from the data instead, on the grounds that the core normalizes
  // the axis anyway, held only for the FIRST render: the core rewrites the
  // bounds when it reads a config carrying `chart.stackType`, and a panel
  // update carries only what changed, never the stacking. So every panel
  // started at 0..100 and dropped to the raw value range on the first update.
  const percent = !!host.stacked && host.stackType === '100%'
  const stacked = !!host.stacked && !percent
  /** @param {import('./TrellisSplit').TrellisSlice[]} group */
  const extentOf = (group) =>
    percent
      ? { min: 0, max: 100 }
      : stacked
        ? stackedYExtent(group, splitResult.xForm, {
            stackOnlyBar: host.stackOnlyBar,
            parts: host.parts,
          })
        : yExtent(group, splitResult.xForm, host.parts)

  /** @type {{ min: number, max: number, tickAmount: number } | null} */
  let y = null
  if (yMode === 'shared') {
    // A type frame (P5) can supply the y extent when the DRAWN domain is not
    // the data's own values (histogram: bin counts, not observations).
    y = toBounds(host.yExtentOverride || extentOf(splitResult.panels))
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
      const b = toBounds(extentOf(panels))
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
      const b = toBounds(extentOf(panels))
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
