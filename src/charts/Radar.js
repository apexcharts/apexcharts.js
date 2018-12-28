import Graphics from '../modules/Graphics'

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

    this.maxValue = 100
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

    this.dataPointsLen = series[w.globals.maxValsInArrayIndex].length
    this.disAngle = Math.PI * 2 / this.dataPointsLen

    series.forEach((s, i) => {
      this.dataRadiusOfPercent[i] = []
      this.dataRadius[i] = []
      this.angleArr[i] = []
      s.forEach((dv, j) => {
        this.dataRadiusOfPercent[i][j] = dv / this.maxValue
        this.dataRadius[i][j] = this.dataRadiusOfPercent[i][j] * this.size
        this.angleArr[i][j] = j * this.disAngle
      })

      const dataPointsPos = this.getDataPointsPos(this.dataRadius[i], this.angleArr[i])
      this.createPaths(dataPointsPos)
    })

    const graphics = new Graphics(this.ctx)

    let ret = graphics.group({
      class: 'apexcharts-pie'
    })

    // el to which series will be drawn
    let elSeries = graphics.group()

    let scaleSize = w.config.plotOptions.radar.customScale
    let halfW = w.globals.gridWidth / 2
    let halfH = w.globals.gridHeight / 2
    let translateX = halfW - w.globals.gridWidth / 2 * scaleSize
    let translateY = halfH - w.globals.gridHeight / 2 * scaleSize

    elSeries.attr({
      'transform': `translate(${translateX}, ${translateY - 5}) scale(${scaleSize})`
    })

    ret.attr({
      'data:innerTranslateX': translateX,
      'data:innerTranslateY': translateY - 25
    })

    ret.add(elSeries)

    return ret
  }

  // drawRadarBackground (options) {
  //   var layer = options.layer ? options.layer : 5,
  //     n = options.n ? options.n : 5,
  //     r = options.r ? options.r : 50,
  //     origin = options.origin ? options.origin : [0, 0],
  //     evenStrokeStyle = options.evenStrokeStyle ? options.evenStrokeStyle : '#ccc',
  //     oddStrokeStyle = options.oddStrokeStyle ? options.oddStrokeStyle : '#ccc',
  //     evenFillStyle = options.evenFillStyle ? options.evenFillStyle : '#eee',
  //     oddFillStyle = options.oddFillStyle ? options.oddFillStyle : 'transparent'
  //   var layerRadiusArray = []
  //   var layerDis = r / layer
  //   for (var i = 0; i < layer; i++) {
  //     layerRadiusArray[i] = layerDis * (i + 1)
  //   }
  //   layerRadiusArray = layerRadiusArray.reverse()

  //   for (let i = 0; i < layer; i++) {
  //     if (i % 2 != 0) {
  //       drawPolygon({
  //         n: n,
  //         r: layerRadiusArray[i],
  //         origin: origin,
  //         fillStyle: evenFillStyle,
  //         strokeStyle: evenStrokeStyle,
  //         lineWidth: 1
  //       })
  //     } else {
  //       drawPolygon({
  //         n: n,
  //         r: layerRadiusArray[i],
  //         origin: origin,
  //         fillStyle: oddFillStyle,
  //         strokeStyle: oddStrokeStyle,
  //         lineWidth: 1
  //       })
  //     }
  //   }

  //   // 绘制放射性连线
  //   context.save()
  //   context.beginPath()
  //   var polygonOuterPointsPosArr = getPolygonPos(n, r, origin)
  //   for (let i = 0; i < n; i++) {
  //     context.moveTo(origin[0], origin[1])
  //     context.lineTo(polygonOuterPointsPosArr[i].x, polygonOuterPointsPosArr[i].y)
  //   }
  //   context.strokeStyle = evenStrokeStyle
  //   context.lineWidth = 1
  //   context.stroke()
  //   context.restore()
  // }

  createPaths (pos) {
    // let w = this.w
    let graphics = new Graphics(this.ctx)

    if (pos.length) {
      let linePath = graphics.move(pos[0].x, pos[0].y)

      pos.forEach((p) => {
        linePath += graphics.line(p.x, p.y)
      })
      console.log(linePath)
    }
  }

  // drawPolygon (options) {
  //   var n = options.n ? options.n : 5,
  //     r = options.r ? options.r : 30,
  //     origin = options.origin ? options.origin : [0, 0],
  //     fillStyle = options.fillStyle ? options.fillStyle : 'transparent',
  //     strokeStyle = options.strokeStyle ? options.strokeStyle : '#000',
  //     lineWidth = options.lineWidth ? options.lineWidth * ratio : 1 * ratio,
  //     lineCap = options.lineCap ? options.lineCap : 'butt'
  //   context.save()
  //   context.beginPath()
  //   var angle = Math.PI * 2 / n
  //   context.translate(origin[0], origin[1])
  //   context.moveTo(0, -r)
  //   for (let i = 0; i < n; i++) {
  //     context.rotate(angle)
  //     context.lineTo(0, -r)
  //   }
  //   context.closePath()

  //   if (options.strokeStyle) {
  //     context.strokeStyle = strokeStyle
  //     context.lineWidth = lineWidth
  //     context.lineCap = lineCap
  //     context.stroke()
  //   }
  //   if (options.fillStyle) {
  //     context.fillStyle = fillStyle
  //     context.fill()
  //   }
  //   context.restore()
  // }

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
      // console.log(curPos.x + "; " + curPos.y);
    }
    return dotsArray
  }
}

export default Radar
