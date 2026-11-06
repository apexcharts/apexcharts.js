// @ts-check
import { getTheme, readTokens, resolveOwnedRole } from 'apex-commons'
import Utils from '../utils/Utils'
import { getThemePalettes } from '../utils/ThemePalettes.js'
import { BrowserAPIs } from '../ssr/BrowserAPIs'

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

// Payloads updateThemeOptions filled mode defaults into, and which ones.
/** @type {WeakMap<object, {foreColor: boolean, tooltip: boolean}>} */
const MODE_FILLED = new WeakMap()

export default class Theme {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w
    this.colors = []
    this.isColorFn = false
    this.isHeatmapDistributed = false
    this.isBarDistributed = false
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

    // This instance serves every render, so whatever the last config decided
    // is re-read here rather than cached from construction.
    this.isColorFn = false
    this.isHeatmapDistributed = this.checkHeatmapDistributed()
    this.isBarDistributed = this.checkBarDistributed()

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
    // no other chance. A no-op when the value is already correct or the page
    // named it (globals.themeForeColorExplicit and friends).
    this._applyModeDefaults()

    // Facet (#13): resolve tokens (CSS `--apx-*` layered over the named theme's
    // tokens). They top the resolution chain (below explicit config) for the
    // palette (predefined) and the chrome.
    this._tokens = this._resolveTokens()
    this.applyTokenChrome(this._tokens)
    // After the token pass, which may have set or given back chart.background.
    this.applyModePaper()

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
   * opposite-mode default sentinel, so a value already normalized by
   * checkForDarkTheme/updateThemeOptions is untouched. The palette is left
   * alone altogether once the page has named one: palette1 and palette4 are
   * ordinary choices too, and a sentinel check alone cannot tell them from
   * the defaults.
   */
  _applyModeDefaults(mode = this.w.config.theme.mode) {
    const w = this.w
    this.applyModePalette(mode)
    // The same holds for a foreColor the page named: '#373d3f' on a dark
    // chart is a choice, not the light default left behind.
    const fore = !w.globals.themeForeColorExplicit
    const tooltip = w.config.tooltip
    if (mode === 'dark') {
      if (fore && w.config.chart.foreColor === DEFAULT_FORECOLOR_LIGHT) {
        w.config.chart.foreColor = DEFAULT_FORECOLOR_DARK
      }
      // A tooltip theme the page did not name goes dark with the mode,
      // however the mode arrived. Options defaults it to 'light', so a
      // sentinel check alone never fired for a named dark theme or
      // theme.follow 'os'. Nothing is forced in light mode: pie, donut and
      // polarArea default to a dark tooltip there.
      if (
        tooltip &&
        (tooltip.theme !== 'light' || !this._tooltipThemeExplicit())
      ) {
        tooltip.theme = 'dark'
      }
    } else if (mode === 'light') {
      if (fore && w.config.chart.foreColor === DEFAULT_FORECOLOR_DARK) {
        w.config.chart.foreColor = DEFAULT_FORECOLOR_LIGHT
      }
    }
  }

  /**
   * Whether the tooltip theme is the page's: named in its options, window.Apex
   * or an updateOptions payload, or set by a responsive breakpoint, which the
   * mode must not override while it applies.
   * @returns {boolean}
   */
  _tooltipThemeExplicit() {
    const w = this.w
    // responsiveTooltipTheme is set by Responsive.checkResponsiveConfig, true
    // only while a matching breakpoint writes tooltip.theme.
    return (
      !!w.globals.tooltipThemeExplicit || !!w.globals.responsiveTooltipTheme
    )
  }

  /**
   * Paint the SVG paper for the final mode. Core.setupElements paints it
   * first, before a named theme (or the take-back of one) has settled the
   * mode, which left a named dark theme on a transparent paper until the
   * next render. Same rule as there: chart.background, a token surface
   * included (applyTokenChrome writes it into the same field), wins.
   */
  applyModePaper() {
    const w = this.w
    const node = w.dom.Paper && w.dom.Paper.node
    if (!node || !node.style) return
    const mode = w.config.theme.mode
    const bg = w.config.chart.background
    node.style.background =
      mode === 'dark' && !bg ? '#343A3F' : mode === 'light' && !bg ? '#fff' : bg
  }

  /**
   * Move a chart that never named a palette onto the default of `mode`
   * (palette4 in dark mode, palette1 in light mode). A palette the page named,
   * in its options, in window.Apex or in an updateOptions payload, is kept
   * whatever the mode, palette1 and palette4 included.
   *
   * @param {string} [mode]
   */
  applyModePalette(mode = this.w.config.theme.mode) {
    const w = this.w
    if (w.globals.themePaletteExplicit) return
    if (mode === 'dark' && w.config.theme.palette === 'palette1') {
      w.config.theme.palette = 'palette4'
    } else if (mode === 'light' && w.config.theme.palette === 'palette4') {
      w.config.theme.palette = 'palette1'
    }
  }

