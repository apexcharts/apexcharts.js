// The trellis card resolves the hovered point with the same divisor rule as
// the main tooltip (tooltip/Utils.getNearestValues). `tickPlacement:
// 'between'` puts each category in the middle of its own slot, so the slot
// under the pointer wins, not the nearest of n - 1 gaps. The card used to
// answer for the neighbouring category over the right half of each slot.
import { describe, it, expect } from 'vitest'
import TrellisTooltip from '../../src/modules/trellis/TrellisTooltip.js'

const panel = ({ type = 'line', tickPlacement = 'on', n = 4 } = {}) => ({
  w: {
    config: {
      chart: { type },
      xaxis: { tickPlacement, convertedCatToNumeric: false },
    },
    globals: { dataPoints: n, barPadForNumericAxis: 0 },
    layout: { gridWidth: 400, translateX: 0 },
    dom: {},
  },
})

const tt = new TrellisTooltip(/** @type {any} */ ({}))

describe('TrellisTooltip._hoverIndex', () => {
  it("tickPlacement 'between' resolves the slot under the pointer", () => {
    const chart = panel({ tickPlacement: 'between' })
    // four 100px slots, centres at 50, 150, 250, 350
    expect(tt._hoverIndex(chart, 10, 0)).toBe(0)
    expect(tt._hoverIndex(chart, 90, 0)).toBe(0)
    expect(tt._hoverIndex(chart, 110, 0)).toBe(1)
    expect(tt._hoverIndex(chart, 290, 0)).toBe(2)
    expect(tt._hoverIndex(chart, 399, 0)).toBe(3)
    expect(tt._hoverIndex(chart, 400, 0)).toBe(3)
  })

  it("tickPlacement 'on' still snaps to the nearest point", () => {
    const chart = panel()
    // points at 0, 133, 267, 400
    expect(tt._hoverIndex(chart, 60, 0)).toBe(0)
    expect(tt._hoverIndex(chart, 70, 0)).toBe(1)
    expect(tt._hoverIndex(chart, 400, 0)).toBe(3)
  })

  it('violin bins are slots, as bars are', () => {
    const chart = panel({ type: 'violin' })
    expect(tt._hoverIndex(chart, 90, 0)).toBe(0)
    expect(tt._hoverIndex(chart, 110, 0)).toBe(1)
  })
})
