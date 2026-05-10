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
      // Keyboard navigation is enabled by default → role="application" so that
      // screen readers pass arrow keys through to the chart widget.
      expect(svg.getAttribute('role')).toBe('application')
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
      // Keyboard navigation enabled by default → role="application"
      expect(svg.getAttribute('role')).toBe('application')
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
    it('should add role="application" to main SVG element when keyboard navigation is enabled', () => {
      const chart = chartWithAccessibility()

      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('role')).toBe('application')
    })

    it('should add role="img" to main SVG element when keyboard navigation is disabled', () => {
      const chart = chartWithAccessibility({
        accessibility: {
          keyboard: {
            enabled: true,
            navigation: { enabled: false },
          },
        },
      })

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
  // DOM Ordering (Critical for interaction handling)
  // =========================================================================
  describe('DOM ordering', () => {
    it('should ensure foreignObject is first child to prevent blocking interactions', () => {
      // This test prevents regression of the tooltip blocking bug
      // foreignObject must be at the back (first child) in SVG z-order
      const chart = chartWithAccessibility({
        title: {
          text: 'Test Chart',
        },
        accessibility: {
          description: 'Test description',
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      const foreignObject = svg.querySelector('foreignObject')
      const descEl = svg.querySelector('desc')

      // foreignObject should exist
      expect(foreignObject).not.toBeNull()

      // foreignObject must be the first child to stay at the back
      expect(svg.firstChild).toBe(foreignObject)

      // desc should come after foreignObject
      expect(descEl).not.toBeNull()

      // Get all child nodes (including text nodes) and filter for elements
      const children = Array.from(svg.childNodes).filter(node => node.nodeType === 1)
      const foreignObjectIndex = children.indexOf(foreignObject)
      const descIndex = children.indexOf(descEl)

      // foreignObject must be before desc
      expect(foreignObjectIndex).toBe(0)
      expect(descIndex).toBeGreaterThan(foreignObjectIndex)
    })

    it('should maintain foreignObject as first child even without accessibility', () => {
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
      const foreignObject = svg.querySelector('foreignObject')

      expect(foreignObject).not.toBeNull()
      expect(svg.firstChild).toBe(foreignObject)
    })

    it('should maintain correct DOM order across different chart types', () => {
      const chartTypes = ['line', 'bar', 'area']

      chartTypes.forEach(type => {
        const chart = chartWithAccessibility({
          type,
          title: {
            text: 'Test Chart',
          },
        })

        const svg = chart.el.querySelector('.apexcharts-svg')
        const foreignObject = svg.querySelector('foreignObject')

        expect(foreignObject).not.toBeNull()
        expect(svg.firstChild).toBe(foreignObject)
      })
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
    // Keyboard navigation is enabled by default, so the SVG gets
    // role="application" (allows screen readers to pass arrow keys through).
    it.each(['line', 'area', 'bar', 'scatter', 'bubble', 'heatmap'])(
      'should add accessibility attributes for %s chart',
      (chartType) => {
        const chart = chartWithAccessibility({
          type: chartType,
        })

        const svg = chart.el.querySelector('.apexcharts-svg')
        expect(svg.getAttribute('role')).toBe('application')

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
      expect(svg.getAttribute('role')).toBe('application')

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
      expect(svg.getAttribute('role')).toBe('application')

      const ariaLabel = svg.getAttribute('aria-label')
      expect(ariaLabel).toContain('donut chart')
    })

    it('should work with radialBar charts', () => {
      const chart = chartWithAccessibility({
        type: 'radialBar',
        series: [70],
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('role')).toBe('application')

      const ariaLabel = svg.getAttribute('aria-label')
      expect(ariaLabel).toContain('radialBar chart')
    })

    it('should use role="img" when keyboard navigation is disabled', () => {
      const chart = chartWithAccessibility({
        type: 'line',
        accessibility: {
          keyboard: {
            enabled: true,
            navigation: { enabled: false },
          },
        },
      })

      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(svg.getAttribute('role')).toBe('img')
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

  // =========================================================================
  // Color blind mode (theme.accessibility.colorBlindMode)
  // =========================================================================
  describe('colorBlindMode', () => {
    it('should use deuteranopia palette when colorBlindMode is deuteranopia', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'A', data: [1, 2, 3] }],
        theme: { accessibility: { colorBlindMode: 'deuteranopia' } },
      })
      expect(chart.w.globals.colors[0]).toBe('#0072B2')
    })

    it('should use protanopia palette when colorBlindMode is protanopia', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'A', data: [1, 2, 3] }],
        theme: { accessibility: { colorBlindMode: 'protanopia' } },
      })
      expect(chart.w.globals.colors[0]).toBe('#0077BB')
    })

    it('should use tritanopia palette when colorBlindMode is tritanopia', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'A', data: [1, 2, 3] }],
        theme: { accessibility: { colorBlindMode: 'tritanopia' } },
      })
      expect(chart.w.globals.colors[0]).toBe('#CC3311')
    })

    it('should use high contrast palette when colorBlindMode is highContrast', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'A', data: [1, 2, 3] }],
        theme: { accessibility: { colorBlindMode: 'highContrast' } },
      })
      expect(chart.w.globals.colors[0]).toBe('#005A9C')
    })

    it('should add apexcharts-high-contrast class to wrapper when colorBlindMode is highContrast', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'A', data: [1, 2, 3] }],
        theme: { accessibility: { colorBlindMode: 'highContrast' } },
      })
      expect(chart.el.querySelector('.apexcharts-canvas').classList.contains('apexcharts-high-contrast')).toBe(true)
    })

    it('should not override CVD palette when theme.palette is also set', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'A', data: [1, 2, 3] }],
        theme: { palette: 'palette3', accessibility: { colorBlindMode: 'deuteranopia' } },
      })
      // colorBlindMode takes priority over theme.palette
      expect(chart.w.globals.colors[0]).toBe('#0072B2')
    })

    it('should use default palette when colorBlindMode is empty string', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line' },
        series: [{ name: 'A', data: [1, 2, 3] }],
        theme: { accessibility: { colorBlindMode: '' } },
      })
      // palette1 default
      expect(chart.w.globals.colors[0]).toBe('#008FFB')
    })
  })

  // =========================================================================
  // Regression guard for #5183 — root SVG <title> must NOT be added,
  // because browsers render it as a native tooltip on hover and that
  // covers the chart's own data tooltip.
  // =========================================================================
  describe('no root SVG <title> element (#5183)', () => {
    const getRootTitle = (svg) => svg.querySelector(':scope > title')

    it('does not add a root <title> when accessibility is enabled with a chart title', () => {
      const chart = chartWithAccessibility({
        title: { text: 'Quarterly Report' },
      })
      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(getRootTitle(svg)).toBeNull()
    })

    it('does not add a root <title> when accessibility.description is provided', () => {
      const chart = chartWithAccessibility({
        accessibility: { description: 'Custom long description' },
      })
      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(getRootTitle(svg)).toBeNull()
    })

    it('does not add a root <title> when accessibility is disabled', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', accessibility: { enabled: false } },
        series: [{ name: 'A', data: [1, 2, 3] }],
      })
      const svg = chart.el.querySelector('.apexcharts-svg')
      expect(getRootTitle(svg)).toBeNull()
    })
  })

  // =========================================================================
  // Phase 2.1 — enriched auto-generated alt text
  // =========================================================================
  describe('Auto-generated aria-label includes series names', () => {
    it('lists series names when no title is configured', () => {
      const chart = createChartWithOptions({
        chart: { type: 'bar', accessibility: { enabled: true } },
        series: [
          { name: 'Sales', data: [1, 2, 3] },
          { name: 'Revenue', data: [4, 5, 6] },
        ],
      })
      const ariaLabel = chart.el
        .querySelector('.apexcharts-svg')
        .getAttribute('aria-label')
      expect(ariaLabel).toContain('Sales')
      expect(ariaLabel).toContain('Revenue')
      expect(ariaLabel).toContain('bar chart')
      expect(ariaLabel).toContain('2 data series')
    })

    it('falls back to count-only label when series have no names', () => {
      const chart = createChartWithOptions({
        chart: { type: 'line', accessibility: { enabled: true } },
        series: [{ data: [1, 2, 3] }],
      })
      const ariaLabel = chart.el
        .querySelector('.apexcharts-svg')
        .getAttribute('aria-label')
      expect(ariaLabel).toContain('1 data series')
    })
  })

  // =========================================================================
  // Phase 4.1 — sr-only aria-live status region
  // =========================================================================
  describe('Status messages live region (sr-status)', () => {
    it('creates a polite aria-live region when announcements are enabled', () => {
      const chart = chartWithAccessibility()
      const status = chart.el.querySelector('.apexcharts-sr-status')
      expect(status).not.toBeNull()
      expect(status.getAttribute('role')).toBe('status')
      expect(status.getAttribute('aria-live')).toBe('polite')
      expect(status.getAttribute('aria-atomic')).toBe('true')
    })

    it('omits the live region when announcements are disabled', () => {
      const chart = chartWithAccessibility({
        accessibility: { announcements: { enabled: false } },
      })
      expect(chart.el.querySelector('.apexcharts-sr-status')).toBeNull()
    })
  })

  // =========================================================================
  // Phase 4.2 — toolbar uses native <button> elements
  // =========================================================================
  describe('Toolbar uses native <button> elements', () => {
    it('renders zoom/pan/reset buttons as <button type="button">', () => {
      const chart = createChartWithOptions({
        chart: {
          type: 'line',
          toolbar: { show: true },
          zoom: { enabled: true },
        },
        series: [{ name: 'A', data: [1, 2, 3, 4] }],
      })
      const zoomIn = chart.el.querySelector('.apexcharts-zoomin-icon')
      const zoomOut = chart.el.querySelector('.apexcharts-zoomout-icon')
      const reset = chart.el.querySelector('.apexcharts-reset-icon')
      const menu = chart.el.querySelector('.apexcharts-menu-icon')
      for (const el of [zoomIn, zoomOut, reset, menu]) {
        expect(el).not.toBeNull()
        expect(el.tagName).toBe('BUTTON')
        expect(el.getAttribute('type')).toBe('button')
        // role="button" and tabindex are now redundant on native <button>
        expect(el.getAttribute('role')).toBeNull()
        expect(el.getAttribute('tabindex')).toBeNull()
      }
    })
  })
})
