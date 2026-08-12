// @ts-check
/**
 * Continuous colour for the treemap.
 *
 * A treemap encodes one metric as area. A market-cap style treemap encodes a
 * second, independent metric as colour: size is how big the company is, colour
 * is how its day went. That second metric is usually diverging (gain vs loss
 * around zero), which a palette of discrete `colorScale.ranges` can only
 * approximate in steps.
 *
 * So a datum may carry `colorValue` (or the config may name an accessor), and
 * the value is interpolated between colour stops with an optional diverging
 * midpoint. `colorScale.ranges` is untouched and still wins where it is set:
 * this is an additional mode, not a replacement.
 *
 * The scale is also what the gradient legend draws, so both come from one
 * place and cannot disagree.
 *
 * @module charts/common/treemap/ColorScale
 */
import Utils from '../../../utils/Utils'

/** Neutral diverging default: loss, neutral, gain. */
const DEFAULT_DIVERGING = ['#cf4d3f', '#8f9499', '#26a75b']

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
const lerp = (a, b, t) => a + (b - a) * t

/**
 * @param {number} n
 * @returns {string}
 */
function toHexPair(n) {
  const v = Math.max(0, Math.min(255, Math.round(n)))
  return v.toString(16).padStart(2, '0')
}

/**
 * Mix two colours in sRGB. Good enough for a legend strip and a tile fill, and
 * it keeps the module free of a colour-space dependency.
 * @param {string} c1
 * @param {string} c2
 * @param {number} t 0..1
 * @returns {string}
 */
export function mixColors(c1, c2, t) {
  const a = Utils.parseHex(normalizeHex(c1))
  const b = Utils.parseHex(normalizeHex(c2))
  if (!a || !b) return c1
  return (
    '#' +
    toHexPair(lerp(a[0], b[0], t)) +
    toHexPair(lerp(a[1], b[1], t)) +
    toHexPair(lerp(a[2], b[2], t))
  )
}

/**
 * @param {string} c
 * @returns {string}
 */
function normalizeHex(c) {
  if (typeof c !== 'string') return '#000000'
  if (Utils.isColorHex(c)) return c
  const asHex = Utils.rgb2hex(c)
  return asHex || '#000000'
}

/**
 * The colour metric for one leaf, or null when it has none.
 *
 * Reads `datum.colorValue` by default; `colorScale.colorValue` may name a
 * different key or supply an accessor.
 *
 * @param {any} w
 * @param {number} i seriesIndex
 * @param {number} j dataPointIndex
 * @returns {number|null}
 */
export function colorValueOf(w, i, j) {
  const series = /** @type {any} */ (w.config.series)[i]
  const datum = series && Array.isArray(series.data) ? series.data[j] : null
  return colorValueOfDatum(w, datum, i, j)
}

/**
 * @param {any} w
 * @param {any} datum
 * @param {number} i
 * @param {number} j
 * @returns {number|null}
 */
