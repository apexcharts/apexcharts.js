// @ts-check
/**
 * The frozen facade handed to each Weave plugin. Plugins NEVER receive raw `w`,
 * internal module instances, or the `__apex_*` internals: only this stable,
 * versioned surface, so ApexCharts internals stay free to change.
 *
 * @module weave/PluginAPI
 */

/** Weave contract version. Plugins declare `apiVersion`; a mismatch is skipped. */
export const WEAVE_API_VERSION = 1

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
