import Utils from '../utils/Utils.js'

/**
 * ApexCharts Animation Module.
 *
 * @module Animations
 **/
export function animateLine(el, from, to, speed) {
  el.attr(from).animate(speed).attr(to)
}

/*
 ** Animate radius of a circle element
 */
export function animateMarker(el, speed, easing, cb) {
  el.attr({
    opacity: 0,
  })
    .animate(speed)
    .attr({
      opacity: 1,
    })
    .after(() => {
      cb()
    })
}

/*
 ** Animate rect properties
 */
export function animateRect(el, from, to, speed, fn) {
  el.attr(from)
    .animate(speed)
    .attr(to)
    .after(() => fn())
}

export function animatePathsGradually(ctx, params) {
  let { el, realIndex, j, fill, pathFrom, pathTo, speed, delay } = params
  const w = ctx.w

  let delayFactor = 0

  if (w.config.chart.animations.animateGradually.enabled) {
    delayFactor = w.config.chart.animations.animateGradually.delay
  }

  if (
    w.config.chart.animations.dynamicAnimation.enabled &&
    w.globals.dataChanged &&
    w.config.chart.type !== 'bar'
  ) {
    // disabled due to this bug - https://github.com/apexcharts/vue-apexcharts/issues/75
    delayFactor = 0
  }
  morphSVG(
    ctx,
    el,
    realIndex,
    j,
    w.config.chart.type === 'line' && !w.globals.comboCharts ? 'stroke' : fill,
    pathFrom,
    pathTo,
    speed,
    delay * delayFactor
  )
}

export function showDelayedElements(w) {
  w.globals.delayedElements.forEach((d) => {
    const ele = d.el
    ele.classList.remove('apexcharts-element-hidden')
    ele.classList.add('apexcharts-hidden-element-shown')
  })
}

export function animationCompleted(ctx, el) {
  const w = ctx.w
  if (w.globals.animationEnded) return

  w.globals.animationEnded = true
  showDelayedElements(w)

  if (typeof w.config.chart.events.animationEnd === 'function') {
    w.config.chart.events.animationEnd(ctx, { el, w })
  }
}

// SVG.js animation for morphing one path to another
export function morphSVG(
  ctx,
  el,
  realIndex,
  j,
  fill,
  pathFrom,
  pathTo,
  speed,
  delay
) {
  const w = ctx.w

  if (!pathFrom) {
    pathFrom = el.attr('pathFrom')
  }

  if (!pathTo) {
    pathTo = el.attr('pathTo')
  }

  const disableAnimationForCorrupPath = (path) => {
    if (w.config.chart.type === 'radar') {
      // radar chart drops the path to bottom and hence a corrup path looks ugly
      // therefore, disable animation for such a case
      speed = 1
    }
    return `M 0 ${w.globals.gridHeight}`
  }

  if (
    !pathFrom ||
    pathFrom.indexOf('undefined') > -1 ||
    pathFrom.indexOf('NaN') > -1
  ) {
    pathFrom = disableAnimationForCorrupPath()
  }

  if (
    !pathTo.trim() ||
    pathTo.indexOf('undefined') > -1 ||
    pathTo.indexOf('NaN') > -1
  ) {
    pathTo = disableAnimationForCorrupPath()
  }
  if (!w.globals.shouldAnimate) {
    speed = 1
  }

  el.plot(pathFrom)
    .animate(1, delay)
    .plot(pathFrom)
    .animate(speed, delay)
    .plot(pathTo)
    .after(() => {
      // a flag to indicate that the original mount function can return true now as animation finished here
      if (Utils.isNumber(j)) {
        if (
          j === w.globals.series[w.globals.maxValsInArrayIndex].length - 2 &&
          w.globals.shouldAnimate
        ) {
          animationCompleted(ctx, el)
        }
      } else if (fill !== 'none' && w.globals.shouldAnimate) {
        if (
          (!w.globals.comboCharts &&
            realIndex === w.globals.series.length - 1) ||
          w.globals.comboCharts
        ) {
          animationCompleted(ctx, el)
        }
      }

      showDelayedElements(w)
    })
}
