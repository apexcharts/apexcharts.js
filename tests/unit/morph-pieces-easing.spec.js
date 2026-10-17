import { describe, it, expect, afterEach, vi } from 'vitest'
import { runPieceTween } from '../../src/modules/MorphPieces.js'

// The pieces of a cross-type morph (bar to unit, heatmap to scatter...) were
// eased on a hard-coded cubic and timed by wall clock, while the plot rect
// and the axis chrome of the same morph follow the chart's update easing on
// the animation clock. With animations.easing 'linear' the two halves of one
// transition fell out of step. The caller now hands the easing in, and the
// pieces read the animation frame's time.

afterEach(() => vi.restoreAllMocks())

function rect(x) {
  return { x, y: 0, width: 10, height: 10, rx: 0 }
}

describe('morph pieces ride the chart easing and clock', () => {
  it('moves on the easing it is given, on the frame clock', () => {
    vi.spyOn(performance, 'now').mockImplementation(() => 0)
    // Wall time never moves: the frame time alone must drive the tween.
    vi.spyOn(Date, 'now').mockImplementation(() => 0)
    const queue = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queue.push(cb)
      return queue.length
    })
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    const done = vi.fn()
    runPieceTween({
      pieces: [{ el, from: rect(0), to: rect(100), fill: null, delay: 0 }],
      duration: 1000,
      ease: (p) => p,
      onAllDone: done,
    })
    const step = (now) => {
      const q = queue.splice(0)
      q.forEach((cb) => cb(now))
    }
    step(250)
    expect(Number(el.getAttribute('x'))).toBeCloseTo(25, 6)
    step(500)
    expect(Number(el.getAttribute('x'))).toBeCloseTo(50, 6)
    step(1000)
    expect(Number(el.getAttribute('x'))).toBe(100)
    step(1016)
    expect(done).toHaveBeenCalledTimes(1)
  })
})
