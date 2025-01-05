import { extend, Element } from '@svgdotjs/svg.js'
import { ResizeHandler } from './ResizeHandler'

extend(Element, {
  // Resize element with mouse
  resize: function (enabled = true, options = {}) {
    if (typeof enabled === 'object') {
      options = enabled
      enabled = true
    }

    let resizeHandler = this.remember('_ResizeHandler')

    if (!resizeHandler) {
      if (enabled.prototype instanceof ResizeHandler) {
        /* eslint new-cap: ["error", { "newIsCap": false }] */
        resizeHandler = new enabled(this)
        enabled = true
      } else {
        resizeHandler = new ResizeHandler(this)
      }

      this.remember('_resizeHandler', resizeHandler)
    }

    resizeHandler.active(enabled, options)

    return this
  },
})

export { ResizeHandler }
