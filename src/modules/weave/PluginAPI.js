// @ts-check
/**
 * The frozen facade handed to each Weave plugin. Plugins NEVER receive raw `w`,
 * internal module instances, or the `__apex_*` internals: only this stable,
 * versioned surface, so ApexCharts internals stay free to change.
 *
 * @module weave/PluginAPI
 */

/**
 * Weave contract version. Plugins declare `apiVersion`; a plugin targeting a
 * NEWER version than the host is skipped, an older one is served (every change
 * so far has been additive, so a v1 plugin runs unchanged on a v2 host).
 *
 * v2 added, for out-of-tree analysis plugins: `data[].raw` (the caller's own
 * data array, the only reliable template for emitting a derived series),
 * `api.info` (chart type / axis kind / horizontal bars), `api.categories`
 * (resolved display labels) and `api.markDerived()`.
 *
 * v3 added `api.reserve()`, for a plugin that renders its own UI inside the
 * chart's container and needs the chart to make room for it.
 *
 * v4 added `api.pointer()`, so a plugin can learn which data point a viewer is
 * pointing at or has selected. The chart already computed that for its own
 * tooltip and its `dataPoint*` events; before this a plugin either re-derived
 * it from raw pixels or did without.
 *
 * Feature-detect rather than bumping `apiVersion` unless the plugin genuinely
 * cannot work without the new surface: a plugin declaring v3 is SKIPPED
 * outright on a v2 host, so `apiVersion: 2` plus `typeof api.reserve ===
 * 'function'` keeps one build working on both.
 */
export const WEAVE_API_VERSION = 4

/**
 * Public chart methods safe to expose to plugins (each bound to ctx). Excludes
 * destroy, paper (raw SVG root), and anything that hands back internal nodes.
 */
const PLUGIN_CHART_METHODS = [
  'updateOptions',
  'updateSeries',
  'appendData',
  'appendSeries',
  'toggleSeries',
  'showSeries',
  'hideSeries',
  'highlightSeries',
  'isSeriesHidden',
  'zoomX',
  'addXaxisAnnotation',
  'addYaxisAnnotation',
  'addPointAnnotation',
  'clearAnnotations',
  'removeAnnotation',
  'dataURI',
  'exportToCSV',
]

/**
 * @param {any} ctx
 * @returns {Record<string, Function>}
 */
function buildBoundPublicMethods(ctx) {
  /** @type {Record<string, Function>} */
  const out = {}
  PLUGIN_CHART_METHODS.forEach((m) => {
    if (typeof ctx[m] === 'function') out[m] = ctx[m].bind(ctx)
  })
  return Object.freeze(out)
}

/**
 * A small, renderer-agnostic drawing surface over a plugin's `<g>` layer.
 * Coordinates are PIXELS in series space (use api.scales.x/y to convert from
 * data). Naming the primitives (path/line/rect/...) rather than exposing
 * Graphics directly is the forward-compat contract with Strata (#2): a
 * canvas-backed layer can implement the same interface.
 *
 * @param {any} g       svg.js group element (the plugin layer)
 * @param {any} graphics ctx.graphics
 */
export function makeLayerHandle(g, graphics) {
  /** @param {any} el */
  const add = (el) => {
    if (el) g.add(el)
    return el
  }
  const handle = {
    get node() {
      return g.node
    },
    /** @param {any} opts */
    path(opts = {}) {
      const {
        d = '',
        stroke = '#000',
        width = 1,
        fill = 'none',
        opacity = 1,
        dash = 0,
        className = '',
      } = opts
      return add(
        graphics.drawPath({
          d,
          stroke,
          strokeWidth: width,
          fill,
          fillOpacity: fill === 'none' ? 0 : opacity,
          strokeOpacity: opacity,
          strokeDashArray: dash,
          classes: className,
        }),
      )
    },
    /** @param {any} opts */
    line(opts = {}) {
      const { x1, y1, x2, y2, stroke = '#000', width = 1, dash = 0 } = opts
      return add(graphics.drawLine(x1, y1, x2, y2, stroke, dash, width))
    },
    /** @param {any} opts */
    rect(opts = {}) {
      const {
        x = 0,
        y = 0,
        w = 0,
        h = 0,
        r = 0,
        fill = '#000',
        stroke = null,
        opacity = 1,
      } = opts
      return add(
        graphics.drawRect(
          x,
          y,
          w,
          h,
          r,
          fill,
          opacity,
          stroke != null ? 1 : null,
          stroke,
        ),
      )
    },
    /** @param {any} opts */
    circle(opts = {}) {
      const { cx = 0, cy = 0, r = 0, fill = '#000', stroke = null } = opts
      return add(
        graphics.drawCircle(r, { cx, cy, fill, stroke: stroke || 'none' }),
      )
    },
    /** @param {any} opts */
    text(opts = {}) {
      const {
        x = 0,
        y = 0,
        text = '',
        color,
        size,
        anchor = 'start',
        weight,
      } = opts
      return add(
        graphics.drawText({
          x,
          y,
          text,
          textAnchor: anchor,
          fontSize: size,
          foreColor: color,
          fontWeight: weight,
        }),
      )
    },
    clear() {
      const node = g.node
      while (node.firstChild) node.removeChild(node.firstChild)
      return handle
    },
  }
  return handle
}

