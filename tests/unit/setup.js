import { vi } from 'vitest'

// Suppress jsdom noise that pollutes test output
const SUPPRESSED = ['Could not parse CSS stylesheet', 'Not implemented']
for (const method of ['error', 'warn']) {
  const original = console[method].bind(console)
  console[method] = (...args) => {
    if (SUPPRESSED.some((s) => String(args[0]).includes(s))) return
    original(...args)
  }
}

globalThis.jest = {
  ...vi,
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
}

if (
  typeof SVGElement !== 'undefined' &&
  typeof SVGElement.prototype.getBBox !== 'function'
) {
  SVGElement.prototype.getBBox = function () {
    return {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      top: 0,
      right: 10,
      bottom: 10,
      left: 0,
    }
  }
}

if (
  typeof SVGGraphicsElement !== 'undefined' &&
  typeof SVGGraphicsElement.prototype.getBBox !== 'function'
) {
  SVGGraphicsElement.prototype.getBBox = function () {
    return {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      top: 0,
      right: 10,
      bottom: 10,
      left: 0,
    }
  }
}

// Mock ResizeObserver for JSDOM environment
if (typeof ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback
    }
    observe() {
      // Mock implementation - do nothing
    }
    unobserve() {
      // Mock implementation - do nothing
    }
    disconnect() {
      // Mock implementation - do nothing
    }
  }
}
