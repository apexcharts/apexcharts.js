// @ts-check
/**
 * Trellis (#22, P2): panel virtualization.
 *
 * Above the eager budget (or on `virtualize: true`) the trellis mounts only
 * the panels intersecting the viewport, plus a one-row margin, via one
 * `IntersectionObserver`. Cells and headers always exist and every unmounted
 * mount div reserves the exact panel height, so page height and scroll
 * position never shift as panels come and go.
 *
 * A panel that scrolls out is `destroy()`ed, not hidden (the DOM weight IS
 * the problem being solved), with its view state captured onto the panel
 * record through the shipped `captureViewState`. A remount folds the stashed
 * window back into the assembled options (no unzoomed flash), then overlays
 * the live window of any currently mounted sibling: group pushes (zoom, pan,
 * autoscale) only ever reach mounted panels, so a sibling is fresher than a
 * stash whenever the two disagree.
 *
 * Mounts drain through a rAF batch (at most {@link MOUNTS_PER_FRAME} per
 * frame) so a fast scroll never blocks the main thread on a burst of chart
 * renders; the observer callback only flips per-panel `want` state, and the
 * drain reconciles wanted-vs-actual, which self-heals when the verdict flips
 * again mid-drain.
 *
 * @module modules/trellis/TrellisVirtual
 */
import { captureViewState } from '../state/ViewState'

/** Most chart mounts allowed per drain batch (a mount is the expensive op). */
const MOUNTS_PER_FRAME = 2
/** Most reconcile ops (mounts + unmounts) per drain batch. */
const OPS_PER_FRAME = 6
/** Gutter-floor bumps below this are float jitter, not a wider label. */
const GUTTER_EPSILON = 0.5

/** @param {FrameRequestCallback} cb */
function raf(cb) {
  if (typeof requestAnimationFrame === 'function') {
    return { kind: 'raf', id: requestAnimationFrame(cb) }
  }
  return { kind: 'timeout', id: setTimeout(() => cb(0), 16) }
}

/** @param {{ kind: string, id: any } | null} handle */
function cancelRaf(handle) {
  if (!handle) return
  if (handle.kind === 'raf') cancelAnimationFrame(handle.id)
  else clearTimeout(handle.id)
}