/**
 * Build the frozen PluginAPI for one activated plugin.
 * @param {any} host  WeaveHost
 * @param {any} record { def, options, handlers: Map, api }
 * @returns {any} frozen api
 */
export function buildPluginAPI(host, record) {
  const ctx = host.ctx
  const w = host.w

  const api = {
    name: record.def.name,
    version: WEAVE_API_VERSION,

    // Live: reconcile refreshes record.options when the chart's plugins config
    // changes, so updateOptions({ plugins: [{ name, options }] }) reconfigures
    // an active plugin in place. The returned object is frozen.
    get options() {
      return record.options
    },

    // ── lifecycle subscription ──
    /**
     * @param {string} hook
     * @param {Function} fn
     */
    on(hook, fn) {
      const m = record.handlers
      if (!m.has(hook)) m.set(hook, [])
      m.get(hook).push(fn)
      return api
    },
    /**
     * @param {string} hook
     * @param {Function} fn
     */
    off(hook, fn) {
      const a = record.handlers.get(hook)
      if (a) {
        const i = a.indexOf(fn)
        if (i > -1) a.splice(i, 1)
      }
      return api
    },

    // ── per-plugin, per-chart scratch state (survives updates, dropped on
    //    destroy). The api object is frozen, but this object is mutable. ──
    store: {},

    // ── drawing (renderer-agnostic) ──
    // Call this INSIDE each draw handler: the host wipes plugin layers at the
    // start of every draw pass, so a handle cached across draws points at a
    // detached node and its writes vanish silently.
    /** @param {any} [opts] */
    layer(opts) {
      return host._layer(record.def.name, opts || {})
    },

    // ── reads ──
    get scales() {
      return host._currentScales
    },
    // Served from the per-dispatch snapshot when one exists (invalidated at
    // every dispatch), so reading api.data in a loop does not rebuild the
    // point arrays on each property access.
    get data() {
      return host._lastData || (host._lastData = host._dataSnapshot())
    },
    theme: Object.freeze({
      get mode() {
        return w.config.theme.mode
      },
      get foreColor() {
        return w.config.chart.foreColor
      },
      /** @param {number} i */
      seriesColor(i) {
        return w.globals.colors[i]
      },
      /** @param {string} name */
      token(name) {
        return host._token(name)
      },
    }),

    // ── curated actions (bound public methods only; NEVER raw w) ──
    chart: buildBoundPublicMethods(ctx),

    // ── chart shape (v2) ──
    // What kind of chart this is, for a plugin that has to decide whether it
    // applies at all. An analysis or derived-series plugin cannot work on every
    // type, and the alternative to asking is adding a series and letting the
    // core warn at the user.
    get info() {
      return Object.freeze({
        // The type the caller ASKED for: `requestedType` survives the aliasing
        // that rewrites e.g. raincloud to violin.
        type: String(
          (w.config.chart && (w.config.chart.requestedType || w.config.chart.type)) ||
            'line',
        ),
        // false for pie / donut / radialBar, where `data` is one value per slice.
        axisChart: w.globals.axisCharts === true,
        datetimeX: !!(w.config.xaxis && w.config.xaxis.type === 'datetime'),
        // The core refuses to draw a horizontal bar in a combo, so a plugin must
        // not add a derived series to one.
        horizontalBars: !!(
          w.config.plotOptions &&
          w.config.plotOptions.bar &&
          w.config.plotOptions.bar.horizontal
        ),
        // Whether the chart prints a value on each point, and which series it
        // prints them for. A plugin that ADDS a series needs both: there is no
        // per-series dataLabels flag, so `dataLabels.enabledOnSeries` is the
        // only way to keep labels off a computed series, and narrowing it
        // without knowing the caller's own value would silently discard it.
        dataLabels: Object.freeze({
          enabled: !!(w.config.dataLabels && w.config.dataLabels.enabled),
          enabledOnSeries: Array.isArray(
            w.config.dataLabels && w.config.dataLabels.enabledOnSeries,
          )
            ? w.config.dataLabels.enabledOnSeries.slice()
            : null,
        }),
      })
    },

    // Display labels per x position (v2).
    //
    // Resolved config-first on purpose. `globals.categoryLabels` and
    // `globals.labels` are populated after a mount and EMPTY after an
    // updateSeries(), so a plugin reading either directly would render real
    // labels on first paint and ordinals after any update.
    get categories() {
      return host._categories()
    },

    /**
     * Declare which series on this chart belong to the plugin rather than to
     * the caller (v2).
     *
     * A plugin that adds computed series has to say so, because the core cannot
     * tell them apart and several behaviours depend on the distinction. Today
     * the host uses it to keep them out of the initial-series snapshot, so
     * `resetSeries()` and the toolbar's reset restore the caller's own data
     * instead of the plugin's output.
     *
     * Idempotent; pass an empty array when the plugin's series are gone.
     *
     * @param {string[]} names series names the plugin owns
     */
    markDerived(names) {
      host._markDerived(record.def.name, names)
      return api
    },

    /**
     * Reserve space inside the chart's container for the plugin's own UI (v3).
     *
     * A plugin that renders HTML beside the chart (a docked panel, a toolbar of
     * its own) cannot make room for it. The chart sizes itself from the element
     * the caller handed it, so a sibling inserted into that element does not
     * narrow the chart: the chart is drawn at full width underneath. Every
     * route a plugin has to fix that on its own is worse. Writing `chart.width`
     * means owning config the caller owns and losing it on their next
     * `updateOptions`. Positioning the UI absolutely over the chart means
     * guessing a size it cannot know, and being clipped by any ancestor with
     * `overflow: hidden`. Narrowing the container means writing to the caller's
     * own element and changing the page's layout around it.
     *
     * So the host does the arithmetic, in the one place that already does it.
     * The container keeps its size; the chart draws inside what is left.
     *
     * Reservations are per plugin and summed, so two plugins each asking for a
     * right-hand gutter get one each instead of overlapping. Call it again to
     * change the amount, and pass `null` (or all zeros) to give the space back.
     * Nothing happens when the box is unchanged, so calling it on every render
     * with the same numbers is free.
     *
     * The total is clamped so the chart keeps at least half the container on
     * each axis: a plugin may not reduce the chart it is annotating to nothing.
     * A plugin whose UI needs more room than that should render below the chart
     * instead, which it can do without asking.
     *
     * Changing a reservation re-renders the chart, one task later so that
     * calling it from inside a draw handler cannot re-enter the render.
     *
     * @param {{left?: number, right?: number, top?: number, bottom?: number}|null} [box]
     */
    reserve(box) {
      host._reserve(record.def.name, box)
      return api
    },

    /**
     * Subscribe to the data point a viewer is pointing at.
     *
     * The chart already knows this: it resolves the series and point under the
     * pointer for its own tooltip and fires `dataPointMouseEnter`,
     * `dataPointMouseLeave` and `dataPointSelection` for the caller. This
     * forwards the same three, so a plugin gets the host's answer rather than
     * hit-testing the SVG itself and disagreeing with the tooltip.
     *
     * The payload is normalised rather than the chart's own argument list,
     * which passes `w`. A plugin must not receive `w`, and the three things a
     * plugin actually wants (which series, which point, what the point is
     * called) are exactly what the chart has already resolved.
     *
     * `category` is the resolved display label, the same string `api.categories`
     * carries, because a plugin coordinating two charts keys on the label
     * rather than on an index that means something different on each chart.
     *
     * Nothing here gives a plugin the ability to intercept or cancel: the
     * chart's own tooltip, selection state and caller events are unaffected,
     * and a handler that throws is contained rather than allowed to break the
     * interaction it was watching.
     *
     * @param {(e: {type: 'enter'|'leave'|'select', seriesIndex: number, dataPointIndex: number, category: string|undefined, seriesName: string|undefined, selected: boolean|undefined}) => void} fn
     * @returns {() => void} unsubscribe
     * @since Weave v4
     */
    pointer(fn) {
      return host._onPointer(record.def.name, fn)
    },

    // ── custom events out to the host app ──
    /**
     * Fires as `plugin:<pluginName>:<name>` on the chart's event bus. The
     * namespace is not optional: the bus also carries the internal lifecycle
     * events ('updated', 'mounted', ...), and an un-namespaced emit could
     * trigger every internal subscriber (history capture, re-render hooks).
     * Listen with chart.addEventListener('plugin:myplugin:myevent', fn).
     * @param {string} name
     * @param {any} [detail]
     */
    emit(name, detail) {
      ctx.events.fireEvent(`plugin:${record.def.name}:${name}`, [ctx, detail])
    },

    // ── host element (read; lazy: baseEl is not set until render) ──
    get el() {
      return w.dom.baseEl
    },
  }

  return Object.freeze(api)
}
