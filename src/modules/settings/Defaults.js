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
      tooltip: {
        // followCursor: true,
      },
      xaxis: {
        crosshairs: {
          // TODO: make default 1
          width: 1
        }
      }

    }
  }

  sparkline () {
    this.opts.yaxis[0].labels.show = false
    this.opts.yaxis[0].floating = true

    return {
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
        }
      },
      chart: {
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        scroller: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      }
    }
  }

  bar () {
    return {
      chart: {
        stacked: false
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
      },
      yaxis: [{
        tooltip: {
          enabled: false
        }
      }]

    }
  }

  candlestick () {
    return {
      dataLabels: {
        enabled: false
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
        scroller: {
          enabled: false
        },
        toolbar: {
          show: false
        }
      },
      fill: {
        opacity: 1
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
        }
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
        position: 'right'
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
        position: 'right'
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
        show: false
      },
      tooltip: {
        enabled: false,
        fillSeriesColor: true
      }
    }
  }
}

module.exports = Defaults
