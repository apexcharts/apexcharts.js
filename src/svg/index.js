import SVGElement from './SVGElement'
import SVGContainer from './SVGContainer'
import { Box, SVGNS } from './math'
import { installFilterMethods } from './SVGFilter'
import { installAnimationMethods } from './SVGAnimation'
import { installDraggable } from './SVGDraggable'
import { installSelectable } from './SVGSelectable'

// Install plugin methods on SVGElement prototype
installFilterMethods(SVGElement)
installAnimationMethods(SVGElement)
installDraggable(SVGElement)
installSelectable(SVGElement)

// SVG root factory — matches SVG.js's SVG() API
function SVG() {
  const svg = new SVGContainer(document.createElementNS(SVGNS, 'svg'))
  svg.attr({ xmlns: SVGNS })
  return svg
}

// Provide the xlink namespace used by Fill.js
SVG.xlink = 'http://www.w3.org/1999/xlink'

export { SVG, Box }
