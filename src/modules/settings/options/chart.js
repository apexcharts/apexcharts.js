import en from './../../../locales/en.json'

export const optionChart = {
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
    color: '#000',
    opacity: 0.35
  },
  events: {
    animationEnd: undefined,
    beforeMount: undefined,
    mounted: undefined,
    updated: undefined,
    click: undefined,
    mouseMove: undefined,
    legendClick: undefined,
    markerClick: undefined,
    selection: undefined,
    dataPointSelection: undefined,
    dataPointMouseEnter: undefined,
    dataPointMouseLeave: undefined,
    beforeZoom: undefined,
    zoomed: undefined,
    scrolled: undefined
  },
  foreColor: '#373d3f',
  fontFamily: 'Helvetica, Arial, sans-serif',
  height: 'auto',
  parentHeightOffset: 15,
  id: undefined,
  group: undefined,
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
    autoScaleYaxis: true,
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
      reset: true,
      customIcons: []
    },
    autoSelected: 'zoom' // accepts -> zoom, pan, selection
  },
  type: 'line',
  width: '100%',
  zoom: {
    enabled: true,
    type: 'x',
    autoScaleYaxis: false,
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
}
