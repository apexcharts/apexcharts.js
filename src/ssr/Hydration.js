import ApexCharts from '../apexcharts.js'
import { Environment } from '../utils/Environment.js'

/**
 * Hydration - Client-side hydration for server-rendered charts
 *
 * Provides methods to reactivate server-rendered charts with full interactivity,
 * animations, and event handling without visual flash.
 */
export class Hydration {
  /**
   * Hydrate a single server-rendered chart
   *
   * @param {HTMLElement} el - Container element with data-apexcharts-hydrate attribute
   * @param {object} clientOptions - Optional config overrides for client-side (e.g., enable animations)
   * @returns {ApexCharts} Hydrated chart instance
   *
   * @example
   * // Hydrate with default settings
   * const chart = Hydration.hydrate(document.getElementById('my-chart'));
   *
   * @example
   * // Hydrate with custom options
   * const chart = Hydration.hydrate(element, {
   *   chart: {
   *     animations: { enabled: true, speed: 800 }
   *   }
   * });
   */
  static hydrate(el, clientOptions = {}) {
    // Only works in browser
    if (!Environment.isBrowser()) {
      throw new Error('Hydration can only be performed in browser environment')
    }

    if (!el) {
      throw new Error('Element is required for hydration')
    }

    // Verify element has hydration data
    if (!el.hasAttribute('data-apexcharts-hydrate')) {
      throw new Error('Element does not have data-apexcharts-hydrate attribute')
    }

    // Extract configuration from data attribute
    const configAttr = el.getAttribute('data-apexcharts-config')
    if (!configAttr) {
      throw new Error('Element is missing data-apexcharts-config attribute')
    }

    // Decode the configuration
    const ssrConfig = this._decodeConfig(configAttr)

    // Merge SSR config with client overrides
    const config = this._mergeConfigs(ssrConfig, clientOptions)

    // Store reference to SSR content for smooth transition
    const ssrContent = el.innerHTML

    // Create chart instance
    const chart = new ApexCharts(el, config)

    // Before clearing SSR content, measure to avoid flash
    const rect = el.getBoundingClientRect()

    // Set explicit dimensions to prevent layout shift
    el.style.width = `${rect.width}px`
    el.style.height = `${rect.height}px`

    // Clear SSR content
    el.innerHTML = ''

    // Remove hydration attributes
    el.removeAttribute('data-apexcharts-hydrate')
    el.removeAttribute('data-apexcharts-config')

    // Render chart (this will create new interactive SVG)
    chart
      .render()
      .then(() => {
        // Mark as hydrated
        el.setAttribute('data-apexcharts-hydrated', 'true')

        // Remove explicit dimensions (let chart be responsive)
        el.style.width = ''
        el.style.height = ''

        // Dispatch custom event for tracking
        const event = new CustomEvent('apexcharts:hydrated', {
          detail: { chart, ssrContent },
        })
        el.dispatchEvent(event)
      })
      .catch((error) => {
        console.error('ApexCharts hydration failed:', error)

        // Restore SSR content on failure
        el.innerHTML = ssrContent
        el.setAttribute('data-apexcharts-hydrate', '')
        el.setAttribute('data-apexcharts-config', configAttr)

        throw error
      })

    return chart
  }

  /**
   * Auto-hydrate all server-rendered charts on the page
   *
   * @param {string} selector - CSS selector for containers (default: '[data-apexcharts-hydrate]')
   * @param {object} clientOptions - Optional config overrides applied to all charts
   * @returns {ApexCharts[]} Array of hydrated chart instances
   *
   * @example
   * // Hydrate all charts on page load
   * document.addEventListener('DOMContentLoaded', () => {
   *   ApexCharts.hydrateAll();
   * });
   *
   * @example
   * // Hydrate with animations enabled
   * ApexCharts.hydrateAll('[data-apexcharts-hydrate]', {
   *   chart: { animations: { enabled: true } }
   * });
   */
  static hydrateAll(selector = '[data-apexcharts-hydrate]', clientOptions = {}) {
    // Only works in browser
    if (!Environment.isBrowser()) {
      throw new Error('Hydration can only be performed in browser environment')
    }

    const elements = document.querySelectorAll(selector)

    if (elements.length === 0) {
      console.warn(`No elements found matching selector: ${selector}`)
      return []
    }

    const charts = []

    elements.forEach((el) => {
      try {
        const chart = this.hydrate(el, clientOptions)
        charts.push(chart)
      } catch (error) {
        console.error('Failed to hydrate element:', el, error)
      }
    })

    return charts
  }

  /**
   * Check if an element has been hydrated
   *
   * @param {HTMLElement} el - Element to check
   * @returns {boolean} True if element has been hydrated
   */
  static isHydrated(el) {
    if (!el) return false
    return el.hasAttribute('data-apexcharts-hydrated')
  }

  /**
   * Decode configuration from base64-encoded data attribute
   * @private
   */
  static _decodeConfig(encodedConfig) {
    try {
      let json

      // Try atob (browser standard)
      if (typeof atob !== 'undefined') {
        json = atob(encodedConfig)
      } else if (typeof Buffer !== 'undefined') {
        // Fallback to Buffer (if polyfilled in browser)
        json = Buffer.from(encodedConfig, 'base64').toString('utf-8')
      } else {
        // Fallback: URL-safe JSON decoding
        json = decodeURIComponent(encodedConfig)
      }

      return JSON.parse(json)
    } catch (error) {
      throw new Error(`Failed to decode chart config: ${error.message}`)
    }
  }

  /**
   * Merge SSR configuration with client-side overrides
   * @private
   */
  static _mergeConfigs(ssrConfig, clientOptions) {
    // Deep merge, with clientOptions taking precedence
    const merged = {
      ...ssrConfig,
      ...clientOptions,
    }

    // Special handling for chart object (deep merge)
    if (ssrConfig.chart || clientOptions.chart) {
      merged.chart = {
        ...ssrConfig.chart,
        ...clientOptions.chart,
      }

      // Re-enable animations by default for hydration (unless explicitly disabled)
      if (merged.chart.animations === undefined || merged.chart.animations.enabled === false) {
        merged.chart.animations = {
          ...(merged.chart.animations || {}),
          enabled: true,
        }
      }

      // Re-enable toolbar if it was disabled for SSR (unless explicitly set)
      if (clientOptions.chart?.toolbar === undefined && ssrConfig.chart?.toolbar?.show === false) {
        merged.chart.toolbar = {
          ...(merged.chart.toolbar || {}),
          show: true,
        }
      }
    }

    return merged
  }
}
