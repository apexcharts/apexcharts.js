// @ts-check
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

const MAG_MSD_ROW = [1, 1, 2, 5, 5, 5, 10, 10, 10, 10, 10]

/**
 * Allowed "magMsd" multipliers for niceScale tick generation.
 *
 * Two rows, one for integer data and one for data with a float, kept as a
 * pair for the `w.globals.niceScaleAllowedMagMsd` surface. They hold the same
 * values, so niceScale reads row 0 whatever the data.
 *
 * Each row has 11 values (indices 0-10). Each entry ideally satisfies
 * `10 % entry === 0` to avoid ugly tick labels, and `entry >= index`
 * to prevent data-point clipping.
 *
 * @type {number[][]}
 */
export const NICE_SCALE_ALLOWED_MAG_MSD = [MAG_MSD_ROW, MAG_MSD_ROW]

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