export function colorValueOfDatum(w, datum, i, j) {
  if (!datum || typeof datum !== 'object') return null
  const accessor = w.config.plotOptions?.treemap?.colorScale?.colorValue
  let raw
  if (typeof accessor === 'function') {
    raw = accessor(datum, { seriesIndex: i, dataPointIndex: j, w })
  } else if (typeof accessor === 'string') {
    raw = datum[accessor]
  } else {
    raw = datum.colorValue
  }
  if (raw == null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/**
 * Resolve the configured palette into value-tagged stops across `[min, max]`.
 *
 * @param {any} cfg the `colorScale.gradient` config
 * @param {number} min
 * @param {number} max
 * @param {number|null} midpoint
 * @returns {Array<{value: number, color: string}>}
 */
function resolveStops(cfg, min, max, midpoint) {
  // Explicit stops win outright.
  if (Array.isArray(cfg.stops) && cfg.stops.length >= 2) {
    return cfg.stops
      .filter((/** @type {any} */ s) => s && Number.isFinite(Number(s.value)))
      .map((/** @type {any} */ s) => ({
        value: Number(s.value),
        color: normalizeHex(s.color),
      }))
      .sort(
        (/** @type {any} */ a, /** @type {any} */ b) => a.value - b.value,
      )
  }

  const colors = (
    Array.isArray(cfg.colors) && cfg.colors.length >= 2
      ? cfg.colors
      : DEFAULT_DIVERGING
  ).map(normalizeHex)

  const n = colors.length
  // A midpoint anchors the middle colour to a specific value (0 for a
  // gain/loss metric) instead of to the middle of the data range, which is what
  // makes "neutral" mean neutral rather than "average".
  if (midpoint != null && n >= 3) {
    const mid = Math.floor((n - 1) / 2)
    /** @type {Array<{value: number, color: string}>} */
    const out = []
    for (let k = 0; k <= mid; k++) {
      out.push({ value: lerp(min, midpoint, k / mid), color: colors[k] })
    }
    for (let k = mid + 1; k < n; k++) {
      out.push({
        value: lerp(midpoint, max, (k - mid) / (n - 1 - mid)),
        color: colors[k],
      })
    }
    return out
  }

  return colors.map((/** @type {string} */ c, /** @type {number} */ k) => ({
    value: lerp(min, max, k / (n - 1)),
    color: c,
  }))
}

/**
 * Build the continuous scale, or return null when the chart is not using one.
 *
 * @param {any} w
 * @returns {null | {
 *   min: number, max: number, midpoint: number|null,
 *   stops: Array<{value: number, color: string}>,
 *   at: (v: number) => string,
 *   legendStops: Array<{percent: number, color: string}>,
 * }}
 */
export function buildContinuousScale(w) {
  const cs = w.config?.plotOptions?.treemap?.colorScale
  const cfg = cs && cs.gradient
  if (!cfg) return null
  if (cfg.enabled === false) return null

  // Collect the metric across every leaf. `enabled: undefined` means "on when
  // the data actually carries a colour metric", so this pass doubles as the
  // detector.
  const series = /** @type {any} */ (w.config.series) || []
  let dataMin = Infinity
  let dataMax = -Infinity
  let found = false
  for (let i = 0; i < series.length; i++) {
    const data = series[i] && series[i].data
    if (!Array.isArray(data)) continue
    for (let j = 0; j < data.length; j++) {
      const v = colorValueOfDatum(w, data[j], i, j)
      if (v == null) continue
      found = true
      if (v < dataMin) dataMin = v
      if (v > dataMax) dataMax = v
    }
  }
  if (!found && cfg.enabled !== true) return null
  if (!Number.isFinite(dataMin)) {
    dataMin = 0
    dataMax = 0
  }

  let min = Number.isFinite(Number(cfg.min)) ? Number(cfg.min) : dataMin
  let max = Number.isFinite(Number(cfg.max)) ? Number(cfg.max) : dataMax

  /** @type {number|null} */
  let midpoint = null
  if (cfg.midpoint === null) {
    midpoint = null
  } else if (Number.isFinite(Number(cfg.midpoint))) {
    midpoint = Number(cfg.midpoint)
  } else if (min < 0 && max > 0) {
    // A domain that straddles zero is a diverging metric; zero is the only
    // sensible neutral point.
    midpoint = 0
  }

  // A diverging scale that is not symmetric about its midpoint lies: a -2% and
  // a +8% day would read as equally saturated. Balance the domain unless the
  // user pinned an explicit end or opted out.
  if (
    midpoint != null &&
    cfg.symmetric !== false &&
    !Number.isFinite(Number(cfg.min)) &&
    !Number.isFinite(Number(cfg.max))
  ) {
    const reach = Math.max(Math.abs(min - midpoint), Math.abs(max - midpoint))
    min = midpoint - reach
    max = midpoint + reach
  }

  if (max === min) {
    // Flat metric: nudge so the interpolation has a span to work with and every
    // tile lands on the middle colour rather than on a division by zero.
    min -= 0.5
    max += 0.5
  }

  const stops = resolveStops(cfg, min, max, midpoint)
  if (stops.length < 2) return null

  /**
   * @param {number} v
   * @returns {string}
   */
  const at = (v) => {
    if (!Number.isFinite(v)) return stops[Math.floor(stops.length / 2)].color
    if (v <= stops[0].value) return stops[0].color
    const last = stops[stops.length - 1]
    if (v >= last.value) return last.color
    for (let k = 1; k < stops.length; k++) {
      const hi = stops[k]
      if (v <= hi.value) {
        const lo = stops[k - 1]
        const span = hi.value - lo.value
        const t = span === 0 ? 0 : (v - lo.value) / span
        return mixColors(lo.color, hi.color, t)
      }
    }
    return last.color
  }

  const span = max - min
  const legendStops = stops.map((s) => ({
    percent: span === 0 ? 0 : (s.value - min) / span,
    color: s.color,
  }))

  return { min, max, midpoint, stops, at, legendStops }
}

/**
 * A readable text colour on top of `bg`, picked by WCAG contrast rather than a
 * fixed light/dark guess: a diverging palette runs through the middle of the
 * luminance range, so neither choice is right everywhere.
 * @param {string} bg
 * @returns {string}
 */
export function readableOn(bg) {
  const hex = normalizeHex(bg)
  return Utils.getContrastRatio(hex, '#ffffff') >=
    Utils.getContrastRatio(hex, '#000000')
    ? '#ffffff'
    : '#000000'
}
