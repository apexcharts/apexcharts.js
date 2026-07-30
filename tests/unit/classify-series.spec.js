import Core from '../../src/modules/Core.js'

// _classifySeriesByType was extracted from plotChartType (audit C2). It buckets
// each series by resolved type, sets w.globals.columnSeries/comboCharts, and
// warns on unsupported combinations. Core's constructor only assigns fields, so
// a minimal hand-built w is enough to exercise it in isolation.
function makeCore(chartType, seriesData) {
  const w = {
    config: {
      chart: { type: chartType },
      plotOptions: { bar: { horizontal: false } },
    },
    globals: { columnSeries: null, comboCharts: false },
    seriesData: { series: seriesData },
    rangeData: { seriesRangeStart: [], seriesRangeEnd: [] },
  }
  const core = new Core(null, w, { w })
  return { core, w }
}

describe('Core._classifySeriesByType', () => {
  it('buckets a combo bar+line config by type and flags comboCharts', () => {
    const { core, w } = makeCore('line', [
      [1, 2, 3],
      [4, 5, 6],
    ])
    const { seriesTypes } = core._classifySeriesByType([
      { type: 'bar' },
      { type: 'line' },
    ])
    expect(seriesTypes.bar.series.length).toBe(1)
    expect(seriesTypes.bar.i).toEqual([0])
    expect(seriesTypes.line.series.length).toBe(1)
    expect(seriesTypes.line.i).toEqual([1])
    expect(w.globals.comboCharts).toBe(true)
    expect(w.globals.columnSeries).toBe(seriesTypes.bar)
  })

  it('does not flag comboCharts for a single-type config', () => {
    const { core, w } = makeCore('line', [
      [1, 2, 3],
      [4, 5, 6],
    ])
    const { seriesTypes } = core._classifySeriesByType([{}, {}])
    expect(seriesTypes.line.series.length).toBe(2)
    expect(seriesTypes.line.i).toEqual([0, 1])
    expect(w.globals.comboCharts).toBe(false)
  })

  it('maps a "column" series type onto the bar bucket', () => {
    const { core } = makeCore('line', [[1, 2]])
    const { seriesTypes } = core._classifySeriesByType([{ type: 'column' }])
    expect(seriesTypes.bar.series.length).toBe(1)
  })

  it('drops horizontal bars from a combo and warns', () => {
    const { core, w } = makeCore('line', [
      [1, 2],
      [3, 4],
    ])
    w.config.plotOptions.bar.horizontal = true
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { seriesTypes } = core._classifySeriesByType([
      { type: 'bar' },
      { type: 'line' },
    ])
    expect(seriesTypes.bar.series.length).toBe(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
