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
import { xKey } from '../helpers/XKey'

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
 *
 * The bounds are rounded to the step's own decimal places: `3 * 0.2` is
 * 0.6000000000000001, and label decimals counted from that printed 2-decimal
 * rates as "0.2000". Those places come back as `decimals` for the label
 * formatter.
 * @param {number} min
 * @param {number} max
 * @param {number} [targetTicks]
 * @returns {{ min: number, max: number, tickAmount: number, decimals: number }}
 */
export function niceBounds(min, max, targetTicks = DEFAULT_TARGET_TICKS) {
  if (!isFinite(min) || !isFinite(max)) {
    return { min: 0, max: 1, tickAmount: 1, decimals: 0 }
  }
  if (min === max) {
    // A flat domain still needs height to draw in.
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1
    min -= pad
    max += pad
  }
  const target = Math.max(1, targetTicks)
  const rawStep = (max - min) / target
  const exp = Math.floor(Math.log10(rawStep))
  const mag = Math.pow(10, exp)
  const norms = mag >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10]
  let bestDist = Infinity
  let best = { min: 0, max: 1, tickAmount: 0, decimals: 0 }
  norms.forEach((n) => {
    const step = n * mag
    // n * 10^exp has -exp places (2.5 only competes from exp 1, so it never
    // adds one); the 10 candidate has one fewer.
    const decimals = Math.min(20, Math.max(0, (n === 10 ? -1 : 0) - exp))
    const lo = +(Math.floor(min / step) * step).toFixed(decimals)
    const hi = +(Math.ceil(max / step) * step).toFixed(decimals)
    const ticks = Math.max(1, Math.round((hi - lo) / step))
    const dist = Math.abs(ticks - target)
    if (dist < bestDist || (dist === bestDist && ticks < best.tickAmount)) {
      bestDist = dist
      best = { min: lo, max: hi, tickAmount: ticks, decimals }
    }
  })
  return best
}

/**
 * A datum's y, read by its OWN shape: `[x, y]`, `{ x, y }` or a bare value.
 * Reading every datum through the trellis's dominant form left a plain
 * reference series (100, 200) beside `[x, y]` panels off the axis, and its
 * line drew far above the plot.
 * @param {any} d
 * @returns {any}
 */
const yOf = (d) =>
  d === null || d === undefined
    ? d
    : Array.isArray(d)
      ? d[1]
      : typeof d === 'object'
        ? d.y
        : d

/**
 * Fold every numeric value of one datum into an extent. The y may be a
 * number, an OHLC/box summary array, or a range pair.
 * @param {any} d
 * @param {{ min: number, max: number }} ext mutated
 * @param {boolean} [pos] positive values only (a log axis)
 */
