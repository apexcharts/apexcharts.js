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

/**
 * How tall the tooltip may get, as a share of the plot's height, before it is
 * placed above (or below) the hovered mark instead of beside it. Beside the
 * point, a box this tall covers almost the whole plot height across its own
 * width, which on a sparkline is most of the chart.
 *
 * Measured across the demos, full-size charts with a tall shared tooltip top
 * out at 0.75 (a 380px chart with a five-row card) and short charts start at
 * 0.80 (a 160px dashboard sparkline); the cut sits in that gap. Sparklines and
 * strips 100px or so tall run from 0.9 to well past 1.
 */
export const SHORT_PLOT_RATIO = 0.78

/**
 * Space between the pointer's hotspot and a tooltip placed below it. The
 * cursor graphic hangs about 20px below the hotspot and would cover the box's
 * first line otherwise; above the pointer there is nothing to clear.
 */
export const POINTER_CLEARANCE_BELOW = 24
