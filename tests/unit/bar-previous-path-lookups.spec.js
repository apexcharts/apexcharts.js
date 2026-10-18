import { describe, it, expect, vi, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
// Loaded, as in the full bundle: an inactive filter must not keep lookups.
import '../../src/features/highlight-filter.js'
import ApexCharts from '../../src/entries/standard.js'
import Series from '../../src/modules/Series.js'
import Bar from '../../src/charts/Bar.js'

// The morph-source lookups an update makes into the previous render's paths:
// how much of previousPaths each renderer walks, and that nothing is looked up
// for a render that will not morph. The morphs themselves are unchanged.

afterEach(() => vi.restoreAllMocks())

const render = async (opts) => {
  document.body.innerHTML = '<div id="chart"></div>'
  opts.chart = {
    width: 600,
    height: 300,
    ...opts.chart,
    animations: { enabled: true, ...(opts.chart.animations || {}) },
  }
  const chart = new ApexCharts(document.querySelector('#chart'), opts)
  await chart.render()
  return chart
}

const many = (n, len, k = 0) =>
  Array.from({ length: n }, (_, s) => ({
    name: 's' + s,
    data: Array.from({ length: len }, (_, j) => ((s * 7 + j * 3 + k) % 9) + 1),
  }))

// Index reads of w.globals.previousPaths made after it is captured.
const countRecordReads = () => {
  let reads = 0
  const capture = Series.prototype.getPreviousPaths
  vi.spyOn(Series.prototype, 'getPreviousPaths').mockImplementation(function (
    ...a
  ) {
    const r = capture.apply(this, a)
    this.w.globals.previousPaths = new Proxy(this.w.globals.previousPaths, {
      get(t, k, rcv) {
        if (typeof k === 'string' && /^\d+$/.test(k)) reads++
        return Reflect.get(t, k, rcv)
      },
    })
    return r
  })
  return () => reads
}

describe('previous records by series', () => {
  it('a stacked bar update reads each record about once', async () => {
    const S = 30
    const chart = await render({
      chart: { type: 'bar', stacked: true },
      dataLabels: { enabled: false },
      series: many(S, 4),
    })
    const before = chart.el
      .querySelector('.apexcharts-bar-area')
      .getAttribute('pathTo')
    const reads = countRecordReads()
    await chart.updateSeries(many(S, 4, 1))
    expect(reads()).toBeLessThanOrEqual(2 * S)
    // Still morphing from the previous shape.
    expect(
      chart.el.querySelector('.apexcharts-bar-area').getAttribute('pathFrom'),
    ).toBe(before)
  })

  it('a line update reads each record about once', async () => {
    const S = 30
    const chart = await render({
      chart: { type: 'line' },
      series: many(S, 5),
    })
    const reads = countRecordReads()
    await chart.updateSeries(many(S, 5, 1))
    expect(reads()).toBeLessThanOrEqual(2 * S)
  })

  it('a radar update reads each record about once', async () => {
    const S = 20
    const chart = await render({
      chart: { type: 'radar' },
      series: many(S, 5),
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
    })
    const reads = countRecordReads()
    await chart.updateSeries(many(S, 5, 1))
    expect(reads()).toBeLessThanOrEqual(2 * S)
  })
})

describe('no lookups for a render that does not morph', () => {
  it('a bulk-faded bar update looks up no previous path', async () => {
    const chart = await render({
      chart: { type: 'bar', animations: { largeDatasetThreshold: 5 } },
      series: many(3, 8),
    })
    const morphs = vi.spyOn(Bar.prototype, 'cornerMorph')
    const records = vi.spyOn(Bar.prototype, '_prevRecord')
    await chart.updateSeries(many(3, 8, 1))
    expect(morphs).toHaveBeenCalledTimes(0)
    // one per series (the exit-ghost call's argument), none per bar
    expect(records).toHaveBeenCalledTimes(3)
    // drawn at the final shape, revealed by the fade
    chart.el.querySelectorAll('.apexcharts-bar-area').forEach((p) => {
      expect(p.getAttribute('d')).toBe(p.getAttribute('pathTo'))
    })
  })

  it('a bulk-faded candlestick or box plot update looks up nothing', async () => {
    for (const type of ['candlestick', 'boxPlot']) {
      const data = (k) =>
        Array.from({ length: 8 }, (_, j) => ({
          x: 'c' + j,
          y:
            type === 'boxPlot'
              ? [1, 3, 5 + k, 7, 9]
              : [5, 8 + k, 4, 7 - (j % 3)],
        }))
      const chart = await render({
        chart: { type, animations: { largeDatasetThreshold: 5 } },
        series: [{ data: data(0) }],
      })
      const morphs = vi.spyOn(Bar.prototype, 'cornerMorph')
      const records = vi.spyOn(Bar.prototype, '_prevRecord')
      await chart.updateSeries([{ data: data(1) }])
      expect(morphs).toHaveBeenCalledTimes(0)
      expect(records).toHaveBeenCalledTimes(0)
      vi.restoreAllMocks()
    }
  })

  it('a chart drawing highlight parts keeps them: its parts start there', async () => {
    const hl = (k) =>
      many(3, 8, k).map((s) => ({
        ...s,
        highlightData: s.data.map((v) => Math.ceil(v / 2)),
      }))
    const chart = await render({
      chart: { type: 'bar', animations: { largeDatasetThreshold: 5 } },
      series: hl(0),
    })
    const morphs = vi.spyOn(Bar.prototype, 'cornerMorph')
    await chart.updateSeries(hl(1))
    expect(morphs).toHaveBeenCalledTimes(24)
  })

  it('an animated update still morphs every bar from its previous shape', async () => {
    const chart = await render({ chart: { type: 'bar' }, series: many(3, 6) })
    const morphs = vi.spyOn(Bar.prototype, 'cornerMorph')
    await chart.updateSeries(many(3, 6, 1))
    expect(morphs).toHaveBeenCalledTimes(18)
  })
})
