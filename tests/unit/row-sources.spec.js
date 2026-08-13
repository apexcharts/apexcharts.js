/**
 * Row sources: the rows behind each mark (plan 21, P1).
 *
 * A histogram bar stands for the observations it counted, a box for the sample
 * it summarises. `chart.rowSeries()` hands those back as a unit-chart series so
 * the mark can come apart into them.
 *
 * The load-bearing property here is ORDER, not content. The morph engine maps a
 * unit chart's clusters onto the outgoing chart's marks positionally, so
 * cluster i must correspond to mark i, empty marks included. Content bugs are
 * visible; an ordering bug just sends dots out of the wrong bar.
 */

import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/stats'
import {
  getRowSource,
  registerRowSource,
  unregisterRowSource,
  rowSourceFor,
} from '../../src/modules/RowSourceRegistry'
import { binCounts, computeBinning, rowsByBin, rowsForBin } from '../../src/charts/common/Stats'

/** A deterministic, mildly skewed sample. */
function sample(n = 200) {
  const out = []
  let seed = 7
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647
    out.push((seed % 1000) / 10)
  }
  return out
}

/** A sample with a hole in the middle, so some bins are guaranteed empty. */
function gappedSample() {
  return sample(200).filter((v) => v < 30 || v > 70)
}

function histChart(series, plotOptions) {
  return createChartWithOptions({
    chart: { type: 'histogram', width: 600, height: 400 },
    series,
    ...(plotOptions ? { plotOptions } : {}),
  })
}

function totalRows(rowSeries) {
  return rowSeries.reduce((n, c) => n + c.data.length, 0)
}

describe('Stats.rowsByBin', () => {
  it('agrees with rowsForBin bin for bin', () => {
    const values = sample(300)
    const b = computeBinning(values, {})
    const all = rowsByBin(values, b.edges)
    expect(all.length).toBe(b.edges.length - 1)
    for (let k = 0; k < all.length; k++) {
      expect(all[k]).toEqual(rowsForBin(values, b.edges, k))
    }
  })

  it('agrees with binCounts, and keeps empty bins in place', () => {
    const values = gappedSample()
    const b = computeBinning(values, { bins: 20 })
    const all = rowsByBin(values, b.edges)
    const counts = binCounts(values, b.edges)
    expect(all.map((r) => r.length)).toEqual(counts)
    // The hole has to survive as empty slots, not be compacted away.
    expect(counts.some((c) => c === 0)).toBe(true)
    expect(all.length).toBe(counts.length)
  })

  it('accounts for every observation exactly once', () => {
    const values = sample(300)
    const b = computeBinning(values, {})
    const flat = rowsByBin(values, b.edges).flat().sort((a, z) => a - z)
    expect(flat).toEqual(values.slice().sort((a, z) => a - z))
  })
})

describe('RowSourceRegistry', () => {
  it('resolves the user-facing alias before the renderer name', () => {
    // A histogram reports chart.type 'bar'; only `requestedType` names it.
    const w = { config: { chart: { type: 'bar', requestedType: 'histogram' } } }
    expect(rowSourceFor(w)).toBe(getRowSource('histogram'))
  })

  it('returns null for a type that cannot name its rows', () => {
    expect(rowSourceFor({ config: { chart: { type: 'bar' } } })).toBe(null)
    expect(getRowSource('line')).toBe(null)
  })

  it('registers and unregisters', () => {
    const fn = () => []
    registerRowSource('__probe', fn)
    expect(getRowSource('__probe')).toBe(fn)
    unregisterRowSource('__probe')
    expect(getRowSource('__probe')).toBe(null)
  })
})

describe('chart.rowSeries() — histogram', () => {
  it('returns one cluster per bin, holding that bin’s observations', () => {
    const values = sample(200)
    const chart = histChart([{ name: 'Sample', data: values }], {
      histogram: { bins: 12 },
    })
    const rows = chart.rowSeries()

    expect(rows).not.toBe(null)
    expect(rows.length).toBe(chart.w.histogramData.counts[0].length)
    expect(rows.map((c) => c.data.length)).toEqual(chart.w.histogramData.counts[0])
    expect(totalRows(rows)).toBe(values.length)
  })

  it('keeps a cluster for every empty bin, so cluster i stays on bar i', () => {
    const values = gappedSample()
    const chart = histChart([{ name: 'Gapped', data: values }], {
      histogram: { bins: 20 },
    })
    const counts = chart.w.histogramData.counts[0]
    const rows = chart.rowSeries()

    expect(counts.some((c) => c === 0)).toBe(true)
    // Same length AND same shape: a compacted array would pass a length check
    // against the non-empty bins only.
    expect(rows.length).toBe(counts.length)
    expect(rows.map((c) => c.data.length)).toEqual(counts)
  })

  it('emits series-major order, which is the bar renderer’s draw order', () => {
    const chart = histChart(
      [
        { name: 'A', data: sample(120) },
        { name: 'B', data: sample(80).map((v) => v + 15) },
      ],
      { histogram: { bins: 8 } },
    )
    const counts = chart.w.histogramData.counts
    const rows = chart.rowSeries()

    expect(rows.length).toBe(counts[0].length + counts[1].length)
    expect(rows.map((c) => c.data.length)).toEqual([...counts[0], ...counts[1]])
  })

  it('drops a collapsed series entirely, because it draws no bars', () => {
    const chart = histChart(
      [
        { name: 'A', data: sample(120) },
        { name: 'B', data: sample(80) },
      ],
      { histogram: { bins: 8 } },
    )
    const bins = chart.w.histogramData.counts[0].length
    expect(chart.rowSeries().length).toBe(bins * 2)

    chart.w.globals.collapsedSeriesIndices = [1]
    const rows = chart.rowSeries()
    // Emitting clusters for a series with no marks would push every later
    // cluster onto the wrong bar.
    expect(rows.length).toBe(bins)
    expect(rows.every((c) => c.name.startsWith('A '))).toBe(true)
  })

  it('carries the value, a stable id, and the source mark’s colour', () => {
    const chart = histChart([{ name: 'Sample', data: sample(60) }], {
      histogram: { bins: 6 },
    })
    const rows = chart.rowSeries()
    const firstFilled = rows.find((c) => c.data.length > 0)
    const d = firstFilled.data[0]

    expect(typeof d.y).toBe('number')
    expect(typeof d.id).toBe('string')
    expect(d.fillColor).toBe(chart.w.globals.colors[0])
    // Ids are unique across the whole explode, or identity keying collides.
    const ids = rows.flatMap((c) => c.data.map((x) => x.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('reads the raw stash, not the binned series it wrote back', () => {
    const values = sample(200)
    const chart = histChart([{ name: 'Sample', data: values }], {
      histogram: { bins: 10 },
    })
    // config.series now holds one row per BIN. If the source read that, the
    // totals would collapse to the bin count.
    expect(chart.w.config.series[0].data.length).toBe(10)
    expect(totalRows(chart.rowSeries())).toBe(values.length)
  })

  it('returns null before any binning has happened', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 400 },
      series: [{ name: 'Plain', data: [1, 2, 3] }],
    })
    expect(chart.rowSeries()).toBe(null)
  })
})

