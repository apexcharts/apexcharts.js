import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Exports from '../../src/modules/Exports'

const lineChart = () =>
  createChartWithOptions({
    chart: { type: 'line', width: 400, height: 300 },
    series: [{ name: 'A', data: [1, 2, 3] }],
  })

const settle = (p, ms = 500) =>
  Promise.race([p, new Promise((r) => setTimeout(() => r('pending'), ms))])

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getSvgString lands every running tween first', () => {
  it('lands the axis chrome tweens before cloning the chart', () => {
    const chart = lineChart()
    const w = chart.w
    const landed = []
    const finish = () => {
      w.globals.chromeTweens.delete(finish)
      landed.push('chrome')
    }
    w.globals.chromeTweens = new Set([finish])
    const exports = new Exports(w, chart.ctx)
    const clone = vi.spyOn(w.dom.elWrap, 'cloneNode')
    clone.mockImplementation(function (deep) {
      landed.push('clone')
      return Node.prototype.cloneNode.call(this, deep)
    })
    exports.getSvgString()
    expect(landed).toEqual(['chrome', 'clone'])
    expect(w.globals.chromeTweens.size).toBe(0)
  })
})

describe('dataURI always settles', () => {
  const fakeCtx = () => ({ fillRect() {}, drawImage() {} })

  /** An Image whose load either fails or succeeds as soon as src is set. */
  const stubImage = (outcome) => {
    vi.stubGlobal(
      'Image',
      class {
        set src(_) {
          setTimeout(() => this[outcome]?.())
        }
      },
    )
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves an empty imgURI when the canvas has no 2d context', async () => {
    const chart = lineChart()
    const exports = new Exports(chart.w, chart.ctx)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await settle(exports.dataURI({ scale: 6 }))).toEqual({ imgURI: '' })
  })

  it('resolves an empty imgURI when the SVG image fails to load', async () => {
    const chart = lineChart()
    const exports = new Exports(chart.w, chart.ctx)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx())
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    exports.getSvgString = () => Promise.resolve('<svg/>')
    stubImage('onerror')
    expect(await settle(exports.dataURI())).toEqual({ imgURI: '' })
  })

  it('resolves an empty imgURI when toDataURL throws on a tainted canvas', async () => {
    const chart = lineChart()
    const exports = new Exports(chart.w, chart.ctx)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx())
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    exports.getSvgString = () => Promise.resolve('<svg/>')
    stubImage('onload')
    expect(await settle(exports.dataURI())).toEqual({ imgURI: '' })
  })

  it('exportToPng warns and downloads nothing when the PNG fails', async () => {
    const chart = lineChart()
    const exports = new Exports(chart.w, chart.ctx)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const download = vi.spyOn(exports, 'triggerDownload')
    exports.exportToPng()
    await new Promise((r) => setTimeout(r, 0))
    expect(warn).toHaveBeenCalled()
    expect(download).not.toHaveBeenCalled()
  })
})
