import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import TreemapChart from '../../src/charts/Treemap.js'

// During a cross-type morph every leaf and every branch asked whether the
// outgoing chart had keyed marks, and hasKeyedMarks walks the whole snapshot
// when it has none: O(tiles x captured marks) inside the draw that starts the
// morph. The answer cannot change within a draw, so it is resolved once.

const NESTED = [
  {
    data: [
      { x: 'Tech', children: [{ x: 'MSFT', y: 300 }, { x: 'ORCL', y: 120 }, { x: 'AAPL', y: 280 }] },
      { x: 'Energy', children: [{ x: 'XOM', y: 200 }, { x: 'CVX', y: 150 }] },
      { x: 'Retail', children: [{ x: 'WMT', y: 90 }, { x: 'TGT', y: 40 }] },
    ],
  },
]

const stubMorph = (keyed) => {
  const calls = { hasKeyedMarks: 0, byKey: 0, byIndex: 0 }
  return {
    calls,
    isActive: () => true,
    getSpeed: () => 600,
    getAlgorithm: () => null,
    hasKeyedMarks: () => {
      calls.hasKeyedMarks++
      return keyed
    },
    getInitialPathForKey: () => {
      calls.byKey++
      return null
    },
    getInitialPathAt: () => {
      calls.byIndex++
      return null
    },
  }
}

describe('treemap resolves keyed morph pairing once per draw', () => {
  for (const keyed of [true, false]) {
    it(`asks the snapshot once (${keyed ? 'keyed' : 'unkeyed'} source)`, () => {
      const c = createChartWithOptions({
        chart: { type: 'treemap', width: 600, height: 400 },
        series: NESTED,
      })
      const morph = stubMorph(keyed)
      c.morphTypeChange = morph
      // Core builds a renderer per draw, as here.
      new TreemapChart(c.w, c).draw()
      expect(morph.calls.hasKeyedMarks).toBe(1)
      // 7 leaves take a source by draw order; with keys on, every leaf and
      // every branch also tried its key first, as before.
      expect(morph.calls.byIndex).toBe(7)
      expect(morph.calls.byKey).toBe(keyed ? 7 + 3 : 0)

      // The next draw asks again: a new morph may have a new snapshot.
      new TreemapChart(c.w, c).draw()
      expect(morph.calls.hasKeyedMarks).toBe(2)
    })
  }
})
