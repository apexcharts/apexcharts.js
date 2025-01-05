/**
 *
 * @param {string} eventName
 * @param {import('@svgdotjs/svg.js').Element} el
 * @param {number | null} index
 */
export function getMoseDownFunc(eventName, el, points, index = null) {
  return function (ev) {
    ev.preventDefault()
    ev.stopPropagation()

    var x = ev.pageX || ev.touches[0].pageX
    var y = ev.pageY || ev.touches[0].pageY
    el.fire(eventName, { x: x, y: y, event: ev, index, points })
  }
}

export function transformPoint([x, y], { a, b, c, d, e, f }) {
  return [x * a + y * c + e, x * b + y * d + f]
}
