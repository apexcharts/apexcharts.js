import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  LINE_HEIGHT_RATIO,
  NICE_SCALE_ALLOWED_MAG_MSD,
  NICE_SCALE_DEFAULT_TICKS,
} from '../../src/utils/Constants'
import Globals from '../../src/modules/settings/Globals'
import { Environment } from '../../src/utils/Environment'

// Minimal config stub required by Globals.globalVars()
function makeConfig() {
  return {
    markers: { size: 0 },
    chart: { toolbar: { autoSelected: 'zoom', tools: { zoom: true, pan: true, selection: true } }, zoom: { enabled: true } },
    plotOptions: { line: { isSlopeChart: false } },
  }
}

// Compute isTouchDevice the same way Base.js does
function computeIsTouchDevice() {
  return Environment.isBrowser()
    ? 'ontouchstart' in window || navigator.msMaxTouchPoints > 0
    : false
}

describe('Constants', () => {
  describe('LINE_HEIGHT_RATIO', () => {
    it('is the golden ratio 1.618', () => {
      expect(LINE_HEIGHT_RATIO).toBe(1.618)
    })

    it('is a number', () => {
      expect(typeof LINE_HEIGHT_RATIO).toBe('number')
    })
  })

  describe('NICE_SCALE_ALLOWED_MAG_MSD', () => {
    it('is a 2×11 matrix', () => {
      expect(NICE_SCALE_ALLOWED_MAG_MSD).toHaveLength(2)
      expect(NICE_SCALE_ALLOWED_MAG_MSD[0]).toHaveLength(11)
      expect(NICE_SCALE_ALLOWED_MAG_MSD[1]).toHaveLength(11)
    })

    it('row 0 (integer data) contains only integers', () => {
      NICE_SCALE_ALLOWED_MAG_MSD[0].forEach((v) => {
        expect(Number.isInteger(v)).toBe(true)
      })
    })

    it('each entry satisfies entry >= index (no data-point clipping)', () => {
      NICE_SCALE_ALLOWED_MAG_MSD.forEach((row) => {
        row.forEach((v, i) => {
          expect(v).toBeGreaterThanOrEqual(i)
        })
      })
    })

    it('each entry satisfies 10 % entry === 0 (clean tick labels)', () => {
      NICE_SCALE_ALLOWED_MAG_MSD.forEach((row) => {
        row.forEach((v) => {
          expect(10 % v).toBe(0)
        })
      })
    })
  })

  describe('NICE_SCALE_DEFAULT_TICKS', () => {
    it('has 28 entries (indices 0–27)', () => {
      expect(NICE_SCALE_DEFAULT_TICKS).toHaveLength(28)
    })

    it('contains only positive integers', () => {
      NICE_SCALE_DEFAULT_TICKS.forEach((v) => {
        expect(Number.isInteger(v)).toBe(true)
        expect(v).toBeGreaterThan(0)
      })
    })

    it('ends with 24 (highest divisor count entry)', () => {
      expect(NICE_SCALE_DEFAULT_TICKS[27]).toBe(24)
    })

    it('starts with 1 (minimum tick count)', () => {
      expect(NICE_SCALE_DEFAULT_TICKS[0]).toBe(1)
    })
  })
})

describe('Globals — constants wired through w.globals for backward compat', () => {
  it('w.globals.niceScaleAllowedMagMsd references the same array as NICE_SCALE_ALLOWED_MAG_MSD', () => {
    const gl = new Globals().init(makeConfig())
    expect(gl.niceScaleAllowedMagMsd).toBe(NICE_SCALE_ALLOWED_MAG_MSD)
  })

  it('w.globals.niceScaleDefaultTicks references the same array as NICE_SCALE_DEFAULT_TICKS', () => {
    const gl = new Globals().init(makeConfig())
    expect(gl.niceScaleDefaultTicks).toBe(NICE_SCALE_DEFAULT_TICKS)
  })

  it('w.globals.LINE_HEIGHT_RATIO equals the constant', () => {
    const gl = new Globals().init(makeConfig())
    expect(gl.LINE_HEIGHT_RATIO).toBe(LINE_HEIGHT_RATIO)
  })
})

describe('isTouchDevice SSR safety (via Environment)', () => {
  let originalWindow

  beforeEach(() => {
    originalWindow = global.window
  })

  afterEach(() => {
    global.window = originalWindow
  })

  it('is false in SSR (no window)', () => {
    global.window = undefined
    expect(computeIsTouchDevice()).toBe(false)
  })

  it('is true in jsdom (jsdom exposes ontouchstart by default)', () => {
    // jsdom simulates a touch-capable environment — isTouchDevice should be true
    expect(computeIsTouchDevice()).toBe(true)
  })

  it('is false when ontouchstart is absent and msMaxTouchPoints is 0', () => {
    const saved = window.ontouchstart
    delete window.ontouchstart
    const savedMTP = navigator.msMaxTouchPoints
    Object.defineProperty(navigator, 'msMaxTouchPoints', { value: 0, configurable: true })

    expect(computeIsTouchDevice()).toBe(false)

    if (saved !== undefined) window.ontouchstart = saved
    Object.defineProperty(navigator, 'msMaxTouchPoints', { value: savedMTP, configurable: true })
  })
})
