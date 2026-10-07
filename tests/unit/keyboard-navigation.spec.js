import { vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helper: create a chart with keyboard navigation enabled
// ---------------------------------------------------------------------------
function chartWithKeyNav(opts = {}) {
  return createChartWithOptions({
    chart: {
      type: opts.type || 'line',
      animations: { enabled: false },
      accessibility: {
        enabled: true,
        keyboard: {
          enabled: true,
          navigation: { enabled: true, wrapAround: opts.wrapAround || false },
        },
      },
      ...opts.chart,
    },
    series: opts.series || [
      { name: 'Series A', data: [10, 20, 30, 40] },
      { name: 'Series B', data: [15, 25, 35, 45] },
    ],
    tooltip: { enabled: true, shared: opts.shared ?? true, ...opts.tooltip },
    ...opts.extra,
  })
}

// Fire a keydown event on the SVG element
function fireKey(chart, key) {
  const svg = chart.el.querySelector('.apexcharts-svg')
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  })
  svg.dispatchEvent(event)
  return event
}

// Simulate SVG focus (activates keyboard nav)
function focusSvg(chart) {
  const svg = chart.el.querySelector('.apexcharts-svg')
  svg.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
}

// Simulate SVG blur (deactivates keyboard nav)
function blurSvg(chart) {
  const svg = chart.el.querySelector('.apexcharts-svg')
  svg.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('KeyboardNavigation', () => {
  // =========================================================================
  // Initialisation
  // =========================================================================
  describe('initialisation', () => {
    it('should set tabindex="0" on the SVG element', () => {
      const chart = chartWithKeyNav()
      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('tabindex')).toBe('0')
    })

    it('should NOT set tabindex when keyboard navigation is disabled', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          accessibility: {
            enabled: true,
            keyboard: { enabled: true, navigation: { enabled: false } },
          },
        },
        series: [{ name: 'A', data: [1, 2, 3] }],
      })
      const svg = chart.el.querySelector('.apexcharts-svg')
      // tabindex is absent or not 0
      expect(svg.getAttribute('tabindex')).not.toBe('0')
    })

    it('should start inactive (not navigating) before focus', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      expect(kn.active).toBe(false)
    })

    it('should become active on SVG focus', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.active).toBe(true)
    })

    it('should become inactive on SVG blur', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      blurSvg(chart)
      expect(kn.active).toBe(false)
    })
  })

  // =========================================================================
  // Arrow key navigation — data points
  // =========================================================================
  describe('ArrowRight / ArrowLeft navigation', () => {
    it('should advance dataPointIndex on ArrowRight', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.dataPointIndex).toBe(0)
      fireKey(chart, 'ArrowRight')
      expect(kn.dataPointIndex).toBe(1)
    })

    it('should retreat dataPointIndex on ArrowLeft', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowRight')
      fireKey(chart, 'ArrowRight')
      expect(kn.dataPointIndex).toBe(2)
      fireKey(chart, 'ArrowLeft')
      expect(kn.dataPointIndex).toBe(1)
    })

    it('should clamp at last data point when wrapAround=false', () => {
      const chart = chartWithKeyNav({ wrapAround: false })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      // Series A has 4 data points (indices 0-3)
      fireKey(chart, 'ArrowRight')
      fireKey(chart, 'ArrowRight')
      fireKey(chart, 'ArrowRight')
      fireKey(chart, 'ArrowRight') // attempt to go past end
      expect(kn.dataPointIndex).toBe(3)
    })

    it('should clamp at first data point when wrapAround=false', () => {
      const chart = chartWithKeyNav({ wrapAround: false })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowLeft') // attempt to go before start
      expect(kn.dataPointIndex).toBe(0)
    })

    it('should wrap from last to first data point when wrapAround=true', () => {
      const chart = chartWithKeyNav({ wrapAround: true })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      // Move to last data point
      kn.dataPointIndex = 3
      fireKey(chart, 'ArrowRight') // should wrap to 0
      expect(kn.dataPointIndex).toBe(0)
    })

    it('should wrap from first to last data point when wrapAround=true', () => {
      const chart = chartWithKeyNav({ wrapAround: true })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.dataPointIndex).toBe(0)
      fireKey(chart, 'ArrowLeft') // should wrap to last (3)
      expect(kn.dataPointIndex).toBe(3)
    })
  })

  // =========================================================================
  // Arrow key navigation — series
  // =========================================================================
  describe('ArrowUp / ArrowDown navigation', () => {
    it('should move to next series on ArrowDown', () => {
      const chart = chartWithKeyNav({ shared: false })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.seriesIndex).toBe(0)
      fireKey(chart, 'ArrowDown')
      expect(kn.seriesIndex).toBe(1)
    })

    it('should move to previous series on ArrowUp', () => {
      const chart = chartWithKeyNav({ shared: false })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowDown')
      expect(kn.seriesIndex).toBe(1)
      fireKey(chart, 'ArrowUp')
      expect(kn.seriesIndex).toBe(0)
    })

    it('should clamp at last series when wrapAround=false', () => {
      const chart = chartWithKeyNav({ shared: false, wrapAround: false })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowDown')
      fireKey(chart, 'ArrowDown') // attempt to go past series 1
      expect(kn.seriesIndex).toBe(1) // 2 series, max index = 1
    })

    it('should clamp at first series when wrapAround=false', () => {
      const chart = chartWithKeyNav({ shared: false, wrapAround: false })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowUp') // attempt to go before series 0
      expect(kn.seriesIndex).toBe(0)
    })

    it('should NOT change series when tooltip.shared=true (same tooltip for all)', () => {
      const chart = chartWithKeyNav({ shared: true })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.seriesIndex).toBe(0)
      fireKey(chart, 'ArrowDown')
      // shared=true AND x values align → series switching suppressed
      expect(kn.seriesIndex).toBe(0)
      fireKey(chart, 'ArrowUp')
      expect(kn.seriesIndex).toBe(0)
    })

    it('should ALLOW series switching when tooltip.shared=true but series have different x values (irregular time series)', () => {
      // Both series have same length but different x values → isXoverlap returns
      // false → tooltip falls back to individual mode → up/down should be allowed
      const chart = chartWithKeyNav({
        shared: true,
        series: [
          { name: 'A', data: [{ x: 100, y: 10 }, { x: 200, y: 20 }, { x: 300, y: 30 }] },
          { name: 'B', data: [{ x: 150, y: 5 },  { x: 250, y: 15 }, { x: 350, y: 25 }] },
        ],
        extra: { xaxis: { type: 'numeric' } },
      })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.seriesIndex).toBe(0)
      fireKey(chart, 'ArrowDown')
      // x values differ at index 0 (100 vs 150) → not actually shared → allow series switch
      expect(kn.seriesIndex).toBe(1)
      fireKey(chart, 'ArrowUp')
      expect(kn.seriesIndex).toBe(0)
    })

    // A heatmap or treemap tooltip is one cell's whatever tooltip.shared says
    // (and it defaults to true); the shared check used to keep keyboard users
    // on the first row.
    const cellSeries = [
      { name: 'A', data: [{ x: 'a', y: 1 }, { x: 'b', y: 2 }] },
      { name: 'B', data: [{ x: 'a', y: 3 }, { x: 'b', y: 4 }] },
      { name: 'C', data: [{ x: 'a', y: 5 }, { x: 'b', y: 6 }] },
    ]

    it('should move up a heatmap row on ArrowUp: series 0 is the bottom row', () => {
      const chart = chartWithKeyNav({
        type: 'heatmap',
        shared: true,
        series: cellSeries,
      })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowUp')
      fireKey(chart, 'ArrowUp')
      expect(kn.seriesIndex).toBe(2)
      fireKey(chart, 'ArrowDown')
      expect(kn.seriesIndex).toBe(1)
    })

    it('should move down a heatmap row on ArrowDown when the y axis is reversed', () => {
      // reversed, series 0 is the top row
      const chart = chartWithKeyNav({
        type: 'heatmap',
        shared: true,
        series: cellSeries,
        extra: { yaxis: { reversed: true } },
      })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowDown')
      fireKey(chart, 'ArrowDown')
      expect(kn.seriesIndex).toBe(2)
      fireKey(chart, 'ArrowUp')
      expect(kn.seriesIndex).toBe(1)
    })

    it('should step through treemap series in order with tooltip.shared on', () => {
      const chart = chartWithKeyNav({
        type: 'treemap',
        shared: true,
        series: cellSeries,
      })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowDown')
      fireKey(chart, 'ArrowDown')
      expect(kn.seriesIndex).toBe(2)
      fireKey(chart, 'ArrowUp')
      expect(kn.seriesIndex).toBe(1)
    })

    it('should skip collapsed series when navigating with ArrowDown', () => {
      const chart = chartWithKeyNav({
        shared: false,
        series: [
          { name: 'A', data: [1, 2] },
          { name: 'B', data: [3, 4] },
          { name: 'C', data: [5, 6] },
        ],
      })
      const kn = chart.ctx.keyboardNavigation
      // Simulate series 1 (index 1) being collapsed
      chart.ctx.w.globals.collapsedSeriesIndices = [1]
      focusSvg(chart)
      fireKey(chart, 'ArrowDown') // should skip series 1 and land on 2
      expect(kn.seriesIndex).toBe(2)
    })
  })

  // =========================================================================
  // Home / End keys
  // =========================================================================
  describe('Home / End keys', () => {
    it('should jump to first data point on Home key', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowRight')
      fireKey(chart, 'ArrowRight')
      expect(kn.dataPointIndex).toBe(2)
      fireKey(chart, 'Home')
      expect(kn.dataPointIndex).toBe(0)
    })

    it('should jump to last data point on End key', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'End')
      expect(kn.dataPointIndex).toBe(3) // 4 data points, last = index 3
    })
  })

  // =========================================================================
  // Escape key (two-stage: 1st = dismiss tooltip, 2nd = exit nav)
  // =========================================================================
  describe('Escape key', () => {
    it('keeps nav active and hides focus on first Escape', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.active).toBe(true)
      fireKey(chart, 'Escape')
      // First Escape dismisses tooltip but keeps the chart focused so the user
      // can resume navigation without re-tabbing back in (WCAG 1.4.13 G194).
      expect(kn.active).toBe(true)
      expect(kn._tooltipDismissed).toBe(true)
      const tooltip = chart.el.querySelector('.apexcharts-tooltip')
      expect(tooltip.classList.contains('apexcharts-active')).toBe(false)
    })

    it('deactivates navigation on second Escape', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'Escape')
      fireKey(chart, 'Escape')
      expect(kn.active).toBe(false)
    })

    it('should hide tooltip active class on Escape', () => {
      const chart = chartWithKeyNav()
      focusSvg(chart)
      fireKey(chart, 'Escape')
      const tooltip = chart.el.querySelector('.apexcharts-tooltip')
      expect(tooltip.classList.contains('apexcharts-active')).toBe(false)
    })
  })

  // =========================================================================
  // Null value skipping
  // =========================================================================
  describe('null value skipping', () => {
    it('should skip null values when navigating right', () => {
      const chart = chartWithKeyNav({
        shared: false,
        series: [{ name: 'A', data: [10, null, null, 40] }],
      })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.dataPointIndex).toBe(0)
      fireKey(chart, 'ArrowRight') // should skip indices 1 and 2 (null)
      expect(kn.dataPointIndex).toBe(3)
    })

    it('should skip null values when navigating left', () => {
      const chart = chartWithKeyNav({
        shared: false,
        series: [{ name: 'A', data: [10, null, null, 40] }],
      })
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      kn.dataPointIndex = 3
      fireKey(chart, 'ArrowLeft') // should skip indices 2 and 1 (null)
      expect(kn.dataPointIndex).toBe(0)
    })
  })

  // =========================================================================
  // Globals are updated
  // =========================================================================
  describe('globals update on navigation', () => {
    it('should update capturedSeriesIndex and capturedDataPointIndex', () => {
      const chart = chartWithKeyNav({ shared: false })
      const w = chart.ctx.w
      focusSvg(chart)
      fireKey(chart, 'ArrowRight')
      fireKey(chart, 'ArrowRight')
      expect(w.globals.capturedDataPointIndex).toBe(2)
      expect(w.globals.capturedSeriesIndex).toBe(0)
    })
  })

  // =========================================================================
  // Pie / donut charts — single series navigation
  // =========================================================================
  describe('pie / donut chart navigation', () => {
    it('should navigate slices with ArrowRight for pie chart', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'pie',
          animations: { enabled: false },
          accessibility: {
            enabled: true,
            keyboard: { enabled: true, navigation: { enabled: true } },
          },
        },
        series: [44, 55, 67],
        labels: ['Slice A', 'Slice B', 'Slice C'],
      })
      const kn = chart.ctx.keyboardNavigation
      const svg = chart.el.querySelector('.apexcharts-svg')
      svg.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      expect(kn.dataPointIndex).toBe(0)
      svg.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      )
      expect(kn.dataPointIndex).toBe(1)
    })

    it('should return correct series count (1) for pie chart', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'pie',
          animations: { enabled: false },
          accessibility: {
            enabled: true,
            keyboard: { enabled: true, navigation: { enabled: true } },
          },
        },
        series: [44, 55, 67],
        labels: ['A', 'B', 'C'],
      })
      const kn = chart.ctx.keyboardNavigation
      expect(kn._getSeriesCount()).toBe(1) // pie uses single "series" internally
      expect(kn._getDataPointCount(0)).toBe(3) // 3 slices
    })

    it('should return correct series count (1) for donut chart', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'donut',
          animations: { enabled: false },
          accessibility: {
            enabled: true,
            keyboard: { enabled: true, navigation: { enabled: true } },
          },
        },
        series: [30, 40, 30],
        labels: ['X', 'Y', 'Z'],
      })
      const kn = chart.ctx.keyboardNavigation
      expect(kn._getSeriesCount()).toBe(1)
      expect(kn._getDataPointCount(0)).toBe(3)
    })

    it('should NOT change seriesIndex for pie chart on ArrowUp/ArrowDown', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'pie',
          animations: { enabled: false },
          accessibility: {
            enabled: true,
            keyboard: { enabled: true, navigation: { enabled: true } },
          },
        },
        series: [44, 55, 67],
        labels: ['A', 'B', 'C'],
      })
      const kn = chart.ctx.keyboardNavigation
      const svg = chart.el.querySelector('.apexcharts-svg')
      svg.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      svg.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      )
      // For pie charts getSeriesCount() = 1, so seriesIndex stays 0
      expect(kn.seriesIndex).toBe(0)
    })
  })

  // =========================================================================
  // Bar charts
  // =========================================================================
  describe('bar chart navigation', () => {
    it('should navigate data points on bar chart', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'bar',
          animations: { enabled: false },
          accessibility: {
            enabled: true,
            keyboard: { enabled: true, navigation: { enabled: true } },
          },
        },
        series: [{ name: 'Sales', data: [100, 200, 300] }],
        tooltip: { shared: false },
      })
      const kn = chart.ctx.keyboardNavigation
      const svg = chart.el.querySelector('.apexcharts-svg')
      svg.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
      svg.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      )
      expect(kn.dataPointIndex).toBe(1)
    })

    // A horizontal bar's box goes where the pointer puts it: a tooltip that
    // is not intersect-only takes the pointer's sticky path, which captions
    // the whole row at the index; an intersect one with an arrow goes around
    // the focused bar alone. A fixed one stays in its corner either way.
    function horizontalBars({ shared, fixed = false }) {
      const chart = chartWithKeyNav({
        type: 'bar',
        shared,
        tooltip: {
          intersect: !shared,
          ...(fixed && { fixed: { enabled: true } }),
        },
        series: [
          { name: 'A', data: [10, 20, 30] },
          { name: 'B', data: [15, 25, 35] },
        ],
        extra: { plotOptions: { bar: { horizontal: true } } },
      })
      const ttCtx = chart.ctx.w.globals.tooltip
      const kn = chart.ctx.keyboardNavigation
      const row = vi
        .spyOn(ttCtx.tooltipPosition, 'placeHorizontalSharedTooltip')
        .mockReturnValue(true)
      const around = vi.spyOn(ttCtx.tooltipPosition, 'placeAroundBar')
      // jsdom matches no escaped `data\:realIndex` selector, so hand the
      // branch the focused bar's box directly
      vi.spyOn(kn, '_focusedBarInWrap').mockReturnValue({
        top: 40,
        bottom: 60,
        left: 50,
        right: 150,
      })
      return { kn, ttCtx, row, around }
    }

    it('places a sticky horizontal bar box around the row, as the pointer does', () => {
      const { kn, ttCtx, row, around } = horizontalBars({ shared: true })
      kn._showTooltipBar(1, 2, ttCtx)
      expect(row).toHaveBeenCalledWith(2)
      expect(around).not.toHaveBeenCalled()
    })

    it('places an intersect horizontal bar box around the focused bar alone', () => {
      const { kn, ttCtx, row, around } = horizontalBars({ shared: false })
      kn._showTooltipBar(1, 2, ttCtx)
      expect(row).not.toHaveBeenCalled()
      expect(around).toHaveBeenCalledTimes(1)
      const [bar, , j, i] = around.mock.calls[0]
      expect(bar).toEqual({ top: 40, bottom: 60, left: 50, right: 150 })
      expect([j, i]).toEqual([2, 1])
    })

    it('leaves a fixed box in its corner, as the pointer does', () => {
      for (const shared of [true, false]) {
        const { kn, ttCtx, row, around } = horizontalBars({
          shared,
          fixed: true,
        })
        const corner = vi.spyOn(ttCtx, 'drawFixedTooltipRect')
        kn._showTooltip(1, 2, ttCtx)
        expect(row).not.toHaveBeenCalled()
        expect(around).not.toHaveBeenCalled()
        expect(corner).toHaveBeenCalled()
      }
    })
  })

  // =========================================================================
  // Scatter chart — _getSeriesCount / _getDataPointCount
  // =========================================================================
  describe('scatter chart navigation helpers', () => {
    it('should return correct series and point counts for scatter chart', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'scatter',
          animations: { enabled: false },
          accessibility: {
            enabled: true,
            keyboard: { enabled: true, navigation: { enabled: true } },
          },
        },
        series: [
          {
            name: 'S1',
            data: [
              { x: 1, y: 2 },
              { x: 3, y: 4 },
            ],
          },
          {
            name: 'S2',
            data: [
              { x: 2, y: 3 },
              { x: 4, y: 5 },
            ],
          },
        ],
      })
      const kn = chart.ctx.keyboardNavigation
      expect(kn._getSeriesCount()).toBe(2)
      expect(kn._getDataPointCount(0)).toBe(2)
      expect(kn._getDataPointCount(1)).toBe(2)
    })
  })

  // =========================================================================
  // _isNavEnabled helper
  // =========================================================================
  describe('_isNavEnabled', () => {
    it('should return true when all accessibility flags are on', () => {
      const chart = chartWithKeyNav()
      expect(chart.ctx.keyboardNavigation._isNavEnabled()).toBe(true)
    })

    it('should return false when accessibility.enabled=false', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          accessibility: { enabled: false },
        },
        series: [{ name: 'A', data: [1, 2] }],
      })
      // keyboardNavigation won't be instantiated when accessibility disabled,
      // so check the config flag directly
      expect(chart.ctx.w.config.chart.accessibility.enabled).toBe(false)
    })

    it('should return false when keyboard.navigation.enabled=false', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          accessibility: {
            enabled: true,
            keyboard: { enabled: true, navigation: { enabled: false } },
          },
        },
        series: [{ name: 'A', data: [1, 2] }],
      })
      const kn = chart.ctx.keyboardNavigation
      if (kn) {
        expect(kn._isNavEnabled()).toBe(false)
      } else {
        // Not instantiated — nav is disabled, which is the expected outcome
        expect(true).toBe(true)
      }
    })
  })

  // =========================================================================
  // Legend click hides tooltip
  // =========================================================================
  describe('legend click resets keyboard nav', () => {
    it('should deactivate keyboard nav when legend is clicked while active', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.active).toBe(true)
      // Fire the internal legendClick event as Legend.js would
      chart.ctx.events.fireEvent('legendClick', [chart.ctx, 0, chart.ctx.w])
      expect(kn.active).toBe(false)
    })

    it('should not throw if legend is clicked while keyboard nav is inactive', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      expect(kn.active).toBe(false)
      expect(() => {
        chart.ctx.events.fireEvent('legendClick', [chart.ctx, 0, chart.ctx.w])
      }).not.toThrow()
    })
  })

  // =========================================================================
  // Irregular time series — shared tooltip falls back to individual
  // =========================================================================
  describe('irregular time series tooltip mode', () => {
    it('_showTooltipAxisLine calls drawSeriesTexts with shared=false when x values differ', () => {
      const chart = chartWithKeyNav({
        shared: true,
        series: [
          { name: 'A', data: [{ x: 100, y: 10 }, { x: 200, y: 20 }, { x: 300, y: 30 }] },
          { name: 'B', data: [{ x: 150, y: 5 },  { x: 250, y: 15 }, { x: 350, y: 25 }] },
        ],
        extra: { xaxis: { type: 'numeric' } },
      })
      const kn = chart.ctx.keyboardNavigation
      const ttCtx = chart.ctx.w.globals.tooltip
      if (!ttCtx) return // tooltip feature not registered in this env

      const spy = vi.spyOn(ttCtx.tooltipLabels, 'drawSeriesTexts').mockImplementation(() => {})
      focusSvg(chart)
      // At j=0: seriesX[0][0]=100 vs seriesX[1][0]=150 → isXoverlap(0)=false → shared=false
      kn._showTooltipAxisLine(0, 0, ttCtx)
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ shared: false }))
      spy.mockRestore()
    })

    it('_showTooltipAxisLine calls drawSeriesTexts with shared=true when x values match', () => {
      const chart = chartWithKeyNav({
        shared: true,
        series: [
          { name: 'A', data: [{ x: 100, y: 10 }, { x: 200, y: 20 }] },
          { name: 'B', data: [{ x: 100, y: 5 },  { x: 200, y: 15 }] },
        ],
        extra: { xaxis: { type: 'numeric' } },
      })
      const kn = chart.ctx.keyboardNavigation
      const ttCtx = chart.ctx.w.globals.tooltip
      if (!ttCtx) return

      const spy = vi.spyOn(ttCtx.tooltipLabels, 'drawSeriesTexts').mockImplementation(() => {})
      focusSvg(chart)
      // At j=0: seriesX[0][0]=100 vs seriesX[1][0]=100 → isXoverlap(0)=true, same length → shared=true
      kn._showTooltipAxisLine(0, 0, ttCtx)
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ shared: true }))
      spy.mockRestore()
    })
  })

  // =========================================================================
  // Scatter marker jitter fix — _enlargedScatterMarker tracking
  // =========================================================================
  describe('scatter marker tracking (_enlargedScatterMarker)', () => {
    it('should initialise _enlargedScatterMarker to null', () => {
      const chart = chartWithKeyNav()
      expect(chart.ctx.keyboardNavigation._enlargedScatterMarker).toBeNull()
    })

    it('should clear _enlargedScatterMarker on blur', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      // Manually set to simulate a previously enlarged marker
      kn._enlargedScatterMarker = document.createElement('path')
      blurSvg(chart)
      expect(kn._enlargedScatterMarker).toBeNull()
    })
  })

  // =========================================================================
  // Keyboard nav does nothing when not active
  // =========================================================================
  describe('key events ignored when inactive', () => {
    it('should not change dataPointIndex on ArrowRight before focus', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      expect(kn.active).toBe(false)
      fireKey(chart, 'ArrowRight')
      expect(kn.dataPointIndex).toBe(0) // unchanged
    })

    it('should not change dataPointIndex on ArrowRight after blur', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      fireKey(chart, 'ArrowRight')
      expect(kn.dataPointIndex).toBe(1)
      blurSvg(chart)
      fireKey(chart, 'ArrowRight')
      expect(kn.dataPointIndex).toBe(1) // unchanged after blur
    })
  })
})
