/**
 * Weave `data[].observations` (#5342): the sample a series transform
 * summarised into the rows drawn. On a histogram `points` are bin counts and
 * `raw` is the transform's output too, so without this a plugin computing a
 * mean reported the mean bar height under the caller's series name.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/entries/histogram.js'
import '../../src/entries/violin.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const settle = () => sleep(80)

let n = 0
/** Registers a plugin that keeps the last api.data it was handed. */
function recorder() {
  const log = { data: null, api: null, name: `obs-recorder-${n++}` }
  ApexCharts.registerPlugin({
    name: log.name,
    apiVersion: 2,
    setup(api) {
      log.api = api
      const capture = () => {
        log.data = api.data
      }
      api.on('draw', capture)
      api.on('afterUpdate', capture)
    },
  })
  return log
}

/** A deterministic sample. */
function sample(count, seed = 7) {
  const out = []
  for (let i = 0; i < count; i++) {
    seed = (seed * 16807) % 2147483647
    out.push(30 + (seed % 4100) / 100)
  }
  return out
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length

describe('Weave observations: histogram', () => {
  it('hands a plugin the sample, not the bar heights', async () => {
    const log = recorder()
    const obs = sample(200)
    const chart = createChartWithOptions({
      chart: { type: 'histogram', animations: { enabled: false } },
      series: [{ name: 'Latency', data: obs }],
      plugins: [{ name: log.name }],
    })
    await settle()

    const s = log.data[0]
    expect(log.api.can('observations')).toBe(true)
    expect(s.observations.values).toEqual(obs)
    expect(mean(s.observations.values)).toBeCloseTo(mean(obs), 10)
    // byPoint follows the rows: one bin's observations per bar, and each bar's
    // count is the size of its bin.
    expect(s.observations.byPoint.length).toBe(s.points.length)
    s.points.forEach((p, j) => {
      expect(s.observations.byPoint[j].length).toBe(p.y)
    })
    chart.destroy()
  })

  // parseData writes the bins back to config.series, so a second render reads
  // the transform's output. The sample must come from the stash every time.
  it('still reports the sample after a re-render', async () => {
    const log = recorder()
    const obs = sample(120, 3)
    const chart = createChartWithOptions({
      chart: { type: 'histogram', animations: { enabled: false } },
      series: [{ name: 'A', data: obs }],
      plugins: [{ name: log.name }],
    })
    await settle()
    await chart.updateOptions({ plotOptions: { histogram: { bins: 6 } } })
    await settle()

    const s = log.data[0]
    expect(s.observations.values).toEqual(obs)
    expect(s.observations.byPoint.length).toBe(6)
    chart.destroy()
  })

  it('keeps a hidden series sample, with no bins to split it into', async () => {
    const log = recorder()
    const a = sample(80, 5)
    const b = sample(90, 9)
    const chart = createChartWithOptions({
      chart: { type: 'histogram', animations: { enabled: false } },
      series: [
        { name: 'A', data: a },
        { name: 'B', data: b },
      ],
      plugins: [{ name: log.name }],
    })
    await settle()
    chart.hideSeries('B')
    await settle()

    const [sa, sb] = log.data
    expect(sb.hidden).toBe(true)
    expect(sb.observations.values).toEqual(b)
    expect(sb.observations.byPoint).toEqual([])
    expect(sa.observations.values).toEqual(a)
    chart.destroy()
  })

  it('hands out a copy, so a plugin cannot edit what the next render bins', async () => {
    const log = recorder()
    const obs = sample(60, 11)
    const chart = createChartWithOptions({
      chart: { type: 'histogram', animations: { enabled: false } },
      series: [{ name: 'A', data: obs }],
      plugins: [{ name: log.name }],
    })
    await settle()
    log.data[0].observations.values.length = 0
    log.data[0].observations.byPoint[0].length = 0
    expect(chart.w.seriesObservations[0].values.length).toBe(60)
    expect(chart.w.seriesObservations[0].byPoint[0].length).toBeGreaterThan(0)
    chart.destroy()
  })

  it('stops reporting a sample once the chart is no longer a histogram', async () => {
    const log = recorder()
    const chart = createChartWithOptions({
      chart: { type: 'histogram', animations: { enabled: false } },
      series: [{ name: 'A', data: sample(50) }],
      plugins: [{ name: log.name }],
    })
    await settle()
    // xaxis.type is restated because the histogram's numeric axis survives a
    // type change on its own, which is a separate defect.
    await chart.updateOptions({
      chart: { type: 'line' },
      xaxis: { type: 'category' },
      series: [{ name: 'A', data: [4, 8, 15] }],
    })
    await settle()
    expect(log.data[0].observations).toBe(null)
    chart.destroy()
  })
})

describe('Weave observations: boxPlot and violin', () => {
  it('reports the points a boxPlot summary was derived from', async () => {
    const log = recorder()
    const p1 = sample(40, 2)
    const p2 = sample(30, 4)
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot', animations: { enabled: false } },
      series: [
        {
          name: 'Timings',
          data: [
            { x: 'A', points: p1 },
            { x: 'B', points: p2 },
            { x: 'C', y: [1, 2, 3, 4, 5] },
          ],
        },
      ],
      plugins: [{ name: log.name }],
    })
    await settle()

    const s = log.data[0]
    expect(s.observations.byPoint).toEqual([p1, p2, null])
    expect(s.observations.values).toEqual(p1.concat(p2))
    chart.destroy()
  })

  // A summary the caller computed is the caller's data: there is no sample.
  it('is null for a precomputed boxPlot', async () => {
    const log = recorder()
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot', animations: { enabled: false } },
      series: [{ name: 'S', data: [{ x: 'A', y: [1, 2, 3, 4, 5] }] }],
      plugins: [{ name: log.name }],
    })
    await settle()
    expect(log.data[0].observations).toBe(null)
    chart.destroy()
  })

  it('reports a violin flat-y sample', async () => {
    const log = recorder()
    const obs = sample(50, 13)
    const chart = createChartWithOptions({
      chart: { type: 'violin', animations: { enabled: false } },
      series: [{ name: 'V', data: [{ x: 'A', y: obs }] }],
      plugins: [{ name: log.name }],
    })
    await settle()
    expect(log.data[0].observations.byPoint).toEqual([obs])
    chart.destroy()
  })
})

describe('Weave observations: ordinary charts', () => {
  it('is null where the rows are the caller values', async () => {
    const log = recorder()
    const chart = createChartWithOptions({
      chart: { type: 'line', animations: { enabled: false } },
      series: [{ name: 'A', data: [1, 2, 3] }],
      plugins: [{ name: log.name }],
    })
    await settle()
    expect(log.data[0]).toHaveProperty('observations', null)
    chart.destroy()
  })
})
