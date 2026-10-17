import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// What an update captures from the screen (previous paths, the stream frame,
// axis chrome, label frames) only feeds the update's morphs. It used to be
// taken whenever animations were on, so a chart with dynamicAnimation off
// (violin's default, and common on live dashboards) walked every path and
// label on each update for nothing. And an update that captured nothing left
// the last capture's stream frame in place: after one animated update every
// later pan or unanimated refresh still found it, and a canvas line kept
// building path strings no one read. Counts captures per update and checks
// the stale frame is gone.

const pts = (n, seed = 0) =>
  Array.from({ length: n }, (_, i) => [i, ((i + seed) * 7) % 23])

async function lineChart(dynamic) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'line',
      width: 600,
      height: 300,
      animations: {
        enabled: true,
        speed: 1,
        dynamicAnimation: { enabled: dynamic, speed: 1 },
      },
    },
    dataLabels: { enabled: false },
    xaxis: { type: 'numeric' },
    series: [{ name: 'A', data: pts(40) }],
  })
  await chart.render()
  return chart
}

/** Counts screen captures while `fn` runs; each update starts unheld. */
async function captures(chart, fn) {
  const spy = vi.spyOn(chart.series, 'capturePreviousPaths')
  chart.w.globals.pendingCapture = null
  await fn()
  const n = spy.mock.calls.length
  spy.mockRestore()
  return n
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('captures only when the update will morph', () => {
  it('dynamicAnimation off: updateSeries, appendData and updateOptions capture nothing', async () => {
    const chart = await lineChart(false)
    // Before: 1 each. After: 0.
    expect(
      await captures(chart, () => chart.updateSeries([{ data: pts(40, 3) }])),
    ).toBe(0)
    expect(
      await captures(chart, () => chart.appendData([{ data: [[40, 5]] }])),
    ).toBe(0)
    expect(
      await captures(chart, () =>
        chart.updateOptions({ series: [{ data: pts(40, 5) }] }),
      ),
    ).toBe(0)
    expect(chart.w.globals.previousPaths).toEqual([])
    expect(chart.w.globals.prevStreamFrame).toBe(null)
    chart.destroy()
  })

  it('dynamicAnimation off: a payload with a chart section still captures', async () => {
    // It can switch the morph on or change the type, which is read after the
    // capture, so it captures as it always did.
    const chart = await lineChart(false)
    expect(
      await captures(chart, () =>
        chart.updateOptions({
          chart: { animations: { dynamicAnimation: { enabled: true } } },
          series: [{ data: pts(40, 5) }],
        }),
      ),
    ).toBe(1)
    chart.destroy()
  })

  it('dynamicAnimation on: every animated update still captures', async () => {
    const chart = await lineChart(true)
    expect(
      await captures(chart, () => chart.updateSeries([{ data: pts(40, 3) }])),
    ).toBe(1)
    expect(
      await captures(chart, () => chart.appendData([{ data: [[40, 5]] }])),
    ).toBe(1)
    expect(
      await captures(chart, () =>
        chart.updateOptions({ series: [{ data: pts(40, 5) }] }),
      ),
    ).toBe(1)
    chart.destroy()
  })
})

describe('an update that captures nothing drops the last stream frame', () => {
  it('after an animated update, an unanimated one leaves no frame behind', async () => {
    const chart = await lineChart(true)
    chart.w.globals.pendingCapture = null
    await chart.updateSeries([{ data: pts(40, 3) }])
    expect(chart.w.globals.prevStreamFrame).not.toBe(null)

    chart.w.globals.streamScrolled = true
    // A pan or wheel zoom: options with animate false. Before: the frame
    // from the update above stayed, and so did streamScrolled.
    await chart.updateOptions({ xaxis: { min: 5, max: 30 } }, false, false)
    expect(chart.w.globals.prevStreamFrame).toBe(null)
    expect(chart.w.globals.streamScrolled).toBe(false)

    chart.w.globals.pendingCapture = null
    await chart.updateSeries([{ data: pts(40, 4) }])
    await chart.updateSeries([{ data: pts(40, 6) }], false)
    expect(chart.w.globals.prevStreamFrame).toBe(null)
    chart.destroy()
  })
})
