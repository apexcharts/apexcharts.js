/**
 * ApexCharts Options for setting the initial configuration of ApexCharts
 **/
const en = require('./../../locales/en.json')

export default class Options {
  constructor () {
    this.yAxis = {
      show: true,
      opposite: false,
      logarithmic: false,
      logBase: 10,
      tickAmount: undefined,
      max: undefined,
      min: undefined,
      decimalsInFloat: 2,
      floating: false,
      seriesName: undefined,
      labels: {
        show: true,
        minWidth: 0,
        maxWidth: 160,
        offsetX: 0,
        offsetY: 0,
        style: {
          colors: [],
          fontSize: '11px',
          fontFamily: undefined,
          cssClass: 'apexcharts-yaxis-label'
        },
        formatter: undefined
      },
      axisBorder: {
        show: false,
        color: '#78909C',
        offsetX: 0,
        offsetY: 0
      },
      axisTicks: {
        show: false,
        color: '#78909C',
        width: 6,
        offsetX: 0,
        offsetY: 0
      },
      title: {
        text: undefined,
        rotate: -90,
        offsetY: 0,
        offsetX: 0,
        style: {
          color: undefined,
          fontSize: '11px',
          fontFamily: undefined,
          cssClass: 'apexcharts-yaxis-title'
        }
      },
      tooltip: {
        enabled: false,
        offsetX: 0
      },
      crosshairs: {
        show: true,
        position: 'front',
        stroke: {
          color: '#b6b6b6',
          width: 1,
          dashArray: 0
        }
      }
    }

    this.xAxisAnnotation = {
      x: 0,
      strokeDashArray: 4,
      borderColor: '#c2c2c2',
      offsetX: 0,
      offsetY: 0,
      label: {
        borderColor: '#c2c2c2',
        borderWidth: 1,
        text: undefined,
        textAnchor: 'middle',
        orientation: 'vertical',
        position: 'top',
        offsetX: 0,
        offsetY: 0,
        style: {
          background: '#fff',
          color: undefined,
          fontSize: '11px',
          fontFamily: undefined,
          cssClass: 'apexcharts-xaxis-annotation-label',
          padding: {
            left: 5,
            right: 5,
            top: 2,
            bottom: 2
          }
        }
      }
    }

    this.yAxisAnnotation = {
      y: 0,
      strokeDashArray: 4,
      borderColor: '#c2c2c2',
      offsetX: 0,
      offsetY: 0,
      yAxisIndex: 0,
      label: {
        borderColor: '#c2c2c2',
        borderWidth: 1,
        text: undefined,
        textAnchor: 'end',
        position: 'right',
        offsetX: 0,
        offsetY: -3,
        style: {
          background: '#fff',
          color: undefined,
          fontSize: '11px',
          fontFamily: undefined,
          cssClass: 'apexcharts-yaxis-annotation-label',
          padding: {
            left: 5,
            right: 5,
            top: 0,
            bottom: 2
          }
        }
      }
    }

    this.pointAnnotation = {
      x: 0,
      y: null,
      yAxisIndex: 0,
      seriesIndex: 0,
      marker: {
        size: 0,
        fillColor: '#fff',
        strokeWidth: 2,
        strokeColor: '#333',
        shape: 'circle',
        offsetX: 0,
        offsetY: 0,
        radius: 2
      },
      label: {
        borderColor: '#c2c2c2',
        borderWidth: 1,
        text: undefined,
        textAnchor: 'middle',
        offsetX: 0,
        offsetY: -15,
        style: {
          background: '#fff',
          color: undefined,
          fontSize: '11px',
          fontFamily: undefined,
          cssClass: 'apexcharts-point-annotation-label',
          padding: {
            left: 5,
            right: 5,
            top: 0,
            bottom: 2
          }
        }
      }
    }
  }

