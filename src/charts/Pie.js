import Animations from '../modules/Animations'
import Fill from '../modules/Fill'
import Utils from '../utils/Utils'
import Graphics from '../modules/Graphics'
import Filters from '../modules/Filters'

/**
 * ApexCharts Pie Class for drawing Pie / Donut Charts.
 * @module Pie
 **/

class Pie {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.chartType = this.w.config.chart.type

    this.initialAnim = this.w.config.chart.animations.enabled
    this.dynamicAnim =
      this.initialAnim &&
      this.w.config.chart.animations.dynamicAnimation.enabled

    this.animBeginArr = [0]
    this.animDur = 0

    this.donutDataLabels = this.w.config.plotOptions.pie.donut.labels

    const w = this.w

    this.lineColorArr =
      w.globals.stroke.colors !== undefined
        ? w.globals.stroke.colors
        : w.globals.colors

    this.defaultSize =
      w.globals.svgHeight < w.globals.svgWidth
        ? w.globals.svgHeight - 35
        : w.globals.gridWidth

    this.centerY = this.defaultSize / 2
    this.centerX = w.globals.gridWidth / 2

    this.fullAngle = 360

    w.globals.radialSize =
      this.defaultSize / 2.05 -
      w.config.stroke.width -
      w.config.chart.dropShadow.blur

    if (w.config.plotOptions.pie.size !== undefined) {
      w.globals.radialSize = w.config.plotOptions.pie.size
    }

    this.donutSize =
      (w.globals.radialSize * parseInt(w.config.plotOptions.pie.donut.size)) /
      100

    this.sliceLabels = []

