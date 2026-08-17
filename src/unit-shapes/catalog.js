// @ts-check
/**
 * Every shipped shape, in one array.
 *
 * Importing this pulls the whole catalog in: it is for the things that
 * legitimately need all of them (the docs gallery, the shape-lint suite, the
 * script-tag build), NOT for charts. A chart importing `{ heart }` from the
 * package root ships one outline and the engine, because each shape is its own
 * module and nothing here is reachable from there.
 *
 * @module unit-shapes/catalog
 */

import { heart } from './shapes/heart.js'
import { droplet } from './shapes/droplet.js'
import { human } from './shapes/human.js'
import { tree } from './shapes/tree.js'
import { house } from './shapes/house.js'
import { battery } from './shapes/battery.js'
import { shield } from './shapes/shield.js'
import { rocket } from './shapes/rocket.js'
import { target } from './shapes/target.js'
import { globe } from './shapes/globe.js'
import { pyramid } from './shapes/pyramid.js'
import { leaf } from './shapes/leaf.js'
import { sun } from './shapes/sun.js'
import { flame } from './shapes/flame.js'
import { fish } from './shapes/fish.js'
import { star } from './shapes/star.js'
import { arrow } from './shapes/arrow.js'
import { crown } from './shapes/crown.js'
import { cross } from './shapes/cross.js'
import { bolt } from './shapes/bolt.js'
import { bulb } from './shapes/bulb.js'
import { flask } from './shapes/flask.js'
import { car } from './shapes/car.js'
import { plane } from './shapes/plane.js'
import { group } from './shapes/group.js'
import { trophy } from './shapes/trophy.js'
import { moneybag } from './shapes/moneybag.js'
import { funnel } from './shapes/funnel.js'
import { gear } from './shapes/gear.js'
import { robot } from './shapes/robot.js'
import { pin } from './shapes/pin.js'
import { mountain } from './shapes/mountain.js'

/** @typedef {import('./engine/shape.js').UnitShape} UnitShape */

/** @type {UnitShape[]} */
export const catalog = [
  heart,
  droplet,
  human,
  tree,
  house,
  battery,
  shield,
  rocket,
  target,
  globe,
  pyramid,
  leaf,
  sun,
  flame,
  fish,
  star,
  arrow,
  crown,
  cross,
  bolt,
  bulb,
  flask,
  car,
  plane,
  group,
  trophy,
  moneybag,
  funnel,
  gear,
  robot,
  pin,
  mountain,
]
