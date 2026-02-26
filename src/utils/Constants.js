/**
 * Chart rendering constants — values that never change at runtime.
 *
 * Extracted from w.globals so modules can import only what they need
 * instead of receiving the entire state object.
 */

/**
 * Golden ratio used to scale multi-line x-axis label height.
 * @type {number}
 */
export const LINE_HEIGHT_RATIO = 1.618

/**
 * Allowed "magMsd" multipliers for niceScale tick generation.
 *
 * Two rows:
 *   [0] — used when the data series contains only integers
 *   [1] — used when the data series contains at least one float
 *
 * Each row has 11 values (indices 0–10). Each entry ideally satisfies
 * `10 % entry === 0` to avoid ugly tick labels, and `entry >= index`
 * to prevent data-point clipping.
 *
 * @type {number[][]}
 */
export const NICE_SCALE_ALLOWED_MAG_MSD = [
  [1, 1, 2, 5, 5, 5, 10, 10, 10, 10, 10],
  [1, 1, 2, 5, 5, 5, 10, 10, 10, 10, 10],
]

/**
 * Default tick counts indexed by `Math.round(maxTicks / 2)`.
 * Values chosen for having many divisors to produce clean grid lines.
 * See Scales.niceScale() for usage.
 *
 * @type {number[]}
 */
export const NICE_SCALE_DEFAULT_TICKS = [
  1, 2, 4, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 12, 12, 12, 12, 12,
  12, 12, 12, 12, 24,
]
