import ApexCharts from '../apexcharts.js'
import { BrowserAPIs } from './BrowserAPIs.js'
import { Environment } from '../utils/Environment.js'

/**
 * SSRRenderer - Server-Side Rendering API for ApexCharts
 *
 * Provides methods to render charts to SVG strings or hydration-ready HTML
 * for use in Node.js, Next.js, Nuxt, SvelteKit, and other SSR frameworks.
 */
export class SSRRenderer {
  /**
   * Render chart to SVG string for server-side rendering
   *
   * @param {object} options - Chart configuration (same as ApexCharts constructor)
   * @param {object} ssrOptions - SSR-specific options
   * @param {number} ssrOptions.width - Chart width in pixels (default: 400)
   * @param {number} ssrOptions.height - Chart height in pixels (default: 300)
   * @param {number} ssrOptions.scale - SVG scale factor (default: 1)
   * @returns {Promise<string>} SVG string
   *
   * @example
   * const svgString = await SSRRenderer.renderToString({
   *   series: [{ data: [30, 40, 35] }],
   *   chart: { type: 'bar' }
   * }, {
   *   width: 500,
   *   height: 300
   * });
   */
  static async renderToString(options, ssrOptions = {}) {
    // Initialize BrowserAPIs shim if in SSR
    if (Environment.isSSR()) {
      BrowserAPIs.init()
    }

    const { width = 400, height = 300, scale = 1 } = ssrOptions

    // Create virtual element context for SSR
    const virtualEl = this._createVirtualElement(width, height)

    // Merge config with SSR overrides
    const ssrConfig = {
      ...options,
      chart: {
        ...options.chart,
        width,
        height,
        // Disable interactive features for SSR
        toolbar: { show: false },
        animations: { enabled: false },
      },
    }

    // Create chart instance
    const chart = new ApexCharts(virtualEl, ssrConfig)

    try {
      // Render the chart
      await chart.render()

      // Extract SVG string
      // The chart's SVG is in gl.dom.Paper.node
      const svgString = this._extractSVGString(chart, scale)

      // Clean up
      chart.destroy()

      return svgString
    } catch (error) {
      // Ensure cleanup on error
      chart.destroy()
      throw new Error(`SSR rendering failed: ${error.message}`)
    }
  }

  /**
   * Generate hydration-ready HTML with embedded configuration
   *
   * @param {object} options - Chart configuration
   * @param {object} ssrOptions - SSR-specific options
   * @param {number} ssrOptions.width - Chart width in pixels (default: 400)
   * @param {number} ssrOptions.height - Chart height in pixels (default: 300)
   * @param {number} ssrOptions.scale - SVG scale factor (default: 1)
   * @param {string} ssrOptions.className - Additional CSS class for wrapper (default: '')
   * @returns {Promise<string>} HTML string with SVG and hydration data
   *
   * @example
   * const html = await SSRRenderer.renderToHTML({
   *   series: [{ data: [30, 40, 35] }],
   *   chart: { type: 'bar' }
   * }, {
   *   width: 500,
   *   height: 300
   * });
   */
  static async renderToHTML(options, ssrOptions = {}) {
    const { className = '' } = ssrOptions

    // Render to SVG string
    const svgString = await this.renderToString(options, ssrOptions)

    // Encode configuration for client-side hydration
    const dataConfig = this._encodeConfig(options)

    // Generate hydration-ready HTML
    const wrapperClass = `apexcharts-ssr-wrapper${className ? ' ' + className : ''}`

    return `<div class="${wrapperClass}" data-apexcharts-hydrate data-apexcharts-config="${dataConfig}">
${svgString}
</div>`
  }

