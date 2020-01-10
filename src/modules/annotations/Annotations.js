import Graphics from '../../modules/Graphics'
import Utils from '../../utils/Utils'
import Helpers from './Helpers'
import XAxisAnnotations from './XAxisAnnotations'
import YAxisAnnotations from './YAxisAnnotations'
import PointsAnnotations from './PointsAnnotations'
import Options from './../settings/Options'

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

    this.helpers = new Helpers(this)
    this.xAxisAnnotations = new XAxisAnnotations(this)
    this.yAxisAnnotations = new YAxisAnnotations(this)
    this.pointsAnnotations = new PointsAnnotations(this)

    if (this.w.globals.isBarHorizontal && this.w.config.yaxis[0].reversed) {
      this.inversedReversedAxis = true
    }

    this.xDivision = this.w.globals.gridWidth / this.w.globals.dataPoints
  }

  drawAnnotations() {
    const w = this.w
    if (w.globals.axisCharts) {
      let yAnnotations = this.yAxisAnnotations.drawYAxisAnnotations()
      let xAnnotations = this.xAxisAnnotations.drawXAxisAnnotations()
      let pointAnnotations = this.pointsAnnotations.drawPointAnnotations()

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
          // fixes apexcharts/apexcharts.js#685
          if (
            w.config.chart.type !== 'scatter' &&
            w.config.chart.type !== 'bubble'
          ) {
            annoElArray[i].classList.add('apexcharts-element-hidden')
          }
        }
        w.globals.delayedElements.push({ el: annoElArray[i], index: 0 })
      }

      // background sizes needs to be calculated after text is drawn, so calling them last
      this.helpers.annotationsBackground()
    }
  }

  addXaxisAnnotation(anno, parent, index) {
    this.xAxisAnnotations.addXaxisAnnotation(anno, parent, index)
  }

  addYaxisAnnotation(anno, parent, index) {
    this.yAxisAnnotations.addYaxisAnnotation(anno, parent, index)
  }

  addPointAnnotation(anno, parent, index) {
    this.pointsAnnotations.addPointAnnotation(anno, parent, index)
  }

  clearAnnotations(ctx) {
    const w = ctx.w
    let annos = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-yaxis-annotations, .apexcharts-xaxis-annotations, .apexcharts-point-annotations'
    )

    // annotations added externally should be cleared out too
    w.globals.memory.methodsToExec.map((m, i) => {
      if (m.label === 'addText' || m.label === 'addAnnotation') {
        w.globals.memory.methodsToExec.splice(i, 1)
      }
    })

    annos = Utils.listToArray(annos)

    // delete the DOM elements
    annos.forEach((a) => {
      while (a.firstChild) {
        a.removeChild(a.firstChild)
      }
    })
  }

  removeAnnotation(ctx, id) {
    const w = ctx.w
    let annos = w.globals.dom.baseEl.querySelectorAll(`.${id}`)

    if (annos) {
      w.globals.memory.methodsToExec.map((m, i) => {
        if (m.id === id) {
          w.globals.memory.methodsToExec.splice(i, 1)
        }
      })

      annos.forEach((a) => {
        a.parentElement.removeChild(a)
      })
    }
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
      x,
      y,
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
        label: 'addText',
        params
      })
    }

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

    const options = new Options()
    const axesAnno = Object.assign(
      {},
      type === 'xaxis'
        ? options.xAxisAnnotation
        : type === 'yaxis'
        ? options.yAxisAnnotation
        : options.pointAnnotation
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
    const elRect = this.helpers.addBackgroundToAnno(axesAnnoLabel, anno)
    if (elRect) {
      parent.insertBefore(elRect.node, axesAnnoLabel)
    }

    if (pushToMemory) {
      w.globals.memory.methodsToExec.push({
        context: me,
        id: anno.id ? anno.id : Utils.randomId(),
        method: contextMethod,
        label: 'addAnnotation',
        params
      })
    }

    return context
  }
}