  init () {
    return {
      annotations: {
        position: 'front',
        yaxis: [this.yAxisAnnotation],
        xaxis: [this.xAxisAnnotation],
        points: [this.pointAnnotation]
      },
      chart: {
        animations: {
          enabled: true,
          easing: 'easeinout', // linear, easeout, easein, easeinout, swing, bounce, elastic
          speed: 800,
          animateGradually: {
            delay: 150,
            enabled: true
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        background: 'transparent',
        locales: [en],
        defaultLocale: 'en',
        dropShadow: {
          enabled: false,
          enabledSeries: undefined,
          top: 2,
          left: 2,
          blur: 4,
          opacity: 0.35
        },
        events: {
          animationEnd: undefined,
          beforeMount: undefined,
          mounted: undefined,
          updated: undefined,
          click: undefined,
          legendClick: undefined,
          selection: undefined,
          dataPointSelection: undefined,
          dataPointMouseEnter: undefined,
          dataPointMouseLeave: undefined,
          beforeZoom: undefined, // if defined, should return true for the zoom event to occur
          zoomed: undefined,
          scrolled: undefined
        },
        foreColor: '#373d3f',
        fontFamily: 'Helvetica, Arial, sans-serif',
        height: 'auto',
        id: undefined,
        offsetX: 0,
        offsetY: 0,
        selection: {
          enabled: false,
          type: 'x',
          // selectedPoints: undefined, // default datapoints that should be selected automatically
          fill: {
            color: '#24292e',
            opacity: 0.1
          },
          stroke: {
            width: 1,
            color: '#24292e',
            opacity: 0.4,
            dashArray: 3
          },
          xaxis: {
            min: undefined,
            max: undefined
          },
          yaxis: {
            min: undefined,
            max: undefined
          }
        },
        sparkline: {
          enabled: false
        },
        brush: {
          enabled: false,
          target: undefined
        },
        stacked: false,
        stackType: 'normal',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          },
          autoSelected: 'zoom' // accepts -> zoom, pan, selection
        },
        type: 'line',
        width: '100%',
        zoom: {
          enabled: true,
          type: 'x',
          zoomedArea: {
            fill: {
              color: '#90CAF9',
              opacity: 0.4
            },
            stroke: {
              color: '#0D47A1',
              opacity: 0.4,
              width: 1
            }
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          endingShape: 'flat',
          columnWidth: '70%', // should be in percent 0 - 100
          barHeight: '70%', // should be in percent 0 - 100
          distributed: false,
          colors: {
            ranges: [],
            backgroundBarColors: [],
            backgroundBarOpacity: 1
          },
          dataLabels: {
            position: 'top' // top, center, bottom
            // TODO: provide stackedLabels for stacked charts which gives additions of values
          }
        },
        candlestick: {
          colors: {
            upward: '#00B746',
            downward: '#EF403C'
          },
          wick: {
            useFillColor: true
          }
        },
        heatmap: {
          radius: 2,
          enableShades: true,
          shadeIntensity: 0.5,
          distributed: false,
          colorScale: {
            inverse: false,
            ranges: [],
            min: undefined,
            max: undefined
          }
        },
        radialBar: {
          size: undefined,
          inverseOrder: false,
          startAngle: 0,
          endAngle: 360,
          offsetX: 0,
          offsetY: 0,
          hollow: {
            margin: 5,
            size: '50%',
            background: 'transparent',
            image: undefined,
            imageWidth: 150,
            imageHeight: 150,
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageClipped: true,
            position: 'front',
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5
            }
          },
          track: {
            show: true,
            startAngle: undefined,
            endAngle: undefined,
            background: '#f2f2f2',
            strokeWidth: '97%',
            opacity: 1,
            margin: 5, // margin is in pixels
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5
            }
          },
          dataLabels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontFamily: undefined,
              color: undefined,
              offsetY: 0
            },
            value: {
              show: true,
              fontSize: '14px',
              fontFamily: undefined,
              color: undefined,
              offsetY: 16,
              formatter: function (val) {
                return val + '%'
              }
            },
            total: {
              show: false,
              label: 'Total',
              color: '#373d3f',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => {
                  return a + b
                }, 0) / w.globals.series.length + '%'
              }
            }
          }
        },
        pie: {
          size: undefined,
          customScale: 0,
          offsetX: 0,
          offsetY: 0,
          expandOnClick: true,
          dataLabels: {
            // These are the percentage values which are displayed on slice
            offset: 0 // offset by which labels will move outside
          },
          donut: {
            size: '65%',
            background: 'transparent',
            labels: {
              // These are the inner labels appearing inside donut
              show: false,
              name: {
                show: true,
                fontSize: '16px',
                fontFamily: undefined,
                color: undefined,
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '20px',
                fontFamily: undefined,
                color: undefined,
                offsetY: 10,
                formatter: function (val) {
                  return val
                }
              },
              total: {
                show: false,
                label: 'Total',
                color: '#373d3f',
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a, b) => {
                    return a + b
                  }, 0)
                }
              }
            }
          }
        }
      },
      colors: undefined,
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val
        },
        textAnchor: 'middle',
        offsetX: 0,
        offsetY: 0,
        style: {
          fontSize: '12px',
          fontFamily: undefined,
          colors: undefined
        },
        dropShadow: {
          enabled: false,
          top: 1,
          left: 1,
          blur: 1,
          opacity: 0.45
        }
      },
      fill: {
        type: 'solid',
        colors: undefined, // array of colors
        opacity: 0.85,
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 100]
        },
        image: {
          src: [],
          width: undefined, // optional
          height: undefined // optional
        },
        pattern: {
          style: 'sqaures', // String | Array of Strings
          width: 6,
          height: 6,
          strokeWidth: 2
        }
      },
      grid: {
        show: true,
        borderColor: '#e0e0e0',
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false,
            animate: false
          }
        },
        yaxis: {
          lines: {
            show: true,
            animate: true
          }
        },
        row: {
          colors: undefined, // takes as array which will be repeated on rows
          opacity: 0.5
        },
        column: {
          colors: undefined, // takes an array which will be repeated on columns
          opacity: 0.5
        },
        padding: {
          top: 0,
          right: 10,
          bottom: 0,
          left: 10
        }
      },
      labels: [],
      legend: {
        show: true,
        showForSingleSeries: false,
        showForZeroSeries: true,
        floating: false,
        position: 'bottom', // whether to position legends in 1 of 4
        // direction - top, bottom, left, right
        horizontalAlign: 'center', // when position top/bottom, you can specify whether to align legends left, right or center
        fontSize: '12px',
        fontFamily: undefined,
        width: undefined,
        height: undefined,
        formatter: undefined,
        offsetX: -20,
        offsetY: 0,
        labels: {
          colors: undefined,
          useSeriesColors: false
        },
        markers: {
          width: 12,
          height: 12,
          strokeWidth: 0,
          strokeColor: '#fff',
          radius: 12,
          customHTML: undefined,
          offsetX: 0,
          offsetY: 0
        },
        itemMargin: {
          horizontal: 0,
          vertical: 5
        },
        onItemClick: {
          toggleDataSeries: true
        },
        onItemHover: {
          highlightDataSeries: true
        }
      },
      markers: {
        discrete: [],
        size: 0,
        colors: undefined,
        strokeColor: '#fff',
        strokeWidth: 2,
        strokeOpacity: 0.9,
        fillOpacity: 1,
        shape: 'circle',
        radius: 2,
        offsetX: 0,
        offsetY: 0,
        hover: {
          size: undefined,
          sizeOffset: 3
        }
      },
      noData: {
        text: undefined,
        align: 'center',
        verticalAlign: 'middle',
        offsetX: 0,
        offsetY: 0,
        style: {
          color: undefined,
          fontSize: '14px',
          fontFamily: undefined
        }
      },
      responsive: [], // breakpoints should follow ascending order 400, then 700, then 1000
      series: undefined,
      states: {
        normal: {
          filter: {
            type: 'none',
            value: 0
          }
        },
        hover: {
          filter: {
            type: 'lighten',
            value: 0.15
          }
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: 'darken',
            value: 0.35
          }
        }
      },
      title: {
        text: undefined,
        align: 'left',
        margin: 10,
        offsetX: 0,
        offsetY: 0,
        floating: false,
        style: {
          fontSize: '14px',
          fontFamily: undefined,
          color: undefined
        }
      },
      subtitle: {
        text: undefined,
        align: 'left',
        margin: 10,
        offsetX: 0,
        offsetY: 30,
        floating: false,
        style: {
          fontSize: '12px',
          fontFamily: undefined,
          color: undefined
        }
      },
      stroke: {
        show: true,
        curve: 'smooth', // "smooth" / "straight" / "stepline"
        lineCap: 'butt', // round, butt , square
        width: 2,
        colors: undefined, // array of colors
        dashArray: 0 // single value or array of values
      },
      tooltip: {
        enabled: true,
        shared: true,
        followCursor: false, // when disabled, the tooltip will show on top of the series instead of mouse position
        intersect: false, // when enabled, tooltip will only show when user directly hovers over point
        inverseOrder: false,
        custom: undefined,
        fillSeriesColor: false,
        theme: 'light',
        onDatasetHover: {
          highlightDataSeries: false
        },
        x: { // x value
          show: true,
          format: 'dd MMM', // dd/MM, dd MMM yy, dd MMM yyyy
          formatter: undefined // a custom user supplied formatter function
        },
        y: {
          formatter: undefined,
          title: {
            formatter: function (seriesName) {
              return seriesName
            }
          }
        },
        z: {
          formatter: undefined,
          title: 'Size: '
        },
        marker: {
          show: true
        },
        items: {
          display: 'flex'
        },
        fixed: {
          enabled: false,
          position: 'topRight', // topRight, topLeft, bottomRight, bottomLeft
          offsetX: 0,
          offsetY: 0
        }
      },
      xaxis: {
        type: 'category',
        categories: [],
        offsetX: 0,
        offsetY: 0,
        labels: {
          show: true,
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
          minHeight: undefined,
          maxHeight: 120,
          showDuplicates: false,
          style: {
            colors: [],
            fontSize: '12px',
            fontFamily: undefined,
            cssClass: 'apexcharts-xaxis-label'
          },
          offsetX: 0,
          offsetY: 0,
          format: undefined,
          formatter: undefined, // custom formatter function which will override format
          datetimeFormatter: {
            year: 'yyyy',
            month: 'MMM \'yy',
            day: 'dd MMM',
            hour: 'HH:mm',
            minute: 'HH:mm:ss'
          }
        },
        axisBorder: {
          show: true,
          color: '#78909C',
          width: '100%',
          height: 1,
          offsetX: 0,
          offsetY: 0
        },
        axisTicks: {
          show: true,
          color: '#78909C',
          height: 6,
          offsetX: 0,
          offsetY: 0
        },
        tickAmount: undefined,
        min: undefined,
        max: undefined,
        range: undefined,
        floating: false,
        position: 'bottom',
        title: {
          text: undefined,
          offsetX: 0,
          offsetY: 0,
          style: {
            color: undefined,
            fontSize: '12px',
            fontFamily: undefined,
            cssClass: 'apexcharts-xaxis-title'
          }
        },
        crosshairs: {
          show: true,
          width: 1, // tickWidth/barWidth or an integer
          position: 'back',
          opacity: 0.9,
          stroke: {
            color: '#b6b6b6',
            width: 0,
            dashArray: 0
          },
          fill: {
            type: 'solid', // solid, gradient
            color: '#B1B9C4',
            gradient: {
              colorFrom: '#D8E3F0',
              colorTo: '#BED1E6',
              stops: [0, 100],
              opacityFrom: 0.4,
              opacityTo: 0.5
            }
          },
          dropShadow: {
            enabled: false,
            left: 0,
            top: 0,
            blur: 1,
            opacity: 0.4
          }
        },
        tooltip: {
          enabled: true,
          offsetY: 0,
          formatter: undefined
        }
      },
      yaxis: this.yAxis,
      theme: {
        palette: 'palette1', // If defined, it will overwrite globals.colors variable
        monochrome: { // monochrome allows you to select just 1 color and fill out the rest with light/dark shade (intensity can be selected)
          enabled: false,
          color: '#008FFB',
          shadeTo: 'light',
          shadeIntensity: 0.65
        }
      }
    }
  }
}
