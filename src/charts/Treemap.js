import '../libs/Treemap-squared'
import Graphics from '../modules/Graphics'
import Animations from '../modules/Animations'

import Utils from '../utils/Utils'

/**
 * ApexCharts TreemapChart Class.
 * @module TreemapChart
 **/

export default class TreemapChart {
  constructor(ctx, xyRatios) {
    this.ctx = ctx
    this.w = ctx.w

    this.labels = []
  }

  draw(series) {
    let w = this.w
    const graphics = new Graphics(this.ctx)

    let ret = graphics.group({
      class: 'apexcharts-treemap'
    })

    let ser = []
    series.forEach((s) => {
      ser.push(s)
    })

    w.config.series.forEach((s, i) => {
      s.data.forEach((l) => {
        if (!Array.isArray(this.labels[i])) this.labels[i] = []
        this.labels[i].push(l.x)
      })
    })

    console.log(this.labels)

    const nodes = window.TreemapSquared.generate(
      ser,
      w.globals.gridWidth,
      w.globals.gridHeight
    )

    nodes.forEach((node, i) => {
      let elSeries = graphics.group({
        class: `apexcharts-series apexcharts-treemap-series`,
        seriesName: Utils.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
        'data:realIndex': i
      })

      let elDataLabelWrap = graphics.group({
        class: 'apexcharts-data-labels'
      })

      node.forEach((r, j) => {
        const x1 = r[0]
        const y1 = r[1]
        const x2 = r[2]
        const y2 = r[3]
        let rect = graphics.drawRect(x1, y1, x2 - x1, y2 - y1)
        rect.attr({
          cx: x1,
          cy: y1
        })

        rect.node.classList.add('apexcharts-treemap-rect')

        rect.attr({
          fill: w.config.series[i].data[j].fillColor
        })

        rect.node.addEventListener(
          'mouseenter',
          graphics.pathMouseEnter.bind(this, rect)
        )
        rect.node.addEventListener(
          'mouseleave',
          graphics.pathMouseLeave.bind(this, rect)
        )
        rect.node.addEventListener(
          'mousedown',
          graphics.pathMouseDown.bind(this, rect)
        )

        if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
          let speed = 1
          if (!w.globals.resized) {
            speed = w.config.chart.animations.speed
          }
          this.animateTreemap(rect, x1, y1, x2 - x1, y2 - y1, speed)
        }

        const fontSize = this.getFontSize(r)

        const dataLabel = this.drawDataLabel(
          x1,
          y1,
          x2,
          y2,
          i,
          this.labels[i][j],
          fontSize
        )
        elDataLabelWrap.add(dataLabel)

        elSeries.add(rect)
        elSeries.add(elDataLabelWrap)
      })

      ret.add(elSeries)
    })

    return ret
  }

  // This calculates a font-size based upon
  // average label length and the size of the box the label is
  // going into. The maximum font size is set in chart config.
  getFontSize(coordinates) {
    const w = this.w

    // total length of labels (i.e [["Italy"],["Spain", "Greece"]] -> 16)
    function totalLabelLength(arr) {
      let i,
        total = 0
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += totalLabelLength(arr[i])
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += arr[i].length
        }
      }
      return total
    }

    // count of labels (i.e [["Italy"],["Spain", "Greece"]] -> 3)
    function countLabels(arr) {
      let i,
        total = 0
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += countLabels(arr[i])
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += 1
        }
      }
      return total
    }
    let averagelabelsize =
      totalLabelLength(this.labels) / countLabels(this.labels)

    function fontSize(width, height) {
      // the font size should be proportional to the size of the box (and the value)
      // otherwise you can end up creating a visual distortion where two boxes of identical
      // size have different sized labels, and thus make it look as if the two boxes
      // represent diffferent sizes
      let area = width * height
      let arearoot = Math.pow(area, 0.5)
      return Math.min(
        arearoot / averagelabelsize,
        w.config.plotOptions.treemap.dataLabels.maxFontSize
      )
    }

    return fontSize(
      coordinates[2] - coordinates[0],
      coordinates[3] - coordinates[1]
    )
  }

  drawDataLabel(x1, y1, x2, y2, i, text, fontSize) {
    const w = this.w
    const dataLabelsConfig = w.config.dataLabels.style
    const graphics = new Graphics(this.ctx)
    let elText = graphics.drawText({
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
      text,
      textAnchor: 'middle',
      foreColor: w.globals.dataLabels.style.colors[i],
      fontFamily: dataLabelsConfig.fontFamily,
      fontWeight: dataLabelsConfig.fontWeight,
      fontSize
    })

    let textRect = elText.node.getBBox()

    // if the label fits better sideways then rotate it
    if (textRect.width > x2 - x1 && textRect.width <= y2 - y1) {
      let labelRotatingCenter = graphics.rotateAroundCenter(elText.node)
      elText.attr({
        transform: 'rotate(-90)'
      })
      elText.node.setAttribute(
        'transform',
        `rotate(-90 ${labelRotatingCenter.x} ${labelRotatingCenter.y})`
      )
    }
    return elText
  }

  animateTreemap(el, x, y, width, height, speed) {
    const animations = new Animations(this.ctx)
    animations.animateRect(
      el,
      {
        x: x + width / 2,
        y: y + height / 2,
        width: 0,
        height: 0
      },
      {
        x,
        y,
        width,
        height
      },
      speed,
      () => {
        animations.animationCompleted(el)
      }
    )
  }

  animateRectColor(el, colorFrom, colorTo, speed) {
    el.attr({
      fill: colorFrom
    })
      .animate(speed)
      .attr({
        fill: colorTo
      })
  }
}
