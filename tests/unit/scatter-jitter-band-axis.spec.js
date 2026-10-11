import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The jitter band axis fills xaxis.min/max/tickAmount only where the caller
// left them unset. A value set later through updateOptions is the caller's
// too, and must not be overwritten by the band frame on the next parse.

const bands = ['A', 'B', 'C', 'D', 'E', 'F']
const options = () => ({
  chart: { type: 'scatter', width: 600, height: 300 },
  plotOptions: { scatter: { jitter: { enabled: true } } },
  series: [{ data: bands.map((x, i) => ({ x, y: [i, i + 1, i + 2] })) }],
})

describe('scatter jitter band axis ownership', () => {
  it('frames the bands when nothing is set', () => {
    const chart = createChartWithOptions(options())
    expect(chart.w.globals.minX).toBe(-1)
    expect(chart.w.globals.maxX).toBe(6)
  })

  it('keeps a window set later through updateOptions', async () => {
    const chart = createChartWithOptions(options())
    await chart.updateOptions({ xaxis: { min: 1, max: 4, tickAmount: 3 } })
    expect(chart.w.globals.minX).toBe(1)
    expect(chart.w.globals.maxX).toBe(4)
    expect(chart.w.config.xaxis.tickAmount).toBe(3)
    // and keeps it across a later unrelated re-render
    await chart.updateOptions({ title: { text: 't' } })
    expect(chart.w.globals.minX).toBe(1)
    expect(chart.w.globals.maxX).toBe(4)
  })

  it('still refreshes its own frame when the band count changes', async () => {
    const chart = createChartWithOptions(options())
    await chart.updateSeries([
      { data: ['A', 'B', 'C'].map((x, i) => ({ x, y: [i, i + 1] })) },
    ])
    expect(chart.w.globals.minX).toBe(-1)
    expect(chart.w.globals.maxX).toBe(3)
  })
})
