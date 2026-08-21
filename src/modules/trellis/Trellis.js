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
import { split as splitSeries, placeholderSeries } from './TrellisSplit'
import { buildTypeFrames } from './TrellisFrames'
import { pivotRows } from './pivotRows'
import * as TrellisScales from './TrellisScales'
import * as TrellisLayout from './TrellisLayout'
import TrellisChrome from './TrellisChrome'
import TrellisSync, { yaxisPayload } from './TrellisSync'
import TrellisVirtual from './TrellisVirtual'
import TrellisTooltip from './TrellisTooltip'
import TrellisExports from './TrellisExports'

/** Above this, `virtualize: 'auto'` mounts only the visible panels (P2). */
const EAGER_PANEL_BUDGET = 64

/** Above this, warn even when virtualized: point at trellis.limit. */
const HARD_PANEL_WARN = 256

/** Above this, panel mount animations default OFF (explicit user wins). */
const ANIMATION_PANEL_BUDGET = 16

/** The vertical-axis label pad inside the yLabelsCoords width (22a Q2). */
const Y_LABEL_PAD = 10

/**
 * Vertical air a standalone chart reserves that a trellis panel must NOT
 * (the header and grid gap are the breathing room here; inside the panel it
 * is dead space that visibly pushes rows apart). With the panel's empty
 * title/subtitle at margin 0, Dimensions still leaves a 20px no-title gutter
 * above the plot and a flat 15px of slack below the x-axis band; these
 * paddings (composed with the user's own grid.padding) reclaim most of it.
 * The bottom is axis-aware: TIMESCALE labels draw ~6px deeper into that
 * slack than the category/numeric label path (measured: a standalone
 * datetime chart keeps only ~5px of true clearance), so a datetime panel
 * may only take 2. Values are calibrated to Dimensions' constants; the
 * compact-chrome interaction test pins both the reclaim AND that no x-label
 * ink is cropped by the svg bottom.
 */
const PANEL_PAD_RECLAIM_TOP = 12
const PANEL_PAD_RECLAIM_BOTTOM = 7
const PANEL_PAD_RECLAIM_BOTTOM_DATETIME = 2

/**
 * Chart types a trellis refuses (P5, plan §10): the reading does not survive
 * a small frame, so the host warns and renders a single chart instead of an
 * unreadable grid. `unit` is a redirect, not a limitation: its native
 * `plotOptions.unit.grid.split` already draws one mini-waffle per category
 * inside a single instance, which beats N unit panels.
 * @type {Record<string, string>}
 */
const TYPE_VETO = {
  treemap:
    'trellis does not support treemap: area encoding needs room a panel cannot give. Rendering a single chart.',
  sunburst:
    'trellis does not support sunburst: its labels are illegible at panel size. Rendering a single chart.',
  unit: 'the unit type has its own small-multiples mode (plotOptions.unit.grid.split), which beats a trellis of unit charts. Rendering a single chart.',
}

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

/**
 * Trellis-scoped annotations (P3): filter one annotations config for one
 * panel. An annotation with no `scope` (or `scope: 'trellis'`) draws in
 * EVERY panel, projected through that panel's own scale; a string or string[]
 * scope names the panel key(s) it belongs to. The `scope` key itself is
 * stripped from the copy the panel receives.
 *
 * Pure; exported for tests.
 *
 * @param {Record<string, any>|undefined} annotations a cloned annotations config
 * @param {string} key the panel's facet key
 * @returns {Record<string, any>|undefined}
 */
