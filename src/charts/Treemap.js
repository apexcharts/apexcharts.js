import '../libs/Treemap-squared'
import * as Graphics from '../modules/Graphics'
import * as Animations from '../modules/Animations'
import * as Fill from '../modules/Fill'
import Helpers from './common/treemap/Helpers'
import * as Filters from '../modules/Filters'

import Utils from '../utils/Utils'

/**
 * ApexCharts TreemapChart Class.
 * @module TreemapChart
 **/

export class TreemapChart {
  constructor(ctx, xyRatios) {
    this.ctx = ctx
    this.w = ctx.w

    this.strokeWidth = this.w.config.stroke.width
    this.helpers = new Helpers(ctx)
    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation

    this.labels = []
  }

  draw(series) {
    let w = this.w

    let ret = Graphics.group(this.ctx, {
      class: 'apexcharts-treemap',
    })

    if (w.globals.noData) return ret

    let ser = []
    series.forEach((s) => {
      let d = s.map((v) => {
        return Math.abs(v)
      })
      ser.push(d)
    })

    this.negRange = this.helpers.checkColorRange()

    w.config.series.forEach((s, i) => {
      s.data.forEach((l) => {
        if (!Array.isArray(this.labels[i])) this.labels[i] = []
        this.labels[i].push(l.x)
      })
    })

    const nodes = window.TreemapSquared.generate(
      ser,
      w.globals.gridWidth,
      w.globals.gridHeight
    )

    nodes.forEach((node, i) => {
      let elSeries = Graphics.group(this.ctx, {
        class: `apexcharts-series apexcharts-treemap-series`,
        seriesName: Utils.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
        'data:realIndex': i,
      })

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        // const filters = new Filters(this.ctx) // Удалено
        Filters.dropShadow(this.ctx, elSeries, shadow, i)
      }

      let elDataLabelWrap = Graphics.group(this.ctx, {
        class: 'apexcharts-data-labels',
      })

      let bounds = {
        xMin: Infinity,
        yMin: Infinity,
        xMax: -Infinity,
        yMax: -Infinity,
      }

      node.forEach((r, j) => {
        const x1 = r[0]
        const y1 = r[1]
        const x2 = r[2]
        const y2 = r[3]

        bounds.xMin = Math.min(bounds.xMin, x1)
        bounds.yMin = Math.min(bounds.yMin, y1)
        bounds.xMax = Math.max(bounds.xMax, x2)
        bounds.yMax = Math.max(bounds.yMax, y2)

        let colorProps = this.helpers.getShadeColor(
          w.config.chart.type,
          i,
          j,
          this.negRange
        )
        let color = colorProps.color

        let pathFill = Fill.fillPath(this.ctx, {
          color,
          seriesNumber: i,
          dataPointIndex: j,
        })

        let elRect = Graphics.drawRect(
          this.ctx,
          x1,
          y1,
          x2 - x1,
          y2 - y1,
          w.config.plotOptions.treemap.borderRadius,
          '#fff',
          1,
          this.strokeWidth,
          w.config.plotOptions.treemap.useFillColorAsStroke
            ? color
            : w.globals.stroke.colors[i]
        )

        elRect.attr({
          cx: x1,
          cy: y1,
          index: i,
          i,
          j,
          width: x2 - x1,
          height: y2 - y1,
          fill: pathFill,
        })

        elRect.node.classList.add('apexcharts-treemap-rect')

        this.helpers.addListeners(elRect)

        let fromRect = {
          x: x1 + (x2 - x1) / 2,
          y: y1 + (y2 - y1) / 2,
          width: 0,
          height: 0,
        }
        let toRect = {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
        }

        if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
          let speed = 1
          if (!w.globals.resized) {
            speed = w.config.chart.animations.speed
          }
          this.animateTreemap(elRect, fromRect, toRect, speed)
        }
        if (w.globals.dataChanged) {
          let speed = 1
          if (this.dynamicAnim.enabled && w.globals.shouldAnimate) {
            speed = this.dynamicAnim.speed

            if (
              w.globals.previousPaths[i] &&
              w.globals.previousPaths[i][j] &&
              w.globals.previousPaths[i][j].rect
            ) {
              fromRect = w.globals.previousPaths[i][j].rect
            }

            this.animateTreemap(elRect, fromRect, toRect, speed)
          }
        }

        let fontSize = this.getFontSize(r)

        let formattedText = w.config.dataLabels.formatter(this.labels[i][j], {
          value: w.globals.series[i][j],
          seriesIndex: i,
          dataPointIndex: j,
          w,
        })
        if (w.config.plotOptions.treemap.dataLabels.format === 'truncate') {
          fontSize = parseInt(w.config.dataLabels.style.fontSize, 10)
          formattedText = this.truncateLabels(
            formattedText,
            fontSize,
            x1,
            y1,
            x2,
            y2
          )
        }
        let dataLabels = null
        if (w.globals.series[i][j]) {
          dataLabels = this.helpers.calculateDataLabels({
            text: formattedText,
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2 + this.strokeWidth / 2 + fontSize / 3,
            i,
            j,
            colorProps,
            fontSize,
            series,
          })
        }
        if (w.config.dataLabels.enabled && dataLabels) {
          this.rotateToFitLabel(
            dataLabels,
            fontSize,
            formattedText,
            x1,
            y1,
            x2,
            y2
          )
        }
        elSeries.add(elRect)
        if (dataLabels !== null) {
          elSeries.add(dataLabels)
        }
      })

      const seriesTitle = w.config.plotOptions.treemap.seriesTitle
      if (w.config.series.length > 1 && seriesTitle && seriesTitle.show) {
        const sName = w.config.series[i].name || ''

        if (sName && bounds.xMin < Infinity && bounds.yMin < Infinity) {
          const {
            offsetX,
            offsetY,
            borderColor,
            borderWidth,
            borderRadius,
            style,
          } = seriesTitle

          const textColor = style.color || w.config.chart.foreColor
          const padding = {
            left: style.padding.left,
            right: style.padding.right,
            top: style.padding.top,
            bottom: style.padding.bottom,
          }

          const textSize = Graphics.getTextRects(
            this.ctx,
            sName,
            style.fontSize,
            style.fontFamily
          )
          const labelRectWidth = textSize.width + padding.left + padding.right
          const labelRectHeight = textSize.height + padding.top + padding.bottom

          // Position
          const labelX = bounds.xMin + (offsetX || 0)
          const labelY = bounds.yMin + (offsetY || 0)

          // Draw background rect
          const elLabelRect = Graphics.drawRect(
            this.ctx,
            labelX,
            labelY,
            labelRectWidth,
            labelRectHeight,
            borderRadius,
            style.background,
            1,
            borderWidth,
            borderColor
          )

          const elLabelText = Graphics.drawText(this.ctx, {
            x: labelX + padding.left,
            y: labelY + padding.top + textSize.height * 0.75,
            text: sName,
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            foreColor: textColor,
            cssClass: style.cssClass || '',
          })

          elSeries.add(elLabelRect)
          elSeries.add(elLabelText)
        }
      }

      elSeries.add(elDataLabelWrap)
      ret.add(elSeries)
    })

    return ret
  }

  // This calculates a font-size based upon
  // average label length and the size of the box
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
      let area = width * height
      let arearoot = Math.pow(area, 0.5)
      return Math.min(
        arearoot / averagelabelsize,
        parseInt(w.config.dataLabels.style.fontSize, 10)
      )
    }

    return fontSize(
      coordinates[2] - coordinates[0],
      coordinates[3] - coordinates[1]
    )
  }

  rotateToFitLabel(elText, fontSize, text, x1, y1, x2, y2) {
    const textRect = Graphics.getTextRects(this.ctx, text, fontSize)

    // if the label fits better sideways then rotate it
    if (
      textRect.width + this.w.config.stroke.width + 5 > x2 - x1 &&
      textRect.width <= y2 - y1
    ) {
      let labelRotatingCenter = Graphics.rotateAroundCenter(elText.node)

      elText.node.setAttribute(
        'transform',
        `rotate(-90 ${labelRotatingCenter.x} ${
          labelRotatingCenter.y
        }) translate(${textRect.height / 3})`
      )
    }
  }

  // This is an alternative label formatting method that uses a
  // consistent font size, and trims the edge of long labels
  truncateLabels(text, fontSize, x1, y1, x2, y2) {
    const textRect = Graphics.getTextRects(this.ctx, text, fontSize)

    // Determine max width based on ideal orientation of text
    const labelMaxWidth =
      textRect.width + this.w.config.stroke.width + 5 > x2 - x1 &&
      y2 - y1 > x2 - x1
        ? y2 - y1
        : x2 - x1
    const truncatedText = Graphics.getTextBasedOnMaxWidth(this.ctx, {
      text: text,
      maxWidth: labelMaxWidth,
      fontSize: fontSize,
    })

    // Return empty label when text has been trimmed for very small rects
    if (text.length !== truncatedText.length && labelMaxWidth / fontSize < 5) {
      return ''
    } else {
      return truncatedText
    }
  }

  animateTreemap(el, fromRect, toRect, speed) {
    Animations.animateRect(el, fromRect, toRect, speed, () => {
      Animations.animationCompleted(this.ctx, el)
    })
  }
}

export default TreemapChart
