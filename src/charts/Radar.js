import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Markers from '../modules/Markers'
import DataLabels from '../modules/DataLabels'

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

    this.maxValue = this.w.globals.maxY * 1.25

    this.size =
      this.defaultSize / 2.5 -
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
    const fill = new Fill(this.ctx)

    this.dataPointsLen = series[w.globals.maxValsInArrayIndex].length
    this.disAngle = Math.PI * 2 / this.dataPointsLen

    let halfW = w.globals.gridWidth / 2
    let halfH = w.globals.gridHeight / 2
    let translateX = halfW
    let translateY = halfH

    let ret = graphics.group({
      class: 'apexcharts-radar',
      'data:innerTranslateX': translateX,
      'data:innerTranslateY': translateY - 25,
      transform: `translate(${translateX || 0}, ${translateY || 0})`
    })

    let dataPointsPos = []
    let elPointsMain = null

    let dataRadiusOfPercentOrigin = 1 / this.maxValue
    let dataRadiusOrigin = dataRadiusOfPercentOrigin * this.size
    let angleArrOrigin = this.disAngle
    let centerPos = this.getDataPointsPos([dataRadiusOrigin], [angleArrOrigin])[0]

    series.forEach((s, i) => {
      // el to which series will be drawn
      let elSeries = graphics.group().attr({
        class: `apexcharts-series apexcharts-radar-series ${w.globals.seriesNames[i].toString().replace(/ /g, '-')}`,
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
      const paths = this.createPaths(dataPointsPos, centerPos)

      const defaultRenderedPathOptions = {
        i,
        realIndex: i,
        animationDelay: i,
        initialSpeed: w.config.chart.animations.speed,
        dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
        className: `apexcharts-radar`,
        id: `apexcharts-radar`,
        shouldClipToGrid: false,
        bindEventsOnPaths: false,
        stroke: w.globals.stroke.colors[i],
        strokeLineCap: w.config.stroke.lineCap
      }

      for (let p = 0; p < paths.linePathsTo.length; p++) {
        let renderedLinePath = graphics.renderPaths({
          ...defaultRenderedPathOptions,
          pathFrom: paths.linePathsFrom[p],
          pathTo: paths.linePathsTo[p],
          strokeWidth: Array.isArray(w.config.stroke.width) ? w.config.stroke.width[i] : w.config.stroke.width,
          fill: 'none'
        })

        elSeries.add(renderedLinePath)

        let pathFill = fill.fillPath(elSeries, {
          seriesNumber: i
        })

        let renderedAreaPath = graphics.renderPaths({
          ...defaultRenderedPathOptions,
          pathFrom: paths.areaPathsFrom[p],
          pathTo: paths.areaPathsTo[p],
          strokeWidth: 0,
          fill: pathFill
        })

        elSeries.add(renderedAreaPath)
      }

      // points
      elPointsMain = graphics.group({
        class: 'apexcharts-series-markers-wrap hidden'
      })

      w.globals.delayedElements.push({el: elPointsMain.node, index: i})

      s.forEach((sj, j) => {
        let markers = new Markers(this.ctx)

        let opts = markers.getMarkerConfig('apexcharts-marker', i)
        let point = graphics.drawMarker(
          dataPointsPos[j].x,
          dataPointsPos[j].y,
          opts
        )

        let elPointsWrap = graphics.group({
          class: 'apexcharts-series-markers'
        })

        if (elPointsWrap) {
          elPointsWrap.add(point)
        }

        elPointsMain.add(elPointsWrap)

        elSeries.add(elPointsMain)
      })

      ret.add(elSeries)
    })

    const dataLabels = this.drawLabels()
    ret.add(dataLabels)

    return ret
  }

  drawLabels () {
    const w = this.w
    const graphics = new Graphics(this.ctx)

    let limit = 10

    let offsetX = 0
    let offsetY = 0

    let textAnchor = 'start'

    const dataLabelsConfig = w.config.dataLabels
    let elDataLabelsWrap = graphics.group({
      class: 'apexcharts-datalabels'
    })

    let polygonPos = this.getPolygonPos()

    w.globals.labels.forEach((label, i) => {
      let formatter = dataLabelsConfig.formatter
      let dataLabels = new DataLabels(this.ctx)

      if (polygonPos[i]) {
        if (Math.abs(polygonPos[i].x) >= limit) {
          if (polygonPos[i].x > 0) {
            textAnchor = 'start'
            offsetX += 10
          } else if (polygonPos[i].x < 0) {
            textAnchor = 'end'
            offsetX -= 10
          }
        } else {
          textAnchor = 'middle'
        }
        if (Math.abs(polygonPos[i].y) >= this.size - limit) {
          if (polygonPos[i].y < 0) {
            offsetY -= 10
          } else if (polygonPos[i].y > 0) {
            offsetY += 20
          }
        }

        let text = formatter(label, {
          seriesIndex: -1,
          dataPointIndex: i,
          w
        })

        dataLabels.plotDataLabelsText({
          x: polygonPos[i].x + offsetX,
          y: polygonPos[i].y + offsetY,
          text,
          textAnchor,
          i: i,
          j: i,
          parent: elDataLabelsWrap,
          dataLabelsConfig,
          offsetCorrection: false
        })
      }
    })

    return elDataLabelsWrap
  }

  createPaths (pos, origin) {
    let graphics = new Graphics(this.ctx)

    let linePathsTo = []
    let linePathsFrom = [graphics.move(origin.x, origin.y)]
    let areaPathsTo = []
    let areaPathsFrom = [graphics.move(origin.x, origin.y)]

    if (pos.length) {
      let linePathTo = graphics.move(pos[0].x, pos[0].y)
      let areaPathTo = graphics.move(pos[0].x, pos[0].y)

      pos.forEach((p, i) => {
        linePathTo += graphics.line(p.x, p.y)
        areaPathTo += graphics.line(p.x, p.y)
        if (i === pos.length - 1) {
          linePathTo += 'Z'
          areaPathTo += 'Z'
        }
      })

      linePathsTo.push(linePathTo)
      areaPathsTo.push(areaPathTo)
    }

    return {
      linePathsFrom,
      linePathsTo,
      areaPathsFrom,
      areaPathsTo
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

  getPolygonPos () {
    var dotsArray = []
    var angle = Math.PI * 2 / this.dataPointsLen
    for (let i = 0; i < this.dataPointsLen; i++) {
      var curPos = {}
      curPos.x = this.size * Math.sin(i * angle)
      curPos.y = -this.size * Math.cos(i * angle)
      dotsArray.push(curPos)
    }
    return dotsArray
  }
}

export default Radar