    this.prevSectorAngleArr = [] // for dynamic animations
  }

  draw(series) {
    let self = this
    let w = this.w

    const graphics = new Graphics(this.ctx)

    let ret = graphics.group({
      class: 'apexcharts-pie'
    })

    if (w.globals.noData) return ret

    let total = 0
    for (let k = 0; k < series.length; k++) {
      // CALCULATE THE TOTAL
      total += Utils.negToZero(series[k])
    }

    let sectorAngleArr = []

    // el to which series will be drawn
    let elSeries = graphics.group()

    // prevent division by zero error if there is no data
    if (total === 0) {
      total = 0.00001
    }

    for (let i = 0; i < series.length; i++) {
      // CALCULATE THE ANGLES
      let angle = (this.fullAngle * Utils.negToZero(series[i])) / total
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
        previousAngle =
          (this.fullAngle * Utils.negToZero(w.globals.previousPaths[i])) /
          prevTotal
        this.prevSectorAngleArr.push(previousAngle)
      }
    }

    // on small chart size after few count of resizes browser window donutSize can be negative
    if (this.donutSize < 0) {
      this.donutSize = 0
    }

    let scaleSize = w.config.plotOptions.pie.customScale
    let halfW = w.globals.gridWidth / 2
    let halfH = w.globals.gridHeight / 2
    let translateX = halfW - (w.globals.gridWidth / 2) * scaleSize
    let translateY = halfH - (w.globals.gridHeight / 2) * scaleSize

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

    // add slice dataLabels at the end
    this.sliceLabels.forEach((s) => {
      elG.add(s)
    })

    elSeries.attr({
      transform: `translate(${translateX}, ${translateY -
        5}) scale(${scaleSize})`
    })

    ret.attr({
      'data:innerTranslateX': translateX,
      'data:innerTranslateY': translateY - 25
    })

    elSeries.add(elG)

    ret.add(elSeries)

    if (this.donutDataLabels.show) {
      let dataLabels = this.renderInnerDataLabels(this.donutDataLabels, {
        hollowSize: this.donutSize,
        centerX: this.centerX,
        centerY: this.centerY,
        opacity: this.donutDataLabels.show,
        translateX: translateX,
        translateY: translateY
      })

      ret.add(dataLabels)
    }

    return ret
  }

  // core function for drawing pie arcs
  drawArcs(sectorAngleArr, series) {
    let w = this.w
    const filters = new Filters(this.ctx)

    let graphics = new Graphics(this.ctx)
    let fill = new Fill(this.ctx)
    let g = graphics.group({
      class: 'apexcharts-slices'
    })

    let startAngle = 0
    let prevStartAngle = 0
    let endAngle = 0
    let prevEndAngle = 0

    this.strokeWidth = w.config.stroke.show ? w.config.stroke.width : 0

    for (let i = 0; i < sectorAngleArr.length; i++) {
      // if(sectorAngleArr[i]>0) {

      let elPieArc = graphics.group({
        class: `apexcharts-series apexcharts-pie-series`,
        seriesName: Utils.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
        'data:realIndex': i
      })

      g.add(elPieArc)

      startAngle = endAngle
      prevStartAngle = prevEndAngle

      endAngle = startAngle + sectorAngleArr[i]
      prevEndAngle = prevStartAngle + this.prevSectorAngleArr[i]

      let angle = endAngle - startAngle

      let pathFill = fill.fillPath({
        seriesNumber: i,
        size: w.globals.radialSize,
        value: series[i]
      }) // additionaly, pass size for gradient drawing in the fillPath function

      let path = this.getChangedPath(prevStartAngle, prevEndAngle)

      let elPath = graphics.drawPath({
        d: path,
        stroke:
          this.lineColorArr instanceof Array
            ? this.lineColorArr[i]
            : this.lineColorArr,
        strokeWidth: this.strokeWidth,
        fill: pathFill,
        fillOpacity: w.config.fill.opacity,
        classes: `apexcharts-pie-area apexcharts-${
          w.config.chart.type
        }-slice-${i}`
      })

      elPath.attr({
        index: 0,
        j: i
      })

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        filters.dropShadow(elPath, shadow, i)
      }

      this.addListeners(elPath, this.donutDataLabels)

      Graphics.setAttrs(elPath.node, {
        'data:angle': angle,
        'data:startAngle': startAngle,
        'data:strokeWidth': this.strokeWidth,
        'data:value': series[i]
      })

      let labelPosition = {
        x: 0,
        y: 0
      }

      if (w.config.chart.type === 'pie') {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 1.25 +
            w.config.plotOptions.pie.dataLabels.offset,
          startAngle + (endAngle - startAngle) / 2
        )
      } else if (w.config.chart.type === 'donut') {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2 +
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
          size: w.globals.radialSize,
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
          size: w.globals.radialSize,
          endAngle,
          startAngle,
          i,
          totalItems: sectorAngleArr.length - 1,
          animBeginArr: this.animBeginArr,
          dur
        })
      }

      // animation code ends
      if (w.config.plotOptions.pie.expandOnClick) {
        elPath.click(this.pieClicked.bind(this, i))
      }

      if (w.config.dataLabels.enabled) {
        let xPos = labelPosition.x
        let yPos = labelPosition.y
        let text = (100 * (endAngle - startAngle)) / 360 + '%'

        if (
          angle !== 0 &&
          w.config.plotOptions.pie.dataLabels.minAngleToShowLabel <
            sectorAngleArr[i]
        ) {
          let formatter = w.config.dataLabels.formatter
          if (formatter !== undefined) {
            text = formatter(w.globals.seriesPercent[i][0], {
              seriesIndex: i,
              w
            })
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
          if (
            w.config.chart.animations.animate &&
            w.globals.resized === false
          ) {
            elPieLabel.node.classList.add('apexcharts-pie-label-delay')
            elPieLabel.node.style.animationDelay =
              w.config.chart.animations.speed / 940 + 's'
          }

          this.sliceLabels.push(elPieLabel)
        }
      }
      // }
    }

    return g
  }

  addListeners(elPath, dataLabels) {
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
      'mouseleave',
      this.revertDataLabelsInner.bind(this, elPath.node, dataLabels)
    )
    elPath.node.addEventListener(
      'mousedown',
      graphics.pathMouseDown.bind(this, elPath)
    )

    if (!this.donutDataLabels.total.showAlways) {
      elPath.node.addEventListener(
        'mouseenter',
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      )

      elPath.node.addEventListener(
        'mousedown',
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      )
    }
  }

  // This function can be used for other circle charts too
  animatePaths(el, opts) {
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
        opts.endAngle =
          opts.endAngle + (this.fullAngle - (angle + toStartAngle))
      }
    }

    if (angle === this.fullAngle) angle = this.fullAngle - 0.01

    me.animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts)
  }

  animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts) {
    let me = this
    const w = this.w
    const animations = new Animations(this.ctx)

    let size = opts.size

    let path

    if (isNaN(fromStartAngle) || isNaN(prevAngle)) {
      fromStartAngle = toStartAngle
      prevAngle = angle
      opts.dur = 0
    }

    let currAngle = angle
    let startAngle = toStartAngle
    let fromAngle = fromStartAngle - toStartAngle

    if (w.globals.dataChanged && opts.shouldSetPrevPaths) {
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
      el.animate(opts.dur, w.globals.easing, opts.animBeginArr[opts.i])
        .afterAll(function() {
          if (
            w.config.chart.type === 'pie' ||
            w.config.chart.type === 'donut'
          ) {
            this.animate(300).attr({
              'stroke-width': w.config.stroke.width
            })
          }

          if (opts.i === w.config.series.length - 1) {
            animations.animationCompleted(el)
          }
        })
        .during(function(pos) {
          currAngle = fromAngle + (angle - fromAngle) * pos
          if (opts.animateStartingPos) {
            currAngle = prevAngle + (angle - prevAngle) * pos
            startAngle =
              fromStartAngle -
              prevAngle +
              (toStartAngle - (fromStartAngle - prevAngle)) * pos
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

      if (!opts.isTrack) {
        w.globals.animationEnded = true
      }
      el.node.setAttribute('data:pathOrig', path)

      el.attr({
        d: path
      })
    }
  }

  pieClicked(i) {
    let w = this.w
    let me = this
    let path

    let size = me.w.globals.radialSize + 4
    let elPath = w.globals.dom.Paper.select(
      `.apexcharts-${w.config.chart.type.toLowerCase()}-slice-${i}`
    ).members[0]

    let pathFrom = elPath.attr('d')

    if (elPath.attr('data:pieClicked') === 'true') {
      elPath.attr({
        'data:pieClicked': 'false'
      })
      this.revertDataLabelsInner(elPath.node, this.donutDataLabels)

      let origPath = elPath.attr('data:pathOrig')
      elPath.attr({
        d: origPath
      })
      return
    } else {
      // reset all elems
      let allEls = w.globals.dom.baseEl.querySelectorAll('.apexcharts-pie-area')
      Array.prototype.forEach.call(allEls, (pieSlice) => {
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

    elPath
      .plot(path)
      .animate(1)
      .plot(pathFrom)
      .animate(100)
      .plot(path)
  }

  getChangedPath(prevStartAngle, prevEndAngle) {
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

  getPiePath({ me, startAngle, angle, size }) {
    let w = this.w
    let path

    let startDeg = startAngle
    let startRadians = (Math.PI * (startDeg - 90)) / 180

    let endDeg = angle + startAngle
    if (Math.ceil(endDeg) >= 360) endDeg = 359.99

    let endRadians = (Math.PI * (endDeg - 90)) / 180

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
        'M',
        x1,
        y1,
        'A',
        size,
        size,
        0,
        largeArc,
        1,
        x2,
        y2,
        'L',
        startInner.x,
        startInner.y,
        'A',
        me.donutSize,
        me.donutSize,
        0,
        largeArc,
        0,
        endInner.x,
        endInner.y,
        'L',
        x1,
        y1,
        'z'
      ].join(' ')
    } else if (w.config.chart.type === 'pie') {
      path = [
        'M',
        x1,
        y1,
        'A',
        size,
        size,
        0,
        largeArc,
        1,
        x2,
        y2,
        'L',
        me.centerX,
        me.centerY,
        'L',
        x1,
        y1
      ].join(' ')
    } else {
      path = ['M', x1, y1, 'A', size, size, 0, largeArc, 1, x2, y2].join(' ')
    }

    return path
  }

  renderInnerDataLabels(dataLabelsConfig, opts) {
    let w = this.w
    const graphics = new Graphics(this.ctx)

    let g = graphics.group({
      class: 'apexcharts-datalabels-group',
      transform: `translate(${opts.translateX ? opts.translateX : 0}, ${
        opts.translateY ? opts.translateY : 0
      })`
    })

    const showTotal = dataLabelsConfig.total.show

    g.node.style.opacity = opts.opacity

    let x = opts.centerX
    let y = opts.centerY

    let labelColor, valueColor

    if (dataLabelsConfig.name.color === undefined) {
      labelColor = w.globals.colors[0]
    } else {
      labelColor = dataLabelsConfig.name.color
    }

    if (dataLabelsConfig.value.color === undefined) {
      valueColor = w.config.chart.foreColor
    } else {
      valueColor = dataLabelsConfig.value.color
    }

    let lbFormatter = dataLabelsConfig.value.formatter
    let val = ''
    let name = ''

    if (showTotal) {
      labelColor = dataLabelsConfig.total.color
      name = dataLabelsConfig.total.label
      val = dataLabelsConfig.total.formatter(w)
    } else {
      if (w.globals.series.length === 1) {
        val = lbFormatter(w.globals.series[0], w)
        name = w.globals.seriesNames[0]
      }
    }

    if (dataLabelsConfig.name.show) {
      let elLabel = graphics.drawText({
        x: x,
        y: y + parseInt(dataLabelsConfig.name.offsetY),
        text: name,
        textAnchor: 'middle',
        foreColor: labelColor,
        fontSize: dataLabelsConfig.name.fontSize,
        fontFamily: dataLabelsConfig.name.fontFamily
      })
      elLabel.node.classList.add('apexcharts-datalabel-label')
      g.add(elLabel)
    }

    if (dataLabelsConfig.value.show) {
      let valOffset = dataLabelsConfig.name.show
        ? parseInt(dataLabelsConfig.value.offsetY) + 16
        : dataLabelsConfig.value.offsetY

      let elValue = graphics.drawText({
        x: x,
        y: y + valOffset,
        text: val,
        textAnchor: 'middle',
        foreColor: valueColor,
        fontSize: dataLabelsConfig.value.fontSize,
        fontFamily: dataLabelsConfig.value.fontFamily
      })
      elValue.node.classList.add('apexcharts-datalabel-value')
      g.add(elValue)
    }

    // for a multi-series circle chart, we need to show total value instead of first series labels

    return g
  }

  /**
   *
   * @param {string} name - The name of the series
   * @param {string} val - The value of that series
   * @param {object} el - Optional el (indicates which series was hovered/clicked). If this param is not present, means we need to show total
   */
  printInnerLabels(labelsConfig, name, val, el) {
    const w = this.w

    let labelColor

    if (el) {
      if (labelsConfig.name.color === undefined) {
        labelColor =
          w.globals.colors[parseInt(el.parentNode.getAttribute('rel')) - 1]
      } else {
        labelColor = labelsConfig.name.color
      }
    } else {
      if (w.globals.series.length > 1 && labelsConfig.total.show) {
        labelColor = labelsConfig.total.color
      }
    }

    let elLabel = w.globals.dom.baseEl.querySelector(
      '.apexcharts-datalabel-label'
    )
    let elValue = w.globals.dom.baseEl.querySelector(
      '.apexcharts-datalabel-value'
    )

    let lbFormatter = labelsConfig.value.formatter
    val = lbFormatter(val, w)

    // we need to show Total Val - so get the formatter of it
    if (!el && typeof labelsConfig.total.formatter === 'function') {
      val = labelsConfig.total.formatter(w)
    }

    if (elLabel !== null) {
      elLabel.textContent = name
    }

    if (elValue !== null) {
      elValue.textContent = val
    }
    if (elLabel !== null) {
      elLabel.style.fill = labelColor
    }
  }

  printDataLabelsInner(el, dataLabelsConfig) {
    let w = this.w

    let val = el.getAttribute('data:value')
    let name =
      w.globals.seriesNames[parseInt(el.parentNode.getAttribute('rel')) - 1]

    if (w.globals.series.length > 1) {
      this.printInnerLabels(dataLabelsConfig, name, val, el)
    }

    let dataLabelsGroup = w.globals.dom.baseEl.querySelector(
      '.apexcharts-datalabels-group'
    )
    if (dataLabelsGroup !== null) {
      dataLabelsGroup.style.opacity = 1
    }
  }

  revertDataLabelsInner(el, dataLabelsConfig, event) {
    let w = this.w
    let dataLabelsGroup = w.globals.dom.baseEl.querySelector(
      '.apexcharts-datalabels-group'
    )

    if (dataLabelsConfig.total.show && w.globals.series.length > 1) {
      let pie = new Pie(this.ctx)
      pie.printInnerLabels(
        dataLabelsConfig,
        dataLabelsConfig.total.label,
        dataLabelsConfig.total.formatter(w)
      )
    } else {
      const slices = document.querySelectorAll(`.apexcharts-pie-area`)
      let sliceOut = false

      Array.prototype.forEach.call(slices, (s) => {
        if (s.getAttribute('data:pieClicked') === 'true') {
          sliceOut = true
          this.printDataLabelsInner(s, dataLabelsConfig)
        }
      })

      if (!sliceOut) {
        if (
          w.globals.selectedDataPoints.length &&
          w.globals.series.length > 1
        ) {
          if (w.globals.selectedDataPoints[0].length > 0) {
            const index = w.globals.selectedDataPoints[0]
            const el = w.globals.dom.baseEl.querySelector(
              `.apexcharts-${w.config.chart.type.toLowerCase()}-slice-${index}`
            )

            this.printDataLabelsInner(el, dataLabelsConfig)
          } else if (
            dataLabelsGroup &&
            w.globals.selectedDataPoints.length &&
            w.globals.selectedDataPoints[0].length === 0
          ) {
            dataLabelsGroup.style.opacity = 0
          }
        } else {
          if (dataLabelsGroup && w.globals.series.length > 1) {
            dataLabelsGroup.style.opacity = 0
          }
        }
      }
    }
  }
}

export default Pie
