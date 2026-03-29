import { describe, it, expect, vi, afterEach } from 'vitest'
import Responsive from '../../src/modules/Responsive.js'
import Utils from '../../src/utils/Utils.js'
import Config from '../../src/modules/settings/Config.js'
import { createChartWithOptions } from './utils/utils.js'

// Ensure the ResizeObserver mock also has disconnect()
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal `w` state object for isolated Responsive unit tests.
 * Only sets what Responsive.checkResponsiveConfig actually reads.
 */
function makeW(overrides = {}) {
  const baseSeries = overrides.series || [{ name: 'A', data: [10, 20, 30] }]

  const baseConfig = {
    chart: { type: 'line', animations: { enabled: false } },
    xaxis: { type: 'category', convertedCatToNumeric: false },
    yaxis: [{ show: true }],
    series: Utils.clone(baseSeries),
    responsive: [],
    annotations: {},
    ...(overrides.config || {}),
  }

  // Run through Config.init to get a fully-resolved config
  const resolvedConfig = new Config(baseConfig).init({
    responsiveOverride: false,
  })

  // Make sure responsive is preserved (Config.init may drop it if empty)
  resolvedConfig.responsive =
    overrides.config?.responsive || baseConfig.responsive

  const globals = {
    initialConfig: Utils.extend({}, resolvedConfig),
    initialSeries: Utils.clone(baseSeries),
    ...(overrides.globals || {}),
  }

  return {
    config: resolvedConfig,
    globals,
    // stubs for slices that CoreUtils.extendArrayProps may read
    dom: {},
    interact: {},
    formatters: {},
    seriesData: {},
    rangeData: {},
    candleData: {},
    labelData: {},
    axisFlags: {},
    layout: {},
  }
}

/**
 * Set window.innerWidth for the duration of a callback.
 * Supports both sync and async callbacks.
 */
function setViewportWidth(width) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  })
}

function withViewportWidth(width, fn) {
  const original = window.innerWidth
  setViewportWidth(width)
  try {
    const result = fn()
    // If the callback returns a promise, restore after it settles
    if (result && typeof result.then === 'function') {
      return result.finally(() => setViewportWidth(original))
    }
    return result
  } finally {
    // Only restore synchronously if fn did NOT return a promise
    if (!fn._isAsync) {
      setViewportWidth(original)
    }
  }
}

// ---------------------------------------------------------------------------
// Unit tests — Responsive class in isolation
// ---------------------------------------------------------------------------

