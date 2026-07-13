// @ts-check
import Utils from '../../utils/Utils'
import { Environment } from '../../utils/Environment.js'
import { captureViewState, applyViewInteraction } from '../state/ViewState'

/**
 * Rewind (#3) — in-memory undo/redo history.
 *
 * A checkpoint stack over the mutable `w` engine. Every committed change
 * produces one checkpoint = { view: ViewState, config: <COW clone>, ... }
 * appended after the current pointer (truncating any redo tail). undo() applies
 * the previous checkpoint; redo() the next.
 *
 * Design properties:
 *   - **In-memory, function-preserving.** Snapshots use `Utils.clone` (which
 *     passes functions through by reference), NOT JSON — so formatters,
 *     event callbacks and function-colors survive an undo. (Perspectives, by
 *     contrast, must strip functions to serialise; that is the one real
 *     difference between the two features.)
 *   - **Event-driven, near-zero core intrusion.** Capture is triggered purely
 *     by subscribing to the existing emitter ('mounted' for the baseline,
 *     'updated'/'scrolled' for changes, 'dataPointSelection' for selection).
 *     There are NO edits to _updateOptions / _updateSeries.
 *   - **Copy-on-write series.** Cloning the (large) series data on every
 *     zoom/toggle is wasteful, so a checkpoint shares the previous one's cloned
 *     series unless w.config.series identity changed.
 *   - **Robust against async 'updated'.** 'updated' fires inside mount().then()
 *     (async), so a restore's own re-renders emit 'updated' after the call
 *     returns. A settle-timer holds `applying` true across the whole restore
 *     burst, and a signature dedup at commit time makes any leaked capture a
 *     no-op (the state equals the just-restored checkpoint).
 *
 * Eager module (like drilldown): constructed once in InitCtxVariables so the
 * stack survives update() and is dropped on destroy(). Opt-in via
 * chart.history.enabled — it only wires listeners when enabled.
 *
 * Public API (namespaced under chart.history):
 *   chart.history.undo() / redo() / canUndo() / canRedo()
 *   chart.history.jump(id) / clear() / entries()
 *   chart.history.transaction(fn, { label })   // group multiple edits
 *   chart.on('historyChange', (ctx, state) => {})
 *
 * @module History
 */

export default class History {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx

    /**
     * Checkpoint stack; index 0 is the baseline (initial render).
     * @type {Array<any>}
     */
    this.stack = []
    /** Current position in the stack (-1 before the baseline is captured). */
    this.pointer = -1

    /** Suppress capture while a restore (undo/redo/jump) is applying. */
    this.applying = false
    /** Suppress intermediate captures inside a transaction. */
    this._batching = false

    this._counter = 0
    /** @type {any} */ this._coalesceTimer = null
    /** @type {any} */ this._settleTimer = null
    /** @type {string|undefined} */ this._pendingLabel = undefined
    /** Source-series identity at the last capture (for copy-on-write). */
    /** @type {any} */ this._lastSeriesRef = null
    /** Keydown target (kept so teardown can detach it). @type {any} */
    this._keydownTarget = null
    this._wired = false

    const cfg = (w.config.chart && w.config.chart.history) || {}
    this.enabled = !!cfg.enabled
    this.maxDepth = cfg.maxDepth > 0 ? cfg.maxDepth : 100
    this.coalesceMs = cfg.coalesceMs != null ? cfg.coalesceMs : 250
    this.keyboard = cfg.keyboard !== false

    this._onMounted = this._onMounted.bind(this)
    this._onUpdated = this._onUpdated.bind(this)
    this._onSelection = this._onSelection.bind(this)
    this._onKeyDown = this._onKeyDown.bind(this)

