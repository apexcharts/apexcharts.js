// setLabelFormatters only ever assigned w.formatters.ttVal, so once a chart
// had a tooltip.y.formatter, removing it through updateOptions left the old
// formatter running in the tooltip.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

describe('tooltip.y.formatter removed through updateOptions', () => {
  it('stops formatting tooltip values', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 's', data: [1, 2, 3] }],
      tooltip: { y: { formatter: (v) => `$${v}` } },
    })
    const fmt = () =>
      String(
        chart.w.globals.tooltip.tooltipLabels
          .getFormatters(0)
          .yLbFormatter(2, { seriesIndex: 0, dataPointIndex: 0, w: chart.w }),
      )
    expect(fmt()).toBe('$2')

    await chart.updateOptions(
      { tooltip: { y: { formatter: undefined } } },
      false,
      false,
    )
    expect(chart.w.formatters.ttVal).toBeUndefined()
    expect(fmt()).not.toContain('$')
  })
})
