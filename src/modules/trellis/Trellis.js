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
import CoreUtils from '../CoreUtils'
import InitCtxVariables from '../helpers/InitCtxVariables'
import {
  computeMarkCount,
  hasCanvasUnsupportedFeature,
} from '../../renderers/Renderer'
import { split as splitSeries, placeholderSeries, keyOf } from './TrellisSplit'
import { buildTypeFrames } from './TrellisFrames'
import { pivotRows } from './pivotRows'
import * as TrellisScales from './TrellisScales'
import * as TrellisLayout from './TrellisLayout'
import TrellisChrome from './TrellisChrome'
import TrellisSync, { yaxisPayload } from './TrellisSync'
import TrellisVirtual from './TrellisVirtual'
import TrellisTooltip from './TrellisTooltip'
import TrellisExports from './TrellisExports'
import { dropPanelTopBand } from './TrellisTopClearance'

/** Above this, `virtualize: 'auto'` mounts only the visible panels (P2). */
const EAGER_PANEL_BUDGET = 64

/** Above this, warn even when virtualized: point at trellis.limit. */
const HARD_PANEL_WARN = 256

/** Above this, panel mount animations default OFF (explicit user wins). */
const ANIMATION_PANEL_BUDGET = 16

/** Panel types with no axis chrome to trim (see _hasPlotChrome). */
const GRIDLESS_TYPES = [
  'pie',
  'donut',
  'polarArea',
  'radialBar',
  'radar',
  'treemap',
]

/** The vertical-axis label pad inside the yLabelsCoords width (22a Q2). */
const Y_LABEL_PAD = 10

/**
 * Vertical air a standalone chart reserves that a trellis panel must NOT
 * (the header and grid gap are the breathing room here; inside the panel it
 * is dead space that visibly pushes rows apart).
 *
 * TOP: not a fixed pad. Each panel chart carries a `panelTopBand` hook (set
 * in _createPanelChart) that Dimensions calls per layout: it drops the whole
 * band above the plot (the no-title gutter and the fixed axis-chart offset),
 * keeping only the clearance computed from the panel's own config
 * (TrellisTopClearance: the top y label's em box, markers, point data
 * labels, stacked totals). The logic ships in this add-on, not in core. Measured at the defaults that is 7px for a panel
 * with y labels (the top label's em box overhangs the plot by 6.3px), 9px
 * with point data labels, 16px with stacked totals, and about 1px for
 * horizontal bars whose rows are taller than their labels. A fixed reclaim
 * could not be right for all of them: the old 12 cropped data labels by 1px
 * and stacked totals by 7px.
 *
 * BOTTOM: Dimensions leaves a flat 15px of slack below the x-axis band;
 * these paddings (composed with the user's own grid.padding) reclaim most of
 * it. The bottom is axis-aware: TIMESCALE labels draw ~6px deeper into that
 * slack than the category/numeric label path (measured: a standalone
 * datetime chart keeps only ~5px of true clearance), so a datetime panel
 * may only take 2. Values are calibrated to Dimensions' constants; the
 * compact-chrome interaction test pins the reclaim AND that no ink is
 * cropped by the svg top or bottom.
 */
const PANEL_PAD_RECLAIM_BOTTOM = 7
const PANEL_PAD_RECLAIM_BOTTOM_DATETIME = 2

/**
 * Top-level options that change how a panel PAINTS and nothing else: not the
 * split, not a shared domain, not the grid geometry, not the shared chrome.
 * An update touching only these is pushed straight to the live panels, so a
 * recolour no longer destroys and rebuilds every chart in the grid (which
 * threw away hover state, focus and any in-panel zoom with it).
 *
 * `colors` is in the set even though the trellis owns the series→colour map,
 * because that map is resolved by a pure function this path re-runs.
 * Everything absent from this list — `trellis`, `series`, `chart`, the axes,
 * `theme`, `plotOptions`, `title`, `legend`, `responsive` — still rebuilds,
 * because each of those can move the split, the shared scales, the layout or
 * the chrome, and a half-applied structural change is worse than a rebuild.
 *
 * @type {string[]}
 */
const PANEL_ONLY_OPTIONS = [
  'annotations',
  'colors',
  'dataLabels',
  'fill',
  'forecastDataPoints',
  'grid',
  'markers',
  'noData',
  'states',
  'stroke',
  'tooltip',
]

/**
 * Panel height (px) below which panels default to `tooltip.compact`. A normal
 * card runs ~45px for one row and ~110px for three, so on a panel this short
 * it covers the line it is captioning. Set `tooltip.compact` yourself (either
 * value) and the trellis leaves the decision alone.
 */
