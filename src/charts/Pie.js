import Fill from '../modules/Fill'
import Utils from '../utils/Utils'
import Graphics from '../modules/Graphics'
import Filters from '../modules/Filters'

/**
 * ApexCharts Pie Class for drawing Pie / Donut Charts.
 * @module Pie
 **/

class Pie {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.chartType = this.w.config.chart.type

    this.initialAnim = this.w.config.chart.animations.enabled
    this.dynamicAnim = this.initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled

    this.animBeginArr = [0]
    this.animDur = 0

    const w = this.w

    this.lineColorArr = w.globals.stroke.colors !== undefined
      ? w.globals.stroke.colors
      : w.globals.colors

    this.defaultSize = w.globals.svgHeight < w.globals.svgWidth ? w.globals.svgHeight - 35 : w.globals.gridWidth

    this.centerY = this.defaultSize / 2
    this.centerX = w.globals.gridWidth / 2

    this.fullAngle = 360

    this.size = 0
    this.donutSize = 0

    this.prevSectorAngleArr = [] // for dynamic animations
  }

  draw (series) {
    let self = this
    let w = this.w

    const graphics = new Graphics(this.ctx)

    let ret = graphics.group({
      class: 'apexcharts-pie'
    })

    let total = 0
    for (let k = 0; k < series.length; k++) {
      // CALCULATE THE TOTAL
      total += Utils.negToZero(series[k])
    }

    let sectorAngleArr = []

    // el to which series will be drawn
    let elSeries = graphics.group()

    for (let i = 0; i < series.length; i++) {
      // CALCULATE THE ANGLES
      let angle = (this.fullAngle * Utils.negToZero(series[i]) / total)
      sectorAngleArr.push(angle)
    }

    if (w.globals.dataChanged) {
      let prevTotal = 0
      for (let k = 0; k < w.globals.previousPaths.length; k++) {
        // CALCULATE THE PREV TOTAL
        prevTotal += Utils.negToZero(w.globals.previousPaths[k])
      }

      let previousAngle

      for (let i = 0; i < w.globals.previousPaths.length; i++) {
        // CALCULATE THE PREVIOUS ANGLES
        previousAngle = (
          this.fullAngle * Utils.negToZero(w.globals.previousPaths[i]) / prevTotal
        )
        this.prevSectorAngleArr.push(previousAngle)
      }
    }

    this.size =
      this.defaultSize / 2.05 -
      w.config.stroke.width -
      w.config.chart.dropShadow.blur

    if (w.config.plotOptions.pie.size !== undefined) {
      this.size = w.config.plotOptions.pie.size
    }

    this.donutSize =
      this.size * parseInt(w.config.plotOptions.pie.donut.size) / 100

    let scaleSize = 1 + w.config.plotOptions.pie.customScale
    let halfW = w.globals.gridWidth / 2
    let halfH = w.globals.gridHeight / 2
    let translateX = halfW - w.globals.gridWidth / 2 * scaleSize
    let translateY = halfH - w.globals.gridHeight / 2 * scaleSize

    if (w.config.chart.type === 'donut') {
      // draw the inner circle and add some text to it
      const circle = graphics.drawCircle(this.donutSize)

      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: w.config.plotOptions.pie.donut.background
      })

      elSeries.add(circle)
    }

    let elG = self.drawArcs(sectorAngleArr, series)

    elSeries.attr({
      'transform': `translate(${translateX}, ${translateY - 25}) scale(${scaleSize})`
    })

    ret.attr({
      'data:innerTranslateX': translateX,
      'data:innerTranslateY': translateY - 25
    })

    elSeries.add(elG)

    ret.add(elSeries)

    return ret
  }

  // core function for drawing pie arcs
  drawArcs (sectorAngleArr, series) {
    let w = this.w
    const filters = new Filters(this.ctx)

    let graphics = new Graphics(this.ctx)
    let fill = new Fill(this.ctx)
    let g = graphics.group()

    let startAngle = 0
    let prevStartAngle = 0
    let endAngle = 0
    let prevEndAngle = 0

    this.strokeWidth = w.config.stroke.show
      ? w.config.stroke.width
      : 0

    for (let i = 0; i < sectorAngleArr.length; i++) {
      // if(sectorAngleArr[i]>0) {

      let elPieArc = graphics.group({
        class: `apexcharts-series apexcharts-pie-series ${w.globals.seriesNames[i].toString().replace(/ /g, '-')}`,
        id: 'apexcharts-series-' + i,
        rel: i + 1
      })

      g.add(elPieArc)

      startAngle = endAngle
      prevStartAngle = prevEndAngle

      endAngle = startAngle + sectorAngleArr[i]
      prevEndAngle = prevStartAngle + this.prevSectorAngleArr[i]

      let angle = endAngle - startAngle

      let pathFill = fill.fillPath(elPieArc, {
        seriesNumber: i,
        size: this.size
      }) // additionaly, pass size for gradient drawing in the fillPath function

      let path = this.getChangedPath(prevStartAngle, prevEndAngle)

      let elPath = graphics.drawPath({
        d: path,
        stroke: this.lineColorArr instanceof Array ? this.lineColorArr[i] : this.lineColorArr,
        strokeWidth: this.strokeWidth,
        fill: pathFill,
        fillOpacity: w.config.fill.opacity,
        classes: 'apexcharts-pie-area'
      })

      elPath.attr({
        id: 'apexcharts-pieSlice-' + i,
        index: 0,
        j: i
      })

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        filters.dropShadow(elPath, shadow)
      }

      this.addListeners(elPath)

      Graphics.setAttrs(elPath.node, {
        'data:angle': angle,
        'data:startAngle': startAngle,
        'data:strokeWidth': this.strokeWidth,
        'data:value': series[i]
      })

      let labelPosition

      if (w.config.chart.type === 'pie') {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          this.size / 1.25 + w.config.plotOptions.pie.dataLabels.offset,
          startAngle + (endAngle - startAngle) / 2
        )
      } else if (w.config.chart.type === 'donut') {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (this.size + this.donutSize) / 2 +
            w.config.plotOptions.pie.dataLabels.offset,
          startAngle + (endAngle - startAngle) / 2
        )
      }

      elPieArc.add(elPath)

      // Animation code starts
      let dur = 0
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur =
          ((endAngle - startAngle) / this.fullAngle) *
          w.config.chart.animations.speed

        this.animDur = dur + this.animDur
        this.animBeginArr.push(this.animDur)
      } else {
        this.animBeginArr.push(0)
      }

      if (this.dynamicAnim && w.globals.dataChanged) {
        this.animatePaths(elPath, {
          endAngle,
          startAngle,
          prevStartAngle,
          prevEndAngle,
          animateStartingPos: true,
          i,
          animBeginArr: this.animBeginArr,
          dur: w.config.chart.animations.dynamicAnimation.speed
        })
      } else {
        this.animatePaths(elPath, {
          endAngle,
          startAngle,
          i,
          totalItems: sectorAngleArr.length - 1,
          animBeginArr: this.animBeginArr,
          dur
        })
      }

      // animation code ends

      elPath.click(this.pieClicked.bind(this, i))

      if (w.config.dataLabels.enabled) {
        let xPos = labelPosition.x
        let yPos = labelPosition.y
        let text =
        (100 * (endAngle - startAngle) / 360) + '%'

        if (angle !== 0) {
          let formatter = w.config.dataLabels.formatter
          if (formatter !== undefined) {
            text = formatter(w.globals.seriesPercent[i][0], { seriesIndex: i, w })
          }
          let foreColor = w.globals.dataLabels.style.colors[i]

          let elPieLabel = graphics.drawText({
            x: xPos,
            y: yPos,
            text: text,
            textAnchor: 'middle',
            fontSize: w.config.dataLabels.style.fontSize,
            fontFamily: w.config.dataLabels.style.fontFamily,
            foreColor
          })

          if (w.config.dataLabels.dropShadow.enabled) {
            const textShadow = w.config.dataLabels.dropShadow
            const filters = new Filters(this.ctx)
            filters.dropShadow(elPieLabel, textShadow)
          }

          elPieLabel.node.classList.add('apexcharts-pie-label')
          if (w.config.chart.animations.animate && w.globals.resized === false) {
            elPieLabel.node.classList.add('apexcharts-pie-label-delay')
            elPieLabel.node.style.animationDelay =
              w.config.chart.animations.speed / 940 + 's'
          }

          elPieArc.add(elPieLabel)
        }
      }
      // }
    }

    return g
  }

  addListeners (elPath) {
    const graphics = new Graphics(this.ctx)
    // append filters on mouseenter and mouseleave
    elPath.node.addEventListener(
      'mouseenter',
      graphics.pathMouseEnter.bind(this, elPath)
    )
    elPath.node.addEventListener(
      'mouseleave',
      graphics.pathMouseLeave.bind(this, elPath)
    )

    elPath.node.addEventListener(
      'mousedown',
      graphics.pathMouseDown.bind(this, elPath)
    )
  }

  // This function can be used for other circle charts too
  animatePaths (el, opts) {
    let w = this.w
    let me = this

    let angle = opts.endAngle - opts.startAngle
    var prevAngle = angle

    let fromStartAngle = opts.startAngle
    let toStartAngle = opts.startAngle

    if (opts.prevStartAngle !== undefined && opts.prevEndAngle !== undefined) {
      fromStartAngle = opts.prevEndAngle
      prevAngle = opts.prevEndAngle - opts.prevStartAngle
    }
    if (opts.i === w.config.series.length - 1) {
      // some adjustments for the last overlapping paths
      if (angle + toStartAngle > this.fullAngle) {
        opts.endAngle = opts.endAngle - (angle + toStartAngle)
      } else if (angle + toStartAngle < this.fullAngle) {
        opts.endAngle = opts.endAngle + (this.fullAngle - (angle + toStartAngle))
      }
    }

    if (angle === this.fullAngle) angle = this.fullAngle - 0.01

    me.animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts)
  }

  animateArc (el, fromStartAngle, toStartAngle, angle, prevAngle, params) {
    let me = this
    const w = this.w

    let size = me.size

    if (!size) {
      size = params.size
    }

    let path
    let opts = params

    if (isNaN(fromStartAngle) || isNaN(prevAngle)) {
      fromStartAngle = toStartAngle
      prevAngle = angle
      opts.dur = 0
    }

    let currAngle = angle
    let startAngle = toStartAngle
    let fromAngle = (fromStartAngle - toStartAngle)

    if (w.globals.dataChanged && params.shouldSetPrevPaths) {
      // to avoid flickering, set prev path first and then we will animate from there
      path = me.getPiePath({
        me,
        startAngle,
        angle: prevAngle,
        size
      })
      el.attr({ d: path })
    }

    if (opts.dur !== 0) {
      el.animate(opts.dur, w.globals.easing, opts.animBeginArr[opts.i]).afterAll(function () {
        if (w.config.chart.type === 'pie' || w.config.chart.type === 'donut') {
          this.animate(300).attr({
            'stroke-width': w.config.stroke.width
          })
        }
      }).during(function (pos) {
        currAngle = fromAngle + (angle - fromAngle) * pos
        if (params.animateStartingPos) {
          currAngle = (prevAngle) + (angle - (prevAngle)) * pos
          startAngle = (fromStartAngle - prevAngle) + (toStartAngle - (fromStartAngle - prevAngle)) * pos
        }

        path = me.getPiePath({
          me,
          startAngle,
          angle: currAngle,
          size
        })

        el.node.setAttribute('data:pathOrig', path)

        el.attr({
          d: path
        })
      })
    } else {
      path = me.getPiePath({
        me,
        startAngle,
        angle,
        size
      })

      el.node.setAttribute('data:pathOrig', path)

      el.attr({
        d: path
      })
    }
  }

  pieClicked (i) {
    let w = this.w
    let me = this
    let path

    let size = me.size + 10
    let elPath = w.globals.dom.Paper.select('#apexcharts-pieSlice-' + i).members[0]

    let pathFrom = elPath.attr('d')

    if (elPath.attr('data:pieClicked') === 'true') {
      elPath.attr({
        'data:pieClicked': 'false'
      })

      let origPath = elPath.attr('data:pathOrig')
      elPath.attr({
        'd': origPath
      })
      return
    } else {
      // reset all elems
      let allEls = w.globals.dom.baseEl.querySelectorAll('.apexcharts-pie-area')
      Array.prototype.forEach.call(allEls, function (pieSlice) {
        pieSlice.setAttribute('data:pieClicked', 'false')
        let origPath = pieSlice.getAttribute('data:pathOrig')
        pieSlice.setAttribute('d', origPath)
      })
      elPath.attr('data:pieClicked', 'true')
    }

    let startAngle = parseInt(elPath.attr('data:startAngle'))
    let angle = parseInt(elPath.attr('data:angle'))

    path = me.getPiePath({
      me,
      startAngle,
      angle,
      size
    })

    if (angle === 360) return

    elPath.plot(path).animate(1).plot(pathFrom).animate(100).plot(path)
  }

  getChangedPath (prevStartAngle, prevEndAngle) {
    let path = ''
    if (this.dynamicAnim && this.w.globals.dataChanged) {
      path = this.getPiePath({
        me: this,
        startAngle: prevStartAngle,
        angle: prevEndAngle - prevStartAngle,
        size: this.size
      })
    }
    return path
  }

  getPiePath ({
    me,
    startAngle,
    angle,
    size
  }) {
    let w = this.w
    let path

    let startDeg = startAngle
    let startRadians = Math.PI * (startDeg - 90) / 180

    let endDeg = angle + startAngle
    if (endDeg > 360) endDeg = 360

    let endRadians = Math.PI * (endDeg - 90) / 180

    let x1 = me.centerX + size * Math.cos(startRadians)
    let y1 = me.centerY + size * Math.sin(startRadians)
    let x2 = me.centerX + size * Math.cos(endRadians)
    let y2 = me.centerY + size * Math.sin(endRadians)

    let startInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      endDeg
    )
    let endInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      startDeg
    )

    let largeArc = angle > 180 ? 1 : 0

    if (w.config.chart.type === 'donut') {
      path = [
        'M', x1, y1, 'A', size, size, 0, largeArc, 1, x2, y2, 'L', startInner.x, startInner.y, 'A', me.donutSize, me.donutSize, 0, largeArc, 0, endInner.x, endInner.y, 'L', x1, y1, 'z'
      ].join(' ')
    } else if (w.config.chart.type === 'pie') {
      path = [
        'M', x1, y1, 'A', size, size, 0, largeArc, 1, x2, y2, 'L', me.centerX, me.centerY, 'L', x1, y1
      ].join(' ')
    } else {
      path = ['M', x1, y1, 'A', size, size, 0, largeArc, 1, x2, y2].join(' ')
    }

    return path
  }
}

export default Pie
