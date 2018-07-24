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
    let easing = '<>'

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
  animateCircleRadius (el, from, to, speed) {
    if (!from) from = 0

    el.attr(
      {
        r: from
      }
    ).animate(speed).attr(
      {
        r: to
      }
    )
  }

  /*
  ** Animate radius and position of a circle element
  */
  animateCircle (el, from, to, speed) {
    el.attr(
      {
        r: from.r,
        cx: from.cx,
        cy: from.cy
      }
    ).animate(speed).attr(
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
    let { el, pathFrom, pathTo, speed, delay, strokeWidth } = params

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

    el.plot(pathFrom).animate(1, w.globals.easing, delay).plot(pathFrom).animate(speed, w.globals.easing, delay).plot(pathTo)
  }

  /* This function is called when initial animation ends.
   ** as we are delaying some elements on axis chart types and showing after initialAnim
   */
  showDelayedElements () {
    let w = this.w

    let anim = w.config.chart.animations
    let speed = anim.speed
    let gradualAnimate = anim.animateGradually.enabled
    let gradualDelay = anim.animateGradually.delay

    if (anim.enabled && !w.globals.resized) {
      for (let i = 0; i < w.globals.series.length; i++) {
        let delay = 0
        if (gradualAnimate) {
          delay = (i + 1) * (gradualDelay / 1000)
        }

        for (let z = 0; z < w.globals.delayedElements.length; z++) {
          if (w.globals.delayedElements[z].index === i) {
            let ele = w.globals.delayedElements[z].el
            ele.classList.add('apexcharts-showAfterDelay')
            ele.style.animationDelay = (speed / 950) + delay + 's'
          }
        }
      }
    }

    if (
      w.config.chart.animations.dynamicAnimation.enabled &&
      w.globals.dataChanged
    ) {
      for (let z = 0; z < w.globals.delayedElements.length; z++) {
        let ele = w.globals.delayedElements[z].el
        ele.classList.add('apexcharts-showAfterDelay')
        ele.style.animationDelay =
          w.config.chart.animations.dynamicAnimation.speed / 950 + 's'
      }
    }
  }
}

module.exports = Animations
