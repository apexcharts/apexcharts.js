/**
 * Export font embedding fetches each cross-origin stylesheet and each font
 * file once, not once per export: a second export within a minute and
 * every trellis panel reuse what the first fetched. A failed fetch is not
 * kept, so the next export tries it again.
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import Exports from '../../src/modules/Exports'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/**
 * One cross-origin stylesheet (its cssRules throw) whose text holds an
 * Inter face at `font`, and a fetch stub that logs every url it is asked
 * for. `fail` lists urls that answer 404 until removed from it.
 */
function stubNetwork(sheet, font, fail = new Set()) {
  const cross = {
    href: sheet,
    get cssRules() {
      throw new Error('SecurityError')
    },
  }
  vi.spyOn(document, 'styleSheets', 'get').mockReturnValue([cross])
  const calls = []
  vi.stubGlobal('fetch', (url) => {
    calls.push(url)
    if (fail.has(url)) return Promise.resolve({ ok: false, status: 404 })
    return Promise.resolve({
      ok: true,
      text: () =>
        Promise.resolve(`@font-face { font-family: Inter; src: url(${font}) }`),
      headers: { get: () => 'font/woff2' },
      arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
    })
  })
  return calls
}

function lineChart() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: {
      type: 'line',
      width: 300,
      height: 200,
      fontFamily: 'Inter',
      animations: { enabled: false },
    },
    series: [{ name: 'A', data: [1, 2, 3] }],
  })
  chart.render()
  return chart
}

const embed = async (chart) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  await new Exports(chart.w, chart.ctx).embedFonts(svg)
  return svg.querySelector('style')?.textContent || ''
}

describe('export font fetches are reused', () => {
  it('a second export fetches neither the stylesheet nor the font again', async () => {
    const sheet = 'https://fonts.example/a.css'
    const font = 'https://fonts.example/a.woff2'
    const calls = stubNetwork(sheet, font)
    const chart = lineChart()
    const first = await embed(chart)
    const second = await embed(chart)
    expect(first).toBe(
      '@font-face { font-family: Inter; src: url(data:font/woff2;base64,AQID) }',
    )
    expect(second).toBe(first)
    expect(calls).toEqual([sheet, font])
    chart.destroy()
  })

  it('retries a stylesheet or font that failed on the last export', async () => {
    const sheet = 'https://fonts.example/b.css'
    const font = 'https://fonts.example/b.woff2'
    const fail = new Set([sheet])
    const calls = stubNetwork(sheet, font, fail)
    const chart = lineChart()
    expect(await embed(chart)).toBe('')
    fail.delete(sheet)
    fail.add(font)
    expect(await embed(chart)).toBe('')
    fail.delete(font)
    expect(await embed(chart)).toContain('base64,AQID')
    expect(await embed(chart)).toContain('base64,AQID')
    expect(calls).toEqual([sheet, sheet, font, font])
    chart.destroy()
  })

  it('lets go of the fetched fonts a minute after they load', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    try {
      const sheet = 'https://fonts.example/d.css'
      const font = 'https://fonts.example/d.woff2'
      const calls = stubNetwork(sheet, font)
      const chart = lineChart()
      await embed(chart)
      vi.advanceTimersByTime(59e3)
      await embed(chart)
      expect(calls).toEqual([sheet, font])
      vi.advanceTimersByTime(1e3)
      expect(await embed(chart)).toContain('base64,AQID')
      expect(calls).toEqual([sheet, font, sheet, font])
      chart.destroy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('every trellis panel shares one fetch of each', async () => {
    const sheet = 'https://fonts.example/c.css'
    const font = 'https://fonts.example/c.woff2'
    const calls = stubNetwork(sheet, font)
    const el = document.createElement('div')
    document.body.appendChild(el)
    const rows = (base) =>
      Array.from({ length: 3 }, (_, i) => [i + 1, base + i])
    const chart = new ApexCharts(el, {
      chart: {
        type: 'line',
        height: 400,
        fontFamily: 'Inter',
        animations: { enabled: false },
      },
      trellis: { by: 'region', virtualize: false },
      series: [
        { name: 'Revenue', region: 'North', data: rows(10) },
        { name: 'Revenue', region: 'South', data: rows(20) },
        { name: 'Revenue', region: 'East', data: rows(30) },
      ],
    })
    await chart.render()
    chart.trellis.elWrap.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 600,
      height: 400,
    })
    await chart.getSvgString()
    expect(calls).toEqual([sheet, font])
    chart.destroy()
  })
})
