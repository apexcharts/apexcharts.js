import CoreUtils from '../CoreUtils'

export default class Helpers {
  constructor(annoCtx) {
    this.w = annoCtx.w
    this.annoCtx = annoCtx
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

        let annoRotatingCenter = this.annoCtx.graphics.rotateAroundCenter(xAnno)
        const x = annoRotatingCenter.x
        const y = annoRotatingCenter.y

        xAnno.setAttribute('transform', `rotate(-90 ${x} ${y})`)
      }
    }
  }

  addBackgroundToAnno(annoEl, anno) {
    const w = this.w

    if (
      !annoEl ||
      typeof anno.label.text === 'undefined' ||
      (typeof anno.label.text !== 'undefined' &&
        !String(anno.label.text).trim())
    )
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
    const elRect = this.annoCtx.graphics.drawRect(
      x1 - w.globals.barPadForNumericAxis,
      y1,
      coords.width + pleft + pright,
      coords.height + ptop + pbottom,
      anno.label.borderRadius,
      anno.label.style.background,
      1,
      anno.label.borderWidth,
      anno.label.borderColor,
      0
    )

    if (anno.id) {
      // don't escapeString for this ID as it causes duplicate rects
      elRect.node.classList.add(anno.id)
    }

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

          if (anno.label.mouseEnter) {
            elRect.node.addEventListener(
              'mouseenter',
              anno.label.mouseEnter.bind(this, anno)
            )
          }
          if (anno.label.mouseLeave) {
            elRect.node.addEventListener(
              'mouseleave',
              anno.label.mouseLeave.bind(this, anno)
            )
          }
          if (anno.label.click) {
            elRect.node.addEventListener(
              'click',
              anno.label.click.bind(this, anno)
            )
          }
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

  getY1Y2(type, anno) {
    let y = type === 'y1' ? anno.y : anno.y2
    let yP

    const w = this.w
    if (this.annoCtx.invertAxis) {
      let catIndex = w.globals.labels.indexOf(y)
      if (w.config.xaxis.convertedCatToNumeric) {
        catIndex = w.globals.categoryLabels.indexOf(y)
      }
      const xLabel = w.globals.dom.baseEl.querySelector(
        '.apexcharts-yaxis-texts-g text:nth-child(' + (catIndex + 1) + ')'
      )
      if (xLabel) {
        yP = parseFloat(xLabel.getAttribute('y'))
      }
    } else {
      let yPos
      if (w.config.yaxis[anno.yAxisIndex].logarithmic) {
        const coreUtils = new CoreUtils(this.annoCtx.ctx)
        y = coreUtils.getLogVal(y, anno.yAxisIndex)
        yPos = y / w.globals.yLogRatio[anno.yAxisIndex]
      } else {
        yPos =
          (y - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)
      }
      yP = w.globals.gridHeight - yPos

      if (anno.marker && (anno.y === undefined || anno.y === null)) {
        // point annotation
        yP = 0
      }

      if (
        w.config.yaxis[anno.yAxisIndex] &&
        w.config.yaxis[anno.yAxisIndex].reversed
      ) {
        yP = yPos
      }
    }

    if (typeof y === 'string' && y.indexOf('px') > -1) {
      yP = parseFloat(y)
    }

    return yP
  }

  getX1X2(type, anno) {
    const w = this.w
    let min = this.annoCtx.invertAxis ? w.globals.minY : w.globals.minX
    let max = this.annoCtx.invertAxis ? w.globals.maxY : w.globals.maxX
    const range = this.annoCtx.invertAxis
      ? w.globals.yRange[0]
      : w.globals.xRange

    let x1 = (anno.x - min) / (range / w.globals.gridWidth)

    if (this.annoCtx.inversedReversedAxis) {
      x1 = (max - anno.x) / (range / w.globals.gridWidth)
    }

    if (
      (w.config.xaxis.type === 'category' ||
        w.config.xaxis.convertedCatToNumeric) &&
      !this.annoCtx.invertAxis &&
      !w.globals.dataFormatXNumeric
    ) {
      x1 = this.getStringX(anno.x)
    }

    let x2 = (anno.x2 - min) / (range / w.globals.gridWidth)

    if (this.annoCtx.inversedReversedAxis) {
      x2 = (max - anno.x2) / (range / w.globals.gridWidth)
    }
    if (
      (w.config.xaxis.type === 'category' ||
        w.config.xaxis.convertedCatToNumeric) &&
      !this.annoCtx.invertAxis &&
      !w.globals.dataFormatXNumeric
    ) {
      x2 = this.getStringX(anno.x2)
    }

    if ((anno.x === undefined || anno.x === null) && anno.marker) {
      // point annotation in a horizontal chart
      x1 = w.globals.gridWidth
    }

    if (
      type === 'x1' &&
      typeof anno.x === 'string' &&
      anno.x.indexOf('px') > -1
    ) {
      x1 = parseFloat(anno.x)
    }

    if (
      type === 'x2' &&
      typeof anno.x2 === 'string' &&
      anno.x2.indexOf('px') > -1
    ) {
      x2 = parseFloat(anno.x2)
    }

    return type === 'x1' ? x1 : x2
  }

  getStringX(x) {
    const w = this.w
    let rX = x

    if (
      w.config.xaxis.convertedCatToNumeric &&
      w.globals.categoryLabels.length
    ) {
      x = w.globals.categoryLabels.indexOf(x) + 1
    }

    let catIndex = w.globals.labels.indexOf(x)

    const xLabel = w.globals.dom.baseEl.querySelector(
      '.apexcharts-xaxis-texts-g text:nth-child(' + (catIndex + 1) + ')'
    )

    if (xLabel) {
      rX = parseFloat(xLabel.getAttribute('x'))
    }

    return rX
  }
}
