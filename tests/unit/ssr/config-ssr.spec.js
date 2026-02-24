import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Environment } from '../../../src/utils/Environment.js'

describe('Config SSR safety', () => {
  let originalWindow
  let originalDocument
  let originalApex

  beforeEach(() => {
    originalWindow = global.window
    originalDocument = global.document
    originalApex = global.Apex
  })

  afterEach(() => {
    global.window = originalWindow
    global.document = originalDocument
    global.Apex = originalApex
  })

  describe('Environment.getApex()', () => {
    it('should return window.Apex in browser environment', () => {
      global.window = { Apex: { theme: { mode: 'dark' } } }

      expect(Environment.getApex()).toBe(global.window.Apex)
      expect(Environment.getApex().theme.mode).toBe('dark')
    })

    it('should fall back to global.Apex in SSR environment', () => {
      global.window = undefined
      global.document = undefined
      global.Apex = { chart: { fontFamily: 'Arial' } }

      expect(Environment.getApex()).toBe(global.Apex)
      expect(Environment.getApex().chart.fontFamily).toBe('Arial')
    })

    it('should return empty object when neither window.Apex nor global.Apex exist', () => {
      global.window = undefined
      global.document = undefined
      global.Apex = undefined

      expect(Environment.getApex()).toEqual({})
    })

    it('should return empty object when window exists but window.Apex is not set', () => {
      // window exists (jsdom) but Apex is not on it
      const savedApex = global.window.Apex
      delete global.window.Apex
      global.Apex = undefined

      expect(Environment.getApex()).toEqual({})

      // restore
      global.window.Apex = savedApex
    })

    it('should not throw ReferenceError accessing window in SSR', () => {
      global.window = undefined
      global.document = undefined

      expect(() => Environment.getApex()).not.toThrow()
    })
  })

  describe('Config.init() in SSR (window.Apex access)', () => {
    it('should not throw when Config is initialised without window', async () => {
      global.window = undefined
      global.document = undefined
      global.Apex = {}

      // Dynamically import after removing window so module-level guards see SSR
      const { default: Config } = await import('../../../src/modules/settings/Config.js')

      const config = new Config({
        chart: { type: 'line' },
        series: [{ data: [1, 2, 3] }],
      })

      expect(() => config.init({ responsiveOverride: false })).not.toThrow()
    })

    it('should merge global.Apex options in SSR', async () => {
      global.window = undefined
      global.document = undefined
      global.Apex = { chart: {}, theme: { mode: 'dark' } }

      const { default: Config } = await import('../../../src/modules/settings/Config.js')

      const config = new Config({
        chart: { type: 'bar' },
        series: [{ data: [10, 20] }],
      })

      const result = config.init({ responsiveOverride: false })

      expect(result.theme.mode).toBe('dark')
    })

    it('should merge global.Apex.yaxis in SSR when yaxis is an object', async () => {
      global.window = undefined
      global.document = undefined
      global.Apex = { yaxis: { min: 0, max: 100 } }

      const { default: Config } = await import('../../../src/modules/settings/Config.js')

      const config = new Config({
        chart: { type: 'line' },
        series: [{ data: [1, 2, 3] }],
        yaxis: { tickAmount: 5 },
      })

      const result = config.init({ responsiveOverride: false })

      // yaxis becomes an array after init; global yaxis should have been merged in
      expect(result.yaxis[0].min).toBe(0)
      expect(result.yaxis[0].max).toBe(100)
    })
  })
})
