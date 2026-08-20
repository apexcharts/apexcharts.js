// @ts-check
/**
 * Trellis (#22): the orchestrator.
 *
 * A trellis is a coordination layer over REAL ApexCharts panels: the host
 * instance never runs its own render pipeline; this module owns the split
 * (TrellisSplit), the shared scales (TrellisScales), the grid (TrellisLayout),
 * the shared chrome (TrellisChrome) and the cross-panel state the group cannot
 * express (TrellisSync). Every panel is an ordinary chart joined into an
 * implicit `chart.group`, which is where tooltip fan-out, the crosshair sweep
 * and x-window zoom sync come from.
 *
 * Alignment contract (the feature's headline, spike 22a):
 *   - shared scales: identical `{min,max,tickAmount}` into every panel means
 *     identical geometry out, ragged data included, because the split has
 *     already re-emitted every panel against the union x list (D5).
 *   - independent y: mount hidden, measure `max(yLabelsCoords[0].width)`,
 *     push one `yaxis.labels.minWidth` to every panel (converges exactly in
 *     one pass, Q2), then reveal.
 *   - edge-label policy is CSS (a class on non-edge cells hides the label
 *     INK, never the label SPACE), so geometry stays uniform by construction
 *     and a resize that moves the bottom row re-renders nothing.
 *
 * Eager optional module (`ctx.trellis`), self-inert unless `config.trellis.by`
 * is set. The host's render()/destroy()/updateSeries() delegate here.
 *
 * @module modules/trellis/Trellis
 */
import ApexCharts from '../../apexcharts'
import Utils from '../../utils/Utils'
import { Environment } from '../../utils/Environment.js'
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import { addResizeListener, removeResizeListener } from '../../utils/Resize'
import RendererController from '../RendererController'
import {
  computeMarkCount,
  hasCanvasUnsupportedFeature,
} from '../../renderers/Renderer'
import { split as splitSeries } from './TrellisSplit'
import { pivotRows } from './pivotRows'
import * as TrellisScales from './TrellisScales'
import * as TrellisLayout from './TrellisLayout'
import TrellisChrome from './TrellisChrome'
import TrellisSync, { yaxisPayload } from './TrellisSync'
import TrellisVirtual from './TrellisVirtual'

/** Above this, `virtualize: 'auto'` mounts only the visible panels (P2). */
const EAGER_PANEL_BUDGET = 64

/** Above this, warn even when virtualized: point at trellis.limit. */
const HARD_PANEL_WARN = 256

/** Above this, panel mount animations default OFF (explicit user wins). */
const ANIMATION_PANEL_BUDGET = 16

/** The vertical-axis label pad inside the yLabelsCoords width (22a Q2). */
const Y_LABEL_PAD = 10

/**
 * Grid-level canvas auto-selection (P2, plan §7.12): a trellis is dense in
 * TOTAL, never per panel, so the per-chart `renderer: 'auto'` heuristic can
 * never trip inside a panel. Decide once over the whole grid's mark count
 * (same `computeMarkCount` heuristic, same `chart.rendererThreshold` knob)
 * and push an explicit uniform `renderer: 'canvas'` into every panel.
 * Declines when the user set `chart.renderer` themselves, when the canvas
 * feature is not registered, or when the config uses a canvas-unsupported
 * feature (each panel would warn-and-fall-back N times otherwise).
 *
 * @param {import('./TrellisSplit').TrellisSplitResult} split
 * @param {any} hostConfig the host's full w.config
 * @param {any} userOpts   the host's RAW user options (explicitness check)
 * @param {boolean} canvasRegistered
 * @returns {'canvas'|null}
 */
export function choosePanelRenderer(
  split,
  hostConfig,
  userOpts,
  canvasRegistered,
) {
  if (userOpts && userOpts.chart && userOpts.chart.renderer) return null
  if (!canvasRegistered) return null
  const shim = {
    config: {
      series: split.panels.reduce(
        (/** @type {any[]} */ acc, p) => acc.concat(p.series),
        [],
      ),
      chart: { type: hostConfig.chart.type },
      markers: hostConfig.markers,
      dataLabels: hostConfig.dataLabels,
      fill: hostConfig.fill,
      plotOptions: hostConfig.plotOptions,
      states: hostConfig.states,
    },
  }
  if (hasCanvasUnsupportedFeature(shim)) return null
  const threshold = hostConfig.chart.rendererThreshold || 8000
  return computeMarkCount(shim) >= threshold ? 'canvas' : null
}

