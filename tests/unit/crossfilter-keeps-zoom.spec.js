import { describe, test, expect } from 'vitest'
import ApexCharts from '../../src/apexcharts.js'
import { createChartsWithOptions } from './utils/utils.js'
import '../../src/features/link.js'

// #5389, crossfilter side: a filter-mode chart's series are the engine's
// aggregation over a fixed bucket set, never page data. A pick in another
// chart re-aggregates it, and that re-feed went through the public
// updateSeries(), which threw the user's zoom on this chart away.

const settle = () => new Promise((r) => setTimeout(r, 0))

describe('a crossfilter re-aggregation keeps a zoomed window (#5389)', () => {
  test('the zoomed histogram keeps its window, flag and reset control', async () => {
    const records = Array.from({ length: 100 }, (_, i) => ({
      cat: ['a', 'b', 'c'][i % 3],
      v: i,
    }))
    ApexCharts.crossfilter({ id: 'keeps-zoom', records })
    const [source, hist] = createChartsWithOptions(
      {
        chart: {
          type: 'bar',
          width: 400,
          height: 300,
          animations: { enabled: false },
          link: { id: 'keeps-zoom', dimension: (r) => r.cat },
        },
        series: [],
      },
      {
        chart: {
          type: 'bar',
          width: 600,
          height: 300,
          animations: { enabled: false },
          zoom: { enabled: true },
          toolbar: { show: false },
          link: {
            id: 'keeps-zoom',
            dimension: (r) => r.v,
            type: 'range',
            bins: { width: 10 },
          },
        },
        series: [],
        xaxis: { type: 'numeric' },
      },
    )
    await settle()
    hist.zoomX(20, 60)
    await settle()
    const before = {
      min: hist.w.globals.minX,
      max: hist.w.globals.maxX,
      zoomed: hist.w.interact.zoomed,
      reset: hist.el.querySelectorAll('.apexcharts-reset-icon').length,
    }
    expect(before).toEqual({ min: 20, max: 60, zoomed: true, reset: 1 })
    const valuesBefore = JSON.stringify(hist.w.config.series)

    const cf = ApexCharts.crossfilter({ id: 'keeps-zoom', records })
    cf.toggleKey(source.w.globals.chartID, 'a')
    await settle()
    await settle()

    // it did re-aggregate, and the window survived it
    expect(JSON.stringify(hist.w.config.series)).not.toBe(valuesBefore)
    expect({
      min: hist.w.globals.minX,
      max: hist.w.globals.maxX,
      zoomed: hist.w.interact.zoomed,
      reset: hist.el.querySelectorAll('.apexcharts-reset-icon').length,
    }).toEqual(before)
    source.destroy()
    hist.destroy()
  })
})
