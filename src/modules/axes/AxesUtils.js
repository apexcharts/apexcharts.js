// @ts-check
import Formatters from '../Formatters'
import Graphics from '../Graphics'
import CoreUtils from '../CoreUtils'
import DateTime from '../../utils/DateTime'

export default class AxesUtils {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w, { theme = null, timeScale = null } = {}) {
    this.w = w
    /** @type {any} */
    this.theme = theme
    /** @type {any} */
    this.timeScale = timeScale
  }

  // Based on the formatter function, get the label text and position
  /**
   * @param {any[]} labels
   * @param {Array<Record<string, any>>} timescaleLabels
   * @param {number} x
   * @param {number} i
   * @param {any[]} drawnLabels
   */
  getLabel(
    labels,
    timescaleLabels,
    x,
    i,
    drawnLabels = [],
    fontSize = '12px',
    isLeafGroup = true,
  ) {
    const w = this.w
    const rawLabel = typeof labels[i] === 'undefined' ? '' : labels[i]
    let label = rawLabel

    const xlbFormatter = w.formatters.xLabelFormatter
    const customFormatter = w.config.xaxis.labels.formatter

    const xFormat = new Formatters(this.w)
    const timestamp = rawLabel

    if (isLeafGroup) {
      label = /** @type {any} */ (xFormat).xLabelFormat(
        xlbFormatter,
        rawLabel,
        timestamp,
        {
          i,
          dateFormatter: new DateTime(this.w).formatDate,
          w,
        },
      )

      if (customFormatter !== undefined) {
        label = customFormatter(rawLabel, labels[i], {
          i,
          dateFormatter: new DateTime(this.w).formatDate,
          w,
        })
      }
    }

    if (timescaleLabels.length > 0) {
      x = timescaleLabels[i].position
      label = timescaleLabels[i].value
    } else {
      if (w.config.xaxis.type === 'datetime' && customFormatter === undefined) {
        label = ''
      }
    }

    if (typeof label === 'undefined') label = ''

    label = Array.isArray(label) ? label : label.toString()

    const graphics = new Graphics(this.w)
    let textRect = {}
    if (w.layout.rotateXLabels && isLeafGroup) {
      textRect = graphics.getTextRects(
        label,
        parseInt(fontSize, 10).toString(),
        null,
        `rotate(${w.config.xaxis.labels.rotate} 0 0)`,
        false,
      )
    } else {
      textRect = graphics.getTextRects(label, parseInt(fontSize, 10).toString())
    }

    const allowDuplicatesInTimeScale =
      !w.config.xaxis.labels.showDuplicates && this.timeScale

    if (
      !Array.isArray(label) &&
      (String(label) === 'NaN' ||
        (drawnLabels.indexOf(label) >= 0 && allowDuplicatesInTimeScale))
    ) {
      label = ''
    }

    return {
      x,
      text: label,
      textRect,
    }
  }

  /**
   * @param {number} i
   * @param {any} label
   * @param {number} labelsLen
   */
  checkLabelBasedOnTickamount(i, label, labelsLen) {
    const w = this.w

    let ticks = w.config.xaxis.tickAmount
    if (ticks === 'dataPoints') ticks = Math.round(w.layout.gridWidth / 120)

    if (ticks > labelsLen) return label
    const tickMultiple = Math.round(labelsLen / (ticks + 1))

    if (i % tickMultiple === 0) {
      return label
    } else {
      /** @type {any} */ ;(label).text = ''
    }

    return label
  }

  /**
   * @param {number} i
   * @param {any} label
   * @param {number} labelsLen
   * @param {any[]} drawnLabels
   * @param {Array<Record<string, any>>} drawnLabelsRects
   */
  checkForOverflowingLabels(
    i,
    label,
    labelsLen,
    drawnLabels,
    drawnLabelsRects,
  ) {
    const w = this.w

    if (i === 0) {
      // check if first label is being truncated
      if (w.globals.skipFirstTimelinelabel) {
        /** @type {any} */ ;(label).text = ''
      }
    }

    if (i === labelsLen - 1) {
      // check if last label is being truncated
      if (w.globals.skipLastTimelinelabel) {
        /** @type {any} */ ;(label).text = ''
      }
    }

    if (w.config.xaxis.labels.hideOverlappingLabels && drawnLabels.length > 0) {
      const prev = drawnLabelsRects[drawnLabelsRects.length - 1]
      if (w.config.xaxis.labels.trim && w.config.xaxis.type !== 'datetime') {
        return label
      }
      if (
        /** @type {any} */ (label).x <
        prev.textRect.width /
          (w.layout.rotateXLabels
            ? Math.abs(w.config.xaxis.labels.rotate) / 12
            : 1.01) +
          prev.x
      ) {
        /** @type {any} */ ;(label).text = ''
      }
    }

    return label
  }

  /**
   * @param {number} i
   * @param {any[]} labels
   */
  checkForReversedLabels(i, labels) {
    const w = this.w
    if (w.config.yaxis[i] && w.config.yaxis[i].reversed) {
      labels.reverse()
    }
    return labels
  }

  /**
   * @param {number} index
   */
  yAxisAllSeriesCollapsed(index) {
    const gl = this.w.globals

    /**
     * @param {number} si
     */
    return !gl.seriesYAxisMap[index].some((si) => {
      return gl.collapsedSeriesIndices.indexOf(si) === -1
    })
  }

  // Method to translate annotation.yAxisIndex values from
  // seriesName-as-a-string values to seriesName-as-an-array values (old style
  // series mapping to new style).
  /**
   * @param {number} index
   */
  translateYAxisIndex(index) {
    const w = this.w
    const gl = w.globals
    const yaxis = w.config.yaxis
    const newStyle =
      w.seriesData.series.length > yaxis.length ||
      /**
       * @param {Record<string, any>} a
       */
      yaxis.some((a) => Array.isArray(a.seriesName))
    if (newStyle) {
      return index
    } else {
      return gl.seriesYAxisReverseMap[index]
    }
  }

  /**
   * @param {number} index
   */
  isYAxisHidden(index) {
    const w = this.w
    const yaxis = w.config.yaxis[index]

    if (!yaxis.show || this.yAxisAllSeriesCollapsed(index)) {
      return true
    }
    if (!yaxis.showForNullSeries) {
      const seriesIndices = w.globals.seriesYAxisMap[index]
      const coreUtils = new CoreUtils(this.w)
      /**
       * @param {number} si
       */
      return seriesIndices.every((si) => coreUtils.isSeriesNull(si))
    }
    return false
  }

  // get the label color for y-axis
  // realIndex is the actual series index, while i is the tick Index
  /**
   * @param {string[]} yColors
   * @param {number} realIndex
   */
  getYAxisForeColor(yColors, realIndex) {
    const w = this.w
    if (Array.isArray(yColors) && w.globals.yAxisScale[realIndex]) {
      this.theme?.pushExtraColors(
        yColors,
        w.globals.yAxisScale[realIndex].result.length,
        false,
      )
    }
    return yColors
  }

  /**
   * @param {number} x
   * @param {number} tickAmount
   * @param {Record<string, any>} axisBorder
   * @param {Record<string, any>} axisTicks
   * @param {number} realIndex
   * @param {any} labelsDivider
   * @param {any} elYaxis
   */
  drawYAxisTicks(
    x,
    tickAmount,
    axisBorder,
    axisTicks,
    realIndex,
    labelsDivider,
    elYaxis,
  ) {
    const w = this.w
    const graphics = new Graphics(this.w)

    // initial label position = 0;
    let tY = w.layout.translateY + w.config.yaxis[realIndex].labels.offsetY
    if (w.globals.isBarHorizontal) {
      tY = 0
    } else if (w.config.chart.type === 'heatmap') {
      tY += labelsDivider / 2
    }

    if (axisTicks.show && tickAmount > 0) {
      if (w.config.yaxis[realIndex].opposite === true) x = x + axisTicks.width

      for (let i = tickAmount; i >= 0; i--) {
        const elTick = graphics.drawLine(
          x + axisBorder.offsetX - axisTicks.width + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          x + axisBorder.offsetX + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          axisTicks.color,
        )
        elYaxis.add(elTick)
        tY += labelsDivider
      }
    }
  }
}
