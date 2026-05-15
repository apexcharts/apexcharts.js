// @ts-check
import DateTime from '../utils/DateTime'
import Dimensions from './dimensions/Dimensions'
import Graphics from './Graphics'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const APPROX_MONTH = 30 * DAY
const APPROX_YEAR = 365 * DAY

const MIN_ZOOM_DAYS = 10 / (24 * 60 * 60)

// Ladder of "nice" tick intervals, ordered from finest to coarsest.
// Each entry is { unit, step, approxMs }. `approxMs` is used only by the
// picker to estimate tick count for a span; actual generation uses calendar-
// aware addInterval, so month/year ticks land on the correct boundaries
// regardless of variable month length, leap years, or DST.
//
// Step values are constrained so the unit divides the step cleanly:
//   second/minute step ∈ {1, 5, 15, 30}  (divides 60)
//   hour          step ∈ {1, 3, 6, 12}   (divides 24)
//   day           step = 1
//   week          step ∈ {1, 2}
//   month         step ∈ {1, 3, 6}       (divides 12)
//   year          step ∈ {1, 2, 5, 10, 25, 50, 100}
const TICK_LADDER = [
  { unit: 'second', step: 1, approxMs: SECOND },
  { unit: 'second', step: 5, approxMs: 5 * SECOND },
  { unit: 'second', step: 15, approxMs: 15 * SECOND },
  { unit: 'second', step: 30, approxMs: 30 * SECOND },
  { unit: 'minute', step: 1, approxMs: MINUTE },
  { unit: 'minute', step: 5, approxMs: 5 * MINUTE },
  { unit: 'minute', step: 15, approxMs: 15 * MINUTE },
  { unit: 'minute', step: 30, approxMs: 30 * MINUTE },
  { unit: 'hour', step: 1, approxMs: HOUR },
  { unit: 'hour', step: 3, approxMs: 3 * HOUR },
  { unit: 'hour', step: 6, approxMs: 6 * HOUR },
  { unit: 'hour', step: 12, approxMs: 12 * HOUR },
  { unit: 'day', step: 1, approxMs: DAY },
  { unit: 'day', step: 2, approxMs: 2 * DAY },
  { unit: 'week', step: 1, approxMs: WEEK },
  { unit: 'week', step: 2, approxMs: 2 * WEEK },
  { unit: 'month', step: 1, approxMs: APPROX_MONTH },
  { unit: 'month', step: 3, approxMs: 3 * APPROX_MONTH },
  { unit: 'month', step: 6, approxMs: 6 * APPROX_MONTH },
  { unit: 'year', step: 1, approxMs: APPROX_YEAR },
  { unit: 'year', step: 2, approxMs: 2 * APPROX_YEAR },
  { unit: 'year', step: 5, approxMs: 5 * APPROX_YEAR },
  { unit: 'year', step: 10, approxMs: 10 * APPROX_YEAR },
  { unit: 'year', step: 25, approxMs: 25 * APPROX_YEAR },
  { unit: 'year', step: 50, approxMs: 50 * APPROX_YEAR },
  { unit: 'year', step: 100, approxMs: 100 * APPROX_YEAR },
]

const DEFAULT_TICK_COUNT = 10

/**
 * v6 single-interval TimeScale — replaces the v5 multi-generator approach
 * with one calendar-aware algorithm:
 *
 *   1. Pick a single {unit, step} interval that yields ~10 ticks
 *   2. Walk calendar boundaries via ceilToBoundary + addInterval (uniform stride)
 *   3. Format with a range-aware format string that folds coarser context into
 *      every label (e.g. month-scale spanning years renders "Mar 2023" not
 *      "Mar"). All labels use the same format — no mix-and-match between units.
 *
 * Public output contract (`w.labelData.timescaleLabels[i]`):
 *   { dateString, position, value, unit, year, month }
 *
 * @module TimeScale
 */
