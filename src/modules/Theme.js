// @ts-check
import Utils from '../utils/Utils'
import { getThemePalettes } from '../utils/ThemePalettes.js'

/**
 * ApexCharts Theme Class for setting the colors and palettes.
 *
 * @module Theme
 **/

export default class Theme {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w
    this.colors = []
    this.isColorFn = false
    this.isHeatmapDistributed = this.checkHeatmapDistributed()
    this.isBarDistributed = this.checkBarDistributed()
  }

  checkHeatmapDistributed() {
    const { chart, plotOptions } = this.w.config
    return (
      (chart.type === 'treemap' &&
        plotOptions.treemap &&
        plotOptions.treemap.distributed) ||
      (chart.type === 'heatmap' &&
        plotOptions.heatmap &&
        plotOptions.heatmap.distributed)
    )
  }

  checkBarDistributed() {
    const { chart, plotOptions } = this.w.config
    return (
      plotOptions.bar &&
      plotOptions.bar.distributed &&
      (chart.type === 'bar' || chart.type === 'rangeBar')
    )
  }

  init() {
    this.setDefaultColors()
  }

  setDefaultColors() {
    const w = this.w
    const utils = new Utils()

    w.dom.elWrap.classList.add(
      `apexcharts-theme-${w.config.theme.mode || 'light'}`,
    )

    const colorBlindMode = w.config.theme.accessibility?.colorBlindMode
    if (colorBlindMode) {
      w.globals.colors = this.getColorBlindColors(colorBlindMode)
      this.applySeriesColors(w.seriesData.seriesColors, w.globals.colors)
      const defaultColors = w.globals.colors.slice()
      this.pushExtraColors(w.globals.colors)
      this.applyColorTypes(['fill', 'stroke'], defaultColors)
      this.applyDataLabelsColors(defaultColors)
      this.applyRadarPolygonsColors()
      this.applyMarkersColors(defaultColors)
      if (colorBlindMode === 'highContrast') {
        w.dom.elWrap.classList.add('apexcharts-high-contrast')
      }
      return
    }

    // Create a copy of config.colors array to avoid mutating the original config.colors
    const configColors = [...(w.config.colors || w.config.fill.colors || [])]
    w.globals.colors = this.getColors(configColors)

    this.applySeriesColors(w.seriesData.seriesColors, w.globals.colors)

    if (w.config.theme.monochrome.enabled) {
      w.globals.colors = this.getMonochromeColors(
        w.config.theme.monochrome,
        w.seriesData.series,
        utils,
      )
    }

    const defaultColors = w.globals.colors.slice()
    this.pushExtraColors(w.globals.colors)

    this.applyColorTypes(['fill', 'stroke'], defaultColors)
    this.applyDataLabelsColors(defaultColors)
    this.applyRadarPolygonsColors()
    this.applyMarkersColors(defaultColors)
  }

  /**
   * @param {any[]} configColors
   */
  getColors(configColors) {
    const w = this.w
    if (!configColors || configColors.length === 0) {
      return this.predefined()
    }

    if (
      Array.isArray(configColors) &&
      configColors.length > 0 &&
      typeof configColors[0] === 'function'
    ) {
      this.isColorFn = true
      /**
       * @param {Record<string, any>} s
       * @param {number} i
       */
      return w.config.series.map((s, i) => {
        const c = configColors[i] || configColors[0]
        return typeof c === 'function'
          ? c({
              value: w.globals.axisCharts
                ? w.seriesData.series[i][0] || 0
                : w.seriesData.series[i],
              seriesIndex: i,
              dataPointIndex: i,
              w: this.w,
            })
          : c
      })
    }

    return configColors
  }

  /**
   * @param {any[]} seriesColors
   * @param {any[]} globalsColors
   */
  applySeriesColors(seriesColors, globalsColors) {
    /**
     * @param {any} c
     * @param {number} i
     */
    seriesColors.forEach((/** @type {any} */ c, /** @type {any} */ i) => {
      if (c) {
        globalsColors[i] = c
      }
    })
  }

  /**
   * @param {Record<string, any>} monochrome
   * @param {any[]} series
   * @param {any} utils
   */
  getMonochromeColors(monochrome, series, utils) {
    const { color, shadeIntensity, shadeTo } = monochrome
    const glsCnt =
      this.isBarDistributed || this.isHeatmapDistributed
        ? series[0].length * series.length
        : series.length
    const part = 1 / (glsCnt / shadeIntensity)
    let percent = 0

    return Array.from({ length: glsCnt }, () => {
      const newColor =
        shadeTo === 'dark'
          ? utils.shadeColor(percent * -1, color)
          : utils.shadeColor(percent, color)
      percent += part
      return newColor
    })
  }

  /**
   * @param {string[]} colorTypes
   * @param {string[]} defaultColors
   */
  applyColorTypes(colorTypes, defaultColors) {
    const w = this.w
    /**
     * @param {string} c
     */
    colorTypes.forEach((/** @type {any} */ c) => {
      /** @type {Record<string,any>} */ ;/** @type {any} */ (w.globals)[
        c
      ].colors =
        w.config[c].colors === undefined
          ? this.isColorFn
            ? w.config.colors
            : defaultColors
          : w.config[c].colors.slice()
      this.pushExtraColors(
        /** @type {Record<string,any>} */ (w.globals)[c].colors,
      )
    })
  }

  /**
   * @param {string[]} defaultColors
   */
  applyDataLabelsColors(defaultColors) {
    const w = this.w
    w.globals.dataLabels.style.colors =
      w.config.dataLabels.style.colors === undefined
        ? defaultColors
        : w.config.dataLabels.style.colors.slice()
    this.pushExtraColors(w.globals.dataLabels.style.colors, 50)
  }

  applyRadarPolygonsColors() {
    const w = this.w
    w.globals.radarPolygons.fill.colors =
      w.config.plotOptions.radar.polygons.fill.colors === undefined
        ? [w.config.theme.mode === 'dark' ? '#343A3F' : 'none']
        : w.config.plotOptions.radar.polygons.fill.colors.slice()
    this.pushExtraColors(w.globals.radarPolygons.fill.colors, 20)
  }

  /**
   * @param {string[]} defaultColors
   */
  applyMarkersColors(defaultColors) {
    const w = this.w
    w.globals.markers.colors =
      w.config.markers.colors === undefined
        ? defaultColors
        : w.config.markers.colors.slice()
    this.pushExtraColors(w.globals.markers.colors)
  }

  /**
   * @param {any} colorSeries
   * @param {number} [length]
   * @param {boolean | null} [distributed]
   */
  pushExtraColors(colorSeries, length, distributed = null) {
    const w = this.w
    let len = length || w.seriesData.series.length

    if (distributed === null) {
      distributed =
        this.isBarDistributed ||
        this.isHeatmapDistributed ||
        (w.config.chart.type === 'heatmap' &&
          w.config.plotOptions.heatmap &&
          w.config.plotOptions.heatmap.colorScale.inverse)
    }

    if (distributed && w.seriesData.series.length) {
      len =
        w.seriesData.series[w.globals.maxValsInArrayIndex].length *
        w.seriesData.series.length
    }

    if (colorSeries.length < len) {
      const diff = len - colorSeries.length
      for (let i = 0; i < diff; i++) {
        colorSeries.push(colorSeries[i])
      }
    }
  }

  /**
   * @param {'light' | 'dark'} mode
   */
  getColorBlindColors(mode) {
    const palettes = getThemePalettes()
    const map = {
      deuteranopia: palettes.cvdDeuteranopia,
      protanopia: palettes.cvdProtanopia,
      tritanopia: palettes.cvdTritanopia,
      highContrast: palettes.highContrast,
    }
    return /** @type {Record<string,any>} */ (
      /** @type {any} */ (map)[mode] || palettes.palette1
    ).slice()
  }

  /**
   * @param {Record<string, any>} options
   */
  updateThemeOptions(options) {
    options.chart = options.chart || {}
    options.tooltip = options.tooltip || {}
    const mode = options.theme.mode
    const palette =
      mode === 'dark'
        ? 'palette4'
        : mode === 'light'
          ? 'palette1'
          : options.theme.palette || 'palette1'
    const foreColor =
      mode === 'dark'
        ? '#f6f7f8'
        : mode === 'light'
          ? '#373d3f'
          : options.chart.foreColor || '#373d3f'

    options.tooltip.theme = mode || 'light'
    options.chart.foreColor = foreColor
    options.theme.palette = palette

    return options
  }

  predefined() {
    const palette = this.w.config.theme.palette
    const palettes = getThemePalettes()
    return (
      /** @type {Record<string,any>} */ (palettes)[palette] || palettes.palette1
    )
  }
}