const COMPACT_TOOLTIP_PANEL_H = 120

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
    /** @type {HTMLElement|null} the outer trellis element (w.dom.elWrap) */
    this.elWrap = null
    /** @type {HTMLElement|null} */
    this.elGrid = null
    this._mounted = false
    this._rendering = false
    /** @type {Promise<void>|null} the in-flight render, for whenSettled() */
    this._renderPromise = null
    /** rAF handle for the coalesced relayout */
    this._raf = 0
    this._lastWidth = 0
    /** Last laid-out host height, so a HEIGHT-only resize still refits. */
    this._lastHeight = 0
    /** Measured height of the shared chrome (title / toolbar / legend). */
    this._chromeH = 0
    /** Whether the too-tall-for-its-host warning has been emitted once. */
    this._overflowWarned = false
    this._resizeHandler = this._onContainerResize.bind(this)
    this.autoScaleYaxis = false
    /** @type {HTMLElement|null} */
    this._elChromeTop = null
    /** Whether the type-veto warning (P5) has been emitted once. */
    this._vetoWarned = false
    /** Whether the unmatched-`by` warning has been emitted once. */
    this._noKeyWarned = false
    /** @type {import('./TrellisFrames').TypeFrames|null} shared type frames (P5) */
    this._frames = null
    /** Bumped by teardown(), so an in-flight render can tell it was cancelled. */
    this._gen = 0
    /** @type {'zoom'|'pan'|null} the tool armed from the shared toolbar */
    this._tool = null
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

    // A `by` key that no series carries splits into zero panels. The split
    // itself already noticed this, but it runs inside render(), by which point
    // the host has committed to the trellis path and deliberately skipped its
    // resize listeners (the trellis owns relayout). Bailing out there left an
    // empty container; falling back there would leave a chart that never
    // relayouts. So the decision belongs here, alongside TYPE_VETO, which is
    // the fallback route the host already handles correctly.
    //
    // Scoped to the plain `by` case on purpose: `row`/`column` and the
    // `trellis.data` pivot resolve their keys differently, and reproducing
    // that here would be a second copy of the split's rules.
    if (t.by && !t.row && !t.column && !Array.isArray(t.data)) {
      const list = this.w.config.series || []
      const anyKeyed = list.some(
        (/** @type {any} */ s, /** @type {number} */ i) =>
          keyOf(s, i, t.by) !== null,
      )
      if (!anyKeyed) {
        if (!this._noKeyWarned) {
          this._noKeyWarned = true
          const named =
            typeof t.by === 'function'
              ? 'the `trellis.by` function returned no key for any series'
              : `no series carries the \`trellis.by\` key '${t.by}'`
          console.warn(
            `ApexCharts: ${named}; there is nothing to split. Rendering as a single chart.`,
          )
        }
        return false
      }
    }
    return true
  }

  /** The layout-facing config: a 2-D grid has a FIXED column count (one per
   *  column key; responsive recolumning would break the row/column
   *  semantics), so panels shrink instead of wrapping. */
  _layoutCfg() {
    const cfg = this._effectiveCfg()
    if (this.split && this.split.mode === '2d' && this.split.colKeys) {
      return { ...cfg, columns: this.split.colKeys.length }
    }
    return cfg
  }

  /** The trellis config with the EFFECTIVE y mode, so the scale resolver
   *  and the edge-label policy agree when a type frame forced 'shared'. */
  _effectiveCfg() {
    const y = this._yMode()
    return y !== (this.cfg.scales?.y || 'shared')
      ? { ...this.cfg, scales: { ...(this.cfg.scales || {}), y } }
      : this.cfg
  }

  /**
   * Re-derive everything the panels share from the data: the type frames,
   * the uniform label decimals and the shared scales. One place, so the
   * first render and every update see the same derivation.
   * @param {import('./TrellisSplit').TrellisSplitResult} split
   * @param {boolean} [frames] false keeps the current type frames (the data
   *   did not change, only the colours may have)
   */
  _deriveShared(split, frames = true) {
    const w = this.w
    const c = w.config.chart
    if (frames || !this._frames) {
      // `histogram` is a Config ALIAS (chart.type is rewritten to 'bar', the
      // original kept in requestedType), so the frame gate reads the alias.
      this._frames = buildTypeFrames(
        split,
        this.cfg,
        w.config,
        c.requestedType === 'histogram' ? 'histogram' : c.type,
      )
    }
    // The label decimals ride on the bounds: with an overridden y domain
    // (histogram counts, not observations) only the tick step's count.
    //
    // Several y axes: the series go to axes ONCE for the grid, by the core's
    // own rules (`seriesName`, string or array, then one-for-one by index)
    // run on the grid's full name list, and every panel is pushed the result
    // as `seriesName` arrays. Mapped per panel, a facet missing one named
    // series had its others fall onto the wrong shared axis.
    const yaxis = this._multiY()
    /** @type {string[][] | null} */
    let axisNames = null
    if (yaxis) {
      const names = split.seriesNames
      const cu = new CoreUtils(
        /** @type {any} */ ({
          config: { series: names.map((name) => ({ name })), yaxis },
          globals: {},
        }),
      )
      cu.setSeriesYAxisMappings()
      axisNames = cu.w.globals.seriesYAxisMap.map((/** @type {number[]} */ m) =>
        m.map((i) => names[i]).filter((n) => n != null),
      )
    }
    this._axisNames = axisNames
    const theme = w.config.theme
    const scales = (this.scales = TrellisScales.resolve(
      split,
      this._effectiveCfg(),
      {
        chartType: c.type,
        userColors: this.ctx.opts && this.ctx.opts.colors,
        palette: theme.palette,
        // The page's own axes when there are several (see _multiY).
        yaxis: yaxis || w.config.yaxis,
        axisNames,
        yExtentOverride: this._frames.yExtentOverride,
        ...this._stackingHost(),
      },
    ))
    // Monochrome and colour-blind panels paint their own colours whatever
    // they are handed (the core ignores `colors` there), and a function in
    // `colors` is resolved by the panel: the shared legend and grid tooltip
    // read the colour a mounted panel painted for the name instead. `raw`
    // (the panel push) still gets the configured entry.
    if (
      theme.monochrome?.enabled ||
      theme.accessibility?.colorBlindMode ||
      scales.palette.some((c) => typeof c === 'function')
    ) {
      const colorOf = scales.colorOf
      scales.colorOf = (name, raw) => {
        if (!raw) {
          for (const p of this.panels) {
            const pw = p.chart && p.chart.w
            const i = pw ? pw.seriesData.seriesNames.indexOf(name) : -1
            const c = i > -1 && pw.globals.colors[i]
            // a function the core kept per datum: its first point's colour
            if (typeof c === 'function') {
              return c({
                value: pw.seriesData.series[i][0] || 0,
                seriesIndex: i,
                dataPointIndex: 0,
                w: pw,
              })
            }
            if (c) return c
          }
        }
        return colorOf(name)
      }
    }
  }

  /** @returns {{ chartType: string, datetime: boolean }} the split's host facts */
  _splitHost() {
    const cnf = this.w.config
    return { chartType: cnf.chart.type, datetime: cnf.xaxis.type === 'datetime' }
  }

  /**
   * The page's y axes when there are several, else null (also for a
   * horizontal bar trellis, whose value axis is `xaxis`). The page's own
   * list: the merged config holds one log axis per HOST series, which says
   * nothing about the panels' axes.
   * @returns {any[] | null}
   */
  _multiY() {
    const yaxis = this.ctx.opts?.yaxis
    return Array.isArray(yaxis) && yaxis.length > 1 && !this._valueAxisIsX()
      ? yaxis
      : null
  }

  /**
   * The stacking facts the shared-scale resolver needs. A stacked panel is as
   * tall as its tallest PILE, so the shared y domain has to come from the
   * stack totals; without this every panel got a domain sized by the largest
   * single value and the taller stacks drew straight off the top of the plot.
   * `parts` says highlight-filter parts reach the axis as well: the feature
   * is loaded and extends the axis for a type it draws parts on, so a part
   * past its whole is not clipped by the shared bound.
   * @returns {{ stacked: boolean, stackType: string|undefined, stackOnlyBar: boolean, parts: boolean }}
   */
  _stackingHost() {
    const cnf = this.w.config
    const chart = cnf.chart || {}
    const hf = /** @type {any} */ (cnf).highlightFilter || {}
    return {
      stacked: !!chart.stacked,
      stackType: chart.stackType,
      stackOnlyBar: !!chart.stackOnlyBar,
      parts:
        !!InitCtxVariables._featureRegistry.get('highlightFilter') &&
        hf.enabled !== false &&
        hf.axis !== 'clamp' &&
        ['bar', 'line', 'area'].includes(chart.type) &&
        !cnf.plotOptions?.bar?.isFunnel,
    }
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
   *
   * With several y axes the bounds are one per axis, handed out only when
   * `all` asks for them: a caller that pushes one domain onto every axis
   * (the grid reset) gets null and leaves the axes alone.
   * @param {import('./TrellisSplit').TrellisSlice} slice
   * @param {boolean} [all]
   * @returns {any} TrellisBounds, an array of them (`all`), or null
   */
  _yBoundsFor(slice, all) {
    const scales = this.scales
    if (!scales) return null
    if (this._frames && this._frames.skipYaxisPush) return null
    const yMode = this._yMode()
    const b =
      yMode === 'shared'
        ? scales.y
        : yMode === 'independent-row' && scales.rowY
          ? scales.rowY.get(slice.rowKey ?? '')
          : yMode === 'independent-column' && scales.colY
            ? scales.colY.get(slice.colKey ?? '')
            : null
    return b && (all || !Array.isArray(b)) ? b : null
  }

  /**
   * Horizontal bars measure along x, and the library reads that value axis
   * from `xaxis` (Scales.setYScaleForIndex switches on `isBarHorizontal`),
   * so the shared bounds have to be pushed THERE as well: `yaxis` alone
   * seeds the domain but the panel then re-nices it from its own data, which
   * silently discards the trellis's tick target.
   *
   * rangeBar is excluded on purpose: its horizontal value axis carries dates,
   * and a nice-number domain is meaningless on a timeline.
   * @returns {boolean}
   */
  _valueAxisIsX() {
    const cnf = this.w.config
    return (
      ['bar', 'boxPlot', 'violin'].includes(cnf.chart.type) &&
      !!cnf.plotOptions?.bar?.horizontal
    )
  }

  /**
   * The value-axis patch for a horizontal panel. An explicit user
   * `xaxis.tickAmount` wins: the count is theirs to set, and the panels
   * still agree because they all re-nice from the SAME pushed bounds.
   * @param {{ min: number, max: number, tickAmount: number }} bounds
   * @returns {Record<string, any>}
   */
  _valueAxisXPatch(bounds) {
    /** @type {Record<string, any>} */
    const patch = { min: bounds.min, max: bounds.max }
    if (typeof this.ctx.opts?.xaxis?.tickAmount !== 'number') {
      patch.tickAmount = bounds.tickAmount
    }
    return patch
  }

  /** @returns {string} namespaced panel group id */
  _groupId() {
    return `${this.w.globals.chartID}-tg`
  }

  /**
   * Fire a trellis event through BOTH channels, the way every other chart
   * event reaches its caller: the `chart.events.<name>` config callback and
   * the `addEventListener` registry. `Events.fireEvent` only walks the
   * registry, so the four trellis events used to be invisible to anyone who
   * wired them up the ordinary way, in `chart.events`.
   *
   * Argument order matches what the registry has always been handed
   * (`ctx` first, then the payload), so existing listeners are unaffected.
   *
   * @param {string} name
   * @param {Record<string, any>} payload
   */
  _fire(name, payload) {
    const cb = this.w.config.chart?.events?.[name]
    if (typeof cb === 'function') cb(this.ctx, payload)
    this.ctx.events.fireEvent(name, [this.ctx, payload])
  }

  /**
   * Render the whole trellis into the host element. Called by the host's
   * render() INSTEAD of the normal create()/mount() pipeline.
   *
   * The returned promise is also kept as `_renderPromise` so the host's
   * update seams can WAIT for an in-flight mount instead of racing it (an
   * update that arrived mid-mount used to fall through to the single-chart
   * pipeline and draw a stray plain chart beside the grid).
   *
   * @returns {Promise<void>}
   */
  render() {
    // A second call while a mount is in flight joins it. Without this the
    // early-returned (already resolved) promise would replace the live one,
    // and a caller waiting on whenSettled() would wake while `_rendering`
    // is still true.
    if (this._rendering && this._renderPromise) return this._renderPromise
    const p = this._render()
    this._renderPromise = p
    return p
  }

  /**
   * Resolves when nothing is mounting. Safe to call at any time: it is the
   * in-flight render's own promise, or an already-resolved one.
   * @returns {Promise<void>}
   */
  whenSettled() {
    return this._rendering && this._renderPromise
      ? this._renderPromise.catch(() => {})
      : Promise.resolve()
  }

  /** @returns {Promise<void>} */
  async _render() {
    const w = this.w
    if (this._mounted || this._rendering) return
    if (!Environment.isBrowser()) {
      console.warn(
        'ApexCharts: trellis rendering is browser-only in this version; SSR hosts render nothing.',
      )
      return
    }
    this._rendering = true
    // A destroy() or rebuild while a panel is mounting bumps the generation;
    // every await below checks it and stops quietly, the way a plain chart's
    // render settles when it is destroyed mid-mount.
    const gen = this._gen
    try {
      this.cfg = w.config.trellis || {}
      // The grid's autoscale restates ONE y domain on every axis, which
      // would flatten a combo's second axis: there each panel keeps the
      // core's own per-axis autoscale.
      this.autoScaleYaxis =
        !!w.config.chart?.zoom?.autoScaleYaxis && !this._multiY()

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
      const split = splitSeries(inputSeries, this.cfg, this._splitHost())
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
      //     pie totals) that make the awkward types honest; then the shared
      //     scales through the EFFECTIVE y mode (a type frame can force
      //     'shared' where group modes are meaningless).
      this._deriveShared(split)
      const frames = /** @type {import('./TrellisFrames').TypeFrames} */ (
        this._frames
      )
      frames.warnings.forEach((msg) => console.warn(`ApexCharts: ${msg}`))
      // A rebuild keeps the legend-hidden set, as a plain chart keeps its
      // hidden series across updates; a name the new data lost is let go.
      // A series the page declares `hidden: true` seeds it, once (_seeded
      // outlives teardown): the panels read their hidden state from this
      // set alone.
      if (!this._seeded) {
        this._seeded = true
        split.panels.forEach((p) =>
          p.series.forEach(
            (/** @type {any} */ s) => s.hidden && this.sync._hidden.add(s.name),
          ),
        )
      }
      this.sync.prune(split.seriesNames)

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
      this._lastHeight = this._hostHeight() || 0
      this._chromeH = 0
      this.layout = TrellisLayout.compute({
        panelCount: split.panels.length,
        containerWidth: width,
        cfg: this._layoutCfg(),
        hostHeight: this._hostHeight(),
        chromeHeight: this._chromeH,
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
          const chart = this._createPanelChart(
            /** @type {HTMLElement} */ (panel.el),
            opts,
          )
          panel.chart = chart
          await chart.render()
          if (gen !== this._gen) return
          this._fire('panelMounted', {
            key: panel.key,
            index: panel.index,
            chart,
          })
        }

        // 5. Independent-y gutter pass: one measured minWidth, pushed to all,
        //    exact in one iteration by construction (max of measured widths).
        if (independentY) {
          await this._alignGutters()
          if (gen !== this._gen) return
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

      this._mounted = true

      // 6.5 The first layout ran before the chrome existed, so it sized the
      //     panels against the whole host. Now that the title / toolbar /
      //     legend are measurable, give back the height they take.
      this._refitForChrome()

      // 7. One ResizeObserver for the whole grid; panels have both
      //    redrawOn*Resize flags off, so this is the only relayout owner.
      addResizeListener(
        /** @type {HTMLElement} */ (this.ctx.el),
        this._resizeHandler,
      )

      // The host never runs its own render pipeline, so nothing else would
      // ever flip its animationEnded flag; screenshot/e2e harnesses key on
      // it. Eager grids are done here; virtualized grids flip it when the
      // mount drain goes idle (TrellisVirtual).
      if (!useVirtual) w.globals.animationEnded = true
      this._fire('trellisMounted', { panels: this.getPanels() })
    } finally {
      // Only the current render owns the flag. A render cancelled by
      // teardown() (which already cleared it) must not clear the flag of a
      // newer render that started after that teardown.
      if (gen === this._gen) this._rendering = false
    }
  }

  /** Container width the grid may use. */
  _containerWidth() {
    const el = /** @type {HTMLElement} */ (this.ctx.el)
    const rect = el.getBoundingClientRect()
    return rect.width || el.clientWidth || 800
  }

  /**
   * The height the trellis has to lay out in, in px, or undefined when the
   * host has not asked for one (then the grid sizes itself by aspect ratio).
   *
   * A PERCENTAGE height is a percentage of the container's parent, the same
   * contract `Core.setSVGDimensions` gives a standalone chart. Running it
   * through a bare `parseFloat` instead read `'100%'` as 100 PIXELS, so a
   * full-height trellis laid itself out for a 100px box and every panel came
   * out at the minimum-height floor.
   *
   * @returns {number|undefined}
   */
  _hostHeight() {
    const h = this.w.config.chart && this.w.config.chart.height
    if (h === undefined || h === null || h === '' || h === 'auto') {
      return undefined
    }
    const str = String(h).trim()

    if (str.endsWith('%')) {
      const pct = parseFloat(str)
      if (!isFinite(pct) || pct <= 0) return undefined
      // The parent, not the host: the host is what the grid is drawn INTO, so
      // measuring it would feed the grid's own height back into the layout.
      const parent = /** @type {any} */ (this.ctx.el)?.parentNode
      if (!parent || typeof parent.getBoundingClientRect !== 'function') {
        return undefined
      }
      const box = parent.getBoundingClientRect().height || parent.clientHeight
      const resolved = ((box || 0) * pct) / 100
      return resolved > 0 ? resolved : undefined
    }

    const n = parseFloat(str)
    return isFinite(n) && n > 0 ? n : undefined
  }

  /**
   * Height taken by the shared chrome — the title above, the toolbar band, the
   * legend below — i.e. everything inside the wrapper that is not the grid.
   * Measured rather than modelled: the pieces are optional, wrap at narrow
   * widths, and a heatmap's gradient legend is a different height again.
   *
   * Zero before the chrome exists (the first layout runs before it is built);
   * `_refitForChrome` runs one more layout once it does.
   *
   * @returns {number}
   */
  _chromeHeight() {
    const wrap = this.elWrap
    const grid = this.elGrid
    if (!wrap || !grid || typeof wrap.getBoundingClientRect !== 'function') {
      return 0
    }
    const h = wrap.getBoundingClientRect().height - grid.getBoundingClientRect().height
    return isFinite(h) && h > 0 ? h : 0
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

    // The trellis chrome is HTML, not SVG, so it cannot inherit the ink colour
    // the panels' axis labels get from `chart.foreColor`. Publishing that one
    // resolved value as a custom property is what makes panel headers, strip
    // labels, the shared legend and the toolbar follow `theme.mode` (and an
    // explicit `chart.foreColor`) instead of sitting at a hard-coded grey on a
    // dark page. The CSS reads it UNDER `--apx-fore`, so a page-level design
    // token still wins, exactly as it does for the rest of the chrome.
    const foreColor = this.w.config.chart?.foreColor
    if (foreColor) wrap.style.setProperty('--apx-trellis-fore', foreColor)

    // Same for the font: headers, strips, legend and title inherit it from here
    const fontFamily = this.w.config.chart?.fontFamily
    if (fontFamily) wrap.style.fontFamily = fontFamily

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
   * Whether a panel has the axis chrome the trellis trims (the band above
   * the plot, the slack below the x axis). Circular and space-filling types
   * have neither, and a sparkline zeroes its own.
   * @param {any} chartOpts the panel's (or the user's) `chart` options
   */
  _hasPlotChrome(chartOpts) {
    return (
      !chartOpts?.sparkline?.enabled &&
      !GRIDLESS_TYPES.includes(this.w.config.chart.type)
    )
  }

  /**
   * Construct (not render) one panel chart. Every mount path goes through
   * here so the hook is never missed: `panelTopBand` has Dimensions drop
   * the standalone title band above the plot and keep only what the top
   * ink needs (TrellisTopClearance; see PANEL_PAD_RECLAIM_BOTTOM).
   * @param {HTMLElement} el
   * @param {any} opts
   */
  _createPanelChart(el, opts) {
    const chart = /** @type {any} */ (new this._ApexCharts(el, opts))
    if (this._hasPlotChrome(opts.chart)) chart.panelTopBand = dropPanelTopBand
    return chart
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
    const ly = /** @type {import('./TrellisLayout').TrellisLayoutResult} */ (
      this.layout
    )
    const slice = split.panels[i]

    // Cloned WITHOUT the keys the trellis owns: `series` and `trellis.data`
    // hold every panel's data, and deep-cloning them per panel only to
    // delete them cost more than the rest of the assembly put together.
    const {
      series: _s,
      trellis: _t,
      responsive: _r,
      ...userOpts
    } = this.ctx.opts || {}
    /** @type {Record<string, any>} */
    const base = Utils.clone(userOpts)
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

    const isPlaceholder =
      slice.empty && (this.cfg.emptyPanels || 'placeholder') === 'placeholder'
    const data = this._panelDataPatch(i)

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
        // (22a Q4); a panel must never self-rerender on a resize tick. Printing
        // is the same rule: a panel re-laying itself out to a printable width
        // would tear the grid apart, since its position and size are the
        // orchestrator's to decide.
        redrawOnParentResize: false,
        redrawOnWindowResize: false,
        print: { enabled: false },
        // Core pads the chart's container by parentHeightOffset (default 15)
        // via an inline min-height; inside a height-budgeted grid cell that
        // slack de-syncs mounted cells from the skeleton reserve (the grid
        // gap is the breathing room here).
        parentHeightOffset: 0,
        // The tool armed on the shared toolbar reaches panels mounted after
        // the click too (virtualized scroll-ins, rebuilt-in-place panels).
        toolbar: this._tool
          ? { show: false, autoSelected: this._tool }
          : { show: false },
        // the shared toolbar owns the one reset (TrellisSync.resetAll); with
        // toolbar 'none' a panel's own reset is the only way back, unless the
        // page turned it off. trellis.zoom only decides whether a zoom SYNCS:
        // the page's own chart.zoom.enabled: false still means no zoom at
        // all. Read from the page's options, not the merged config: a type
        // default (histogram, waterfall, sparkline) keeps the grid's zoom.
        zoom: {
          enabled:
            this.cfg.zoom !== 'none' &&
            this.ctx.opts?.chart?.zoom?.enabled !== false,
          resetControl:
            this.cfg.toolbar == 'none' &&
            w.config.chart.zoom.resetControl !== false,
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
      series: data.series,
      ...(data.colors ? { colors: data.colors } : {}),
      // Headers replace per-panel titles; the shared legend replaces per-panel
      // legends. margin: 0 and floating both matter: an empty-string title
      // still charges its margin to the top gutter in Dimensions, and its
      // empty element still measures height + 5 unless floating.
      title: { text: '', margin: 0, floating: true },
      subtitle: { text: '', margin: 0, floating: true },
      legend: { show: false },
      // A placeholder has nothing to read: its zero marks must not caption.
      ...(isPlaceholder ? { tooltip: { enabled: false } } : {}),
      // A normal tooltip card is taller than a short panel, so on a dense
      // grid it covers the very line it is captioning. Below the threshold
      // the panels get the compact one-liner unless the user decided for
      // themselves. 'grid' mode composes its own card from the panels', so it
      // opts out: shrinking the source rows would shrink the grid card too.
      ...(ly.panelH < COMPACT_TOOLTIP_PANEL_H &&
      this.cfg.tooltip !== 'grid' &&
      typeof this.ctx.opts?.tooltip?.compact !== 'boolean'
        ? { tooltip: { compact: true } }
        : {}),
    }

    // Reclaim the standalone chart's bottom slack (see the PANEL_PAD_RECLAIM
    // constants), composed with the user's own padding. The top band is
    // dropped by Dimensions itself (see _createPanelChart), so the user's top pad
    // passes through untouched. Only for grid-based panels: circular and
    // space-filling types have no x-axis slack to reclaim, and a sparkline
    // zeroes its own chrome (a negative pad there would shift the plot off
    // the svg).
    if (this._hasPlotChrome(userChart)) {
      const userPad = (base.grid && base.grid.padding) || {}
      const reclaimBottom =
        this.ctx.opts?.xaxis?.type === 'datetime'
          ? PANEL_PAD_RECLAIM_BOTTOM_DATETIME
          : PANEL_PAD_RECLAIM_BOTTOM
      overrides.grid = {
        padding: {
          bottom:
            (typeof userPad.bottom === 'number' ? userPad.bottom : 0) -
            reclaimBottom,
        },
      }
    }

    // The data-derived half (_panelDataPatch). Its yaxis patch is merged
    // INTO the user's own yaxis entry (array or object): Utils.extend
    // replaces arrays wholesale, so a bare object override would drop the
    // user's formatter/label config. Several axes merge entry by entry.
    if (data.xaxis) overrides.xaxis = data.xaxis
    if (data.yaxis) {
      const userY = /** @type {any[]} */ ([]).concat(base.yaxis || {})
      overrides.yaxis = Array.isArray(data.yaxis)
        ? data.yaxis.map((p, ai) => Utils.extend(userY[ai] || {}, p))
        : Utils.extend(userY[0] || {}, data.yaxis)
      delete base.yaxis
    }
    // Deep-merged into the user's own plotOptions by Utils.extend below, so
    // only the shared frame keys are pinned.
    if (data.plotOptions) overrides.plotOptions = data.plotOptions

    let opts = Utils.extend(base, overrides)
    if (typeof this.cfg.panel === 'function') {
      const extra = this.cfg.panel(slice.key, { index: i, seriesNames: slice.seriesNames })
      if (extra && typeof extra === 'object') opts = Utils.extend(opts, extra)
    }
    return opts
  }

  /**
   * The DATA-derived half of one panel's options: its series, the shared
   * colour map, the shared x/y domains with the uniform label formatter,
   * and the type frames. Both the first assembly and every host
   * updateSeries push this one patch, so an override added here can never
   * go stale after an update the way a second copy of it did.
   * @param {number} i
   * @returns {Record<string, any>}
   */
  _panelDataPatch(i) {
    const w = this.w
    const split = /** @type {import('./TrellisSplit').TrellisSplitResult} */ (
      this.split
    )
    const scales = /** @type {ReturnType<typeof TrellisScales.resolve>} */ (
      this.scales
    )
    const slice = split.panels[i]
    const type = w.config.chart.type

    // Empty combination under 'placeholder' (P4): a real panel carrying one
    // valueless series aligned to the union x, so it runs the exact scale
    // and geometry code every sibling runs (zero-size marks for bar types:
    // the numeric bar pad only engages for series that draw).
    const series =
      slice.empty && (this.cfg.emptyPanels || 'placeholder') === 'placeholder'
        ? [placeholderSeries(split, { chartType: type })]
        : slice.series
    /** @type {Record<string, any>} */
    const patch = { series }
    if (['pie', 'donut', 'polarArea', 'radialBar'].includes(type)) {
      // The radial value family (P5) takes a BARE values array, not the
      // axis-chart {name, data} form the split emits: unwrap, keeping the
      // POSITION of every value (a missing value becomes 0, never dropped:
      // value k must stay aligned with label k in every panel). It colours
      // by LABEL index from the shared config, identical by construction.
      patch.series = series
        .flatMap((/** @type {any} */ s) =>
          Array.isArray(s.data) ? s.data : [],
        )
        .map((/** @type {any} */ v) =>
          typeof v === 'number' && isFinite(v) ? v : 0,
        )
    } else {
      // Shared color: by series NAME across the whole trellis, so 'Revenue'
      // is the same color in every panel no matter the panel's series order.
      // `raw` keeps a function entry in place for the panel to resolve.
      patch.colors = series.map((/** @type {any} */ s) =>
        scales.colorOf(s.name, true),
      )
      // The shared legend's hidden set, stated on EVERY row: a panel mounted
      // after a toggle is born with the series hidden (no flash, no second
      // render), and an explicit false keeps a later update from inheriting
      // a stale `hidden: true` from the panel's initial series.
      patch.series = series.map((/** @type {any} */ s) => ({
        ...s,
        hidden: this.sync.isHidden(s.name),
      }))
    }

    // Shared x domain (numeric/datetime): the equal-minX gate is what allows
    // the group tooltip sync at all. Skipped when x IS the value axis
    // (horizontal bars): there the union of the numeric CATEGORIES would
    // overwrite the value domain with category indices.
    const valueAxisIsX = this._valueAxisIsX()
    if (scales.x && !valueAxisIsX) {
      patch.xaxis = { min: scales.x.min, max: scales.x.max }
    }
    // The panel's y domain per the scales mode (shared union, or its
    // row's/column's union, P4): identical bounds + tickAmount => identical
    // ticks, labels, gutters and plot rects (22a Q1). Several y axes get one
    // entry each, in the user's order (a single object would replace them),
    // naming the grid's series for it so the panel maps them the same way.
    const yBounds = this._yBoundsFor(slice, true)
    if (yBounds) {
      const userY = this.ctx.opts?.yaxis
      const names = this._axisNames
      patch.yaxis = /** @type {any[]} */ ([]).concat(yBounds).map((b, ai) => {
        /** @type {Record<string, any>} */
        const entry = b
          ? { min: b.min, max: b.max, tickAmount: b.tickAmount }
          : {}
        if (names) entry.seriesName = names[ai]
        // Identical bounds need identical label FORMATTING to yield
        // identical gutters: the library derives label decimals from each
        // panel's OWN data (decimalsInFloat only applies to float panels),
        // so a placeholder's zeros, or an integer-valued panel among float
        // siblings, would render "20" beside "20.00" and misalign. When the
        // user brought no formatter, push one uniform toFixed sized by the
        // union data's decimals and the tick step's own (both re-derived on
        // every update: a grid that turns fractional must print fractions).
        // A log axis sizes it by its smallest tick (0.01) instead of a step.
        const user = Array.isArray(userY) ? userY[ai] : userY
        if (b && typeof user?.labels?.formatter !== 'function') {
          entry.labels = {
            formatter: (/** @type {any} */ val) =>
              typeof val === 'number' && isFinite(val)
                ? val.toFixed(b.decimals)
                : val,
          }
        }
        return entry
      })
      if (!Array.isArray(yBounds)) patch.yaxis = patch.yaxis[0]
      if (valueAxisIsX) {
        patch.xaxis = Utils.extend(
          patch.xaxis || {},
          this._valueAxisXPatch(yBounds),
        )
      }
    }

    // Type frames (P5): the shared hidden frames every panel must draw in
    // (histogram range/binWidth, violin bandwidth, heatmap colorScale
    // min/max, bubble minZ/maxZ, the pie radius-by-total scale).
    const frames = this._frames
    if (frames && frames.plotOptions) {
      patch.plotOptions = Utils.clone(frames.plotOptions)
    }
    const ratio = frames && frames.pieScaleOf ? frames.pieScaleOf(slice.key) : null
    if (ratio !== null) {
      const userScale = this.ctx.opts?.plotOptions?.pie?.customScale
      patch.plotOptions = Utils.extend(patch.plotOptions || {}, {
        pie: {
          customScale: ratio * (typeof userScale === 'number' ? userScale : 1),
        },
      })
    }
    return patch
  }

  /**
   * Independent-y gutter alignment (22a Q2): measure every panel's label
   * gutter, push the max as a shared `yaxis.labels.minWidth`. `max()` of the
   * measured widths makes the panels' `max(minWidth, measured)` resolve to
   * the same constant everywhere, so one iteration is exact by construction.
   * @param {boolean} [grow] push only when the floor has to widen
   * @returns {Promise<void>}
   */
  async _alignGutters(grow = false) {
    const widths = this.panels
      .map((p) => p.chart?.w?.globals?.yLabelsCoords?.[0]?.width)
      .filter((v) => typeof v === 'number' && isFinite(v))
    if (!widths.length) return
    const isHorizontal = !!this.panels[0]?.chart?.w?.globals?.isBarHorizontal
    const labelPad = isHorizontal ? 0 : Y_LABEL_PAD
    const minWidth = Math.max(0, Math.max(...widths) - labelPad)
    // One floor for both paths: a virtualized grid keeps growing it as
    // panels mount, and an update only re-pushes it when it grew.
    if (grow && minWidth <= this.virtual._gutterFloor + 0.5) return
    this.virtual._gutterFloor = minWidth
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

  /**
   * Re-run the layout now that the shared chrome is measurable, so the panels
   * get the host height MINUS the title / toolbar / legend rather than all of
   * it. Only matters when the host gave a height at all — an aspect-ratio grid
   * is sized by its width and grows downward as much as it likes.
   */
  _refitForChrome() {
    const hostH = this._hostHeight()
    if (!hostH) return
    const chromeH = this._chromeHeight()
    if (chromeH <= 0 || Math.round(chromeH) === Math.round(this._chromeH)) {
      this._warnIfOverflowing()
      return
    }
    this._chromeH = chromeH
    this._relayout(this._containerWidth())
  }

  /**
   * Say so, once, when the minimum-panel-height floor has made the grid taller
   * than the box it was given. Silently overflowing is the thing that gets
   * reported as a bug; the floor itself is deliberate (panels below it are
   * unreadable), so the useful answer is which knob to turn.
   */
  _warnIfOverflowing() {
    const ly = this.layout
    if (!ly || !ly.overflowH || this._overflowWarned) return
    this._overflowWarned = true
    console.warn(
      `ApexCharts: trellis needs ${Math.round(ly.gridH + this._chromeH)}px but its container gives ${Math.round(this._hostHeight() || 0)}px; ` +
        `${ly.rows} rows cannot go below the ${ly.panelH}px panel floor. ` +
        'Raise the container, use fewer panels (trellis.limit) or more columns (trellis.columns), or lower trellis.minPanelHeight.',
    )
  }

  /** rAF-coalesced container resize -> single trellis-owned relayout. */
  _onContainerResize() {
    if (!this._mounted) return
    if (this._raf) return
    this._raf = requestAnimationFrame(() => {
      this._raf = 0
      const width = this._containerWidth()
      const height = this._hostHeight() || 0
      // A height-only resize is a real relayout: with a percentage height the
      // panels are sized FROM the container, so returning early on an
      // unchanged width left every panel at its old height forever.
      if (
        Math.round(width) === Math.round(this._lastWidth) &&
        Math.round(height) === Math.round(this._lastHeight)
      ) {
        return
      }
      this._lastWidth = width
      this._lastHeight = height
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
    this._fire('panelPromoted', { key: panel.key, chart: panel.chart })
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
    this._fire('panelRestored', { key: panel ? panel.key : null })
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
      chromeHeight: this._chromeH,
    })
    this._applyGridStyle()
    this._warnIfOverflowing()
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
   * Can this option change reach the panels without rebuilding the grid?
   *
   * Every top-level key has to be one that only affects how a panel paints
   * (`PANEL_ONLY_OPTIONS`), and the grid has to be in its ordinary state: a
   * promoted panel carries a height the shared layout does not know about, so
   * re-pushing the layout's height would silently un-promote it.
   *
   * @param {Record<string, any>|undefined} options
   * @returns {boolean}
   */
  canApplyInPlace(options) {
    if (!this._mounted || this._promotedKey) return false
    if (!options || typeof options !== 'object') return false
    const keys = Object.keys(options)
    if (!keys.length) return false
    return keys.every((k) => PANEL_ONLY_OPTIONS.includes(k))
  }

  /**
   * Re-derive each live panel's options from the host's (already merged)
   * config and push them, leaving the grid, the panels and their state alone.
   *
   * Re-assembling rather than forwarding the caller's patch is deliberate: the
   * panel options are composed (scoped annotations, the shared colour map, the
   * compact-tooltip rule, the padding reclaim), and forwarding a raw patch
   * would drop whichever of those the patch happens to overlap.
   *
   * @param {boolean} [animate]
   * @returns {Promise<void>}
   */
  async applyPanelOptions(animate = true) {
    const split = this.split
    if (!split) return

    // `colors` feeds the series→colour map, so re-resolve it first. Pure and
    // cheap: no DOM, no panels touched.
    this._deriveShared(split, false)

    await Promise.all(
      this.panels.map((p) => {
        if (!p.chart) return Promise.resolve()
        const opts = this._assemblePanelOptions(p.index)
        // The data did not change, and neither did the geometry: pushing them
        // again would re-run the whole parse for a recolour. Nor did the
        // domains: restating them would un-zoom every panel while the sync
        // (and each panel's zoomed flag) still held the window.
        delete opts.series
        delete opts.xaxis
        delete opts.yaxis
        if (opts.chart) delete opts.chart.height
        return p.chart
          .updateOptions(opts, false, animate, false, false)
          .catch(() => {})
      }),
    )

    // The shared legend paints its markers from the colour map.
    this.chrome.rebuildLegend()
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

    const nextSplit = splitSeries(newSeries || [], this.cfg, this._splitHost())
    // A cell that gains or loses its data under 'skip'/'hide' changes its
    // mount state, and a placeholder cell carries its own label: both are
    // structural, exactly like a changed key set.
    const sameKeys =
      nextSplit.panels.length === this.panels.length &&
      nextSplit.panels.every(
        (p, i) =>
          p.key === this.panels[i].key && !!p.empty === !!this.panels[i].empty,
      )
    if (!sameKeys) {
      this.teardown()
      return this.ctx.render()
    }

    this.split = nextSplit
    // Type frames, label decimals and scales are all data-derived.
    this._deriveShared(nextSplit)
    this.sync.prune(nextSplit.seriesNames)
    // New data restates every panel's domains, which un-zooms them, as a
    // plain chart's updateSeries does; the grid's window record and every
    // stashed (unmounted) window describe the old data, so they go too.
    this.sync.currentWindow = null
    this.panels.forEach((p) => {
      if (p.viewStash) p.viewStash = { ...p.viewStash, window: null, zoomed: false }
      if (p.chart) p.chart.w.interact.zoomed = false
    })
    const gen = this._gen

    await Promise.all(
      this.panels.map((p) => {
        if (!p.chart) return Promise.resolve()
        const patch = this._panelDataPatch(p.index)
        // yaxisPayload keeps the live gutter floor (labels.minWidth); with
        // several axes each live entry takes its own axis's patch.
        const py = patch.yaxis
        if (py) {
          patch.yaxis = yaxisPayload(p.chart, {}).map(
            (/** @type {any} */ e, /** @type {number} */ ai) =>
              Utils.extend(e, (Array.isArray(py) ? py[ai] : py) || {}),
          )
        }
        return p.chart
          .updateOptions(patch, false, animate, false)
          .catch(() => {})
      }),
    )
    if (gen !== this._gen) return
    // Independent y: a panel whose labels outgrew the shared gutter floor
    // pulls every panel with it. Grow-only, like the virtualized floor: a
    // second pass on every update would cut the update's own animation.
    if (this._yMode() !== 'shared') await this._alignGutters(true)
    if (gen !== this._gen) return
    // The shared chrome reads the data too: legend names and colours, and a
    // heatmap's gradient strip spans the new colour range.
    this.chrome.rebuildLegend()
    this._refitForChrome()
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
    // cancels an in-flight render (see _render), and drops its flag: the
    // cancelled render stops at its next await, so nothing is mounting now
    // and a stale `true` would hold every later update in a wait loop.
    this._gen++
    this._rendering = false
    this.virtual.stop()
    this._virtualActive = false
    this._panelRenderer = null
    this._promotedKey = null
    this._frames = null
    // A rebuild starts every panel on the trellis's own domains with the
    // default tool (the toolbar is rebuilt too), so no window or armed tool
    // may outlive it; the legend-hidden set does (pruned at render).
    this._tool = null
    this.sync.currentWindow = null
    this.chrome.destroyGradientLegend()
    const c = this.chrome
    c.elLegend = c.elToolbar = c.elTitle = c.elSubtitle = c.elBreadcrumb = null
    this._elChromeTop = null
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