  /**
   * Create a virtual DOM element for SSR rendering
   * @private
   */
  static _createVirtualElement(width, height) {
    if (Environment.isBrowser()) {
      // In browser, create real element
      const el = document.createElement('div')
      el.style.width = `${width}px`
      el.style.height = `${height}px`
      return el
    }

    // In SSR, create virtual element
    return {
      _ssrWidth: width,
      _ssrHeight: height,
      _ssrMode: true,
      nodeType: 1,
      nodeName: 'DIV',
      children: [],
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
      },
      appendChild(child) {
        this.children.push(child)
      },
      removeChild(child) {
        const index = this.children.indexOf(child)
        if (index > -1) this.children.splice(index, 1)
      },
      querySelector() {
        return null
      },
      querySelectorAll() {
        return []
      },
      getAttribute() {
        return null
      },
      setAttribute() {},
      removeAttribute() {},
      hasAttribute() {
        return false
      },
      getBoundingClientRect() {
        return {
          width: this._ssrWidth,
          height: this._ssrHeight,
          top: 0,
          left: 0,
          right: this._ssrWidth,
          bottom: this._ssrHeight,
          x: 0,
          y: 0,
        }
      },
      get parentNode() {
        return null
      },
      get isConnected() {
        return true
      },
      getRootNode() {
        return this
      },
    }
  }

  /**
   * Extract SVG string from rendered chart
   * @private
   */
  static _extractSVGString(chart, scale = 1) {
    const w = chart.w

    if (!w || !w.dom || !w.dom.Paper) {
      throw new Error('Chart not properly initialized')
    }

    const svgNode = w.dom.Paper.node

    // If we have a real SVG element (browser), serialize it
    if (Environment.isBrowser() && svgNode instanceof SVGElement) {
      const serializer = new XMLSerializer()
      let svgString = serializer.serializeToString(svgNode)

      // Apply scale if needed
      if (scale !== 1) {
        svgString = this._applyScale(svgString, scale)
      }

      return svgString
    }

    // In SSR, use the toString() method from SSRElement
    if (svgNode && typeof svgNode.toString === 'function') {
      let svgString = svgNode.toString()

      // Apply scale if needed
      if (scale !== 1) {
        svgString = this._applyScale(svgString, scale)
      }

      return svgString
    }

    throw new Error('Unable to extract SVG string from chart')
  }

  /**
   * Apply scale transformation to SVG string
   * @private
   */
  static _applyScale(svgString, scale) {
    // Parse width and height from SVG
    const widthMatch = svgString.match(/width="([^"]+)"/)
    const heightMatch = svgString.match(/height="([^"]+)"/)

    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1])
      const height = parseFloat(heightMatch[1])
      const scaledWidth = width * scale
      const scaledHeight = height * scale

      // Replace width and height attributes
      svgString = svgString
        .replace(/width="[^"]+"/, `width="${scaledWidth}"`)
        .replace(/height="[^"]+"/, `height="${scaledHeight}"`)
    }

    return svgString
  }

  /**
   * Encode configuration for client-side hydration
   * @private
   */
  static _encodeConfig(config) {
    try {
      const json = JSON.stringify(config)

      // Use Buffer in Node.js, btoa in browser
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(json).toString('base64')
      } else if (typeof btoa !== 'undefined') {
        return btoa(json)
      }

      // Fallback: URL-safe JSON encoding
      return encodeURIComponent(json)
    } catch (error) {
      throw new Error(`Failed to encode config: ${error.message}`)
    }
  }

  /**
   * Decode configuration from hydration data
   * @private
   */
  static _decodeConfig(encodedConfig) {
    try {
      let json

      // Try Buffer first (Node.js)
      if (typeof Buffer !== 'undefined') {
        json = Buffer.from(encodedConfig, 'base64').toString('utf-8')
      } else if (typeof atob !== 'undefined') {
        json = atob(encodedConfig)
      } else {
        // Fallback: URL-safe JSON decoding
        json = decodeURIComponent(encodedConfig)
      }

      return JSON.parse(json)
    } catch (error) {
      throw new Error(`Failed to decode config: ${error.message}`)
    }
  }
}