export function scopeAnnotations(annotations, key) {
  if (!annotations || typeof annotations !== 'object') return annotations
  const out = { ...annotations }
  for (const kind of ['yaxis', 'xaxis', 'points', 'texts', 'images']) {
    const list = out[kind]
    if (!Array.isArray(list)) continue
    out[kind] = list
      .filter((item) => {
        if (!item || item.scope === undefined || item.scope === null) {
          return true
        }
        if (item.scope === 'trellis') return true
        if (Array.isArray(item.scope)) {
          return item.scope.map(String).indexOf(key) !== -1
        }
        return String(item.scope) === key
      })
      .map((item) => {
        if (!item || item.scope === undefined) return item
        const copy = { ...item }
        delete copy.scope
        return copy
      })
  }
  return out
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
     * `noMount` (P4) marks empty combinations under 'skip'/'hide'.
     * @type {Array<{ key: string, index: number, el: HTMLElement|null, cellEl: HTMLElement|null, chart: any|null, empty: boolean, noMount?: boolean, wantMounted?: boolean, viewStash?: any }>}
     */
    this.panels = []
    /** @type {HTMLElement[]} 2-D row/column strip elements (P4) */
    this._stripEls = []
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
    this.exports = new TrellisExports(this)
    /** @type {TrellisTooltip|null} the grid-mode tooltip card (P3) */
    this.gridTooltip = null
    /** @type {string|null} the promoted panel's key (P3) */
    this._promotedKey = null
    /** The panel constructor, exposed so TrellisVirtual stays import-light. */
    this._ApexCharts = ApexCharts
    /** @type {boolean} whether this render virtualizes (P2) */
    this._virtualActive = false
    /** @type {'canvas'|null} uniform panel renderer override (P2) */
    this._panelRenderer = null
    /** @type {number} uniform y-label decimals across the grid (P4) */
    this._yLabelDecimals = 0
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
    /** Whether the type-veto warning (P5) has been emitted once. */
    this._vetoWarned = false
    /** @type {import('./TrellisFrames').TypeFrames|null} shared type frames (P5) */
    this._frames = null
  }

  /** Whether this chart is a trellis host: `by` (1-D) or `row`/`column`
   *  (2-D, P4) is the switch. A vetoed chart type (P5) returns false, which
   *  makes EVERY host seam (render delegation, update branches, exports,
   *  promotion) fall back to the single-chart pipeline at once. */
  isActive() {
    const t = this.w.config.trellis
    if (!(t && (t.by || t.row || t.column))) return false
    const type = this.w.config.chart?.type
    if (type && TYPE_VETO[type]) {
      if (!this._vetoWarned) {
        this._vetoWarned = true
        console.warn(`ApexCharts: ${TYPE_VETO[type]}`)
      }
      return false
    }
    return true
  }

  /** The layout-facing config: a 2-D grid has a FIXED column count (one per
   *  column key; responsive recolumning would break the row/column
   *  semantics), so panels shrink instead of wrapping. */
  _layoutCfg() {
    if (this.split && this.split.mode === '2d' && this.split.colKeys) {
      return { ...this.cfg, columns: this.split.colKeys.length }
    }
    return this.cfg
  }

  /**
   * The EFFECTIVE y scale mode: the user's, unless a type frame (P5) forced
   * 'shared' because group modes are meaningless for the chart type.
   * @returns {string}
   */
  _yMode() {
    if (this._frames && this._frames.forceSharedY) return 'shared'
    return this.cfg.scales?.y || 'shared'
  }

  /**
   * The y bounds one panel should carry, per the scales mode: the shared
   * union, its row's union ('independent-row'), its column's union
   * ('independent-column'), or none ('independent'). Types whose y axis does
   * not carry the data values (heatmap rows, the radial family) never get a
   * yaxis push at all (P5): the frame's own channel is the shared one.
   * @param {import('./TrellisSplit').TrellisSlice} slice
   * @returns {{ min: number, max: number, tickAmount: number } | null}
   */
  _yBoundsFor(slice) {
    const scales = this.scales
    if (!scales) return null
    if (this._frames && this._frames.skipYaxisPush) return null
    const yMode = this._yMode()
    if (yMode === 'shared') return scales.y
    if (yMode === 'independent-row' && scales.rowY) {
      return scales.rowY.get(slice.rowKey ?? '') || null
    }
    if (yMode === 'independent-column' && scales.colY) {
      return scales.colY.get(slice.colKey ?? '') || null
    }
    return null
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

      // 1.6 Type frames (P5): the shared hidden frames (histogram bin edges
      //     + count domain, violin bandwidth, heatmap color scale, bubble z,
      //     pie totals) that make the awkward types honest. `histogram` is a
      //     Config ALIAS (chart.type is rewritten to 'bar', the original kept
      //     in requestedType), so the frame gate must look at the alias.
      const frameType =
        w.config.chart.requestedType === 'histogram'
          ? 'histogram'
          : w.config.chart.type
      this._frames = buildTypeFrames(split, this.cfg, w.config, frameType)
      this._frames.warnings.forEach((msg) =>
        console.warn(`ApexCharts: ${msg}`),
      )

      // 2. Shared scales (through the EFFECTIVE y mode: a type frame can
      //    force 'shared' where group modes are meaningless).
      // With an overridden y domain the DRAWN values are not the data
      // (histogram counts, not observations), so the data's decimals must
      // not leak into the labels; the tick step's own decimals still apply.
      this._yLabelDecimals = this._frames.yExtentOverride
        ? 0
        : TrellisScales.maxYDecimals(split.panels)
      const scalesCfg =
        this._yMode() !== (this.cfg.scales?.y || 'shared')
          ? { ...this.cfg, scales: { ...(this.cfg.scales || {}), y: this._yMode() } }
          : this.cfg
      this.scales = TrellisScales.resolve(split, scalesCfg, {
        chartType: w.config.chart.type,
        userColors: this.ctx.opts && this.ctx.opts.colors,
        yExtentOverride: this._frames.yExtentOverride,
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
        cfg: this._layoutCfg(),
        hostHeight: this._hostHeight(),
      })
      this._applyGridStyle()
      this._buildCells()

      // 4. Mount panels. Any non-shared y mode needs the measured gutter
      //    pass: group modes push identical bounds WITHIN a group, but label
      //    widths still differ ACROSS groups.
      const independentY = this._yMode() !== 'shared'
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
          if (panel.noMount) continue
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
      if ((this.cfg.tooltip || 'panel') === 'grid') {
        this.gridTooltip = new TrellisTooltip(this)
        this.gridTooltip.wire(/** @type {HTMLElement} */ (this.elGrid), wrap)
      }

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
    if (this.split && this.split.mode === '2d') {
      wrap.classList.add('apexcharts-trellis-2d')
    }
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
    const is2d = this.split && this.split.mode === '2d'
    const stripped = is2d && this.cfg.header?.show !== false
    // A 2-D grid with row strips reserves an auto-sized first column for the
    // row labels; the panel columns stay equal fractions, so alignment holds
    // whatever the strip measures.
    grid.style.gridTemplateColumns = stripped
      ? `auto repeat(${ly.cols}, minmax(0, 1fr))`
      : `repeat(${ly.cols}, minmax(0, 1fr))`
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
    const is2d = split.mode === '2d'
    const stripped = is2d && this.cfg.header?.show !== false
    this._stripEls = []
    const emptyMode = this.cfg.emptyPanels || 'placeholder'

    // 2-D chrome (P4): column labels once across the top, row labels once
    // down the left, instead of a header per cell. Auto grid placement lays
    // them out: corner + C column strips, then per row (row strip + C cells).
    if (stripped) {
      const corner = BrowserAPIs.createElement('div')
      corner.className = 'apexcharts-trellis-corner'
      grid.appendChild(corner)
      this._stripEls.push(corner)
      ;(split.colKeys || []).forEach((ck, ci) => {
        const el = this.chrome.stripEl('column', ck, {
          index: ci,
          count: (split.colKeys || []).length,
        })
        grid.appendChild(el)
        this._stripEls.push(el)
      })
    }

    this.panels = []
    split.panels.forEach((slice, i) => {
      if (stripped && i % ly.cols === 0) {
        const ri = Math.floor(i / ly.cols)
        const el = this.chrome.stripEl(
          'row',
          (split.rowKeys || [])[ri] ?? '',
          { index: ri, count: (split.rowKeys || []).length },
        )
        grid.appendChild(el)
        this._stripEls.push(el)
      }

      const cell = BrowserAPIs.createElement('div')
      cell.className = 'apexcharts-trellis-cell'
      cell.setAttribute('data-key', slice.key)
      this._applyCellMutes(cell, ly.cells[i])
      if (!is2d) {
        this.chrome.buildHeader(cell, slice.key, {
          index: i,
          count: split.panels.length,
        })
      }
      const mount = BrowserAPIs.createElement('div')
      mount.className = 'apexcharts-trellis-panel'
      if (this._virtualActive) {
        // The skeleton reserves the exact panel height, so mounting and
        // unmounting never shifts page height or scroll position.
        mount.classList.add('apexcharts-trellis-skeleton')
        mount.style.minHeight = `${ly.panelH}px`
      }
      cell.appendChild(mount)

      // Empty combinations (P4): 'placeholder' mounts a REAL panel with an
      // all-null aligned series (same scale/geometry code as every other
      // panel, so alignment holds by construction) plus a quiet label;
      // 'skip' keeps the slot with a tinted blank; 'hide' keeps the slot
      // with nothing at all.
      const noMount = slice.empty && emptyMode !== 'placeholder'
      if (slice.empty) {
        cell.classList.add('apexcharts-trellis-cell-empty')
        if (emptyMode === 'hide') {
          cell.classList.add('apexcharts-trellis-cell-hidden')
        } else if (emptyMode === 'skip') {
          mount.classList.add('apexcharts-trellis-skeleton')
          mount.style.minHeight = `${ly.panelH}px`
        } else {
          const label = BrowserAPIs.createElement('div')
          label.className = 'apexcharts-trellis-empty-label'
          label.textContent =
            (this.w.config.noData && this.w.config.noData.text) || 'no data'
          cell.appendChild(label)
        }
      }

      grid.appendChild(cell)
      this.panels.push({
        key: slice.key,
        index: i,
        el: mount,
        cellEl: cell,
        chart: null,
        empty: slice.empty,
        noMount,
      })
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
    // Trellis-scoped annotations (P3): declared once on the host, filtered
    // per panel by `scope`, projected through each panel's own scale.
    if (base.annotations) {
      base.annotations = scopeAnnotations(base.annotations, slice.key)
    }

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

    // Empty combination under 'placeholder' (P4): a real panel carrying one
    // valueless series aligned to the union x, so it runs the exact scale
    // and geometry code every sibling runs (zero-size marks for bar types:
    // the numeric bar pad only engages for series that draw).
    const isPlaceholder =
      slice.empty && (this.cfg.emptyPanels || 'placeholder') === 'placeholder'
    let panelSeries = isPlaceholder
      ? [placeholderSeries(split, { chartType: w.config.chart.type })]
      : slice.series

    // The radial value family (P5) takes a BARE values array, not the
    // axis-chart {name, data} form the split emits: unwrap, keeping the
    // POSITION of every value (a missing value becomes 0, never dropped:
    // value k must stay aligned with label k in every panel).
    const isValueSeries = ['pie', 'donut', 'polarArea', 'radialBar'].includes(
      w.config.chart.type,
    )
    if (isValueSeries) {
      panelSeries = panelSeries
        .flatMap((/** @type {any} */ s) =>
          Array.isArray(s.data) ? s.data : [],
        )
        .map((/** @type {any} */ v) =>
          typeof v === 'number' && isFinite(v) ? v : 0,
        )
    }

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
      series: panelSeries,
      // Shared color: by series NAME across the whole trellis, so 'Revenue'
      // is the same color in every panel no matter the panel's series order.
      // The radial value family colors by LABEL index from the shared config
      // instead, which is identical across panels by construction.
      ...(isValueSeries
        ? {}
        : {
            colors: panelSeries.map((/** @type {any} */ s) =>
              scales.colorOf(s.name),
            ),
          }),
      // Headers replace per-panel titles; the shared legend replaces per-panel
      // legends. margin: 0 and floating both matter: an empty-string title
      // still charges its margin to the top gutter in Dimensions, and its
      // empty element still measures height + 5 unless floating.
      title: { text: '', margin: 0, floating: true },
      subtitle: { text: '', margin: 0, floating: true },
      legend: { show: false },
      // A placeholder has nothing to read: its zero marks must not caption.
      ...(isPlaceholder ? { tooltip: { enabled: false } } : {}),
    }

    // Reclaim the standalone chart's vertical breathing room (see the
    // PANEL_PAD_RECLAIM constants), composed with the user's own padding.
    // Only for grid-based panels: circular/space-filling types have no
    // top gutter or x-axis slack to reclaim, and a sparkline zeroes its own
    // chrome (a negative pad there would shift the plot off the svg).
    const gridlessTypes = ['pie', 'donut', 'polarArea', 'radialBar', 'radar', 'treemap']
    if (
      !userChart.sparkline?.enabled &&
      !gridlessTypes.includes(w.config.chart.type)
    ) {
      const userPad = (base.grid && base.grid.padding) || {}
      const reclaimBottom =
        this.ctx.opts?.xaxis?.type === 'datetime'
          ? PANEL_PAD_RECLAIM_BOTTOM_DATETIME
          : PANEL_PAD_RECLAIM_BOTTOM
      overrides.grid = {
        padding: {
          top:
            (typeof userPad.top === 'number' ? userPad.top : 0) -
            PANEL_PAD_RECLAIM_TOP,
          bottom:
            (typeof userPad.bottom === 'number' ? userPad.bottom : 0) -
            reclaimBottom,
        },
      }
    }

    // Shared x domain (numeric/datetime): the equal-minX gate is what allows
    // the group tooltip sync at all.
    if (scales.x) {
      overrides.xaxis = { min: scales.x.min, max: scales.x.max }
    }
    // The panel's y domain per the scales mode (shared union, or its
    // row's/column's union, P4): identical bounds + tickAmount => identical
    // ticks, labels, gutters and plot rects (22a Q1). Merged INTO the user's
    // own yaxis entry (array or object): Utils.extend replaces arrays
    // wholesale, so a bare object override would drop the user's
    // formatter/label config.
    const yBounds = this._yBoundsFor(slice)
    if (yBounds) {
      const userYaxisRaw = Array.isArray(this.ctx.opts?.yaxis)
        ? this.ctx.opts.yaxis[0]
        : this.ctx.opts?.yaxis
      const userYaxis = Array.isArray(base.yaxis) ? base.yaxis[0] : base.yaxis
      // Identical bounds need identical label FORMATTING to yield identical
      // gutters: the library derives label decimals from each panel's OWN
      // data (decimalsInFloat only applies to float panels), so a
      // placeholder's zeros, or an integer-valued panel among float
      // siblings, would render "20" beside "20.00" and misalign. When the
      // user brought no formatter, push one uniform toFixed sized by the
      // union data's decimals and the tick step's own.
      /** @type {Record<string, any>} */
      let labelsPatch = {}
      if (typeof userYaxisRaw?.labels?.formatter !== 'function') {
        const step =
          (yBounds.max - yBounds.min) / Math.max(1, yBounds.tickAmount)
        const digits = Math.max(
          this._yLabelDecimals,
          TrellisScales.decimalCount(step),
        )
        labelsPatch = {
          labels: {
            formatter: (/** @type {any} */ val) =>
              typeof val === 'number' && isFinite(val)
                ? val.toFixed(digits)
                : val,
          },
        }
      }
      overrides.yaxis = Utils.extend(userYaxis || {}, {
        min: yBounds.min,
        max: yBounds.max,
        tickAmount: yBounds.tickAmount,
        ...labelsPatch,
      })
      delete base.yaxis
    }

    // Type frames (P5): the shared hidden frames every panel must draw in.
    // Deep-merged into the user's own plotOptions by Utils.extend below, so
    // only the shared keys (histogram range/binWidth, violin bandwidth,
    // heatmap colorScale min/max, bubble minZ/maxZ) are pinned.
    const frames = this._frames
    if (frames && frames.plotOptions) {
      overrides.plotOptions = Utils.clone(frames.plotOptions)
    }
    if (frames && frames.pieScaleOf) {
      const ratio = frames.pieScaleOf(slice.key)
      if (ratio !== null) {
        const userScale = this.ctx.opts?.plotOptions?.pie?.customScale
        overrides.plotOptions = Utils.extend(overrides.plotOptions || {}, {
          pie: {
            customScale:
              ratio * (typeof userScale === 'number' ? userScale : 1),
          },
        })
      }
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
      if (this._promotedKey) {
        // While promoted the grid layout is suspended; the promoted panel
        // just re-measures its new width.
        const p = this.panels.find((p) => p.key === this._promotedKey)
        if (p && p.chart) p.chart.updateOptions({}, false, false, false).catch(() => {})
        return
      }
      this._relayout(width)
    })
  }

  /**
   * Panel promotion (P3): expand one panel to the grid's full width, park the
   * rest (their cells hide; virtualized ones unmount via the observer), and
   * show a breadcrumb to come back. Zoom/legend state is untouched: parked
   * eager panels stay alive, parked virtual panels stash and restore.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async promote(key) {
    const panel = this.panels.find((p) => p.key === String(key))
    if (!panel || panel.noMount || !this._mounted) return
    if (this._promotedKey === panel.key) return
    if (this._promotedKey) await this.restorePromotion()

    this._promotedKey = panel.key
    const ly = this.layout
    const gridH = this.elGrid ? this.elGrid.getBoundingClientRect().height : 0
    // The grid's own footprint, bounded to something a single chart wears
    // well: never taller than the grid it replaces, never a sliver.
    const promotedH = Math.round(
      Math.max(280, Math.min(560, gridH || (ly ? ly.panelH * 2.4 : 420))),
    )

    this.elWrap?.classList.add('apexcharts-trellis-promoting')
    this.panels.forEach((p) => {
      if (!p.cellEl) return
      const promoted = p === panel
      p.cellEl.classList.toggle('apexcharts-trellis-cell-promoted', promoted)
      p.cellEl.classList.toggle('apexcharts-trellis-cell-parked', !promoted)
    })
    // 2-D strips park with the grid (the promoted panel names itself).
    this._stripEls.forEach((el) =>
      el.classList.add('apexcharts-trellis-cell-parked'),
    )
    this.chrome.buildBreadcrumb(
      /** @type {HTMLElement} */ (this._elChromeTop),
      panel.key,
      () => this.restorePromotion(),
    )

    if (!panel.chart && this._virtualActive) {
      // A promotion by API of an offscreen panel: mount it through the
      // normal drain (it now intersects, its cell being the only one shown).
      panel.wantMounted = true
      this.virtual._dirty.add(panel)
      this.virtual._schedule()
    }
    if (panel.el) panel.el.style.minHeight = `${promotedH}px`
    if (panel.chart) {
      await panel.chart
        .updateOptions({ chart: { height: promotedH } }, false, false, false)
        .catch(() => {})
    }
    this.ctx.events.fireEvent('panelPromoted', [
      this.ctx,
      { key: panel.key, chart: panel.chart },
    ])
  }

  /** Restore the grid from a promotion. @returns {Promise<void>} */
  async restorePromotion() {
    if (!this._promotedKey) return
    const panel = this.panels.find((p) => p.key === this._promotedKey)
    this._promotedKey = null
    this.elWrap?.classList.remove('apexcharts-trellis-promoting')
    this.panels.forEach((p) => {
      if (!p.cellEl) return
      p.cellEl.classList.remove('apexcharts-trellis-cell-promoted')
      p.cellEl.classList.remove('apexcharts-trellis-cell-parked')
    })
    this._stripEls.forEach((el) =>
      el.classList.remove('apexcharts-trellis-cell-parked'),
    )
    this.chrome.removeBreadcrumb()
    const ly = this.layout
    if (panel && panel.el && ly) panel.el.style.minHeight = `${ly.panelH}px`
    if (panel && panel.chart && ly) {
      await panel.chart
        .updateOptions({ chart: { height: ly.panelH } }, false, false, false)
        .catch(() => {})
    }
    // Re-derive the grid for the current width (mutes, heights, observer).
    this._lastWidth = 0
    this._relayout(this._containerWidth())
    this._lastWidth = this._containerWidth()
    this.ctx.events.fireEvent('panelRestored', [
      this.ctx,
      { key: panel ? panel.key : null },
    ])
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
      cfg: this._layoutCfg(),
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
    // Type frames (P5) are data-derived (bin edges, color extent, z extent,
    // pie totals): recompute them with the new data before the pushes.
    this._frames = buildTypeFrames(
      nextSplit,
      this.cfg,
      w.config,
      w.config.chart.requestedType === 'histogram'
        ? 'histogram'
        : w.config.chart.type,
    )
    const scalesCfg =
      this._yMode() !== (this.cfg.scales?.y || 'shared')
        ? { ...this.cfg, scales: { ...(this.cfg.scales || {}), y: this._yMode() } }
        : this.cfg
    this.scales = TrellisScales.resolve(nextSplit, scalesCfg, {
      chartType: w.config.chart.type,
      userColors: this.ctx.opts && this.ctx.opts.colors,
      yExtentOverride: this._frames.yExtentOverride,
    })
    const scales = this.scales
    const frames = this._frames

    const isValueSeries = ['pie', 'donut', 'polarArea', 'radialBar'].includes(
      w.config.chart.type,
    )
    const pushes = this.panels.map((p, i) => {
      if (!p.chart) return Promise.resolve()
      /** @type {Record<string, any>} */
      const payload = {
        // The radial value family takes a BARE values array (see the same
        // unwrap in _assemblePanelOptions).
        series: isValueSeries
          ? nextSplit.panels[i].series
              .flatMap((/** @type {any} */ s) =>
                Array.isArray(s.data) ? s.data : [],
              )
              .map((/** @type {any} */ v) =>
                typeof v === 'number' && isFinite(v) ? v : 0,
              )
          : nextSplit.panels[i].series,
      }
      if (scales.x) payload.xaxis = { min: scales.x.min, max: scales.x.max }
      const yBounds = this._yBoundsFor(nextSplit.panels[i])
      if (yBounds) {
        payload.yaxis = yaxisPayload(p.chart, {
          min: yBounds.min,
          max: yBounds.max,
          tickAmount: yBounds.tickAmount,
        })
      }
      if (frames.plotOptions) {
        payload.plotOptions = Utils.clone(frames.plotOptions)
      }
      if (frames.pieScaleOf) {
        const ratio = frames.pieScaleOf(nextSplit.panels[i].key)
        if (ratio !== null) {
          const userScale = this.ctx.opts?.plotOptions?.pie?.customScale
          payload.plotOptions = Utils.extend(payload.plotOptions || {}, {
            pie: {
              customScale:
                ratio * (typeof userScale === 'number' ? userScale : 1),
            },
          })
        }
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
    this._promotedKey = null
    this._frames = null
    this.chrome.destroyGradientLegend()
    if (this.gridTooltip) {
      this.gridTooltip.destroy()
      this.gridTooltip = null
    }
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
    this._stripEls = []
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
