export const optionYAxis = {
  show: true,
  showAlways: false,
  seriesName: undefined,
  opposite: false,
  reversed: false,
  logarithmic: false,
  tickAmount: undefined,
  forceNiceScale: false,
  max: undefined,
  min: undefined,
  floating: false,
  decimalsInFloat: undefined,
  labels: {
    show: true,
    minWidth: 0,
    maxWidth: 160,
    offsetX: 0,
    offsetY: 0,
    align: undefined,
    rotate: 0,
    padding: 20,
    style: {
      colors: [],
      fontSize: '11px',
      fontFamily: undefined,
      cssClass: ''
    },
    formatter: undefined
  },
  axisBorder: {
    show: false,
    color: '#e0e0e0',
    width: 1,
    offsetX: 0,
    offsetY: 0
  },
  axisTicks: {
    show: false,
    color: '#e0e0e0',
    width: 6,
    offsetX: 0,
    offsetY: 0
  },
  title: {
    text: undefined,
    rotate: 90,
    offsetY: 0,
    offsetX: 0,
    style: {
      color: undefined,
      fontSize: '11px',
      fontFamily: undefined,
      cssClass: ''
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

export const optionXAxis = {
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
    showDuplicates: true,
    style: {
      colors: [],
      fontSize: '12px',
      fontFamily: undefined,
      cssClass: ''
    },
    offsetX: 0,
    offsetY: 0,
    format: undefined,
    formatter: undefined, // custom formatter function which will override format
    datetimeUTC: true,
    datetimeFormatter: {
      year: 'yyyy',
      month: "MMM 'yy",
      day: 'dd MMM',
      hour: 'HH:mm',
      minute: 'HH:mm:ss'
    }
  },
  axisBorder: {
    show: true,
    color: '#e0e0e0',
    width: '100%',
    height: 1,
    offsetX: 0,
    offsetY: 0
  },
  axisTicks: {
    show: true,
    color: '#e0e0e0',
    height: 6,
    offsetX: 0,
    offsetY: 0
  },
  tickAmount: undefined,
  tickPlacement: 'on',
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
      cssClass: ''
    }
  },
  crosshairs: {
    show: true,
    width: 1, // tickWidth/barWidth or an integer
    position: 'back',
    opacity: 0.9,
    stroke: {
      color: '#b6b6b6',
      width: 1,
      dashArray: 3
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
    formatter: undefined,
    style: {
      fontSize: '12px',
      fontFamily: undefined
    }
  }
}
