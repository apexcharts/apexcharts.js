import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Markers from '../modules/Markers'
import DataLabels from '../modules/DataLabels'
import Filters from '../modules/Filters'
import Utils from '../utils/Utils'

/**
 * ApexCharts Radar Class for Spider/Radar Charts.
 * @module Radar
 **/

class Radar {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.chartType = this.w.config.chart.type

    this.initialAnim = this.w.config.chart.animations.enabled
    this.dynamicAnim =
      this.initialAnim &&
      this.w.config.chart.animations.dynamicAnimation.enabled

    this.animDur = 0

    const w = this.w
    this.graphics = new Graphics(this.ctx)

    this.lineColorArr =
      w.globals.stroke.colors !== undefined
        ? w.globals.stroke.colors
        : w.globals.colors

    this.defaultSize =
      w.globals.svgHeight < w.globals.svgWidth
        ? w.globals.svgHeight - w.globals.goldenPadding
        : w.globals.gridWidth

    this.maxValue = this.w.globals.maxY

    this.polygons = w.config.plotOptions.radar.polygons

    this.maxLabelWidth = 20

    const longestLabel = w.globals.labels.slice().sort(function(a, b) {
      return b.length - a.length
    })[0]
    const labelWidth = this.graphics.getTextRects(
      longestLabel,
      w.config.dataLabels.style.fontSize
    )

    this.size =
      this.defaultSize / 2.1 -
      w.config.stroke.width -
      w.config.chart.dropShadow.blur -
      labelWidth.width / 1.75

    if (w.config.plotOptions.radar.size !== undefined) {
      this.size = w.config.plotOptions.radar.size
    }

    this.dataRadiusOfPercent = []
    this.dataRadius = []
    this.angleArr = []

