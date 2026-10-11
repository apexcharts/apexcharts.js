/**
 * Apex._chartInstances holds one entry per instance and destroy() removes
 * exactly that entry. It used to register by id without dedupe and splice by
 * id inside forEach.
 *
 * (a) A trellis host's rebuilding updateOptions() calls render() again, which
 *     pushes a second registry entry for the same instance; destroy() then
 *     leaves one behind (the destroyed host stays globally reachable).
 * (b) Two charts sharing an id: destroying A removes B's entry, not A's.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
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
  Apex._chartInstances = []
})

const rows = (base) =>
  Array.from({ length: 4 }, (_, i) => [
    Date.UTC(2025, 0, 1) + i * 86400000,
    base + i,
  ])

describe('chart registry', () => {
  it('a trellis host re-rendered by updateOptions is fully unregistered on destroy', async () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    parent.getBoundingClientRect = () => ({
      width: 900,
      height: 500,
      top: 0,
      left: 0,
      right: 900,
      bottom: 500,
    })
    const el = document.createElement('div')
    parent.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: {
        id: 'host',
        type: 'line',
        height: 400,
        animations: { enabled: false },
      },
      trellis: { by: 'region', virtualize: false },
      series: [
        { name: 'R', region: 'N', data: rows(10) },
        { name: 'R', region: 'S', data: rows(20) },
      ],
      xaxis: { type: 'datetime' },
    })
    await chart.render()
    await chart.updateOptions({ yaxis: { min: 0 } })
    await chart.updateOptions({ yaxis: { min: 1 } })
    const entries = () =>
      Apex._chartInstances.filter((c) => c.chart === chart).length
    // one instance, one registry entry
    expect(entries()).toBe(1)
    chart.destroy()
    expect(entries()).toBe(0)
    expect(ApexCharts.getChartByID('host')).toBeUndefined()
  })

  it('destroying one of two charts sharing an id removes its own entry', async () => {
    document.body.innerHTML = '<div id="c1"></div><div id="c2"></div>'
    const opts = () => ({
      chart: {
        id: 'dup',
        type: 'line',
        width: 600,
        height: 300,
        animations: { enabled: false },
      },
      series: [{ name: 'A', data: [10, 20, 30] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    const a = new ApexCharts(document.querySelector('#c1'), opts())
    const b = new ApexCharts(document.querySelector('#c2'), opts())
    await b.render()
    await a.render()
    a.destroy()
    const left = Apex._chartInstances.map((c) =>
      c.chart === a ? 'A' : c.chart === b ? 'B' : '?',
    )
    expect(left).toEqual(['B'])
    b.destroy()
  })

  it('a rejected render detaches what it attached, so a retry orphans nothing', async () => {
    // Count live container observers: the one a failed render left behind used
    // to be overwritten by the retry's and outlive destroy().
    const Orig = window.ResizeObserver
    let live = 0
    window.ResizeObserver = class {
      observe() {
        live++
      }
      unobserve() {}
      disconnect() {
        live--
      }
    }
    const errs = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      document.body.innerHTML = '<div><div id="v"></div></div>'
      const chart = new ApexCharts(document.querySelector('#v'), {
        chart: { id: 'v1', type: 'violin', animations: { enabled: false } },
        series: [{ name: 'A', data: [{ x: 'a', y: [1, 2, 3, 4, 5] }] }],
      })
      await expect(chart.render()).rejects.toThrow('not registered')
      expect(live).toBe(0)
      expect(Apex._chartInstances.length).toBe(0)

      await import('../../src/entries/violin.js')
      await chart.render()
      expect(live).toBeGreaterThan(0)
      expect(Apex._chartInstances.length).toBe(1)

      chart.destroy()
      expect(live).toBe(0)
      expect(Apex._chartInstances.length).toBe(0)
    } finally {
      window.ResizeObserver = Orig
      errs.mockRestore()
    }
  })

  it('exec clears its flag whatever method it ran, so group sync keeps working', async () => {
    document.body.innerHTML = '<div id="e1"></div>'
    const chart = new ApexCharts(document.querySelector('#e1'), {
      chart: {
        id: 'e1',
        group: 'g',
        type: 'line',
        animations: { enabled: false },
      },
      series: [{ name: 'A', data: [1, 2, 3] }],
      yaxis: { labels: { minWidth: 40 } },
    })
    await chart.render()
    await ApexCharts.exec('e1', 'updateSeries', [
      { name: 'A', data: [3, 2, 1] },
    ])
    expect(chart.w.globals.isExecCalled).toBe(false)
    expect(ApexCharts.exec('e1', 'notAMethod')).toBe(null)
    expect(chart.w.globals.isExecCalled).toBe(false)
    chart.destroy()
  })
})