export default class TrellisVirtual {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis
    this.active = false
    /** @type {IntersectionObserver|null} */
    this._io = null
    /** @type {Map<Element, any>} cell element -> panel record */
    this._byCell = new Map()
    /** @type {Set<any>} panels whose wanted state may differ from actual */
    this._dirty = new Set()
    /** @type {{ kind: string, id: any } | null} */
    this._raf = null
    this._draining = false
    /**
     * Independent-y gutter floor (P1's alignment invariant under
     * virtualization): the widest measured label gutter so far, pushed as a
     * shared `yaxis.labels.minWidth` to every MOUNTED panel. Monotone, so it
     * converges after the first few mounts; alignment always holds among the
     * panels that are simultaneously visible.
     */
    this._gutterFloor = 0
  }

  static supported() {
    return typeof IntersectionObserver !== 'undefined'
  }

  /** One grid row (panel + header + gap): the observer's look-ahead margin. */
  _rootMargin() {
    const ly = this.trellis.layout
    const m = ly ? Math.max(0, Math.round(ly.panelH + ly.headerH + ly.gap)) : 300
    return `${m}px 0px ${m}px 0px`
  }

  /** Begin observing every cell. Panels start unmounted; the observer's
   *  initial callback mounts the visible ones. */
  start() {
    if (!TrellisVirtual.supported()) return
    this.active = true
    this._io = new IntersectionObserver(
      (entries) => this._onEntries(entries),
      { root: null, rootMargin: this._rootMargin(), threshold: 0 },
    )
    this.trellis.panels.forEach((p) => {
      p.wantMounted = false
      if (p.cellEl) {
        this._byCell.set(p.cellEl, p)
        this._io?.observe(p.cellEl)
      }
    })
  }

  /**
   * Recreate the observer after a relayout: rootMargin is immutable on a live
   * observer and it tracks the (possibly changed) panel height. Re-observing
   * re-fires initial entries, which reconciles to a no-op for unchanged cells.
   */
  refresh() {
    if (!this.active || !this._io) return
    this._io.disconnect()
    this._io = new IntersectionObserver(
      (entries) => this._onEntries(entries),
      { root: null, rootMargin: this._rootMargin(), threshold: 0 },
    )
    this._byCell.forEach((_p, cell) => this._io?.observe(cell))
  }

  /** @param {IntersectionObserverEntry[]} entries */
  _onEntries(entries) {
    if (!this.active) return
    for (const entry of entries) {
      const panel = this._byCell.get(entry.target)
      if (!panel) continue
      panel.wantMounted = entry.isIntersecting
      this._dirty.add(panel)
    }
    this._schedule()
  }

  _schedule() {
    if (this._raf || this._draining || !this.active) return
    this._raf = raf(() => {
      this._raf = null
      this._drain()
    })
  }

  /** Reconcile wanted-vs-actual for a bounded batch of panels, then yield. */
  async _drain() {
    if (this._draining || !this.active) return
    this._draining = true
    try {
      let mounts = 0
      let ops = 0
      while (
        this.active &&
        this._dirty.size &&
        mounts < MOUNTS_PER_FRAME &&
        ops < OPS_PER_FRAME
      ) {
        const panel = this._dirty.values().next().value
        this._dirty.delete(panel)
        const want = !!panel.wantMounted
        if (want === !!panel.chart) continue
        ops++
        if (want) {
          mounts++
          await this._mount(panel)
        } else {
          this._unmount(panel)
        }
      }
    } finally {
      this._draining = false
      if (this.active && this._dirty.size) {
        this._schedule()
      } else if (this.active) {
        // Drain idle: the visible set is fully reconciled. The host chart
        // never renders itself, so this is where its "settled" flag lives
        // (screenshot/e2e harnesses key on animationEnded).
        this.trellis.w.globals.animationEnded = true
      }
    }
  }

  /**
   * The freshest cross-panel window: any mounted sibling's current config.
   * Group pushes (drag/wheel zoom, pan, shared-y autoscale) reach only
   * mounted panels, so this beats a stash captured before those pushes.
   * @param {any} skip the panel being mounted
   */
  _liveWindow(skip) {
    const sibling = this.trellis.panels.find((p) => p !== skip && p.chart)
    if (!sibling || !sibling.chart) return null
    const w = sibling.chart.w
    const x = w.config.xaxis || {}
    const y0 = Array.isArray(w.config.yaxis) ? w.config.yaxis[0] : w.config.yaxis
    return {
      zoomed: !!w.interact.zoomed,
      x: x.min != null || x.max != null ? { min: x.min, max: x.max } : null,
      y:
        y0 && (y0.min != null || y0.max != null)
          ? { min: y0.min, max: y0.max, tickAmount: y0.tickAmount }
          : null,
    }
  }

  /**
   * Merge an axis-window patch into the assembled options' yaxis without
   * losing the user's own entries (D8: yaxis pushes replace wholesale, so the
   * patch is applied onto the already-assembled array in place).
   * @param {Record<string, any>} opts
   * @param {Record<string, any>} patch
   */
  _patchYaxis(opts, patch) {
    const arr = Array.isArray(opts.yaxis)
      ? opts.yaxis
      : opts.yaxis
        ? [opts.yaxis]
        : [{}]
    arr.forEach((/** @type {any} */ entry) => {
      Object.keys(patch).forEach((k) => {
        if (k === 'labels') {
          entry.labels = { ...(entry.labels || {}), ...patch.labels }
        } else {
          entry[k] = patch[k]
        }
      })
    })
    opts.yaxis = arr
  }

  /** @param {any} panel */
  async _mount(panel) {
    const t = this.trellis
    if (!panel.el || panel.chart || panel.noMount) return
    const stash = panel.viewStash
    const sharedY = t._yMode() === 'shared'
    const independentY = !sharedY

    // Remounts never replay the mount animation: scrolling back should read
    // as content appearing, not as a chart re-drawing itself.
    const opts = t._assemblePanelOptions(panel.index, {
      noAnimation: !!stash,
    })

    // 1. Stashed window first (so a restored zoom is IN the first paint)...
    const sw = stash && stash.window
    if (sw && sw.xaxis) {
      opts.xaxis = {
        ...(opts.xaxis || {}),
        min: sw.xaxis.min ?? undefined,
        max: sw.xaxis.max ?? undefined,
      }
    }
    if (independentY && sw && Array.isArray(sw.yaxis) && sw.yaxis[0]) {
      this._patchYaxis(opts, {
        min: sw.yaxis[0].min ?? undefined,
        max: sw.yaxis[0].max ?? undefined,
      })
    }
    // 2. ...then a live sibling window (it saw every group push)...
    const live = this._liveWindow(panel)
    if (live && live.x) {
      opts.xaxis = { ...(opts.xaxis || {}), min: live.x.min, max: live.x.max }
    }
    if (live && live.y && sharedY) {
      this._patchYaxis(opts, {
        min: live.y.min,
        max: live.y.max,
        ...(live.y.tickAmount != null ? { tickAmount: live.y.tickAmount } : {}),
      })
    }
    // 3. ...and the sync's own window record LAST: it survives the moment
    //    every mounted panel is gone (an instant scroll to the far end), and
    //    it is the only carrier of the grid-level zoomed flag (a group push
    //    never sets a sibling's interact.zoomed).
    const cw = t.sync.currentWindow
    if (cw && cw.x) {
      opts.xaxis = { ...(opts.xaxis || {}), min: cw.x.min, max: cw.x.max }
    }
    if (cw && cw.y && sharedY) {
      this._patchYaxis(opts, {
        min: cw.y.min,
        max: cw.y.max,
        ...(cw.y.tickAmount != null ? { tickAmount: cw.y.tickAmount } : {}),
      })
    }
    // 4. Independent-y gutter floor (alignment among visible panels).
    if (independentY && this._gutterFloor > 0) {
      this._patchYaxis(opts, { labels: { minWidth: this._gutterFloor } })
    }

    panel.el.classList.remove('apexcharts-trellis-skeleton')
    const chart = new t._ApexCharts(panel.el, opts)
    panel.chart = chart
    try {
      await chart.render()
    } catch (e) {
      panel.chart = null
      panel.el.classList.add('apexcharts-trellis-skeleton')
      return
    }
    if (!this.active) return

    // Non-config state the options object cannot carry.
    chart.w.interact.zoomed = cw
      ? !!cw.zoomed
      : live
        ? live.zoomed
        : !!(stash && stash.zoomed)
    t.sync.applyHiddenTo(chart)
    if (stash && stash.annotations && Array.isArray(stash.annotations.dynamic)) {
      const methodOf = {
        xaxis: 'addXaxisAnnotation',
        yaxis: 'addYaxisAnnotation',
        point: 'addPointAnnotation',
      }
      const target = /** @type {any} */ (chart)
      stash.annotations.dynamic.forEach((/** @type {any} */ a) => {
        const m = /** @type {any} */ (methodOf)[a.kind]
        if (m && typeof target[m] === 'function') target[m](a.params, true)
      })
    }
    panel.viewStash = null

    // Independent y: measure this panel's gutter; a wider one raises the
    // shared floor for every mounted panel (monotone, converges fast).
    if (independentY) {
      const wpx = chart.w?.globals?.yLabelsCoords?.[0]?.width
      if (typeof wpx === 'number' && isFinite(wpx)) {
        const pad = chart.w.globals.isBarHorizontal ? 0 : t._yLabelPad()
        const tight = Math.max(0, wpx - pad)
        if (tight > this._gutterFloor + GUTTER_EPSILON) {
          this._gutterFloor = tight
          await t._pushGutterFloor(this._gutterFloor)
        }
      }
    }

    t.ctx.events.fireEvent('panelMounted', [
      t.ctx,
      { key: panel.key, index: panel.index, chart, remounted: !!stash },
    ])
  }

  /** @param {any} panel */
  _unmount(panel) {
    if (!panel.chart) return
    try {
      panel.viewStash = captureViewState(panel.chart.w, panel.chart)
    } catch (e) {
      panel.viewStash = null
    }
    try {
      panel.chart.destroy()
    } catch (e) {
      // A panel destroyed mid-render can throw; the record is cleared anyway.
    }
    panel.chart = null
    if (panel.el) {
      panel.el.classList.add('apexcharts-trellis-skeleton')
      // destroy() resets the container's inline min-height ('unset'); the
      // skeleton must re-reserve the exact panel height or page height and
      // scroll position shift as panels unmount.
      const ly = this.trellis.layout
      if (ly) panel.el.style.minHeight = `${ly.panelH}px`
    }
  }

  /** Disconnect and drop all virtualization state (trellis teardown). */
  stop() {
    this.active = false
    if (this._io) {
      this._io.disconnect()
      this._io = null
    }
    this._byCell.clear()
    this._dirty.clear()
    cancelRaf(this._raf)
    this._raf = null
    this._gutterFloor = 0
  }
}
