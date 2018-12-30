import Graphics from '../modules/Graphics'
import Markers from '../modules/Markers'

/**
 * ApexCharts Radar Class for Spider/Radar Charts.
 * @module Radar
 **/

class Radar {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.chartType = this.w.config.chart.type

    this.initialAnim = this.w.config.chart.animations.enabled
    this.dynamicAnim = this.initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled

    this.animDur = 0

    const w = this.w

    this.lineColorArr = w.globals.stroke.colors !== undefined
      ? w.globals.stroke.colors
      : w.globals.colors

    this.defaultSize = w.globals.svgHeight < w.globals.svgWidth ? w.globals.svgHeight - 35 : w.globals.gridWidth

    this.centerY = this.defaultSize / 2
    this.centerX = w.globals.gridWidth / 2

    this.maxValue = this.w.globals.maxY

    this.size =
      this.defaultSize / 2.05 -
      w.config.stroke.width -
      w.config.chart.dropShadow.blur

    if (w.config.plotOptions.radar.size !== undefined) {
      this.size = w.config.plotOptions.radar.size
    }

    this.dataRadiusOfPercent = []
    this.dataRadius = []
    this.angleArr = []

    this.prevSectorAngleArr = [] // for dynamic animations
  }

  draw (series) {
    let w = this.w
    const graphics = new Graphics(this.ctx)

    this.dataPointsLen = series[w.globals.maxValsInArrayIndex].length
    this.disAngle = Math.PI * 2 / this.dataPointsLen

    let scaleSize = w.config.plotOptions.radar.customScale

    let halfW = w.globals.gridWidth / 2
    let halfH = w.globals.gridHeight / 2
    let translateX = halfW - w.globals.gridWidth / 2 * scaleSize
    let translateY = halfH - w.globals.gridHeight / 2 * scaleSize

    let ret = graphics.group({
      class: 'apexcharts-radar'
    })

    ret.attr({
      'data:innerTranslateX': translateX,
      'data:innerTranslateY': translateY - 25
    })

    let dataPointsPos = []
    let elPointsMain = null

    series.forEach((s, i) => {
      // el to which series will be drawn
      let elSeries = graphics.group()

      elSeries.attr({
        'transform': `translate(${translateX}, ${translateY - 5}) scale(${scaleSize})`,
        'rel': i + 1,
        'data:realIndex': i
      })

      this.dataRadiusOfPercent[i] = []
      this.dataRadius[i] = []
      this.angleArr[i] = []

      s.forEach((dv, j) => {
        this.dataRadiusOfPercent[i][j] = dv / this.maxValue
        this.dataRadius[i][j] = this.dataRadiusOfPercent[i][j] * this.size
        this.angleArr[i][j] = j * this.disAngle
      })

      dataPointsPos = this.getDataPointsPos(this.dataRadius[i], this.angleArr[i])
      const paths = this.createPaths(dataPointsPos)

      for (let p = 0; p < paths.linePaths.length; p++) {
        let renderedPath = graphics.renderPaths({
          i,
          realIndex: i,
          animationDelay: i,
          initialSpeed: w.config.chart.animations.speed,
          dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
          className: `apexcharts-radar`,
          id: `apexcharts-radar`,
          pathFrom: paths.linePaths[p],
          pathTo: paths.linePaths[p],
          stroke: w.globals.stroke.colors[i],
          strokeWidth: Array.isArray(w.config.stroke.width) ? w.config.stroke.width[i] : w.config.stroke.width,
          strokeLineCap: w.config.stroke.lineCap,
          fill: 'none',
          shouldClipToGrid: false
        })

        elSeries.add(renderedPath)
      }

      // points
      elPointsMain = graphics.group({
        class: 'apexcharts-series-markers-wrap'
      })

      s.forEach((sj, j) => {
        let markers = new Markers(this.ctx)

        let elPointsWrap = markers.plotChartMarkers(dataPointsPos[i], i, j)

        if (elPointsWrap !== null) {
          elPointsMain.add(elPointsWrap)
        }

        elSeries.add(elPointsMain)
      })

      ret.add(elSeries)
    })

    return ret
  }

  createPaths (pos) {
    let graphics = new Graphics(this.ctx)

    let linePaths = []
    let areaPaths = []

    if (pos.length) {
      let linePath = graphics.move(pos[0].x, pos[0].y)
      let areaPath = graphics.move(pos[0].x, pos[0].y)

      pos.forEach((p, i) => {
        linePath += graphics.line(p.x, p.y)
        areaPath += graphics.line(p.x, p.y)
        if (i === pos.length - 1) {
          linePath += 'Z'
          areaPath += 'Z'
        }

        linePaths.push(linePath)
        areaPaths.push(areaPath)
      })

      return {
        linePaths,
        areaPaths
      }
    }
  }

  getDataPointsPos (dataRadiusArr, angleArr) {
    const w = this.w
    dataRadiusArr = dataRadiusArr || []
    angleArr = angleArr || []
    var dataPointsPosArray = []
    for (var j = 0; j < w.globals.dataPoints; j++) {
      var curPointPos = {}
      curPointPos.x = dataRadiusArr[j] * Math.sin(angleArr[j])
      curPointPos.y = -dataRadiusArr[j] * Math.cos(angleArr[j])
      dataPointsPosArray.push(curPointPos)
    }
    return dataPointsPosArray
  }

  getPolygonPos (origin) {
    var dotsArray = []
    var angle = Math.PI * 2 / this.dataPointsLen
    for (let i = 0; i < this.dataPointsLen; i++) {
      var curPos = {}
      curPos.x = this.size * Math.sin(i * angle) + origin[0]
      curPos.y = -this.size * Math.cos(i * angle) + origin[1]
      dotsArray.push(curPos)
    }
    return dotsArray
  }
}

export default Radar
