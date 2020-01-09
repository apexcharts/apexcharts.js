import Utils from '../../utils/Utils'
import DateTime from '../../utils/DateTime'

/**
 * ApexCharts Default Class for setting default options for all chart types.
 *
 * @module Defaults
 **/

export default class Defaults {
  constructor(opts) {
    this.opts = opts
  }

  line() {
    return {
      chart: {
        animations: {
          easing: 'swing'
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 5,
        curve: 'straight'
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        crosshairs: {
          width: 1
        }
      }
    }
  }

  sparkline(defaults) {
    this.opts.yaxis[0].show = false
    this.opts.yaxis[0].title.text = ''
    this.opts.yaxis[0].axisBorder.show = false
    this.opts.yaxis[0].axisTicks.show = false
    this.opts.yaxis[0].floating = true

    const ret = {
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      legend: {
        show: false
      },
      xaxis: {
        labels: {
          show: false
        },
        tooltip: {
          enabled: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      chart: {
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      }
    }

    return Utils.extend(defaults, ret)
  }

  bar() {
    return {
      chart: {
        stacked: false,
        animations: {
          easing: 'swing'
        },
        zoom: {
          enabled: false
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: 'center'
          }
        }
      },
      dataLabels: {
        style: {
          colors: ['#fff']
        }
      },
      stroke: {
        width: 0
      },
      fill: {
        opacity: 0.85
      },
      legend: {
        markers: {
          shape: 'square',
          radius: 2,
          size: 8
        }
      },
      tooltip: {
        shared: false
      },
      xaxis: {
        tooltip: {
          enabled: false
        },
        tickPlacement: 'between',
        crosshairs: {
          width: 'barWidth',
          position: 'back',
          fill: {
            type: 'gradient'
          },
          dropShadow: {
            enabled: false
          },
          stroke: {
            width: 0
          }
        }
      }
    }
  }

  candlestick() {
    return {
      stroke: {
        width: 1,
        colors: ['#333']
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        shared: true,
        custom({ seriesIndex, dataPointIndex, w }) {
          const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex]
          const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex]
          const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex]
          const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex]
          return (
            '<div class="apexcharts-tooltip-candlestick">' +
            '<div>Open: <span class="value">' +
            o +
            '</span></div>' +
            '<div>High: <span class="value">' +
            h +
            '</span></div>' +
            '<div>Low: <span class="value">' +
            l +
            '</span></div>' +
            '<div>Close: <span class="value">' +
            c +
            '</span></div>' +
            '</div>'
          )
        }
      },
      states: {
        active: {
          filter: {
            type: 'none'
          }
        }
      },
      xaxis: {
        crosshairs: {
          width: 1
        }
      }
    }
  }

  rangeBar() {
    return {
      chart: {
        zoom: {
          enabled: false
        }
      },
      stroke: {
        width: 0
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: 'center'
          }
        }
      },
      dataLabels: {
        enabled: false,
        formatter(val, { ctx, seriesIndex, dataPointIndex, w }) {
          const start = w.globals.seriesRangeStart[seriesIndex][dataPointIndex]
          const end = w.globals.seriesRangeEnd[seriesIndex][dataPointIndex]
          return end - start
        },
        style: {
          colors: ['#fff']
        }
      },
      tooltip: {
        shared: false,
        followCursor: true,
        custom({ ctx, seriesIndex, dataPointIndex, y1, y2, w }) {
          let start = w.globals.seriesRangeStart[seriesIndex][dataPointIndex]
          let end = w.globals.seriesRangeEnd[seriesIndex][dataPointIndex]
          let ylabel = w.globals.labels[dataPointIndex]

          if (y1 && y2) {
            start = y1
            end = y2

            if (w.config.series[seriesIndex].data[dataPointIndex].x) {
              ylabel = w.config.series[seriesIndex].data[dataPointIndex].x
            }
          }

          let startVal = ''
          let endVal = ''

          const color = w.globals.colors[seriesIndex]
          if (w.config.tooltip.x.formatter === undefined) {
            if (w.config.xaxis.type === 'datetime') {
              let datetimeObj = new DateTime(ctx)
              startVal = datetimeObj.formatDate(
                datetimeObj.getDate(start),
                w.config.tooltip.x.format
              )
              endVal = datetimeObj.formatDate(
                datetimeObj.getDate(end),
                w.config.tooltip.x.format
              )
            } else {
              startVal = start
              endVal = end
            }
          } else {
            startVal = w.config.tooltip.x.formatter(start)
            endVal = w.config.tooltip.x.formatter(end)
          }

          return (
            '<div class="apexcharts-tooltip-rangebar">' +
            '<div> <span class="series-name" style="color: ' +
            color +
            '">' +
            (w.config.series[seriesIndex].name
              ? w.config.series[seriesIndex].name
              : '') +
            '</span></div>' +
            '<div> <span class="category">' +
            ylabel +
            ': </span> <span class="value start-value">' +
            startVal +
            '</span> <span class="separator">-</span> <span class="value end-value">' +
            endVal +
            '</span></div>' +
            '</div>'
          )
        }
      },
      xaxis: {
        tickPlacement: 'between',
        tooltip: {
          enabled: false
        },
        crosshairs: {
          stroke: {
            width: 0
          }
        }
      }
    }
  }

  area() {
    return {
      stroke: {
        width: 4
      },
      fill: {
        type: 'gradient',
        gradient: {
          inverseColors: false,
          shade: 'light',
          type: 'vertical',
          opacityFrom: 0.65,
          opacityTo: 0.5,
          stops: [0, 100, 100]
        }
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      tooltip: {
        followCursor: false
      }
    }
  }

  brush(defaults) {
    const ret = {
      chart: {
        toolbar: {
          autoSelected: 'selection',
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 1
      },
      tooltip: {
        enabled: false
      },
      xaxis: {
        tooltip: {
          enabled: false
        }
      }
    }

    return Utils.extend(defaults, ret)
  }

  stacked100() {
    this.opts.dataLabels = this.opts.dataLabels || {}
    this.opts.dataLabels.formatter = this.opts.dataLabels.formatter || undefined
    const existingDataLabelFormatter = this.opts.dataLabels.formatter

    this.opts.yaxis.forEach((yaxe, index) => {
      this.opts.yaxis[index].min = 0
      this.opts.yaxis[index].max = 100
    })

    const isBar = this.opts.chart.type === 'bar'

    if (isBar) {
      this.opts.dataLabels.formatter =
        existingDataLabelFormatter ||
        function(val) {
          if (typeof val === 'number') {
            return val ? val.toFixed(0) + '%' : val
          }
          return val
        }
    }
  }

  // This function removes the left and right spacing in chart for line/area/scatter if xaxis type = category for those charts by converting xaxis = numeric. Numeric/Datetime xaxis prevents the unnecessary spacing in the left/right of the chart area
  static convertCatToNumeric(opts) {
    opts.xaxis.type = 'numeric'
    opts.xaxis.convertedCatToNumeric = true
    opts.xaxis.labels = opts.xaxis.labels || {}
    opts.xaxis.labels.formatter =
      opts.xaxis.labels.formatter ||
      function(val) {
        return Utils.isNumber(val) ? Math.floor(val) : val
      }
    opts.chart = opts.chart || {}

    const defaultFormatter = opts.xaxis.labels.formatter
    const labels =
      opts.xaxis.categories && opts.xaxis.categories.length
        ? opts.xaxis.categories
        : opts.labels

    if (labels && labels.length) {
      opts.xaxis.labels.formatter = function(val) {
        return defaultFormatter(labels[Math.floor(val) - 1])
      }
    }

    opts.xaxis.categories = []
    opts.labels = []
    opts.xaxis.tickAmount = 'dataPoints'

    return opts
  }

  bubble() {
    return {
      dataLabels: {
        style: {
          colors: ['#fff']
        }
      },
      tooltip: {
        shared: false,
        intersect: true
      },
      xaxis: {
        crosshairs: {
          width: 0
        }
      },
      fill: {
        type: 'solid',
        gradient: {
          shade: 'light',
          inverse: true,
          shadeIntensity: 0.55,
          opacityFrom: 0.4,
          opacityTo: 0.8
        }
      }
    }
  }

  scatter() {
    return {
      dataLabels: {
        enabled: false
      },
      tooltip: {
        shared: false,
        intersect: true
      },
      markers: {
        size: 6,
        strokeWidth: 1,
        hover: {
          sizeOffset: 2
        }
      }
    }
  }

  heatmap() {
    return {
      chart: {
        stacked: false,
        zoom: {
          enabled: false
        }
      },
      fill: {
        opacity: 1
      },
      dataLabels: {
        style: {
          colors: ['#fff']
        }
      },
      stroke: {
        colors: ['#fff']
      },
      tooltip: {
        followCursor: true,
        marker: {
          show: false
        },
        x: {
          show: false
        }
      },
      legend: {
        position: 'top',
        markers: {
          shape: 'square',
          size: 10,
          offsetY: 2
        }
      },
      grid: {
        padding: {
          right: 20
        }
      }
    }
  }

  pie() {
    return {
      chart: {
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: false
            }
          }
        }
      },
      dataLabels: {
        formatter(val) {
          return val.toFixed(1) + '%'
        },
        style: {
          colors: ['#fff']
        },
        dropShadow: {
          enabled: true
        }
      },
      stroke: {
        colors: ['#fff']
      },
      fill: {
        opacity: 1,
        gradient: {
          shade: 'dark',
          shadeIntensity: 0.35,
          inverseColors: false,
          stops: [0, 100, 100]
        }
      },
      padding: {
        right: 0,
        left: 0
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: true
      },
      legend: {
        position: 'right'
      }
    }
  }

  donut() {
    return {
      chart: {
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        formatter(val) {
          return val.toFixed(1) + '%'
        },
        style: {
          colors: ['#fff']
        },
        dropShadow: {
          enabled: true
        }
      },
      stroke: {
        colors: ['#fff']
      },
      fill: {
        opacity: 1,
        gradient: {
          shade: 'dark',
          shadeIntensity: 0.4,
          inverseColors: false,
          type: 'vertical',
          opacityFrom: 1,
          opacityTo: 1,
          stops: [70, 98, 100]
        }
      },
      padding: {
        right: 0,
        left: 0
      },
      tooltip: {
        theme: 'dark',
        fillSeriesColor: true
      },
      legend: {
        position: 'right'
      }
    }
  }

  radar() {
    this.opts.yaxis[0].labels.offsetY = this.opts.yaxis[0].labels.offsetY
      ? this.opts.yaxis[0].labels.offsetY
      : 6

    return {
      chart: {
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false,
        style: {
          fontSize: '11px'
        }
      },
      stroke: {
        width: 2
      },
      markers: {
        size: 3,
        strokeWidth: 1,
        strokeOpacity: 1
      },
      fill: {
        opacity: 0.2
      },
      tooltip: {
        shared: false,
        intersect: true,
        followCursor: true
      },
      grid: {
        show: false
      },
      xaxis: {
        labels: {
          formatter: (val) => val,
          style: {
            colors: ['#a8a8a8'],
            fontSize: '11px'
          }
        },
        tooltip: {
          enabled: false
        },
        crosshairs: {
          show: false
        }
      }
    }
  }

  radialBar() {
    return {
      chart: {
        animations: {
          dynamicAnimation: {
            enabled: true,
            speed: 800
          }
        },
        toolbar: {
          show: false
        }
      },
      fill: {
        gradient: {
          shade: 'dark',
          shadeIntensity: 0.4,
          inverseColors: false,
          type: 'diagonal2',
          opacityFrom: 1,
          opacityTo: 1,
          stops: [70, 98, 100]
        }
      },
      padding: {
        right: 0,
        left: 0
      },
      legend: {
        show: false,
        position: 'right'
      },
      tooltip: {
        enabled: false,
        fillSeriesColor: true
      }
    }
  }
}
