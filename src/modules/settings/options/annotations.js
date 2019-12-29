const annoStyle = {
  background: '#fff',
  color: undefined,
  fontSize: '11px',
  fontFamily: undefined,
  cssClass: '',
  padding: {
    left: 5,
    right: 5,
    top: 2,
    bottom: 2
  }
}

const annotationLine = {
  strokeDashArray: 1,
  fillColor: '#c2c2c2',
  borderColor: '#c2c2c2',
  borderWidth: 1,
  opacity: 0.3,
  offsetX: 0,
  offsetY: 0
}

export const optionXAxisAnnotation = {
  x: 0,
  x2: null,
  ...annotationLine,
  label: {
    borderColor: '#c2c2c2',
    borderWidth: 1,
    text: undefined,
    textAnchor: 'middle',
    orientation: 'vertical',
    position: 'top',
    offsetX: 0,
    offsetY: 0,
    style: { ...annoStyle }
  }
}

export const optionYAxisAnnotation = {
  y: 0,
  y2: null,
  ...annotationLine,
  yAxisIndex: 0,
  label: {
    borderColor: '#c2c2c2',
    borderWidth: 1,
    text: undefined,
    textAnchor: 'end',
    position: 'right',
    offsetX: 0,
    offsetY: -3,
    style: { ...annoStyle }
  }
}

export const optionPointAnnotation = {
  x: 0,
  y: null,
  yAxisIndex: 0,
  seriesIndex: 0,
  marker: {
    size: 4,
    fillColor: '#fff',
    strokeWidth: 2,
    strokeColor: '#333',
    shape: 'circle',
    offsetX: 0,
    offsetY: 0,
    radius: 2,
    cssClass: ''
  },
  label: {
    borderColor: '#c2c2c2',
    borderWidth: 1,
    text: undefined,
    textAnchor: 'middle',
    offsetX: 0,
    offsetY: -15,
    style: { ...annoStyle }
  },
  customSVG: {
    SVG: undefined,
    cssClass: undefined,
    offsetX: 0,
    offsetY: 0
  }
}
