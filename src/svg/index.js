import SVGElement from './SVGElement'
import SVGContainer from './SVGContainer'
import { Box, SVGNS } from './math'
import { installFilterMethods } from './SVGFilter'
import { installAnimationMethods } from './SVGAnimation'
import { installDraggable } from './SVGDraggable'
import { installSelectable } from './SVGSelectable'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import { Environment } from '../utils/Environment.js'

// Install plugin methods on SVGElement prototype
installFilterMethods(SVGElement)
installAnimationMethods(SVGElement)
installDraggable(SVGElement)
installSelectable(SVGElement)

// SVG root factory — matches SVG.js's SVG() API
function SVG() {
  const svgEl = BrowserAPIs.createElementNS(SVGNS, 'svg')
  const svg = new SVGContainer(svgEl)
  svg.attr({ xmlns: SVGNS })
  return svg
}

// Provide the xlink namespace used by Fill.js
SVG.xlink = 'http://www.w3.org/1999/xlink'

// Only set window.SVG in browser environment
if (Environment.isBrowser() && typeof window.SVG === 'undefined') {
  window.SVG = SVG
}

export { SVG, Box }
