import { describe, it, expect } from 'vitest'
import Crossfilter from '../../src/modules/link/Crossfilter.js'
import { createChartWithOptions } from './utils/utils.js'

// Regression coverage for the crossfilter range-histogram config path. Two
// independent guarantees are asserted:
//   1. chart.link.bins ({width}|{count}|{thresholds}) survives the Options
//      config merge (the default is `undefined`; Utils.extend used to drop the
//      whole object, silently falling back to 30 auto bins).
//   2. Each bins shape produces the expected edges in the Crossfilter engine.

const records = Array.from({ length: 101 }, (_, i) => ({ v: i })) // v = 0..100
const accessor = (r) => r.v

function edgesFor(bins) {
  const cf = new Crossfilter('bins-test', records)
  cf.registerDimension('c', { dimension: accessor, type: 'range', bins })
  const agg = cf.aggregateFor('c')
  cf.destroy()
  return agg
}

describe('Crossfilter range bins', () => {
  it('{ width } produces edges snapped to the width grid, spanning the data', () => {
    const agg = edgesFor({ width: 10 })
    expect(agg.type).toBe('range')
    expect(agg.edges).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
    // bars plot at bin centers, one label per bin
    expect(agg.labels).toEqual([5, 15, 25, 35, 45, 55, 65, 75, 85, 95])
    expect(agg.keys.length).toBe(10)
  })

  it('{ count } produces evenly spaced edges with the top edge pinned to max', () => {
    const agg = edgesFor({ count: 5 })
    expect(agg.edges).toEqual([0, 20, 40, 60, 80, 100])
    expect(agg.labels).toEqual([10, 30, 50, 70, 90])
  })

  it('{ thresholds } uses the given boundaries verbatim (sorted, deduped)', () => {
    const agg = edgesFor({ thresholds: [0, 25, 50, 100] })
    expect(agg.edges).toEqual([0, 25, 50, 100])
    expect(agg.labels).toEqual([12.5, 37.5, 75])
  })

  it('every record lands in exactly one bin (edge bins included)', () => {
    const agg = edgesFor({ width: 10 })
    const total = agg.values.reduce((a, b) => a + b, 0)
    expect(total).toBe(records.length) // 0 and 100 both bucketed
  })
})

describe('chart.link.bins survives the config merge', () => {
  const mk = (bins) =>
    createChartWithOptions({
      chart: {
        type: 'bar',
        link: { id: 'nope', dimension: (r) => r.v, bins },
      },
      series: [{ data: [1, 2, 3] }],
    }).w.config.chart.link.bins

  it('keeps { width } (default was undefined -> used to be dropped to {})', () => {
    expect(mk({ width: 604800000 })).toEqual({ width: 604800000 })
  })

  it('keeps { count }', () => {
    expect(mk({ count: 24 })).toEqual({ count: 24 })
  })

  it('keeps { thresholds }', () => {
    expect(mk({ thresholds: [0, 1, 2, 3] })).toEqual({ thresholds: [0, 1, 2, 3] })
  })
})