export default class Trellis {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /**
     * Panel records. `wantMounted`/`viewStash` are virtualization state (P2):
     * the observer's latest verdict and the view captured at unmount.
     * @type {Array<{ key: string, index: number, el: HTMLElement|null, cellEl: HTMLElement|null, chart: any|null, empty: boolean, wantMounted?: boolean, viewStash?: any }>}
     */
    this.panels = []
    /** @type {import('./TrellisSplit').TrellisSplitResult|null} */
    this.split = null
    /** @type {ReturnType<typeof TrellisScales.resolve>|null} */
    this.scales = null
    /** @type {import('./TrellisLayout').TrellisLayoutResult|null} */
    this.layout = null
    /** @type {Record<string, any>} normalized trellis config */
    this.cfg = {}
    this.sync = new TrellisSync(this)
    this.chrome = new TrellisChrome(this)
    this.virtual = new TrellisVirtual(this)
    /** The panel constructor, exposed so TrellisVirtual stays import-light. */
    this._ApexCharts = ApexCharts
    /** @type {boolean} whether this render virtualizes (P2) */
    this._virtualActive = false
    /** @type {'canvas'|null} uniform panel renderer override (P2) */
    this._panelRenderer = null
    /** @type {HTMLElement|null} the outer trellis element (w.dom.elWrap) */
    this.elWrap = null
    /** @type {HTMLElement|null} */
    this.elGrid = null
    this._mounted = false
    this._rendering = false
    /** rAF handle for the coalesced relayout */
    this._raf = 0
    this._lastWidth = 0
    this._resizeHandler = this._onContainerResize.bind(this)
    this.autoScaleYaxis = false
    /** @type {HTMLElement|null} */
    this._elChromeTop = null
  }

  /** Whether this chart is a trellis host: `trellis.by` is the switch. */
  isActive() {
    const t = this.w.config.trellis
    return !!(t && t.by)
  }

  /** @returns {string} namespaced panel group id */
  _groupId() {
    return `${this.w.globals.chartID}-tg`
  }

  /**
   * Render the whole trellis into the host element. Called by the host's
   * render() INSTEAD of the normal create()/mount() pipeline.
   * @returns {Promise<void>}
   */
  async render() {
    const w = this.w
    if (this._mounted || this._rendering) return
    if (!Environment.isBrowser()) {
      console.warn(
        'ApexCharts: trellis rendering is browser-only in this version; SSR hosts render nothing.',
      )
      return
    }
    this._rendering = true
    try {
      this.cfg = w.config.trellis || {}
      this.autoScaleYaxis = !!w.config.chart?.zoom?.autoScaleYaxis

      // 0. Tidy-row input (P2): `trellis.data` rows pivot to series form and
      //    flow through the same proven split path. Rows win over `series`
      //    when both are given, so the two shapes can never half-merge.
      let inputSeries = w.config.series || []
      if (Array.isArray(this.cfg.data)) {
        const pivoted = pivotRows(this.cfg.data, this.cfg)
        pivoted.warnings.forEach((msg) => console.warn(`ApexCharts: ${msg}`))
        if (pivoted.series.length) {
          if (inputSeries.length) {
            console.warn(
              'ApexCharts: trellis received both `series` and `trellis.data`; using trellis.data.',
            )
          }
          inputSeries = pivoted.series
        }
      }

      // 1. Split (union x alignment included, 22a D5).
      const split = splitSeries(inputSeries, this.cfg)
      this.split = split
      split.warnings.forEach((msg) => console.warn(`ApexCharts: ${msg}`))
      if (!split.panels.length) return
      if (split.dropped > 0) {
        console.warn(
          `ApexCharts: trellis rendered ${split.panels.length} panels; ${split.dropped} more hidden by trellis.limit.`,
        )
      }

      // 1.5 Virtualization policy (P2): 'auto' virtualizes above the eager
      //     budget, true always, false never. Environments without
      //     IntersectionObserver warn and render eagerly.
      const vMode = this.cfg.virtualize ?? 'auto'
      let useVirtual =
        vMode === true ||
        (vMode === 'auto' && split.panels.length > EAGER_PANEL_BUDGET)
      if (useVirtual && !TrellisVirtual.supported()) {
        console.warn(
          'ApexCharts: trellis virtualization needs IntersectionObserver; rendering eagerly.',
        )
        useVirtual = false
      }
      this._virtualActive = useVirtual
      if (!useVirtual && split.panels.length > EAGER_PANEL_BUDGET) {
        console.warn(
          `ApexCharts: trellis with ${split.panels.length} panels renders eagerly; set trellis.virtualize (or trellis.limit).`,
        )
      }
      if (split.panels.length > HARD_PANEL_WARN) {
        console.warn(
          `ApexCharts: ${split.panels.length} trellis panels is a lot to read at once; consider trellis.limit.`,
        )
      }

      // 2. Shared scales.
      this.scales = TrellisScales.resolve(split, this.cfg, {
        chartType: w.config.chart.type,
        userColors: this.ctx.opts && this.ctx.opts.colors,
      })

      // 2.5 Renderer policy (P2): one uniform grid-level decision.
      this._panelRenderer = choosePanelRenderer(
        split,
        w.config,
        this.ctx.opts,
        RendererController._rendererRegistry.has('canvas'),
      )

      // 3. DOM skeleton + layout.
      this._buildSkeleton()
      const width = this._containerWidth()
      this._lastWidth = width
      this.layout = TrellisLayout.compute({
        panelCount: split.panels.length,
        containerWidth: width,
        cfg: this.cfg,
        hostHeight: this._hostHeight(),
      })
      this._applyGridStyle()
      this._buildCells()

      // 4. Mount panels.
      const independentY = (this.cfg.scales?.y || 'shared') === 'independent'
      const wrap = /** @type {HTMLElement} */ (this.elWrap)

      if (useVirtual) {
        // P2: mount only the panels intersecting the viewport (one-row
        // margin); the observer's initial callback mounts the visible set.
        // Headers plus fixed-height skeletons keep page height and scroll
        // position stable, and the independent-y gutter is a monotone floor
        // maintained per mount (TrellisVirtual).
        this.virtual.start()
      } else {
        // Eager path. Independent-y trellises mount hidden so the gutter
        // pass (22a Q2/Q3) never flashes a misaligned first paint.
        if (independentY) wrap.style.visibility = 'hidden'

        for (let i = 0; i < this.panels.length; i++) {
          const panel = this.panels[i]
          const opts = this._assemblePanelOptions(panel.index)
          const chart = new ApexCharts(
            /** @type {HTMLElement} */ (panel.el),
            opts,
          )
          panel.chart = chart
          await chart.render()
          this.ctx.events.fireEvent('panelMounted', [
            this.ctx,
            { key: panel.key, index: panel.index, chart },
          ])
        }

        // 5. Independent-y gutter pass: one measured minWidth, pushed to all,
        //    exact in one iteration by construction (max of measured widths).
        if (independentY) {
          await this._alignGutters()
          wrap.style.visibility = ''
        }
      }

      // 6. Shared chrome (title above, legend below, toolbar overlay), and
      //    the cross-panel crosshair sweep (the group's own fan-out assumes
      //    stacked charts; see TrellisSync.wireCrosshairs).
      this.chrome.buildTitle(/** @type {HTMLElement} */ (this._elChromeTop))
      this.chrome.buildToolbar(wrap)
      this.chrome.buildLegend(wrap)
      this.sync.wireCrosshairs(/** @type {HTMLElement} */ (this.elGrid))

      // 7. One ResizeObserver for the whole grid; panels have both
      //    redrawOn*Resize flags off, so this is the only relayout owner.
      addResizeListener(
        /** @type {HTMLElement} */ (this.ctx.el),
        this._resizeHandler,
      )

      this._mounted = true
      // The host never runs its own render pipeline, so nothing else would
      // ever flip its animationEnded flag; screenshot/e2e harnesses key on
      // it. Eager grids are done here; virtualized grids flip it when the
      // mount drain goes idle (TrellisVirtual).
      if (!useVirtual) w.globals.animationEnded = true
      this.ctx.events.fireEvent('trellisMounted', [
        this.ctx,
        { panels: this.getPanels() },
      ])
    } finally {
      this._rendering = false
    }
  }

  /** Container width the grid may use. */
  _containerWidth() {
    const el = /** @type {HTMLElement} */ (this.ctx.el)
    const rect = el.getBoundingClientRect()
    return rect.width || el.clientWidth || 800
  }

  /** Explicit numeric host height, if the user set one. */
  _hostHeight() {
    const h = this.w.config.chart && this.w.config.chart.height
    const n = typeof h === 'string' ? parseFloat(h) : h
    return typeof n === 'number' && isFinite(n) && n > 0 && String(h) !== 'auto'
      ? n
      : undefined
  }

  _buildSkeleton() {
    const el = /** @type {HTMLElement} */ (this.ctx.el)
    const wrap = BrowserAPIs.createElementNS(
      'http://www.w3.org/1999/xhtml',
      'div',
    )
    wrap.className = 'apexcharts-trellis'
    wrap.id = `apexcharts-trellis${this.w.globals.chartID}`
    wrap.setAttribute('data-tooltip-mode', this.cfg.tooltip || 'panel')

    const chromeTop = BrowserAPIs.createElement('div')
    chromeTop.className = 'apexcharts-trellis-chrome'
    wrap.appendChild(chromeTop)
    this._elChromeTop = chromeTop

    const grid = BrowserAPIs.createElement('div')
    grid.className = 'apexcharts-trellis-grid'
    wrap.appendChild(grid)

    el.appendChild(wrap)
    this.elWrap = wrap
    this.elGrid = grid

    // The license enforcer and Destroy both address the chart through
    // w.dom.elWrap / baseEl; the trellis wrapper IS this host's canvas.
    this.w.dom.baseEl = el
    this.w.dom.elWrap = wrap
  }

  _applyGridStyle() {
    const grid = /** @type {HTMLElement} */ (this.elGrid)
    const ly = /** @type {import('./TrellisLayout').TrellisLayoutResult} */ (
      this.layout
    )
    grid.style.display = 'grid'
    grid.style.gridTemplateColumns = `repeat(${ly.cols}, minmax(0, 1fr))`
    grid.style.gap = `${ly.gap}px`
  }

  _buildCells() {
    const grid = /** @type {HTMLElement} */ (this.elGrid)
    const split = /** @type {import('./TrellisSplit').TrellisSplitResult} */ (
      this.split
    )
    const ly = /** @type {import('./TrellisLayout').TrellisLayoutResult} */ (
      this.layout
    )
    this.panels = split.panels.map((slice, i) => {
      const cell = BrowserAPIs.createElement('div')
      cell.className = 'apexcharts-trellis-cell'
      cell.setAttribute('data-key', slice.key)
      this._applyCellMutes(cell, ly.cells[i])
      this.chrome.buildHeader(cell, slice.key, {
        index: i,
        count: split.panels.length,
      })
      const mount = BrowserAPIs.createElement('div')
      mount.className = 'apexcharts-trellis-panel'
      if (this._virtualActive) {
        // The skeleton reserves the exact panel height, so mounting and
        // unmounting never shifts page height or scroll position.
        mount.classList.add('apexcharts-trellis-skeleton')
        mount.style.minHeight = `${ly.panelH}px`
      }
      cell.appendChild(mount)
      grid.appendChild(cell)
      return {
        key: slice.key,
        index: i,
        el: mount,
        cellEl: cell,
        chart: null,
        empty: slice.series.length === 0,
      }
    })
  }

  /**
   * Edge-label policy as CSS classes: a muted cell hides its labels' INK
   * (opacity), never their SPACE, so every panel keeps the identical plot
   * rectangle and a policy flip on resize re-renders nothing (22a).
   * @param {HTMLElement} cell
   * @param {import('./TrellisLayout').TrellisCell} c
   */
  _applyCellMutes(cell, c) {
    cell.classList.toggle('apexcharts-trellis-mute-x', !c.showXLabels)
    cell.classList.toggle('apexcharts-trellis-mute-y', !c.showYLabels)
  }

  /**
   * Build one panel's full options object: the user's own options (functions
   * preserved by reference), minus what the trellis owns, plus the shared
   * scale/color/geometry overrides. `trellis.panel(key, meta)` is applied
   * last, so a caller can override anything per panel.
   * @param {number} i
   * @param {{ noAnimation?: boolean }} [flags] noAnimation forces animations
   *   off regardless of policy (virtualized REMOUNTS: scrolling back must not
   *   replay the draw animation).
   * @returns {Record<string, any>}
   */
  _assemblePanelOptions(i, { noAnimation = false } = {}) {
    const w = this.w
    const split = /** @type {import('./TrellisSplit').TrellisSplitResult} */ (
      this.split
    )
    const scales = /** @type {ReturnType<typeof TrellisScales.resolve>} */ (
      this.scales
    )
    const ly = /** @type {import('./TrellisLayout').TrellisLayoutResult} */ (
      this.layout
    )
    const slice = split.panels[i]

    /** @type {Record<string, any>} */
    const base = Utils.clone(this.ctx.opts || {})
    delete base.trellis
    delete base.series
    delete base.responsive

    const userChart = base.chart || {}
    const userEvents = userChart.events || {}
    const hostId = w.globals.chartID
    // Animation policy (P2): above the budget, mount animations default OFF
    // (a grid of simultaneous draw animations reads as noise and costs the
    // most), but an EXPLICIT user chart.animations.enabled always wins.
    const userAnimations = this.ctx.opts?.chart?.animations?.enabled
    const animationsOff =
      noAnimation ||
      (split.panels.length > ANIMATION_PANEL_BUDGET &&
        userAnimations === undefined)

    /** @type {Record<string, any>} */
    const overrides = {
      chart: {
        id: `${hostId}-tp${i}`,
        // Group membership is unconditional: it powers tooltip and crosshair
        // sync, not only zoom. zoom:'none' disables the zoom TOOL below.
        group: this._groupId(),
        height: ly.panelH,
        width: '100%',
        // The trellis's single ResizeObserver is the only relayout owner
        // (22a Q4); a panel must never self-rerender on a resize tick.
        redrawOnParentResize: false,
        redrawOnWindowResize: false,
        // Core pads the chart's container by parentHeightOffset (default 15)
        // via an inline min-height; inside a height-budgeted grid cell that
        // slack de-syncs mounted cells from the skeleton reserve (the grid
        // gap is the breathing room here).
        parentHeightOffset: 0,
        toolbar: { show: false },
        zoom: {
          enabled: this.cfg.zoom !== 'none',
        },
        ...(animationsOff ? { animations: { enabled: false } } : {}),
        // Grid-level canvas auto-selection (P2): a uniform explicit backend,
        // decided once over the whole grid's mark count.
        ...(this._panelRenderer ? { renderer: this._panelRenderer } : {}),
        events: {
          ...userEvents,
          zoomed: this.sync.makeZoomedHandler(userEvents.zoomed),
          scrolled: this.sync.makeScrolledHandler(userEvents.scrolled),
        },
      },
      series: slice.series,
      // Shared color: by series NAME across the whole trellis, so 'Revenue'
      // is the same color in every panel no matter the panel's series order.
      colors: slice.series.map((s) => scales.colorOf(s.name)),
      // Headers replace per-panel titles; the shared legend replaces per-panel
      // legends.
      title: { text: '' },
      legend: { show: false },
    }

    // Shared x domain (numeric/datetime): the equal-minX gate is what allows
    // the group tooltip sync at all.
    if (scales.x) {
      overrides.xaxis = { min: scales.x.min, max: scales.x.max }
    }
    // Shared y domain: identical bounds + tickAmount => identical ticks,
    // labels, gutters and plot rects (22a Q1). Merged INTO the user's own
    // yaxis entry (array or object): Utils.extend replaces arrays wholesale,
    // so a bare object override would drop the user's formatter/label config.
    if (scales.y) {
      const userYaxis = Array.isArray(base.yaxis) ? base.yaxis[0] : base.yaxis
      overrides.yaxis = Utils.extend(userYaxis || {}, {
        min: scales.y.min,
        max: scales.y.max,
        tickAmount: scales.y.tickAmount,
      })
      delete base.yaxis
    }

    let opts = Utils.extend(base, overrides)
    if (typeof this.cfg.panel === 'function') {
      const extra = this.cfg.panel(slice.key, { index: i, seriesNames: slice.seriesNames })
      if (extra && typeof extra === 'object') opts = Utils.extend(opts, extra)
    }
    return opts
  }

  /**
   * Independent-y gutter alignment (22a Q2): measure every panel's label
   * gutter, push the max as a shared `yaxis.labels.minWidth`. `max()` of the
   * measured widths makes the panels' `max(minWidth, measured)` resolve to
   * the same constant everywhere, so one iteration is exact by construction.
   * @returns {Promise<void>}
   */
  async _alignGutters() {
    const widths = this.panels
      .map((p) => p.chart?.w?.globals?.yLabelsCoords?.[0]?.width)
      .filter((v) => typeof v === 'number' && isFinite(v))
    if (!widths.length) return
    const isHorizontal = !!this.panels[0]?.chart?.w?.globals?.isBarHorizontal
    const labelPad = isHorizontal ? 0 : Y_LABEL_PAD
    const minWidth = Math.max(0, Math.max(...widths) - labelPad)
    await this._pushGutterFloor(minWidth)
  }

  /** The vertical-axis label pad inside the yLabelsCoords width (22a Q2). */
  _yLabelPad() {
    return Y_LABEL_PAD
  }

  /**
   * Push one shared gutter floor (`yaxis.labels.minWidth`) to every MOUNTED
   * panel. Shared by the eager one-pass alignment and the virtualized
   * monotone floor (TrellisVirtual bumps it when a newly mounted panel
   * measures wider).
   * @param {number} minWidth
   * @returns {Promise<void>}
   */
  async _pushGutterFloor(minWidth) {
    for (const p of this.panels) {
      if (!p.chart) continue
      await p.chart
        .updateOptions(
          { yaxis: yaxisPayload(p.chart, { labels: { minWidth } }) },
          false,
          false,
          false,
        )
        .catch(() => {})
    }
  }

  /** rAF-coalesced container resize -> single trellis-owned relayout. */
  _onContainerResize() {
    if (!this._mounted) return
    if (this._raf) return
    this._raf = requestAnimationFrame(() => {
      this._raf = 0
      const width = this._containerWidth()
      if (Math.round(width) === Math.round(this._lastWidth)) return
      this._lastWidth = width
      this._relayout(width)
    })
  }

  /**
   * Recompute the grid for a new width. A changed column count re-derives the
   * edge policy (which panels sit on the bottom row changed) by toggling cell
   * classes; panel geometry updates are one non-fanout updateOptions each.
   * @param {number} width
   */
  _relayout(width) {
    const split = this.split
    if (!split) return
    const prevH = this.layout ? this.layout.panelH : 0
    this.layout = TrellisLayout.compute({
      panelCount: split.panels.length,
      containerWidth: width,
      cfg: this.cfg,
      hostHeight: this._hostHeight(),
    })
    this._applyGridStyle()
    const ly = this.layout
    this.panels.forEach((p, i) => {
      if (p.cellEl) this._applyCellMutes(p.cellEl, ly.cells[i])
      if (p.el && this._virtualActive) p.el.style.minHeight = `${ly.panelH}px`
      if (!p.chart) return
      const payload =
        ly.panelH !== prevH ? { chart: { height: ly.panelH } } : {}
      // Even a same-height pass must run: the panel re-measures its new cell
      // width (22a Q4 measured this at ~1.6 ms per panel).
      p.chart.updateOptions(payload, false, false, false).catch(() => {})
    })
    // The observer's one-row look-ahead margin tracks the panel height, and
    // a recolumn changes which cells intersect; re-observing reconciles both.
    if (this._virtualActive) this.virtual.refresh()
  }

  /**
   * Host updateSeries: re-split against the SAME panel key set and push each
   * panel its new slice (plus refreshed shared domains) in one update. A
   * changed key set (panels appearing/disappearing) is a structural change:
   * torn down and re-rendered.
   * @param {any[]} newSeries
   * @param {boolean} [animate]
   * @returns {Promise<any>}
   */
  async updateSeries(newSeries, animate = true) {
    const w = this.w
    if (Array.isArray(this.cfg.data) && this.cfg.data.length) {
      console.warn(
        'ApexCharts: this trellis renders from trellis.data; update it via updateOptions({ trellis: { data } }).',
      )
      return Promise.resolve()
    }
    w.config.series = newSeries
    if (this.ctx.opts) this.ctx.opts.series = newSeries
    if (!this._mounted) return this.ctx.render()

    const nextSplit = splitSeries(newSeries || [], this.cfg)
    const sameKeys =
      nextSplit.panels.length === this.panels.length &&
      nextSplit.panels.every((p, i) => p.key === this.panels[i].key)
    if (!sameKeys) {
      this.teardown()
      return this.ctx.render()
    }

    this.split = nextSplit
    this.scales = TrellisScales.resolve(nextSplit, this.cfg, {
      chartType: w.config.chart.type,
      userColors: this.ctx.opts && this.ctx.opts.colors,
    })
    const scales = this.scales

    const pushes = this.panels.map((p, i) => {
      if (!p.chart) return Promise.resolve()
      /** @type {Record<string, any>} */
      const payload = { series: nextSplit.panels[i].series }
      if (scales.x) payload.xaxis = { min: scales.x.min, max: scales.x.max }
      if (scales.y) {
        payload.yaxis = yaxisPayload(p.chart, {
          min: scales.y.min,
          max: scales.y.max,
          tickAmount: scales.y.tickAmount,
        })
      }
      return p.chart
        .updateOptions(payload, false, animate, false)
        .catch(() => {})
    })
    return Promise.all(pushes)
  }

  /** @returns {Array<{ key: string, index: number, chart: any|null, el: HTMLElement|null }>} */
  getPanels() {
    return this.panels.map((p) => ({
      key: p.key,
      index: p.index,
      chart: p.chart,
      el: p.cellEl,
    }))
  }

  /**
   * @param {string} key
   * @returns {any|null} the panel's ApexCharts instance
   */
  getPanel(key) {
    const p = this.panels.find((p) => p.key === String(key))
    return p ? p.chart : null
  }

  /**
   * Destroy every panel (each unregisters itself from Apex._chartInstances),
   * disconnect the observers, and remove the trellis DOM.
   */
  teardown() {
    this.virtual.stop()
    this._virtualActive = false
    this._panelRenderer = null
    if (this._raf) {
      cancelAnimationFrame(this._raf)
      this._raf = 0
    }
    if (Environment.isBrowser() && this.ctx.el) {
      removeResizeListener(
        /** @type {Element} */ (this.ctx.el),
        this._resizeHandler,
      )
    }
    this.panels.forEach((p) => {
      if (p.chart) {
        try {
          p.chart.destroy()
        } catch (e) {
          // A panel that never finished mounting can throw on teardown;
          // continue so every other panel is still destroyed.
        }
      }
      p.chart = null
    })
    this.panels = []
    if (this.elWrap && this.elWrap.parentNode) {
      this.elWrap.parentNode.removeChild(this.elWrap)
    }
    this.elWrap = null
    this.elGrid = null
    this._mounted = false
    // allow a fresh render() on the host after teardown
    this.ctx._renderPromise = null
  }
}
