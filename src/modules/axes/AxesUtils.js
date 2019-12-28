import Formatters from '../Formatters'
import Graphics from '../Graphics'

export default class AxesUtils {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  // Based on the formatter function, get the label text and position
  getLabel(labels, timescaleLabels, x, i, drawnLabels = []) {
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

    if (axisTicks.show && tickAmount > 0) {
      if (w.config.yaxis[realIndex].opposite === true) x = x + axisTicks.width

      for (let i = tickAmount; i >= 0; i--) {
        let tY =
          t + tickAmount / 10 + w.config.yaxis[realIndex].labels.offsetY - 1
        if (w.globals.isBarHorizontal) {
          tY = labelsDivider * i
        }

        if (i === tickAmount) {
          tY = tY + 1
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
