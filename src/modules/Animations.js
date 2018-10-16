import Utils from '../utils/Utils'

/**
 * ApexCharts Animation Class.
 *
 * @module Animations
 **/

class Animations {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.setEasingFunctions()
  }

  setEasingFunctions () {
    let easing

    const userDefinedEasing = this.w.config.chart.animations.easing

    switch (userDefinedEasing) {
      case 'linear': {
        easing = '-'
        break
      }
      case 'easein': {
        easing = '<'
        break
      }
      case 'easeout': {
        easing = '>'
        break
      }
      case 'easeinout': {
        easing = '<>'
        break
      }
      case 'swing': {
        easing = (pos) => {
          var s = 1.70158
          return (pos -= 1) * pos * ((s + 1) * pos + s) + 1
        }
        break
      }
      case 'bounce': {
        easing = (pos) => {
          if ((pos) < (1 / 2.75)) {
            return (7.5625 * pos * pos)
          } else if (pos < (2 / 2.75)) {
            return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75)
          } else if (pos < (2.5 / 2.75)) {
            return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375)
          } else {
            return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375)
          }
        }
        break
      }
      case 'elastic': {
        easing = (pos) => {
          if (pos === !!pos) return pos
          return Math.pow(2, -10 * pos) * Math.sin((pos - 0.075) * (2 * Math.PI) / 0.3) + 1
        }
        break
      }

      default: {
        easing = '<>'
      }
    }

    this.w.globals.easing = easing
  }

  animateLine (el, from, to, speed) {
    el.attr(from).animate(speed).attr(to)
  }

  /*
  ** Animate radius of a circle element
  */
  animateCircleRadius (el, from, to, speed, easing) {
    if (!from) from = 0

    el.attr(
      {
        r: from
      }
    ).animate(speed, easing).attr(
      {
        r: to
      }
    )
  }

  /*
  ** Animate radius and position of a circle element
  */
  animateCircle (el, from, to, speed, easing) {
    el.attr(
      {
        r: from.r,
        cx: from.cx,
        cy: from.cy
      }
    ).animate(speed, easing).attr(
      {
        r: to.r,
        cx: to.cx,
        cy: to.cy
      }
    )
  }

  /*
  ** Animate rect properties
  */
  animateRect (el, from, to, speed) {
    el.attr(from).animate(speed).attr(to)
  }

  animatePathsGradually (params) {
    let { el, j, pathFrom, pathTo, speed, delay, strokeWidth } = params

    let me = this
    let w = this.w

    let delayFactor = 0

    if (w.config.chart.animations.animateGradually.enabled) {
      delayFactor =
        w.config.chart.animations.animateGradually.delay
    }

    if (
      w.config.chart.animations.dynamicAnimation.enabled &&
      w.globals.dataChanged
    ) {
      delayFactor = 0
    }

    me.morphSVG(
      el,
      j,
      pathFrom,
      pathTo,
      speed,
      strokeWidth,
      delay * delayFactor
    )
  }

  // SVG.js animation for morphing one path to another
  morphSVG (
    el,
    j,
    pathFrom,
    pathTo,
    speed,
    strokeWidth,
    delay
  ) {
    let w = this.w

    if (!pathFrom) {
      pathFrom = el.attr('pathFrom')
    }

    if (!pathTo) {
      pathTo = el.attr('pathTo')
    }

    if (pathFrom.indexOf('undefined') > -1 || pathFrom.indexOf('NaN') > -1) {
      pathFrom = `M 0 ${w.globals.gridHeight}`
      speed = 1
    }
    if (pathTo.indexOf('undefined') > -1 || pathTo.indexOf('NaN') > -1) {
      pathTo = `M 0 ${w.globals.gridHeight}`
      speed = 1
    }
    if (!w.globals.shouldAnimate) {
      speed = 1
    }

    el.plot(pathFrom).animate(1, w.globals.easing, delay).plot(pathFrom).animate(speed, w.globals.easing, delay).plot(pathTo).afterAll(() => {
      // a flag to indicate that the original mount function can return true now as animation finished here

      if (typeof w.config.chart.events.animationEnd === 'function') {
        if (Utils.isNumber(j)) {
          if (j === w.globals.series[w.globals.maxValsInArrayIndex].length - 2 && w.globals.shouldAnimate) {
            w.config.chart.events.animationEnd(this.ctx, w)
          }
        } else if (w.globals.shouldAnimate) {
          w.config.chart.events.animationEnd(this.ctx, w)
        }
      }

      w.globals.delayedElements.forEach((d) => {
        const ele = d.el
        ele.classList.remove('hidden')
      })
    })
  }
}

module.exports = Animations
