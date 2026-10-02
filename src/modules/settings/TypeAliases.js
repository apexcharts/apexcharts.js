// @ts-check
/**
 * The user-facing chart types that render through another type's pathway.
 *
 * A chart named here is real, it just has no renderer of its own:
 * `Config.normalizeAliasedChartType` rewrites `chart.type` to the pathway it
 * routes through and records the original on `chart.requestedType`. So these
 * names are as reserved as any built-in one, and `registerSeriesType` refuses
 * them for the same reason: a custom type registered under one would take the
 * registration and then never be drawn, because the alias rewrites the type
 * before dispatch ever reaches the registry.
 *
 * Its own module, not a named export on `Defaults`: the split per-type bundles
 * rewrite shared modules (Defaults is one) to a shim that re-exports only the
 * registered names, so a named export there resolves to `undefined` at runtime
 * and only a full `npm run build` catches it. This is a plain literal, so the
 * few bundles that want it inline their own copy.
 *
 * @module modules/settings/TypeAliases
 */

/**
 * Chart types that are real and opt-in: core knows the name and dispatches it,
 * but no bundle registers the class until the user imports the type's entry
 * point. Nothing else reserves these names, and the name has to be reserved
 * anyway.
 *
 * `registerSeriesType`'s built-in check asks whether a class is REGISTERED,
 * which for an opt-in type is false on the default bundle. So a custom type
 * could take the name, and core's dispatch would then hand it to the renderer
 * pathway of the built-in instead of the custom one, which is the same silent
 * failure the alias list above was introduced to stop.
 *
 * @type {string[]}
 */
export const RESERVED_TYPES = ['icicle']

/** @type {Record<string, string>} */
export const TYPE_ALIASES = {
  funnel: 'bar',
  pyramid: 'bar',
  gauge: 'radialBar',
  waffle: 'unit',
  histogram: 'bar',
  waterfall: 'rangeBar',
  dumbbell: 'rangeBar',
  streamgraph: 'rangeArea',
  raincloud: 'violin',
  // `column` is the name half the world uses for a vertical bar chart, and the
  // combo path has always accepted it on `series[].type`. On `chart.type` it
  // used to fall through every dispatch and die inside the renderer (#5325),
  // so it is spelled out here as what it has always meant.
  column: 'bar',
}

/**
 * The built-in types, partitioned the three ways the library actually asks
 * about them. They are split here rather than listed three times because the
 * copies used to disagree, and that disagreement is what #5325 was: `banana`
 * was absent from Core's axis-chart list, so `setupElements` classed the chart
 * as non-axis and built no renderers, while `plotChartType`'s dispatch fell
 * through to `line.draw()` on the `null` that left behind. A type can now only
 * be added by choosing which partition it belongs to, and every consumer
 * follows.
 *
 * `XY_TYPES` draw marks in series space against an x and a y scale, and are
 * the only ones that can be mixed in a combo chart.
 */
export const XY_TYPES = [
  'line',
  'area',
  'bar',
  'rangeBar',
  'rangeArea',
  'candlestick',
  'boxPlot',
  'violin',
  'scatter',
  'bubble',
]

/**
 * Types that need the axis/grid/scale pipeline but own the whole plot: they
 * take part in no combo, and a chart is one of them or it is not.
 */
export const AXIS_ONLY_TYPES = ['radar', 'heatmap', 'treemap']

/**
 * Types with no cartesian axes at all: a slice, a ring, a lattice, a
 * hierarchy. Like AXIS_ONLY_TYPES they own the whole plot.
 */
export const NON_AXIS_TYPES = [
  'pie',
  'donut',
  'polarArea',
  'radialBar',
  'unit',
  'sunburst',
  'icicle',
]

/**
 * Every type name that has a renderer of its own: what `chart.type` may be
 * once the aliases above have been resolved. Together with TYPE_ALIASES and
 * the names `registerSeriesType` has taken, this is the whole set of values
 * `chart.type` can hold, which is what `Config.assertKnownChartType` rejects
 * against and what `Defaults.forType` dispatches on, so every name here must
 * also be a method on Defaults.
 *
 * @type {string[]}
 */
export const BUILTIN_TYPES = [
  ...XY_TYPES,
  ...AXIS_ONLY_TYPES,
  ...NON_AXIS_TYPES,
]

/**
 * The types that render through the axis/grid/scale pipeline: everything
 * except the non-axis forms.
 *
 * @type {string[]}
 */
export const AXIS_TYPES = [...XY_TYPES, ...AXIS_ONLY_TYPES]

/**
 * The types that cannot share a chart with another type. Core warns when one
 * of these turns up alongside anything else.
 *
 * @type {string[]}
 */
export const SOLO_TYPES = [...AXIS_ONLY_TYPES, ...NON_AXIS_TYPES]
