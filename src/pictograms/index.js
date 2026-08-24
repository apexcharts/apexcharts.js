// @ts-check
/**
 * ApexCharts pictograms: glyphs for the unit chart, one per unit.
 *
 *     import ApexCharts from 'apexcharts'
 *     import { person } from 'apexcharts/pictograms'
 *
 *     plotOptions: { unit: { shape: 'pictogram', pictogram: { mark: person } } }
 *
 * A pictogram is what one unit LOOKS LIKE. It is independent of the layout,
 * which is where the units go, and the two compose freely:
 *
 *     100 people  ->  100 person glyphs  ->  arranged into a heart
 *     500 homes   ->  500 house glyphs   ->  arranged in a waffle grid
 *
 *     plotOptions: {
 *       unit: {
 *         layout: 'custom', positions: heart,      // from 'apexcharts/unit-shapes'
 *         shape: 'pictogram', pictogram: { mark: person },
 *       },
 *     }
 *
 * Each glyph is DRAWN, not fetched: the chart emits one `<path>` per unit,
 * filled in that unit's own colour. That is why a pictogram scales to thousands
 * of units where `shape:'image'` does not - an `<image>` has to be recoloured
 * with an SVG filter to match the legend, and a filter costs an offscreen
 * surface per element on every paint.
 *
 * Sizing is not yours to set. A glyph is fitted to the box the dot would have
 * occupied, so `size` and `spacing` size a pictogram exactly as they size a dot
 * and swapping `circle` for a glyph never re-flows the chart.
 *
 * Variants: `person.with({ category: 'people' })`.
 * Your own glyph: pass path data, or `{path, viewBox, fillRule}`.
 * By name (`pictogram: { mark: 'person' }`): `registerMarks([person])`.
 *
 * Every outline here is drawn in this repository. No third-party icon path
 * enters this catalog, including permissively licensed ones, and no brand marks.
 *
 * @module pictograms
 */

export { person } from './marks/person.js'
export { house } from './marks/house.js'
export { heart } from './marks/heart.js'
export { tree } from './marks/tree.js'
export { droplet } from './marks/droplet.js'
export { star } from './marks/star.js'
export { car } from './marks/car.js'
export { bag } from './marks/bag.js'
export { book } from './marks/book.js'
export { cup } from './marks/cup.js'
export { bulb } from './marks/bulb.js'
export { plane } from './marks/plane.js'

export { catalog } from './catalog.js'
export { definePictogram } from './engine/mark.js'
export { registerMarks, unregisterMarks, registeredMarkNames } from './registry.js'
