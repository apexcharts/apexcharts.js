import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import CoreUtils from '../../src/modules/CoreUtils.js'
import Utils from '../../src/utils/Utils.js'

/**
 * Update-throughput regression tests (render-2026 workstream A).
 *
 * `chart._updateStats` is the dev hook counting which path each data update
 * took: `fast` (series-only repaint), `fastWithAxes` (series repaint plus
 * in-place axis/grid chrome refresh after a scale change), `full` (complete
 * re-render). The core guarantee: a DOMAIN-CHANGING data-only update must NOT
 * fall back to a full render.
 */

const walk = (n, seed = 42, scale = 1, off = 0) => {
  let s = seed >>> 0
  const rand = () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  let v = 100
  return Array.from({ length: n }, (_, i) => {
    v += (rand() - 0.5) * 4
    return [i, Math.round((v * scale + off) * 100) / 100]
  })
}

const lineOpts = (data) => ({
  chart: { type: 'line', width: 700, height: 350 },
  series: [{ name: 'v', data }],
  stroke: { width: 2, curve: 'straight' },
  markers: { size: 0 },
  dataLabels: { enabled: false },
  xaxis: { type: 'numeric' },
  yaxis: { labels: { minWidth: 60 } },
})

describe('data-only update fast path', () => {
  it('a domain-changing update takes the in-place axis path, NOT a full render', async () => {
    const chart = createChartWithOptions(lineOpts(walk(200)))

    // different scale + offset -> the y nice-scale is guaranteed to change
    await chart.updateSeries([{ name: 'v', data: walk(200, 7, 1.5, 40) }])

    expect(chart._updateStats.full).toBe(0)
    expect(
      chart._updateStats.fast + chart._updateStats.fastWithAxes,
    ).toBeGreaterThanOrEqual(1)
    chart.destroy()
  })

  it('axis labels are refreshed in place after the domain changes', async () => {
    const chart = createChartWithOptions(lineOpts(walk(200)))
    const labelsBefore = [
      ...document.querySelectorAll('.apexcharts-yaxis-label'),
    ].map((t) => t.textContent)

    await chart.updateSeries([{ name: 'v', data: walk(200, 7, 3, 400) }])

    const labelsAfter = [
      ...document.querySelectorAll('.apexcharts-yaxis-label'),
    ].map((t) => t.textContent)
    expect(labelsAfter.length).toBeGreaterThan(0)
    expect(labelsAfter).not.toEqual(labelsBefore)
    // labels must carry visible text (regression: the in-place redraw once
    // produced empty tspans because the duplicate-label check saw the old
    // axis still mounted)
    expect(labelsAfter.every((t) => t && t.length > 0)).toBe(true)
    chart.destroy()
  })

  it('structural changes (data length) still take the full render', async () => {
    const chart = createChartWithOptions(lineOpts(walk(100)))
    await chart.updateSeries([{ name: 'v', data: walk(150, 7) }])
    expect(chart._updateStats.full).toBe(1)
    chart.destroy()
  })

  it('does not accumulate chrome nodes across many updates', async () => {
    const chart = createChartWithOptions(lineOpts(walk(120)))
    for (let i = 0; i < 4; i++) {
      await chart.updateSeries([
        { name: 'v', data: walk(120, 10 + i, 1 + i * 0.2, i * 10) },
      ])
    }
    expect(
      document.querySelectorAll('.apexcharts-xcrosshairs').length,
    ).toBeLessThanOrEqual(1)
    expect(
      document.querySelectorAll('.apexcharts-line-series').length,
    ).toBe(1)
    expect(document.querySelectorAll('.apexcharts-xaxis').length).toBe(1)
    expect(document.querySelectorAll('.apexcharts-yaxis').length).toBe(1)
    chart.destroy()
  })

  it('series values and state reflect the last update', async () => {
    const chart = createChartWithOptions(lineOpts(walk(80)))
    const next = walk(80, 9, 2, 30)
    await chart.updateSeries([{ name: 'v', data: next }])
    expect(chart.w.config.series[0].data).toEqual(next)
    expect(chart.w.seriesData.series[0][79]).toBe(next[79][1])
    chart.destroy()
  })
})

describe('lazily computed derived series state', () => {
  it('seriesPercent is still readable on an unstacked chart', () => {
    const chart = createChartWithOptions(lineOpts(walk(40)))
    const pct = chart.w.globals.seriesPercent
    expect(Array.isArray(pct)).toBe(true)
    expect(pct[0].length).toBe(40)
    chart.destroy()
  })

  it('stackedSeriesTotals is still readable and correct', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 700, height: 350, stacked: true },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [10, 20, 30] },
      ],
      dataLabels: { enabled: false },
    })
    expect(chart.w.seriesData.stackedSeriesTotals).toEqual([11, 22, 33])
    chart.destroy()
  })

  it('initialSeries materializes correctly for resetSeries', async () => {
    const initial = walk(30)
    const chart = createChartWithOptions(lineOpts(initial))
    // the lazy snapshot must deep-clone: mutating the returned value must
    // not corrupt the stored snapshot
    const snap = chart.w.globals.initialSeries
    expect(snap[0].data).toEqual(initial)
    expect(snap[0].data).not.toBe(initial)
    chart.destroy()
  })
})