describe('Responsive', () => {
  describe('checkResponsiveConfig', () => {
    it('should be a no-op when responsive array is empty', () => {
      const w = makeW()
      const responsive = new Responsive(w)
      const configBefore = Utils.clone(w.config)

      responsive.checkResponsiveConfig(null)

      // Config should be unchanged
      expect(w.config.chart.type).toBe(configBefore.chart.type)
    })

    it('should not re-init config when viewport is above largest breakpoint (#2056)', () => {
      const w = makeW({
        config: {
          responsive: [
            { breakpoint: 600, options: { markers: { size: 1.5 } } },
            {
              breakpoint: 1024,
              options: { dataLabels: { style: { fontSize: '13px' } } },
            },
          ],
        },
      })
      const responsive = new Responsive(w)

      // Viewport is 1440px — above the largest breakpoint (1024)
      withViewportWidth(1440, () => {
        const configBefore = Utils.clone(w.config)
        responsive.checkResponsiveConfig(null)

        // Should NOT have run overrideResponsiveOptions — config unchanged
        expect(w.config.chart.type).toBe(configBefore.chart.type)
        expect(responsive._activeBreakpoint).toBeNull()
      })
    })

    it('should apply responsive options when viewport is below a breakpoint', () => {
      const w = makeW({
        config: {
          responsive: [
            {
              breakpoint: 1024,
              options: {
                legend: { position: 'bottom' },
              },
            },
          ],
        },
      })
      const responsive = new Responsive(w)

      withViewportWidth(800, () => {
        responsive.checkResponsiveConfig(null)

        expect(w.config.legend.position).toBe('bottom')
        expect(responsive._activeBreakpoint).toBe(1024)
      })
    })

    it('should reset config when transitioning from inside a breakpoint to above all breakpoints', () => {
      const w = makeW({
        config: {
          responsive: [
            {
              breakpoint: 1024,
              options: {
                legend: { position: 'bottom' },
              },
            },
          ],
        },
      })
      const responsive = new Responsive(w)

      // Step 1: Activate a breakpoint (viewport < 1024)
      withViewportWidth(800, () => {
        responsive.checkResponsiveConfig(null)
      })
      expect(responsive._activeBreakpoint).toBe(1024)
      expect(w.config.legend.position).toBe('bottom')

      // Step 2: Resize above the breakpoint (viewport > 1024)
      // This should restore the initial config
      withViewportWidth(1440, () => {
        responsive.checkResponsiveConfig(null)
      })
      expect(responsive._activeBreakpoint).toBeNull()
    })

    it('should handle multiple breakpoints and apply the correct one', () => {
      const w = makeW({
        config: {
          responsive: [
            {
              breakpoint: 600,
              options: {
                legend: { position: 'bottom' },
                markers: { size: 2 },
              },
            },
            {
              breakpoint: 1024,
              options: {
                legend: { position: 'top' },
              },
            },
          ],
        },
      })
      const responsive = new Responsive(w)

      // Viewport at 500 — below both breakpoints, both should apply
      // (sorted descending: 1024 first, then 600)
      withViewportWidth(500, () => {
        responsive.checkResponsiveConfig(null)

        // The last applied breakpoint wins for overlapping properties
        expect(w.config.legend.position).toBe('bottom')
        expect(responsive._activeBreakpoint).toBe(600)
      })
    })

    it('should handle viewport between two breakpoints', () => {
      const w = makeW({
        config: {
          responsive: [
            {
              breakpoint: 600,
              options: {
                markers: { size: 2 },
              },
            },
            {
              breakpoint: 1024,
              options: {
                legend: { position: 'top' },
              },
            },
          ],
        },
      })
      const responsive = new Responsive(w)

      // Viewport at 800 — below 1024 but above 600
      withViewportWidth(800, () => {
        responsive.checkResponsiveConfig(null)
        expect(w.config.legend.position).toBe('top')
        expect(responsive._activeBreakpoint).toBe(1024)
      })
    })

    it('should pass through user opts when viewport is above all breakpoints', () => {
      const w = makeW({
        config: {
          responsive: [
            {
              breakpoint: 1024,
              options: { legend: { position: 'bottom' } },
            },
          ],
        },
      })
      const responsive = new Responsive(w)

      // First activate a breakpoint so that the reset branch fires
      withViewportWidth(800, () => {
        responsive.checkResponsiveConfig(null)
      })
      expect(responsive._activeBreakpoint).toBe(1024)

      // Now resize above all breakpoints WITH user opts
      const userOpts = { chart: { type: 'bar' } }
      withViewportWidth(1440, () => {
        responsive.checkResponsiveConfig(userOpts)

        // User opts should be applied on top of the reset config
        expect(w.config.chart.type).toBe('bar')
        expect(responsive._activeBreakpoint).toBeNull()
      })
    })

    it('should not crash when initialConfig is null and viewport is above breakpoints', () => {
      const w = makeW({
        config: {
          responsive: [{ breakpoint: 600, options: {} }],
        },
      })
      w.globals.initialConfig = null
      const responsive = new Responsive(w)

      // Force the active breakpoint to simulate a transition
      responsive._activeBreakpoint = 600

      withViewportWidth(1440, () => {
        // Should not throw
        expect(() => responsive.checkResponsiveConfig(null)).not.toThrow()
      })
    })

    it('should preserve series data during responsive config reset', () => {
      const initialSeries = [{ name: 'A', data: [10, 20, 30] }]
      const updatedSeries = [
        { name: 'A', data: [100, 200, 300] },
        { name: 'B', data: [40, 50, 60] },
      ]

      const w = makeW({
        series: initialSeries,
        config: {
          responsive: [
            {
              breakpoint: 1024,
              options: { legend: { position: 'bottom' } },
            },
          ],
        },
      })
      const responsive = new Responsive(w)

      // Step 1: Activate breakpoint
      withViewportWidth(800, () => {
        responsive.checkResponsiveConfig(null)
      })
      expect(responsive._activeBreakpoint).toBe(1024)

      // Step 2: Simulate series update (user calls updateSeries)
      w.config.series = Utils.clone(updatedSeries)

      // Step 3: Resize above breakpoint — config resets but series should be preserved
      withViewportWidth(1440, () => {
        responsive.checkResponsiveConfig(null)
      })
      // Series should not be reverted to initialConfig's series
      expect(w.config.series.length).toBe(2)
      expect(w.config.series[0].data).toEqual([100, 200, 300])
    })

    it('should not call overrideResponsiveOptions on repeated calls above breakpoint', () => {
      const w = makeW({
        config: {
          responsive: [{ breakpoint: 600, options: { markers: { size: 2 } } }],
        },
      })
      const responsive = new Responsive(w)
      const spy = vi.spyOn(responsive, 'overrideResponsiveOptions')

      // Call multiple times at a wide viewport — should never trigger reset
      withViewportWidth(1440, () => {
        responsive.checkResponsiveConfig(null)
        responsive.checkResponsiveConfig(null)
        responsive.checkResponsiveConfig(null)
      })

      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})

// ---------------------------------------------------------------------------
// Integration tests — full chart lifecycle
// ---------------------------------------------------------------------------

describe('Responsive (integration)', () => {
  let chart
  const originalWidth = window.innerWidth

  afterEach(async () => {
    if (chart) {
      chart.destroy()
      chart = null
    }
    document.body.innerHTML = ''
    setViewportWidth(originalWidth)
  })

  it('should render chart without errors when responsive config is set and viewport is above all breakpoints (#2056)', () => {
    setViewportWidth(1440)
    chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'Test', data: [10, 20, 30] }],
      responsive: [
        {
          breakpoint: 600,
          options: { markers: { size: 1.5 } },
        },
        {
          breakpoint: 1024,
          options: {
            dataLabels: { style: { fontSize: '13px' } },
          },
        },
      ],
    })

    // Chart should have rendered
    const svg = document.querySelector('.apexcharts-svg')
    expect(svg).toBeTruthy()
  })

  it('should not break when updateSeries is called with responsive config and viewport above breakpoints (#2056)', async () => {
    setViewportWidth(1440)
    chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'Test', data: [10, 20, 30] }],
      responsive: [
        {
          breakpoint: 1024,
          options: { legend: { position: 'bottom' } },
        },
      ],
    })

    // Update series — this was the specific crash scenario in #2056
    await chart.updateSeries([{ name: 'Test', data: [40, 50, 60, 70] }])

    const svg = document.querySelector('.apexcharts-svg')
    expect(svg).toBeTruthy()
  })

  it('should not break when series length changes with responsive config (#2056)', async () => {
    setViewportWidth(1440)
    chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [10, 20, 30] }],
      responsive: [
        {
          breakpoint: 1024,
          options: { legend: { position: 'bottom' } },
        },
      ],
    })

    // Change series count — the exact trigger for #2056
    await chart.updateSeries([
      { name: 'A', data: [40, 50, 60] },
      { name: 'B', data: [70, 80, 90] },
    ])

    const svg = document.querySelector('.apexcharts-svg')
    expect(svg).toBeTruthy()
  })

  it('should apply responsive options correctly at a narrow viewport', () => {
    setViewportWidth(500)
    chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [{ name: 'Sales', data: [10, 20, 30] }],
      legend: { position: 'right' },
      responsive: [
        {
          breakpoint: 768,
          options: {
            legend: { position: 'bottom' },
          },
        },
      ],
    })

    expect(chart.w.config.legend.position).toBe('bottom')
  })

  it('should handle empty responsive options array gracefully', () => {
    setViewportWidth(1440)
    chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'Test', data: [1, 2] }],
      responsive: [],
    })

    const svg = document.querySelector('.apexcharts-svg')
    expect(svg).toBeTruthy()
  })
})
