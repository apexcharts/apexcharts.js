// @ts-check
import {
  completeSeries,
  fillVariantMode,
  getTheme,
  layerValue,
  modePaper,
  readDesignSystemLayer,
  readTokens,
  resolveOwnedRole,
  takeBackVariantMode,
} from 'apex-commons'
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
const DEFAULT_FONT_FAMILY = 'Helvetica, Arial, sans-serif'
// The paper of a dark mode the page chose.
const DARK_PAPER = '#343A3F'

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
    /** @type {import('apex-commons').TokenLayers} */
    this._layers = { css: {}, named: {}, designSystem: null }
    /**
     * The design system (Ignite UI) the last render read, null when absent
     * or switched off. Exports reads its paper for a raster base.
     * @type {import('apex-commons').DesignSystemLayer | null}
     */
    this.designSystem = null
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

    // Plan 36: the design system (Ignite UI) is read before the theme class
    // goes on, so its variant can still settle the mode the class names. Its
    // tokens live on :root, which the class does not touch. One declaration
    // serves this read and the `--apx-*` one below; it is live, so that read
    // still sees page rules scoped to the class.
    const el = w.dom && (w.dom.elWrap || w.dom.baseEl)
    const cs = this._shouldUseTokens() ? this._declaration(el) : null
    const ds = (this.designSystem = this._readDesignSystem(el, cs))

    // Facet (#13): resolve a registered named theme (theme.name) and apply its
    // mode / monochrome / accessibility BEFORE the class + mode defaults, but
    // only where the user (or the OS watcher) has not already set them. The
    // design system's variant fills a mode still unset after that.
    this._namedTheme = getTheme(w.config.theme.name)
    this._applyNamedThemeMode(ds)

    w.dom.elWrap.classList.add(
      `apexcharts-theme-${w.config.theme.mode || 'light'}`,
    )
    // Plan 36 (1D): the stylesheet's design-system twins key off these
    // classes, so they go on only while the design system's colours apply:
    // present, switched on, not bypassed by colorBlindMode or monochrome. The
    // variant class keeps the overlay and grey twins to the parts drawn in
    // the sheet's own variant (the D6 gate); a missing variant is light.
    const dsColors = this._designSystemColors(ds)
    if (dsColors) {
      w.dom.elWrap.classList.add(
        'apexcharts-igniteui',
        `apexcharts-igniteui-${dsColors.variant || 'light'}`,
      )
    }

    // Facet (#13): apply the concrete dark/light foreColor + palette defaults
    // for the CURRENT mode. Config-time (checkForDarkTheme) and update-time
    // (updateThemeOptions) both do this, but a mode set late in create() (the
    // theme.follow:'os' watcher runs in _initOptionalModules, after config) has
    // no other chance. A no-op when the value is already correct or the page
    // named it (globals.themeForeColorExplicit and friends).
    this._applyModeDefaults()

    // Facet (#13): resolve tokens (CSS `--apx-*` layered over the named theme's
    // tokens, then the design system). They rank below explicit config for
    // the palette (predefined) and the chrome.
    this._layers = this._resolveTokenLayers(el, cs, ds)
    this._tokens = { ...this._layers.named, ...this._layers.css }
    this.applyTokenChrome(this._layers)
    this._applyRadiusFactor()
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
   * next render. Same rule as there (Theme.modePaper).
   */
  applyModePaper() {
    const w = this.w
    const node = w.dom.Paper && w.dom.Paper.node
    if (!node || !node.style) return
    node.style.background = Theme.modePaper(w)
  }

  /**
   * The on-screen paper, for Core.setupElements and applyModePaper alike.
   * chart.background, a token surface included (applyTokenChrome writes it
   * into the same field), wins. Otherwise a dark mode the page chose gets the
   * dark paper and an explicit light mode white, while a dark mode the design
   * system's variant filled stays transparent: the page's own surface shows
   * through, as it does under a chart with no mode.
   *
   * @param {import('../types/internal').ChartStateW} w
   * @returns {string}
   */
  static modePaper(w) {
    return modePaper({
      background: w.config.chart.background,
      mode: w.config.theme.mode,
      fromVariant: !!w.globals.variantModeApplied,
      dark: DARK_PAPER,
      light: '#fff',
    })
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
   *
   * Plan 36 (D6): then the design system's variant fills a mode nobody set.
   * Both take-backs run before either fill, so a dark mode a newly named
   * theme brings is never undone by the variant's take-back.
   *
   * @param {import('apex-commons').DesignSystemLayer | null} [ds]
   */
  _applyNamedThemeMode(ds = null) {
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
    this._takeBackVariantMode(ds)

    const named = this._namedTheme
    if (named) {
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

    // A dark variant fills a mode nobody set, and the record keeps the
    // tooltip theme it is about to darken. A light one writes nothing: an
    // unset mode already renders light, and 'light' would paint a white
    // paper, a visible box on a design-system card.
    const filled = fillVariantMode({
      mode: theme.mode,
      followsOS: theme.follow === 'os',
      variant: ds && ds.variant,
      state: w.config.tooltip && w.config.tooltip.theme,
    })
    if (filled) {
      theme.mode = 'dark'
      w.globals.variantModeApplied = filled
    }
  }

  /**
   * Plan 36 (D6): give back a dark mode the design system's variant filled
   * on an earlier render, once the sheet is no longer dark (turned light,
   * removed, or switched off). The light defaults run, since those of an
   * unset mode change nothing, and the tooltip gets back the theme it had,
   * which keeps pie, donut and polarArea on their dark default. While the
   * sheet stays dark the mode stays the variant's, unless a named theme
   * brings a mode, which ranks above the variant (D5), or the page switched
   * to `follow:'os'`, which the variant never fills under. Either way the
   * mode goes back first, so the named theme fills it, and under `follow:'os'`
   * it is left as unset as it was before the variant came.
   *
   * @param {import('apex-commons').DesignSystemLayer | null} ds
   */
  _takeBackVariantMode(ds) {
    const w = this.w
    const theme = w.config.theme
    const record = w.globals.variantModeApplied
    w.globals.variantModeApplied = undefined
    const back = takeBackVariantMode({ mode: theme.mode, record })
    if (!back.takeBack) return
    const named = this._namedTheme
    if (
      ds &&
      ds.variant === 'dark' &&
      theme.follow !== 'os' &&
      !(named && named.mode)
    ) {
      w.globals.variantModeApplied = record
      return
    }
    theme.mode = ''
    this._applyModeDefaults('light')
    if (w.config.tooltip && !this._tooltipThemeExplicit()) {
      w.config.tooltip.theme = back.state || 'light'
    }
  }

  /**
   * Facet (#13): the token layers, kept apart: CSS `--apx-*` tokens (when
   * enabled), the named theme's `tokens`, and the design system (`ds`, read
   * earlier). A page-level token overrides a registered brand default, and
   * both override the design system.
   *
   * Custom properties inherit, so reading them off `w.dom.elWrap` (appended
   * to the user's container during `Core.setupElements`, before `Theme.init`)
   * or the host element resolves tokens declared anywhere up the tree,
   * including `:root` and rules scoped to the theme class added above. The
   * read goes through `BrowserAPIs`, whose empty declaration server side reads
   * as no tokens, so the built-in defaults render there.
   *
   * @param {Element | null | undefined} el
   * @param {any} cs  the declaration fetched for `el`, or null
   * @param {import('apex-commons').DesignSystemLayer | null} ds
   * @returns {import('apex-commons').TokenLayers}
   */
  _resolveTokenLayers(el, cs, ds) {
    const named = (this._namedTheme && this._namedTheme.tokens) || {}
    const css = this._shouldUseTokens()
      ? readTokens(el, {
          // The `{}` BrowserAPIs answers server side reads as no declaration.
          host: /** @type {any} */ (BrowserAPIs),
          cs,
        })
      : {}
    return { css, named, designSystem: ds }
  }

  /**
   * The computed style the token reads share, so a render fetches it once.
   * Null when it cannot be had; the readers then ask the host themselves.
   *
   * @param {Element | null | undefined} el
   * @returns {any}
   */
  _declaration(el) {
    if (!el) return null
    try {
      return BrowserAPIs.getComputedStyle(/** @type {HTMLElement} */ (el))
    } catch (e) {
      return null
    }
  }

  /**
   * Plan 36: the design system's layer, Ignite UI's `--ig-*` tokens (rank 5,
   * below explicit config, `--apx-*` and a named theme or palette). Off with
   * `theme.tokens: false` or `theme.designSystem: false`. On a page without
   * it the read stops after the two probe reads; server side it reads
   * nothing.
   *
   * @param {Element | null | undefined} el
   * @param {any} cs  the declaration fetched for `el`, or null
   * @returns {import('apex-commons').DesignSystemLayer | null}
   */
  _readDesignSystem(el, cs) {
    const theme = /** @type {any} */ (this.w.config.theme)
    if (!this._shouldUseTokens() || theme.designSystem === false) return null
    return readDesignSystemLayer(el, {
      host: /** @type {any} */ (BrowserAPIs),
      cs,
    })
  }

  /**
   * The design system as far as colours go: colorBlindMode and monochrome
   * bypass it, as they bypass every colour token. Its variant and font
   * still apply.
   * @returns {import('apex-commons').DesignSystemLayer | null}
   */
  _designSystemColors(ds = this._layers.designSystem) {
    const theme = this.w.config.theme
    return theme.accessibility?.colorBlindMode || theme.monochrome?.enabled
      ? null
      : ds
  }

  /**
   * Plan 36 (1E): `--apx-radius-factor` as the number `Theme.radius` scales
   * the JS radii by, read with the other tokens. 1 when it is unset or not a
   * number, as the stylesheet's `var(--apx-radius-factor, 1)`; never below
   * 0, where CSS clamps a radius too. With `theme.tokens: false` the
   * stylesheet's two family tokens fall back to their defaults as well.
   */
  _applyRadiusFactor() {
    const w = this.w
    const v = this._layers.css.radiusFactor
    const n = v ? Number(v) : 1
    w.globals.radiusFactor = isFinite(n) ? Math.max(0, n) : 1
    const style = /** @type {any} */ (w.dom.elWrap).style
    if (!this._shouldUseTokens() && style && style.setProperty) {
      style.setProperty('--apx-font-family', 'initial')
      style.setProperty('--apx-radius-factor', 'initial')
    }
  }

  /**
   * Plan 36 (1E): a radius drawn in JS, `px` at the default factor, scaled
   * by `--apx-radius-factor` as the stylesheet's radii are.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} px
   * @returns {number}
   */
  static radius(w, px) {
    const f = w.globals.radiusFactor
    return f == null ? px : px * f
  }

  /**
   * Plan 36: the font the token layers give `el` under `w`'s theme options
   * (`--apx-font-family`, then a named theme's, then the design system's),
   * or undefined. For a trellis host, which runs no Theme of its own but
   * wraps panels that take this font.
   * @param {import('../types/internal').ChartStateW} w
   * @param {Element} el
   * @returns {string | undefined}
   */
  static tokenFont(w, el) {
    const t = new Theme(w)
    t._namedTheme = getTheme(w.config.theme.name)
    const cs = t._shouldUseTokens() ? t._declaration(el) : null
    const ds = t._readDesignSystem(el, cs)
    return layerValue(t._resolveTokenLayers(el, cs, ds), 'font')
  }

  /**
   * Facet (#13): tokens are on unless explicitly disabled (`theme.tokens:false`).
   * `true` is the default (the legacy `'auto'` value is accepted and means the
   * same); `readTokens` returns only the tokens actually present, so absence
   * is a no-op. Off, it skips the design system as well, variant included; a
   * named theme's tokens still apply.
   * @returns {boolean}
   */
  _shouldUseTokens() {
    return this.w.config.theme.tokens !== false
  }

  /**
   * Facet (#13): overwrite chrome defaults with the token layers (`--apx-*`,
   * then a named theme's tokens, then the design system), but only where the
   * page did not name the value and it still equals its built-in default or
   * the token this chart wrote last. The ownership rules are the shared
   * `resolveOwnedRole` from apex-commons.
   * @param {import('apex-commons').TokenLayers} layers
   */
  applyTokenChrome(layers) {
    if (!layers) return
    const w = this.w
    const g = w.globals
    const last = g.tokenChrome || {}
    const mode = w.config.theme.mode
    const dark = mode === 'dark'
    // The design system's text and hairlines apply only in its own variant
    // (a dark sheet's gray-800 is a light grey), and not at all where
    // colorBlindMode or monochrome bypass colour tokens.
    const colorLayers = { ...layers, designSystem: this._designSystemColors() }

    // A token value written into config looks like a user value on the next
    // render, so each role remembers what it wrote: our own value stays
    // replaceable by a changed token (refreshTokens(), an OS flip) and falls
    // back to the first default once the token is gone, while a value the
    // page named always wins, its default included. Every slot of a role
    // resolves against the one snapshot, so the number and order of y axes
    // cannot make it stale.
    /**
     * @param {'fore' | 'grid' | 'font'} role
     * @param {string | undefined} value the winning layer value
     * @param {any[][]} slots [object, key, named] triples; a missing object is skipped
     * @param {string[]} defaults the values that count as unset
     */
    const own = (role, value, slots, defaults) => {
      const live = slots.filter((s) => s[0])
      const res = resolveOwnedRole({
        slots: live.map(([obj, key, named]) => ({
          current: obj[key],
          explicit: !!named,
        })),
        value,
        last: last[role],
        defaults,
      })
      live.forEach(([obj, key], i) => {
        if (res.changed[i]) obj[key] = res.values[i]
      })
      return res.last
    }

    // axis labels + legend text funnel to chart.foreColor. A foreColor the
    // page did not name counts as unset at either mode's default, since the
    // mode defaults may not have caught up with it yet.
    const foreDef = dark ? DEFAULT_FORECOLOR_DARK : DEFAULT_FORECOLOR_LIGHT
    const fore = own(
      'fore',
      layerValue(colorLayers, 'fore', { mode }),
      [[w.config.chart, 'foreColor', g.themeForeColorExplicit]],
      g.themeForeColorExplicit
        ? [foreDef]
        : [foreDef, dark ? DEFAULT_FORECOLOR_LIGHT : DEFAULT_FORECOLOR_DARK],
    )
    const gridNamed = g.themeGridColorsExplicit
    const gridSlots = [
      [w.config.grid, 'borderColor', gridNamed && gridNamed.grid],
    ]
    const axes = /** @type {any[]} */ ([w.config.xaxis]).concat(w.config.yaxis)
    axes.forEach((axis, i) => {
      if (axis) {
        const flags =
          gridNamed && (i ? gridNamed.yaxis[i - 1] : gridNamed.xaxis)
        gridSlots.push(
          [axis.axisBorder, 'color', flags && flags.border],
          [axis.axisTicks, 'color', flags && flags.ticks],
        )
      }
    })
    const grid = own(
      'grid',
      layerValue(colorLayers, 'grid', { mode }),
      gridSlots,
      [DEFAULT_AXIS_GRID],
    )
    // The font is not a colour, so the design system's applies whatever the
    // palette mode.
    const font = own(
      'font',
      layerValue(layers, 'font'),
      [[w.config.chart, 'fontFamily', g.themeFontFamilyExplicit]],
      [DEFAULT_FONT_FAMILY],
    )
    g.tokenChrome = { fore, grid, font }

    // `chart.background` defaults to '', so '' is its only unset value, and
    // a background the token wrote is given back as '' once the token is
    // gone. applyModePaper repaints the paper node from the result. The
    // design system never paints it.
    const surface = resolveOwnedRole({
      slots: [{ current: w.config.chart.background || '' }],
      value: layerValue(layers, 'surface'),
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
    // Filled to blend with the dark paper, so none where the paper stays
    // transparent: a dark mode the design system's variant filled.
    const dark = w.config.theme.mode === 'dark' && !w.globals.variantModeApplied
    w.globals.radarPolygons.fill.colors =
      w.config.plotOptions.radar.polygons.fill.colors === undefined
        ? [dark ? DARK_PAPER : 'none']
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
   * @param {boolean} [restoring]  a History restore is replaying a checkpoint
   */
  updateThemeOptions(options, restoring = false) {
    const mode = options.theme.mode
    // A key this call passes belongs to the user now, so a later named-theme
    // switch must not revert it.
    const applied = this.w.globals.namedThemeApplied
    for (const k in applied) {
      if (options.theme[k] !== undefined) delete /** @type {any} */ (applied)[k]
    }
    // So is a mode, 'dark' included: a light sheet no longer takes it back.
    // A History restore passes the mode its checkpoint drew and has already
    // put back whether the variant set it.
    if (mode !== undefined && !restoring) {
      this.w.globals.variantModeApplied = undefined
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

    // Plan 36: the design system's series (rank 5), completed row by row from
    // the built-in palette. Only when no named theme palette and no palette
    // the page named rank above it: series are taken whole, never mixed.
    const named = this._namedTheme
    const namedPalette =
      named && Array.isArray(named.palette) && named.palette.length
        ? named.palette
        : null
    const ds = this._designSystemColors()
    const dsSeries =
      ds && !namedPalette && !this.w.globals.themePaletteExplicit
        ? completeSeries(ds.series, builtin)
        : null

    // Facet (#13): tokens top the palette chain (below explicit config colors,
    // which are handled by getColors before this runs).
    const tokens = this._tokens || {}
    if (Array.isArray(tokens.series) && tokens.series.length) {
      // an explicit --apx-series-* palette
      return tokens.series.slice()
    }
    if (tokens.accent) {
      // a single brand accent seeds colors[0]; the design system's rows from
      // the second on, or else the built-in palette, fill the rest so
      // multi-series charts keep distinct hues
      return [tokens.accent, ...(dsSeries ? dsSeries.slice(1) : builtin)]
    }
    // Facet (#13): a registered named theme's palette (below tokens).
    if (namedPalette) return namedPalette.slice()
    return dsSeries || builtin
  }
}
