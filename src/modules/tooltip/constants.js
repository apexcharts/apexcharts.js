// @ts-check
/**
 * Shared tooltip layout constants.
 * @module tooltip/constants
 */

/**
 * Pixels the tooltip's CSS arrow tip overhangs its box. Used as the gap between
 * the tooltip and its anchor rect (data cell / bar) in both the vertical and
 * horizontal placements. Must match the arrow size in apexcharts.css, where the
 * arrow is a 10px square rotated 45° about a centre parked on the body's border
 * line: it reaches 10/√2 ≈ 7.07px past that line.
 */
export const ARROW_TIP_OVERHANG = 7

/**
 * Breathing room between a data point's marker and the tooltip's leading edge
 * (the arrow tip when the arrow is on, the box edge otherwise). Bars and heatmap
 * cells park the tip flush against the mark's edge, which reads fine on a large
 * flat shape; a marker is small and round, so it needs the tooltip to stop
 * clearly short of it to stay both visible and clickable.
 */
export const POINT_TIP_GAP = 0
