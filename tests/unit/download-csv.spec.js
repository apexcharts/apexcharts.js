import { createChart, createChartWithOptions } from './utils/utils.js'
import Exports from './../../src/modules/Exports'
import '../../src/features/streamgraph'
import '../../src/features/waterfall'
import '../../src/features/dumbbell'

describe('Export Csv', () => {
  it('export csv from simple pie chart should call triggerDownload with csv encoded file data', () => {
    const series = [0, 1]
    const csvData = 'category,value\n1,0\n2,1'
    const chart = createChart('pie', series)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with one series should call triggerDownload with csv encoded file data', () => {
    const series = [{ data: [0, 1] }]
    const csvData = 'category,series-0\n1,0\n2,1'
    const chart = createChart('line', series)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple bar chart with two series should call triggerDownload with csv encoded file data', () => {
    var options = {
      chart: {
        height: 380,
        width: '100%',
        type: 'bar',
      },
      series: [
        {
          name: 'Series 1',
          data: [1, 2],
        },
        {
          name: 'Series 2',
          data: [2, 3],
        },
      ],
      xaxis: {
        categories: ['Apples', 'Bananas'],
      },
    }
    const csvData =
      'category,Series 1,Series 2\n' + 'Apples,,2\n' + 'Bananas,,3'
    const chart = createChartWithOptions(options)
    chart.w.globals.collapsedSeriesIndices = [0]
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })

  it('export csv from simple bar chart with two series with formatted category and formatted values should call triggerDownload with csv encoded file data', () => {
    var options = {
      chart: {
        type: 'bar',
        toolbar: {
          export: {
            csv: {
              categoryFormatter: (cat) => `*${cat}*`,
              valueFormatter: (val) => `@${val}@`,
            },
          },
        },
      },
      series: [
        {
          name: 'Series 1',
          data: [1, 2],
        },
        {
          name: 'Series 2',
          data: [2, 3],
        },
      ],
      xaxis: {
        categories: ['Apples', 'Bananas'],
      },
    }
    const csvData =
      'category,Series 1,Series 2\n' +
      '*Apples*,@undefined@,@2@\n' +
      '*Bananas*,@undefined@,@3@'
    const chart = createChartWithOptions(options)
    chart.w.globals.collapsedSeriesIndices = [0]
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })

  it('export csv from simple bar chart with numeric series names should call triggerDownload with csv encoded file data', () => {
    var options = {
      chart: {
        height: 380,
        width: '100%',
        type: 'bar',
      },
      series: [
        {
          name: 2022,
          data: [1, 2],
        },
        {
          name: 2023,
          data: [2, 3],
        },
      ],
      xaxis: {
        categories: ['Category 1', 'Category 2'],
      },
    }
    const csvData = 'category,2022,2023\n' + 'Category 1,,2\n' + 'Category 2,,3'
    const chart = createChartWithOptions(options)
    chart.w.globals.collapsedSeriesIndices = [0]
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with two series should call triggerDownload with csv encoded file data', () => {
    const series = [
      { name: 'series 1', data: [0, 1] },
      { name: 'series 2', data: [1, 2] },
    ]
    const csvData = 'category,series 1,series 2\n' + '1,0,1\n' + '2,1,2'
    const chart = createChart('line', series)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with numeric series names should call triggerDownload with csv encoded file data', () => {
    const series = [
      { name: 2022, data: [0, 1] },
      { name: 2023, data: [1, 2] },
    ]
    const csvData = 'category,2022,2023\n' + '1,0,1\n' + '2,1,2'
    const chart = createChart('line', series)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with two distinct x y series should call triggerDownload with csv encoded file data', () => {
    const series = [
      {
        name: 'series 1',
        data: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      {
        name: 'series 2',
        data: [
          {
            x: 1,
            y: 1,
          },
          {
            x: 2,
            y: 2,
          },
        ],
      },
    ]
    const csvData =
      'category,series 1,series 2\n' + '0,0,\n' + '1,1,1\n' + '2,,2'

    const chart = createChart('line', series)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with two distinct x y series and a custom column delimiter should call triggerDownload with csv encoded file data', () => {
    const series = [
      {
        name: 'series 1',
        data: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      {
        name: 'series 2',
        data: [
          {
            x: 1,
            y: 1,
          },
          {
            x: 2,
            y: 2,
          },
        ],
      },
    ]
    const csvData =
      'category;series 1;series 2\n' + '0;0;\n' + '1;1;1\n' + '2;;2'

    const chart = createChart('line', series)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV({
      series: chart.w.config.series,
      fileName: 'fileName',
      columnDelimiter: ';',
    })
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      'fileName',
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with first series collapsed should call triggerDownload with csv encoded file data', () => {
    const series = [
      { name: 'series 1', data: [0, 1] },
      { name: 'series 2', data: [1, 2] },
    ]
    const csvData = 'category,series 1,series 2\n' + '1,,1\n' + '2,,2'

    var options = {
      chart: {
        type: 'line',
      },
      series,
    }
    const chart = createChartWithOptions(options)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    chart.w.globals.collapsedSeriesIndices = [0]
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with two unequal datetime series should call triggerDownload with csv encoded file data', () => {
    var options = {
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'series1',
          data: [['2000-01-01T00:00:00.000Z', 1]],
        },
        {
          name: 'series2',
          data: [['2000-01-02T00:00:00.000Z', 1]],
        },
      ],
      xaxis: {
        type: 'datetime',
      },
    }
    const csvData =
      'category,series1,series2\n' +
      'Sat Jan 01 2000,1,\n' +
      'Sun Jan 02 2000,,1'
    const chart = createChartWithOptions(options)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple line chart with two unequal datetime x y series should call triggerDownload with csv encoded file data', () => {
    var options = {
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'series1',
          data: [
            {
              x: '2000-01-01T00:00:00.000Z',
              y: 1,
            },
          ],
        },
        {
          name: 'series2',
          data: [
            {
              x: '2000-01-02T00:00:00.000Z',
              y: 1,
            },
          ],
        },
      ],
      xaxis: {
        type: 'datetime',
      },
    }
    const csvData =
      'category,series1,series2\n' +
      'Sat Jan 01 2000,1,\n' +
      'Sun Jan 02 2000,,1'
    const chart = createChartWithOptions(options)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple spline area chart with two series should call triggerDownload with csv encoded file data', () => {
    var options = {
      series: [
        {
          name: 'series1',
          data: [31, 40],
        },
        {
          name: 'series2',
          data: [11, 32],
        },
      ],
      chart: {
        height: 350,
        type: 'area',
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
      },
      xaxis: {
        type: 'datetime',
        categories: ['2018-09-19T00:00:00.000Z', '2018-09-19T01:30:00.000Z'],
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm',
        },
      },
    }
    const csvData =
      'category,series1,series2\n' +
      '2018-09-19 00:00:00,31,11\n' +
      '2018-09-19 01:30:00,40,32'
    const chart = createChartWithOptions(options)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })
  it('export csv from simple spline area chart with first of two series collapsed should call triggerDownload with csv encoded file data', () => {
    var options = {
      series: [
        {
          name: 'series1',
          data: [31, 40],
        },
        {
          name: 'series2',
          data: [11, 32],
        },
      ],
      chart: {
        height: 350,
        type: 'area',
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
      },
      xaxis: {
        type: 'datetime',
        categories: ['2018-09-19T00:00:00.000Z', '2018-09-19T01:30:00.000Z'],
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy HH:mm',
        },
      },
    }
    const csvData =
      'category,series1,series2\n' +
      '2018-09-19 00:00:00,,11\n' +
      '2018-09-19 01:30:00,,32'
    const chart = createChartWithOptions(options)
    chart.w.globals.collapsedSeriesIndices = [0]
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })

  it('export csv from unequal series with a category named toString', () => {
    var options = {
      chart: {
        type: 'line',
      },
      xaxis: {
        type: 'datetime',
      },
      series: [
        { name: 'series1', data: [{ x: 'toString', y: 1 }] },
        { name: 'series2', data: [{ x: '2000-01-02T00:00:00.000Z', y: 2 }] },
      ],
    }
    const csvData =
      'category,series1,series2\n' + 'Sun Jan 02 2000,,2\n' + 'toString,1,'
    const chart = createChartWithOptions(options)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(csvData)),
      expect.toBeUndefined,
      expect.stringContaining('.csv')
    )
  })

  it('export csv from unequal series leaves Object.prototype alone when a category is named __proto__', () => {
    var options = {
      chart: {
        type: 'line',
      },
      xaxis: {
        type: 'datetime',
      },
      series: [
        { name: 'series1', data: [{ x: '__proto__', y: 1 }] },
        { name: 'series2', data: [{ x: '2000-01-02T00:00:00.000Z', y: 2 }] },
      ],
    }
    const chart = createChartWithOptions(options)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    vi.spyOn(Exports.prototype, 'triggerDownload')
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(Exports.prototype.triggerDownload).toHaveBeenCalledTimes(1)
    expect(Object.getOwnPropertyNames(Object.prototype)).not.toContain('0')
  })

  it('export csv from unequal series gives one row to Date categories sharing an instant', () => {
    var options = {
      chart: {
        type: 'line',
      },
      xaxis: {
        type: 'datetime',
      },
      series: [
        {
          name: 'series1',
          data: [
            { x: new Date('2000-01-01T00:00:00.000Z'), y: 1 },
            { x: new Date('2000-01-02T00:00:00.000Z'), y: 2 },
          ],
        },
        {
          name: 'series2',
          data: [
            { x: new Date('2000-01-02T00:00:00.000Z'), y: 3 },
            { x: new Date('2000-01-03T00:00:00.000Z'), y: 4 },
          ],
        },
      ],
    }
    const chart = createChartWithOptions(options)
    const exports = new Exports(chart.ctx.w, chart.ctx)
    let csv = ''
    vi.spyOn(Exports.prototype, 'triggerDownload').mockImplementation((data) => {
      csv = decodeURIComponent(data)
    })
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(csv.match(/Sun Jan 02 2000/g)).toHaveLength(1)
    expect(csv).toContain('Sun Jan 02 2000,2,3')
    expect(csv).toContain(
      'Sat Jan 01 2000,1,\nSun Jan 02 2000,2,3\nMon Jan 03 2000,,4',
    )
  })

  it('export csv from unequal series orders numeric categories by value', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter' },
      series: [
        { name: 'series1', data: [[2, 1], [10, 2]] },
        { name: 'series2', data: [[9, 3]] },
      ],
    })
    const exports = new Exports(chart.ctx.w, chart.ctx)
    let csv = ''
    vi.spyOn(Exports.prototype, 'triggerDownload').mockImplementation((data) => {
      csv = decodeURIComponent(data)
    })
    exports.exportToCSV(chart.w.config.series, 'fileName')
    expect(csv).toContain('category,series1,series2\n2,1,\n9,,3\n10,2,')
  })
})

