/**
 * Line.draw appends one rect per series to the
 * forecast / non-forecast clip paths on every draw. The clip paths are only
 * created in create(), and the fast update path redraws the series into the
 * preserved defs, so the rects pile up and the mask becomes the union of
 * every cutoff ever drawn.
 */
import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

describe('forecast clip masks across fast updates', () => {
  it('holds one rect per series per mask, at the current cutoff', async () => {
    document.body.innerHTML = '<div id="c"></div>'
    const mk = (shift) => [
      {
        name: 'A',
        data: Array.from({ length: 8 }, (_, i) => [i + shift, 10 + i]),
      },
    ]
    const chart = new ApexCharts(document.querySelector('#c'), {
      chart: {
        type: 'line',
        width: 600,
        height: 300,
        animations: { enabled: false },
      },
      series: mk(0),
      xaxis: { type: 'numeric', min: 0, max: 20 },
      forecastDataPoints: { count: 3 },
    })
    await chart.render()
    const cuid = chart.w.globals.cuid
    const forecast = () => chart.el.querySelector(`#forecastMask${cuid}`)
    const nonForecast = () => chart.el.querySelector(`#nonForecastMask${cuid}`)
    expect(forecast().children.length).toBe(1)

    for (let s = 1; s <= 5; s++) {
      await chart.updateSeries(mk(s * 2))
    }
    const stats = chart._updateStats
    // the updates took the fast path (masks preserved in place)
    expect(stats.fast + stats.fastWithAxes).toBeGreaterThan(0)

    expect(forecast().children.length).toBe(1)
    expect(nonForecast().children.length).toBe(1)
    // and the one rect sits at the current cutoff
    const xs = chart.w.globals.seriesXvalues[0]
    const cutoff = xs[xs.length - 3 - 1]
    expect(Number(forecast().children[0].getAttribute('x'))).toBeCloseTo(
      cutoff,
      3,
    )
    chart.destroy()
  })
})
