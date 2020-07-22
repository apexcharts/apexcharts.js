import Formatters from '../Formatters'
import Graphics from '../Graphics'
import CoreUtils from '../CoreUtils'

export default class AxesUtils {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  // Based on the formatter function, get the label text and position
  getLabel(labels, timescaleLabels, x, i, drawnLabels = [], fontSize = '12px') {
    const w = this.w
    let rawLabel = typeof labels[i] === 'undefined' ? '' : labels[i]
    let label = rawLabel

    let xlbFormatter = w.globals.xLabelFormatter
    let customFormatter = w.config.xaxis.labels.formatter

    let isBold = false

    let xFormat = new Formatters(this.ctx)
    let timestamp = rawLabel
    label = xFormat.xLabelFormat(xlbFormatter, rawLabel, timestamp)

    if (customFormatter !== undefined) {
      label = customFormatter(rawLabel, labels[i], i)
    }

    const determineHighestUnit = (unit) => {
      let highestUnit = null
      timescaleLabels.forEach((t) => {
        if (t.unit === 'month') {
          highestUnit = 'year'
        } else if (t.unit === 'day') {
          highestUnit = 'month'
        } else if (t.unit === 'hour') {
          highestUnit = 'day'
        } else if (t.unit === 'minute') {
          highestUnit = 'hour'
        }
      })

      return highestUnit === unit
    }
    if (timescaleLabels.length > 0) {
      isBold = determineHighestUnit(timescaleLabels[i].unit)
      x = timescaleLabels[i].position
      label = timescaleLabels[i].value
    } else {
      if (w.config.xaxis.type === 'datetime' && customFormatter === undefined) {
        label = ''
      }
    }

    if (typeof label === 'undefined') label = ''

    label = Array.isArray(label) ? label : label.toString()

    let graphics = new Graphics(this.ctx)
    let textRect = {}
    if (w.globals.rotateXLabels) {
      textRect = graphics.getTextRects(
        label,
        parseInt(fontSize, 10),
        null,
        `rotate(${w.config.xaxis.labels.rotate} 0 0)`,
        false
      )
    } else {
      textRect = graphics.getTextRects(label, parseInt(fontSize, 10))
    }

    if (
      !Array.isArray(label) &&
      (label.indexOf('NaN') === 0 ||
        label.toLowerCase().indexOf('invalid') === 0 ||
        label.toLowerCase().indexOf('infinity') >= 0 ||
        (drawnLabels.indexOf(label) >= 0 &&
          !w.config.xaxis.labels.showDuplicates &&
          this.ctx.timeScale.tickInterval !== 'hours' &&
          this.ctx.timeScale.tickInterval !== 'minutes'))
    ) {
      label = ''
    }

    return {
      x,
      text: label,
      textRect,
      isBold
    }
  }

  checkForOverflowingLabels(
    i,
    label,
    labelsLen,
    drawnLabels,
    drawnLabelsRects
  ) {
    const w = this.w

    if (i === 0) {
      // check if first label is being truncated
      if (w.globals.skipFirstTimelinelabel) {
        label.text = ''
      }
    }

    if (i === labelsLen - 1) {
      // check if last label is being truncated
      if (w.globals.skipLastTimelinelabel) {
        label.text = ''
      }
    }

    if (w.config.xaxis.labels.hideOverlappingLabels && drawnLabels.length > 0) {
      const prev = drawnLabelsRects[drawnLabelsRects.length - 1]
      if (
        label.x <
        prev.textRect.width /
          (w.globals.rotateXLabels
            ? Math.abs(w.config.xaxis.labels.rotate) / 12
            : 1.01) +
          prev.x
      ) {
        label.text = ''
      }
    }

    return label
  }

  checkForReversedLabels(i, labels) {
    const w = this.w
    if (w.config.yaxis[i] && w.config.yaxis[i].reversed) {
      labels.reverse()
    }
    return labels
  }

  isYAxisHidden(index) {
    const w = this.w
    const coreUtils = new CoreUtils(this.ctx)

    return (
      !w.config.yaxis[index].show ||
      (!w.config.yaxis[index].showForNullSeries &&
        coreUtils.isSeriesNull(index) &&
        w.globals.collapsedSeriesIndices.indexOf(index) === -1)
    )
  }

  drawYAxisTicks(
    x,
    tickAmount,
    axisBorder,
    axisTicks,
    realIndex,
    labelsDivider,
    elYaxis
  ) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    // initial label position = 0;
    let t = w.globals.translateY

    if (axisTicks.show && tickAmount > 0) {
      if (w.config.yaxis[realIndex].opposite === true) x = x + axisTicks.width

      for (let i = tickAmount; i >= 0; i--) {
        let tY =
          t + tickAmount / 10 + w.config.yaxis[realIndex].labels.offsetY - 1
        if (w.globals.isBarHorizontal) {
          tY = labelsDivider * i
        }

        if (w.config.chart.type === 'heatmap') {
          tY = tY + labelsDivider / 2
        }
        let elTick = graphics.drawLine(
          x + axisBorder.offsetX - axisTicks.width + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          x + axisBorder.offsetX + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          axisTicks.color
        )
        elYaxis.add(elTick)
        t = t + labelsDivider
      }
    }
  }
}
