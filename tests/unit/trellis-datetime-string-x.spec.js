/**
 * On a datetime x axis, dates given as ISO strings were joined as plain
 * strings: the union kept first-seen order (Feb, Mar, Jan) and was not
 * numeric, so a ragged panel's line ran Feb, a gap, then back to Jan, and
 * the panels lost their shared x domain. String x is now keyed by the epoch
 * it parses to, sorted, and every datum keeps its own x.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import { split } from '../../src/modules/trellis/TrellisSplit.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})
beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const series = () => [
  { name: 'S', facet: 'A', data: [{ x: '2024-02-01', y: 1 }, { x: '2024-03-01', y: 2 }] },
  { name: 'S', facet: 'B', data: [{ x: '2024-01-01', y: 1 }, { x: '2024-02-01', y: 2 }] },
]
const t = (d) => new Date(d).getTime()

describe('trellis: ISO-string datetime x', () => {
  it('the split keys strings by epoch, sorts, and keeps each datum', () => {
    const r = split(series(), { by: 'facet' }, { chartType: 'line', datetime: true })
    expect(r.xIsNumeric).toBe(true)
    expect(r.unionX).toEqual([t('2024-01-01'), t('2024-02-01'), t('2024-03-01')])
    const B = r.panels.find((p) => p.key === 'B').series[0].data
    // the original datum, then an epoch-keyed placeholder
    expect(B[0]).toEqual({ x: '2024-01-01', y: 1 })
    expect(B[2]).toEqual({ x: t('2024-03-01'), y: null })
    // a category axis keeps the strings as categories
    const cat = split(series(), { by: 'facet' }, { chartType: 'line' })
    expect(cat.xIsNumeric).toBe(false)
  })

  it('ragged panels draw in time order on one x domain', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'facet', virtualize: false },
      xaxis: { type: 'datetime' },
      series: series(),
    })
    await chart.render()
    const check = () => {
      const panels = chart.trellis.panels.map((p) => p.chart.w)
      const B = chart.trellis.split.panels.find((p) => p.key === 'B')
      const ts = B.series[0].data.map((d) => t(d.x))
      expect([...ts].sort((a, b) => a - b)).toEqual(ts)
      expect(panels[0].globals.minX).toBe(t('2024-01-01'))
      expect(panels[1].globals.minX).toBe(panels[0].globals.minX)
      expect(panels[1].globals.maxX).toBe(panels[0].globals.maxX)
    }
    check()
    await chart.updateSeries(series())
    check()
    chart.destroy()
  })
})
