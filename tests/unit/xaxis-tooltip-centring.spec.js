/**
 * The x-axis tooltip is centred on the crosshair at the width it has for
 * the label it is showing, not the one before it.
 */
import { describe, it, expect, vi } from 'vitest'
import Graphics from '../../src/modules/Graphics.js'
import { createChartWithOptions } from './utils/utils.js'

describe('x-axis tooltip centring', () => {
  it('centres on the width it has for the current label', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', height: 300, width: 600 },
      xaxis: {
        categories: ['September', 'May', 'June'],
        tooltip: { enabled: true },
      },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    const w = chart.w
    const tt = chart.ctx.tooltip
    const box = tt.xaxisTooltip
    const text = tt.xaxisTooltipText
    // The box is as wide as its text's min-width, as a shrink-to-fit box
    // whose min-width exceeds its content is.
    box.getBoundingClientRect = () => ({
      width: parseFloat(text.style.minWidth) || 0,
    })
    const measure = vi
      .spyOn(Graphics.prototype, 'getTextRects')
      .mockImplementation((t) => ({ width: String(t).length * 7, height: 12 }))

    text.innerHTML = 'September'
    tt.tooltipPosition.moveXAxisTooltip(200)
    text.innerHTML = 'May'
    tt.tooltipPosition.moveXAxisTooltip(200)

    const width = parseFloat(text.style.minWidth)
    expect(width).toBe(21)
    expect(parseFloat(box.style.left)).toBeCloseTo(
      200 - width / 2 + w.layout.translateX,
      5,
    )
    measure.mockRestore()
  })
})
