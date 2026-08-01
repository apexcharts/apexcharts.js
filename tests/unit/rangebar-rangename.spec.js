import { createChartWithOptions } from './utils/utils.js'

// Harness for audit D1: the timeline rangeBar overlap offset reads a per-point
// `rangeName` id, historically stamped onto the user's config data point
// (w.config.series[i].data[j].rangeName). RangeBar looks that id up in the
// overlap group's Set to stack overlapping bars. This locks the overlap
// detection + the id->overlaps mapping (fix-neutral, read via `rn` which works
// before and after the fix) and asserts the config object is not mutated.

/** Read a point's range-name id from wherever it currently lives. */
function rn(w, i, j) {
  return (
    w.globals.seriesRangeName?.[i]?.[j] ??
    w.config.series[i]?.data?.[j]?.rangeName
  )
}

function makeOverlappingRangeBar() {
  return createChartWithOptions({
    chart: { type: 'rangeBar', id: 'rb-' + Math.random().toString(36).slice(2) },
    plotOptions: { bar: { horizontal: true } },
    series: [
      {
        name: 'S',
        data: [
          { x: 'Row', y: [0, 30] },
          { x: 'Row', y: [10, 40] },
        ],
      },
    ],
    xaxis: { type: 'numeric' },
  })
}

describe('rangeBar overlap: detection + id->overlaps mapping (fix-neutral)', () => {
  it('detects the two overlapping ranges as one group of size 2', () => {
    const w = makeOverlappingRangeBar().w
    const group = w.rangeData.seriesRange[0].find((r) => r.overlaps?.size > 0)
    expect(group).toBeTruthy()
    expect(group.overlaps.size).toBe(2)
  })

  it('maps each point to a distinct, stable index within the overlap group', () => {
    const w = makeOverlappingRangeBar().w
    const group = w.rangeData.seriesRange[0].find((r) => r.overlaps?.size > 0)
    const overlaps = Array.from(group.overlaps)

    const id0 = rn(w, 0, 0)
    const id1 = rn(w, 0, 1)

    expect(id0).toBeTruthy()
    expect(id1).toBeTruthy()
    expect(id0).not.toBe(id1)
    // The offset RangeBar applies is overlaps.indexOf(rangeName); the two points
    // must resolve to the two distinct slots, in data order.
    expect(overlaps.indexOf(id0)).toBe(0)
    expect(overlaps.indexOf(id1)).toBe(1)
  })
})

describe('rangeBar overlap: does not mutate the user config (D1)', () => {
  it('leaves no rangeName property on the config data points', () => {
    const w = makeOverlappingRangeBar().w
    expect(
      Object.prototype.hasOwnProperty.call(w.config.series[0].data[0], 'rangeName'),
    ).toBe(false)
    expect(
      Object.prototype.hasOwnProperty.call(w.config.series[0].data[1], 'rangeName'),
    ).toBe(false)
  })
})
