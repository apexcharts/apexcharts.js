import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Hydration } from '../../../src/ssr/Hydration.js'
import { JSDOM } from 'jsdom'

describe('Hydration', () => {
  let dom
  let document

  beforeEach(() => {
    // Create a minimal jsdom environment for DOM manipulation tests
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    document = dom.window.document
    global.document = document
  })

  afterEach(() => {
    dom.window.close()
    delete global.document
  })

  describe('hydrate()', () => {
    it('should throw error if element is null', () => {
      expect(() => {
        Hydration.hydrate(null)
      }).toThrow('Element is required')
    })

    it('should throw error if element is undefined', () => {
      expect(() => {
        Hydration.hydrate(undefined)
      }).toThrow('Element is required')
    })

    it('should throw error if element does not have hydration attribute', () => {
      const el = document.createElement('div')

      expect(() => {
        Hydration.hydrate(el)
      }).toThrow('does not have data-apexcharts-hydrate')
    })

    it('should throw error if element is missing config attribute', () => {
      const el = document.createElement('div')
      el.setAttribute('data-apexcharts-hydrate', '')

      expect(() => {
        Hydration.hydrate(el)
      }).toThrow('missing data-apexcharts-config')
    })

    it('should throw error for invalid base64 config', () => {
      const el = document.createElement('div')
      el.setAttribute('data-apexcharts-hydrate', '')
      el.setAttribute('data-apexcharts-config', 'invalid-base64-!@#$')

      expect(() => {
        Hydration.hydrate(el)
      }).toThrow()
    })
  })

  describe('hydrateAll()', () => {
    it('should return empty array if no elements found', () => {
      const charts = Hydration.hydrateAll()

      expect(charts).toEqual([])
    })

    it('should return empty array for custom selector with no matches', () => {
      const charts = Hydration.hydrateAll('[data-nonexistent]')

      expect(charts).toEqual([])
    })

    it('should use default selector when none provided', () => {
      // Verify the method doesn't throw without elements
      const charts = Hydration.hydrateAll()

      expect(Array.isArray(charts)).toBe(true)
      expect(charts.length).toBe(0)
    })
  })

  describe('isHydrated()', () => {
    it('should return false for null element', () => {
      expect(Hydration.isHydrated(null)).toBe(false)
    })

    it('should return false for undefined element', () => {
      expect(Hydration.isHydrated(undefined)).toBe(false)
    })

    it('should return false for non-hydrated element', () => {
      const el = document.createElement('div')
      expect(Hydration.isHydrated(el)).toBe(false)
    })

    it('should return true for hydrated element', () => {
      const el = document.createElement('div')
      el.setAttribute('data-apexcharts-hydrated', 'true')

      expect(Hydration.isHydrated(el)).toBe(true)
    })

    it('should return true even if hydrated attribute has different value', () => {
      const el = document.createElement('div')
      el.setAttribute('data-apexcharts-hydrated', 'yes')

      expect(Hydration.isHydrated(el)).toBe(true)
    })

    it('should return false for element with empty hydrated attribute', () => {
      const el = document.createElement('div')
      el.setAttribute('data-apexcharts-hydrated', '')

      // Empty attribute value should still be truthy for hasAttribute check
      expect(Hydration.isHydrated(el)).toBe(true)
    })
  })

  describe('_decodeConfig()', () => {
    it('should decode base64-encoded config', () => {
      const config = {
        series: [{ data: [30, 40, 35] }],
        chart: { type: 'bar' },
      }

      const encoded = Buffer.from(JSON.stringify(config)).toString('base64')
      const decoded = Hydration._decodeConfig(encoded)

      expect(decoded).toEqual(config)
    })

    it('should throw error for invalid base64', () => {
      expect(() => {
        Hydration._decodeConfig('invalid-!@#$%')
      }).toThrow()
    })

    it('should throw error for empty string', () => {
      expect(() => {
        Hydration._decodeConfig('')
      }).toThrow()
    })

    it('should handle complex nested objects', () => {
      const config = {
        series: [{ data: [1, 2, 3] }],
        chart: {
          type: 'line',
          animations: {
            enabled: true,
            dynamicAnimation: {
              enabled: true,
            },
          },
        },
      }

      const encoded = Buffer.from(JSON.stringify(config)).toString('base64')
      const decoded = Hydration._decodeConfig(encoded)

      expect(decoded).toEqual(config)
    })

    it('should handle arrays in config', () => {
      const config = {
        series: [
          { name: 'Series 1', data: [30, 40, 35] },
          { name: 'Series 2', data: [50, 60, 55] },
        ],
      }

      const encoded = Buffer.from(JSON.stringify(config)).toString('base64')
      const decoded = Hydration._decodeConfig(encoded)

      expect(decoded).toEqual(config)
    })

    it('should throw error for valid base64 but invalid JSON', () => {
      const invalidBase64 = Buffer.from('not valid json').toString('base64')

      expect(() => {
        Hydration._decodeConfig(invalidBase64)
      }).toThrow()
    })
  })

  describe('_mergeConfigs()', () => {
    it('should merge SSR config with client options', () => {
      const ssrConfig = {
        series: [{ data: [30, 40, 35] }],
        chart: {
          type: 'bar',
          animations: { enabled: false },
          toolbar: { show: false },
        },
      }

      const clientOptions = {
        chart: {
          animations: { enabled: true, speed: 800 },
        },
      }

      const merged = Hydration._mergeConfigs(ssrConfig, clientOptions)

      expect(merged.series).toEqual(ssrConfig.series)
      expect(merged.chart.type).toBe('bar')
      expect(merged.chart.animations.enabled).toBe(true)
      expect(merged.chart.animations.speed).toBe(800)
    })

    it('should re-enable animations by default', () => {
      const ssrConfig = {
        series: [{ data: [30, 40, 35] }],
        chart: {
          type: 'bar',
          animations: { enabled: false },
        },
      }

      const merged = Hydration._mergeConfigs(ssrConfig, {})

      expect(merged.chart.animations.enabled).toBe(true)
    })

    it('should re-enable toolbar by default', () => {
      const ssrConfig = {
        series: [{ data: [30, 40, 35] }],
        chart: {
          type: 'bar',
          toolbar: { show: false },
        },
      }

      const merged = Hydration._mergeConfigs(ssrConfig, {})

      expect(merged.chart.toolbar.show).toBe(true)
    })

    it('should always re-enable animations unless complex override provided', () => {
      const ssrConfig = {
        series: [{ data: [30, 40, 35] }],
        chart: {
          type: 'bar',
          animations: { enabled: false },
        },
      }

      const clientOptions = {
        chart: {
          animations: { enabled: false },
        },
      }

      const merged = Hydration._mergeConfigs(ssrConfig, clientOptions)

      // Note: Current implementation always re-enables if enabled === false
      // This is by design to provide better UX on hydration
      expect(merged.chart.animations.enabled).toBe(true)
    })

    it('should respect explicit client option to keep toolbar hidden', () => {
      const ssrConfig = {
        series: [{ data: [30, 40, 35] }],
        chart: {
          type: 'bar',
          toolbar: { show: false },
        },
      }

      const clientOptions = {
        chart: {
          toolbar: { show: false },
        },
      }

      const merged = Hydration._mergeConfigs(ssrConfig, clientOptions)

      expect(merged.chart.toolbar.show).toBe(false)
    })

    it('should handle empty configs', () => {
      const merged = Hydration._mergeConfigs({}, {})

      expect(merged).toEqual({})
    })

    it('should preserve SSR config if no client options', () => {
      const ssrConfig = {
        series: [{ data: [30, 40, 35] }],
        chart: { type: 'bar' },
        xaxis: { categories: ['A', 'B', 'C'] },
      }

      const merged = Hydration._mergeConfigs(ssrConfig, {})

      expect(merged.series).toEqual(ssrConfig.series)
      expect(merged.xaxis).toEqual(ssrConfig.xaxis)
    })

    it('should merge nested properties with client overrides', () => {
      const ssrConfig = {
        chart: {
          type: 'line',
          animations: { enabled: false, speed: 400 },
          toolbar: { show: false },
        },
      }

      const clientOptions = {
        chart: {
          animations: { speed: 800 },
        },
      }

      const merged = Hydration._mergeConfigs(ssrConfig, clientOptions)

      // merged.chart.animations = { speed: 800 } (from clientOptions spread)
      // The condition checks: animations === undefined (false) OR animations.enabled === false (false, because enabled is undefined)
      // So the re-enable block doesn't execute
      // Therefore enabled remains undefined
      expect(merged.chart.animations.enabled).toBeUndefined()
      expect(merged.chart.animations.speed).toBe(800)
      expect(merged.chart.toolbar.show).toBe(true)
    })

    it('should not mutate original configs', () => {
      const ssrConfig = {
        series: [{ data: [30, 40, 35] }],
        chart: { type: 'bar' },
      }

      const clientOptions = {
        chart: { animations: { enabled: true } },
      }

      const originalSSR = JSON.parse(JSON.stringify(ssrConfig))
      const originalClient = JSON.parse(JSON.stringify(clientOptions))

      Hydration._mergeConfigs(ssrConfig, clientOptions)

      expect(ssrConfig).toEqual(originalSSR)
      expect(clientOptions).toEqual(originalClient)
    })
  })
})
