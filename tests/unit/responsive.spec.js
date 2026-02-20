import { createChartWithOptions } from './utils/utils.js'

/**
 * Regression tests for:
 * - Issue #2056: Chart breaks on breakpoint that is not specified (screen > largest breakpoint)
 * - Issue #1875: Collapsed series state lost when screen > largest breakpoint
 */
describe('Responsive breakpoints', () => {
  // Helper to temporarily set window.innerWidth
  function setWindowWidth(width) {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: width,
    })
  }

  const BREAKPOINTS = [
    { breakpoint: 600, options: { markers: { size: 3 } } },
    { breakpoint: 1024, options: { dataLabels: { style: { fontSize: '13px' } } } },
  ]

  describe('screen width above largest breakpoint', () => {
    beforeEach(() => {
      // 1025 > 1024 (largest bp) ensures we hit the if (width > largestBreakpoint) branch
      setWindowWidth(1025)
    })

    afterEach(() => {
      setWindowWidth(1024)
    })

    it('renders without error with static series (issue #2056)', () => {
      expect(() => {
        createChartWithOptions({
          chart: { type: 'line' },
          series: [{ name: 'Series 1', data: [10, 20, 30] }],
          responsive: BREAKPOINTS,
        })
      }).not.toThrow()
    })

    it('renders without error with empty initial series', () => {
      expect(() => {
        createChartWithOptions({
          chart: { type: 'line' },
          series: [],
          responsive: BREAKPOINTS,
        })
      }).not.toThrow()
    })

    it('does not apply responsive options above the largest breakpoint', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'S1', data: [1, 2, 3] }],
        responsive: [
          { breakpoint: 1024, options: { markers: { size: 99 } } },
        ],
      })

      // markers.size should NOT be 99 since we're above the 1024bp
      expect(chart.w.config.markers.size).not.toBe(99)
    })

    it('updateSeries with empty initial series shows new series (issue #2056)', async () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [],
        responsive: BREAKPOINTS,
      })

      await chart.updateSeries([{ name: 'Series 1', data: [10, 20, 30, 40] }])

      expect(chart.w.config.series.length).toBe(1)
      expect(chart.w.globals.series[0]).toEqual([10, 20, 30, 40])
    })

    it('updateSeries with increased series count works correctly (issue #2056)', async () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'S1', data: [1, 2, 3] }],
        responsive: BREAKPOINTS,
      })

      await chart.updateSeries([
        { name: 'S1', data: [1, 2, 3, 4] },
        { name: 'S2', data: [5, 6, 7, 8] },
      ])

      expect(chart.w.config.series.length).toBe(2)
    })

    it('updateSeries with decreased series count works correctly (issue #2056)', async () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [
          { name: 'S1', data: [1, 2, 3] },
          { name: 'S2', data: [4, 5, 6] },
        ],
        responsive: BREAKPOINTS,
      })

      await chart.updateSeries([{ name: 'S1', data: [1, 2, 3, 4] }])

      expect(chart.w.config.series.length).toBe(1)
    })

    it('preserves collapsed series state during re-render when screen above largest bp (issue #1875)', async () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [
          { name: 'S1', data: [1, 2, 3] },
          { name: 'S2', data: [4, 5, 6] },
        ],
        responsive: BREAKPOINTS,
      })

      // Simulate a collapsed series by zeroing out its data.
      // ApexCharts uses series.data === [] to indicate a collapsed/hidden series
      // so that stacking still works correctly.
      chart.w.config.series[1].data = []
      chart.w.globals.collapsedSeries = [{ index: 1, data: [4, 5, 6] }]
      chart.w.globals.collapsedSeriesIndices = [1]

      // Trigger a re-render directly (like what happens on window resize via _windowResize).
      // Without the fix (initialConfig.series = Utils.clone(w.config.series)),
      // the initial config's series would be restored with original data [4,5,6],
      // discarding the collapsed state.
      await chart.update()

      // The collapsed series (S2) should still have empty data after the re-render
      expect(chart.w.config.series[1].data).toEqual([])
      // The overall series count should be preserved
      expect(chart.w.config.series.length).toBe(2)
    })
  })

  describe('screen width below largest breakpoint', () => {
    beforeEach(() => {
      setWindowWidth(800) // between 600 and 1024 breakpoints
    })

    afterEach(() => {
      setWindowWidth(1024)
    })

    it('applies responsive options when within breakpoint range', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'S1', data: [1, 2, 3] }],
        responsive: [
          { breakpoint: 1024, options: { markers: { size: 99 } } },
        ],
      })

      // markers.size SHOULD be 99 since we're at 800 (< 1024)
      expect(chart.w.config.markers.size).toBe(99)
    })

    it('updateSeries with different length works within breakpoint range', async () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [],
        responsive: BREAKPOINTS,
      })

      await chart.updateSeries([
        { name: 'S1', data: [1, 2, 3] },
        { name: 'S2', data: [4, 5, 6] },
      ])

      expect(chart.w.config.series.length).toBe(2)
    })
  })
})
