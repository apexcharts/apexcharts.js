import Graphics from '../Graphics'
import Utils from '../../utils/Utils'

export default class DimYAxis {
  constructor(dCtx) {
    this.w = dCtx.w
    this.dCtx = dCtx
  }

  /**
   * Get Y Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getyAxisLabelsCoords() {
    let w = this.w

    let width = 0
    let height = 0
    let ret = []
    let labelPad = 10

    w.config.yaxis.map((yaxe, index) => {
      if (
        yaxe.show &&
        yaxe.labels.show &&
        w.globals.yAxisScale[index].result.length
      ) {
        let lbFormatter = w.globals.yLabelFormatters[index]

        // the second parameter -1 is the index of tick which user can use in the formatter
        let val = lbFormatter(w.globals.yAxisScale[index].niceMax, {
          seriesIndex: index,
          dataPointIndex: -1,
          w
        })
        let valArr = val

        // if user has specified a custom formatter, and the result is null or empty, we need to discard the formatter and take the value as it is.
        if (typeof val === 'undefined' || val.length === 0) {
          val = w.globals.yAxisScale[index].niceMax
        }

        if (w.globals.isBarHorizontal) {
          labelPad = 0

          let barYaxisLabels = w.globals.labels.slice()

          //  get the longest string from the labels array and also apply label formatter to it
          val = Utils.getLargestStringFromArr(barYaxisLabels)

          val = lbFormatter(val, { seriesIndex: index, dataPointIndex: -1, w })
          valArr = this.dCtx.dimHelpers.getLargestStringFromMultiArr(
            val,
            barYaxisLabels
          )
        }

        let graphics = new Graphics(this.dCtx.ctx)
        let rect = graphics.getTextRects(val, yaxe.labels.style.fontSize)
        let arrLabelrect = rect

        if (val !== valArr) {
          arrLabelrect = graphics.getTextRects(
            valArr,
            yaxe.labels.style.fontSize
          )
        }

        ret.push({
          width:
            (arrLabelrect.width > rect.width
              ? arrLabelrect.width
              : rect.width) + labelPad,
          height:
            arrLabelrect.height > rect.height
              ? arrLabelrect.height
              : rect.height
        })
      } else {
        ret.push({
          width,
          height
        })
      }
    })

    return ret
  }

  /**
   * Get Y Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getyAxisTitleCoords() {
    let w = this.w
    let ret = []

    w.config.yaxis.map((yaxe, index) => {
      if (yaxe.show && yaxe.title.text !== undefined) {
        let graphics = new Graphics(this.dCtx.ctx)
        let rect = graphics.getTextRects(
          yaxe.title.text,
          yaxe.title.style.fontSize,
          yaxe.title.style.fontFamily,
          'rotate(-90 0 0)',
          false
        )

        ret.push({
          width: rect.width,
          height: rect.height
        })
      } else {
        ret.push({
          width: 0,
          height: 0
        })
      }
    })

    return ret
  }

  getTotalYAxisWidth() {
    let w = this.w
    let yAxisWidth = 0
    let yAxisWidthLeft = 0
    let yAxisWidthRight = 0
    let padding = w.globals.yAxisScale.length > 1 ? 10 : 0

    const isHiddenYAxis = function(index) {
      return w.globals.ignoreYAxisIndexes.indexOf(index) > -1
    }

    const padForLabelTitle = (coord, index) => {
      let floating = w.config.yaxis[index].floating
      let width = 0

      if (coord.width > 0 && !floating) {
        width = coord.width + padding
        if (isHiddenYAxis(index)) {
          width = width - coord.width - padding
        }
      } else {
        width = floating || !w.config.yaxis[index].show ? 0 : 5
      }

      w.config.yaxis[index].opposite
        ? (yAxisWidthRight = yAxisWidthRight + width)
        : (yAxisWidthLeft = yAxisWidthLeft + width)

      yAxisWidth = yAxisWidth + width
    }

    w.globals.yLabelsCoords.map((yLabelCoord, index) => {
      padForLabelTitle(yLabelCoord, index)
    })

    w.globals.yTitleCoords.map((yTitleCoord, index) => {
      padForLabelTitle(yTitleCoord, index)
    })

    if (w.globals.isBarHorizontal) {
      yAxisWidth =
        w.globals.yLabelsCoords[0].width + w.globals.yTitleCoords[0].width + 15
    }

    this.dCtx.yAxisWidthLeft = yAxisWidthLeft
    this.dCtx.yAxisWidthRight = yAxisWidthRight

    return yAxisWidth
  }
}
