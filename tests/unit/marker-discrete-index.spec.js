import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import { createChartWithOptions } from './utils/utils.js'

/**
 * `markers.discrete` is resolved through one index per render, not scanned per
 * marker. The scan made a render O(points x entries), quadratic when an entry
 * is generated per point to colour by value.
 */

const N = 30
const data = (off = 0) => Array.from({ length: N }, (_, j) => ((j * 7) % 40) + off)

const opts = (discrete, extra = {}) => ({
  chart: { type: 'line', width: 600, height: 400, animations: { enabled: false } },
  colors: ['#008FFB', '#00E396'],
  dataLabels: { enabled: false },
  markers: { size: 0, discrete },
  series: [
    { name: 'a', data: data() },
    { name: 'b', data: data(20) },
  ],
  ...extra,
})

/** A discrete entry whose `seriesIndex` reads are counted. */
const counted = (counter, entry) => {
  const { seriesIndex, ...rest } = entry
  return Object.defineProperty(rest, 'seriesIndex', {
    enumerable: true,
    get() {
      counter.n++
      return seriesIndex
    },
  })
}

const markerAt = (root, i, j) =>
  [...root.querySelectorAll('.apexcharts-marker')].find(
    (m) => m.getAttribute('index') === String(i) && m.getAttribute('j') === String(j),
  )

describe('markers.discrete index', () => {
  it('reads each entry once per render instead of once per marker', async () => {
    const chart = createChartWithOptions(opts([{ seriesIndex: 0, dataPointIndex: 1, size: 6 }]))
    const counter = { n: 0 }
    const D = 10
    chart.w.config.markers.discrete = Array.from({ length: D }, (_, k) =>
      counted(counter, { seriesIndex: k % 2, dataPointIndex: k * 2, size: 6 }),
    )
    await chart.updateSeries([{ data: data() }, { data: data(20) }], false)

    // 2 series x 30 markers each scanned all 10 entries: about 600 reads
    expect(counter.n).toBeLessThanOrEqual(2 * D)
    expect(Number(markerAt(document, 1, 2).getAttribute('default-marker-size'))).toBe(6)
    expect(Number(markerAt(document, 0, 2).getAttribute('default-marker-size'))).toBe(0)
    chart.destroy()
  })

  it('applies every entry naming a point in list order, last field wins', () => {
    const chart = createChartWithOptions(
      opts([
        { seriesIndex: 0, dataPointIndex: 4, size: 9, fillColor: '#FF4560' },
        { seriesIndex: 0, dataPointIndex: 4, fillColor: '#333333' },
        { seriesIndex: 1, dataPointIndex: 4, size: 5 },
      ]),
    )
    const el = markerAt(document, 0, 4)
    expect(el.getAttribute('fill')).toBe('#333333')
    expect(Number(el.getAttribute('default-marker-size'))).toBe(9)
    expect(Number(markerAt(document, 1, 4).getAttribute('default-marker-size'))).toBe(5)
    expect(markerAt(document, 1, 4).getAttribute('fill')).toBe('#00E396')
    chart.destroy()
  })

  it('rebuilds on updateOptions and keeps two charts apart', async () => {
    // sibling containers (the shared helper's self-closing divs nest)
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
    const [ea, eb] = [document.getElementById('a'), document.getElementById('b')]
    const a = new ApexCharts(ea, opts([{ seriesIndex: 0, dataPointIndex: 1, size: 7 }]))
    const b = new ApexCharts(eb, opts([{ seriesIndex: 1, dataPointIndex: 2, size: 5 }]))
    await a.render()
    await b.render()
    expect(Number(markerAt(ea, 0, 1).getAttribute('default-marker-size'))).toBe(7)
    expect(Number(markerAt(ea, 1, 2).getAttribute('default-marker-size'))).toBe(0)
    expect(Number(markerAt(eb, 1, 2).getAttribute('default-marker-size'))).toBe(5)
    expect(Number(markerAt(eb, 0, 1).getAttribute('default-marker-size'))).toBe(0)

    await a.updateOptions({ markers: { discrete: [{ seriesIndex: 0, dataPointIndex: 3, size: 8 }] } })
    expect(Number(markerAt(ea, 0, 1).getAttribute('default-marker-size'))).toBe(0)
    expect(Number(markerAt(ea, 0, 3).getAttribute('default-marker-size'))).toBe(8)
    expect(Number(markerAt(eb, 1, 2).getAttribute('default-marker-size'))).toBe(5)

    await a.updateSeries([{ data: data().slice(0, 10) }, { data: data(20).slice(0, 10) }], false)
    expect(Number(markerAt(ea, 0, 3).getAttribute('default-marker-size'))).toBe(8)
    a.destroy()
    b.destroy()
  })
})
