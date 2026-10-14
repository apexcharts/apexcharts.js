import { describe, it, expect, afterEach, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Graphics from '../../src/modules/Graphics.js'

// A label truncated to a maxWidth overran its box two ways:
// - with room for fewer than 3 characters the slice end went negative, so
//   'Consumer Electronics' in 20px came back as 'Consumer Electronic...';
// - bold labels (y axis labels.maxWidth) were measured at regular weight,
//   so they were cut too late and still overflowed.

let chart = null
afterEach(() => {
  vi.restoreAllMocks()
  chart?.destroy()
  chart = null
})

const graphicsWith10pxChars = () => {
  chart = createChartWithOptions({
    chart: { type: 'line', width: 400, height: 300 },
    series: [{ data: [1, 2, 3] }],
  })
  const g = new Graphics(chart.w)
  const spy = vi
    .spyOn(g, 'getTextRects')
    .mockImplementation((t) => ({ width: String(t).length * 10, height: 12 }))
  return { g, spy }
}

describe('text truncation to maxWidth', () => {
  it('returns nothing when not even the ellipsis fits', () => {
    const { g } = graphicsWith10pxChars()
    const text = 'Consumer Electronics'
    expect(g.getTextBasedOnMaxWidth({ text, maxWidth: 20, fontSize: '12px' })).toBe('')
  })

  it('still truncates with an ellipsis when it fits', () => {
    const { g } = graphicsWith10pxChars()
    const text = 'Consumer Electronics'
    expect(g.getTextBasedOnMaxWidth({ text, maxWidth: 30, fontSize: '12px' })).toBe('...')
    expect(g.getTextBasedOnMaxWidth({ text, maxWidth: 80, fontSize: '12px' })).toBe('Consu...')
    expect(g.getTextBasedOnMaxWidth({ text, maxWidth: 400, fontSize: '12px' })).toBe(text)
  })

  it('measures at the weight the label is drawn with', () => {
    const { g, spy } = graphicsWith10pxChars()
    g.drawText({
      x: 0,
      y: 0,
      text: 'A long bold label',
      fontSize: '12px',
      fontWeight: 700,
      maxWidth: 40,
      isPlainText: false,
    })
    expect(spy).toHaveBeenCalled()
    // getTextRects(text, fontSize, fontFamily, transform, useBBox, fontWeight)
    expect(spy.mock.calls[0][5]).toBe(700)
  })
})
