// @ts-check
import Utils from '../../utils/Utils'

/**
 * Shared view-state core.
 *
 * `captureViewState` / `applyViewState` are the single contract that both
 * Perspectives (#10, serializable/shareable view state) and the future Rewind
 * (#3, undo/redo history) build on. Keeping the capture/apply logic here — as a
 * pure module with no feature registration — means the two features stay in
 * lock-step and there is exactly one place that knows where each piece of view
 * state lives in `w`.
 *
 * A `ViewState` is intentionally FUNCTION-FREE and JSON-safe: every field reads
 * from a config/globals/interact source that holds data, not callbacks. That is
 * what lets Perspectives serialise it to a URL. Rewind, which must also restore
 * option/annotation edits that carry functions, pairs this view with a separate
 * function-preserving `Utils.clone(w.config)` snapshot (that layer is Rewind's,
 * not here).
 *
 * Sources (v5.16.0):
 *   - window.xaxis/yaxis  ← w.config.xaxis/yaxis min/max (the requested window
 *                            that drives the redraw; NOT ephemeral globals.minX)
 *   - zoomed              ← w.interact.zoomed
 *   - collapsed           ← w.globals.collapsedSeriesIndices (persistent)
 *   - ancillaryCollapsed  ← w.globals.ancillaryCollapsedSeriesIndices
 *   - selectedDataPoints  ← w.interact.selectedDataPoints
 *   - theme               ← w.config.theme.mode / .palette
 *   - locale              ← w.config.chart.defaultLocale
 *   - annotations.static  ← w.config.annotations (declarative set)
 *   - annotations.dynamic ← w.globals.memory.methodsToExec (add*Annotation calls)
 *   - drill               ← ctx.drilldown.path (informational)
 *
 * @module ViewState
 */

/** Schema version for the ViewState shape. Bump on breaking changes. */
export const VIEWSTATE_VERSION = 1

/**
 * Build an axis window, using null (not undefined) for absent bounds so the
 * value survives a JSON round-trip. Returns null when neither bound is set.
 * @param {any} min
 * @param {any} max
 * @returns {{ min: any, max: any } | null}
 */
function axisWindow(min, max) {
  const hasMin = min !== undefined && min !== null
  const hasMax = max !== undefined && max !== null
  if (!hasMin && !hasMax) return null
  return { min: hasMin ? min : null, max: hasMax ? max : null }
}

/**
 * Deep-copy a number[][] selection without sharing references.
 * @param {any} sel
 * @returns {number[][]}
 */
function cloneSelection(sel) {
  if (!Array.isArray(sel)) return []
  return sel.map((a) => (Array.isArray(a) ? a.slice() : a))
}

/**
 * Identify which add*Annotation method a memory entry was recorded with, by
 * reference-comparing the stored method against the instance methods. Both are
 * the same prototype function, so equality holds. Returns null for anything
 * that is not a recognised dynamic annotation.
 * @param {Function} method
 * @param {any} ctx
 * @returns {'xaxis'|'yaxis'|'point'|null}
 */
function annotationKind(method, ctx) {
  if (typeof method !== 'function' || !ctx) return null
  if (method === ctx.addXaxisAnnotation) return 'xaxis'
  if (method === ctx.addYaxisAnnotation) return 'yaxis'
  if (method === ctx.addPointAnnotation) return 'point'
  return null
}

/**
 * Map a dynamic-annotation kind to the public add method name.
 * @param {string} kind
 * @returns {'addXaxisAnnotation'|'addYaxisAnnotation'|'addPointAnnotation'|null}
 */
function addMethodName(kind) {
  switch (kind) {
    case 'xaxis':
      return 'addXaxisAnnotation'
    case 'yaxis':
      return 'addYaxisAnnotation'
    case 'point':
      return 'addPointAnnotation'
    default:
      return null
  }
}

/**
 * Capture annotations from both sources: the declarative config set (static)
 * and the dynamically-added set replayed from the memory queue (dynamic).
 * Dynamic annotations do NOT live in w.config.annotations (they are drawn
 * directly and replayed on mount), so both must be recorded.
 * @param {any} w
 * @param {any} ctx
 */
