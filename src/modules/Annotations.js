import Graphics from './Graphics'
import Options from './settings/Options'
import Utils from '../utils/Utils'

/**
 * ApexCharts Annotations Class for drawing lines/rects on both xaxis and yaxis.
 *
 * @module Annotations
 **/
class Annotations {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
    this.graphics = new Graphics(this.ctx)

    this.xDivision = this.w.globals.gridWidth / this.w.globals.dataPoints
  }

  drawAnnotations () {
    const w = this.w
    if (w.globals.axisCharts) {
      let yAnnotations = this.drawYAxisAnnotations()
      let xAnnotations = this.drawXAxisAnnotations()
      let pointAnnotations = this.drawPointAnnotations()

      const annoArray = [yAnnotations, xAnnotations, pointAnnotations]
      const annoElArray = [xAnnotations.node, yAnnotations.node, pointAnnotations.node]
      for (let i = 0; i < 3; i++) {
        w.globals.dom.elGraphical.add(annoArray[i])
        annoElArray[i].classList.add('hidden')
        w.globals.delayedElements.push({ el: annoElArray[i], index: 0 })
      }

      // after placing the annotations on svg, set any vertically placed annotations
      this.setOrientations(w.config.annotations.xaxis)

      // background sizes needs to be calculated after text is drawn, so calling them last
      this.annotationsBackground()
    }
  }

  addXaxisAnnotation (anno, parent, index) {
    let w = this.w

    let strokeDashArray = anno.strokeDashArray

    let x1 = (anno.x - w.globals.minX) / (w.globals.xRange / w.globals.gridWidth)

    let line = this.graphics.drawLine(
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

    let elText = this.graphics.drawText({
      x: x1 + anno.label.offsetX,
      y: textY + anno.label.offsetY,
      text,
      textAnchor: anno.label.textAnchor,
      fontSize: anno.label.style.fontSize,
      fontFamily: anno.label.style.fontFamily,
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

    let elg = this.graphics.group({
      class: 'apexcharts-xaxis-annotations'
    })

    w.config.annotations.xaxis.map((anno, index) => {
      this.addXaxisAnnotation(anno, elg.node, index)
    })

    return elg
  }

  addYaxisAnnotation (anno, parent, index) {
    let w = this.w

    let strokeDashArray = anno.strokeDashArray

    let y1 = w.globals.gridHeight - (anno.y - w.globals.minYArr[anno.yAxisIndex]) / (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)

    const text = anno.label.text ? anno.label.text : ''

    let line = this.graphics.drawLine(
      0 + anno.offsetX,
      y1 + anno.offsetY,
      w.globals.gridWidth + anno.offsetX,
      y1 + anno.offsetY,
      anno.borderColor,
      strokeDashArray
    )
    parent.appendChild(line.node)

    let textX = anno.label.position === 'right' ? w.globals.gridWidth : 0

    let elText = this.graphics.drawText({
      x: textX + anno.label.offsetX,
      y: y1 + anno.label.offsetY - 3,
      text,
      textAnchor: anno.label.textAnchor,
      fontSize: anno.label.style.fontSize,
      fontFamily: anno.label.style.fontFamily,
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

    let elg = this.graphics.group({
      class: 'apexcharts-yaxis-annotations'
    })

    w.config.annotations.yaxis.map((anno, index) => {
      this.addYaxisAnnotation(anno, elg.node, index)
    })

    return elg
  }

  addPointAnnotation (anno, parent, index) {
    const w = this.w

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
    let point = this.graphics.drawMarker(x, pointY, optsPoints)
    parent.appendChild(point.node)

    const text = anno.label.text ? anno.label.text : ''

    let elText = this.graphics.drawText({
      x: x + anno.label.offsetX,
      y: y + anno.label.offsetY,
      text,
      textAnchor: anno.label.textAnchor,
      fontSize: anno.label.style.fontSize,
      fontFamily: anno.label.style.fontFamily,
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

    let elg = this.graphics.group({
      class: 'apexcharts-point-annotations'
    })

    w.config.annotations.points.map((anno, index) => {
      this.addPointAnnotation(anno, elg.node, index)
    })

    return elg
  }

  setOrientations (annos, annoIndex = null) {
    let w = this.w

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

          let annoRotatingCenter = this.graphics.rotateAroundCenter(xAnno)
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
    const elRect = this.graphics.drawRect(
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

    const add = (anno, i, type) => {
      let annoLabel = w.globals.dom.baseEl.querySelector(`.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${i}']`)

      const parent = annoLabel.parentNode
      const elRect = this.addBackgroundToAnno(annoLabel, anno)

      parent.insertBefore(elRect.node, annoLabel)
    }

    w.config.annotations.xaxis.map((anno, i) => {
      add(anno, i, 'xaxis')
    })

    w.config.annotations.yaxis.map((anno, i) => {
      add(anno, i, 'yaxis')
    })

    w.config.annotations.points.map((anno, i) => {
      add(anno, i, 'point')
    })
  }

  addText (params, pushToMemory, context) {
    const { x, y, text, textAnchor, appendTo = '.apexcharts-inner', foreColor, fontSize, fontFamily, cssClass, backgroundColor, borderWidth, strokeDashArray, radius, borderColor, paddingLeft = 4, paddingRight = 4, paddingBottom = 2, paddingTop = 2 } = params

    const me = context
    const w = me.w

    const parentNode = w.globals.dom.baseEl.querySelector(appendTo)

    let elText = this.graphics.drawText({
      x: x,
      y: y,
      text,
      textAnchor: textAnchor || 'start',
      fontSize: fontSize || '12px',
      fontFamily: fontFamily || 'Arial',
      foreColor: foreColor || w.config.chart.foreColor,
      cssClass: 'apexcharts-text ' + cssClass ? cssClass : ''
    })

    parentNode.appendChild(elText.node)

    const textRect = elText.bbox()
    const elRect = this.graphics.drawRect(textRect.x - paddingLeft, textRect.y - paddingTop, textRect.width + paddingLeft + paddingRight, textRect.height + paddingBottom + paddingTop, radius, backgroundColor, 1, borderWidth, borderColor, strokeDashArray)

    elText.before(elRect)

    if (pushToMemory) {
      w.globals.memory.methodsToExec.push({
        context: me,
        method: me.addText,
        params: { x, y, text, textAnchor, appendTo, foreColor, fontSize, cssClass, backgroundColor, borderWidth, strokeDashArray, radius, borderColor, paddingLeft, paddingRight, paddingBottom, paddingTop }
      })
    }

    return context
  }

  addPointAnnotationExternal (params, pushToMemory, context) {
    this.addAnnotationExternal({ params, pushToMemory, context, type: 'point', contextMethod: context.addPointAnnotation })
    return context
  }

  addYaxisAnnotationExternal (params, pushToMemory, context) {
    this.addAnnotationExternal({ params, pushToMemory, context, type: 'yaxis', contextMethod: context.addYaxisAnnotation })
    return context
  }

  // The addXaxisAnnotation method requires a parent class, and user calling this method externally on the chart instance may not specify parent, hence a different method
  addXaxisAnnotationExternal (params, pushToMemory, context) {
    this.addAnnotationExternal({ params, pushToMemory, context, type: 'xaxis', contextMethod: context.addXaxisAnnotation })
    return context
  }

  addAnnotationExternal ({ params, pushToMemory, context, type, contextMethod }) {
    const me = context
    const w = me.w
    const parent = w.globals.dom.baseEl.querySelector(`.apexcharts-${type}-annotations`)
    const index = parent.childNodes.length + 1

    const opt = new Options()
    const axesAnno = Object.assign({}, (type === 'xaxis') ? (opt.xAxisAnnotation) : ((type === 'yaxis') ? (opt.yAxisAnnotation) : (opt.pointAnnotation)))

    const anno = Utils.extend(axesAnno, params)

    switch (type) {
      case 'xaxis':
        this.addXaxisAnnotation(anno, parent, index)
        break
      case 'yaxis':
        this.addYaxisAnnotation(anno, parent, index)
        break
      case 'point':
        this.addPointAnnotation(anno, parent, index)
        break
    }

    // add background
    let axesAnnoLabel = w.globals.dom.baseEl.querySelector(`.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${index}']`)
    const elRect = this.addBackgroundToAnno(axesAnnoLabel, anno)
    parent.insertBefore(elRect.node, axesAnnoLabel)

    if (pushToMemory) {
      w.globals.memory.methodsToExec.push({
        context: me,
        method: contextMethod,
        params: params
      })
    }

    return context
  }
}

module.exports = Annotations
