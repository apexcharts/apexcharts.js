import Helpers from '../../src/charts/common/bar/Helpers.js'

// createBorderRadiusArr decides WHICH bar rounds WHICH corner in a stacked
// chart. It is pure (config + values in, a [series][point] grid of
// 'top'|'bottom'|'both'|'none' out) and had no coverage at all, which is how
// two bugs survived in it: it resolved the outermost segments across the WHOLE
// CHART instead of per series group, so a grouped stacked chart rounded the
// bottom of the first group and the top of the last and left every stack
// between them square; and a `nonZeroCount === 1` branch was unreachable dead
// code hiding a falsy-zero bug (`positiveIndices[0] || negativeIndices[0]`
// yields undefined when the index is 0).
//
// Corner semantics, all from the stack's own point of view:
//   'bottom' - the segment at the baseline end of its stack
//   'top'    - the segment at the far end of its stack
//   'both'   - alone in its stack, so it owns both ends
//   'none'   - sandwiched between neighbours; no outer edge to round
//
// The function reads only these bits of state, so a literal is a faithful
// stand-in for a rendered chart and keeps these tests fast and exact.
const makeHelpers = ({
  seriesNames,
  seriesGroups = [],
  type = 'bar',
  horizontal = false,
  stacked = true,
  borderRadius = 10,
}) => {
  const w = {
    config: {
      chart: { type, stacked },
      plotOptions: { bar: { borderRadius, horizontal } },
    },
    seriesData: { seriesNames },
    labelData: { seriesGroups },
  }
  // Helpers' constructor only reads barCtx.w.
  return new Helpers({ w })
}

/** Corner grid for one data point across all series. */
const cornersAt = (grid, j) => grid.map((row) => row[j])

