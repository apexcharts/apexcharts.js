import { vi } from 'vitest'

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

// jsdom stamps a frame with the age of the window (performance.now() minus
// its value at window creation), not with performance.now(). A tween that
// took its start from performance.now() then stays negative by that offset
// and never finishes. Browsers use one clock, so pass performance.now().
if (
  typeof window !== 'undefined' &&
  typeof window.requestAnimationFrame === 'function'
) {
  const requestFrame = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (callback) =>
    requestFrame(() => {
      callback(performance.now())
    })
}
