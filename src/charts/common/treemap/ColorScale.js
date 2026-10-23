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
  const a = Utils.parseColor(normalizeHex(c1))
  const b = Utils.parseColor(normalizeHex(c2))
  if (!a || !b) return c1
  return toHex(a.map((v, k) => lerp(v, b[k], t)))
}

/**
 * [r, g, b, a] as #rrggbb, or as #rrggbbaa when it is not opaque.
 * @param {number[]} c
 * @returns {string}
 */
function toHex(c) {
  return (
    '#' +
    c.slice(0, 3).map(toHexPair).join('') +
    (c[3] < 1 ? toHexPair(c[3] * 255) : '')
  )
}

/**
 * Any hex (#RGB, #RGBA, #RRGGBB, #RRGGBBAA), rgb() or rgba() colour as
 * #rrggbb, keeping its alpha as #rrggbbaa; black for anything else.
 * @param {string} c
 * @returns {string}
 */
function normalizeHex(c) {
  const rgba = typeof c === 'string' ? Utils.parseColor(c.trim()) : null
  return rgba ? toHex(rgba) : '#000000'
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
 * @param {boolean} explicit  `cfg.stops` lists two or more stops
 * @param {Element} [el] the chart element a var() colour resolves against
 * @returns {Array<{value: number, color: string}>}
 */
function resolveStops(cfg, min, max, midpoint, explicit, el) {
  // A var() colour is resolved against the chart before the hex maths: left
  // raw, normalizeHex reads it as black and every tile mixes towards black.
  /** @param {any} c */
  const hex = (c) => normalizeHex(Utils.getThemeColor(c, el))

  // Explicit stops win outright.
  if (explicit) {
    return cfg.stops
      .filter((/** @type {any} */ s) => s && Number.isFinite(Number(s.value)))
      .map((/** @type {any} */ s) => ({
        value: Number(s.value),
        color: hex(s.color),
      }))
      .sort((/** @type {any} */ a, /** @type {any} */ b) => a.value - b.value)
  }

  const colors = (
    Array.isArray(cfg.colors) && cfg.colors.length >= 2
      ? cfg.colors
      : DEFAULT_DIVERGING
  ).map(hex)

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

  /** @param {any} v */
  const pin = (v) => (Number.isFinite(Number(v)) ? Number(v) : null)
  const pinMin = pin(cfg.min)
  const pinMax = pin(cfg.max)
  let min = pinMin ?? dataMin
  let max = pinMax ?? dataMax

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
    pinMin == null &&
    pinMax == null
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

  const explicit = Array.isArray(cfg.stops) && cfg.stops.length >= 2
  const stops = resolveStops(cfg, min, max, midpoint, explicit, w.dom?.elWrap)
  if (stops.length < 2) return null
  // Explicit stops carry their own values, so the legend domain covers them as
  // well as the data: a data-only one would put stops outside the strip while
  // the tiles are coloured by the stops. A pinned min/max still wins.
  if (explicit) {
    if (pinMin == null) min = Math.min(min, stops[0].value)
    if (pinMax == null) max = Math.max(max, stops[stops.length - 1].value)
  }

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

  // A stop outside a pinned domain is clamped to its end, at the colour a tile
  // there gets, so the strip never disagrees with the tiles.
  const span = max - min
  const legendStops = stops.map((s) => {
    const v = Math.min(max, Math.max(min, s.value))
    return {
      percent: span && (v - min) / span,
      color: v === s.value ? s.color : at(v),
    }
  })

  return { min, max, midpoint, stops, at, legendStops }
}

/**
 * How far a heatmap cell or treemap tile at colour-scale fraction `p`
 * (determineColor's percent / 100) is shaded from its base colour. The
 * gradient legend strip samples it too, so it cannot drift from the tiles.
 * @param {any} w
 * @param {string} chartType
 * @param {number} p
 * @param {any} negRange
 * @returns {number}
 */
export function shadePercent(w, chartType, p, negRange) {
  const opts = w.config.plotOptions[chartType]
  const shadeIntensity = opts.shadeIntensity
  const k = shadeIntensity * 1.25
  if (w.globals.hasNegs || negRange) {
    return opts.reverseNegativeShade
      ? (p < 0 ? p : 1 - p) * k
      : p <= 0
        ? 1 - (1 + p) * shadeIntensity
        : (1 - p) * shadeIntensity
  }
  return chartType === 'treemap' ? (1 - p) * k : 1 - p
}

/**
 * A readable text colour on top of `bg`, picked by WCAG contrast rather than a
 * fixed light/dark guess: a diverging palette runs through the middle of the
 * luminance range, so neither choice is right everywhere.
 * @param {string} bg
 * @returns {string}
 */
export function readableOn(bg) {
  // The contrast maths reads #rrggbb only, so judge the hue under any alpha.
  const hex = normalizeHex(bg).slice(0, 7)
  return Utils.getContrastRatio(hex, '#ffffff') >=
    Utils.getContrastRatio(hex, '#000000')
    ? '#ffffff'
    : '#000000'
}
