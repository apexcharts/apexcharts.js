import Utils from '../../utils/Utils'

/**
 * ApexCharts Default Class for setting default options for all chart types.
 *
 * @module Defaults
 **/

class Defaults {
  constructor (opts) {
    this.opts = opts
  }

  line () {
    return {
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 5,
        curve: 'straight'
      },
      markers: {
        size: 5
      },
      title: {
        style: {
          fontFamily: 'Helvetica, Arial, sans-serif'
        }
      },
      tooltip: {
        // followCursor: true,
      },
      xaxis: {
        crosshairs: {
          width: 1
        }
      }

    }
  }

  sparkline (defaults) {
    this.opts.yaxis[0].labels.show = false
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
        show: false,
        fontFamily: 'Helvetica, Arial, sans-serif'
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

  bar () {
    return {
      chart: {
        stacked: false,
        toolbar: {
          show: false
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
          colors: ['#fff'],
          fontFamily: 'Helvetica, Arial, sans-serif'
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
        },
        fontFamily: 'Helvetica, Arial, sans-serif'
      },
      title: {
        style: {
          fontFamily: 'Helvetica, Arial, sans-serif'
        }
      },
      tooltip: {
        shared: false
      },
      xaxis: {
        tooltip: {
          enabled: false
        },
        crosshairs: {
          width: 'barWidth',
          position: 'back',
          fill: {
            type: 'gradient'
          },
          dropShadow: {
            enabled: false
          }
        }
      }
    }
  }

  candlestick () {
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
        custom: function ({ seriesIndex, dataPointIndex, w }) {
          const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex]
          const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex]
          const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex]
          const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex]
          return '<div class="apexcharts-tooltip-candlestick">' +
            '<div>Open: <span class="value">' + o + '</span></div>' +
            '<div>High: <span class="value">' + h + '</span></div>' +
            '<div>Low: <span class="value">' + l + '</span></div>' +
            '<div>Close: <span class="value">' + c + '</span></div>' +
            '</div>'
        }
      },
      xaxis: {
        crosshairs: {
          width: 1
        }
      }
    }
  }

  area () {
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
      tooltip: {
        followCursor: false
      }
    }
  }

  brush (defaults) {
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

  stacked100 () {
    this.opts.dataLabels = this.opts.dataLabels || {}
    this.opts.dataLabels.formatter = this.opts.dataLabels.formatter || undefined
    const existingDataLabelFormatter = this.opts.dataLabels.formatter

    this.opts.yaxis[0].min = 0
    this.opts.yaxis[0].max = 100

    const isBar = !!(this.opts.chart.type === 'bar')

    if (isBar) {
      this.opts.dataLabels.formatter = existingDataLabelFormatter || function (val) {
        if (typeof val === 'number') {
          return val ? val.toFixed(0) + '%' : val
        }
        return val
      }
    }
  }

  bubble () {
    return {
      dataLabels: {
        style: {
          colors: ['#fff'],
          fontFamily: 'Helvetica, Arial, sans-serif'
        }
      },
      legend: {
        fontFamily: 'Helvetica, Arial, sans-serif'
      },
      title: {
        style: {
          fontFamily: 'Helvetica, Arial, sans-serif'
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

  scatter () {
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
        strokeWidth: 2,
        hover: {
          size: 8
        }
      }
    }
  }

  heatmap () {
    return {
      chart: {
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        }
      },
      fill: {
        opacity: 1
      },
      dataLabels: {
        style: {
          colors: ['#fff'],
          fontFamily: 'Helvetica, Arial, sans-serif'
        }
      },
      stroke: {
        colors: ['#fff']
      },
      tooltip: {
        followCursor: true,
        marker: {
          show: false
        }
      },
      legend: {
        position: 'top',
        markers: {
          shape: 'square',
          size: 10,
          offsetY: 2
        },
        fontFamily: 'Helvetica, Arial, sans-serif'
      }
    }
  }

  pie () {
    return {
      chart: {
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        formatter: function (val) {
          return val.toFixed(1) + '%'
        },
        style: {
          colors: ['#fff'],
          fontFamily: 'Helvetica, Arial, sans-serif'
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
      tooltip: {
        theme: 'dark',
        fillSeriesColor: true
      },
      legend: {
        position: 'right',
        fontFamily: 'Helvetica, Arial, sans-serif'
      }
    }
  }

  donut () {
    return {
      chart: {
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        formatter: function (val) {
          return val.toFixed(1) + '%'
        },
        style: {
          colors: ['#fff'],
          fontFamily: 'Helvetica, Arial, sans-serif'
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
      tooltip: {
        theme: 'dark',
        fillSeriesColor: true
      },
      legend: {
        position: 'right',
        fontFamily: 'Helvetica, Arial, sans-serif'
      }
    }
  }

  radialBar () {
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
      legend: {
        show: false,
        fontFamily: 'Helvetica, Arial, sans-serif'
      },
      tooltip: {
        enabled: false,
        fillSeriesColor: true
      }
    }
  }
}

module.exports = Defaults
