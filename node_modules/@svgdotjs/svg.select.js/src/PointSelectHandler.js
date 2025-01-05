import { G, getWindow } from '@svgdotjs/svg.js'
import { getMoseDownFunc, transformPoint } from './utils'

export class PointSelectHandler {
  constructor(el) {
    this.el = el
    el.remember('_pointSelectHandler', this)
    this.selection = new G()
    this.order = ['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l', 'rot']
    this.mutationHandler = this.mutationHandler.bind(this)

    const win = getWindow()
    this.observer = new win.MutationObserver(this.mutationHandler)
  }

  init(options) {
    this.createHandle = options.createHandle || this.createHandleFn
    this.updateHandle = options.updateHandle || this.updateHandleFn

    // mount group
    this.el.root().put(this.selection)

    this.updatePoints()
    this.createSelection()
    this.createPointHandles()
    this.updatePointHandles()
    this.observer.observe(this.el.node, { attributes: true })
  }

  active(val, options) {
    // Disable selection
    if (!val) {
      this.selection.clear().remove()
      this.observer.disconnect()
      return
    }

    // Enable selection
    this.init(options)
  }

  createSelection() {
    this.selection.polygon(this.points).addClass('svg_select_shape_pointSelect')
  }

  updateSelection() {
    this.selection.get(0).plot(this.points)
  }

  createPointHandles() {
    this.points.forEach((p, index, arr) => {
      this.createHandle.call(this, this.selection, p, index, arr)

      this.selection
        .get(index + 1)
        .addClass('svg_select_handle_point')
        .on('mousedown.selection touchstart.selection', getMoseDownFunc('point', this.el, this.points, index))
    })
  }

  createHandleFn(group) {
    group.circle(5)
  }

  updateHandleFn(shape, point) {
    shape.center(point[0], point[1])
  }

  updatePointHandles() {
    this.points.forEach((p, index, arr) => {
      this.updateHandle.call(this, this.selection.get(index + 1), p, index, arr)
    })
  }

  // gets new bounding box points and transform them into the elements space
  updatePoints() {
    const fromShapeToUiMatrix = this.el.parent().screenCTM().inverseO().multiplyO(this.el.screenCTM())
    this.points = this.el.array().map((p) => transformPoint(p, fromShapeToUiMatrix))
  }

  mutationHandler() {
    this.updatePoints()

    this.updateSelection()
    this.updatePointHandles()
  }
}
