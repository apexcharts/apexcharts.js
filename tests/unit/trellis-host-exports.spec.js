/**
 * A trellis host's export wrappers honour the caller's arguments, as a
 * single chart's do: the CSV file name and delimiters, and the SVG scale.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

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

afterEach(() => vi.restoreAllMocks())

const rows = (base) => Array.from({ length: 3 }, (_, i) => [i + 1, base + i])

async function mount() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    series: [
      { name: 'Revenue', region: 'North', data: rows(10) },
      { name: 'Revenue', region: 'South', data: rows(20) },
    ],
  })
  await chart.render()
  return chart
}

describe('trellis host exports', () => {
  it('exportToCSV uses the file name and delimiters it is given', async () => {
    const chart = await mount()
    /** @type {HTMLAnchorElement[]} */
    const clicked = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function () {
        clicked.push(this)
      },
    )
    await chart.exportToCSV({
      fileName: 'sales',
      columnDelimiter: ';',
      lineDelimiter: '\r\n',
    })
    expect(clicked.length).toBe(1)
    expect(clicked[0].download).toBe('sales.csv')
    const csv = decodeURIComponent(clicked[0].href.split(',').slice(1).join(','))
    expect(csv).toContain('x;facet;Revenue\r\n')
    chart.destroy()
  })

  it('getSvgString scales the composed image', async () => {
    const chart = await mount()
    // jsdom has no layout: give the grid a box to measure.
    chart.trellis.elWrap.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 600,
      height: 400,
    })
    const one = await chart.getSvgString()
    const two = await chart.getSvgString(2)
    const width = (s) => Number(/^<svg[^>]* width="([\d.]+)"/.exec(s)[1])
    expect(width(one)).toBeGreaterThan(0)
    expect(width(two)).toBe(width(one) * 2)
    chart.destroy()
  })
})