describe('fused parse extrema (2D-array fast lane)', () => {
  const mk = (data, chart = {}) =>
    createChartWithOptions({
      chart: { type: 'line', width: 700, height: 350, ...chart },
      series: [{ data }],
      xaxis: { type: 'numeric' },
      dataLabels: { enabled: false },
    })

  it('produces scale state identical to the general parse path', () => {
    // decimals, negatives, nulls, integers, exotic magnitude: every branch
    // of the extrema semantics. The [[x,y]] chart takes the fused fast lane;
    // the [{x,y}] chart carries the same values through the general path.
    const vals = [3.25, -7.5, null, 0.001, 42, -0.125, 1e-9, 900.5, null, 12]
    const fast = mk(vals.map((v, i) => [i + 1, v]))
    const slow = mk(vals.map((v, i) => ({ x: i + 1, y: v })))

    expect(fast.w.seriesData._parsedExtrema[0]).toBeTruthy()
    expect(slow.w.seriesData._parsedExtrema[0]).toBeUndefined()

    for (const key of ['minY', 'maxY', 'minX', 'maxX']) {
      expect(fast.w.globals[key], key).toBe(slow.w.globals[key])
    }
    expect(fast.w.globals.yValueDecimal).toBe(slow.w.globals.yValueDecimal)
    expect(fast.w.globals.hasNullValues).toBe(slow.w.globals.hasNullValues)
    expect(fast.w.seriesData.series).toEqual(slow.w.seriesData.series)
    expect(fast.w.seriesData.seriesX).toEqual(slow.w.seriesData.seriesX)
    fast.destroy()
    slow.destroy()
  })

  it('keeps the bar all-negative zero-clamp behavior', () => {
    const fast = mk(
      [-5, -12, -3].map((v, i) => [i + 1, v]),
      { type: 'bar' },
    )
    const slow = mk(
      [-5, -12, -3].map((v, i) => ({ x: i + 1, y: v })),
      { type: 'bar' },
    )
    expect(fast.w.globals.maxY).toBe(slow.w.globals.maxY)
    expect(fast.w.globals.minY).toBe(slow.w.globals.minY)
    expect(fast.w.globals.maxY).toBeGreaterThanOrEqual(0)
    fast.destroy()
    slow.destroy()
  })

  it('mixed/exotic points fall back to the general loop with same output', () => {
    // a bubble-style [x, y, z] point makes the series ineligible mid-array
    const data = [
      [1, 5],
      [2, 9, 4],
      [3, 2],
    ]
    const chart = mk(data)
    expect(chart.w.seriesData._parsedExtrema[0]).toBeUndefined()
    expect(chart.w.seriesData.series[0]).toEqual([5, 9, 2])
    expect(chart.w.seriesData.seriesZ[0]).toEqual([4])
    expect(chart.w.globals.maxY).toBeGreaterThanOrEqual(9)
    chart.destroy()
  })
})

describe('parse-state writers do not force lazy state', () => {
  afterEach(() => vi.restoreAllMocks())

  it('rendering a non-stacked line keeps the derived-state accessors lazy', async () => {
    // Regression for the Object.assign slice-writer bug: copying the parse
    // snapshot onto w.* invoked every enumerable getter, forcing the deep
    // initialSeries clone and both stacked-totals passes on every render and
    // every update of a chart that reads none of them.
    const stackedSpy = vi.spyOn(CoreUtils.prototype, 'getStackedSeriesTotals')
    const groupsSpy = vi.spyOn(
      CoreUtils.prototype,
      'getStackedSeriesTotalsByGroups',
    )
    const percentSpy = vi.spyOn(CoreUtils.prototype, 'getPercentSeries')

    const chart = createChartWithOptions(lineOpts(walk(200)))
    const cloneSpy = vi.spyOn(Utils, 'clone')
    await chart.updateSeries([{ name: 'v', data: walk(200, 7, 1.4, 25) }])

    expect(stackedSpy).not.toHaveBeenCalled()
    expect(groupsSpy).not.toHaveBeenCalled()
    expect(percentSpy).not.toHaveBeenCalled()
    // a data-only update of a plain numeric line must not deep-clone anything
    expect(cloneSpy).not.toHaveBeenCalled()

    // the lazy fields must still be live accessor properties, not
    // materialized values copied over them
    const sd = chart.w.seriesData
    for (const key of ['stackedSeriesTotals', 'stackedSeriesTotalsByGroups']) {
      const d = Object.getOwnPropertyDescriptor(sd, key)
      expect(typeof d.get, key).toBe('function')
    }
    const pct = Object.getOwnPropertyDescriptor(
      chart.w.globals,
      'seriesPercent',
    )
    expect(typeof pct.get).toBe('function')
    // the parse snapshot must not smuggle these onto seriesData at all
    expect('initialSeries' in sd).toBe(false)
    expect('originalSeries' in sd).toBe(false)

    // and first REAL reads still materialize correct values
    expect(sd.stackedSeriesTotals.length).toBe(200)
    expect(chart.w.globals.seriesPercent[0].length).toBe(200)
    chart.destroy()
  })
})