function captureAnnotations(w, ctx) {
  const staticAnno = w.config.annotations
    ? Utils.clone(w.config.annotations)
    : null

  /** @type {{ kind: string, params: any }[]} */
  const dynamic = []
  const mem = (w.globals.memory && w.globals.memory.methodsToExec) || []
  for (const entry of mem) {
    if (!entry || entry.label !== 'addAnnotation') continue
    const kind = annotationKind(entry.method, ctx)
    if (!kind) continue
    // Utils.clone preserves functions (label formatters etc.) for in-memory
    // consumers; JSON.stringify later drops them for serialised tokens.
    dynamic.push({ kind, params: Utils.clone(entry.params) })
  }

  return { static: staticAnno, dynamic }
}

/**
 * Read the current view state off `w`. Pure: no DOM, no mutation, Node-safe.
 * @param {any} w   chart state object
 * @param {any} ctx chart instance (for method-reference and drilldown reads)
 * @returns {any} a function-free, JSON-safe ViewState
 */
export function captureViewState(w, ctx) {
  const cfgX = w.config.xaxis || {}
  const cfgYArr = Array.isArray(w.config.yaxis)
    ? w.config.yaxis
    : w.config.yaxis
      ? [w.config.yaxis]
      : []
  const yWindows = cfgYArr.map((/** @type {any} */ y) =>
    axisWindow(y && y.min, y && y.max),
  )
  const anyY = yWindows.some((/** @type {any} */ yw) => yw !== null)

  const theme = w.config.theme
  const drilldown = ctx && ctx.drilldown

  return {
    v: VIEWSTATE_VERSION,
    window: {
      xaxis: axisWindow(cfgX.min, cfgX.max),
      yaxis: anyY ? yWindows : null,
    },
    zoomed: !!w.interact.zoomed,
    collapsed: (w.globals.collapsedSeriesIndices || []).slice(),
    ancillaryCollapsed: (w.globals.ancillaryCollapsedSeriesIndices || []).slice(),
    selectedDataPoints: cloneSelection(w.interact.selectedDataPoints),
    theme: theme
      ? { mode: theme.mode ?? null, palette: theme.palette ?? null }
      : null,
    locale: (w.config.chart && w.config.chart.defaultLocale) || null,
    annotations: captureAnnotations(w, ctx),
    drill:
      drilldown && drilldown.depth > 0 ? { path: drilldown.path.slice() } : null,
  }
}

/**
 * Reconcile the collapsed-series set to a target by diffing against the current
 * set and toggling only the delta through the public show/hide API (which maps
 * a realIndex → series name → the legend toggle). Series not present in both
 * sets are left untouched.
 *
 * Note: showSeries/hideSeries route through the legend helper, so an unbundled
 * legend feature makes this a no-op — acceptable, as the default bundle ships
 * the legend.
 *
 * @param {any} ctx
 * @param {number[]} targetCollapsed
 * @param {number[]} targetAncillary
 */
export function applyCollapsedSet(ctx, targetCollapsed, targetAncillary) {
  const w = ctx.w
  const names = w.globals.seriesNames || []
  const target = new Set([
    ...(targetCollapsed || []),
    ...(targetAncillary || []),
  ])
  const current = new Set([
    ...(w.globals.collapsedSeriesIndices || []),
    ...(w.globals.ancillaryCollapsedSeriesIndices || []),
  ])

  for (let realIndex = 0; realIndex < names.length; realIndex++) {
    const name = names[realIndex]
    if (name == null) continue
    const shouldCollapse = target.has(realIndex)
    const isCollapsed = current.has(realIndex)
    if (shouldCollapse && !isCollapsed) {
      ctx.hideSeries(name)
    } else if (!shouldCollapse && isCollapsed) {
      ctx.showSeries(name)
    }
  }
}

/**
 * Restore the selected-data-point set. There is no public "set selection" API
 * (toggleDataPointSelection flips one point and simulates a click), so v1 sets
 * the interact state directly. The active-state styling of restored points is a
 * best-effort follow-up (see spec Open Decision §10.2); the state itself is
 * restored so getState()/programmatic reads are correct.
 *
 * @param {any} ctx
 * @param {number[][]} selectedDataPoints
 */
export function restoreSelection(ctx, selectedDataPoints) {
  if (!Array.isArray(selectedDataPoints)) return
  ctx.w.interact.selectedDataPoints = cloneSelection(selectedDataPoints)
}

