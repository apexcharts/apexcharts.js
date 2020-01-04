export const optionPlotOptions = {
  bar: {
    horizontal: false,
    columnWidth: '70%', // should be in percent 0 - 100
    barHeight: '70%', // should be in percent 0 - 100
    distributed: false,
    endingShape: 'flat',
    colors: {
      ranges: [],
      backgroundBarColors: [],
      backgroundBarOpacity: 1
    },
    dataLabels: {
      position: 'top', // top, center, bottom
      maxItems: 100,
      hideOverflowingLabels: true,
      orientation: 'horizontal'
      // TODO: provide stackedLabels for stacked charts which gives additions of values
    }
  },
  bubble: {
    minBubbleRadius: undefined,
    maxBubbleRadius: undefined
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
    reverseNegativeShade: false,
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
        color: '#000',
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
        color: '#000',
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
        formatter(val) {
          return val + '%'
        }
      },
      total: {
        show: false,
        label: 'Total',
        color: undefined,
        formatter(w) {
          return (
            w.globals.seriesTotals.reduce((a, b) => a + b, 0) /
              w.globals.series.length +
            '%'
          )
        }
      }
    }
  },
  pie: {
    size: undefined,
    customScale: 1,
    offsetX: 0,
    offsetY: 0,
    expandOnClick: true,
    dataLabels: {
      // These are the percentage values which are displayed on slice
      offset: 0, // offset by which labels will move outside
      minAngleToShowLabel: 10
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
          offsetY: -10,
          formatter(val) {
            return val
          }
        },
        value: {
          show: true,
          fontSize: '20px',
          fontFamily: undefined,
          color: undefined,
          offsetY: 10,
          formatter(val) {
            return val
          }
        },
        total: {
          show: false,
          showAlways: false,
          label: 'Total',
          color: undefined,
          formatter(w) {
            return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
          }
        }
      }
    }
  },
  radar: {
    size: undefined,
    offsetX: 0,
    offsetY: 0,
    polygons: {
      // strokeColor: '#e8e8e8', // should be deprecated in the minor version i.e 3.2
      strokeColors: '#e8e8e8',
      connectorColors: '#e8e8e8',
      fill: {
        colors: undefined
      }
    }
  }
}
