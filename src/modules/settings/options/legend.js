export const optionLegend = {
  show: true,
  showForSingleSeries: false,
  showForNullSeries: true,
  showForZeroSeries: true,
  floating: false,
  position: 'bottom', // whether to position legends in 1 of 4
  // direction - top, bottom, left, right
  horizontalAlign: 'center', // when position top/bottom, you can specify whether to align legends left, right or center
  inverseOrder: false,
  fontSize: '12px',
  fontFamily: undefined,
  width: undefined,
  height: undefined,
  formatter: undefined,
  tooltipHoverFormatter: undefined,
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
    fillColors: undefined,
    strokeColor: '#fff',
    radius: 12,
    customHTML: undefined,
    offsetX: 0,
    offsetY: 0,
    onClick: undefined
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
}
