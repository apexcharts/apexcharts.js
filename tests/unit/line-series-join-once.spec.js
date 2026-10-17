import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// A line/area series joins its datums against the previous frame by key
// (LengthTransition.seriesJoin) to reconcile the morph paths, to ride the
// markers and to hold the data labels. Each of the three used to build the
// whole join again (2N keys, two uniquify maps, the join itself), and two of
// them serve markers and labels, which are off by default. The series now
// builds it once per render, and not at all for a marker ride with no
// markers. The join is counted through the captured frame: every join reads
// `frame.isXNumeric` once per previous datum, and nothing else reads it.

const N = 20
const pts = (n, seed = 0) =>
  Array.from({ length: n }, (_, i) => [i, ((i + seed) * 7) % 23])

async function areaChart({ markers = 0, labels = false } = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'area',
      width: 600,
      height: 300,
      animations: {
        enabled: true,
        speed: 1,
        dynamicAnimation: { enabled: true, speed: 300 },
      },
    },
    dataLabels: { enabled: labels },
    markers: { size: markers },
    xaxis: { type: 'numeric' },
    series: [{ name: 'A', data: pts(N) }],
  })
  await chart.render()
  return chart
}

/** Joins built while `fn` runs, in units of one series' previous length. */
async function joins(chart, fn) {
  let reads = 0
  const series = chart.series
  const orig = series.capturePreviousPaths.bind(series)
  vi.spyOn(series, 'capturePreviousPaths').mockImplementation(() => {
    orig()
    const frame = chart.w.globals.prevStreamFrame
    if (!frame) return
    const v = frame.isXNumeric
    Object.defineProperty(frame, 'isXNumeric', {
      configurable: true,
      get() {
        reads++
        return v
      },
    })
  })
  chart.w.globals.pendingCapture = null
  await fn()
  vi.restoreAllMocks()
  return reads / N
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('a line series builds its datum join once per update', () => {
  it('markers and labels off: one join for the paths (and one for the axis)', async () => {
    const chart = await areaChart()
    // Before: 3 (paths, markers, axis). After: 2.
    expect(
      await joins(chart, () => chart.updateSeries([{ data: pts(N + 1, 2) }])),
    ).toBe(2)
    chart.destroy()
  })

  it('markers and labels on: paths, markers and labels share one join', async () => {
    const chart = await areaChart({ markers: 4, labels: true })
    // Before: 4 (paths, markers, labels, axis). After: 2.
    expect(
      await joins(chart, () => chart.updateSeries([{ data: pts(N + 1, 2) }])),
    ).toBe(2)
    // The ride and the label hold still engage on that one join.
    const wrap = chart.w.dom.baseEl.querySelector(
      '.apexcharts-area-series .apexcharts-series-markers-wrap',
    )
    expect(wrap.classList.contains('apexcharts-element-hidden')).toBe(false)
    const labels = chart.w.dom.baseEl.querySelector(
      '.apexcharts-area-series .apexcharts-datalabels',
    )
    expect(labels.classList.contains('apexcharts-element-hidden')).toBe(true)
    chart.destroy()
  })

  it('a second update in the same frame joins its own data, not the first', async () => {
    const chart = await areaChart({ markers: 4, labels: true })
    const frames = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames.push(cb)
      return frames.length
    })
    chart.w.globals.pendingCapture = null
    // A length change holds the labels; the same-frame update back to the
    // painted data is an identity join against the held frame and must not.
    await chart.updateSeries([{ data: pts(N + 1, 2) }])
    await chart.updateSeries([{ data: pts(N) }])
    const labels = chart.w.dom.baseEl.querySelector(
      '.apexcharts-area-series .apexcharts-datalabels',
    )
    expect(labels.classList.contains('apexcharts-element-hidden')).toBe(false)
    vi.restoreAllMocks()
    chart.destroy()
  })

  it('a render that cannot ride does not scan its markers', async () => {
    let scans = 0
    const qsa = Element.prototype.querySelectorAll
    vi.spyOn(Element.prototype, 'querySelectorAll').mockImplementation(
      function (s) {
        if (s === '.apexcharts-marker') scans++
        return qsa.call(this, s)
      },
    )
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'line',
        width: 600,
        height: 300,
        animations: { enabled: false },
      },
      markers: { size: 4 },
      xaxis: { type: 'numeric' },
      series: [{ data: pts(N) }, { data: pts(N, 3) }],
    })
    await chart.render()
    await chart.updateSeries([{ data: pts(N, 1) }, { data: pts(N, 4) }])
    expect(scans).toBe(0)
    vi.restoreAllMocks()
    chart.destroy()
  })
})