describe('createBorderRadiusArr, which bar rounds which corner', () => {
  describe('ungrouped stack (the behaviour that already worked)', () => {
    it('rounds the outermost segments and leaves the middle square', () => {
      const h = makeHelpers({ seriesNames: ['S0', 'S1', 'S2'] })
      const grid = h.createBorderRadiusArr([
        [10, 10],
        [15, 15],
        [12, 12],
      ])
      expect(cornersAt(grid, 0)).toEqual(['bottom', 'none', 'top'])
      expect(cornersAt(grid, 1)).toEqual(['bottom', 'none', 'top'])
    })

    it('gives a lone series both ends', () => {
      const h = makeHelpers({ seriesNames: ['only'] })
      expect(h.createBorderRadiusArr([[10, 20]])).toEqual([['both', 'both']])
    })

    it('skips series that are zero at that data point', () => {
      const h = makeHelpers({ seriesNames: ['S0', 'S1', 'S2'] })
      const grid = h.createBorderRadiusArr([
        [0, 10],
        [15, 15],
        [12, 0],
      ])
      // j=0: S0 is absent, so S1..S2 are the stack.
      expect(cornersAt(grid, 0)).toEqual(['none', 'bottom', 'top'])
      // j=1: S2 is absent, so S0..S1 are the stack.
      expect(cornersAt(grid, 1)).toEqual(['bottom', 'top', 'none'])
    })

    it('rounds each side of the baseline independently when signs are mixed', () => {
      const h = makeHelpers({ seriesNames: ['neg', 'pos0', 'pos1'] })
      const grid = h.createBorderRadiusArr([[-10, -10], [15, 15], [12, 12]])
      // The lone negative caps the below-axis end; the last positive caps the
      // above-axis end; the positive in between is enclosed.
      expect(cornersAt(grid, 0)).toEqual(['bottom', 'none', 'top'])
    })

    it('rounds only the outermost of several negatives', () => {
      const h = makeHelpers({ seriesNames: ['n0', 'n1', 'n2'] })
      const grid = h.createBorderRadiusArr([[-10, -10], [-15, -15], [-12, -12]])
      expect(cornersAt(grid, 0)).toEqual(['top', 'none', 'bottom'])
    })
  })

  describe('grouped stacks, each group is its own stack', () => {
    const GROUPS = [
      ['A-low', 'A-high'],
      ['B-low', 'B-high'],
    ]
    const NAMES = ['A-low', 'A-high', 'B-low', 'B-high']

    it('rounds the outermost segment of EVERY group, not just the first and last', () => {
      const h = makeHelpers({ seriesNames: NAMES, seriesGroups: GROUPS })
      const grid = h.createBorderRadiusArr([
        [10, 10],
        [15, 15],
        [12, 12],
        [18, 18],
      ])
      // Pre-fix this was ['bottom', 'none', 'none', 'top'], the whole chart
      // treated as one stack.
      expect(cornersAt(grid, 0)).toEqual(['bottom', 'top', 'bottom', 'top'])
      expect(cornersAt(grid, 1)).toEqual(['bottom', 'top', 'bottom', 'top'])
    })

    it('holds for horizontal bars too', () => {
      const h = makeHelpers({
        seriesNames: NAMES,
        seriesGroups: GROUPS,
        horizontal: true,
      })
      const grid = h.createBorderRadiusArr([[10, 10], [15, 15], [12, 12], [18, 18]])
      expect(cornersAt(grid, 0)).toEqual(['bottom', 'top', 'bottom', 'top'])
    })

    it('gives a single-series group both ends rather than half a cap', () => {
      const h = makeHelpers({
        seriesNames: ['A-only', 'B-low', 'B-high'],
        seriesGroups: [['A-only'], ['B-low', 'B-high']],
      })
      const grid = h.createBorderRadiusArr([[10, 10], [12, 12], [18, 18]])
      expect(cornersAt(grid, 0)).toEqual(['both', 'bottom', 'top'])
    })

    it('resolves signs within a group, not across the chart', () => {
      const h = makeHelpers({
        seriesNames: ['A-neg', 'A-pos', 'B-low', 'B-high'],
        seriesGroups: [
          ['A-neg', 'A-pos'],
          ['B-low', 'B-high'],
        ],
      })
      const grid = h.createBorderRadiusArr([[-10, -10], [15, 15], [12, 12], [18, 18]])
      // Group A straddles the baseline and caps both ends; group B is a plain
      // positive stack. Pre-fix group B's lower series got nothing, because the
      // chart-wide "first positive" lived in group A.
      expect(cornersAt(grid, 0)).toEqual(['bottom', 'top', 'bottom', 'top'])
    })

    it('resolves zeros within a group', () => {
      const h = makeHelpers({
        seriesNames: ['A-low', 'A-high', 'B-low', 'B-high'],
        seriesGroups: [
          ['A-low', 'A-high'],
          ['B-low', 'B-high'],
        ],
      })
      const grid = h.createBorderRadiusArr([[0, 0], [15, 15], [12, 12], [18, 18]])
      // A-low is absent, so A-high is alone in its group and takes both ends.
      expect(cornersAt(grid, 0)).toEqual(['none', 'both', 'bottom', 'top'])
    })

    it('keeps a series whose name matches no group in the assignment', () => {
      const h = makeHelpers({
        seriesNames: ['A-low', 'A-high', 'orphan'],
        seriesGroups: [['A-low', 'A-high']],
      })
      const grid = h.createBorderRadiusArr([[10, 10], [15, 15], [12, 12]])
      // One declared group means the chart is not really grouped, so everything
      // shares one stack, the orphan must not silently lose its corner.
      expect(grid[2][0]).not.toBe(undefined)
      expect(cornersAt(grid, 0)).toEqual(['bottom', 'none', 'top'])
    })

    it('handles three groups', () => {
      const h = makeHelpers({
        seriesNames: ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'],
        seriesGroups: [
          ['a1', 'a2'],
          ['b1', 'b2'],
          ['c1', 'c2'],
        ],
      })
      const grid = h.createBorderRadiusArr([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]])
      expect(cornersAt(grid, 0)).toEqual([
        'bottom',
        'top',
        'bottom',
        'top',
        'bottom',
        'top',
      ])
    })
  })

  describe('when the radius does not apply', () => {
    it('falls back to plain top rounding when the chart is not stacked', () => {
      const h = makeHelpers({ seriesNames: ['S0', 'S1'], stacked: false })
      expect(h.createBorderRadiusArr([[10, 10], [15, 15]])).toEqual([
        ['top', 'top'],
        ['top', 'top'],
      ])
    })

    it('falls back to plain top rounding when borderRadius is 0', () => {
      const h = makeHelpers({ seriesNames: ['S0', 'S1'], borderRadius: 0 })
      expect(h.createBorderRadiusArr([[10, 10], [15, 15]])).toEqual([
        ['top', 'top'],
        ['top', 'top'],
      ])
    })

    it('downgrades the baseline cap to "top" for a single-data-point chart', () => {
      // Long-standing quirk, preserved deliberately: with exactly one data
      // point the baseline-end cap becomes 'top' and a solo series takes 'top'
      // rather than 'both'. Note the guard tests `chart.type === 'bar'`, which
      // is ALSO true of column charts (a column is type 'bar' +
      // plotOptions.bar.horizontal false), so this fires for single-point
      // columns too, almost certainly not the original intent, but changing it
      // would move pixels on existing charts. Pinned here so a future edit is a
      // visible decision rather than an accident.
      const h = makeHelpers({ seriesNames: ['S0', 'S1'] })
      expect(h.createBorderRadiusArr([[10], [15]])).toEqual([['top'], ['top']])

      const solo = makeHelpers({ seriesNames: ['only'] })
      expect(solo.createBorderRadiusArr([[10]])).toEqual([['top']])
    })

    it('leaves an all-zero data point untouched', () => {
      const h = makeHelpers({ seriesNames: ['S0', 'S1'] })
      expect(h.createBorderRadiusArr([[0, 0], [0, 0]])).toEqual([
        ['none', 'none'],
        ['none', 'none'],
      ])
    })
  })

  describe('getStackedSeriesIndices', () => {
    it('buckets everything together when the chart is not grouped', () => {
      const h = makeHelpers({ seriesNames: ['a', 'b', 'c'] })
      expect(h.getStackedSeriesIndices(3)).toEqual([[0, 1, 2]])
    })

    it('buckets by group, preserving series (stacking) order', () => {
      const h = makeHelpers({
        seriesNames: ['a1', 'b1', 'a2', 'b2'],
        seriesGroups: [
          ['a1', 'a2'],
          ['b1', 'b2'],
        ],
      })
      // Interleaved declaration order must still bucket by group.
      expect(h.getStackedSeriesIndices(4)).toEqual([
        [0, 2],
        [1, 3],
      ])
    })

    it('drops empty buckets', () => {
      const h = makeHelpers({
        seriesNames: ['a1'],
        seriesGroups: [['a1'], ['nobody']],
      })
      expect(h.getStackedSeriesIndices(1)).toEqual([[0]])
    })
  })
})