  /**
   * Facet (#13): apply a registered named theme's mode / accessibility /
   * monochrome, each only when the user (or the OS watcher) has not set it, so
   * explicit config and `follow:'os'` both win over the named theme.
   */
  _applyNamedThemeMode() {
    const w = this.w
    const theme = w.config.theme
    const prev = w.globals.namedThemeApplied || {}
    /** @type {{mode?: string, accessibility?: string, monochrome?: any}} */
    const applied = (w.globals.namedThemeApplied = {})
    // Take back what the previous named theme wrote, where config still holds
    // it, so switching themes does not inherit the old one's mode or colours.
    // The tooltip theme goes back to light with the mode, unless the page
    // named it. This write is the library's, so it does not count as named:
    // a following dark theme still darkens it (see _applyModeDefaults).
    if (prev.mode && theme.mode === prev.mode) {
      theme.mode = ''
      this._applyModeDefaults('light')
      if (w.config.tooltip && !this._tooltipThemeExplicit()) {
        w.config.tooltip.theme = 'light'
      }
    }
    if (
      prev.accessibility &&
      theme.accessibility?.colorBlindMode === prev.accessibility
    ) {
      theme.accessibility.colorBlindMode = ''
    }
    if (prev.monochrome && theme.monochrome.enabled) {
      theme.monochrome = prev.monochrome
    }

    const named = this._namedTheme
    if (!named) return
    if (named.mode && !theme.mode) {
      theme.mode = applied.mode = named.mode
    }
    if (
      named.accessibility &&
      named.accessibility.colorBlindMode &&
      !(theme.accessibility && theme.accessibility.colorBlindMode)
    ) {
      theme.accessibility = theme.accessibility || {}
      theme.accessibility.colorBlindMode = applied.accessibility =
        named.accessibility.colorBlindMode
    }
    if (
      named.monochrome &&
      named.monochrome.enabled &&
      !theme.monochrome.enabled
    ) {
      applied.monochrome = theme.monochrome
      theme.monochrome = { ...theme.monochrome, ...named.monochrome }
    }
  }

  /**
   * Facet (#13): the effective token set. CSS `--apx-*` tokens (when enabled)
   * layer over the named theme's `tokens`, so a page-level token overrides a
   * registered brand default.
   *
   * Custom properties inherit, so reading them off `w.dom.elWrap` (appended
   * to the user's container during `Core.setupElements`, before `Theme.init`)
   * or the host element resolves tokens declared anywhere up the tree,
   * including `:root` and rules scoped to the theme class added above. The
   * read goes through `BrowserAPIs`, whose empty declaration server side reads
   * as no tokens, so the built-in defaults render there.
   * @returns {{accent?:string, fore?:string, grid?:string, surface?:string, series?:string[]}}
   */
  _resolveTokens() {
    const w = this.w
    const named = (this._namedTheme && this._namedTheme.tokens) || {}
    const css = this._shouldUseTokens()
      ? readTokens(w.dom && (w.dom.elWrap || w.dom.baseEl), {
          // The `{}` BrowserAPIs answers server side reads as no declaration.
          host: /** @type {any} */ (BrowserAPIs),
        })
      : {}
    return { ...named, ...css }
  }

  /**
   * Facet (#13): tokens are on unless explicitly disabled (`theme.tokens:false`).
   * `true` is the default (the legacy `'auto'` value is accepted and means the
   * same); `readTokens` returns only the tokens actually present, so absence
   * is a no-op.
   * @returns {boolean}
   */
  _shouldUseTokens() {
    return this.w.config.theme.tokens !== false
  }

