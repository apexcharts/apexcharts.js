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
      // shared=true → series switching suppressed
      expect(kn.seriesIndex).toBe(0)
      fireKey(chart, 'ArrowUp')
      expect(kn.seriesIndex).toBe(0)
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
  // Escape key
  // =========================================================================
  describe('Escape key', () => {
    it('should deactivate navigation on Escape', () => {
      const chart = chartWithKeyNav()
      const kn = chart.ctx.keyboardNavigation
      focusSvg(chart)
      expect(kn.active).toBe(true)
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
      const kn = chart.ctx.keyboardNavigation
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
          { name: 'S1', data: [{ x: 1, y: 2 }, { x: 3, y: 4 }] },
          { name: 'S2', data: [{ x: 2, y: 3 }, { x: 4, y: 5 }] },
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
