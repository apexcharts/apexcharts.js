import Utils from '../../utils/Utils'

export default class PointAnnotations {
  constructor(annoCtx) {
    this.w = annoCtx.w
    this.annoCtx = annoCtx
  }

  addPointAnnotation(anno, parent, index) {
    const w = this.w

    let x = 0
    let y = 0
    let pointY = 0

    if (this.annoCtx.invertAxis) {
      console.warn(
        'Point annotation is not supported in horizontal bar charts.'
      )
    }

    if (typeof anno.x === 'string') {
      let catIndex = w.globals.labels.indexOf(anno.x)

      if (w.config.xaxis.convertedCatToNumeric) {
        catIndex = w.globals.categoryLabels.indexOf(anno.x)
      }

      x = this.annoCtx.helpers.getStringX(anno.x)

      let annoY = anno.y
      if (anno.y === null) {
        annoY = w.globals.series[anno.seriesIndex][catIndex]
      }
      y =
        w.globals.gridHeight -
        (annoY - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight) -
        parseFloat(anno.label.style.fontSize) -
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
          parseFloat(anno.label.style.fontSize) +
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
        parseFloat(anno.label.style.fontSize) -
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
          parseFloat(anno.label.style.fontSize) -
          anno.marker.size

        pointY =
          (anno.y - w.globals.minYArr[anno.yAxisIndex]) /
          (w.globals.yRange[anno.yAxisIndex] / w.globals.gridHeight)
      }
    }

    if (!Utils.isNumber(x)) return

    let optsPoints = {
      pSize: anno.marker.size,
      pWidth: anno.marker.strokeWidth,
      pointFillColor: anno.marker.fillColor,
      pointStrokeColor: anno.marker.strokeColor,
      shape: anno.marker.shape,
      radius: anno.marker.radius,
      class: `apexcharts-point-annotation-marker ${anno.marker.cssClass} ${
        anno.id ? anno.id : ''
      }`
    }

    let point = this.annoCtx.graphics.drawMarker(
      x + anno.marker.offsetX,
      pointY + anno.marker.offsetY,
      optsPoints
    )

    parent.appendChild(point.node)

    const text = anno.label.text ? anno.label.text : ''

    let elText = this.annoCtx.graphics.drawText({
      x: x + anno.label.offsetX,
      y: y + anno.label.offsetY,
      text,
      textAnchor: anno.label.textAnchor,
      fontSize: anno.label.style.fontSize,
      fontFamily: anno.label.style.fontFamily,
      fontWeight: anno.label.style.fontWeight,
      foreColor: anno.label.style.color,
      cssClass: `apexcharts-point-annotation-label ${
        anno.label.style.cssClass
      } ${anno.id ? anno.id : ''}`
    })

    elText.attr({
      rel: index
    })

    parent.appendChild(elText.node)

    // TODO: deprecate this as we will use custom
    if (anno.customSVG.SVG) {
      let g = this.annoCtx.graphics.group({
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

    if (anno.image.path) {
      let imgWidth = anno.image.width ? anno.image.width : 20
      let imgHeight = anno.image.height ? anno.image.height : 20

      this.annoCtx.addImage(
        {
          x: x + anno.image.offsetX - imgWidth / 2,
          y: y + anno.image.offsetY - imgHeight / 2,
          width: imgWidth,
          height: imgHeight,
          path: anno.image.path,
          appendTo: parent
        },
        false,
        this.annoCtx.ctx
      )
    }
  }

  drawPointAnnotations() {
    let w = this.w

    let elg = this.annoCtx.graphics.group({
      class: 'apexcharts-point-annotations'
    })

    w.config.annotations.points.map((anno, index) => {
      this.addPointAnnotation(anno, elg.node, index)
    })

    return elg
  }
}
