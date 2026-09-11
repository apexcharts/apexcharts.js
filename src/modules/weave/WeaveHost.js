// @ts-check
import { getPlugin } from './PluginRegistry'
import { buildPluginAPI, makeLayerHandle, WEAVE_API_VERSION } from './PluginAPI'

export { WEAVE_API_VERSION }

/**
 * Weave (#1): one host per chart instance (`ctx.weave`).
 *
 * Reads `w.config.plugins`, resolves registered definitions, version-gates
 * them, builds a frozen PluginAPI per active plugin, runs `setup(api)` once,
 * and owns hook dispatch + layer lifecycle. Eager module (like drilldown) so it
 * exists before the first render and survives update(); it is the tree-shakeable
 * *host*: `ApexCharts.registerPlugin` lives in core, so plugins can always be
 * registered, but they only activate when this host is bundled.
 *
 * Hooks: afterParse, afterScales, draw, afterUpdate, destroy. `draw` is the
 * main render hook; it fires at the end of mount() and fastUpdate() (see the
 * seams in apexcharts.js) after series/grid/axes are live in elGraphical.
 *
 * @module weave/WeaveHost
 */
export default class WeaveHost {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** @type {any[]} [{ def, api, options, handlers: Map, disabled, failures }] */
    this.active = []
    /** @type {Map<string, any>} name -> svg.js group */
    this._layers = new Map()
    /** @type {any} */ this._currentScales = null
    /** @type {any} */ this._lastPluginsRef = null
    /** @type {any} per-dispatch data snapshot backing api.data reads */
    this._lastData = null
    /** @type {boolean} */ this._updatedWired = false
    /** @type {Map<string, string[]>|null} plugin name -> series it owns */
    this._derived = null