// Builds the CSV text a chart exports, without the BOM.
function csvOf(options, opts = {}, before) {
  const chart = createChartWithOptions(options)
  if (before) before(chart)
  const exports = new Exports(chart.ctx.w, chart.ctx)
  let csv = ''
  exports.triggerDownload = (href) => {
    csv = decodeURIComponent(href.replace(/^data:text\/csv;\s*charset=utf-8,/, ''))
      .replace('﻿', '')
  }
  exports.exportToCSV(opts)
  return csv
}

describe('Export Csv: one row per category for every series shape', () => {
  it('writes each candlestick series once, with its own named columns', () => {
    const csv = csvOf({
      chart: { type: 'candlestick' },
      series: [
        { name: 'c1', data: [{ x: 1000, y: [1, 5, 0, 3] }, { x: 2000, y: [2, 6, 1, 4] }] },
        { name: 'c2', data: [{ x: 1000, y: [11, 15, 10, 13] }, { x: 2000, y: [12, 16, 11, 14] }] },
      ],
    })
    expect(csv).toBe(
      'category,c1 open,c1 high,c1 low,c1 close,c2 open,c2 high,c2 low,c2 close\n' +
        '1000,1,5,0,3,11,15,10,13\n' +
        '2000,2,6,1,4,12,16,11,14',
    )
  })

  it('keeps the line values of a candlestick and line combo', () => {
    const csv = csvOf({
      chart: { type: 'line' },
      series: [
        { name: 'candle', type: 'candlestick', data: [{ x: 1000, y: [1, 5, 0, 3] }, { x: 2000, y: [2, 6, 1, 4] }] },
        { name: 'line', type: 'line', data: [{ x: 1000, y: 2 }, { x: 2000, y: 3 }] },
      ],
    })
    expect(csv).toBe(
      'category,candle open,candle high,candle low,candle close,line\n' +
        '1000,1,5,0,3,2\n' +
        '2000,2,6,1,4,3',
    )
  })

  it('writes both rangeBar series on the category row', () => {
    const csv = csvOf({
      chart: { type: 'rangeBar' },
      plotOptions: { bar: { horizontal: true } },
      series: [
        { name: 'A', data: [{ x: 'Design', y: [1, 5] }, { x: 'Code', y: [3, 7] }] },
        { name: 'B', data: [{ x: 'Design', y: [2, 6] }, { x: 'Code', y: [4, 8] }] },
      ],
    })
    expect(csv).toBe(
      'category,A minimum,A maximum,B minimum,B maximum\n' +
        'Design,1,5,2,6\n' +
        'Code,3,7,4,8',
    )
  })

  it('splits rangeArea values into numeric low and high cells', () => {
    const csv = csvOf({
      chart: { type: 'rangeArea' },
      series: [
        { name: 'A', data: [{ x: 'Jan', y: [-1, 5] }, { x: 'Feb', y: [2, 6] }] },
        { name: 'B', data: [{ x: 'Jan', y: [3, 7] }, { x: 'Feb', y: [4, 8] }] },
      ],
    })
    expect(csv).toBe(
      'category,A minimum,A maximum,B minimum,B maximum\n' +
        'Jan,-1,5,3,7\n' +
        'Feb,2,6,4,8',
    )
  })

  it('exports the values a streamgraph was given, not its baseline offsets', () => {
    const csv = csvOf({
      chart: { type: 'streamgraph' },
      series: [
        { name: 'A', data: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
        { name: 'B', data: [{ x: 1, y: 5 }, { x: 2, y: 6 }] },
      ],
    })
    expect(csv).toBe('category,A,B\n1,10,5\n2,20,6')
  })

  it('exports the steps a waterfall was given', () => {
    const csv = csvOf({
      chart: { type: 'waterfall' },
      series: [
        { name: 'W', data: [{ x: 'Start', y: 100 }, { x: 'Q1', y: 20 }, { x: 'Q2', y: -30 }] },
      ],
    })
    expect(csv).toBe('category,W\nStart,100\nQ1,20\nQ2,-30')
  })

  it('exports one column per dumbbell endpoint series', () => {
    const csv = csvOf({
      chart: { type: 'dumbbell' },
      series: [
        { name: '2019', data: [{ x: 'a', y: 10 }, { x: 'b', y: 20 }] },
        { name: '2023', data: [{ x: 'a', y: 15 }, { x: 'b', y: 25 }] },
      ],
    })
    expect(csv).toBe('category,2019,2023\na,10,15\nb,20,25')
  })

  it('blanks a legend-hidden streamgraph series', () => {
    const csv = csvOf(
      {
        chart: { type: 'streamgraph' },
        series: [
          { name: 'A', data: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
          { name: 'B', data: [{ x: 1, y: 5 }, { x: 2, y: 6 }] },
        ],
      },
      {},
      (chart) => chart.toggleSeries('A'),
    )
    expect(csv).toBe('category,A,B\n1,,5\n2,,6')
  })
})

describe('Export Csv: series source, hidden series and gaps', () => {
  const twoSeries = () => ({
    chart: { type: 'line' },
    xaxis: { categories: ['a', 'b'] },
    series: [
      { name: 'A', data: [1, 2] },
      { name: 'B', data: [3, 4] },
    ],
  })

  it('reads the values from a caller-supplied series for array data', () => {
    const csv = csvOf(twoSeries(), { series: [{ name: 'X', data: [9, 8] }] })
    expect(csv).toBe('category,X\na,9\nb,8')
  })

  it('blanks a hidden series the same way for array and {x, y} data', () => {
    const xy = {
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [{ x: 'a', y: 1 }, { x: 'b', y: 2 }] },
        { name: 'B', data: [{ x: 'a', y: 3 }, { x: 'b', y: 4 }] },
      ],
    }
    const hide = (chart) => {
      chart.w.globals.collapsedSeriesIndices = [0]
    }
    expect(csvOf(twoSeries(), {}, hide)).toBe('category,A,B\na,,3\nb,,4')
    expect(csvOf(xy, {}, hide)).toBe('category,A,B\na,,3\nb,,4')
  })

  it('leaves a negative number given as text unquoted', () => {
    const csv = csvOf({
      chart: { type: 'line' },
      xaxis: { categories: ['a', 'b'] },
      series: [{ name: 'A', data: ['-5', '=1+1'] }],
    })
    expect(csv).toBe("category,A\na,-5\nb,'=1+1")
  })

  it('does not throw when a datetime axis has fewer categories than points', () => {
    const csv = csvOf({
      chart: { type: 'line' },
      xaxis: { type: 'datetime', categories: ['2026-01-01', '2026-01-02'] },
      series: [{ name: 'A', data: [1, 2, 3, 4] }],
    })
    const rows = csv.split('\n')
    expect(rows).toHaveLength(5)
    expect(rows.slice(3)).toEqual([',3', ',4'])
  })

  it('skips a null gap in {x, y} data', () => {
    const csv = csvOf({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [{ x: 'a', y: 1 }, null, { x: 'c', y: 3 }] }],
    })
    expect(csv).toContain('a,1')
    expect(csv).toContain('c,3')
  })

  it('skips a null gap in {x, y} data on the unequal-x path', () => {
    const csv = csvOf({
      chart: { type: 'line' },
      xaxis: { type: 'numeric' },
      series: [
        { name: 'A', data: [{ x: 1, y: 1 }, null, { x: 3, y: 3 }] },
        { name: 'B', data: [{ x: 2, y: 2 }] },
      ],
    })
    expect(csv).toBe('category,A,B\n1,1,\n2,,2\n3,3,')
  })
})

