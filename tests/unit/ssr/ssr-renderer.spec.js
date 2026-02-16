import { describe, it, expect } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'

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
})