    this._onUpdated = this._onUpdated.bind(this)
    this._init()
  }

  _init() {
    const list = this.w.config.plugins || []
    list
      .map((/** @type {any} */ entry, /** @type {number} */ i) => ({
        entry,
        order: entry.order != null ? entry.order : i,
      }))
      .sort((/** @type {any} */ a, /** @type {any} */ b) => a.order - b.order)
      .forEach((/** @type {any} */ o) => this._activate(o.entry))

    this._lastPluginsRef = this.w.config.plugins
    // afterUpdate rides the existing 'updated' event (no extra core seam).
    this._wireUpdated()
  }

  _wireUpdated() {
    if (this._updatedWired) return
    this.ctx.addEventListener('updated', this._onUpdated)
    this._updatedWired = true
  }

  _onUpdated() {
    // Every parse reassigns globals.initialSeries, so a plugin's claim has to
    // be re-applied after each one, not only when markDerived() is called.
    this._repairInitialSeries()
    // draw already ran at the mount/fastUpdate seam; this is post-update work.
    this.dispatch('afterUpdate', { pass: 'update' })
  }

  /**
   * @param {any} entry { name, options?, order? }
   */
  _activate(entry) {
    const def = getPlugin(entry.name)
    if (!def) {
      console.error(`[apexcharts] plugin "${entry.name}" is not registered.`)
      return
    }
    // Forward-compatible rather than exact-match: every change to the contract
    // so far has been additive, so a plugin written against v1 runs unchanged
    // on a v2 host. Requiring equality would have meant that adding one field
    // silently disabled every plugin already in the wild. Only a plugin that
    // needs a NEWER host is skipped, which is the case where a field it depends
    // on really is absent.
    const v = def.apiVersion != null ? Math.trunc(def.apiVersion) : 1
    if (!(v >= 1) || v > WEAVE_API_VERSION) {
      console.error(
        `[apexcharts] plugin "${def.name}" targets Weave API v${def.apiVersion}, host is v${WEAVE_API_VERSION}; skipped.`,
      )
      return
    }
    const record = {
      def,
      options: Object.freeze({ ...(entry.options || {}) }),
      handlers: new Map(),
      disabled: false,
      failures: 0,
      api: null,
    }
    record.api = buildPluginAPI(this, record)
    this.active.push(record)
    this._guard(record, 'setup', () => def.setup(record.api))
  }

  /**
   * @param {string} hook
   * @param {{ pass?: string, xyRatios?: any }} [extra]
   */
  dispatch(hook, extra) {
    if (hook === 'draw') {
      this._reconcile()
      this._resetLayers()
    }
    // Data changed (or may have): invalidate the api.data read cache so a
    // between-hooks read never sees a stale snapshot.
    this._lastData = null
    if (!this.active.length) return

    if (hook === 'afterParse') {
      // geometry not computed yet: no scales.
      this._currentScales = null
    } else if (extra && 'xyRatios' in extra) {
      this._setScales(extra.xyRatios)
    }

    const pass = (extra && extra.pass) || 'full'
    /** @type {any} */ let data = null
    for (const record of this.active) {
      if (record.disabled) continue
      const fns = record.handlers.get(hook)
      if (!fns || !fns.length) continue
      if (data === null) {
        data = this._dataSnapshot()
        this._lastData = data // cache for api.data reads during/after this pass
      }
      const payload = {
        api: record.api,
        scales: this._currentScales,
        data,
        pass,
        hook,
      }
      // slice() so a handler calling off() mid-dispatch can't corrupt iteration
      for (const fn of fns.slice()) {
        this._guard(record, hook, () => fn(payload))
      }
    }
  }

  /**
   * @param {any} record
   * @param {string} where
   * @param {Function} fn
   */
  _guard(record, where, fn) {
    if (record.disabled) return
    try {
      fn()
    } catch (e) {
      console.error(
        `[apexcharts] plugin "${record.def.name}" threw in "${where}":`,
        e,
      )
      record.failures = (record.failures || 0) + 1
      if (record.failures >= 3) {
        record.disabled = true
        console.error(
          `[apexcharts] plugin "${record.def.name}" disabled after repeated errors.`,
        )
      }
    }
  }

  // ─── Scales facade ──────────────────────────────────────────────────────

  /**
   * Build api.scales from the SAME xyRatios the series were drawn with, so
   * plugin pixels align with series pixels by construction.
   *
   * The pixels are LAYER-LOCAL: the plugin layer `<g>` lives inside
   * elGraphical, which already carries translate(translateX, translateY), so
   * the domain edges map to 0 and gridWidth/gridHeight here, exactly like the
   * positions the series hand to drawMarker. These scales used to add the
   * layout translate as well, which shifted everything a plugin drew by
   * exactly the grid offset; a consumer of the old behaviour can rebase by
   * subtracting x(domainX[0]) and y(domainY(axis)[1]), which is a no-op now.
   * @param {any} xyRatios
   */
  _setScales(xyRatios) {
    const w = this.w
    const gl = w.globals
    const L = w.layout
    if (!xyRatios || !gl.axisCharts) {
      this._currentScales = null
      return
    }
    const xRatio = xyRatios.xRatio
    const yRatio = xyRatios.yRatio || []
    /** @param {number} axis */
    const yr = (axis) => (yRatio[axis] != null ? yRatio[axis] : yRatio[0])
    /** @param {number} axis */
    const maxY = (axis) => (gl.maxYArr[axis] != null ? gl.maxYArr[axis] : gl.maxY)
    /** @param {number} axis */
    const minY = (axis) => (gl.minYArr[axis] != null ? gl.minYArr[axis] : gl.minY)

    // A chart laid out in BANDS rather than on an x scale: a category bar or
    // column (stacked included), a rangeBar, a heatmap. The parser never
    // computes an x range for these, so globals.minX/maxX keep the sentinels
    // they were seeded with, the ratio form below divides every value down to
    // the same pixel, and domainX reads as [+MAX_VALUE, -MAX_VALUE]. A plugin
    // drawing through that got a path of NaN or a line of no length: six
    // working tools in apex-analyst drew nothing at all on any bar chart, and
    // their buttons still lit up, because nothing in the facade said no.
    //
    // Projected the way Bar's own helper lays the slots out: the plot is cut
    // into `dataPoints` equal bands and the mark for band j sits at its
    // centre, so j maps to gridWidth / dataPoints * (j + 0.5). Checked against
    // the rendered marks of all four types. That index is also what api.data
    // hands out as the x here, because the snapshot falls back to the position
    // when seriesX is absent, which it is for exactly these charts.
    //
    // The domain is the plot's own edges in band units, half a band either
    // side, which keeps this facade's contract that domainX[0] maps to 0 and
    // domainX[1] to gridWidth.
    //
    // Not applied to horizontal bars: there x carries the VALUE axis, so a
    // band index along x would be confidently wrong rather than merely flat.
    // That transposition is a separate fix, and nothing consumes it today.
    //
    // globals.padHorizontal, which Bar adds to the same expression, is
    // deliberately absent: it is 0 everywhere in this codebase (its only
    // assignment), and adding it would break the domain contract above rather
    // than move a mark. If it is ever made live, the two need revisiting
    // together.
    const banded =
      !w.axisFlags.isXNumeric && !gl.isBarHorizontal && gl.dataPoints > 0
    const band = banded ? L.gridWidth / gl.dataPoints : 0

    this._currentScales = {
      x: banded
        ? (/** @type {number} */ v) => band * (v + 0.5)
        : (/** @type {number} */ v) => (v - gl.minX) / xRatio,
      /**
       * @param {number} v
       * @param {number} [axis]
       */
      y: (v, axis = 0) => (maxY(axis) - v) / yr(axis),
      domainX: banded ? [-0.5, gl.dataPoints - 0.5] : [gl.minX, gl.maxX],
      /** @param {number} [axis] */
      domainY: (axis = 0) => [minY(axis), maxY(axis)],
      gridWidth: L.gridWidth,
      gridHeight: L.gridHeight,
      ratios: xyRatios,
    }
  }

  // ─── Read-only data snapshot ────────────────────────────────────────────

  /**
   * @returns {any[]} defensive per-series snapshot (never the live slice)
   */
  _dataSnapshot() {
    const w = this.w
    const gl = w.globals
    const series = w.seriesData.series || []
    const seriesX = w.seriesData.seriesX || []
    const cfgSeries = Array.isArray(w.config.series) ? w.config.series : []
    return series.map((/** @type {any} */ sData, /** @type {number} */ i) => {
      // A non-axis chart (pie / donut / radialBar) holds ONE NUMBER per entry
      // rather than a row of values, so treating every entry as an array called
      // .map on a number and threw. Because dispatch builds this payload up
      // front, that exception was caught by the per-plugin guard and DISABLED
      // the plugin: every Weave plugin silently did nothing on a pie, with the
      // failure attributed to the plugin rather than to the host. Each slice is
      // presented as a one-point series, which is what it is.
      const row = Array.isArray(sData) ? sData : [sData]
      const xs = seriesX[i] || []
      const points = row.map((/** @type {any} */ y, /** @type {number} */ j) => ({
        x: xs[j] != null ? xs[j] : j,
        y,
      }))
      // v2: the caller's OWN data array, untouched by parsing.
      //
      // `points` above is normalised, and its x falls back to the ordinal
      // position whenever `seriesX` is unpopulated, which happens on some
      // render paths. That is fine for reading, and wrong as the basis for
      // WRITING a derived series back: the three accepted shapes (`[1,2]`,
      // `[{x,y}]`, `[[x,y]]`) are not interchangeable, and handing back the
      // wrong one parses to all-null and draws nothing without an error. A
      // plugin that emits a series needs the original shape to copy.
      const cfg = cfgSeries[i]
      const raw =
        cfg && typeof cfg === 'object' && Array.isArray(cfg.data) ? cfg.data : []
      return {
        name: gl.seriesNames ? gl.seriesNames[i] : undefined,
        hidden: (gl.collapsedSeriesIndices || []).includes(i),
        color: gl.colors ? gl.colors[i] : undefined,
        points,
        raw,
      }
    })
  }

  /**
   * Display labels per x position, resolved so they survive every render path.
   *
   * `config.xaxis.categories` leads because it is the caller's own input;
   * `globals.categoryLabels` covers labels that came from string-x data, and
   * `globals.labels` is the last resort. Both globals are populated after a
   * mount and empty after an updateSeries(), so a consumer reading either alone
   * gets real labels on first paint and ordinals afterwards.
   *
   * @returns {string[]}
   */
  _categories() {
    const w = this.w
    const gl = w.globals
    const cfgCats =
      w.config.xaxis && Array.isArray(w.config.xaxis.categories)
        ? w.config.xaxis.categories
        : []
    const glCats = Array.isArray(gl.categoryLabels) ? gl.categoryLabels : []
    const glLabels = Array.isArray(gl.labels) ? gl.labels : []
    const src = cfgCats.length ? cfgCats : glCats.length ? glCats : glLabels

    const series = w.seriesData.series || []
    let length = 0
    for (let i = 0; i < series.length; i++) {
      const row = series[i]
      if (Array.isArray(row) && row.length > length) length = row.length
    }
    if (!length) length = src.length

    const out = []
    for (let i = 0; i < length; i++) {
      const v = src[i]
      out.push(v === undefined || v === null ? String(i + 1) : String(v))
    }
    return out
  }

  /**
   * Record the series a plugin owns, and repair the initial-series snapshot.
   *
   * `Data.parseData()` assigns `globals.initialSeries` on every parse
   * unconditionally, so `updateSeries(..., overwriteInitialSeries: false)` does
   * NOT keep a plugin's computed series out of it. That assignment is
   * deliberate (it is what keeps resetSeries() correct for the reducer,
   * histogram, dumbbell, streamgraph, waterfall and treemap raw-series paths),
   * so the fix is to put the caller's own series back afterwards rather than to
   * make the assignment conditional.
   *
   * Without this, a plugin that adds a computed series poisons resetSeries():
   * pressing the toolbar's reset hands the user the plugin's output as if it
   * were their own data, and it survives switching the plugin off.
   *
   * @param {string} pluginName
   * @param {string[]} names
   */
  _markDerived(pluginName, names) {
    if (!this._derived) this._derived = new Map()
    const list = Array.isArray(names) ? names.map((n) => String(n)) : []
    if (list.length) {
      this._derived.set(pluginName, list)
    } else {
      this._derived.delete(pluginName)
    }
    this._repairInitialSeries()
  }

  /** All series names currently claimed by plugins. */
  _derivedNames() {
    const out = new Set()
    if (!this._derived) return out
    for (const list of this._derived.values()) {
      for (const n of list) out.add(n)
    }
    return out
  }

  _repairInitialSeries() {
    const drop = this._derivedNames()
    if (!drop.size) return
    const w = this.w
    const series = /** @type {any[]} */ (
      Array.isArray(w.config.series) ? w.config.series : []
    )
    const own = series.filter(
      (/** @type {any} */ s) => !drop.has(String(s && s.name)),
    )
    // Nothing to protect: the chart holds only plugin series, so leaving the
    // snapshot alone is better than emptying it.
    if (!own.length) return
    try {
      w.globals.initialSeries = own
      if (
        w.globals.initialConfig &&
        Array.isArray(w.globals.initialConfig.series)
      ) {
        w.globals.initialConfig.series = own
      }
    } catch {
      // Never worth breaking a render over; the cost is a reset that restores
      // the plugin's series too.
    }
  }

  // ─── Theme tokens ───────────────────────────────────────────────────────

  /**
   * @param {string} name
   * @returns {any}
   */
  _token(name) {
    const w = this.w
    const gl = w.globals
    switch (name) {
      case 'foreColor':
        return w.config.chart.foreColor
      case 'background':
        return w.config.chart.background
      case 'accent':
      case 'primary':
        return gl.colors ? gl.colors[0] : undefined
      default:
        if (/^series-\d+$/.test(name)) {
          return gl.colors ? gl.colors[Number(name.split('-')[1])] : undefined
        }
        return undefined
    }
  }

  // ─── Layers ─────────────────────────────────────────────────────────────

  /**
   * @param {string} name
   * @param {{ z?: 'front'|'behind', className?: string }} opts
   */
  _layer(name, { z = 'front', className = '' } = {}) {
    let g = this._layers.get(name)
    if (!g) {
      g = this.ctx.graphics.group({
        class: `apexcharts-plugin-${name} ${className}`.trim(),
      })
      const parent = this.w.dom.elGraphical.node
      if (z === 'behind') parent.insertBefore(g.node, parent.firstChild)
      else parent.appendChild(g.node)
      g.node.setAttribute('aria-hidden', 'true')
      this._layers.set(name, g)
    }
    return makeLayerHandle(g, this.ctx.graphics)
  }

  /**
   * Remove all plugin layers. Run at the start of every `draw` because
   * fastUpdate only removes series/data-label groups (not arbitrary plugin
   * groups), so without this, fast-path redraws would duplicate plugin output.
   */
  _resetLayers() {
    const el = this.w.dom.elGraphical
    const parent = el && el.node
    if (parent) {
      const groups = parent.querySelectorAll('g[class*="apexcharts-plugin-"]')
      Array.prototype.forEach.call(groups, (/** @type {any} */ n) => n.remove())
    }
    this._layers.clear()
  }

  // ─── Config-change reconciliation ───────────────────────────────────────

  /**
   * Diff w.config.plugins by name: teardown removed, activate added; unchanged
   * plugins keep their instance + store, but their `options` are refreshed from
   * the new entry (api.options is a live getter), so
   * updateOptions({ plugins: [{ name, options }] }) reconfigures in place.
   * Skipped when the plugins array reference is unchanged (fast redraws), so it
   * costs nothing on hover.
   */
  _reconcile() {
    const plugins = this.w.config.plugins || []
    if (plugins === this._lastPluginsRef) return
    this._lastPluginsRef = plugins

    const desired = new Map(
      plugins.map((/** @type {any} */ e, /** @type {number} */ i) => [
        e.name,
        { entry: e, order: e.order != null ? e.order : i },
      ]),
    )

    // Remove plugins no longer desired; refresh options on the survivors.
    for (let i = this.active.length - 1; i >= 0; i--) {
      const r = this.active[i]
      const want = desired.get(r.def.name)
      if (!want) {
        this._guard(r, 'destroy', () => r.def.destroy && r.def.destroy(r.api))
        this.active.splice(i, 1)
      } else {
        r.options = Object.freeze({ ...(want.entry.options || {}) })
      }
    }

    // Add newly desired plugins (in order).
    const activeNames = new Set(this.active.map((/** @type {any} */ r) => r.def.name))
    /** @type {any[]} */
    const toAdd = []
    desired.forEach((/** @type {any} */ v, /** @type {string} */ name) => {
      if (!activeNames.has(name)) toAdd.push(v)
    })
    toAdd
      .sort((a, b) => a.order - b.order)
      .forEach((/** @type {any} */ v) => this._activate(v.entry))
  }

  /**
   * @param {boolean} [isUpdating]
   */
  teardown(isUpdating) {
    // Layers live in elGraphical, which clearDomElements wipes on both update
    // and full destroy, so they auto-clear. Only run plugin cleanup (and detach
    // the 'updated' listener) on a full destroy.
    if (!isUpdating) {
      // Fire the 'destroy' hook (api.on('destroy', ...)) then the top-level
      // def.destroy(api) convenience method.
      this.dispatch('destroy')
      for (const record of this.active) {
        this._guard(record, 'destroy', () => record.def.destroy && record.def.destroy(record.api))
      }
      this.active = []
      this._derived = null
      if (this._updatedWired) {
        this.ctx.removeEventListener &&
          this.ctx.removeEventListener('updated', this._onUpdated)
        this._updatedWired = false
      }
    }
    this._layers.clear()
  }
}
