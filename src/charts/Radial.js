import Pie from './Pie'
import Utils from '../utils/Utils'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Filters from '../modules/Filters'

/**
 * ApexCharts Radial Class for drawing Circle / Semi Circle Charts.
 * @module Radial
 **/

class Radial extends Pie {
  constructor (ctx) {
    super(ctx)

    this.ctx = ctx
    this.w = ctx.w
    this.animBeginArr = [0]
    this.animDur = 0

    const w = this.w
    this.startAngle = w.config.plotOptions.radialBar.startAngle
    this.endAngle = w.config.plotOptions.radialBar.endAngle

    this.trackStartAngle = w.config.plotOptions.radialBar.track.startAngle
    this.trackEndAngle = w.config.plotOptions.radialBar.track.endAngle

    if (!this.trackStartAngle) this.trackStartAngle = this.startAngle
    if (!this.trackEndAngle) this.trackEndAngle = this.endAngle

    if (this.endAngle === 360) this.endAngle = 359.99

    this.fullAngle = 360 - w.config.plotOptions.radialBar.endAngle - w.config.plotOptions.radialBar.startAngle

    this.margin = parseInt(w.config.plotOptions.radialBar.track.margin)
  }

  draw (series) {
    let w = this.w
    const graphics = new Graphics(this.ctx)

    let ret = graphics.group({
      class: 'apexcharts-radialbar'
    })

    let elSeries = graphics.group()

    let centerY, centerX
    centerY = w.globals.gridHeight / 2
    centerX = w.globals.gridWidth / 2

    let size =
      w.globals.gridWidth / 2.05 -
      w.config.stroke.width -
      w.config.chart.dropShadow.blur

    if (w.config.plotOptions.radialBar.size !== undefined) {
      size = w.config.plotOptions.radialBar.size
    }

    let colorArr = w.globals.fill.colors

    let lineColorArr = w.globals.stroke.colors !== undefined
      ? w.globals.stroke.colors
      : w.globals.colors

    if (w.config.plotOptions.radialBar.track.show) {
      let elTracks = this.drawTracks({
        size,
        centerX,
        centerY,
        colorArr,
        lineColorArr,
        series
      })
      elSeries.add(elTracks)
    }

    let elG = this.drawArcs({
      size,
      centerX,
      centerY,
      colorArr,
      lineColorArr,
      series
    })

    elSeries.add(elG.g)

    if (w.config.plotOptions.radialBar.hollow.position === 'front') {
      elG.g.add(elG.elHollow)
      elG.g.add(elG.dataLabels)
    }

    ret.add(elSeries)

    return ret
  }

