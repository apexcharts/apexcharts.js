import { Environment } from '../utils/Environment.js'

// Install draggable behavior on SVGElement prototype
function installDraggable(ElementClass) {
  ElementClass.prototype.draggable = function (opts) {
    if (opts === false) {
      // Disable dragging
      if (this._dragCleanup) {
        this._dragCleanup()
        this._dragCleanup = null
      }
      return this
    }

    const el = this
    const constraints = opts || {}

    const onPointerDown = (e) => {
      // Ignore right-click
      if (e.button && e.button !== 0) return

      // Prevent parent handlers (e.g. ZoomPanSelection) from treating this as a new selection
      e.stopPropagation()

      const isTouch = e.type === 'touchstart'
      const ev = isTouch ? e.touches[0] : e

      const svgEl = el.node
      const startAttrX = parseFloat(svgEl.getAttribute('x')) || 0
      const startAttrY = parseFloat(svgEl.getAttribute('y')) || 0
      const startClientX = ev.clientX
      const startClientY = ev.clientY

      // We need to convert client px to SVG coordinate space
      const svgRoot = svgEl.ownerSVGElement
      let ctm = null
      if (svgRoot) {
        ctm = svgRoot.getScreenCTM()
      }

      const onMove = (me) => {
        const mev = me.type === 'touchmove' ? me.touches[0] : me

        let dx = mev.clientX - startClientX
        let dy = mev.clientY - startClientY

        // Convert pixel delta to SVG coordinate delta
        if (ctm) {
          dx = dx / ctm.a
          dy = dy / ctm.d
        }

        let newX = startAttrX + dx
        let newY = startAttrY + dy

        const w = parseFloat(svgEl.getAttribute('width')) || 0
        const h = parseFloat(svgEl.getAttribute('height')) || 0

        // Apply constraints
        if (constraints.minX !== undefined && newX < constraints.minX)
          newX = constraints.minX
        if (constraints.minY !== undefined && newY < constraints.minY)
          newY = constraints.minY
        if (constraints.maxX !== undefined && newX + w > constraints.maxX)
          newX = constraints.maxX - w
        if (constraints.maxY !== undefined && newY + h > constraints.maxY)
          newY = constraints.maxY - h

        const box = {
          x: newX,
          y: newY,
          w: w,
          h: h,
          x2: newX + w,
          y2: newY + h,
        }

        // Fire dragmove event matching SVG.js contract
        const event = new CustomEvent('dragmove', {
          detail: {
            handler: {
              move: function (x, y) {
                svgEl.setAttribute('x', x)
                svgEl.setAttribute('y', y)
              },
            },
            box: box,
          },
        })
        svgEl.dispatchEvent(event)
      }

      const onUp = () => {
        if (Environment.isBrowser()) {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('touchmove', onMove)
          document.removeEventListener('mouseup', onUp)
          document.removeEventListener('touchend', onUp)
        }
      }

      if (Environment.isBrowser()) {
        document.addEventListener('mousemove', onMove)
        document.addEventListener('touchmove', onMove)
        document.addEventListener('mouseup', onUp)
        document.addEventListener('touchend', onUp)
      }
    }

    el.node.addEventListener('mousedown', onPointerDown)
    el.node.addEventListener('touchstart', onPointerDown)

    el._dragCleanup = () => {
      el.node.removeEventListener('mousedown', onPointerDown)
      el.node.removeEventListener('touchstart', onPointerDown)
    }

    return el
  }
}

export { installDraggable }
