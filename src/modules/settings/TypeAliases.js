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

/** @type {Record<string, string>} */
export const TYPE_ALIASES = {
  funnel: 'bar',
  pyramid: 'bar',
  gauge: 'radialBar',
  waffle: 'unit',
  histogram: 'bar',
  waterfall: 'rangeBar',
  dumbbell: 'rangeBar',
}