  drawTracks (opts) {
    let w = this.w
    const graphics = new Graphics(this.ctx)

    let g = graphics.group()

    let filters = new Filters(this.ctx)
    let fill = new Fill(this.ctx)

    let strokeWidth =
      opts.size *
        (100 - parseInt(w.config.plotOptions.radialBar.hollow.size)) /
        100 /
        (opts.series.length + 1) -
      this.margin
    opts.size = opts.size - strokeWidth / 2

    for (let i = 0; i < opts.series.length; i++) {
      let elRadialBarTrack = graphics.group({
        class: 'apexcharts-radialbar-track apexcharts-track'
      })
      g.add(elRadialBarTrack)

      elRadialBarTrack.attr({
        id: 'apexcharts-track-' + i,
        'rel': i + 1
      })

      opts.size = opts.size - strokeWidth - this.margin

      const trackConfig = w.config.plotOptions.radialBar.track
      let pathFill = fill.fillPath(elRadialBarTrack, {
        seriesNumber: 0,
        size: opts.size,
        fillColors: trackConfig.background,
        solid: true
      })

      let startAngle = this.trackStartAngle
      let endAngle = this.trackEndAngle

      if (Math.abs(endAngle) + Math.abs(startAngle) >= 360) endAngle = 360 - Math.abs(this.startAngle) - 0.1

      let elPath = graphics.drawPath({
        d: '',
        stroke: pathFill,
        strokeWidth: strokeWidth *
        parseInt(trackConfig.strokeWidth) /
        100,
        fill: 'none',
        strokeOpacity: trackConfig.opacity,
        classes: 'apexcharts-radialbar-area'
      })

      if (trackConfig.dropShadow.enabled) {
        const shadow = trackConfig.dropShadow
        filters.dropShadow(elPath, shadow)
      }

      elRadialBarTrack.add(elPath)

      elPath.attr('id', 'apexcharts-radialbarTrack-' + i)

      let pie = new Pie(this.ctx)
      pie.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: 0,
        dur: 0,
        easing: w.globals.easing
      })
    }

    return g
  }

  drawArcs (opts) {
    let w = this.w

    let self = this
    // size, donutSize, centerX, centerY, colorArr, lineColorArr, sectorAngleArr, series

    let graphics = new Graphics(this.ctx)
    let fill = new Fill(this.ctx)
    let filters = new Filters(this.ctx)
    let g = graphics.group()

    let strokeWidth =
      opts.size *
        (100 - parseInt(w.config.plotOptions.radialBar.hollow.size)) /
        100 /
        (opts.series.length + 1) - this.margin
    opts.size = opts.size - strokeWidth / 2

    let hollowFillImg = w.config.plotOptions.radialBar.hollow.image
    let hollowFillID = w.config.plotOptions.radialBar.hollow.background
    let hollowSize =
      opts.size -
      strokeWidth * opts.series.length -
      this.margin * opts.series.length -
      strokeWidth *
        parseInt(w.config.plotOptions.radialBar.track.strokeWidth) /
        100 /
        2

    let randID = (Math.random() + 1).toString(36).substring(4)
    let hollowRadius = hollowSize - w.config.plotOptions.radialBar.hollow.margin

    if (w.config.plotOptions.radialBar.hollow.image !== undefined) {
      if (w.config.plotOptions.radialBar.hollow.imageClipped) {
        fill.clippedImgArea({
          width: hollowSize,
          height: hollowSize,
          image: hollowFillImg,
          patternID: `pattern${w.globals.cuid}${randID}`
        })
        hollowFillID = `url(#pattern${w.globals.cuid}${randID})`
      } else {
        const imgWidth = w.config.plotOptions.radialBar.hollow.imageWidth
        const imgHeight = w.config.plotOptions.radialBar.hollow.imageHeight
        if (imgWidth === undefined && imgHeight === undefined) {
          let image = w.globals.dom.Paper.image(hollowFillImg).loaded(function (loader) {
            this.move(
              opts.centerX - loader.width / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetX,
              opts.centerY - loader.height / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetY
            )
          })
          g.add(image)
        } else {
          let image = w.globals.dom.Paper.image(hollowFillImg).loaded(function (loader) {
            this.move(
              opts.centerX - imgWidth / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetX,
              opts.centerY - imgHeight / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetY
            )
            this.size(imgWidth, imgHeight)
          })
          g.add(image)
        }
      }
    }

    let elHollow = this.drawHollow({
      size: hollowRadius,
      centerX: opts.centerX,
      centerY: opts.centerY,
      fill: hollowFillID
    })

    if (w.config.plotOptions.radialBar.hollow.dropShadow.enabled) {
      const shadow = w.config.plotOptions.radialBar.hollow.dropShadow
      filters.dropShadow(elHollow, shadow)
    }

    let shown = 1
    if (w.config.plotOptions.radialBar.dataLabels.showOn === 'hover' || w.globals.series.length > 1) {
      shown = 0
    }

    let dataLabels = this.renderDataLabels({
      hollowSize,
      centerX: opts.centerX,
      centerY: opts.centerY,
      opacity: shown
    })

    if (w.config.plotOptions.radialBar.hollow.position === 'back') {
      g.add(elHollow)
      g.add(dataLabels)
    }

    let reverseLoop = false
    if (w.config.plotOptions.radialBar.inverseOrder) {
      reverseLoop = true
    }

    for (let i = (reverseLoop ? opts.series.length - 1 : 0); (reverseLoop ? i >= 0 : i < opts.series.length) ; (reverseLoop ? i-- : i++)) {
      let elRadialBarArc = graphics.group({
        class: 'apexcharts-radial-series apexcharts-series'
      })
      g.add(elRadialBarArc)

      elRadialBarArc.attr({
        id: 'apexcharts-series-' + i,
        'rel': i + 1
      })

      opts.size = opts.size - strokeWidth - this.margin

      let pathFill = fill.fillPath(elRadialBarArc, {
        seriesNumber: i,
        size: opts.size
      })

      let startAngle = this.startAngle
      let prevStartAngle

      const totalAngle = Math.abs(w.config.plotOptions.radialBar.endAngle - w.config.plotOptions.radialBar.startAngle)
      let endAngle = Math.round(totalAngle * Utils.negToZero(opts.series[i]) / 100) + this.startAngle

      let prevEndAngle
      if (w.globals.dataChanged) {
        prevStartAngle = this.startAngle
        prevEndAngle = Math.round(totalAngle * Utils.negToZero(w.globals.previousPaths[i]) / 100) + prevStartAngle
      }

      const currFullAngle = Math.abs(endAngle) + Math.abs(startAngle)
      if (currFullAngle >= 360) {
        endAngle = endAngle - 0.01
      }

      const prevFullAngle = Math.abs(prevEndAngle) + Math.abs(prevStartAngle)
      if (prevFullAngle >= 360) {
        prevEndAngle = prevEndAngle - 0.01
      }

      let angle = endAngle - startAngle

      let elPath = graphics.drawPath({
        d: '',
        stroke: pathFill,
        strokeWidth,
        fill: 'none',
        fillOpacity: w.config.fill.opacity,
        classes: 'apexcharts-radialbar-area',
        strokeDashArray: w.config.stroke.dashArray
      })

      Graphics.setAttrs(elPath.node, {
        'data:angle': angle,
        'data:value': opts.series[i]
      })

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        filters.dropShadow(elPath, shadow)
      }

      elPath.node.addEventListener(
        'mouseenter',
        graphics.pathMouseEnter.bind(this, elPath)
      )
      elPath.node.addEventListener(
        'mouseleave',
        graphics.pathMouseLeave.bind(this, elPath)
      )

      elPath.node.addEventListener(
        'mouseenter',
        self.dataLabelsMouseIn.bind(this, elPath.node)
      )
      elPath.node.addEventListener(
        'mouseleave',
        self.dataLabelsMouseout.bind(this, elPath.node)
      )

      elRadialBarArc.add(elPath)

      elPath.attr('id', 'apexcharts-radialArc-' + i)

      let pie = new Pie(this.ctx)

      let dur = 0
      if (pie.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = ((endAngle - startAngle) / 360) *
              w.config.chart.animations.speed

        this.animDur = dur / (opts.series.length * 1.2) + this.animDur
        this.animBeginArr.push(this.animDur)
      }

      if (w.globals.dataChanged) {
        dur =
            ((endAngle - startAngle) / 360) *
            w.config.chart.animations.dynamicAnimation.speed

        this.animDur = dur / (opts.series.length * 1.2) + this.animDur
        this.animBeginArr.push(this.animDur)
      }

      pie.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        prevEndAngle,
        prevStartAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: this.animBeginArr,
        dur: dur,
        easing: w.globals.easing
      })
    }

    return {
      g, elHollow, dataLabels
    }
  }

  drawHollow (opts) {
    const graphics = new Graphics(this.ctx)

    let circle = graphics.drawCircle(opts.size * 2)

    circle.attr({
      class: 'apexcharts-radialbar-hollow',
      cx: opts.centerX,
      cy: opts.centerY,
      r: opts.size,
      fill: opts.fill
    })

    return circle
  }

  dataLabelsMouseIn (el) {
    let w = this.w

    let val = el.getAttribute('data:value')
    let labelColor
    let name = w.globals.seriesNames[parseInt(el.parentNode.getAttribute('rel')) - 1]

    let elLabel = w.globals.dom.baseEl.querySelector(
      '.apexcharts-datalabel-label'
    )
    let elValue = w.globals.dom.baseEl.querySelector(
      '.apexcharts-datalabel-value'
    )

    let lbFormatter = w.config.plotOptions.radialBar.dataLabels.value.formatter
    val = lbFormatter(val)

    if (elLabel !== null) {
      elLabel.textContent = name
    }

    if (elValue !== null) {
      elValue.textContent = val
    }

    if (w.config.plotOptions.radialBar.dataLabels.name.color === undefined) {
      labelColor =
        w.globals.colors[parseInt(el.parentNode.getAttribute('rel')) - 1]
    } else {
      labelColor = w.config.plotOptions.radialBar.dataLabels.name.color
    }

    let dataLabelsGroup = w.globals.dom.baseEl.querySelector(
      '.apexcharts-datalabels-group'
    )
    if (dataLabelsGroup !== null) {
      dataLabelsGroup.style.opacity = 1
    }
    if (elLabel !== null) {
      elLabel.style.fill = labelColor
    }
  }

  dataLabelsMouseout (el) {
    let w = this.w
    let dataLabelsGroup = w.globals.dom.baseEl.querySelector(
      '.apexcharts-datalabels-group'
    )
    if (
      w.config.plotOptions.radialBar.dataLabels.showOn !== 'always' ||
      w.globals.series.length > 1
    ) {
      if (dataLabelsGroup !== null) {
        dataLabelsGroup.style.opacity = 0
      }
    }
  }

  renderDataLabels (opts) {
    let w = this.w
    const graphics = new Graphics(this.ctx)

    let g = graphics.group({
      class: 'apexcharts-datalabels-group'
    })

    g.node.style.opacity = opts.opacity

    let x = opts.centerX
    let y = opts.centerY

    let labelColor, valueColor

    if (w.config.plotOptions.radialBar.dataLabels.name.color === undefined) {
      labelColor = w.globals.colors[0]
    } else {
      labelColor = w.config.plotOptions.radialBar.dataLabels.name.color
    }

    if (w.config.plotOptions.radialBar.dataLabels.value.color === undefined) {
      valueColor = w.config.chart.foreColor
    } else {
      valueColor = w.config.plotOptions.radialBar.dataLabels.value.color
    }

    let lbFormatter = w.config.plotOptions.radialBar.dataLabels.value.formatter
    let val = lbFormatter(w.globals.series[0])

    if (w.config.plotOptions.radialBar.dataLabels.name.show) {
      let elLabel = graphics.drawText({
        x: x,
        y: y + parseInt(w.config.plotOptions.radialBar.dataLabels.name.offsetY),
        text: w.globals.seriesNames[0],
        textAnchor: 'middle',
        foreColor: labelColor,
        fontSize: w.config.plotOptions.radialBar.dataLabels.name.fontSize
      })
      elLabel.node.classList.add('apexcharts-datalabel-label')
      g.add(elLabel)
    }

    if (w.config.plotOptions.radialBar.dataLabels.value.show) {
      let valOffset = w.config.plotOptions.radialBar.dataLabels.name.show ? parseInt(w.config.plotOptions.radialBar.dataLabels.value.offsetY) + 16 : (w.config.plotOptions.radialBar.dataLabels.value.offsetY)

      let elValue = graphics.drawText({
        x: x,
        y: y + valOffset,
        text: val,
        textAnchor: 'middle',
        foreColor: valueColor,
        fontSize: w.config.plotOptions.radialBar.dataLabels.value.fontSize
      })
      elValue.node.classList.add('apexcharts-datalabel-value')
      g.add(elValue)
    }

    return g
  }
}

export default Radial
