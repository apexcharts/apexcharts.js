import { Element, Line, Polygon, Polyline, extend } from '@svgdotjs/svg.js'
import { SelectHandler } from './SelectHandler'
import { PointSelectHandler } from './PointSelectHandler'

const getSelectFn = (handleClass) => {
  return function (enabled = true, options = {}) {
    if (typeof enabled === 'object') {
      options = enabled
      enabled = true
    }

    let selectHandler = this.remember('_' + handleClass.name)

    if (!selectHandler) {
      if (enabled.prototype instanceof SelectHandler) {
        selectHandler = new enabled(this)
        enabled = true
      } else {
        selectHandler = new handleClass(this)
      }

      this.remember('_' + handleClass.name, selectHandler)
    }

    selectHandler.active(enabled, options)

    return this
  }
}

extend(Element, {
  select: getSelectFn(SelectHandler),
})

extend([Polygon, Polyline, Line], {
  pointSelect: getSelectFn(PointSelectHandler),
})

export { SelectHandler, PointSelectHandler }
