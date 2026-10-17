import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/streamgraph'

// The band under the pointer is resolved in ONE place (the streamgraph
// layer), and both the hover dim and the default tooltip ask it, so the two
// can never name different bands. Each hover measures the svg once.

const SERIES = [
  { name: 'Alpha', data: [3, 5, 8, 6, 4] },
  { name: 'Beta', data: [7, 6, 2, 3, 9] },
  { name: 'Gamma', data: [1, 4, 5, 9, 2] },
]

function streamChart() {
  return createChartWithOptions({
    chart: {
      type: 'streamgraph',
      width: 600,
      height: 300,
      animations: { enabled: false },
    },
    xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
    series: SERIES.map((s) => ({ ...s, data: s.data.slice() })),
  })
}

/** Make the svg measurable at the size it was drawn, and count the reads. */
function measureSvg(chart) {
  const w = chart.w
  const reads = { n: 0 }
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    () => {
      reads.n++
      return {
        left: 0,
        top: 0,
        right: w.globals.svgWidth,
        bottom: w.globals.svgHeight,
        width: w.globals.svgWidth,
        height: w.globals.svgHeight,
        x: 0,
        y: 0,
      }
    },
  )
  return reads
}

/** The band the default tooltip marks active, or -1. */
function tooltipBand(chart, j, clientY) {
  const w = chart.w
  w.interact.clientY = clientY
  const html = w.config.tooltip.custom({
    ctx: chart.ctx,
    w,
    series: w.seriesData.series,
    seriesIndex: 0,
    dataPointIndex: j,
  })
  const div = document.createElement('div')
  div.innerHTML = html
  const active = div.querySelector('.apexcharts-active .series-name')
  return active ? SERIES.findIndex((s) => s.name === active.textContent) : -1
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('streamgraph band hit-test', () => {
  it('a hover measures the svg once', () => {
    const chart = streamChart()
    const w = chart.w
    const reads = measureSvg(chart)
    const sg = chart.ctx.streamgraph
    w.interact.capturedDataPointIndex = 2
    reads.n = 0
    sg._bandAt({
      clientX: w.layout.translateX + w.layout.gridWidth / 2,
      clientY: w.layout.translateY + w.layout.gridHeight / 2,
    })
    expect(reads.n).toBe(1)
    chart.destroy()
  })

  it('the tooltip and the hover dim name the same band everywhere', () => {
    const chart = streamChart()
    const w = chart.w
    measureSvg(chart)
    const sg = chart.ctx.streamgraph
    const { translateX, translateY, gridWidth, gridHeight } = w.layout
    let checked = 0
    for (let j = 0; j < 5; j++) {
      w.interact.capturedDataPointIndex = j
      for (let r = 1; r < 12; r++) {
        const clientY = translateY + (gridHeight * r) / 12
        const hover = sg._bandAt({
          clientX: translateX + gridWidth / 2,
          clientY,
        })
        expect(tooltipBand(chart, j, clientY)).toBe(hover)
        checked++
      }
    }
    expect(checked).toBe(55)
    chart.destroy()
  })

  it('the tooltip asks the streamgraph layer for the band', () => {
    const chart = streamChart()
    measureSvg(chart)
    const spy = vi.spyOn(chart.ctx.streamgraph, 'bandAt')
    tooltipBand(chart, 1, chart.w.layout.translateY + 10)
    expect(spy).toHaveBeenCalled()
    chart.destroy()
  })
})