    this.yaxisLabelsTextsPos = []
  }

  draw(series) {
    let w = this.w
    const fill = new Fill(this.ctx)

    const allSeries = []

    if (series.length) {
      this.dataPointsLen = series[w.globals.maxValsInArrayIndex].length
    }
    this.disAngle = (Math.PI * 2) / this.dataPointsLen

    let halfW = w.globals.gridWidth / 2
    let halfH = w.globals.gridHeight / 2
    let translateX = halfW
    let translateY = halfH

    let ret = this.graphics.group({
      class: 'apexcharts-radar-series',
      'data:innerTranslateX': translateX,
      'data:innerTranslateY': translateY - 25,
      transform: `translate(${translateX || 0}, ${translateY || 0})`
    })

    let dataPointsPos = []
    let elPointsMain = null

    this.yaxisLabels = this.graphics.group({
      class: 'apexcharts-yaxis'
    })

    series.forEach((s, i) => {
      // el to which series will be drawn
      let elSeries = this.graphics.group().attr({
        class: `apexcharts-series`,
        seriesName: Utils.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
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

      dataPointsPos = this.getDataPointsPos(
        this.dataRadius[i],
        this.angleArr[i]
      )
      const paths = this.createPaths(dataPointsPos, {
        x: 0,
        y: 0
      })

      // points
      elPointsMain = this.graphics.group({
        class: 'apexcharts-series-markers-wrap hidden'
      })

      w.globals.delayedElements.push({
        el: elPointsMain.node,
        index: i
      })

      const defaultRenderedPathOptions = {
        i,
        realIndex: i,
        animationDelay: i,
        initialSpeed: w.config.chart.animations.speed,
        dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
        className: `apexcharts-radar`,
        shouldClipToGrid: false,
        bindEventsOnPaths: false,
        stroke: w.globals.stroke.colors[i],
        strokeLineCap: w.config.stroke.lineCap
      }

      let pathFrom = null

      if (w.globals.previousPaths.length > 0) {
        pathFrom = this.getPreviousPath(i)
      }

      for (let p = 0; p < paths.linePathsTo.length; p++) {
        let renderedLinePath = this.graphics.renderPaths({
          ...defaultRenderedPathOptions,
          pathFrom: pathFrom === null ? paths.linePathsFrom[p] : pathFrom,
          pathTo: paths.linePathsTo[p],
          strokeWidth: Array.isArray(w.config.stroke.width)
            ? w.config.stroke.width[i]
            : w.config.stroke.width,
          fill: 'none',
          drawShadow: false
        })

        elSeries.add(renderedLinePath)

        let pathFill = fill.fillPath({
          seriesNumber: i
        })

        let renderedAreaPath = this.graphics.renderPaths({
          ...defaultRenderedPathOptions,
          pathFrom: pathFrom === null ? paths.areaPathsFrom[p] : pathFrom,
          pathTo: paths.areaPathsTo[p],
          strokeWidth: 0,
          fill: pathFill,
          drawShadow: false
        })

        if (w.config.chart.dropShadow.enabled) {
          const filters = new Filters(this.ctx)

          const shadow = w.config.chart.dropShadow
          filters.dropShadow(
            renderedAreaPath,
            Object.assign({}, shadow, { noUserSpaceOnUse: true }),
            i
          )
        }

        elSeries.add(renderedAreaPath)
      }

      s.forEach((sj, j) => {
        let markers = new Markers(this.ctx)

        let opts = markers.getMarkerConfig('apexcharts-marker', i, j)

        let point = this.graphics.drawMarker(
          dataPointsPos[j].x,
          dataPointsPos[j].y,
          opts
        )

        point.attr('rel', j)
        point.attr('j', j)
        point.attr('index', i)
        point.node.setAttribute('default-marker-size', opts.pSize)

        let elPointsWrap = this.graphics.group({
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

    this.drawPolygons({
      parent: ret
    })

    if (w.config.dataLabels.enabled) {
      const dataLabels = this.drawLabels()
      ret.add(dataLabels)
    }

    ret.add(this.yaxisLabels)

    allSeries.forEach((elS) => {
      ret.add(elS)
    })

    return ret
  }

  drawPolygons(opts) {
    const w = this.w
    const { parent } = opts

    const yaxisTexts = w.globals.yAxisScale[0].result.reverse()
    const layers = yaxisTexts.length

    let radiusSizes = []
    let layerDis = this.size / (layers - 1)
    for (var i = 0; i < layers; i++) {
      radiusSizes[i] = layerDis * i
    }
    radiusSizes.reverse()

    let polygonStrings = []
    let lines = []

    radiusSizes.forEach((radiusSize, r) => {
      const polygon = this.getPolygonPos(radiusSize)
      let string = ''

      polygon.forEach((p, i) => {
        if (r === 0) {
          const line = this.graphics.drawLine(
            p.x,
            p.y,
            0,
            0,
            Array.isArray(this.polygons.connectorColors)
              ? this.polygons.connectorColors[i]
              : this.polygons.connectorColors
          )

          lines.push(line)
        }

        if (i === 0) {
          this.yaxisLabelsTextsPos.push({
            x: p.x,
            y: p.y
          })
        }

        string += p.x + ',' + p.y + ' '
      })

      polygonStrings.push(string)
    })

    polygonStrings.forEach((p, i) => {
      const strokeColors = this.polygons.strokeColors
      const polygon = this.graphics.drawPolygon(
        p,
        Array.isArray(strokeColors) ? strokeColors[i] : strokeColors,
        w.globals.radarPolygons.fill.colors[i]
      )
      parent.add(polygon)
    })

    lines.forEach((l) => {
      parent.add(l)
    })

    if (w.config.yaxis[0].show) {
      this.yaxisLabelsTextsPos.forEach((p, i) => {
        const yText = this.drawYAxisText(p.x, p.y, i, yaxisTexts[i])
        this.yaxisLabels.add(yText)
      })
    }
  }

  drawYAxisText(x, y, i, text) {
    const w = this.w

    const yaxisConfig = w.config.yaxis[0]
    const formatter = w.globals.yLabelFormatters[0]

    const yaxisLabel = this.graphics.drawText({
      x: x + yaxisConfig.labels.offsetX,
      y: y + yaxisConfig.labels.offsetY,
      text: formatter(text, i),
      textAnchor: 'middle',
      fontSize: yaxisConfig.labels.style.fontSize,
      fontFamily: yaxisConfig.labels.style.fontFamily,
      foreColor: yaxisConfig.labels.style.color
    })

    return yaxisLabel
  }

  drawLabels() {
    const w = this.w

    let limit = 10

    let textAnchor = 'middle'

    const dataLabelsConfig = w.config.dataLabels
    let elDataLabelsWrap = this.graphics.group({
      class: 'apexcharts-datalabels'
    })

    let polygonPos = this.getPolygonPos(this.size)

    let currPosX = 0
    let currPosY = 0

    w.globals.labels.forEach((label, i) => {
      let formatter = dataLabelsConfig.formatter
      let dataLabels = new DataLabels(this.ctx)

      if (polygonPos[i]) {
        currPosX = polygonPos[i].x
        currPosY = polygonPos[i].y

        if (Math.abs(polygonPos[i].x) >= limit) {
          if (polygonPos[i].x > 0) {
            textAnchor = 'start'
            currPosX += 10
          } else if (polygonPos[i].x < 0) {
            textAnchor = 'end'
            currPosX -= 10
          }
        } else {
          textAnchor = 'middle'
        }
        if (Math.abs(polygonPos[i].y) >= this.size - limit) {
          if (polygonPos[i].y < 0) {
            currPosY -= 10
          } else if (polygonPos[i].y > 0) {
            currPosY += 10
          }
        }

        let text = formatter(label, {
          seriesIndex: -1,
          dataPointIndex: i,
          w
        })

        dataLabels.plotDataLabelsText({
          x: currPosX,
          y: currPosY,
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

  createPaths(pos, origin) {
    let linePathsTo = []
    let linePathsFrom = []
    let areaPathsTo = []
    let areaPathsFrom = []

    if (pos.length) {
      linePathsFrom = [this.graphics.move(origin.x, origin.y)]
      areaPathsFrom = [this.graphics.move(origin.x, origin.y)]

      let linePathTo = this.graphics.move(pos[0].x, pos[0].y)
      let areaPathTo = this.graphics.move(pos[0].x, pos[0].y)

      pos.forEach((p, i) => {
        linePathTo += this.graphics.line(p.x, p.y)
        areaPathTo += this.graphics.line(p.x, p.y)
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

  getPreviousPath(realIndex) {
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

  getDataPointsPos(
    dataRadiusArr,
    angleArr,
    dataPointsLen = this.dataPointsLen
  ) {
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

  getPolygonPos(size) {
    var dotsArray = []
    var angle = (Math.PI * 2) / this.dataPointsLen
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
