import { morphPaths } from './PathMorphing'

// Sine ease in-out (matches SVG.js default '<>' easing)
function easeInOut(t) {
  return -Math.cos(t * Math.PI) / 2 + 0.5
}

// Parse color string to [r, g, b, a]
function parseColor(str) {
  if (!str || typeof str !== 'string') return null
  // hex #rgb or #rrggbb
  if (str[0] === '#') {
    let hex = str.slice(1)
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    const n = parseInt(hex, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
  }
  // rgb(r,g,b) or rgba(r,g,b,a)
  const m = str.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
  )
  if (m) return [+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1]
  return null
}

function interpolateColor(from, to, pos) {
  return `rgba(${Math.round(from[0] + (to[0] - from[0]) * pos)},${Math.round(from[1] + (to[1] - from[1]) * pos)},${Math.round(from[2] + (to[2] - from[2]) * pos)},${from[3] + (to[3] - from[3]) * pos})`
}

class SVGAnimationRunner {
  constructor(element, duration, delay) {
    this.el = element
    this.duration = duration ?? 300
    this.delay = delay || 0
    this._attrTarget = null
    this._plotTarget = null
    this._afterCb = null
    this._duringCb = null
    this._next = null
    this._root = null
    this._scheduled = false
  }

  attr(to) {
    this._attrTarget = to
    this._schedule()
    return this
  }

  plot(d) {
    this._plotTarget = d
    this._schedule()
    return this
  }

  after(fn) {
    this._afterCb = fn
    this._schedule()
    return this
  }

  during(fn) {
    this._duringCb = fn
    this._schedule()
    return this
  }

  animate(duration, delay) {
    const next = new SVGAnimationRunner(this.el, duration, delay)
    this._next = next
    next._root = this._root || this
    return next
  }

  _schedule() {
    const root = this._root || this
    if (!root._scheduled) {
      root._scheduled = true
      queueMicrotask(() => root._executeChain())
    }
  }

  _executeChain() {
    const chain = []
    let r = this
    while (r) {
      chain.push(r)
      r = r._next
    }

    let cumulativeDelay = 0
    chain.forEach((runner) => {
      cumulativeDelay += runner.delay
      runner._execute(cumulativeDelay)
      cumulativeDelay += runner.duration
    })
  }

  _execute(startDelay) {
    const el = this.el
    const duration = this.duration

    if (duration <= 1) {
      // Near-instant: just apply final state after delay
      const apply = () => {
        if (this._attrTarget) el.attr(this._attrTarget)
        if (this._plotTarget) el.plot(this._plotTarget)
        if (this._afterCb) this._afterCb.call(el)
      }
      if (startDelay > 0) {
        setTimeout(apply, startDelay)
      } else {
        apply()
      }
      return
    }

    const run = () => {
      // Capture "from" values for attr interpolation
      const fromAttrs = {}
      const fromColors = {}
      const toColors = {}
      if (this._attrTarget) {
        for (const key of Object.keys(this._attrTarget)) {
          const fromVal = el.attr(key)
          fromAttrs[key] = fromVal
          // Check if this is a color value
          const fc = parseColor(fromVal)
          const tc = parseColor(String(this._attrTarget[key]))
          if (fc && tc) {
            fromColors[key] = fc
            toColors[key] = tc
          }
        }
      }

      // Initialize path morpher if needed
      let morphFn = null
      if (this._plotTarget) {
        const fromPath = el.attr('d') || ''
        try {
          morphFn = morphPaths(fromPath, this._plotTarget)
        } catch (e) {
          // If path morphing fails, just snap at the end
          morphFn = null
        }
      }

      const start = performance.now()

      const tick = (now) => {
        const elapsed = now - start
        const rawPos = Math.min(elapsed / duration, 1)
        const pos = easeInOut(rawPos)

        // Interpolate attributes
        if (this._attrTarget) {
          if (rawPos >= 1) {
            el.attr(this._attrTarget)
          } else {
            const current = {}
            for (const key of Object.keys(this._attrTarget)) {
              if (fromColors[key] && toColors[key]) {
                current[key] = interpolateColor(
                  fromColors[key],
                  toColors[key],
                  pos
                )
              } else {
                const from = parseFloat(fromAttrs[key])
                const to = parseFloat(this._attrTarget[key])
                if (!isNaN(from) && !isNaN(to)) {
                  current[key] = from + (to - from) * pos
                }
              }
            }
            el.attr(current)
          }
        }

        // Path morphing
        if (morphFn && rawPos < 1) {
          el.attr('d', morphFn(pos))
        }

        // During callback (pass raw linear position, matching SVG.js behavior)
        if (this._duringCb) this._duringCb(pos)

        if (rawPos < 1) {
          requestAnimationFrame(tick)
        } else {
          // Set final path
          if (this._plotTarget) {
            el.attr('d', this._plotTarget)
          }
          if (this._afterCb) this._afterCb.call(el)
        }
      }

      requestAnimationFrame(tick)
    }

    if (startDelay > 0) {
      setTimeout(run, startDelay)
    } else {
      run()
    }
  }
}

// Install .animate() on SVGElement prototype
function installAnimationMethods(ElementClass) {
  ElementClass.prototype.animate = function (duration, delay) {
    return new SVGAnimationRunner(this, duration, delay)
  }
}

export { SVGAnimationRunner, installAnimationMethods }
