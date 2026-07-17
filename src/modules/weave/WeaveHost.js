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
    const v = def.apiVersion != null ? def.apiVersion : 1
    if (Math.trunc(v) !== WEAVE_API_VERSION) {
      console.error(
        `[apexcharts] plugin "${def.name}" targets Weave API v${v}, host is v${WEAVE_API_VERSION}; skipped.`,
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
    this._currentScales = {
      /** @param {number} v */
      x: (v) => L.translateX + (v - gl.minX) / xRatio,
      /**
       * @param {number} v
       * @param {number} [axis]
       */
      y: (v, axis = 0) => L.translateY + (maxY(axis) - v) / yr(axis),
      domainX: [gl.minX, gl.maxX],
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
    return series.map((/** @type {any[]} */ sData, /** @type {number} */ i) => {
      const xs = seriesX[i] || []
      const points = (sData || []).map((/** @type {any} */ y, /** @type {number} */ j) => ({
        x: xs[j] != null ? xs[j] : j,
        y,
      }))
      return {
        name: gl.seriesNames ? gl.seriesNames[i] : undefined,
        hidden: (gl.collapsedSeriesIndices || []).includes(i),
        color: gl.colors ? gl.colors[i] : undefined,
        points,
      }
    })
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
      if (this._updatedWired) {
        this.ctx.removeEventListener &&
          this.ctx.removeEventListener('updated', this._onUpdated)
        this._updatedWired = false
      }
    }
    this._layers.clear()
  }
}