  /**
   * Facet (#13): overwrite chrome defaults with `--apx-*` tokens, but only where
   * the value still equals its built-in default or the token this chart wrote
   * last (so explicit config wins). The ownership rules are the shared
   * `resolveOwnedRole` from apex-commons.
   * @param {{fore?:string, grid?:string, surface?:string}} tokens
   */
  applyTokenChrome(tokens) {
    if (!tokens) return
    const w = this.w
    const g = w.globals
    const last = g.tokenChrome || {}
    const dark = w.config.theme.mode === 'dark'

    // A token value written into config looks like a user value on the next
    // render, so each role remembers what it wrote: our own value stays
    // replaceable by a changed token (refreshTokens(), an OS flip) and falls
    // back to the first default once the token is gone, while an explicit
    // value always wins. Every slot of a role resolves against the one
    // snapshot, so the number and order of y axes cannot make it stale.
    /**
     * @param {'fore' | 'grid'} role
     * @param {any[][]} slots [object, key] pairs; a missing object is skipped
     * @param {string[]} defaults the values that count as unset
     */
    const own = (role, slots, defaults) => {
      const live = slots.filter((s) => s[0])
      const res = resolveOwnedRole({
        slots: live.map(([obj, key]) => ({ current: obj[key] })),
        value: tokens[role],
        last: last[role],
        defaults,
      })
      live.forEach(([obj, key], i) => {
        if (res.changed[i]) obj[key] = res.values[i]
      })
      return res.last
    }

    // axis labels + legend text funnel to chart.foreColor. A foreColor the
    // page named that equals the OTHER mode's default ('#373d3f' on a dark
    // chart) is a choice and is kept; one equal to this mode's default is
    // replaceable like the grid defaults below, so the token still wins.
    const foreDef = dark ? DEFAULT_FORECOLOR_DARK : DEFAULT_FORECOLOR_LIGHT
    const fore = own(
      'fore',
      [[w.config.chart, 'foreColor']],
      g.themeForeColorExplicit
        ? [foreDef]
        : [foreDef, dark ? DEFAULT_FORECOLOR_LIGHT : DEFAULT_FORECOLOR_DARK],
    )
    const gridSlots = [[w.config.grid, 'borderColor']]
    const axes = /** @type {any[]} */ ([w.config.xaxis]).concat(w.config.yaxis)
    axes.forEach((axis) => {
      if (axis) {
        gridSlots.push([axis.axisBorder, 'color'], [axis.axisTicks, 'color'])
      }
    })
    g.tokenChrome = {
      fore,
      grid: own('grid', gridSlots, [DEFAULT_AXIS_GRID]),
    }

    // `chart.background` defaults to '', so '' is its only unset value, and
    // a background the token wrote is given back as '' once the token is
    // gone. applyModePaper repaints the paper node from the result.
    const surface = resolveOwnedRole({
      slots: [{ current: w.config.chart.background || '' }],
      value: tokens.surface,
      last: g.tokenSurface,
      defaults: [''],
      remember: 'written',
    })
    if (surface.changed[0]) w.config.chart.background = surface.values[0]
    g.tokenSurface = surface.last
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
        ? this.distributedCount()
        : series.length
    const part = 1 / (glsCnt / shadeIntensity)
    let percent = 0

    // Resolved inside the chart, so a var() scoped to its container is found.
    const el = this.w.dom.elWrap
    return Array.from({ length: glsCnt }, () => {
      const newColor =
        shadeTo === 'dark'
          ? utils.shadeColor(percent * -1, color, el)
          : utils.shadeColor(percent, color, el)
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
          ? this.isColorFn && w.config.colors
            ? w.config.colors.slice()
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
      len = this.distributedCount()
    }

    if (colorSeries.length < len) {
      const diff = len - colorSeries.length
      for (let i = 0; i < diff; i++) {
        colorSeries.push(colorSeries[i])
      }
    }
  }

  /**
   * How many colours a distributed chart needs: one per point of the longest
   * series, for every series. 0 for an empty chart.
   * @returns {number}
   */
  distributedCount() {
    const series = this.w.seriesData.series
    return series.length
      ? series[this.w.globals.maxValsInArrayIndex].length * series.length
      : 0
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
    const mode = options.theme.mode
    // A key this call passes belongs to the user now, so a later named-theme
    // switch must not revert it.
    const applied = this.w.globals.namedThemeApplied
    for (const k in applied) {
      if (options.theme[k] !== undefined) delete /** @type {any} */ (applied)[k]
    }
    // An empty palette (`palette: undefined` or null, as a serialised options
    // object sends it) is not given: merged in, it left the chart with no
    // palette at all. Copied first, so the caller's object is not touched.
    if ('palette' in options.theme && !options.theme.palette) {
      options = { ...options, theme: { ...options.theme } }
      delete options.theme.palette
    }
    // Only a mode change re-derives the mode defaults. A palette, monochrome
    // or name update keeps the tooltip and foreColor the chart already has,
    // and a value passed in the same call always wins.
    if (mode === undefined) return options
    // Copies: the defaults below must not land in the caller's object, where
    // a reused payload would carry them into the next call as its own.
    options = { ...options, theme: { ...options.theme } }
    options.chart = { ...options.chart }
    options.tooltip = { ...options.tooltip }
    const dark = mode === 'dark'

    // Recorded before filling, so _updateOptions can tell the defaults
    // written here from values the page passed (see modeDefaultsFilled).
    MODE_FILLED.set(options, {
      foreColor: !options.chart.foreColor,
      tooltip: !options.tooltip.theme,
    })
    options.tooltip.theme = options.tooltip.theme || mode || 'light'
    options.chart.foreColor =
      options.chart.foreColor ||
      (dark ? DEFAULT_FORECOLOR_DARK : DEFAULT_FORECOLOR_LIGHT)
    // No palette is filled in. A palette in the payload is how
    // _updateOptions learns the page chose one, so a default written here
    // would pin it; a chart that never chose one is moved onto the new mode's
    // default by applyModePalette once the payload is merged.

    return options
  }

  /**
   * Which of chart.foreColor and tooltip.theme updateThemeOptions filled into
   * `options` with the mode's default, as opposed to the page passing them.
   * Undefined for a payload it did not fill.
   *
   * @param {any} options  a payload updateThemeOptions returned
   * @returns {{foreColor: boolean, tooltip: boolean} | undefined}
   */
  static modeDefaultsFilled(options) {
    return options && typeof options === 'object'
      ? MODE_FILLED.get(options)
      : undefined
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
