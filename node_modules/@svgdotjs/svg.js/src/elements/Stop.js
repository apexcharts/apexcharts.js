import { nodeOrNew, register } from '../utils/adopter.js'
import Element from './Element.js'
import SVGNumber from '../types/SVGNumber.js'
import { registerMethods } from '../utils/methods.js'

export default class Stop extends Element {
  constructor(node, attrs = node) {
    super(nodeOrNew('stop', node), attrs)
  }

  // add color stops
  update(o) {
    if (typeof o === 'number' || o instanceof SVGNumber) {
      o = {
        offset: arguments[0],
        color: arguments[1],
        opacity: arguments[2]
      }
    }

    // set attributes
    if (o.opacity != null) this.attr('stop-opacity', o.opacity)
    if (o.color != null) this.attr('stop-color', o.color)
    if (o.offset != null) this.attr('offset', new SVGNumber(o.offset))

    return this
  }
}

registerMethods({
  Gradient: {
    // Add a color stop
    stop: function (offset, color, opacity) {
      return this.put(new Stop()).update(offset, color, opacity)
    }
  }
})

register(Stop, 'Stop')