class TimeScale {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed for new Dimensions(this.ctx) recalc
    /** @type {{ unit: string, step: number, approxMs: number } | null} */
    this.tickInterval = null
    /** @type {Array<any>} */
    this.timeScaleArray = []
    this.utc = w.config.xaxis.labels.datetimeUTC
  }

  /**
   * Compute raw ticks for a datetime axis spanning [minX, maxX]. Single
   * uniform stride — one unit, no promotion, no calendar-boundary overlay.
   * Context (year, day) is folded into each label's format string at
   * `formatDates` time, not split across promoted ticks.
   *
   * @param {number} minX
   * @param {number} maxX
   * @returns {Array<any>} raw ticks (pre-formatting). Pass to recalcDimensionsBasedOnFormat for the final timescaleLabels.
   */
  calculateTimeScaleTicks(minX, maxX) {
    const w = this.w

    if (w.globals.allSeriesCollapsed) {
      w.labelData.labels = []
      w.labelData.timescaleLabels = []
      this.timeScaleArray = []
      return []
    }

    const span = maxX - minX
    const daysDiff = span / DAY

    // Zoom-flag bookkeeping (preserved from v5)
    w.interact.disableZoomIn = false
    w.interact.disableZoomOut = false
    if (daysDiff < MIN_ZOOM_DAYS) {
      w.interact.disableZoomIn = true
    } else if (daysDiff > 50000) {
      w.interact.disableZoomOut = true
    }

    const targetCount = Number.isFinite(w.config.xaxis.tickAmount)
      ? /** @type {number} */ (w.config.xaxis.tickAmount)
      : DEFAULT_TICK_COUNT

    this.tickInterval = pickInterval(span, targetCount)

    const ticks = this.generateBaseTicks(minX, maxX, this.tickInterval)
    this.timeScaleArray = ticks
    return ticks
  }

  /**
   * Walk the interval stride from `minX` to `maxX`. Every tick carries
   * `unit: interval.unit` — no promotion, no snapping. Uniform spacing is
   * guaranteed.
   *
   * @param {number} minX
   * @param {number} maxX
   * @param {{ unit: string, step: number }} interval
   * @returns {Array<any>}
   */
  generateBaseTicks(minX, maxX, interval) {
    const w = this.w
    const dt = new DateTime(w)
    const isUTC = this.utc
    const gridWidth = w.layout.gridWidth
    const span = maxX - minX

    const ticks = []
    let t = dt.ceilToBoundary(
      minX,
      /** @type {any} */ (interval.unit),
      interval.step,
      isUTC,
    )

    let iter = 0
    const MAX_ITER = 5000

    while (t <= maxX && iter < MAX_ITER) {
      const f = dt.getDateFields(t, isUTC)
      const position = span > 0 ? ((t - minX) / span) * gridWidth : 0

      ticks.push({
        timestamp: t,
        position,
        unit: interval.unit,
        year: f.year,
        month: f.month + 1,
        day: f.date,
        hour: f.hour,
        minute: f.minute,
        second: f.second,
        value: t,
      })

      t = dt.addInterval(
        t,
        /** @type {any} */ (interval.unit),
        interval.step,
        isUTC,
      )
      iter++
    }

    return ticks
  }

  /**
   * Public entry called from Core.js after calculateTimeScaleTicks. Formats
   * the raw ticks into display labels, removes overlapping entries, writes
   * the result to `w.labelData.timescaleLabels`, and re-runs Dimensions to
   * lay out the grid based on the final label widths.
   *
   * @param {Array<any>} rawTicks
   */
  recalcDimensionsBasedOnFormat(rawTicks) {
    const w = this.w
    const formatted = this.formatDates(rawTicks)
    const filtered = this.removeOverlappingTS(formatted)
    w.labelData.timescaleLabels = filtered.slice()

    // Dependency cycle: tick positions depend on gridWidth, which depends on
    // the labels we just computed. Recompute Dimensions once with the final
    // labels so the grid lays out correctly.
    const dimensions = new Dimensions(this.w, this.ctx)
    const layoutState = dimensions.plotCoords()
    this.ctx._writeLayoutCoords(layoutState.layout)
  }

  /**
   * Format each raw tick into a display label. All ticks share one
   * effective format computed once from the interval unit and the data
   * range — when the range spans coarser units, the base format from
   * `datetimeFormatter[unit]` is automatically extended with the higher-
   * unit context (e.g. month-scale spanning years → `MMM yyyy`, hour-scale
   * spanning days → `dd MMM HH:mm`). A user-supplied `xaxis.labels.format`
   * overrides everything.
   *
   * @param {Array<any>} rawTicks
   * @returns {Array<any>}
   */
  formatDates(rawTicks) {
    const w = this.w
    const dt = new DateTime(w)
    const userFormat = w.config.xaxis.labels.format
    const dtFmt = w.config.xaxis.labels.datetimeFormatter
    const isUTC = this.utc

    const pad = (/** @type {number} */ n, len = 2) =>
      String(n).padStart(len, '0')

    const effectiveFormat = userFormat
      ? userFormat
      : this._effectiveFormat(rawTicks, dtFmt)

    return rawTicks.map((tick) => {
      const date = dt.getDate(tick.timestamp)
      const value = dt.formatDate(date, effectiveFormat)

      // Build the ISO-like dateString from raw fields rather than via
      // formatDate, because `T` is interpreted as the AM/PM token in
      // formatDate's grammar. UTC mode appends 'Z'; local mode emits no tz
      // suffix (mirrors v5 behavior).
      const ds =
        `${tick.year}-${pad(tick.month)}-${pad(tick.day)}` +
        `T${pad(tick.hour)}:${pad(tick.minute)}:${pad(tick.second)}` +
        `.000${isUTC ? 'Z' : ''}`

      return {
        dateString: ds,
        position: tick.position,
        value,
        unit: tick.unit,
        year: tick.year,
        month: tick.month,
      }
    })
  }

  /**
   * Pick the format string used for every tick this render. Folds coarser
   * context into the base `datetimeFormatter[unit]` when the data range
   * spans it. Skipped when the base format already references the higher
   * unit's tokens (so user customizations aren't doubled).
   *
   * @param {Array<any>} rawTicks
   * @param {Record<string, string>} dtFmt
   * @returns {string}
   */
  _effectiveFormat(rawTicks, dtFmt) {
    if (rawTicks.length === 0) return dtFmt.day || 'dd MMM'

    const unit =
      (this.tickInterval && this.tickInterval.unit) || rawTicks[0].unit
    const base =
      dtFmt[unit === 'week' ? 'day' : unit] || dtFmt.day || 'dd MMM'

    const first = rawTicks[0]
    const last = rawTicks[rawTicks.length - 1]
    const spansYears = first.year !== last.year
    const spansMonths =
      spansYears || first.month !== last.month
    const spansDays = spansMonths || first.day !== last.day

    const hasYearToken = /y/i.test(base)
    const hasMonthToken = /M/.test(base)
    const hasDayToken = /d/i.test(base)

    if (unit === 'month' || unit === 'week') {
      if (spansYears && !hasYearToken) return base + ' yyyy'
      return base
    }
    if (unit === 'day') {
      if (spansYears && !hasYearToken) return base + ' yyyy'
      return base
    }
    if (unit === 'hour' || unit === 'minute' || unit === 'second') {
      if (spansDays && !hasDayToken && !hasMonthToken) {
        const prefix = spansYears ? 'dd MMM yyyy' : 'dd MMM'
        return prefix + ' ' + base
      }
      return base
    }
    return base
  }

  /**
   * Drop labels that would overlap their predecessor (when
   * `xaxis.labels.hideOverlappingLabels` is true). The first label is always
   * kept. Width is measured per-label unless all labels have the same string
   * length, in which case one measurement is reused.
   *
   * @param {Array<any>} arr
   * @returns {Array<any>}
   */
  removeOverlappingTS(arr) {
    if (arr.length === 0) return []

    const w = this.w
    const graphics = new Graphics(w)

    let equalLabelLengthFlag = false
    /** @type {number | undefined} */
    let constantLabelWidth
    if (
      arr[0].value &&
      arr.every((lb) => lb.value.length === arr[0].value.length)
    ) {
      equalLabelLengthFlag = true
      constantLabelWidth = graphics.getTextRects(
        arr[0].value,
        w.config.xaxis.labels.style.fontSize,
      ).width
    }

    let lastDrawnIndex = 0
    /** @type {Array<any>} */
    const filtered = arr
      .map((item, index) => {
        if (index === 0) return item
        if (!w.config.xaxis.labels.hideOverlappingLabels) return item

        const prevLabelWidth = equalLabelLengthFlag
          ? /** @type {number} */ (constantLabelWidth)
          : graphics.getTextRects(
              arr[lastDrawnIndex].value,
              w.config.xaxis.labels.style.fontSize,
            ).width
        const prevPos = arr[lastDrawnIndex].position
        const pos = item.position

        if (pos > prevPos + prevLabelWidth + 10) {
          lastDrawnIndex = index
          return item
        }
        return null
      })
      .filter((f) => f !== null)

    return filtered
  }
}

/**
 * Pick the ladder interval whose duration is closest to span/targetCount in
 * log space. Mirrors d3-time's tick-interval selection (which uses a bisector
 * to choose between the two ladder entries straddling the target). Closest-
 * match in log space gives the same result without needing a sorted bisect.
 *
 * @param {number} span  in milliseconds
 * @param {number} targetCount
 * @returns {{ unit: string, step: number, approxMs: number }}
 */
function pickInterval(span, targetCount) {
  if (!Number.isFinite(targetCount) || targetCount <= 0) {
    targetCount = DEFAULT_TICK_COUNT
  }
  if (span <= 0) return TICK_LADDER[0]
  const targetMs = span / targetCount
  let best = TICK_LADDER[0]
  let bestDist = Infinity
  for (const interval of TICK_LADDER) {
    const dist = Math.abs(Math.log(interval.approxMs / targetMs))
    if (dist < bestDist) {
      bestDist = dist
      best = interval
    }
  }
  return best
}

export default TimeScale
