import { describe, it, expect, vi, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// Lookups made per bar for something known once per draw: a timeline bar's
// row, and its lane, which only rangeBarOverlap: false reads.

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

describe('timeline rows', () => {
  const rows = Array.from({ length: 12 }, (_, r) => 'row' + r)
  const timeline = (rangeBarOverlap) =>
    render({
      chart: { type: 'rangeBar' },
      plotOptions: { bar: { horizontal: true, rangeBarOverlap } },
      series: [
        {
          name: 'A',
          data: rows.flatMap((x, r) => [
            { x, y: [r, r + 4] },
            { x, y: [r + 2, r + 6] },
          ]),
        },
      ],
    })
  // Every bar's row and lane, against a per-bar scan of the labels and the
  // overlap groups.
  const place = (chart) => {
    const w = chart.w
    const rb = chart.ctx.rangeBar
    const labels = w.labelData.labels
    const ranges = w.rangeData.seriesRange[0]
    const spies = [vi.spyOn(labels, 'map'), vi.spyOn(ranges, 'findIndex')]
    const init = rb.barHelpers.initialPositions(0)
    const got = w.config.series[0].data.map((_, j) =>
      rb.detectOverlappingBars({
        i: 0,
        j,
        barYPosition: 0,
        srty: 1,
        barHeight: init.barHeight,
        yDivision: init.yDivision,
        initPositions: init,
      }),
    )
    const calls = spies.map((sp) => sp.mock.calls.length)
    vi.restoreAllMocks()
    const lanesOn = !w.config.plotOptions.bar.rangeBarOverlap
    got.forEach((p, j) => {
      const x = w.config.series[0].data[j].x
      let barHeight = init.barHeight
      let barYPosition =
        1 + init.barHeight * rb.visibleI + init.yDivision * labels.indexOf(x)
      const g = ranges.findIndex((tx) => tx.x === x && tx.overlaps?.size > 0)
      if (lanesOn && g > -1) {
        const lanes = Array.from(ranges[g].overlaps)
        const k = lanes.indexOf(w.globals.seriesRangeName[0][j])
        if (k > -1) {
          barHeight = init.barHeight / lanes.length
          barYPosition += barHeight * k
        }
      }
      expect(p.barHeight).toBe(barHeight)
      expect(p.barYPosition).toBe(barYPosition)
    })
    return { got, init, calls }
  }

  it('maps the rows once per draw and skips the lane lookup', async () => {
    const { calls } = place(await timeline(true))
    expect(calls).toEqual([0, 0])
  })

  it('still splits clashing bars into lanes when asked to', async () => {
    const { got, init, calls } = place(await timeline(false))
    expect(calls[0]).toBe(0)
    expect(got.every((p) => p.barHeight === init.barHeight / 2)).toBe(true)
  })
})
