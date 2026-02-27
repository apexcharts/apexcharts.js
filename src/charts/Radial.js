import Pie from './Pie'
import Utils from '../utils/Utils'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Filters from '../modules/Filters'
import Series from '../modules/Series'

/**
 * ApexCharts Radial Class for drawing Circle / Semi Circle Charts.
 * @module Radial
 **/

class Radial extends Pie {
  constructor(w, ctx) {
    super(w, ctx)

    this.ctx = ctx
    this.w = w
    this.animBeginArr = [0]
    this.animDur = 0

    this.startAngle = w.config.plotOptions.radialBar.startAngle
    this.endAngle = w.config.plotOptions.radialBar.endAngle

    this.totalAngle = Math.abs(
      w.config.plotOptions.radialBar.endAngle -
        w.config.plotOptions.radialBar.startAngle
    )

    this.trackStartAngle = w.config.plotOptions.radialBar.track.startAngle
    this.trackEndAngle = w.config.plotOptions.radialBar.track.endAngle

    this.barLabels = this.w.config.plotOptions.radialBar.barLabels

    this.donutDataLabels = this.w.config.plotOptions.radialBar.dataLabels
    this.radialDataLabels = this.donutDataLabels // make a copy for easy reference

    if (!this.trackStartAngle) this.trackStartAngle = this.startAngle
    if (!this.trackEndAngle) this.trackEndAngle = this.endAngle

    if (this.endAngle === 360) this.endAngle = 359.99

    this.margin = parseInt(w.config.plotOptions.radialBar.track.margin, 10)
    this.onBarLabelClick = this.onBarLabelClick.bind(this)
  }

  draw(series) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const ret = graphics.group({
      class: 'apexcharts-radialbar',
    })

    if (w.globals.noData) return ret

    const elSeries = graphics.group()

    const centerY = this.defaultSize / 2
    const centerX = w.layout.gridWidth / 2

    let size = this.defaultSize / 2.05
    if (!w.config.chart.sparkline.enabled) {
      size = size - w.config.stroke.width - w.config.chart.dropShadow.blur
    }
    const colorArr = w.globals.fill.colors

    if (w.config.plotOptions.radialBar.track.show) {
      const elTracks = this.drawTracks({
        size,
        centerX,
        centerY,
        colorArr,
        series,
      })
      elSeries.add(elTracks)
    }

    const elG = this.drawArcs({
      size,
      centerX,
      centerY,
      colorArr,
      series,
    })

    let totalAngle = 360

    if (w.config.plotOptions.radialBar.startAngle < 0) {
      totalAngle = this.totalAngle
    }

    const angleRatio = (360 - totalAngle) / 360
    w.globals.radialSize = size - size * angleRatio

    if (this.radialDataLabels.value.show) {
      const offset = Math.max(
        this.radialDataLabels.value.offsetY,
        this.radialDataLabels.name.offsetY
      )
      w.globals.radialSize += offset * angleRatio
    }

    elSeries.add(elG.g)

    if (w.config.plotOptions.radialBar.hollow.position === 'front') {
      elG.g.add(elG.elHollow)
      if (elG.dataLabels) {
        elG.g.add(elG.dataLabels)
      }
    }

    ret.add(elSeries)

