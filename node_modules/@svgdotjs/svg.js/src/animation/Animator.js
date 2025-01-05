import { globals } from '../utils/window.js'
import Queue from './Queue.js'

const Animator = {
  nextDraw: null,
  frames: new Queue(),
  timeouts: new Queue(),
  immediates: new Queue(),
  timer: () => globals.window.performance || globals.window.Date,
  transforms: [],

  frame(fn) {
    // Store the node
    const node = Animator.frames.push({ run: fn })

    // Request an animation frame if we don't have one
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw)
    }

    // Return the node so we can remove it easily
    return node
  },

  timeout(fn, delay) {
    delay = delay || 0

    // Work out when the event should fire
    const time = Animator.timer().now() + delay

    // Add the timeout to the end of the queue
    const node = Animator.timeouts.push({ run: fn, time: time })

    // Request another animation frame if we need one
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw)
    }

    return node
  },

  immediate(fn) {
    // Add the immediate fn to the end of the queue
    const node = Animator.immediates.push(fn)
    // Request another animation frame if we need one
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw)
    }

    return node
  },

  cancelFrame(node) {
    node != null && Animator.frames.remove(node)
  },

  clearTimeout(node) {
    node != null && Animator.timeouts.remove(node)
  },

  cancelImmediate(node) {
    node != null && Animator.immediates.remove(node)
  },

  _draw(now) {
    // Run all the timeouts we can run, if they are not ready yet, add them
    // to the end of the queue immediately! (bad timeouts!!! [sarcasm])
    let nextTimeout = null
    const lastTimeout = Animator.timeouts.last()
    while ((nextTimeout = Animator.timeouts.shift())) {
      // Run the timeout if its time, or push it to the end
      if (now >= nextTimeout.time) {
        nextTimeout.run()
      } else {
        Animator.timeouts.push(nextTimeout)
      }

      // If we hit the last item, we should stop shifting out more items
      if (nextTimeout === lastTimeout) break
    }

    // Run all of the animation frames
    let nextFrame = null
    const lastFrame = Animator.frames.last()
    while (nextFrame !== lastFrame && (nextFrame = Animator.frames.shift())) {
      nextFrame.run(now)
    }

    let nextImmediate = null
    while ((nextImmediate = Animator.immediates.shift())) {
      nextImmediate()
    }

    // If we have remaining timeouts or frames, draw until we don't anymore
    Animator.nextDraw =
      Animator.timeouts.first() || Animator.frames.first()
        ? globals.window.requestAnimationFrame(Animator._draw)
        : null
  }
}

export default Animator
