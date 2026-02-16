import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Environment } from '../../../src/utils/Environment.js'

describe('Environment Detection', () => {
  describe('Browser Environment', () => {
    it('should detect browser environment when window and document exist', () => {
      // In vitest/jsdom, window and document are available
      expect(Environment.isBrowser()).toBe(true)
      expect(Environment.isSSR()).toBe(false)
    })

    it('should detect available browser APIs', () => {
      expect(Environment.hasAPI('ResizeObserver')).toBe(true)
    })

    it('should return false for non-existent APIs', () => {
      expect(Environment.hasAPI('NonExistentAPI')).toBe(false)
    })
  })

  describe('SSR Environment Simulation', () => {
    let originalWindow
    let originalDocument

    beforeEach(() => {
      // Save original globals
      originalWindow = global.window
      originalDocument = global.document
    })

    afterEach(() => {
      // Restore original globals
      global.window = originalWindow
      global.document = originalDocument
    })

    it('should detect SSR when window is undefined', () => {
      // Simulate Node.js environment
      global.window = undefined

      expect(Environment.isSSR()).toBe(true)
      expect(Environment.isBrowser()).toBe(false)
    })

    it('should detect SSR when document is undefined', () => {
      // Simulate Node.js environment
      global.document = undefined

      expect(Environment.isSSR()).toBe(true)
      expect(Environment.isBrowser()).toBe(false)
    })

    it('should detect SSR when both window and document are undefined', () => {
      global.window = undefined
      global.document = undefined

      expect(Environment.isSSR()).toBe(true)
      expect(Environment.isBrowser()).toBe(false)
    })

    it('should return false for any API in SSR environment', () => {
      global.window = undefined

      expect(Environment.hasAPI('ResizeObserver')).toBe(false)
      expect(Environment.hasAPI('XMLSerializer')).toBe(false)
    })
  })
})
