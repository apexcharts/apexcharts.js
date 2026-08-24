// @ts-check
/**
 * Every pictogram in one array, for the mark lint, the contact sheet and the
 * script-tag build.
 *
 * Charts should not import this: pulling the catalog in to use one glyph ships
 * all of them. Import the glyph (`import { person } from 'apexcharts/pictograms'`)
 * and the rest tree-shake away.
 *
 * @module pictograms/catalog
 */

import { person } from './marks/person.js'
import { house } from './marks/house.js'
import { heart } from './marks/heart.js'
import { tree } from './marks/tree.js'
import { droplet } from './marks/droplet.js'
import { star } from './marks/star.js'
import { car } from './marks/car.js'
import { bag } from './marks/bag.js'
import { book } from './marks/book.js'
import { cup } from './marks/cup.js'
import { bulb } from './marks/bulb.js'
import { plane } from './marks/plane.js'

/** @type {import('./engine/mark.js').UnitMark[]} */
export const catalog = [
  person,
  house,
  heart,
  tree,
  droplet,
  star,
  car,
  bag,
  book,
  cup,
  bulb,
  plane,
]
