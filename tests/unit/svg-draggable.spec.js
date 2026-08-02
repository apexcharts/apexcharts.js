import SVGElement from '../../src/svg/SVGElement.js'
import { SVGNS } from '../../src/svg/math.js'
import '../../src/svg/index.js' // installs draggable() on SVGElement.prototype

// Regression: draggable(false) during an active drag used to remove only the
// element's mousedown/touchstart listeners, leaving the in-flight document
// mousemove/mouseup closures attached (leaking, and firing on a detached node)
// until the pointer happened to be released.

function makeRect() {
  const el = new SVGElement(document.createElementNS(SVGNS, 'rect'))
  el.node.setAttribute('x', '0')
  el.node.setAttribute('y', '0')
  el.node.setAttribute('width', '10')
  el.node.setAttribute('height', '10')
  document.body.appendChild(el.node)
  return el
}

describe('SVGElement.draggable cleanup', () => {
  it('detaches in-flight document listeners on draggable(false) mid-drag', () => {
    const el = makeRect()
    el.draggable({})

    let moves = 0
    el.node.addEventListener('dragmove', () => {
      moves++
    })

    // Begin a drag: onPointerDown attaches the document move/up listeners.
    el.node.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, clientX: 0, clientY: 0 }),
    )
    expect(el._activeDrag).toBeTruthy()

    // A move mid-drag fires dragmove.
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 5, clientY: 5 }))
    expect(moves).toBe(1)

    // Disable dragging in the middle of the gesture.
    el.draggable(false)
    expect(el._activeDrag).toBeNull()

    // Further document moves must NOT fire dragmove (listeners detached).
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 9, clientY: 9 }))
    expect(moves).toBe(1)
  })

  it('clears active-drag tracking on pointer release', () => {
    const el = makeRect()
    el.draggable({})
    el.node.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, clientX: 0, clientY: 0 }),
    )
    expect(el._activeDrag).toBeTruthy()

    document.dispatchEvent(new MouseEvent('mouseup', {}))
    expect(el._activeDrag).toBeNull()
  })
})
