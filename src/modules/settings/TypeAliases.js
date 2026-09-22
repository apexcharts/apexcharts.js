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
}