    // Self-wire. w.globals.events outlives updates, so listeners persist.
    this.init()
  }

  init() {
    if (!this.enabled || this._wired) return
    this._wired = true

    this.ctx.addEventListener('mounted', this._onMounted)
    this.ctx.addEventListener('updated', this._onUpdated)
    this.ctx.addEventListener('scrolled', this._onUpdated)
    this.ctx.addEventListener('dataPointSelection', this._onSelection)

    // Keyboard: Cmd/Ctrl+Z = undo, Shift+Cmd/Ctrl+Z or Ctrl+Y = redo, active
    // when focus is inside the chart. Attached to the stable user container so
    // it survives internal DOM rebuilds and catches keydown bubbling up from
    // the (KeyboardNavigation-focusable) SVG.
    const el = /** @type {any} */ (this.ctx).el
    if (this.keyboard && Environment.isBrowser() && el) {
      el.addEventListener('keydown', this._onKeyDown)
      this._keydownTarget = el
    }
  }

  // ─── Event handlers ─────────────────────────────────────────────────────

  _onMounted() {
    // Capture the baseline immediately (not coalesced) so undo can return to
    // the initial state. Guarded so it only happens once.
    if (this.stack.length === 0) this._commit('initial', true)
  }

  _onUpdated() {
    if (this.applying) {
      this._refreshSettle()
      return
    }
    this._schedule('update')
  }

  _onSelection() {
    if (this.applying) return
    this._schedule('selection')
  }

  /**
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e) {
    if (!(e.metaKey || e.ctrlKey)) return
    const key = (e.key || '').toLowerCase()
    if (key !== 'z' && key !== 'y') return
    const redo = key === 'y' || e.shiftKey
    e.preventDefault()
    if (redo) this.redo()
    else this.undo()
  }

  // ─── Capture (coalesced) ────────────────────────────────────────────────

  /**
   * @param {string} label
   */
  _schedule(label) {
    if (this.applying || this._batching || !this.enabled) return
    this._pendingLabel = label
    if (this.coalesceMs > 0 && Environment.isBrowser()) {
      clearTimeout(this._coalesceTimer)
      this._coalesceTimer = setTimeout(
        () => this._commit(this._pendingLabel),
        this.coalesceMs,
      )
    } else {
      this._commit(label)
    }
  }

  /**
   * @param {string} [label]
   * @param {boolean} [force] bypass the applying/batching guard (baseline / transaction)
   */
  _commit(label, force) {
    clearTimeout(this._coalesceTimer)
    this._coalesceTimer = null
    if (!force && (this.applying || this._batching)) return

    const cp = this._capture(label)
    const current = this.stack[this.pointer]
    // Dedup: identical state contributes no checkpoint (also neutralises any
    // 'updated' that leaks past `applying` after a restore).
    if (current && current.sig === cp.sig) return

    // Truncate the redo tail, then append.
    if (this.pointer < this.stack.length - 1) {
      this.stack.splice(this.pointer + 1)
    }
    this.stack.push(cp)
    this.pointer = this.stack.length - 1

    // Ring buffer: bound memory.
    while (this.stack.length > this.maxDepth) {
      this.stack.shift()
      this.pointer--
    }

    this._emitChange()
  }

  /**
   * @param {string} [label]
   */
  _capture(label) {
    const view = captureViewState(this.w, this.ctx)
    const config = this._cloneConfigCOW()
    return {
      id: `hist-${++this._counter}`,
      view,
      config,
      label: label || 'change',
      at: Environment.isBrowser() ? Date.now() : 0,
      origin: 'local', // reserved for per-user scoping (Live Rooms)
      sig: this._signature(view, config),
    }
  }

  /**
   * Clone w.config, sharing the previous checkpoint's cloned series when the
   * source series reference is unchanged (copy-on-write).
   * @returns {any}
   */
  _cloneConfigCOW() {
    const w = this.w
    const prev = this.stack[this.pointer]
    let cloned
    if (prev && w.config.series === this._lastSeriesRef) {
      const { series: _series, ...rest } = w.config
      cloned = Utils.clone(rest)
      cloned.series = prev.config.series
    } else {
      cloned = Utils.clone(w.config)
    }
    this._lastSeriesRef = w.config.series
    return cloned
  }

  /**
   * Data-level signature for dedup. Functions are dropped by JSON (fine — a
   * checkpoint whose only change is a function reference is not a meaningful
   * undo step). Runs once per committed checkpoint, not per raw event.
   * @param {any} view
   * @param {any} config
   * @returns {string}
   */
  _signature(view, config) {
    try {
      return JSON.stringify(view) + '|' + JSON.stringify(config)
    } catch (e) {
      // Never dedup on a serialisation failure (e.g. a cycle).
      return `nosig-${this._counter}`
    }
  }

  // ─── Restore ────────────────────────────────────────────────────────────

  /**
   * @param {any} cp
   * @param {boolean} animate
   */
  _restore(cp, animate) {
    if (!cp) return
    this.applying = true

    // Purge dynamic annotations first so the config re-render's mount replay
    // does not resurrect stale ones. The full config carries window / theme /
    // static annotations / series / title in a single re-render.
    this.ctx.clearAnnotations()
    const p = this.ctx.updateOptions(
      Utils.clone(cp.config),
      false,
      animate,
      false,
      false,
    )

    Promise.resolve(p)
      .then(() => {
        // Non-config bits (zoom flag, collapsed set, dynamic annotations,
        // selection, locale). Any trailing async 'updated' from collapse
        // re-renders keeps `applying` true (settle-timer) and would dedup
        // anyway.
        applyViewInteraction(this.ctx, cp.view)
        this._refreshSettle()
        this._emitChange()
      })
      .catch(() => {
        this.applying = false
      })
  }

  /**
   * Hold `applying` true until the restore's burst of async 'updated' events
   * has drained (one macrotask after the last one). Refreshed by _onUpdated.
   */
  _refreshSettle() {
    if (!Environment.isBrowser()) {
      this.applying = false
      return
    }
    clearTimeout(this._settleTimer)
    this._settleTimer = setTimeout(() => {
      this.applying = false
    }, 0)
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /**
   * @param {boolean} [animate]
   */
  undo(animate = true) {
    if (!this.canUndo()) return
    this.pointer--
    this._restore(this.stack[this.pointer], animate)
  }

  /**
   * @param {boolean} [animate]
   */
  redo(animate = true) {
    if (!this.canRedo()) return
    this.pointer++
    this._restore(this.stack[this.pointer], animate)
  }

  canUndo() {
    return this.pointer > 0
  }

  canRedo() {
    return this.pointer > -1 && this.pointer < this.stack.length - 1
  }

  /**
   * @param {string} id
   * @param {boolean} [animate]
   */
  jump(id, animate = true) {
    const idx = this.stack.findIndex((c) => c.id === id)
    if (idx === -1 || idx === this.pointer) return
    this.pointer = idx
    this._restore(this.stack[idx], animate)
  }

  /** Clear the history, keeping the current state as the new baseline. */
  clear() {
    clearTimeout(this._coalesceTimer)
    this._coalesceTimer = null
    const current = this.stack[this.pointer]
    this.stack = current ? [current] : []
    this.pointer = this.stack.length - 1
    this._emitChange()
  }

  /**
   * Group multiple edits into a single undo step. `fn` may be async; await your
   * updateOptions/updateSeries calls inside it so the intermediate 'updated'
   * events are suppressed and only one checkpoint is committed afterwards.
   * @param {() => (void | Promise<any>)} fn
   * @param {{ label?: string }} [opts]
   * @returns {Promise<void>}
   */
  transaction(fn, opts = {}) {
    if (typeof fn !== 'function') return Promise.resolve()
    const wasBatching = this._batching
    this._batching = true
    return Promise.resolve()
      .then(() => fn())
      .finally(() => {
        this._batching = wasBatching
        if (!wasBatching) this._commit(opts.label || 'transaction', true)
      })
  }

  /**
   * @returns {{ id: string, label: string, at: number }[]}
   */
  entries() {
    return this.stack.map((c) => ({ id: c.id, label: c.label, at: c.at }))
  }

  /** Lightweight state for the historyChange event / a history-rail UI. */
  state() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      index: this.pointer,
      length: this.stack.length,
    }
  }

  _emitChange() {
    this.ctx.events.fireEvent('historyChange', [this.ctx, this.state()])
  }

  /** Drop the stack + detach listeners (called on full destroy). */
  teardown() {
    clearTimeout(this._coalesceTimer)
    clearTimeout(this._settleTimer)
    this._coalesceTimer = null
    this._settleTimer = null
    if (this._keydownTarget) {
      this._keydownTarget.removeEventListener('keydown', this._onKeyDown)
      this._keydownTarget = null
    }
    this.stack = []
    this.pointer = -1
    this._wired = false
  }
}