    return ret
  }

  drawTracks(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const g = graphics.group({
      class: 'apexcharts-tracks',
    })

    const filters = new Filters(this.w)
    const fill = new Fill(this.w)

    const strokeWidth = this.getStrokeWidth(opts)

    opts.size = opts.size - strokeWidth / 2

    for (let i = 0; i < opts.series.length; i++) {
      const elRadialBarTrack = graphics.group({
        class: 'apexcharts-radialbar-track apexcharts-track',
      })
      g.add(elRadialBarTrack)

      elRadialBarTrack.attr({
        rel: i + 1,
      })

      opts.size = opts.size - strokeWidth - this.margin

      const trackConfig = w.config.plotOptions.radialBar.track
      const pathFill = fill.fillPath({
        seriesNumber: 0,
        size: opts.size,
        fillColors: Array.isArray(trackConfig.background)
          ? trackConfig.background[i]
          : trackConfig.background,
        solid: true,
      })

      const startAngle = this.trackStartAngle
      let endAngle = this.trackEndAngle

      if (Math.abs(endAngle) + Math.abs(startAngle) >= 360)
        endAngle = 360 - Math.abs(this.startAngle) - 0.1

      const elPath = graphics.drawPath({
        d: '',
        stroke: pathFill,
        strokeWidth:
          (strokeWidth * parseInt(trackConfig.strokeWidth, 10)) / 100,
        fill: 'none',
        strokeOpacity: trackConfig.opacity,
        classes: 'apexcharts-radialbar-area',
      })

      if (trackConfig.dropShadow.enabled) {
        const shadow = trackConfig.dropShadow
        filters.dropShadow(elPath, shadow)
      }

      elRadialBarTrack.add(elPath)

      elPath.attr('id', 'apexcharts-radialbarTrack-' + i)

      this.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: 0,
        dur: 0,
        isTrack: true,
      })
    }

    return g
  }

  drawArcs(opts) {
    const w = this.w
    // size, donutSize, centerX, centerY, colorArr, lineColorArr, sectorAngleArr, series

    const graphics = new Graphics(this.w)
    const fill = new Fill(this.w)
    const filters = new Filters(this.w)
    const g = graphics.group()

    const strokeWidth = this.getStrokeWidth(opts)
    opts.size = opts.size - strokeWidth / 2

    let hollowFillID = w.config.plotOptions.radialBar.hollow.background
    const hollowSize =
      opts.size -
      strokeWidth * opts.series.length -
      this.margin * opts.series.length -
      (strokeWidth *
        parseInt(w.config.plotOptions.radialBar.track.strokeWidth, 10)) /
        100 /
        2

    const hollowRadius = hollowSize - w.config.plotOptions.radialBar.hollow.margin

    if (w.config.plotOptions.radialBar.hollow.image !== undefined) {
      hollowFillID = this.drawHollowImage(opts, g, hollowSize, hollowFillID)
    }

    const elHollow = this.drawHollow({
      size: hollowRadius,
      centerX: opts.centerX,
      centerY: opts.centerY,
      fill: hollowFillID ? hollowFillID : 'transparent',
    })

    if (w.config.plotOptions.radialBar.hollow.dropShadow.enabled) {
      const shadow = w.config.plotOptions.radialBar.hollow.dropShadow
      filters.dropShadow(elHollow, shadow)
    }

    let shown = 1
    if (!this.radialDataLabels.total.show && w.seriesData.series.length > 1) {
      shown = 0
    }

    let dataLabels = null

    if (this.radialDataLabels.show) {
      const dataLabelsGroup = w.dom.Paper.findOne(
        `.apexcharts-datalabels-group`
      )

      dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.radialDataLabels,
        {
          hollowSize,
          centerX: opts.centerX,
          centerY: opts.centerY,
          opacity: shown,
        }
      )
    }

    if (w.config.plotOptions.radialBar.hollow.position === 'back') {
      g.add(elHollow)
      if (dataLabels) {
        g.add(dataLabels)
      }
    }

    let reverseLoop = false
    if (w.config.plotOptions.radialBar.inverseOrder) {
      reverseLoop = true
    }

    for (
      let i = reverseLoop ? opts.series.length - 1 : 0;
      reverseLoop ? i >= 0 : i < opts.series.length;
      reverseLoop ? i-- : i++
    ) {
      const elRadialBarArc = graphics.group({
        class: `apexcharts-series apexcharts-radial-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
      })
      g.add(elRadialBarArc)

      elRadialBarArc.attr({
        rel: i + 1,
        'data:realIndex': i,
      })

      Series.addCollapsedClassToSeries(this.w, elRadialBarArc, i)

      opts.size = opts.size - strokeWidth - this.margin

      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: opts.size,
        value: opts.series[i],
      })

      const startAngle = this.startAngle
      let prevStartAngle

      // if data exceeds 100, make it 100
      const dataValue =
        Utils.negToZero(opts.series[i] > 100 ? 100 : opts.series[i]) / 100

      let endAngle = Math.round(this.totalAngle * dataValue) + this.startAngle

      let prevEndAngle
      if (w.globals.dataChanged) {
        prevStartAngle = this.startAngle
        prevEndAngle =
          Math.round(
            (this.totalAngle * Utils.negToZero(w.globals.previousPaths[i])) /
              100
          ) + prevStartAngle
      }

      const currFullAngle = Math.abs(endAngle) + Math.abs(startAngle)
      if (currFullAngle > 360) {
        endAngle = endAngle - 0.01
      }

      const prevFullAngle = Math.abs(prevEndAngle) + Math.abs(prevStartAngle)
      if (prevFullAngle > 360) {
        prevEndAngle = prevEndAngle - 0.01
      }

      const angle = endAngle - startAngle

      const dashArray = Array.isArray(w.config.stroke.dashArray)
        ? w.config.stroke.dashArray[i]
        : w.config.stroke.dashArray

      const elPath = graphics.drawPath({
        d: '',
        stroke: pathFill,
        strokeWidth,
        fill: 'none',
        fillOpacity: w.config.fill.opacity,
        classes: 'apexcharts-radialbar-area apexcharts-radialbar-slice-' + i,
        strokeDashArray: dashArray,
      })

      const radialMidAngle = startAngle + angle / 2
      const radialArcCenter = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        opts.size,
        radialMidAngle
      )

      Graphics.setAttrs(elPath.node, {
        'data:angle': angle,
        'data:value': opts.series[i],
        'data:cx': radialArcCenter.x,
        'data:cy': radialArcCenter.y,
      })

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        filters.dropShadow(elPath, shadow, i)
      }
      filters.setSelectionFilter(elPath, 0, i)

      this.addListeners(elPath, this.radialDataLabels)

      elRadialBarArc.add(elPath)

      elPath.attr({
        index: 0,
        j: i,
      })

      if (this.barLabels.enabled) {
        const barStartCords = Utils.polarToCartesian(
          opts.centerX,
          opts.centerY,
          opts.size,
          startAngle
        )
        const text = this.barLabels.formatter(w.seriesData.seriesNames[i], {
          seriesIndex: i,
          w,
        })
        const classes = ['apexcharts-radialbar-label']
        if (!this.barLabels.onClick) {
          classes.push('apexcharts-no-click')
        }

        let textColor = this.barLabels.useSeriesColors
          ? w.globals.colors[i]
          : w.config.chart.foreColor

        if (!textColor) {
          textColor = w.config.chart.foreColor
        }

        const x = barStartCords.x + this.barLabels.offsetX
        const y = barStartCords.y + this.barLabels.offsetY
        const elText = graphics.drawText({
          x,
          y,
          text,
          textAnchor: 'end',
          dominantBaseline: 'middle',
          fontFamily: this.barLabels.fontFamily,
          fontWeight: this.barLabels.fontWeight,
          fontSize: this.barLabels.fontSize,
          foreColor: textColor,
          cssClass: classes.join(' '),
        })

        elText.on('click', this.onBarLabelClick)

        elText.attr({
          rel: i + 1,
        })

        if (startAngle !== 0) {
          elText.attr({
            'transform-origin': `${x} ${y}`,
            transform: `rotate(${startAngle} 0 0)`,
          })
        }

        elRadialBarArc.add(elText)
      }

      let dur = 0
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = w.config.chart.animations.speed
      }

      if (w.globals.dataChanged) {
        dur = w.config.chart.animations.dynamicAnimation.speed
      }
      this.animDur = dur / (opts.series.length * 1.2) + this.animDur
      this.animBeginArr.push(this.animDur)

      this.animatePaths(elPath, {
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
        dur,
        shouldSetPrevPaths: true,
      })
    }

    return {
      g,
      elHollow,
      dataLabels,
    }
  }

  drawHollow(opts) {
    const graphics = new Graphics(this.w)

    const circle = graphics.drawCircle(opts.size * 2)

    circle.attr({
      class: 'apexcharts-radialbar-hollow',
      cx: opts.centerX,
      cy: opts.centerY,
      r: opts.size,
      fill: opts.fill,
    })

    return circle
  }

  drawHollowImage(opts, g, hollowSize, hollowFillID) {
    const w = this.w
    const fill = new Fill(this.w)

    const randID = Utils.randomId()
    const hollowFillImg = w.config.plotOptions.radialBar.hollow.image

    if (w.config.plotOptions.radialBar.hollow.imageClipped) {
      fill.clippedImgArea({
        width: hollowSize,
        height: hollowSize,
        image: hollowFillImg,
        patternID: `pattern${w.globals.cuid}${randID}`,
      })
      hollowFillID = `url(#pattern${w.globals.cuid}${randID})`
    } else {
      const imgWidth = w.config.plotOptions.radialBar.hollow.imageWidth
      const imgHeight = w.config.plotOptions.radialBar.hollow.imageHeight
      if (imgWidth === undefined && imgHeight === undefined) {
        const image = w.dom.Paper.image(hollowFillImg, function (loader) {
          this.move(
            opts.centerX -
              loader.width / 2 +
              w.config.plotOptions.radialBar.hollow.imageOffsetX,
            opts.centerY -
              loader.height / 2 +
              w.config.plotOptions.radialBar.hollow.imageOffsetY
          )
        })
        g.add(image)
      } else {
        const image = w.dom.Paper.image(hollowFillImg, function () {
          this.move(
            opts.centerX -
              imgWidth / 2 +
              w.config.plotOptions.radialBar.hollow.imageOffsetX,
            opts.centerY -
              imgHeight / 2 +
              w.config.plotOptions.radialBar.hollow.imageOffsetY
          )
          this.size(imgWidth, imgHeight)
        })
        g.add(image)
      }
    }
    return hollowFillID
  }

  getStrokeWidth(opts) {
    const w = this.w
    return (
      (opts.size *
        (100 - parseInt(w.config.plotOptions.radialBar.hollow.size, 10))) /
        100 /
        (opts.series.length + 1) -
      this.margin
    )
  }

  onBarLabelClick(e) {
    const seriesIndex = parseInt(e.target.getAttribute('rel'), 10) - 1
    const legendClick = this.barLabels.onClick
    const w = this.w

    if (legendClick) {
      legendClick(w.seriesData.seriesNames[seriesIndex], { w, seriesIndex })
    }
  }
}

export default Radial
