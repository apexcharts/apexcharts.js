import Formatters from '../Formatters'
import Graphics from '../Graphics'

export default class AxesUtils {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  // Based on the formatter function, get the label text and position
  getLabel(labels, timelineLabels, x, i, drawnLabels = []) {
    const w = this.w
    let rawLabel = typeof labels[i] === 'undefined' ? '' : labels[i]
    let label

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
      timelineLabels.forEach((t) => {
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
    if (timelineLabels.length > 0) {
      isBold = determineHighestUnit(timelineLabels[i].unit)
      x = timelineLabels[i].position
      label = timelineLabels[i].value
    } else {
      if (w.config.xaxis.type === 'datetime' && customFormatter === undefined) {
        label = ''
      }
    }

    if (typeof label === 'undefined') label = ''

    label = label.toString()

    if (
      label.indexOf('NaN') === 0 ||
      label.toLowerCase().indexOf('invalid') === 0 ||
      label.toLowerCase().indexOf('infinity') >= 0 ||
      (drawnLabels.indexOf(label) >= 0 && !w.config.xaxis.labels.showDuplicates)
    ) {
      label = ''
    }

    return {
      x,
      text: label,
      isBold
    }
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

    if (axisTicks.show) {
      if (w.config.yaxis[realIndex].opposite === true) x = x + axisTicks.width

      for (let i = tickAmount; i >= 0; i--) {
        let tY =
          t + tickAmount / 10 + w.config.yaxis[realIndex].labels.offsetY - 1
        if (w.globals.isBarHorizontal) {
          tY = labelsDivider * i
        }
        let elTick = graphics.drawLine(
          x + axisBorder.offsetX - axisTicks.width + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          x + axisBorder.offsetX + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          axisBorder.color
        )
        elYaxis.add(elTick)
        t = t + labelsDivider
      }
    }
  }
}
