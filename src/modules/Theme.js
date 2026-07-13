// @ts-check
import Utils from '../utils/Utils'
import { getThemePalettes } from '../utils/ThemePalettes.js'
import { readTokens } from './theme/Tokens.js'
import { getTheme } from './ThemeRegistry.js'

/**
 * ApexCharts Theme Class for setting the colors and palettes.
 *
 * @module Theme
 **/

// Facet (#13): default sentinels. A `--apx-*` token replaces a chrome value
// ONLY while it still equals its built-in default, so an explicit user config
// (which is not one of these) always wins over a token.
const DEFAULT_FORECOLOR_LIGHT = '#373d3f'
const DEFAULT_FORECOLOR_DARK = '#f6f7f8'
const DEFAULT_AXIS_GRID = '#e0e0e0'

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
    /** @type {{accent?:string, fore?:string, grid?:string, surface?:string, series?:string[]}} */
    this._tokens = {}
    /** @type {any} */
    this._namedTheme = null
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

    // Facet (#13): resolve a registered named theme (theme.name) and apply its
    // mode / monochrome / accessibility BEFORE the class + mode defaults, but
    // only where the user (or the OS watcher) has not already set them.
    this._namedTheme = getTheme(w.config.theme.name)
    this._applyNamedThemeMode()

    w.dom.elWrap.classList.add(
      `apexcharts-theme-${w.config.theme.mode || 'light'}`,
    )

    // Facet (#13): apply the concrete dark/light foreColor + palette defaults
    // for the CURRENT mode. Config-time (checkForDarkTheme) and update-time
    // (updateThemeOptions) both do this, but a mode set late in create() (the
    // theme.follow:'os' watcher runs in _initOptionalModules, after config) has
    // no other chance. Sentinel-gated, so it is a no-op when the value is
    // already correct or explicitly overridden.
    this._applyModeDefaults()

    // Facet (#13): resolve tokens (CSS `--apx-*` layered over the named theme's
    // tokens). They top the resolution chain (below explicit config) for the
    // palette (predefined) and the chrome.
    this._tokens = this._resolveTokens()
    this.applyTokenChrome(this._tokens)

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
   * Facet (#13): normalize the mode's concrete defaults (foreColor + palette +
   * tooltip theme) at render time. Only overwrites a value still at its
   * opposite-mode default sentinel, so an explicit user value or a value
   * already normalized by checkForDarkTheme/updateThemeOptions is untouched.
   */
  _applyModeDefaults() {
    const w = this.w
    const mode = w.config.theme.mode
    if (mode === 'dark') {
      if (w.config.chart.foreColor === DEFAULT_FORECOLOR_LIGHT) {
        w.config.chart.foreColor = DEFAULT_FORECOLOR_DARK
      }
      if (w.config.theme.palette === 'palette1') {
        w.config.theme.palette = 'palette4'
      }
      if (w.config.tooltip && w.config.tooltip.theme !== 'light') {
        w.config.tooltip.theme = 'dark'
      }
    } else if (mode === 'light') {
      if (w.config.chart.foreColor === DEFAULT_FORECOLOR_DARK) {
        w.config.chart.foreColor = DEFAULT_FORECOLOR_LIGHT
      }
      if (w.config.theme.palette === 'palette4') {
        w.config.theme.palette = 'palette1'
      }
    }
  }

  /**
   * Facet (#13): apply a registered named theme's mode / accessibility /
   * monochrome, each only when the user (or the OS watcher) has not set it, so
   * explicit config and `follow:'os'` both win over the named theme.
   */
  _applyNamedThemeMode() {
    const named = this._namedTheme
    if (!named) return
    const theme = this.w.config.theme
    if (named.mode && !theme.mode) {
      theme.mode = named.mode
    }
    if (
      named.accessibility &&
      named.accessibility.colorBlindMode &&
      !(theme.accessibility && theme.accessibility.colorBlindMode)
    ) {
      theme.accessibility = theme.accessibility || {}
      theme.accessibility.colorBlindMode = named.accessibility.colorBlindMode
    }
    if (
      named.monochrome &&
      named.monochrome.enabled &&
      !theme.monochrome.enabled
    ) {
      theme.monochrome = { ...theme.monochrome, ...named.monochrome }
    }
  }

  /**
   * Facet (#13): the effective token set. CSS `--apx-*` tokens (when enabled)
   * layer over the named theme's `tokens`, so a page-level token overrides a
   * registered brand default.
   * @returns {{accent?:string, fore?:string, grid?:string, surface?:string, series?:string[]}}
   */
  _resolveTokens() {
    const named = (this._namedTheme && this._namedTheme.tokens) || {}
    const css = this._shouldUseTokens() ? readTokens(this.w) : {}
    return { ...named, ...css }
  }

  /**
   * Facet (#13): tokens are on unless explicitly disabled (`theme.tokens:false`).
   * `'auto'` (default) and `true` both read; `readTokens` returns only the
   * tokens actually present, so absence is a no-op.
   * @returns {boolean}
   */
  _shouldUseTokens() {
    return this.w.config.theme.tokens !== false
  }

  /**
   * Facet (#13): overwrite chrome defaults with `--apx-*` tokens, but only where
   * the value still equals its built-in default (so explicit config wins).
   * @param {{fore?:string, grid?:string, surface?:string}} tokens
   */
  applyTokenChrome(tokens) {
    if (!tokens) return
    const w = this.w

    if (
      tokens.fore &&
      (w.config.chart.foreColor === DEFAULT_FORECOLOR_LIGHT ||
        w.config.chart.foreColor === DEFAULT_FORECOLOR_DARK)
    ) {
      // axis labels + legend text funnel to chart.foreColor
      w.config.chart.foreColor = tokens.fore
    }

    if (tokens.grid) {
      if (w.config.grid.borderColor === DEFAULT_AXIS_GRID) {
        w.config.grid.borderColor = tokens.grid
      }
      /** @param {any} axis */
      const applyAxis = (axis) => {
        if (!axis) return
        if (axis.axisBorder && axis.axisBorder.color === DEFAULT_AXIS_GRID) {
          axis.axisBorder.color = tokens.grid
        }
        if (axis.axisTicks && axis.axisTicks.color === DEFAULT_AXIS_GRID) {
          axis.axisTicks.color = tokens.grid
        }
      }
      applyAxis(w.config.xaxis)
      if (Array.isArray(w.config.yaxis)) {
        w.config.yaxis.forEach(applyAxis)
      } else {
        applyAxis(w.config.yaxis)
      }
    }

    if (tokens.surface && !w.config.chart.background) {
      w.config.chart.background = tokens.surface
      // The SVG paper background is set in Core.setupElements, which runs before
      // Theme.init, so re-apply the resolved surface to the paper node here.
      const paperNode = w.dom.Paper && w.dom.Paper.node
      if (paperNode && paperNode.style) {
        paperNode.style.background = tokens.surface
      }
    }
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
    const builtin =
      /** @type {Record<string,any>} */ (palettes)[palette] || palettes.palette1

    // Facet (#13): tokens top the palette chain (below explicit config colors,
    // which are handled by getColors before this runs).
    const tokens = this._tokens || {}
    if (Array.isArray(tokens.series) && tokens.series.length) {
      // an explicit --apx-series-* palette
      return tokens.series.slice()
    }
    if (tokens.accent) {
      // a single brand accent seeds colors[0]; the built-in palette fills the
      // rest so multi-series charts keep distinct hues
      return [tokens.accent, ...builtin]
    }
    // Facet (#13): a registered named theme's palette (below tokens).
    const named = this._namedTheme
    if (named && Array.isArray(named.palette) && named.palette.length) {
      return named.palette.slice()
    }
    return builtin
  }
}
