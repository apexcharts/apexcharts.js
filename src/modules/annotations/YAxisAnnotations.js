import Helpers from './Helpers'
import AxesUtils from '../axes/AxesUtils'

export default class YAnnotations {
  constructor(annoCtx) {
    this.w = annoCtx.w
    this.annoCtx = annoCtx

    this.helpers = new Helpers(this.annoCtx)
    this.axesUtils = new AxesUtils(this.annoCtx.w, { theme: this.annoCtx.theme, timeScale: this.annoCtx.timeScale })

  }

  addYaxisAnnotation(anno, parent, index) {
    const w = this.w

    const strokeDashArray = anno.strokeDashArray

    let result = this.helpers.getY1Y2('y1', anno)
    let y1 = result.yP
    const clipY1 = result.clipped
    let y2
    let clipY2 = true
    let drawn = false

    const text = anno.label.text

    if (anno.y2 === null || typeof anno.y2 === 'undefined') {
      if (!clipY1) {
        drawn = true
        const line = this.annoCtx.graphics.drawLine(
          0 + anno.offsetX, // x1
          y1 + anno.offsetY, // y1
          this._getYAxisAnnotationWidth(anno), // x2
          y1 + anno.offsetY, // y2
          anno.borderColor, // lineColor
          strokeDashArray, // dashArray
          anno.borderWidth
        )
        parent.appendChild(line.node)
        if (anno.id) {
          line.node.classList.add(anno.id)
        }
      }
    } else {
      result = this.helpers.getY1Y2('y2', anno)
      y2 = result.yP
      clipY2 = result.clipped

      if (y2 > y1) {
        const temp = y1
        y1 = y2
        y2 = temp
      }

      if (!(clipY1 && clipY2)) {
        drawn = true
        const rect = this.annoCtx.graphics.drawRect(
          0 + anno.offsetX, // x1
          y2 + anno.offsetY, // y1
          this._getYAxisAnnotationWidth(anno), // x2
          y1 - y2, // y2
          0, // radius
          anno.fillColor, // color
          anno.opacity, // opacity,
          1, // strokeWidth
          anno.borderColor, // strokeColor
          strokeDashArray // stokeDashArray
        )
        rect.node.classList.add('apexcharts-annotation-rect')
        rect.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)

        parent.appendChild(rect.node)
        if (anno.id) {
          rect.node.classList.add(anno.id)
        }
      }
    }
    if (drawn) {
      const textX =
        anno.label.position === 'right'
          ? w.layout.gridWidth
          : anno.label.position === 'center'
          ? w.layout.gridWidth / 2
          : 0

      const elText = this.annoCtx.graphics.drawText({
        x: textX + anno.label.offsetX,
        y: (y2 != null ? y2 : y1) + anno.label.offsetY - 3,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-yaxis-annotation-label ${
          anno.label.style.cssClass
        } ${anno.id ? anno.id : ''}`
      })

      elText.attr({
        rel: index
      })

      parent.appendChild(elText.node)
    }
  }

  _getYAxisAnnotationWidth(anno) {
    // issue apexcharts.js#2009
    const w = this.w
    let width = w.layout.gridWidth
    if (anno.width.indexOf('%') > -1) {
      width = (w.layout.gridWidth * parseInt(anno.width, 10)) / 100
    } else {
      width = parseInt(anno.width, 10)
    }
    return width + anno.offsetX
  }

  drawYAxisAnnotations() {
    const w = this.w

    const elg = this.annoCtx.graphics.group({
      class: 'apexcharts-yaxis-annotations'
    })

    w.config.annotations.yaxis.forEach((anno, index) => {
      anno.yAxisIndex = this.axesUtils.translateYAxisIndex(anno.yAxisIndex)
      if (
            !(this.axesUtils.isYAxisHidden(anno.yAxisIndex)
            && this.axesUtils.yAxisAllSeriesCollapsed(anno.yAxisIndex))
      ) {
        this.addYaxisAnnotation(anno, elg.node, index)
      }
    })

    return elg
  }
}
