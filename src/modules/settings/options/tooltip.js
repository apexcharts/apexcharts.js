export const optionTooltip = {
  enabled: true,
  enabledOnSeries: undefined,
  shared: true,
  followCursor: false, // when disabled, the tooltip will show on top of the series instead of mouse position
  intersect: false, // when enabled, tooltip will only show when user directly hovers over point
  inverseOrder: false,
  custom: undefined,
  fillSeriesColor: false,
  theme: 'light',
  style: {
    fontSize: '12px',
    fontFamily: undefined
  },
  onDatasetHover: {
    highlightDataSeries: false
  },
  x: {
    // x value
    show: true,
    format: 'dd MMM', // dd/MM, dd MMM yy, dd MMM yyyy
    formatter: undefined // a custom user supplied formatter function
  },
  y: {
    formatter: undefined,
    title: {
      formatter(seriesName) {
        return seriesName
      }
    }
  },
  z: {
    formatter: undefined,
    title: 'Size: '
  },
  marker: {
    show: true,
    fillColors: undefined
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
}
