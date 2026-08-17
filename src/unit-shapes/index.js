// @ts-check
/**
 * ApexCharts unit shapes: a curated collection of dot silhouettes for the unit
 * chart.
 *
 *     import ApexCharts from 'apexcharts'
 *     import { heart } from 'apexcharts/unit-shapes'
 *
 *     plotOptions: { unit: { layout: 'custom', positions: heart } }
 *
 * Nothing here is an image sitting under the dots. Each shape packs the dots
 * themselves: an outline is scanned row by row, the gap between dots is fitted
 * to the shape's own area, and the dots are split across rows so the count comes
 * out exact. One shape therefore works at 40 units or 3000, in a sparkline or a
 * poster, and re-packs when a legend toggle changes the count.
 *
 * A shape is a plain layout, `(objects, rect) => positions`, so it knows nothing
 * about animation: the chart already tweens position, radius and colour and
 * already keeps each mark's identity across a relayout. Switching shapes makes
 * the same crowd flow into the next one.
 *
 * Variants: `heart.with({ order: 'cols' })`.
 * Your own outline: `shapeFrom('M ...')`.
 * By name (`positions: 'heart'`): `registerShapes([heart])`.
 *
 * @module unit-shapes
 */

export { heart } from './shapes/heart.js'
export { droplet } from './shapes/droplet.js'
export { human } from './shapes/human.js'
export { tree } from './shapes/tree.js'
export { house } from './shapes/house.js'
export { battery } from './shapes/battery.js'
export { shield } from './shapes/shield.js'
export { rocket } from './shapes/rocket.js'
export { target } from './shapes/target.js'
export { globe } from './shapes/globe.js'
export { pyramid } from './shapes/pyramid.js'
export { leaf } from './shapes/leaf.js'
export { sun } from './shapes/sun.js'
export { flame } from './shapes/flame.js'
export { fish } from './shapes/fish.js'
export { star } from './shapes/star.js'
export { arrow } from './shapes/arrow.js'
export { crown } from './shapes/crown.js'
export { cross } from './shapes/cross.js'
export { bolt } from './shapes/bolt.js'
export { bulb } from './shapes/bulb.js'
export { flask } from './shapes/flask.js'
export { car } from './shapes/car.js'
export { plane } from './shapes/plane.js'
export { group } from './shapes/group.js'
export { trophy } from './shapes/trophy.js'
export { moneybag } from './shapes/moneybag.js'
export { funnel } from './shapes/funnel.js'
export { gear } from './shapes/gear.js'
export { robot } from './shapes/robot.js'
export { pin } from './shapes/pin.js'
export { mountain } from './shapes/mountain.js'

export { catalog } from './catalog.js'
export {
  registerShapes,
  unregisterShapes,
  registeredShapeNames,
} from './registry.js'

// The factories, for shapes of your own. `silhouette` takes an outline;
// `rings`, `sphere` and `tiers` are the arrangements that are not outlines.
export { silhouette, shapeFrom } from './engine/silhouette.js'
export { rings, sphere, tiers } from './engine/radial.js'
