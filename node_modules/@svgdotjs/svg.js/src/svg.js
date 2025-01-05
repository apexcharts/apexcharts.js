import * as svgMembers from './main.js'
import { makeInstance } from './utils/adopter.js'

// The main wrapping element
export default function SVG(element, isHTML) {
  return makeInstance(element, isHTML)
}

Object.assign(SVG, svgMembers)
