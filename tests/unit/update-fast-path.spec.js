import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

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