/**
 * Deterministically restore a captured view. Composes with resetSeries and
 * drilldown by never re-capturing the initialConfig baseline
 * (overwriteInitialConfig:false on the merge).
 *
 * When Cadence (#6) is present, callers wrap the whole call in
 * document.startViewTransition(() => applyViewState(...)) for a morphing
 * restore; that is the caller's concern, not this module's.
 *
 * @param {any} ctx
 * @param {any} view a ViewState produced by captureViewState
 * @param {{ animate?: boolean }} [opts]
 */
export function applyViewState(ctx, view, { animate = true } = {}) {
  if (!ctx || !view) return

  // 1. Purge current dynamic annotations BEFORE the re-render so the mount-time
  //    replay of memory.methodsToExec cannot resurrect stale ones (resolves the
  //    static/dynamic double-render, spec §10.1). clearAnnotations() drops both
  //    the DOM nodes and the 'addAnnotation'/'addText' memory entries.
  ctx.clearAnnotations()

  // 2. Window + theme + static annotations in ONE merge. overwriteInitialConfig
  //    is false so the reset/drilldown baseline is preserved.
  /** @type {Record<string, any>} */
  const options = {}

  const xw = view.window && view.window.xaxis
  // An explicit {min,max} restores a zoom; {min:undefined,max:undefined} clears
  // it back to the full range when the captured view was not zoomed.
  options.xaxis = xw
    ? { min: xw.min ?? undefined, max: xw.max ?? undefined }
    : { min: undefined, max: undefined }

  const yw = view.window && view.window.yaxis
  if (Array.isArray(yw)) {
    options.yaxis = yw.map((y) =>
      y ? { min: y.min ?? undefined, max: y.max ?? undefined } : {},
    )
  }

  if (view.theme) {
    /** @type {Record<string, any>} */
    const theme = {}
    if (view.theme.mode != null) theme.mode = view.theme.mode
    if (view.theme.palette != null) theme.palette = view.theme.palette
    if (Object.keys(theme).length) options.theme = theme
  }

  if (view.annotations && view.annotations.static) {
    options.annotations = Utils.clone(view.annotations.static)
  }

  ctx.updateOptions(
    options,
    false /* redraw */,
    animate,
    false /* updateSyncedCharts */,
    false /* overwriteInitialConfig */,
  )

  // 3. Everything that does not live in w.config (zoom flag, collapsed set,
  //    dynamic annotations, selection, locale).
  applyViewInteraction(ctx, view)
}

/**
 * Restore the parts of a view that do NOT live in `w.config`: the zoom flag,
 * the collapsed-series set, dynamic annotations, the selection, and the locale.
 *
 * Assumes the config-level state (zoom window, theme, static annotations, and —
 * for Rewind — series/title) has ALREADY been applied by the caller's own
 * updateOptions, and that dynamic annotations were cleared before that
 * re-render (so the mount replay did not resurrect stale ones). Shared by
 * Perspectives.applyViewState (partial config) and History._restore (full
 * config) so there is exactly one non-config restore path.
 *
 * @param {any} ctx
 * @param {any} view a ViewState produced by captureViewState
 */
export function applyViewInteraction(ctx, view) {
  if (!ctx || !view) return
  const w = ctx.w

  // Zoom flag — Series.resetSeries clears it; set it explicitly here.
  w.interact.zoomed = !!view.zoomed

  // Collapsed set — toggle the delta via public show/hide.
  applyCollapsedSet(ctx, view.collapsed, view.ancillaryCollapsed)

  // Dynamic annotations — replay the captured data-level params. pushToMemory
  // is true so they persist across subsequent re-renders like a real add.
  if (view.annotations && Array.isArray(view.annotations.dynamic)) {
    view.annotations.dynamic.forEach((/** @type {any} */ a) => {
      const method = addMethodName(a.kind)
      if (method && typeof ctx[method] === 'function') {
        ctx[method](a.params, true)
      }
    })
  }

  // Selection (best-effort styling; state restored faithfully).
  restoreSelection(ctx, view.selectedDataPoints)

  // Locale.
  if (view.locale && view.locale !== w.config.chart.defaultLocale) {
    ctx.setLocale(view.locale)
  }
}
