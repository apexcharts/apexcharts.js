import {createChart, createChartWithOptions} from './utils/utils.js'
import Exports from './../../src/modules/Exports'


describe('Export Csv', () => {
  it('export csv from simple line chart with one series should call triggerDownload with csv econded file data', () => {
    const series = [{data: [0,1]}]
    const csvData = "category,series-0\n1,0\n2,1"
    const chart = createChart('line', series)
    const exports = new Exports(chart.ctx)
    jest.spyOn(Exports.prototype,'triggerDownload')
    exports.exportToCSV(chart.w.config.series,'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple bar chart with two series should call triggerDownload with csv econded file data', () => {
    var options = {
      chart: {
        height: 380,
        width: "100%",
        type: "bar"
      },
      series: [
        {
          name: "Series 1",
          data: [1,2]
        },
        {
          name: "Series 2",
          data: [2,3]
        }
      ],
      xaxis: {
        categories: ['Apples','Bananas']
      }
    };
    const csvData = "category,Series 1,Series 2\n" +
      "Apples,,2\n" +
      "Bananas,,3"
    const chart = createChartWithOptions(options)
    chart.w.globals.collapsedSeriesIndices = [0]
    const exports = new Exports(chart.ctx)
    jest.spyOn(Exports.prototype,'triggerDownload')
    exports.exportToCSV(chart.w.config.series,'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with two series should call triggerDownload with csv econded file data', () => {
    const series = [{name: 'series 1', data: [0,1]},{name: 'series 2', data: [1,2]}]
    const csvData = "category,series 1,series 2\n" +
      "1,0,1\n" +
      "2,1,2"
    const chart = createChart('line', series)
    const exports = new Exports(chart.ctx)
    jest.spyOn(Exports.prototype,'triggerDownload')
    exports.exportToCSV(chart.w.config.series,'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it("export csv from simple line chart with two x y series should call triggerDownload with csv econded file data", () => {
    const series =  [{
      name: 'series 1',
      data: [{
        x: 0,
        y: 0
      }, {
        x: 1,
        y: 1
      }]
    },
      {
        name: 'series 2',
        data: [{
          x: 1,
          y: 1
        }, {
          x: 2,
          y: 2
        }]
      }
    ]
    const csvData = "category,series 1,series 2\n" +
      "0,0,1\n" +
      "1,1,2"
    const chart = createChart('line', series)
    const exports = new Exports(chart.ctx)
    jest.spyOn(Exports.prototype,'triggerDownload')
    exports.exportToCSV(chart.w.config.series,'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with first series collapsed should call triggerDownload with csv econded file data', () => {
   const series = [{name: 'series 1', data: [0,1]},{name: 'series 2', data: [1,2]}]
    const csvData = "category,series 1,series 2\n" +
      "1,,1\n" +
      "2,,2"

    var options = {
      chart: {
        type: "line"
      },
      series
    };
    const chart = createChartWithOptions(options)
    const exports = new Exports(chart.ctx)
    chart.w.globals.collapsedSeriesIndices = [0]
    jest.spyOn(Exports.prototype,'triggerDownload')
    exports.exportToCSV(chart.w.config.series,'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it("export csv from simple spline area chart with two series should call triggerDownload with csv econded file data", () => {
    var options = {
      series: [{
        name: 'series1',
        data: [31, 40]
      }, {
        name: 'series2',
        data: [11, 32]
      }],
      chart: {
        height: 350,
        type: 'area'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        type: 'datetime',
        categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z"]
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        },
      },
    };
    const csvData = "category,series1,series2\n" +
      "Wed Sep 19 2018,31,11\n" +
      "Wed Sep 19 2018,40,32"
    const chart = createChartWithOptions(options)
    const exports = new Exports(chart.ctx)
    jest.spyOn(Exports.prototype,'triggerDownload')
    exports.exportToCSV(chart.w.config.series,'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it("export csv from simple spline area chart with first of two series collapsed should call triggerDownload with csv econded file data", () => {
    var options = {
      series: [{
        name: 'series1',
        data: [31, 40]
      }, {
        name: 'series2',
        data: [11, 32]
      }],
      chart: {
        height: 350,
        type: 'area'
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        type: 'datetime',
        categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z"]
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm'
        },
      },
    };
    const csvData = "category,series1,series2\n" +
      "Wed Sep 19 2018,,11\n" +
      "Wed Sep 19 2018,,32"
    const chart = createChartWithOptions(options)
    chart.w.globals.collapsedSeriesIndices = [0]
    const exports = new Exports(chart.ctx)
    jest.spyOn(Exports.prototype,'triggerDownload')
    exports.exportToCSV(chart.w.config.series,'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })

})