describe('chart.rowSeries() — the cap', () => {
  it('thins by one shared stride, preserving relative cluster sizes', () => {
    const values = sample(1000)
    const chart = histChart([{ name: 'Big', data: values }], {
      histogram: { bins: 10 },
    })
    const counts = chart.w.histogramData.counts[0]
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const rows = chart.rowSeries({ maxRows: 100 })
    warn.mockRestore()

    // maxRows is a ceiling, not an aspiration. Rounding up inside each cluster
    // means ceil(total / maxRows) can still overshoot, so the stride has to be
    // walked up until it genuinely fits.
    expect(totalRows(rows)).toBeLessThanOrEqual(100)

    // ONE stride for everyone, so the tall bins are still the tall ones. A
    // per-cluster budget would pull every cluster to the same size and flatten
    // exactly the shape the explode exists to show. Derive the stride actually
    // used rather than assuming the first guess survived.
    const firstFilled = counts.findIndex((n) => n > 0)
    const stride = Math.ceil(counts[firstFilled] / rows[firstFilled].data.length)
    expect(stride).toBeGreaterThan(1)
    expect(rows.map((c) => c.data.length)).toEqual(
      counts.map((n) => Math.ceil(n / stride)),
    )
  })

  it('says so when it thins, and stays quiet when it does not', () => {
    const chart = histChart([{ name: 'Big', data: sample(1000) }], {
      histogram: { bins: 10 },
    })

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    chart.rowSeries({ maxRows: 100 })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('maxRows')

    warn.mockClear()
    chart.rowSeries({ maxRows: 100000 })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('leaves the data untouched under the cap', () => {
    const values = sample(200)
    const chart = histChart([{ name: 'Small', data: values }], {
      histogram: { bins: 10 },
    })
    expect(totalRows(chart.rowSeries({ maxRows: 3000 }))).toBe(values.length)
  })
})

describe('chart.rowSeries() — boxPlot and violin', () => {
  const OBS = [
    [12, 14, 15, 15, 17, 19, 22, 25],
    [20, 21, 23, 24, 24, 26, 30],
  ]

  it('boxPlot: one cluster per box, holding that box’s observations', () => {
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot', width: 600, height: 400 },
      series: [
        {
          name: 'Devices',
          data: [
            { x: 'A', points: OBS[0] },
            { x: 'B', points: OBS[1] },
          ],
        },
      ],
    })
    const rows = chart.rowSeries()

    expect(rows.length).toBe(2)
    expect(rows.map((c) => c.data.length)).toEqual([OBS[0].length, OBS[1].length])
    expect(rows.map((c) => c.name)).toEqual(['A', 'B'])
    expect(rows[0].data.map((d) => d.y)).toEqual(OBS[0])
  })

  it('violin: the same, from the density type’s own observations', () => {
    const chart = createChartWithOptions({
      chart: { type: 'violin', width: 600, height: 400 },
      series: [
        {
          name: 'Devices',
          data: [
            { x: 'A', y: OBS[0] },
            { x: 'B', y: OBS[1] },
          ],
        },
      ],
    })
    const rows = chart.rowSeries()

    expect(rows).not.toBe(null)
    expect(rows.length).toBe(2)
    expect(totalRows(rows)).toBe(OBS[0].length + OBS[1].length)
  })

  it('boxPlot: a box with no observations still gets its cluster', () => {
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot', width: 600, height: 400 },
      series: [
        {
          name: 'Devices',
          data: [
            { x: 'A', points: OBS[0] },
            // Precomputed summary, no sample: still one box on screen.
            { x: 'B', y: [10, 20, 30, 40, 50] },
            { x: 'C', points: OBS[1] },
          ],
        },
      ],
    })
    const rows = chart.rowSeries()

    expect(rows.length).toBe(3)
    expect(rows.map((c) => c.data.length)).toEqual([OBS[0].length, 0, OBS[1].length])
  })
})
