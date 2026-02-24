import SVGContainer from './SVGContainer'
import { SVGNS } from './math'
import { Environment } from '../utils/Environment.js'

// Install select + resize behavior on SVGElement prototype
function installSelectable(ElementClass) {
  ElementClass.prototype.select = function (opts) {
    if (opts === false) {
      // Remove selection handles
      if (this._selectCleanup) {
        this._selectCleanup()
        this._selectCleanup = null
      }
      return this
    }

    const el = this
    const { createHandle, updateHandle } = opts

    // Create a group for the handles
    const handleGroup = document.createElementNS(SVGNS, 'g')
    handleGroup.setAttribute('class', 'svg_select_points')
    const parent = el.node.parentNode
    if (parent) {
      parent.appendChild(handleGroup)
    }

    const handles = {}

    // Create handles for all edge positions
    const handleNames = ['t', 'b', 'l', 'r', 'lt', 'rt', 'lb', 'rb']
    handleNames.forEach((name, index) => {
      const subGroup = new SVGContainer(
        document.createElementNS(SVGNS, 'g')
      )
      handleGroup.appendChild(subGroup.node)
      const handle = createHandle(subGroup, [0, 0], index, [], name)
      handles[name] = { group: subGroup, handle }
    })

    // Position handles based on element's current bbox
    const updatePositions = () => {
      const x = parseFloat(el.attr('x')) || 0
      const y = parseFloat(el.attr('y')) || 0
      const w = parseFloat(el.attr('width')) || 0
      const h = parseFloat(el.attr('height')) || 0

      // Sync transform (e.g. translateX/Y) from the element to the handle group
      const elTransform = el.node.getAttribute('transform')
      if (elTransform) {
        handleGroup.setAttribute('transform', elTransform)
      } else {
        handleGroup.removeAttribute('transform')
      }

      const positions = {
        t: [x + w / 2, y],
        b: [x + w / 2, y + h],
        l: [x, y + h / 2],
        r: [x + w, y + h / 2],
        lt: [x, y],
        rt: [x + w, y],
        lb: [x, y + h],
        rb: [x + w, y + h],
      }

      handleNames.forEach((name) => {
        if (handles[name] && positions[name]) {
          updateHandle(handles[name].group, positions[name])
        }
      })
    }

    updatePositions()

    el._selectHandles = handleGroup
    el._selectHandlesMap = handles
    el._updateSelectPositions = updatePositions
    el._selectCleanup = () => {
      if (handleGroup.parentNode) {
        handleGroup.parentNode.removeChild(handleGroup)
      }
      el._selectHandles = null
      el._selectHandlesMap = null
      el._updateSelectPositions = null
    }

    return el
  }

  ElementClass.prototype.resize = function (enable) {
    if (enable === false) {
      if (this._resizeCleanup) {
        this._resizeCleanup()
        this._resizeCleanup = null
      }
      return this
    }

    const el = this
    const handles = el._selectHandlesMap
    if (!handles) return el

    const cleanupFns = []

    // Make left and right handles draggable for resizing
    const makeHandleDraggable = (name) => {
      const handleInfo = handles[name]
      if (!handleInfo || !handleInfo.group || !handleInfo.group.node)
        return

      const handleNode = handleInfo.group.node

      const onPointerDown = (e) => {
        if (e.button && e.button !== 0) return
        e.stopPropagation()

        const isTouch = e.type === 'touchstart'
        const ev = isTouch ? e.touches[0] : e
        const startClientX = ev.clientX

        const svgRoot = el.node.ownerSVGElement
        let ctm = null
        if (svgRoot) {
          ctm = svgRoot.getScreenCTM()
        }

        const startX = parseFloat(el.attr('x')) || 0
        const startW = parseFloat(el.attr('width')) || 0

        const onMove = (me) => {
          const mev = me.type === 'touchmove' ? me.touches[0] : me
          let dx = mev.clientX - startClientX
          if (ctm) dx = dx / ctm.a

          let newX = startX
          let newW = startW

          if (name === 'l') {
            newX = startX + dx
            newW = startW - dx
          } else if (name === 'r') {
            newW = startW + dx
          }

          if (newW < 0) {
            newW = 0
          }

          el.attr({ x: newX, width: newW })

          if (el._updateSelectPositions) {
            el._updateSelectPositions()
          }

          // Fire resize event during move so connected charts update in real-time
          const event = new CustomEvent('resize', {
            detail: { el },
          })
          el.node.dispatchEvent(event)
        }

        const onUp = () => {
          if (Environment.isBrowser()) {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('touchmove', onMove)
            document.removeEventListener('mouseup', onUp)
            document.removeEventListener('touchend', onUp)
          }

          // Fire resize event
          const event = new CustomEvent('resize', {
            detail: { el },
          })
          el.node.dispatchEvent(event)
        }

        if (Environment.isBrowser()) {
          document.addEventListener('mousemove', onMove)
          document.addEventListener('touchmove', onMove)
          document.addEventListener('mouseup', onUp)
          document.addEventListener('touchend', onUp)
        }
      }

      handleNode.addEventListener('mousedown', onPointerDown)
      handleNode.addEventListener('touchstart', onPointerDown)

      cleanupFns.push(() => {
        handleNode.removeEventListener('mousedown', onPointerDown)
        handleNode.removeEventListener('touchstart', onPointerDown)
      })
    }

    // Only left and right handles are functional (others are 0-size)
    makeHandleDraggable('l')
    makeHandleDraggable('r')

    el._resizeCleanup = () => {
      cleanupFns.forEach((fn) => fn())
    }

    return el
  }
}

export { installSelectable }
