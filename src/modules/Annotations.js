import Graphics from './Graphics'
import Options from './settings/Options'
import Utils from '../utils/Utils'

/**
 * ApexCharts Annotations Class for drawing lines/rects on both xaxis and yaxis.
 *
 * @module Annotations
 **/
export default class Annotations {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
    this.graphics = new Graphics(this.ctx)

    if (this.w.globals.isBarHorizontal) {
      this.invertAxis = true
    }

    this.xDivision = this.w.globals.gridWidth / this.w.globals.dataPoints
  }

  drawAnnotations() {
    const w = this.w
    if (w.globals.axisCharts) {
      let yAnnotations = this.drawYAxisAnnotations()
      let xAnnotations = this.drawXAxisAnnotations()
      let pointAnnotations = this.drawPointAnnotations()

      const initialAnim = w.config.chart.animations.enabled

      const annoArray = [yAnnotations, xAnnotations, pointAnnotations]
      const annoElArray = [
        xAnnotations.node,
        yAnnotations.node,
        pointAnnotations.node
      ]
      for (let i = 0; i < 3; i++) {
        w.globals.dom.elGraphical.add(annoArray[i])
        if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
          annoElArray[i].classList.add('hidden')
        }
        w.globals.delayedElements.push({ el: annoElArray[i], index: 0 })
      }

      // background sizes needs to be calculated after text is drawn, so calling them last
      this.annotationsBackground()
    }
  }

  addXaxisAnnotation(anno, parent, index) {
    let w = this.w

    const min = this.invertAxis ? w.globals.minY : w.globals.minX
    const range = this.invertAxis ? w.globals.yRange[0] : w.globals.xRange

    let x1 = (anno.x - min) / (range / w.globals.gridWidth)
    const text = anno.label.text

    if (
      w.config.xaxis.type === 'category' ||
      w.config.xaxis.convertedCatToNumeric
    ) {
      let catIndex = w.globals.labels.indexOf(anno.x)
      const xLabel = w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-texts-g text:nth-child(' + (catIndex + 1) + ')'
      )

      if (xLabel) {
        x1 = parseFloat(xLabel.getAttribute('x'))
      }
    }

    let strokeDashArray = anno.strokeDashArray

    if (x1 < 0 || x1 > w.globals.gridWidth) return

    if (anno.x2 === null) {
      let line = this.graphics.drawLine(
        x1 + anno.offsetX, // x1
        0 + anno.offsetY, // y1
        x1 + anno.offsetX, // x2
        w.globals.gridHeight + anno.offsetY, // y2
        anno.borderColor, // lineColor
        strokeDashArray //dashArray
      )
      parent.appendChild(line.node)
    } else {
      let x2 = (anno.x2 - min) / (range / w.globals.gridWidth)
      if (x2 < x1) {
        let temp = x1
        x1 = x2
        x2 = temp
      }

      if (text) {
        let rect = this.graphics.drawRect(
          x1 + anno.offsetX, // x1
          0 + anno.offsetY, // y1
          x2 - x1, // x2
          w.globals.gridHeight + anno.offsetY, // y2
          0, // radius
          anno.fillColor, // color
          anno.opacity, // opacity,
          1, // strokeWidth
          anno.borderColor, // strokeColor
          strokeDashArray // stokeDashArray
        )
        parent.appendChild(rect.node)
      }
    }
    let textY = anno.label.position === 'top' ? -3 : w.globals.gridHeight

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

    // after placing the annotations on svg, set any vertically placed annotations
    this.setOrientations(anno, index)
  }

  drawXAxisAnnotations() {
    let w = this.w

    let elg = this.graphics.group({
      class: 'apexcharts-xaxis-annotations'
    })

    w.config.annotations.xaxis.map((anno, index) => {
      this.addXaxisAnnotation(anno, elg.node, index)
    })

    return elg
  }

  addYaxisAnnotation(anno, parent, index) {
    let w = this.w

    let strokeDashArray = anno.strokeDashArray

    let y1
    let y2

    if (this.invertAxis) {
      let catIndex = w.globals.labels.indexOf(anno.y)
      const xLabel = w.globals.dom.baseEl.querySelector(
        '.apexcharts-yaxis-texts-g text:nth-child(' + (catIndex + 1) + ')'
      )

      if (xLabel) {
        y1 = parseFloat(xLabel.getAttribute('y'))
      }
    } else {
      y1 =
        w.globals.gridHeight -
        (anno.y - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)

      if (
        w.config.yaxis[anno.yAxisIndex] &&
        w.config.yaxis[anno.yAxisIndex].reversed
      ) {
        y1 =
          (anno.y - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)
      }
    }

    const text = anno.label.text

    if (anno.y2 === null) {
      let line = this.graphics.drawLine(
        0 + anno.offsetX, // x1
        y1 + anno.offsetY, // y1
        w.globals.gridWidth + anno.offsetX, // x2
        y1 + anno.offsetY, // y2
        anno.borderColor, // lineColor
        strokeDashArray // dashArray
      )
      parent.appendChild(line.node)
    } else {
      if (this.invertAxis) {
        let catIndex = w.globals.labels.indexOf(anno.y2)
        const xLabel = w.globals.dom.baseEl.querySelector(
          '.apexcharts-yaxis-texts-g text:nth-child(' + (catIndex + 1) + ')'
        )

        if (xLabel) {
          y2 = parseFloat(xLabel.getAttribute('y'))
        }
      } else {
        y2 =
          w.globals.gridHeight -
          (anno.y2 - w.globals.minYArr[anno.yAxisIndex]) /
            (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)

        if (
          w.config.yaxis[anno.yAxisIndex] &&
          w.config.yaxis[anno.yAxisIndex].reversed
        ) {
          y2 =
            (anno.y2 - w.globals.minYArr[anno.yAxisIndex]) /
            (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)
        }
      }

      if (y2 > y1) {
        let temp = y1
        y1 = y2
        y2 = temp
      }

      if (text) {
        let rect = this.graphics.drawRect(
          0 + anno.offsetX, // x1
          y2 + anno.offsetY, // y1
          w.globals.gridWidth + anno.offsetX, // x2
          y1 - y2, // y2
          0, // radius
          anno.fillColor, // color
          anno.opacity, // opacity,
          1, // strokeWidth
          anno.borderColor, // strokeColor
          strokeDashArray // stokeDashArray
        )
        parent.appendChild(rect.node)
      }
    }
    let textX = anno.label.position === 'right' ? w.globals.gridWidth : 0

    let elText = this.graphics.drawText({
      x: textX + anno.label.offsetX,
      y: (y2 || y1) + anno.label.offsetY - 3,
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

  drawYAxisAnnotations() {
    let w = this.w

    let elg = this.graphics.group({
      class: 'apexcharts-yaxis-annotations'
    })

    w.config.annotations.yaxis.map((anno, index) => {
      this.addYaxisAnnotation(anno, elg.node, index)
    })

    return elg
  }

  clearAnnotations(ctx) {
    const w = ctx.w
    let annos = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-yaxis-annotations, .apexcharts-xaxis-annotations, .apexcharts-point-annotations'
    )

    annos = Utils.listToArray(annos)

    annos.forEach((a) => {
      while (a.firstChild) {
        a.removeChild(a.firstChild)
      }
    })
  }

  addPointAnnotation(anno, parent, index) {
    const w = this.w

    let x = 0
    let y = 0
    let pointY = 0

    if (this.invertAxis) {
      console.warn(
        'Point annotation is not supported in horizontal bar charts.'
      )
    }

    if (typeof anno.x === 'string') {
      let catIndex = w.globals.labels.indexOf(anno.x)
      const xLabel = w.globals.dom.baseEl.querySelector(
        '.apexcharts-xaxis-texts-g text:nth-child(' + (catIndex + 1) + ')'
      )

      const xPos = parseFloat(xLabel.getAttribute('x'))

      x = xPos

      let annoY = anno.y
      if (anno.y === null) {
        annoY = w.globals.series[anno.seriesIndex][catIndex]
      }
      y =
        w.globals.gridHeight -
        (annoY - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight) -
        parseInt(anno.label.style.fontSize) -
        anno.marker.size

      pointY =
        w.globals.gridHeight -
        (annoY - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)

      if (
        w.config.yaxis[anno.yAxisIndex] &&
        w.config.yaxis[anno.yAxisIndex].reversed
      ) {
        y =
          (annoY - w.globals.minYArr[anno.yAxisIndex]) /
            (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight) +
          parseInt(anno.label.style.fontSize) +
          anno.marker.size

        pointY =
          (annoY - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)
      }
    } else {
      x = (anno.x - w.globals.minX) / (w.globals.xRange / w.globals.gridWidth)
      y =
        w.globals.gridHeight -
        (parseFloat(anno.y) - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight) -
        parseInt(anno.label.style.fontSize) -
        anno.marker.size

      pointY =
        w.globals.gridHeight -
        (anno.y - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)

      if (
        w.config.yaxis[anno.yAxisIndex] &&
        w.config.yaxis[anno.yAxisIndex].reversed
      ) {
        y =
          (parseFloat(anno.y) - w.globals.minYArr[anno.yAxisIndex]) /
            (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight) -
          parseInt(anno.label.style.fontSize) -
          anno.marker.size

        pointY =
          (anno.y - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)
      }
    }

    if (x < 0 || x > w.globals.gridWidth) return

    let optsPoints = {
      pSize: anno.marker.size,
      pWidth: anno.marker.strokeWidth,
      pointFillColor: anno.marker.fillColor,
      pointStrokeColor: anno.marker.strokeColor,
      shape: anno.marker.shape,
      radius: anno.marker.radius,
      class: 'apexcharts-point-annotation-marker ' + anno.marker.cssClass
    }
    let point = this.graphics.drawMarker(
      x + anno.marker.offsetX,
      pointY + anno.marker.offsetY,
      optsPoints
    )
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

    if (anno.customSVG.SVG) {
      let g = this.graphics.group({
        class:
          'apexcharts-point-annotations-custom-svg ' + anno.customSVG.cssClass
      })

      g.attr({
        transform: `translate(${x + anno.customSVG.offsetX}, ${y +
          anno.customSVG.offsetY})`
      })

      g.node.innerHTML = anno.customSVG.SVG
      parent.appendChild(g.node)
    }
  }

  drawPointAnnotations() {
    let w = this.w

    let elg = this.graphics.group({
      class: 'apexcharts-point-annotations'
    })

    w.config.annotations.points.map((anno, index) => {
      this.addPointAnnotation(anno, elg.node, index)
    })

    return elg
  }

  setOrientations(anno, annoIndex = null) {
    let w = this.w

    if (anno.label.orientation === 'vertical') {
      const i = annoIndex !== null ? annoIndex : 0
      let xAnno = w.globals.dom.baseEl.querySelector(
        `.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i}']`
      )

      if (xAnno !== null) {
        const xAnnoCoord = xAnno.getBoundingClientRect()
        xAnno.setAttribute(
          'x',
          parseFloat(xAnno.getAttribute('x')) - xAnnoCoord.height + 4
        )

        if (anno.label.position === 'top') {
          xAnno.setAttribute(
            'y',
            parseFloat(xAnno.getAttribute('y')) + xAnnoCoord.width
          )
        } else {
          xAnno.setAttribute(
            'y',
            parseFloat(xAnno.getAttribute('y')) - xAnnoCoord.width
          )
        }

        let annoRotatingCenter = this.graphics.rotateAroundCenter(xAnno)
        const x = annoRotatingCenter.x
        const y = annoRotatingCenter.y

        xAnno.setAttribute('transform', `rotate(-90 ${x} ${y})`)
      }
    }
  }

  addBackgroundToAnno(annoEl, anno) {
    const w = this.w

    if (!anno.label.text || (anno.label.text && !anno.label.text.trim()))
      return null

    const elGridRect = w.globals.dom.baseEl
      .querySelector('.apexcharts-grid')
      .getBoundingClientRect()

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

  annotationsBackground() {
    const w = this.w

    const add = (anno, i, type) => {
      let annoLabel = w.globals.dom.baseEl.querySelector(
        `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${i}']`
      )

      if (annoLabel) {
        const parent = annoLabel.parentNode
        const elRect = this.addBackgroundToAnno(annoLabel, anno)

        if (elRect) {
          parent.insertBefore(elRect.node, annoLabel)
        }
      }
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

  addText(params, pushToMemory, context) {
    const {
      x,
      y,
      text,
      textAnchor,
      appendTo = '.apexcharts-inner',
      foreColor,
      fontSize,
      fontFamily,
      cssClass,
      backgroundColor,
      borderWidth,
      strokeDashArray,
      radius,
      borderColor,
      paddingLeft = 4,
      paddingRight = 4,
      paddingBottom = 2,
      paddingTop = 2
    } = params

    const me = context
    const w = me.w

    const parentNode = w.globals.dom.baseEl.querySelector(appendTo)

    let elText = this.graphics.drawText({
      x: x,
      y: y,
      text,
      textAnchor: textAnchor || 'start',
      fontSize: fontSize || '12px',
      fontFamily: fontFamily || w.config.chart.fontFamily,
      foreColor: foreColor || w.config.chart.foreColor,
      cssClass: 'apexcharts-text ' + cssClass ? cssClass : ''
    })

    parentNode.appendChild(elText.node)

    const textRect = elText.bbox()

    if (text) {
      const elRect = this.graphics.drawRect(
        textRect.x - paddingLeft,
        textRect.y - paddingTop,
        textRect.width + paddingLeft + paddingRight,
        textRect.height + paddingBottom + paddingTop,
        radius,
        backgroundColor,
        1,
        borderWidth,
        borderColor,
        strokeDashArray
      )

      elText.before(elRect)
    }

    if (pushToMemory) {
      w.globals.memory.methodsToExec.push({
        context: me,
        method: me.addText,
        params: {
          x,
          y,
          text,
          textAnchor,
          appendTo,
          foreColor,
          fontSize,
          cssClass,
          backgroundColor,
          borderWidth,
          strokeDashArray,
          radius,
          borderColor,
          paddingLeft,
          paddingRight,
          paddingBottom,
          paddingTop
        }
      })
    }

    return context
  }

  addPointAnnotationExternal(params, pushToMemory, context) {
    if (typeof this.invertAxis === 'undefined') {
      this.invertAxis = context.w.globals.isBarHorizontal
    }

    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: 'point',
      contextMethod: context.addPointAnnotation
    })
    return context
  }

  addYaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: 'yaxis',
      contextMethod: context.addYaxisAnnotation
    })
    return context
  }

  // The addXaxisAnnotation method requires a parent class, and user calling this method externally on the chart instance may not specify parent, hence a different method
  addXaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: 'xaxis',
      contextMethod: context.addXaxisAnnotation
    })
    return context
  }

  addAnnotationExternal({
    params,
    pushToMemory,
    context,
    type,
    contextMethod
  }) {
    const me = context
    const w = me.w
    const parent = w.globals.dom.baseEl.querySelector(
      `.apexcharts-${type}-annotations`
    )
    const index = parent.childNodes.length + 1

    const opt = new Options()
    const axesAnno = Object.assign(
      {},
      type === 'xaxis'
        ? opt.xAxisAnnotation
        : type === 'yaxis'
        ? opt.yAxisAnnotation
        : opt.pointAnnotation
    )

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
    let axesAnnoLabel = w.globals.dom.baseEl.querySelector(
      `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${index}']`
    )
    const elRect = this.addBackgroundToAnno(axesAnnoLabel, anno)
    if (elRect) {
      parent.insertBefore(elRect.node, axesAnnoLabel)
    }

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
