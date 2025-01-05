import { G, getWindow } from '@svgdotjs/svg.js'
import { getMoseDownFunc, transformPoint } from './utils'

export class SelectHandler {
  constructor(el) {
    this.el = el
    el.remember('_selectHandler', this)
    this.selection = new G()
    this.order = ['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l', 'rot']
    this.mutationHandler = this.mutationHandler.bind(this)

    const win = getWindow()
    this.observer = new win.MutationObserver(this.mutationHandler)
  }

  init(options) {
    this.createHandle = options.createHandle || this.createHandleFn
    this.createRot = options.createRot || this.createRotFn

    this.updateHandle = options.updateHandle || this.updateHandleFn
    this.updateRot = options.updateRot || this.updateRotFn

    // mount group
    this.el.root().put(this.selection)

    this.updatePoints()
    this.createSelection()
    this.createResizeHandles()
    this.updateResizeHandles()
    this.createRotationHandle()
    this.updateRotationHandle()
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
    this.selection.polygon(this.handlePoints).addClass('svg_select_shape')
  }

  updateSelection() {
    this.selection.get(0).plot(this.handlePoints)
  }

  createResizeHandles() {
    this.handlePoints.forEach((p, index, arr) => {
      const name = this.order[index]
      this.createHandle.call(this, this.selection, p, index, arr, name)

      this.selection
        .get(index + 1)
        .addClass('svg_select_handle svg_select_handle_' + name)
        .on('mousedown.selection touchstart.selection', getMoseDownFunc(name, this.el, this.handlePoints, index))
    })
  }

  createHandleFn(group) {
    group.polyline()
  }

  updateHandleFn(shape, point, index, arr) {
    const before = arr.at(index - 1)
    const next = arr[(index + 1) % arr.length]
    const p = point

    const diff1 = [p[0] - before[0], p[1] - before[1]]
    const diff2 = [p[0] - next[0], p[1] - next[1]]

    const len1 = Math.sqrt(diff1[0] * diff1[0] + diff1[1] * diff1[1])
    const len2 = Math.sqrt(diff2[0] * diff2[0] + diff2[1] * diff2[1])

    const normalized1 = [diff1[0] / len1, diff1[1] / len1]
    const normalized2 = [diff2[0] / len2, diff2[1] / len2]

    const beforeNew = [p[0] - normalized1[0] * 10, p[1] - normalized1[1] * 10]
    const nextNew = [p[0] - normalized2[0] * 10, p[1] - normalized2[1] * 10]

    shape.plot([beforeNew, p, nextNew])
  }

  updateResizeHandles() {
    this.handlePoints.forEach((p, index, arr) => {
      const name = this.order[index]
      this.updateHandle.call(this, this.selection.get(index + 1), p, index, arr, name)
    })
  }

  createRotFn(group) {
    group.line()
    group.circle(5)
  }

  getPoint(name) {
    return this.handlePoints[this.order.indexOf(name)]
  }

  getPointHandle(name) {
    return this.selection.get(this.order.indexOf(name) + 1)
  }

  updateRotFn(group, rotPoint) {
    const topPoint = this.getPoint('t')
    group.get(0).plot(topPoint[0], topPoint[1], rotPoint[0], rotPoint[1])
    group.get(1).center(rotPoint[0], rotPoint[1])
  }

  createRotationHandle() {
    const handle = this.selection
      .group()
      .addClass('svg_select_handle_rot')
      .on('mousedown.selection touchstart.selection', getMoseDownFunc('rot', this.el, this.handlePoints))

    this.createRot.call(this, handle)
  }

  updateRotationHandle() {
    const group = this.selection.findOne('g.svg_select_handle_rot')
    this.updateRot(group, this.rotationPoint, this.handlePoints)
  }

  // gets new bounding box points and transform them into the elements space
  updatePoints() {
    const bbox = this.el.bbox()
    const fromShapeToUiMatrix = this.el.root().screenCTM().inverseO().multiplyO(this.el.screenCTM())

    this.handlePoints = this.getHandlePoints(bbox).map((p) => transformPoint(p, fromShapeToUiMatrix))
    this.rotationPoint = transformPoint(this.getRotationPoint(bbox), fromShapeToUiMatrix)
  }

  // A collection of all the points we need to draw our ui
  getHandlePoints({ x, x2, y, y2, cx, cy } = this.el.bbox()) {
    return [
      [x, y],
      [cx, y],
      [x2, y],
      [x2, cy],
      [x2, y2],
      [cx, y2],
      [x, y2],
      [x, cy],
    ]
  }

  // A collection of all the points we need to draw our ui
  getRotationPoint({ y, cx } = this.el.bbox()) {
    return [cx, y - 20]
  }

  mutationHandler() {
    this.updatePoints()

    this.updateSelection()
    this.updateResizeHandles()
    this.updateRotationHandle()
  }
}
