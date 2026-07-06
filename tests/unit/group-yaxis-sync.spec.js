import { describe, it, expect, beforeAll } from 'vitest'
import { createChartsWithOptions } from './utils/utils'

// jsdom has no layout engine; give SVG a stub bbox so rendering completes.
beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

// Regression for #5232: cross-chart chart.group sync used to overwrite a
// synced sibling's own yaxis array with the yaxis of the chart that update()
// was actually called on. When the two charts have a different number of
// y-axes, the receiving chart is left with a yaxis array shorter than its own
// series-to-axis mapping, and the next scale computation reads cnf.yaxis[index]
// as undefined -> throws "Cannot read properties of undefined (reading
// 'logarithmic')" in Scales.setYScaleForIndex.
//
// Fixed in UpdateHelpers by deleting options.yaxis for synced siblings, mirroring
// the pre-existing delete options.series guard.
describe('chart.group sync does not corrupt a sibling with a different y-axis count', () => {
  function createMismatchedGroup() {
    return createChartsWithOptions(
      {
        // Single-axis chart: this is the one update() is called on.
        chart: { type: 'line', id: 'single-axis', group: 'yaxis-mismatch' },
        series: [{ name: 'A', data: [1, 2, 3] }],
      },
      {
        // Dual-axis sibling: two series each on their own y-axis.
        chart: { type: 'line', id: 'dual-axis', group: 'yaxis-mismatch' },
        series: [
          { name: 'B', data: [10, 20, 30] },
          { name: 'C', data: [100, 200, 300] },
        ],
        yaxis: [{ seriesName: 'B' }, { seriesName: 'C', opposite: true }],
      }
    )
  }

  it('keeps the dual-axis sibling intact when the single-axis chart updates its yaxis', async () => {
    const [singleAxis, dualAxis] = createMismatchedGroup()

    // Sanity: the sibling really does have two y-axes before the update.
    expect(dualAxis.w.config.yaxis).toHaveLength(2)

    // Updating the single-axis chart's yaxis propagates to the synced sibling.
    // Without the guard this overwrites the sibling's 2-entry yaxis with a
    // 1-entry array and throws on the sibling's re-render.
    await expect(
      singleAxis.updateOptions({ yaxis: [{ min: 0, max: 500 }] })
    ).resolves.toBeDefined()

    // The sibling must retain its own two-axis shape, not the single axis it
    // was handed by the synced update.
    expect(dualAxis.w.config.yaxis).toHaveLength(2)
  })

  it('survives repeated synced yaxis updates without throwing', async () => {
    const [singleAxis, dualAxis] = createMismatchedGroup()

    for (let i = 0; i < 5; i++) {
      await expect(
        singleAxis.updateOptions({ yaxis: [{ min: 0, max: 100 * (i + 1) }] })
      ).resolves.toBeDefined()
    }

    expect(dualAxis.w.config.yaxis).toHaveLength(2)
  })
})
