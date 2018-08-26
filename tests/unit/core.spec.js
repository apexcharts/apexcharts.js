import ApexCharts from '../../dist/apexcharts.min.js'
import Core from '../../src/modules/Core.js'
import seriesxy from './data/seriesxy.js'

describe("Parse Data", () => {

  function createChart(type, series) {
    document.body.innerHTML = '<div id="chart" />';
    
    const chart = new ApexCharts(document.querySelector("#chart"), {
      chart: {
        type
      },
      series
    })

    return chart
  }


  it("should parse data for cartesian charts", () => {
    const chart = createChart('line', seriesxy)
    const core = new Core(document.querySelector("#chart"), chart)
    const w = core.parseDataAxisCharts(seriesxy, seriesxy, chart)

    expect(w.globals.series).toEqual([[300, 230, 210]])
    expect(w.globals.seriesX).toEqual([[1262284200000, 1262370600000, 1262457000000]])
    expect(w.globals.labels).toEqual([[1262284200000, 1262370600000, 1262457000000]])
  })

  it("should parse data for non-cartesian charts", () => {
    const series = [30, 23, 12, 43];
    const chart = createChart('donut', series)

    const core = new Core(document.querySelector("#chart"), chart)
    const w = core.parseDataNonAxisCharts(series)

    expect(w.globals.series).toEqual([30, 23, 12, 43])
    expect(w.globals.seriesNames).toEqual(['series-1', 'series-2', 'series-3', 'series-4'])
  })
});