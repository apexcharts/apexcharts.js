// The screen-to-plot x mapping and the tooltip's plot rect are one
// measurement: AxisMapping.screenXToPlotPx finds the svg the way plotRect
// does (the Paper's node first), lands on the same plot px under CSS zoom,
// and does not measure again when the caller hands it the rect it has.
import { describe, it, expect, vi } from 'vitest'
import AxisMapping from '../../src/modules/AxisMapping'
import TooltipUtils from '../../src/modules/tooltip/Utils'

/** A chart drawn 600 px wide at screen x 100, shown at 2x CSS zoom. */
function zoomedW() {
  const svg = {
    getBoundingClientRect: vi.fn(() => ({
      left: 100,
      top: 50,
      width: 1200,
      height: 800,
    })),
  }
  const w = /** @type {any} */ ({
    dom: {
      Paper: { node: svg },
      // The svg is reached through the Paper; a lookup that asks baseEl
      // instead finds nothing here.
      baseEl: { querySelector: () => null },
      elWrap: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    },
    globals: { svgWidth: 600 },
    layout: { translateX: 30, translateY: 10, gridWidth: 500, gridHeight: 300 },
  })
  return { w, svg }
}

describe('one screen-to-plot mapping', () => {
  it('maps x off the same svg and zoom as plotRect', () => {
    const { w } = zoomedW()
    // 40 plot px right of the plot origin: 100 + (30 + 40) * 2.
    expect(AxisMapping.screenXToPlotPx(w, 240)).toBe(40)
    const plot = TooltipUtils.plotRect(w)
    expect(plot.zoom).toBe(2)
    expect((240 - plot.left) / plot.zoom).toBe(40)
  })

  it('measures nothing when handed the rect', () => {
    const { w, svg } = zoomedW()
    const plot = AxisMapping.plotRect(w)
    expect(svg.getBoundingClientRect).toHaveBeenCalledTimes(1)
    expect(AxisMapping.screenXToPlotPx(w, 240, plot)).toBe(40)
    expect(svg.getBoundingClientRect).toHaveBeenCalledTimes(1)
  })
})
