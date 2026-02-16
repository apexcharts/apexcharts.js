import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helper: create a chart with accessibility options
// ---------------------------------------------------------------------------
function chartWithAccessibility(opts = {}) {
  const chartConfig = {
    type: opts.type || 'line',
    accessibility: {
      enabled: true,
      ...opts.accessibility,
    },
    ...opts.chart,
  }

  // Ensure accessibility config is not overwritten
  if (!chartConfig.accessibility) {
    chartConfig.accessibility = { enabled: true }
  }
  if (opts.accessibility) {
    chartConfig.accessibility = {
      ...chartConfig.accessibility,
      ...opts.accessibility,
    }
  }

  return createChartWithOptions({
    chart: chartConfig,
    series: opts.series || [
      { name: 'Series A', data: [10, 20, 30] },
      { name: 'Series B', data: [15, 25, 35] },
    ],
    title: opts.title || {},
    subtitle: opts.subtitle || {},
    legend: {
      show: true,
      ...opts.legend,
    },
    tooltip: {
      enabled: true,
      ...opts.tooltip,
    },
    ...opts.extra,
  })
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('Accessibility', () => {
  // =========================================================================
  // Configuration
  // =========================================================================
  describe('configuration', () => {
    it('should have accessibility enabled by default', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'Test', data: [1, 2, 3] }],
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('role')).toBe('img')
      expect(svg.getAttribute('aria-label')).toBeTruthy()
    })

    it('should support disabling accessibility via config', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          accessibility: {
            enabled: false,
          },
        },
        series: [{ name: 'Test', data: [1, 2, 3] }],
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('role')).toBeNull()
      expect(svg.getAttribute('aria-label')).toBeNull()
    })

    it('should support enabling accessibility via config', () => {
      const chart = chartWithAccessibility()

      const svg = chart.el.querySelector('.apexcharts-svg')

      expect(svg).not.toBeNull()
      expect(svg.getAttribute('role')).toBe('img')
      expect(svg.getAttribute('aria-label')).toBeTruthy()
    })

    it('should support custom description in accessibility config', () => {
      const chart = chartWithAccessibility({
        accessibility: {
          description: 'Custom chart description for screen readers',
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      const ariaLabel = svg.getAttribute('aria-label')
      expect(ariaLabel).toBe('Custom chart description for screen readers')
    })

    it('should support disabling announcements', () => {
      const chart = chartWithAccessibility({
        accessibility: {
          announcements: {
            enabled: false,
          },
        },
      })

      const tooltip = chart.el.querySelector('.apexcharts-tooltip')
      expect(tooltip.getAttribute('aria-live')).toBeNull()
    })

    it('should support disabling keyboard navigation', () => {
      const chart = chartWithAccessibility({
        accessibility: {
          keyboard: {
            enabled: false,
          },
        },
      })

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      legendItems.forEach((item) => {
        expect(item.getAttribute('role')).toBeNull()
        expect(item.getAttribute('tabindex')).toBeNull()
      })
    })
  })

  // =========================================================================
  // SVG ARIA Attributes
  // =========================================================================
  describe('SVG ARIA attributes', () => {
    it('should add role="img" to main SVG element', () => {
      const chart = chartWithAccessibility()

      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('role')).toBe('img')
    })

    it('should add aria-label with chart type when no title', () => {
      const chart = chartWithAccessibility({
        type: 'bar',
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      const ariaLabel = svg.getAttribute('aria-label')

      expect(ariaLabel).toContain('bar chart')
      expect(ariaLabel).toContain('2 data series')
    })

    it('should add aria-label with title when title is provided', () => {
      const chart = chartWithAccessibility({
        title: {
          text: 'Sales Overview',
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      const ariaLabel = svg.getAttribute('aria-label')

      expect(ariaLabel).toContain('Sales Overview')
      expect(ariaLabel).toContain('line chart')
    })

    it('should include subtitle in aria-label when provided', () => {
      const chart = chartWithAccessibility({
        title: {
          text: 'Quarterly Report',
        },
        subtitle: {
          text: 'Q1 2024',
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      const ariaLabel = svg.getAttribute('aria-label')

      expect(ariaLabel).toContain('Quarterly Report')
      expect(ariaLabel).toContain('Q1 2024')
    })

    it('should add <title> element as first child of SVG', () => {
      const chart = chartWithAccessibility({
        title: {
          text: 'Revenue Chart',
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      const titleEl = svg.querySelector('title')

      expect(titleEl).not.toBeNull()
      expect(titleEl.textContent).toBe('Revenue Chart')
      expect(svg.firstChild).toBe(titleEl)
    })

    it('should add <desc> element when description is provided', () => {
      const chart = chartWithAccessibility({
        accessibility: {
          description: 'This chart shows monthly sales data',
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      const descEl = svg.querySelector('desc')

      expect(descEl).not.toBeNull()
      expect(descEl.textContent).toBe('This chart shows monthly sales data')
    })

    it('should add <title> with fallback "Chart" when no title provided', () => {
      const chart = chartWithAccessibility()

      const svg = chart.el.querySelector('.apexcharts-svg')
      const titleEl = svg.querySelector('title')

      expect(titleEl).not.toBeNull()
      expect(titleEl.textContent).toBe('Chart')
    })

    it('should use description as aria-label when both title and description provided', () => {
      const chart = chartWithAccessibility({
        title: {
          text: 'Sales',
        },
        accessibility: {
          description: 'Complete sales overview for 2024',
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      const ariaLabel = svg.getAttribute('aria-label')

      expect(ariaLabel).toBe('Complete sales overview for 2024')
    })
  })

  // =========================================================================
  // Tooltip ARIA Attributes
  // =========================================================================
  describe('tooltip ARIA attributes', () => {
    it('should add role="tooltip" to tooltip element', () => {
      const chart = chartWithAccessibility()

      const tooltip = chart.el.querySelector('.apexcharts-tooltip')
      expect(tooltip.getAttribute('role')).toBe('tooltip')
    })

    it('should add aria-live="polite" to tooltip element', () => {
      const chart = chartWithAccessibility()

      const tooltip = chart.el.querySelector('.apexcharts-tooltip')
      expect(tooltip.getAttribute('aria-live')).toBe('polite')
    })

    it('should add aria-atomic="true" to tooltip element', () => {
      const chart = chartWithAccessibility()

      const tooltip = chart.el.querySelector('.apexcharts-tooltip')
      expect(tooltip.getAttribute('aria-atomic')).toBe('true')
    })

    it('should add aria-hidden="true" by default when tooltip is hidden', () => {
      const chart = chartWithAccessibility()

      const tooltip = chart.el.querySelector('.apexcharts-tooltip')
      expect(tooltip.getAttribute('aria-hidden')).toBe('true')
    })

    it('should not add aria-live when announcements are disabled', () => {
      const chart = chartWithAccessibility({
        accessibility: {
          announcements: {
            enabled: false,
          },
        },
      })

      const tooltip = chart.el.querySelector('.apexcharts-tooltip')
      expect(tooltip.getAttribute('role')).toBeNull()
      expect(tooltip.getAttribute('aria-live')).toBeNull()
    })

    it('should not add tooltip ARIA attributes when accessibility is disabled', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          accessibility: {
            enabled: false,
          },
        },
        series: [{ name: 'Test', data: [1, 2, 3] }],
      })

      const tooltip = chart.el.querySelector('.apexcharts-tooltip')
      expect(tooltip.getAttribute('role')).toBeNull()
      expect(tooltip.getAttribute('aria-live')).toBeNull()
      expect(tooltip.getAttribute('aria-atomic')).toBeNull()
    })
  })

  // =========================================================================
  // Legend Keyboard Navigation
  // =========================================================================
  describe('legend keyboard navigation', () => {
    it('should add role="button" to legend items', () => {
      const chart = chartWithAccessibility()

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      legendItems.forEach((item) => {
        expect(item.getAttribute('role')).toBe('button')
      })
    })

    it('should add tabindex="0" to legend items', () => {
      const chart = chartWithAccessibility()

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      legendItems.forEach((item) => {
        expect(item.getAttribute('tabindex')).toBe('0')
      })
    })

    it('should add aria-label with series name and status', () => {
      const chart = chartWithAccessibility({
        series: [
          { name: 'Revenue', data: [10, 20, 30] },
          { name: 'Expenses', data: [5, 15, 25] },
        ],
      })

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      const firstLabel = legendItems[0].getAttribute('aria-label')
      const secondLabel = legendItems[1].getAttribute('aria-label')

      expect(firstLabel).toContain('Revenue')
      expect(firstLabel).toContain('visible')
      expect(firstLabel).toContain('Press Enter or Space to toggle')

      expect(secondLabel).toContain('Expenses')
      expect(secondLabel).toContain('visible')
    })

    it('should add aria-pressed="false" for visible series', () => {
      const chart = chartWithAccessibility()

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      legendItems.forEach((item) => {
        expect(item.getAttribute('aria-pressed')).toBe('false')
      })
    })

    it('should not add keyboard attributes when keyboard.enabled is false', () => {
      const chart = chartWithAccessibility({
        accessibility: {
          keyboard: {
            enabled: false,
          },
        },
      })

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      legendItems.forEach((item) => {
        expect(item.getAttribute('role')).toBeNull()
        expect(item.getAttribute('tabindex')).toBeNull()
        expect(item.getAttribute('aria-label')).toBeNull()
        expect(item.getAttribute('aria-pressed')).toBeNull()
      })
    })

    it('should not add keyboard attributes when accessibility is disabled', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          accessibility: {
            enabled: false,
          },
        },
        series: [
          { name: 'A', data: [1, 2, 3] },
          { name: 'B', data: [4, 5, 6] },
        ],
        legend: { show: true },
      })

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      legendItems.forEach((item) => {
        expect(item.getAttribute('role')).toBeNull()
        expect(item.getAttribute('tabindex')).toBeNull()
      })
    })

    it('should respond to Enter key press on legend item', () => {
      const legendClickSpy = vi.fn()

      const chart = chartWithAccessibility({
        chart: {
          events: {
            legendClick: legendClickSpy,
          },
        },
      })

      const legendItem = chart.el.querySelector('.apexcharts-legend-series')
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      legendItem.dispatchEvent(event)

      expect(legendClickSpy).toHaveBeenCalledTimes(1)
    })

    it('should respond to Space key press on legend item', () => {
      const legendClickSpy = vi.fn()

      const chart = chartWithAccessibility({
        chart: {
          events: {
            legendClick: legendClickSpy,
          },
        },
      })

      const legendItem = chart.el.querySelector('.apexcharts-legend-series')
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      legendItem.dispatchEvent(event)

      expect(legendClickSpy).toHaveBeenCalledTimes(1)
    })

    it('should not respond to other key presses on legend item', () => {
      const legendClickSpy = vi.fn()

      const chart = chartWithAccessibility({
        chart: {
          events: {
            legendClick: legendClickSpy,
          },
        },
      })

      const legendItem = chart.el.querySelector('.apexcharts-legend-series')
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true })
      legendItem.dispatchEvent(event)

      expect(legendClickSpy).not.toHaveBeenCalled()
    })

    it('should work with legend text element', () => {
      const legendClickSpy = vi.fn()

      const chart = chartWithAccessibility({
        chart: {
          events: {
            legendClick: legendClickSpy,
          },
        },
      })

      const legendText = chart.el.querySelector('.apexcharts-legend-text')
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      legendText.dispatchEvent(event)

      expect(legendClickSpy).toHaveBeenCalledTimes(1)
    })

    it('should work with legend marker element', () => {
      const legendClickSpy = vi.fn()

      const chart = chartWithAccessibility({
        chart: {
          events: {
            legendClick: legendClickSpy,
          },
        },
      })

      const legendMarker = chart.el.querySelector(
        '.apexcharts-legend-series > .apexcharts-legend-marker'
      )
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      legendMarker.dispatchEvent(event)

      expect(legendClickSpy).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // Keyboard Events
  // =========================================================================
  describe('keyboard events', () => {
    it('should fire keyDown event handler when key is pressed', () => {
      const keyDownSpy = vi.fn()

      const chart = chartWithAccessibility({
        chart: {
          events: {
            keyDown: keyDownSpy,
          },
        },
      })

      const chartEl = chart.el.querySelector('.apexcharts-canvas')
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      chartEl.dispatchEvent(event)

      expect(keyDownSpy).toHaveBeenCalledTimes(1)
      expect(keyDownSpy.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent)
    })

    it('should fire keyUp event handler when key is released', () => {
      const keyUpSpy = vi.fn()

      const chart = chartWithAccessibility({
        chart: {
          events: {
            keyUp: keyUpSpy,
          },
        },
      })

      const chartEl = chart.el.querySelector('.apexcharts-canvas')
      const event = new KeyboardEvent('keyup', { key: 'ArrowUp', bubbles: true })
      chartEl.dispatchEvent(event)

      expect(keyUpSpy).toHaveBeenCalledTimes(1)
      expect(keyUpSpy.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent)
    })

    it('should not fire keyboard events when accessibility is disabled', () => {
      const keyDownSpy = vi.fn()

      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          accessibility: {
            enabled: false,
          },
          events: {
            keyDown: keyDownSpy,
          },
        },
        series: [{ name: 'Test', data: [1, 2, 3] }],
      })

      const chartEl = chart.el.querySelector('.apexcharts-canvas')
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      chartEl.dispatchEvent(event)

      expect(keyDownSpy).not.toHaveBeenCalled()
    })

    it('should not fire keyboard events when keyboard is disabled', () => {
      const keyDownSpy = vi.fn()

      const chart = chartWithAccessibility({
        accessibility: {
          keyboard: {
            enabled: false,
          },
        },
        chart: {
          events: {
            keyDown: keyDownSpy,
          },
        },
      })

      const chartEl = chart.el.querySelector('.apexcharts-canvas')
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      chartEl.dispatchEvent(event)

      expect(keyDownSpy).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Different Chart Types
  // =========================================================================
  describe('different chart types', () => {
    it.each(['line', 'area', 'bar', 'scatter', 'bubble', 'heatmap'])(
      'should add accessibility attributes for %s chart',
      (chartType) => {
        const chart = chartWithAccessibility({
          type: chartType,
        })

        const svg = chart.el.querySelector('.apexcharts-svg')
        expect(svg.getAttribute('role')).toBe('img')

        const ariaLabel = svg.getAttribute('aria-label')
        expect(ariaLabel).toContain(chartType + ' chart')
      }
    )

    it('should work with pie charts', () => {
      const chart = chartWithAccessibility({
        type: 'pie',
        series: [44, 55, 13, 43],
        extra: {
          labels: ['Apple', 'Mango', 'Orange', 'Banana'],
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('role')).toBe('img')

      const ariaLabel = svg.getAttribute('aria-label')
      expect(ariaLabel).toContain('pie chart')
    })

    it('should work with donut charts', () => {
      const chart = chartWithAccessibility({
        type: 'donut',
        series: [30, 70],
        extra: {
          labels: ['Used', 'Free'],
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('role')).toBe('img')

      const ariaLabel = svg.getAttribute('aria-label')
      expect(ariaLabel).toContain('donut chart')
    })

    it('should work with radialBar charts', () => {
      const chart = chartWithAccessibility({
        type: 'radialBar',
        series: [70],
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('role')).toBe('img')

      const ariaLabel = svg.getAttribute('aria-label')
      expect(ariaLabel).toContain('radialBar chart')
    })
  })

  // =========================================================================
  // Focus Styles
  // =========================================================================
  describe('focus styles', () => {
    it('should have focus styles applied to legend items', () => {
      const chart = chartWithAccessibility()

      const legendItem = chart.el.querySelector('.apexcharts-legend-series')
      legendItem.focus()

      // Check if the element has the role attribute that enables focus styles
      expect(legendItem.getAttribute('role')).toBe('button')
      expect(legendItem.getAttribute('tabindex')).toBe('0')
    })
  })

  // =========================================================================
  // Integration with existing features
  // =========================================================================
  describe('integration with existing features', () => {
    it('should work with custom legend items', () => {
      const chart = chartWithAccessibility({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          customLegendItems: ['Custom One', 'Custom Two'],
        },
      })

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      const firstLabel = legendItems[0].getAttribute('aria-label')
      const secondLabel = legendItems[1].getAttribute('aria-label')

      expect(firstLabel).toContain('Custom One')
      expect(secondLabel).toContain('Custom Two')
    })

    it('should work with legend formatters', () => {
      const chart = chartWithAccessibility({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          formatter(seriesName) {
            return seriesName + ' (formatted)'
          },
        },
      })

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      const firstLabel = legendItems[0].getAttribute('aria-label')
      const secondLabel = legendItems[1].getAttribute('aria-label')

      expect(firstLabel).toContain('A (formatted)')
      expect(secondLabel).toContain('B (formatted)')
    })

    it('should not interfere with onItemClick.toggleDataSeries = false', () => {
      const chart = chartWithAccessibility({
        legend: {
          onItemClick: { toggleDataSeries: false },
        },
      })

      const legendItems = chart.el.querySelectorAll('.apexcharts-legend-series')
      legendItems.forEach((item) => {
        expect(item.classList.contains('apexcharts-no-click')).toBe(true)
        // Should still have accessibility attributes
        expect(item.getAttribute('role')).toBe('button')
        expect(item.getAttribute('tabindex')).toBe('0')
      })
    })
  })
})
