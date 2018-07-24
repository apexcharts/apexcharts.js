import Graphics from './Graphics'

/**
 * ApexCharts Annotations Class for drawing lines/rects on both xaxis and yaxis.
 *
 * @module Annotations
 **/
class Annotations {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.xDivision = this.w.globals.gridWidth / this.w.globals.dataPoints
  }

  addXAxisAnnotation (anno, parent, index) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let strokeDashArray = anno.strokeDashArray

    let x1 = (anno.x - w.globals.minX) / (w.globals.xRange / w.globals.gridWidth)

    let line = graphics.drawLine(
      x1 + anno.offsetX,
      0 + anno.offsetY,
      x1 + anno.offsetX,
      w.globals.gridHeight + anno.offsetY,
      anno.borderColor,
      strokeDashArray
    )
    parent.appendChild(line.node)

    let textY = anno.label.position === 'top' ? -3 : w.globals.gridHeight

    const text = anno.label.text ? anno.label.text : ''

    let elText = graphics.drawText({
      x: x1 + anno.label.offsetX,
      y: textY + anno.label.offsetY,
      text,
      textAnchor: anno.label.textAnchor,
      fontSize: anno.label.style.fontSize,
      foreColor: anno.label.style.color,
      cssClass: 'apexcharts-xaxis-annotation-label ' + anno.label.style.cssClass
    })

    elText.attr({
      rel: index
    })

    parent.appendChild(elText.node)
  }

  drawXAxisAnnotations () {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let elg = graphics.group({
      class: 'apexcharts-xaxis-annotations'
    })

    w.config.annotations.xaxis.map((anno, index) => {
      this.addXAxisAnnotation(anno, elg.node, index)
    })

    return elg
  }

  addYAxisAnnotation (anno, parent, index) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let strokeDashArray = anno.strokeDashArray

    let y1 = w.globals.gridHeight - (anno.y - w.globals.minYArr[anno.yAxisIndex]) / (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)

    const text = anno.label.text ? anno.label.text : ''

    let line = graphics.drawLine(
      0 + anno.offsetX,
      y1 + anno.offsetY,
      w.globals.gridWidth + anno.offsetX,
      y1 + anno.offsetY,
      anno.borderColor,
      strokeDashArray
    )
    parent.appendChild(line.node)

    let textX = anno.label.position === 'right' ? w.globals.gridWidth : 0

    let elText = graphics.drawText({
      x: textX + anno.label.offsetX,
      y: y1 + anno.label.offsetY - 3,
      text,
      textAnchor: anno.label.textAnchor,
      fontSize: anno.label.style.fontSize,
      foreColor: anno.label.style.color,
      cssClass: 'apexcharts-yaxis-annotation-label ' + anno.label.style.cssClass
    })

    elText.attr({
      rel: index
    })

    parent.appendChild(elText.node)
  }

  drawYAxisAnnotations () {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let elg = graphics.group({
      class: 'apexcharts-yaxis-annotations'
    })

    w.config.annotations.yaxis.map((anno, index) => {
      this.addYAxisAnnotation(anno, elg.node, index)
    })

    return elg
  }

  addPointAnnotation (anno, parent, index) {
    const w = this.w
    let graphics = new Graphics(this.ctx)

    let x = 0
    let y = 0
    let pointY = 0
    if (typeof anno.x === 'string') {
      if (w.config.chart.type === 'bar' && w.config.plotOptions.bar.horizontal) {
        // todo
      }

      let catIndex = w.globals.labels.indexOf(anno.x)
      const xLabel = w.globals.dom.baseEl.querySelector('.apexcharts-xaxis-texts-g text:nth-child(' + (catIndex + 1) + ')')

      const xPos = parseInt(xLabel.getAttribute('x'))

      x = xPos

      let annoY = anno.y
      if (anno.y === null) {
        annoY = w.globals.series[anno.seriesIndex][catIndex]
      }
      y = w.globals.gridHeight - (annoY - w.globals.minYArr[anno.yAxisIndex]) / (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight) - parseInt(anno.label.style.fontSize) - anno.marker.size

      pointY = w.globals.gridHeight - (annoY - w.globals.minYArr[anno.yAxisIndex]) / (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)
    } else {
      x = (anno.x - w.globals.minX) / (w.globals.xRange / w.globals.gridWidth)
      y = w.globals.gridHeight - (parseInt(anno.y) - w.globals.minYArr[anno.yAxisIndex]) / (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight) - parseInt(anno.label.style.fontSize) - anno.marker.size

      pointY = w.globals.gridHeight - (anno.y - w.globals.minYArr[anno.yAxisIndex]) / (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)
    }

    let optsPoints = {
      pSize: anno.marker.size,
      pWidth: anno.marker.strokeWidth,
      pointFillColor: anno.marker.fillColor,
      pointStrokeColor: anno.marker.strokeColor,
      shape: anno.marker.shape,
      radius: anno.marker.radius
    }
    let point = graphics.drawMarker(x, pointY, optsPoints)
    parent.appendChild(point.node)

    const text = anno.label.text ? anno.label.text : ''

    let elText = graphics.drawText({
      x: x + anno.label.offsetX,
      y: y + anno.label.offsetY,
      text,
      textAnchor: anno.label.textAnchor,
      fontSize: anno.label.style.fontSize,
      foreColor: anno.label.style.color,
      cssClass: 'apexcharts-point-annotation-label ' + anno.label.style.cssClass
    })

    elText.attr({
      rel: index
    })

    parent.appendChild(elText.node)
  }

  drawPointAnnotations () {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let elg = graphics.group({
      class: 'apexcharts-point-annotations'
    })

    w.config.annotations.points.map((anno, index) => {
      this.addPointAnnotation(anno, elg.node, index)
    })

    return elg
  }

  setOrientations (annos, annoIndex = null) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    annos.map((anno, index) => {
      if (anno.label.orientation === 'vertical') {
        const i = annoIndex !== null ? annoIndex : index
        let xAnno = w.globals.dom.baseEl.querySelector(`.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i}']`)

        if (xAnno !== null) {
          const xAnnoCoord = xAnno.getBoundingClientRect()
          xAnno.setAttribute('x', parseInt(xAnno.getAttribute('x')) - xAnnoCoord.height + 4)

          if (anno.label.position === 'top') {
            xAnno.setAttribute('y', parseInt(xAnno.getAttribute('y')) + xAnnoCoord.width)
          } else {
            xAnno.setAttribute('y', parseInt(xAnno.getAttribute('y')) - xAnnoCoord.width)
          }

          let annoRotatingCenter = graphics.rotateAroundCenter(xAnno)
          const x = annoRotatingCenter.x
          const y = annoRotatingCenter.y

          xAnno.setAttribute(
            'transform',
            `rotate(-90 ${x} ${y})`
          )
        }
      }
    })
  }

  addBackgroundToAnno (annoEl, anno) {
    const w = this.w
    const graphics = new Graphics(this.ctx)

    const elGridRect = w.globals.dom.baseEl.querySelector('.apexcharts-grid').getBoundingClientRect()

    const coords = annoEl.getBoundingClientRect()

    let pleft = anno.label.style.padding.left
    let pright = anno.label.style.padding.right
    let ptop = anno.label.style.padding.top
    let pbottom = anno.label.style.padding.bottom

    if (anno.label.orientation === 'vertical') {
      ptop = anno.label.style.padding.left
      pbottom = anno.label.style.padding.right
      pleft = anno.label.style.padding.top
      pright = anno.label.style.padding.bottom
    }

    const x1 = coords.left - elGridRect.left - pleft
    const y1 = coords.top - elGridRect.top - ptop
    const elRect = graphics.drawRect(
      x1,
      y1,
      coords.width + pleft + pright,
      coords.height + ptop + pbottom,
      0,
      anno.label.style.background,
      1,
      anno.label.borderWidth,
      anno.label.borderColor,
      0
    )

    return elRect
  }

  annotationsBackground () {
    const w = this.w

    w.config.annotations.xaxis.map((anno, i) => {
      let xAnnoLabel = w.globals.dom.baseEl.querySelector(`.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i}']`)

      const parent = xAnnoLabel.parentNode
      const elRect = this.addBackgroundToAnno(xAnnoLabel, anno, i)

      parent.insertBefore(elRect.node, xAnnoLabel)
    })

    w.config.annotations.yaxis.map((anno, i) => {
      let yAnnoLabel = w.globals.dom.baseEl.querySelector(`.apexcharts-yaxis-annotations .apexcharts-yaxis-annotation-label[rel='${i}']`)

      const parent = yAnnoLabel.parentNode
      const elRect = this.addBackgroundToAnno(yAnnoLabel, anno, i)

      parent.insertBefore(elRect.node, yAnnoLabel)
    })

    w.config.annotations.points.map((anno, i) => {
      let pointAnnoLabel = w.globals.dom.baseEl.querySelector(`.apexcharts-point-annotations .apexcharts-point-annotation-label[rel='${i}']`)

      const parent = pointAnnoLabel.parentNode
      const elRect = this.addBackgroundToAnno(pointAnnoLabel, anno, i)

      parent.insertBefore(elRect.node, pointAnnoLabel)
    })
  }
}

module.exports = Annotations
