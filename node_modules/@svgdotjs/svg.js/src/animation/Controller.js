import { timeline } from '../modules/core/defaults.js'
import { extend } from '../utils/adopter.js'

/***
Base Class
==========
The base stepper class that will be
***/

function makeSetterGetter(k, f) {
  return function (v) {
    if (v == null) return this[k]
    this[k] = v
    if (f) f.call(this)
    return this
  }
}

export const easing = {
  '-': function (pos) {
    return pos
  },
  '<>': function (pos) {
    return -Math.cos(pos * Math.PI) / 2 + 0.5
  },
  '>': function (pos) {
    return Math.sin((pos * Math.PI) / 2)
  },
  '<': function (pos) {
    return -Math.cos((pos * Math.PI) / 2) + 1
  },
  bezier: function (x1, y1, x2, y2) {
    // see https://www.w3.org/TR/css-easing-1/#cubic-bezier-algo
    return function (t) {
      if (t < 0) {
        if (x1 > 0) {
          return (y1 / x1) * t
        } else if (x2 > 0) {
          return (y2 / x2) * t
        } else {
          return 0
        }
      } else if (t > 1) {
        if (x2 < 1) {
          return ((1 - y2) / (1 - x2)) * t + (y2 - x2) / (1 - x2)
        } else if (x1 < 1) {
          return ((1 - y1) / (1 - x1)) * t + (y1 - x1) / (1 - x1)
        } else {
          return 1
        }
      } else {
        return 3 * t * (1 - t) ** 2 * y1 + 3 * t ** 2 * (1 - t) * y2 + t ** 3
      }
    }
  },
  // see https://www.w3.org/TR/css-easing-1/#step-timing-function-algo
  steps: function (steps, stepPosition = 'end') {
    // deal with "jump-" prefix
    stepPosition = stepPosition.split('-').reverse()[0]

    let jumps = steps
    if (stepPosition === 'none') {
      --jumps
    } else if (stepPosition === 'both') {
      ++jumps
    }

    // The beforeFlag is essentially useless
    return (t, beforeFlag = false) => {
      // Step is called currentStep in referenced url
      let step = Math.floor(t * steps)
      const jumping = (t * step) % 1 === 0

      if (stepPosition === 'start' || stepPosition === 'both') {
        ++step
      }

      if (beforeFlag && jumping) {
        --step
      }

      if (t >= 0 && step < 0) {
        step = 0
      }

      if (t <= 1 && step > jumps) {
        step = jumps
      }

      return step / jumps
    }
  }
}

export class Stepper {
  done() {
    return false
  }
}

/***
Easing Functions
================
***/

export class Ease extends Stepper {
  constructor(fn = timeline.ease) {
    super()
    this.ease = easing[fn] || fn
  }

  step(from, to, pos) {
    if (typeof from !== 'number') {
      return pos < 1 ? from : to
    }
    return from + (to - from) * this.ease(pos)
  }
}

/***
Controller Types
================
***/

export class Controller extends Stepper {
  constructor(fn) {
    super()
    this.stepper = fn
  }

  done(c) {
    return c.done
  }

  step(current, target, dt, c) {
    return this.stepper(current, target, dt, c)
  }
}

function recalculate() {
  // Apply the default parameters
  const duration = (this._duration || 500) / 1000
  const overshoot = this._overshoot || 0

  // Calculate the PID natural response
  const eps = 1e-10
  const pi = Math.PI
  const os = Math.log(overshoot / 100 + eps)
  const zeta = -os / Math.sqrt(pi * pi + os * os)
  const wn = 3.9 / (zeta * duration)

  // Calculate the Spring values
  this.d = 2 * zeta * wn
  this.k = wn * wn
}

export class Spring extends Controller {
  constructor(duration = 500, overshoot = 0) {
    super()
    this.duration(duration).overshoot(overshoot)
  }

  step(current, target, dt, c) {
    if (typeof current === 'string') return current
    c.done = dt === Infinity
    if (dt === Infinity) return target
    if (dt === 0) return current

    if (dt > 100) dt = 16

    dt /= 1000

    // Get the previous velocity
    const velocity = c.velocity || 0

    // Apply the control to get the new position and store it
    const acceleration = -this.d * velocity - this.k * (current - target)
    const newPosition = current + velocity * dt + (acceleration * dt * dt) / 2

    // Store the velocity
    c.velocity = velocity + acceleration * dt

    // Figure out if we have converged, and if so, pass the value
    c.done = Math.abs(target - newPosition) + Math.abs(velocity) < 0.002
    return c.done ? target : newPosition
  }
}

extend(Spring, {
  duration: makeSetterGetter('_duration', recalculate),
  overshoot: makeSetterGetter('_overshoot', recalculate)
})

export class PID extends Controller {
  constructor(p = 0.1, i = 0.01, d = 0, windup = 1000) {
    super()
    this.p(p).i(i).d(d).windup(windup)
  }

  step(current, target, dt, c) {
    if (typeof current === 'string') return current
    c.done = dt === Infinity

    if (dt === Infinity) return target
    if (dt === 0) return current

    const p = target - current
    let i = (c.integral || 0) + p * dt
    const d = (p - (c.error || 0)) / dt
    const windup = this._windup

    // antiwindup
    if (windup !== false) {
      i = Math.max(-windup, Math.min(i, windup))
    }

    c.error = p
    c.integral = i

    c.done = Math.abs(p) < 0.001

    return c.done ? target : current + (this.P * p + this.I * i + this.D * d)
  }
}

extend(PID, {
  windup: makeSetterGetter('_windup'),
  p: makeSetterGetter('P'),
  i: makeSetterGetter('I'),
  d: makeSetterGetter('D')
})
