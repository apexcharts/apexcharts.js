import Helpers from './Helpers'

export default class YAnnotations {
  constructor(annoCtx) {
    this.w = annoCtx.w
    this.annoCtx = annoCtx

    this.helpers = new Helpers(this.annoCtx)
  }

  addYaxisAnnotation(anno, parent, index) {
    let w = this.w

    let strokeDashArray = anno.strokeDashArray

    let y1 = this.helpers.getY1Y2('y1', anno)
    let y2

    const text = anno.label.text

    if (anno.y2 === null || typeof anno.y2 === 'undefined') {
      let line = this.annoCtx.graphics.drawLine(
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
    } else {
      y2 = this.helpers.getY1Y2('y2', anno)

      if (y2 > y1) {
        let temp = y1
        y1 = y2
        y2 = temp
      }

      let rect = this.annoCtx.graphics.drawRect(
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
    let textX =
      anno.label.position === 'right'
        ? w.globals.gridWidth
        : anno.label.position === 'center'
        ? w.globals.gridWidth / 2
        : 0

    let elText = this.annoCtx.graphics.drawText({
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

  _getYAxisAnnotationWidth(anno) {
    // issue apexcharts.js#2009
    const w = this.w
    let width = w.globals.gridWidth
    if (anno.width.indexOf('%') > -1) {
      width = (w.globals.gridWidth * parseInt(anno.width, 10)) / 100
    } else {
      width = parseInt(anno.width, 10)
    }
    return width + anno.offsetX
  }

  drawYAxisAnnotations() {
    let w = this.w

    let elg = this.annoCtx.graphics.group({
      class: 'apexcharts-yaxis-annotations'
    })

    w.config.annotations.yaxis.map((anno, index) => {
      this.addYaxisAnnotation(anno, elg.node, index)
    })

    return elg
  }
}
