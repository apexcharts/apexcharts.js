export default class YAnnotations {
  constructor(annoCtx) {
    this.w = annoCtx.w
    this.annoCtx = annoCtx
  }

  addYaxisAnnotation(anno, parent, index) {
    let w = this.w

    let strokeDashArray = anno.strokeDashArray

    let y1
    let y2

    if (this.annoCtx.invertAxis) {
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
      let line = this.annoCtx.graphics.drawLine(
        0 + anno.offsetX, // x1
        y1 + anno.offsetY, // y1
        w.globals.gridWidth + anno.offsetX, // x2
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
      if (this.annoCtx.invertAxis) {
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
        let rect = this.annoCtx.graphics.drawRect(
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
        if (anno.id) {
          rect.node.classList.add(anno.id)
        }
      }
    }
    let textX = anno.label.position === 'right' ? w.globals.gridWidth : 0

    let elText = this.annoCtx.graphics.drawText({
      x: textX + anno.label.offsetX,
      y: (y2 || y1) + anno.label.offsetY - 3,
      text,
      textAnchor: anno.label.textAnchor,
      fontSize: anno.label.style.fontSize,
      fontFamily: anno.label.style.fontFamily,
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
