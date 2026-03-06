import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'

// Register all chart types and features as side-effects. SSRRenderer imports the
// bare ApexCharts class directly, so chart types must be pre-registered here.
import '../../../src/entries/full.js'

describe('SSRRenderer', () => {
  describe('_encodeConfig()', () => {
    it('should encode config to base64', () => {
      const config = {
        series: [{ data: [30, 40, 35] }],
        chart: { type: 'bar' },
      }

      const encoded = SSRRenderer._encodeConfig(config)

      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
      // Verify it's valid base64 (no whitespace, only valid base64 characters)
      expect(/^[A-Za-z0-9+/]+=*$/.test(encoded)).toBe(true)
    })

    it('should handle complex nested objects', () => {
      const config = {
        series: [{ data: [1, 2, 3] }],
        chart: {
          type: 'line',
          animations: {
            enabled: true,
            speed: 800,
            dynamicAnimation: {
              enabled: true,
              speed: 350,
            },
          },
        },
        xaxis: { categories: ['A', 'B', 'C'] },
      }

      const encoded = SSRRenderer._encodeConfig(config)
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should handle arrays in config', () => {
      const config = {
        series: [
          { name: 'Series 1', data: [30, 40, 35] },
          { name: 'Series 2', data: [50, 60, 55] },
        ],
      }

      const encoded = SSRRenderer._encodeConfig(config)
      expect(typeof encoded).toBe('string')
      expect(encoded.length).toBeGreaterThan(0)
    })

    it('should handle empty objects', () => {
      const encoded = SSRRenderer._encodeConfig({})
      expect(typeof encoded).toBe('string')
      expect(encoded).toBe('e30=') // Base64 for '{}'
    })
  })

  describe('_decodeConfig()', () => {
    it('should decode base64 to config object', () => {
      const config = {
        series: [{ data: [30, 40, 35] }],
        chart: { type: 'bar' },
        xaxis: { categories: ['A', 'B', 'C'] },
      }

      const encoded = SSRRenderer._encodeConfig(config)
      const decoded = SSRRenderer._decodeConfig(encoded)

      expect(decoded).toEqual(config)
    })

    it('should handle complex nested objects', () => {
      const config = {
        series: [{ data: [1, 2, 3] }],
        chart: {
          type: 'line',
          animations: {
            enabled: true,
            speed: 800,
            dynamicAnimation: {
              enabled: true,
              speed: 350,
            },
          },
        },
      }

      const encoded = SSRRenderer._encodeConfig(config)
      const decoded = SSRRenderer._decodeConfig(encoded)

      expect(decoded).toEqual(config)
    })

    it('should handle arrays in config', () => {
      const config = {
        series: [
          { name: 'Series 1', data: [30, 40, 35] },
          { name: 'Series 2', data: [50, 60, 55] },
        ],
      }

      const encoded = SSRRenderer._encodeConfig(config)
      const decoded = SSRRenderer._decodeConfig(encoded)

      expect(decoded).toEqual(config)
    })

    it('should throw error for invalid base64', () => {
      expect(() => {
        SSRRenderer._decodeConfig('invalid-base64-!@#$%')
      }).toThrow()
    })

    it('should throw error for invalid JSON after decode', () => {
      // Valid base64 but invalid JSON
      const invalidBase64 = Buffer.from('not valid json').toString('base64')
      expect(() => {
        SSRRenderer._decodeConfig(invalidBase64)
      }).toThrow()
    })
  })

  describe('_applyScale()', () => {
    it('should scale SVG width and height', () => {
      const svgString = '<svg width="400" height="300"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      expect(scaled).toContain('width="800"')
      expect(scaled).toContain('height="600"')
    })

    it('should handle scale of 1 (no change)', () => {
      const svgString = '<svg width="400" height="300"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 1)

      expect(scaled).toContain('width="400"')
      expect(scaled).toContain('height="300"')
    })

    it('should handle fractional scale', () => {
      const svgString = '<svg width="400" height="300"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 0.5)

      expect(scaled).toContain('width="200"')
      expect(scaled).toContain('height="150"')
    })

    it('should handle large scale factors', () => {
      const svgString = '<svg width="100" height="100"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 5)

      expect(scaled).toContain('width="500"')
      expect(scaled).toContain('height="500"')
    })

    it('should preserve SVG without dimensions', () => {
      const svgString = '<svg></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      expect(scaled).toBe('<svg></svg>')
    })

    it('should preserve other SVG attributes', () => {
      const svgString =
        '<svg width="400" height="300" viewBox="0 0 400 300" class="my-chart"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      expect(scaled).toContain('viewBox="0 0 400 300"')
      expect(scaled).toContain('class="my-chart"')
      expect(scaled).toContain('width="800"')
      expect(scaled).toContain('height="600"')
    })

    it('should not scale SVG with only width (needs both dimensions)', () => {
      const svgString = '<svg width="400"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      // _applyScale only works when both width AND height are present
      expect(scaled).toBe('<svg width="400"></svg>')
    })

    it('should not scale SVG with only height (needs both dimensions)', () => {
      const svgString = '<svg height="300"></svg>'
      const scaled = SSRRenderer._applyScale(svgString, 2)

      // _applyScale only works when both width AND height are present
      expect(scaled).toBe('<svg height="300"></svg>')
    })
  })

  // ── End-to-end renderToString / renderToHTML ──────────────────────────────
  //
  // These tests simulate a true Node.js (SSR) environment by nulling out
  // window, document, and navigator — the same technique used by
  // environment.spec.js. BrowserAPIs shim is reset between tests so
  // state from one render doesn't leak into the next.

  describe('renderToString() — SSR environment simulation', () => {
    let savedWindow, savedDocument, savedNavigator

    beforeEach(() => {
      savedWindow = global.window
      savedDocument = global.document
      savedNavigator = global.navigator

      // Simulate Node.js: no window, no document, no navigator
      global.window = undefined
      global.document = undefined
      global.navigator = undefined

      // Reset the BrowserAPIs shim so each test starts clean
      BrowserAPIs._resetShim()
    })

    afterEach(() => {
      global.window = savedWindow
      global.document = savedDocument
      global.navigator = savedNavigator
      BrowserAPIs._resetShim()
    })

    it('renders a line chart to an SVG string without throwing', async () => {
      const svg = await SSRRenderer.renderToString({
        series: [{ name: 'Sales', data: [30, 40, 35, 50, 49, 60] }],
        chart: { type: 'line' },
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
      })

      expect(typeof svg).toBe('string')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })

    it('renders a bar chart to an SVG string without throwing', async () => {
      const svg = await SSRRenderer.renderToString({
        series: [{ name: 'Revenue', data: [10, 20, 30] }],
        chart: { type: 'bar' },
        xaxis: { categories: ['Q1', 'Q2', 'Q3'] },
      })

      expect(typeof svg).toBe('string')
      expect(svg).toContain('<svg')
    })

    it('renders a pie chart to an SVG string without throwing', async () => {
      const svg = await SSRRenderer.renderToString({
        series: [44, 55, 13],
        chart: { type: 'pie' },
        labels: ['Team A', 'Team B', 'Team C'],
      })

      expect(typeof svg).toBe('string')
      expect(svg).toContain('<svg')
    })

    it('respects custom width and height', async () => {
      const svg = await SSRRenderer.renderToString(
        {
          series: [{ data: [1, 2, 3] }],
          chart: { type: 'line' },
        },
        { width: 600, height: 400 }
      )

      expect(svg).toMatch(/width="600"/)
      expect(svg).toMatch(/height="400"/)
    })

    it('applies scale factor to the output SVG dimensions', async () => {
      const svg = await SSRRenderer.renderToString(
        {
          series: [{ data: [1, 2, 3] }],
          chart: { type: 'line' },
        },
        { width: 400, height: 300, scale: 2 }
      )

      expect(svg).toMatch(/width="800"/)
      expect(svg).toMatch(/height="600"/)
    })

    it('renderToHTML wraps the SVG in a hydration-ready div', async () => {
      const html = await SSRRenderer.renderToHTML({
        series: [{ data: [1, 2, 3] }],
        chart: { type: 'line' },
      })

      expect(html).toContain('data-apexcharts-hydrate')
      expect(html).toContain('data-apexcharts-config=')
      expect(html).toContain('<svg')
      expect(html).toContain('apexcharts-ssr-wrapper')
    })

    it('renders multiple chart types in sequence without state leaking', async () => {
      const types = ['line', 'bar']
      for (const type of types) {
        const svg = await SSRRenderer.renderToString({
          series: [{ data: [1, 2, 3] }],
          chart: { type },
        })
        expect(svg).toContain('<svg')
      }
    })

    it('bar chart: renders exactly N bar paths and N datalabel groups for N data points', async () => {
      const data = [44, 55, 57, 56, 61]
      const svg = await SSRRenderer.renderToString({
        chart: { type: 'bar', height: 300 },
        series: [{ name: 'Visitors', data }],
        xaxis: { categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun'] },
      })

      const barPaths = svg.match(/class="apexcharts-bar-area/g)
      const dataLabels = svg.match(/class="apexcharts-datalabels"/g)

      expect(barPaths).not.toBeNull()
      expect(barPaths.length).toBe(data.length)
      expect(dataLabels).not.toBeNull()
      // One datalabels group per series (not per data point)
      expect(dataLabels.length).toBe(1)
    })
  })
})