function extendByDatum(d, ext, pos) {
  const y = yOf(d)
  if (y === null || y === undefined) return
  ;(Array.isArray(y) ? y : [y]).forEach((/** @type {any} */ n) => {
    const v = Number(n)
    if (isFinite(v) && !(pos && v <= 0)) {
      if (v < ext.min) ext.min = v
      if (v > ext.max) ext.max = v
    }
  })
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
        const y = yOf(d)
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
 * @param {boolean} [parts] highlight-filter parts reach the axis too (a part
 *   can pass its whole, and a shared bound would clip it)
 * @param {boolean} [pos] positive values only (a log axis)
 * @returns {{ min: number, max: number } | null} null when no finite value exists
 */
export function yExtent(panels, parts = false, pos = false) {
  const ext = { min: Infinity, max: -Infinity }
  panels.forEach((p) =>
    p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return
      s.data.forEach((/** @type {any} */ d, /** @type {number} */ j) => {
        extendByDatum(d, ext, pos)
        const v = parts ? partOf(s, d, j) : null
        if (v !== null) extendByDatum(v, ext, pos)
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
 * @param {{ stackOnlyBar?: boolean, parts?: boolean }} [opts]
 * @returns {{ min: number, max: number } | null}
 */
export function stackedYExtent(panels, opts = {}) {
  const ext = { min: Infinity, max: -Infinity }
  /** @param {number} v */
  const fold = (v) => {
    if (!isFinite(v)) return
    if (v < ext.min) ext.min = v
    if (v > ext.max) ext.max = v
  }
  /** @param {any} d */
  const scalarY = (d) => {
    const y = yOf(d)
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
        s.data.forEach((/** @type {any} */ d) => extendByDatum(d, ext))
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
 * @param {any} _xForm unused: every datum is read by its own shape
 * @param {number} xMin
 * @param {number} xMax
 * @param {boolean} [parts] highlight-filter parts in the window count too
 * @returns {{ min: number, max: number } | null}
 */
export function yExtentInWindow(panels, _xForm, xMin, xMax, parts = false) {
  const ext = { min: Infinity, max: -Infinity }
  panels.forEach((p) =>
    p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return
      s.data.forEach((/** @type {any} */ d, /** @type {number} */ j) => {
        if (d === null || typeof d !== 'object') return
        // A date string reaches here only on a datetime axis (the union is
        // numeric), so it is parsed the way the split keyed it.
        const x = Number(xKey(Array.isArray(d) ? d[0] : d.x, true))
        if (!isFinite(x) || x < xMin || x > xMax) return
        extendByDatum(d, ext)
        const v = parts ? partOf(s, d, j) : null
        if (v !== null) extendByDatum(v, ext)
      })
    }),
  )
  if (!isFinite(ext.min) || !isFinite(ext.max)) return null
  return ext
}

/**
 * One axis's shared bounds. `decimals` is the label precision (the tick
 * step's, or a log axis's smallest tick's, and the union data's).
 * @typedef {{ min: number, max: number, tickAmount: number, decimals: number }} TrellisBounds
 */
/**
 * One axis's bounds, one per axis with several, or null.
 * @typedef {TrellisBounds | Array<TrellisBounds | null> | null} YBounds
 */

/**
 * Resolve the shared domains and the trellis-wide color map.
 *
 * @param {import('./TrellisSplit').TrellisSplitResult} splitResult
 * @param {{ scales?: { x?: string, y?: string, color?: string }, targetTicks?: number }} cfg
 * @param {{ chartType?: string, userColors?: any[], palette?: string, yaxis?: any[], axisNames?: string[][] | null, yExtentOverride?: { min: number, max: number } | null, stacked?: boolean, stackType?: string, stackOnlyBar?: boolean, parts?: boolean }} host
 *   `yaxis` lists the y axes (`logarithmic`, `logBase` per entry);
 *   `axisNames`, given only for several axes, lists each axis's series
 *   names, one assignment for the whole grid
 * @returns {{
 *   x: { min: number, max: number } | null,
 *   y: YBounds,
 *   rowY: Map<string, YBounds> | null,
 *   colY: Map<string, YBounds> | null,
 *   colorOf: (name: string, raw?: boolean) => any,
 *   palette: any[],
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

  // One y axis, or several (a combo with an opposite rate axis):
  // `axisNames` assigns the series to axes ONCE for the grid, by name, and
  // every axis gets its own shared bounds. Pooled into one extent, a 0..0.4
  // rate axis was pushed the 0..5,000,000 revenue domain and drew flat.
  const yaxes = host.yaxis || []
  const axisNames = host.axisNames
  const axes = axisNames ? axisNames.map((_, ai) => ai) : [0]
  /**
   * The panels holding only axis `ai`'s series.
   * @param {import('./TrellisSplit').TrellisSlice[]} group
   * @param {number} ai
   */
  const onAxis = (group, ai) =>
    axisNames
      ? group.map((p) => ({
          ...p,
          series: p.series.filter((s) => axisNames[ai].includes(s.name)),
        }))
      : group
  // Label decimals per axis, from the union data on that axis (a rate axis
  // must not print revenue in fractions); none for a frame's counts.
  const dataDecimals = axes.map((ai) =>
    host.yExtentOverride ? 0 : maxYDecimals(onAxis(splitResult.panels, ai)),
  )

  /**
   * @param {{min:number,max:number}|null} ext
   * @param {number} ai
   * @returns {TrellisBounds | null}
   */
  const toBounds = (ext, ai) => {
    if (!ext) return null
    const ya = yaxes[ai] || {}
    // A frame's count domain starts at 0, which has no logarithm: it keeps
    // the linear bounds, as before.
    if (ya.logarithmic && ext.min > 0) {
      // Decade bounds from the smallest positive value in ANY panel (the
      // extent holds positives only); each panel picking its own log floor
      // put one value at different heights in a scale called shared. The
      // labels print as many places as the smallest tick needs (0.01), and
      // the data's own, the same in every panel.
      const b = ya.logBase || 10
      /** @param {number} v */
      const L = (v) => +(Math.log(v) / Math.log(b)).toFixed(9)
      const lo = Math.floor(L(ext.min))
      const hi = Math.max(lo + 1, Math.ceil(L(ext.max)))
      return {
        min: b ** lo,
        max: b ** hi,
        tickAmount: hi - lo,
        decimals: Math.max(dataDecimals[ai], decimalCount(b ** lo)),
      }
    }
    if (barFamily && ext.min > 0) ext.min = 0
    const nb = niceBounds(ext.min, ext.max, cfg.targetTicks || DEFAULT_TARGET_TICKS)
    nb.decimals = Math.max(nb.decimals, dataDecimals[ai])
    return nb
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
  /**
   * @param {import('./TrellisSplit').TrellisSlice[]} group
   * @param {number} ai
   */
  const extentOf = (group, ai) => {
    const sub = onAxis(group, ai)
    return yaxes[ai]?.logarithmic
      ? yExtent(sub, host.parts, true)
      : percent
        ? { min: 0, max: 100 }
        : stacked
          ? stackedYExtent(sub, {
              stackOnlyBar: host.stackOnlyBar,
              parts: host.parts,
            })
          : yExtent(sub, host.parts)
  }
  /**
   * One group's bounds: one per axis when there are several.
   * @param {import('./TrellisSplit').TrellisSlice[]} group
   * @param {{ min: number, max: number } | null} [override] a type frame's
   *   y extent (P5): the DRAWN domain is not the data's own values
   *   (histogram: bin counts, not observations)
   * @returns {YBounds}
   */
  const boundsOf = (group, override) => {
    const out = axes.map((ai) => toBounds(override || extentOf(group, ai), ai))
    return axisNames ? out : out[0]
  }

  /** @type {YBounds} */
  let y = null
  if (yMode === 'shared') {
    y = boundsOf(splitResult.panels, axisNames ? null : host.yExtentOverride)
  }

  // 2-D group scales (P4): one shared domain per row (comparable along a
  // row, free across rows) or per column. Identical bounds into every panel
  // of the group means identical ticks out: the exit-gate invariant.
  /** @param {'rowKey'|'colKey'} dim */
  const byGroup = (dim) => {
    /** @type {Map<string, import('./TrellisSplit').TrellisSlice[]>} */
    const groups = new Map()
    splitResult.panels.forEach((p) => {
      const k = p[dim] ?? ''
      groups.set(k, (groups.get(k) || []).concat(p))
    })
    /** @type {Map<string, YBounds>} */
    const out = new Map()
    groups.forEach((panels, k) => {
      const b = boundsOf(panels)
      if (b) out.set(k, b)
    })
    return out
  }
  const rowY = yMode === 'independent-row' ? byGroup('rowKey') : null
  const colY = yMode === 'independent-column' ? byGroup('colKey') : null

  // Color: one series-name -> color mapping for the whole trellis. The
  // user's `colors` array wins, entry for entry: a function entry keeps its
  // place (filtering it out shifted every later colour onto the wrong
  // series; the panel resolves it per datum, and the shared chrome reads the
  // colour the panel painted). Otherwise the theme's palette, as the core
  // picks it (the config has already swapped in the dark-mode default).
  const palettes = /** @type {Record<string, string[]>} */ (getThemePalettes())
  /** @type {any[]} */
  const palette =
    Array.isArray(host.userColors) && host.userColors.length
      ? host.userColors
      : palettes[host.palette || ''] || palettes.palette1
  const names = splitResult.seriesNames
  /**
   * @param {string} name
   * @returns {any}
   */
  const colorOf = (name) =>
    palette[Math.max(0, names.indexOf(name)) % palette.length]

  return { x, y, rowY, colY, colorOf, palette }
}
