import Utils from '../utils/Utils'

/**
 * ApexCharts Theme Class for setting the colors and palettes.
 *
 * @module Theme
 **/

export default class Theme {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
    this.colors = []
  }

  init() {
    this.setDefaultColors()
  }

  setDefaultColors() {
    let w = this.w
    let utils = new Utils()

    w.globals.dom.elWrap.classList.add(w.config.theme.mode)

    if (w.config.colors === undefined) {
      w.globals.colors = this.predefined()
    } else {
      w.globals.colors = w.config.colors

      // if user provided a function in colors, we need to eval here
      if (
        w.globals.axisCharts &&
        w.config.chart.type !== 'bar' &&
        Array.isArray(w.config.colors) &&
        w.config.colors.length > 0 &&
        w.config.colors.length === w.config.series.length
        // colors & series length needs same
      ) {
        w.globals.colors = w.config.colors.map((c, i) => {
          return typeof c === 'function'
            ? c({
                value: w.globals.axisCharts
                  ? w.globals.series[i][0]
                    ? w.globals.series[i][0]
                    : 0
                  : w.globals.series[i],
                seriesIndex: i,
                w: w
              })
            : c
        })
      }
    }

    if (w.config.theme.monochrome.enabled) {
      let monoArr = []
      let glsCnt = w.globals.series.length
      if (
        w.config.plotOptions.bar.distributed &&
        w.config.chart.type === 'bar'
      ) {
        glsCnt = w.globals.series[0].length * w.globals.series.length
      }

      let mainColor = w.config.theme.monochrome.color
      let part = 1 / (glsCnt / w.config.theme.monochrome.shadeIntensity)
      let shade = w.config.theme.monochrome.shadeTo
      let percent = 0

      for (let gsl = 0; gsl < glsCnt; gsl++) {
        let newColor

        if (shade === 'dark') {
          newColor = utils.shadeColor(percent * -1, mainColor)
          percent = percent + part
        } else {
          newColor = utils.shadeColor(percent, mainColor)
          percent = percent + part
        }

        monoArr.push(newColor)
      }
      w.globals.colors = monoArr.slice()
    }
    const defaultColors = w.globals.colors.slice()

    // if user specfied less colors than no. of series, push the same colors again
    this.pushExtraColors(w.globals.colors)

    // The Border colors
    if (w.config.stroke.colors === undefined) {
      w.globals.stroke.colors = defaultColors
    } else {
      w.globals.stroke.colors = w.config.stroke.colors
    }
    this.pushExtraColors(w.globals.stroke.colors)

    // The FILL colors
    if (w.config.fill.colors === undefined) {
      w.globals.fill.colors = defaultColors
    } else {
      w.globals.fill.colors = w.config.fill.colors
    }
    this.pushExtraColors(w.globals.fill.colors)

    if (w.config.dataLabels.style.colors === undefined) {
      w.globals.dataLabels.style.colors = defaultColors
    } else {
      w.globals.dataLabels.style.colors = w.config.dataLabels.style.colors
    }
    this.pushExtraColors(w.globals.dataLabels.style.colors, 50)

    if (w.config.plotOptions.radar.polygons.fill.colors === undefined) {
      w.globals.radarPolygons.fill.colors = [
        w.config.theme.mode === 'dark' ? '#202D48' : '#fff'
      ]
    } else {
      w.globals.radarPolygons.fill.colors =
        w.config.plotOptions.radar.polygons.fill.colors
    }
    this.pushExtraColors(w.globals.radarPolygons.fill.colors, 20)

    // The point colors
    if (w.config.markers.colors === undefined) {
      w.globals.markers.colors = defaultColors
    } else {
      w.globals.markers.colors = w.config.markers.colors
    }
    this.pushExtraColors(w.globals.markers.colors)
  }

  // When the number of colors provided is less than the number of series, this method
  // will push same colors to the list
  // params:
  // distributed is only valid for distributed column/bar charts
  pushExtraColors(colorSeries, length, distributed = null) {
    let w = this.w

    let len = length || w.globals.series.length

    if (distributed === null) {
      distributed =
        (w.config.chart.type === 'bar' &&
          w.config.plotOptions.bar.distributed) ||
        (w.config.chart.type === 'heatmap' &&
          w.config.plotOptions.heatmap.colorScale.inverse)
    }

    if (distributed) {
      len = w.globals.series[0].length * w.globals.series.length
    }

    if (colorSeries.length < len) {
      let diff = len - colorSeries.length
      for (let i = 0; i < diff; i++) {
        colorSeries.push(colorSeries[i])
      }
    }
  }

  updateThemeOptions(options) {
    options.chart = options.chart || {}
    options.tooltip = options.tooltip || {}
    const mode = options.theme.mode || 'light'
    const palette = options.theme.palette
      ? options.theme.palette
      : mode === 'dark'
      ? 'palette4'
      : 'palette1'
    const foreColor = options.chart.foreColor
      ? options.chart.foreColor
      : mode === 'dark'
      ? '#f6f7f8'
      : '#373d3f'

    options.tooltip.theme = mode
    options.chart.foreColor = foreColor
    options.theme.palette = palette

    return options
  }

  predefined() {
    let palette = this.w.config.theme.palette

    // D6E3F8, FCEFEF, DCE0D9, A5978B, EDDDD4, D6E3F8, FEF5EF
    switch (palette) {
      case 'palette1':
        this.colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0']
        break
      case 'palette2':
        this.colors = ['#3f51b5', '#03a9f4', '#4caf50', '#f9ce1d', '#FF9800']
        break
      case 'palette3':
        this.colors = ['#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B']
        break
      case 'palette4':
        this.colors = ['#4ecdc4', '#c7f464', '#81D4FA', '#fd6a6a', '#546E7A']
        break
      case 'palette5':
        this.colors = ['#2b908f', '#f9a3a4', '#90ee7e', '#fa4443', '#69d2e7']
        break
      case 'palette6':
        this.colors = ['#449DD1', '#F86624', '#EA3546', '#662E9B', '#C5D86D']
        break
      case 'palette7':
        this.colors = ['#D7263D', '#1B998B', '#2E294E', '#F46036', '#E2C044']
        break
      case 'palette8':
        this.colors = ['#662E9B', '#F86624', '#F9C80E', '#EA3546', '#43BCCD']
        break
      case 'palette9':
        this.colors = ['#5C4742', '#A5978B', '#8D5B4C', '#5A2A27', '#C4BBAF']
        break
      case 'palette10':
        this.colors = ['#A300D6', '#7D02EB', '#5653FE', '#2983FF', '#00B1F2']
        break
      default:
        this.colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0']
        break
    }
    return this.colors
  }
}
