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
  }

  draw (series) {
    let w = this.w
    const graphics = new Graphics(this.ctx)
    const fill = new Fill(this.ctx)

    const allSeries = []

    this.dataPointsLen = series[w.globals.maxValsInArrayIndex].length
    this.disAngle = Math.PI * 2 / this.dataPointsLen

    let halfW = w.globals.gridWidth / 2
    let halfH = w.globals.gridHeight / 2
    let translateX = halfW
    let translateY = halfH

    let ret = graphics.group({
      class: 'apexcharts-radar-series',
      'data:innerTranslateX': translateX,
      'data:innerTranslateY': translateY - 25,
      transform: `translate(${translateX || 0}, ${translateY || 0})`
    })

    let dataPointsPos = []
    let elPointsMain = null

    series.forEach((s, i) => {
      // el to which series will be drawn
      let elSeries = graphics.group().attr({
        class: `apexcharts-series ${w.globals.seriesNames[i].toString().replace(/ /g, '-')}`,
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
      const paths = this.createPaths(dataPointsPos, {x: 0, y: 0})

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

      let pathFrom = null

      if (w.globals.previousPaths.length > 0) {
        pathFrom = this.getPathFrom(i)
      }

      for (let p = 0; p < paths.linePathsTo.length; p++) {
        let renderedLinePath = graphics.renderPaths({
          ...defaultRenderedPathOptions,
          pathFrom: pathFrom === null ? paths.linePathsFrom[p] : pathFrom,
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
          pathFrom: pathFrom === null ? paths.areaPathsFrom[p] : pathFrom,
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

      allSeries.push(elSeries)
    })

    this.drawPolygons({ parent: ret })

    const dataLabels = this.drawLabels()
    ret.add(dataLabels)

    allSeries.forEach((elS) => {
      ret.add(elS)
    })

    return ret
  }

  drawPolygons (opts) {
    const w = this.w
    const { parent } = opts
    let graphics = new Graphics(this.ctx)

    const layers = w.globals.yAxisScale[0].result.length

    let radiusSizes = []
    let layerDis = this.size / layers
    for (var i = 0; i < layers; i++) {
      radiusSizes[i] = layerDis * (i + 1)
    }
    radiusSizes.reverse()

    let polygonStrings = []

    radiusSizes.forEach((radiusSize) => {
      const polygon = this.getPolygonPos(radiusSize)
      let string = ''

      polygon.forEach((p) => {
        string += p.x + ',' + p.y + ' '
      })

      polygonStrings.push(string)
    })

    polygonStrings.forEach((p) => {
      const polygon = graphics.drawPolygon(p)
      parent.add(polygon)
    })
  }

  drawYAxis () {

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

    let polygonPos = this.getPolygonPos(this.size)

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
    let linePathsFrom = []
    let areaPathsTo = []
    let areaPathsFrom = []

    if (pos.length) {
      linePathsFrom = [graphics.move(origin.x, origin.y)]
      areaPathsFrom = [graphics.move(origin.x, origin.y)]

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

  getPathFrom (realIndex) {
    let w = this.w
    let pathFrom = null
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      let gpp = w.globals.previousPaths[pp]

      if (
        gpp.paths.length > 0 &&
        parseInt(gpp.realIndex) === parseInt(realIndex)
      ) {
        if (typeof w.globals.previousPaths[pp].paths[0] !== 'undefined') {
          pathFrom = w.globals.previousPaths[pp].paths[0].d
        }
      }
    }
    return pathFrom
  }

  getDataPointsPos (dataRadiusArr, angleArr, dataPointsLen = this.dataPointsLen) {
    dataRadiusArr = dataRadiusArr || []
    angleArr = angleArr || []
    var dataPointsPosArray = []
    for (var j = 0; j < dataPointsLen; j++) {
      var curPointPos = {}
      curPointPos.x = dataRadiusArr[j] * Math.sin(angleArr[j])
      curPointPos.y = -dataRadiusArr[j] * Math.cos(angleArr[j])
      dataPointsPosArray.push(curPointPos)
    }
    return dataPointsPosArray
  }

  getPolygonPos (size) {
    var dotsArray = []
    var angle = Math.PI * 2 / this.dataPointsLen
    for (let i = 0; i < this.dataPointsLen; i++) {
      var curPos = {}
      curPos.x = size * Math.sin(i * angle)
      curPos.y = -size * Math.cos(i * angle)
      dotsArray.push(curPos)
    }
    return dotsArray
  }
}

export default Radar
