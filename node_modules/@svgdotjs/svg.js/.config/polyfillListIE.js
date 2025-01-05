/* global SVGElement */
/* eslint no-new-object: "off" */

import CustomEventPolyfill from '@target/custom-event-polyfill/src/index.js6'
import children from '../src/polyfills/children.js'

/* IE 11 has no innerHTML on SVGElement */
import '../src/polyfills/innerHTML.js'

/* IE 11 has no correct CustomEvent implementation */
CustomEventPolyfill()

/* IE 11 has no children on SVGElement */
try {
  if (!SVGElement.prototype.children) {
    Object.defineProperty(SVGElement.prototype, 'children', {
      get: function () {
        return children(this)
      }
    })
  }
} catch (e) {}

/* IE 11 cannot handle getPrototypeOf(not_obj) */
try {
  delete Object.getPrototypeOf('test')
} catch (e) {
  var old = Object.getPrototypeOf
  Object.getPrototypeOf = function (o) {
    if (typeof o !== 'object') o = new Object(o)
    return old.call(this, o)
  }
}
