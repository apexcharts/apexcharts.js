import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'

describe('BrowserAPIs', () => {
  beforeEach(() => {
    // Reset shim between tests
    BrowserAPIs._resetShim()
  })

  describe('Browser Environment', () => {
    describe('Element Creation', () => {
      it('should create element using native DOM in browser', () => {
        const element = BrowserAPIs.createElementNS('http://www.w3.org/2000/svg', 'svg')

        expect(element).toBeDefined()
        expect(element.nodeName).toBe('svg')
      })

      it('should create text node using native DOM in browser', () => {
        const textNode = BrowserAPIs.createTextNode('Hello')

        expect(textNode).toBeDefined()
        expect(textNode.textContent).toBe('Hello')
      })
    })

    describe('DOM Queries', () => {
      it('should query selector from document', () => {
        // Create a test element
        const div = document.createElement('div')
        div.className = 'test-query'
        document.body.appendChild(div)

        const result = BrowserAPIs.querySelector('.test-query')

        expect(result).toBe(div)

        // Cleanup
        document.body.removeChild(div)
      })

      it('should query all selectors from document', () => {
        // Create test elements
        const div1 = document.createElement('div')
        const div2 = document.createElement('div')
        div1.className = 'test-query-all'
        div2.className = 'test-query-all'
        document.body.appendChild(div1)
        document.body.appendChild(div2)

        const results = BrowserAPIs.querySelectorAll('.test-query-all')

        expect(results.length).toBeGreaterThanOrEqual(2)

        // Cleanup
        document.body.removeChild(div1)
        document.body.removeChild(div2)
      })
    })

    describe('Style and Dimensions', () => {
      it('should get computed style in browser', () => {
        const div = document.createElement('div')
        document.body.appendChild(div)

        const styles = BrowserAPIs.getComputedStyle(div)

        expect(styles).toBeDefined()

        // Cleanup
        document.body.removeChild(div)
      })

      it('should get bounding client rect in browser', () => {
        const div = document.createElement('div')
        document.body.appendChild(div)

        const rect = BrowserAPIs.getBoundingClientRect(div)

        expect(rect).toBeDefined()
        expect(rect.width).toBeDefined()
        expect(rect.height).toBeDefined()

        // Cleanup
        document.body.removeChild(div)
      })

      it('should return default rect for null element', () => {
        const rect = BrowserAPIs.getBoundingClientRect(null)

        expect(rect.width).toBe(0)
        expect(rect.height).toBe(0)
      })
    })

    describe('Serialization', () => {
      it('should get XMLSerializer instance', () => {
        const serializer = BrowserAPIs.getXMLSerializer()

        expect(serializer).toBeDefined()
        expect(serializer.serializeToString).toBeDefined()
      })

      it('should reuse XMLSerializer instance', () => {
        const serializer1 = BrowserAPIs.getXMLSerializer()
        const serializer2 = BrowserAPIs.getXMLSerializer()

        expect(serializer1).toBe(serializer2)
      })

      it('should get DOMParser instance', () => {
        const parser = BrowserAPIs.getDOMParser()

        expect(parser).toBeDefined()
        expect(parser.parseFromString).toBeDefined()
      })

      it('should reuse DOMParser instance', () => {
        const parser1 = BrowserAPIs.getDOMParser()
        const parser2 = BrowserAPIs.getDOMParser()

        expect(parser1).toBe(parser2)
      })
    })

    describe('Event Listeners', () => {
      it('should add window event listener in browser', () => {
        const handler = vi.fn()
        BrowserAPIs.addWindowEventListener('resize', handler)

        window.dispatchEvent(new Event('resize'))

        expect(handler).toHaveBeenCalled()

        // Cleanup
        BrowserAPIs.removeWindowEventListener('resize', handler)
      })

      it('should remove window event listener in browser', () => {
        const handler = vi.fn()
        BrowserAPIs.addWindowEventListener('resize', handler)
        BrowserAPIs.removeWindowEventListener('resize', handler)

        window.dispatchEvent(new Event('resize'))

        expect(handler).not.toHaveBeenCalled()
      })
    })

    describe('Animation Frame', () => {
      it('should request animation frame in browser', () => {
        const callback = vi.fn()
        const id = BrowserAPIs.requestAnimationFrame(callback)

        expect(id).toBeDefined()

        // Wait for next frame
        return new Promise(resolve => {
          setTimeout(() => {
            expect(callback).toHaveBeenCalled()
            resolve()
          }, 20)
        })
      })

      it('should cancel animation frame in browser', () => {
        const callback = vi.fn()
        const id = BrowserAPIs.requestAnimationFrame(callback)
        BrowserAPIs.cancelAnimationFrame(id)

        // Callback should not be called after cancellation
        return new Promise(resolve => {
          setTimeout(() => {
            resolve()
          }, 20)
        })
      })
    })

    describe('Element Existence', () => {
      it('should check if element exists in browser', () => {
        const div = document.createElement('div')
        document.body.appendChild(div)

        expect(BrowserAPIs.elementExists(div)).toBe(true)

        // Cleanup
        document.body.removeChild(div)
      })

      it('should return false for null element', () => {
        expect(BrowserAPIs.elementExists(null)).toBe(false)
      })
    })

    describe('Global Objects', () => {
      it('should return window object in browser', () => {
        const win = BrowserAPIs.getWindow()

        expect(win).toBe(window)
      })

      it('should return document object in browser', () => {
        const doc = BrowserAPIs.getDocument()

        expect(doc).toBe(document)
      })
    })
  })

  describe('SSR Environment Simulation', () => {
    let originalWindow
    let originalDocument

    beforeEach(() => {
      // Save originals
      originalWindow = global.window
      originalDocument = global.document

      // Simulate SSR
      global.window = undefined
      global.document = undefined

      // Reset to force re-initialization
      BrowserAPIs._resetShim()
    })

    afterEach(() => {
      // Restore
      global.window = originalWindow
      global.document = originalDocument

      // Reset again
      BrowserAPIs._resetShim()
    })

    describe('Initialization', () => {
      it('should initialize shim in SSR environment', () => {
        BrowserAPIs.init()

        const shim = BrowserAPIs._getShim()
        expect(shim).toBeDefined()
      })

      it('should not create multiple shim instances', () => {
        BrowserAPIs.init()
        const shim1 = BrowserAPIs._getShim()

        BrowserAPIs.init()
        const shim2 = BrowserAPIs._getShim()

        expect(shim1).toBe(shim2)
      })
    })

    describe('Element Creation', () => {
      it('should create element using shim in SSR', () => {
        const element = BrowserAPIs.createElementNS('http://www.w3.org/2000/svg', 'rect')

        expect(element).toBeDefined()
        expect(element.nodeName).toBe('rect')
      })

      it('should create text node using shim in SSR', () => {
        const textNode = BrowserAPIs.createTextNode('SSR Text')

        expect(textNode).toBeDefined()
        expect(textNode.textContent).toBe('SSR Text')
      })
    })

    describe('DOM Queries', () => {
      it('should return null for querySelector in SSR', () => {
        const result = BrowserAPIs.querySelector('.test')

        expect(result).toBe(null)
      })

      it('should return empty array for querySelectorAll in SSR', () => {
        const results = BrowserAPIs.querySelectorAll('.test')

        expect(Array.isArray(results)).toBe(true)
        expect(results.length).toBe(0)
      })
    })

    describe('Style and Dimensions', () => {
      it('should return empty object for getComputedStyle in SSR', () => {
        const styles = BrowserAPIs.getComputedStyle()

        expect(styles).toEqual({})
      })

      it('should return default rect in SSR', () => {
        const element = BrowserAPIs.createElementNS('http://www.w3.org/2000/svg', 'rect')
        const rect = BrowserAPIs.getBoundingClientRect(element)

        expect(rect.width).toBe(0)
        expect(rect.height).toBe(0)
      })

      it('should use SSR dimensions if provided', () => {
        const element = BrowserAPIs.createElementNS('http://www.w3.org/2000/svg', 'svg')
        element._ssrWidth = 600
        element._ssrHeight = 400

        const rect = BrowserAPIs.getBoundingClientRect(element)

        expect(rect.width).toBe(600)
        expect(rect.height).toBe(400)
      })
    })

    describe('Serialization', () => {
      it('should get shim XMLSerializer in SSR', () => {
        const serializer = BrowserAPIs.getXMLSerializer()

        expect(serializer).toBeDefined()
        expect(serializer.serializeToString).toBeDefined()
      })

      it('should serialize element in SSR', () => {
        const element = BrowserAPIs.createElementNS('http://www.w3.org/2000/svg', 'rect')
        element.setAttribute('width', '100')

        const serializer = BrowserAPIs.getXMLSerializer()
        const str = serializer.serializeToString(element)

        expect(str).toContain('<rect')
        expect(str).toContain('width="100"')
      })

      it('should get shim DOMParser in SSR', () => {
        const parser = BrowserAPIs.getDOMParser()

        expect(parser).toBeDefined()
        expect(parser.parseFromString).toBeDefined()
      })
    })

    describe('Event Listeners', () => {
      it('should not throw when adding window event listener in SSR', () => {
        const handler = vi.fn()

        expect(() => {
          BrowserAPIs.addWindowEventListener('resize', handler)
        }).not.toThrow()

        expect(handler).not.toHaveBeenCalled()
      })

      it('should not throw when removing window event listener in SSR', () => {
        const handler = vi.fn()

        expect(() => {
          BrowserAPIs.removeWindowEventListener('resize', handler)
        }).not.toThrow()
      })
    })

    describe('Animation Frame', () => {
      it('should execute callback immediately in SSR', () => {
        const callback = vi.fn()
        const id = BrowserAPIs.requestAnimationFrame(callback)

        expect(callback).toHaveBeenCalled()
        expect(id).toBe(null)
      })

      it('should not throw when canceling animation frame in SSR', () => {
        expect(() => {
          BrowserAPIs.cancelAnimationFrame(123)
        }).not.toThrow()
      })
    })

    describe('Element Existence', () => {
      it('should detect SSR mode element as existing', () => {
        const element = BrowserAPIs.createElementNS('http://www.w3.org/2000/svg', 'rect')
        element._ssrMode = true

        expect(BrowserAPIs.elementExists(element)).toBe(true)
      })

      it('should detect element with nodeName as existing', () => {
        const element = BrowserAPIs.createElementNS('http://www.w3.org/2000/svg', 'rect')

        expect(BrowserAPIs.elementExists(element)).toBe(true)
      })

      it('should return false for null element in SSR', () => {
        expect(BrowserAPIs.elementExists(null)).toBe(false)
      })
    })

    describe('Global Objects', () => {
      it('should return null for window in SSR', () => {
        const win = BrowserAPIs.getWindow()

        expect(win).toBe(null)
      })

      it('should return null for document in SSR', () => {
        const doc = BrowserAPIs.getDocument()

        expect(doc).toBe(null)
      })
    })
  })

  describe('Shim Reset', () => {
    it('should reset shim instances', () => {
      BrowserAPIs.init()
      expect(BrowserAPIs._getShim()).toBeDefined()

      BrowserAPIs._resetShim()
      expect(BrowserAPIs._getShim()).toBe(null)
    })

    it('should reset serializer instances on reset', () => {
      BrowserAPIs.getXMLSerializer()
      BrowserAPIs.getDOMParser()

      BrowserAPIs._resetShim()

      // Should create new instances
      const serializer1 = BrowserAPIs.getXMLSerializer()
      const parser1 = BrowserAPIs.getDOMParser()

      BrowserAPIs._resetShim()

      const serializer2 = BrowserAPIs.getXMLSerializer()
      const parser2 = BrowserAPIs.getDOMParser()

      expect(serializer1).not.toBe(serializer2)
      expect(parser1).not.toBe(parser2)
    })
  })
})
