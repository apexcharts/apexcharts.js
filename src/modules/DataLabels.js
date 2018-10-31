import Scatter from './../charts/Scatter'
import Graphics from './Graphics'
import Filters from './Filters'

/**
 * ApexCharts DataLabels Class for drawing dataLabels on Axes based Charts.
 *
 * @module DataLabels
 **/

class DataLabels {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  // When there are many datalabels to be printed, and some of them overlaps each other in the same series, this method will take care of that
  // Also, when datalabels exceeds the drawable area and get clipped off, we need to adjust and move some pixels to make them visible again
  dataLabelsCorrection (x, y, val, i, realIndexP, alwaysDrawDataLabel, fontSize) {
    let w = this.w
    let graphics = new Graphics(this.ctx)
    let drawnextLabel = false //

    let textRects = graphics.getTextRects(val, fontSize)
    let width = textRects.width
    let height = textRects.height

    // first value in series, so push an empty array
    if (typeof w.globals.dataLabelsRects[i] === 'undefined') w.globals.dataLabelsRects[i] = []

    // then start pushing actual rects in that sub-array
    w.globals.dataLabelsRects[i].push({x, y, width, height})

    let len = w.globals.dataLabelsRects[i].length - 2
    let lastDrawnIndex = typeof w.globals.lastDrawnDataLabelsIndexes[i] !== 'undefined' ? w.globals.lastDrawnDataLabelsIndexes[i][w.globals.lastDrawnDataLabelsIndexes[i].length - 1] : 0

    if (typeof w.globals.dataLabelsRects[i][len] !== 'undefined') {
      let lastDataLabelRect = w.globals.dataLabelsRects[i][lastDrawnIndex]
      if (
        // next label forward and x not intersecting
        x > (lastDataLabelRect.x + lastDataLabelRect.width + 2) ||
          y > (lastDataLabelRect.y + lastDataLabelRect.height + 2) ||
          (x + width < lastDataLabelRect.x) // next label is going to be drawn backwards
      ) {
        // the 2 indexes don't override, so OK to draw next label
        drawnextLabel = true
      }
    }

    if (realIndexP === 0 || alwaysDrawDataLabel) {
      drawnextLabel = true
    }

    return {
      x,
      y,
      drawnextLabel
    }
  }

  drawDataLabel (pos, i, j, z = null) {
    // this method handles line, area, bubble, scatter charts as those charts contains markers/points which have pre-defined x/y positions
    // all other charts like bars / heatmaps will define their own drawDataLabel routine
    let w = this.w
    const graphics = new Graphics(this.ctx)

    let dataLabelsConfig = w.config.dataLabels

    let x = 0
    let y = 0

    let realIndexP = j

    let elDataLabelsWrap = null

    if (!dataLabelsConfig.enabled || pos.x instanceof Array !== true) {
      return elDataLabelsWrap
    }

    elDataLabelsWrap = graphics.group({
      class: 'apexcharts-data-labels'
    })

    for (let q = 0; q < pos.x.length; q++) {
      x = pos.x[q] + dataLabelsConfig.offsetX
      y = pos.y[q] + dataLabelsConfig.offsetY - w.globals.markers.size[i] - 5

      if (!isNaN(x)) {
        // a small hack as we have 2 points for the first val to connect it
        if (j === 1 && q === 0) realIndexP = 0
        if (j === 1 && q === 1) realIndexP = 1

        let val = w.globals.series[i][realIndexP]

        let text = ''

        if (w.config.chart.type === 'bubble') {
          text = w.globals.seriesZ[i][realIndexP]
          y = pos.y[q] + w.config.dataLabels.offsetY
          const scatter = new Scatter(this.ctx)
          let centerTextInBubbleCoords = scatter.centerTextInBubble(y, i, realIndexP)
          y = centerTextInBubbleCoords.y
        } else {
          if (typeof val !== 'undefined') {
            text = w.config.dataLabels.formatter(val, { seriesIndex: i, dataPointIndex: realIndexP, globals: w.globals })
          }
        }

        this.plotDataLabelsText(x, y, text, i, realIndexP, elDataLabelsWrap, w.config.dataLabels)
      }
    }

    return elDataLabelsWrap
  }

  plotDataLabelsText (x, y, text, i, j, elToAppendTo, dataLabelsConfig, alwaysDrawDataLabel = false) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let correctedLabels = this.dataLabelsCorrection(
      x,
      y,
      text,
      i,
      j,
      alwaysDrawDataLabel,
      parseInt(dataLabelsConfig.style.fontSize)
    )

    // when zoomed, we don't need to correct labels offsets,
    // but if normally, labels get cropped, correct them
    if (!w.globals.zoomed) {
      x = correctedLabels.x
      y = correctedLabels.y
    }

    if (correctedLabels.drawnextLabel) {
      let dataLabelText = graphics.drawText({
        width: 100,
        height: parseInt(dataLabelsConfig.style.fontSize),
        x: x,
        y: y,
        foreColor: w.globals.dataLabels.style.colors[i],
        textAnchor: dataLabelsConfig.textAnchor,
        text: text,
        fontSize: dataLabelsConfig.style.fontSize,
        fontFamily: dataLabelsConfig.style.fontFamily
      })

      dataLabelText.attr({
        class: 'apexcharts-datalabel',
        cx: x,
        cy: y,
        'clip-path': `url(#gridRectMask${w.globals.cuid})`
      })

      if (dataLabelsConfig.dropShadow.enabled) {
        const textShadow = dataLabelsConfig.dropShadow
        const filters = new Filters(this.ctx)
        filters.dropShadow(dataLabelText, textShadow)
      }

      elToAppendTo.add(dataLabelText)

      if (typeof w.globals.lastDrawnDataLabelsIndexes[i] === 'undefined') {
        w.globals.lastDrawnDataLabelsIndexes[i] = []
      }

      w.globals.lastDrawnDataLabelsIndexes[i].push(j)
    }
  }
}

export default DataLabels
