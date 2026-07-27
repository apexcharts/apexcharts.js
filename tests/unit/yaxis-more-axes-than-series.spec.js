import { createChartWithOptions } from './utils/utils.js'

// Regression for getCalculatedRatios(): the crash reproduces only through the
// realtime UPDATE sequence, not a static first render.
//
// Calling updateSeries() with fewer series than the configured y-axes, while
// leaving the yaxis config untouched, re-runs getCalculatedRatios with the
// multi-axis config against fewer series -- the shape a data refresh takes when
// the series count shrinks but the axis config stays the same.
//
// seriesYAxisReverseMap has one entry per series, but each yaxis `min` extends
// globals.minYArr to the axis count, so the multi-axis baseline loop indexes
// reverseMap past its length -> undefined -> config.yaxis[undefined] ->
// reading `.logarithmic` throws. The `if (!yAxis) return 0` guard fixes it.
describe('getCalculatedRatios — realtime transition to fewer series than axes', () => {
  const twoAxesWithMin = [
    { seriesName: 'Collection Rate', logarithmic: false, min: 0 },
    {
      opposite: true,
      seriesName: ['Collected', 'Not Collected'],
      logarithmic: false,
      min: 0,
    },
  ]

  const fullSeries = [
    { name: 'Collection Rate', type: 'area', data: [0, 0.1, 0] },
    { name: 'Collected', type: 'column', data: [260, 262, 256] },
    { name: 'Not Collected', type: 'column', data: [406691, 406689, 406695] },
  ]

  it('does not throw when updateSeries drops the series count below the axis count', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: fullSeries,
      yaxis: twoAxesWithMin,
    })

    // Only the series changes here; the yaxis config stays at 2 axes. This is
    // the series-only update path where the crash surfaces.
    await expect(
      chart.updateSeries([
        { name: 'Collection Rate', type: 'area', data: [0, 0.1, 0] },
      ])
    ).resolves.toBeDefined()
  })

  it('maps every series to its axis when all mapped series are present', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: fullSeries,
      yaxis: twoAxesWithMin,
    })

    const reverseMap = chart.w.globals.seriesYAxisReverseMap
    // Collection Rate -> axis 0; the two counts -> axis 1
    expect(reverseMap[0]).toBe(0)
    expect(reverseMap[1]).toBe(1)
    expect(reverseMap[2]).toBe(1)
  })
})