describe('Export Csv: datetime categories', () => {
  it('keeps the time of day when two points share a day', () => {
    const t0 = Date.UTC(2026, 9, 10, 9)
    const csv = csvOf({
      chart: { type: 'line' },
      xaxis: { type: 'datetime' },
      series: [
        { name: 'A', data: [0, 1, 2, 3].map((h) => ({ x: t0 + h * 3600000, y: h })) },
      ],
    })
    expect(csv).toBe(
      'category,A\n' +
        '2026-10-10 09:00:00,0\n' +
        '2026-10-10 10:00:00,1\n' +
        '2026-10-10 11:00:00,2\n' +
        '2026-10-10 12:00:00,3',
    )
  })

  it('prints the day in UTC when xaxis.labels.datetimeUTC is on', () => {
    // 23:30 UTC is the next day east of UTC; the axis shows the UTC day.
    const csv = csvOf({
      chart: { type: 'line' },
      xaxis: { type: 'datetime' },
      series: [
        {
          name: 'A',
          data: [
            { x: Date.UTC(2026, 0, 1, 23, 30), y: 1 },
            { x: Date.UTC(2026, 0, 2, 23, 30), y: 2 },
          ],
        },
      ],
    })
    expect(csv).toBe('category,A\nThu Jan 01 2026,1\nFri Jan 02 2026,2')
  })

  it('prints the local day and time when xaxis.labels.datetimeUTC is off', () => {
    const csv = csvOf({
      chart: { type: 'line' },
      xaxis: { type: 'datetime', labels: { datetimeUTC: false } },
      series: [
        {
          name: 'A',
          data: [
            { x: new Date(2026, 0, 1).getTime(), y: 1 },
            { x: new Date(2026, 0, 2).getTime(), y: 2 },
            { x: new Date(2026, 0, 2, 6, 15).getTime(), y: 3 },
          ],
        },
      ],
    })
    expect(csv).toBe(
      'category,A\n' +
        '2026-01-01 00:00:00,1\n' +
        '2026-01-02 00:00:00,2\n' +
        '2026-01-02 06:15:00,3',
    )
  })
})
