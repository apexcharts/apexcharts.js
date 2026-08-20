// @ts-check
/**
 * Trellis (#22): cross-panel state the `chart.group` cannot provide.
 *
 * Panels share an implicit group, so tooltip fan-out, crosshair sweep and the
 * x-window part of zoom are inherited, not built here. This module owns the
 * three things the group has no concept of:
 *
 *   1. shared reset: every panel back to the trellis's own domains,
 *   2. shared-scale autoscale on zoom (plan §7.5: without the union recompute
 *      the first zoom silently un-shares the y scale),
 *   3. legend toggling: one click hides that series NAME in every panel.
 *
 * @module modules/trellis/TrellisSync
 */
import Utils from '../../utils/Utils'
import { niceBounds, yExtentInWindow } from './TrellisScales'

/**
 * Build a safe yaxis payload for updateOptions: the panel's CURRENT yaxis
 * array cloned with `patch` merged into every entry.
 *
 * Necessary because the update path replaces `config.yaxis` wholesale: an
 * object push is normalized onto the DEFAULT axis schema (extendYAxis) and
 * `Utils.extend` does not deep-merge arrays, so pushing a bare
 * `{ yaxis: { min } }` would silently wipe the panel's formatter, label config
 * and previously shared bounds. Cloning the live config keeps every field
 * (functions survive Utils.clone by reference) and patches only what the
 * trellis owns.
 *
 * @param {any} chart a panel instance
 * @param {Record<string, any>} patch
 * @returns {any[]}
 */
export function yaxisPayload(chart, patch) {
  const current = Utils.clone(chart.w.config.yaxis)
  const arr = Array.isArray(current) ? current : [current]
  return arr.map((/** @type {any} */ entry) => Utils.extend(entry, patch))
}

export default class TrellisSync {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis
    /** re-entrancy guard: our own yaxis pushes must not re-trigger sync */
    this._syncing = false
    /** series names the shared legend has toggled off */
    this._hidden = new Set()
    /**
     * The grid's current view window, maintained across gestures (zoom, pan,
     * autoscale, reset). Group pushes only ever reach MOUNTED panels, and a
     * live sibling is not guaranteed to exist at mount time (an instant
     * scroll to the far end unmounts every zoomed panel before the first new
     * one mounts), so virtualized mounts read this record as the authority.
     * null means "the trellis's own domains".
     * @type {{ x: {min:number,max:number}|null, y: {min:number,max:number,tickAmount?:number}|null, zoomed: boolean } | null}
     */
    this.currentWindow = null
  }

  /**
   * Record the x window a zoom gesture produced. An empty window (zoom-out
   * past the full range) clears the record back to the trellis domains.
   * @param {any} payload the zoomed/scrolled event payload
   * @param {boolean} zoomed
   */
  _noteWindow(payload, zoomed) {
    const xw = payload && payload.xaxis
    if (xw && xw.min != null && xw.max != null) {
      this.currentWindow = {
        x: { min: xw.min, max: xw.max },
        y: (this.currentWindow && this.currentWindow.y) || null,
        zoomed: zoomed || !!(this.currentWindow && this.currentWindow.zoomed),
      }
    } else if (zoomed) {
      this.currentWindow = null
    }
  }

  /**
   * The `zoomed` handler injected into every panel's config (wrapping the
   * user's own handler, which is called first with the panel's ctx). Drag,
   * wheel and toolbar zooms all funnel through this one config event.
   * @param {Function|undefined} userZoomed
   * @returns {(chartCtx: any, payload: any) => void}
   */
  makeZoomedHandler(userZoomed) {
    return (chartCtx, payload) => {
      if (typeof userZoomed === 'function') userZoomed(chartCtx, payload)
      this._noteWindow(payload, true)
      this.onZoomed(payload)
    }
  }

  /**
   * The `scrolled` handler injected into every panel's config: panning moves
   * the x window without a zoomed event, and virtualized mounts must still
   * see the panned window when no live sibling exists.
   * @param {Function|undefined} userScrolled
   * @returns {(chartCtx: any, payload: any) => void}
   */
  makeScrolledHandler(userScrolled) {
    return (chartCtx, payload) => {
      if (typeof userScrolled === 'function') userScrolled(chartCtx, payload)
      this._noteWindow(payload, false)
    }
  }

  /**
   * Shared-scale autoscale: recompute the union VISIBLE y over all panels in
   * the new x window and push it everywhere. Only meaningful when the y scale
   * is shared, the user asked for autoscale, and x is numeric (a category
   * window has no reliable data-space mapping to filter by).
   * @param {any} payload the zoomed event payload ({ xaxis: { min, max } })
   */
  onZoomed(payload) {
    const t = this.trellis
    if (this._syncing) return
    const cfg = t.cfg
    if (!cfg || (cfg.scales.y || 'shared') !== 'shared') return
    if (!t.autoScaleYaxis) return
    const xw = payload && payload.xaxis
    if (!xw || xw.min == null || xw.max == null) return
    if (!t.split || !t.split.xIsNumeric) return

    const ext = yExtentInWindow(t.split.panels, t.split.xForm, xw.min, xw.max)
    if (!ext) return
    const y = niceBounds(ext.min, ext.max, cfg.targetTicks || 4)
    if (this.currentWindow) {
      this.currentWindow.y = {
        min: y.min,
        max: y.max,
        tickAmount: y.tickAmount,
      }
    }

    this._syncing = true
    const pushes = t.panels.map((p) =>
      p.chart
        ? p.chart
            .updateOptions(
              {
                yaxis: yaxisPayload(p.chart, {
                  min: y.min,
                  max: y.max,
                  tickAmount: y.tickAmount,
                }),
              },
              false,
              false,
              false,
            )
            .catch(() => {})
        : Promise.resolve(),
    )
    Promise.all(pushes).finally(() => {
      this._syncing = false
    })
  }

  /**
   * One reset for the whole grid: restore the trellis's own domains (which,
   * for a shared y drifted by autoscale, is the stored union) and clear the
   * zoomed flag. Deliberately NOT resetSeries(): that would also undo the
   * legend's collapsed set, which is user state, not zoom state.
   * @returns {Promise<any>}
   */
  resetAll() {
    const t = this.trellis
    this.currentWindow = null
    const xaxis =
      t.scales && t.scales.x
        ? { min: t.scales.x.min, max: t.scales.x.max }
        : { min: undefined, max: undefined }
    this._syncing = true
    const pushes = t.panels.map((p) => {
      if (!p.chart) return Promise.resolve()
      p.chart.w.interact.zoomed = false
      /** @type {Record<string, any>} */
      const options = { xaxis }
      if (t.scales && t.scales.y) {
        options.yaxis = yaxisPayload(p.chart, {
          min: t.scales.y.min,
          max: t.scales.y.max,
          tickAmount: t.scales.y.tickAmount,
        })
      }
      return p.chart.updateOptions(options, false, false, false).catch(() => {})
    })
    return Promise.all(pushes).finally(() => {
      this._syncing = false
    })
  }

  /**
   * Toggle one series name across every panel. Panels missing the name are
   * skipped (a panel-local slice may not carry a repeated series).
   * @param {string} name
   * @returns {boolean} the new hidden state
   */
  toggleSeries(name) {
    const hide = !this._hidden.has(name)
    if (hide) this._hidden.add(name)
    else this._hidden.delete(name)
    this.trellis.panels.forEach((p) => {
      const chart = p.chart
      if (!chart) return
      const names = chart.w.seriesData.seriesNames || []
      if (names.indexOf(name) === -1) return
      try {
        hide ? chart.hideSeries(name) : chart.showSeries(name)
      } catch (e) {
        // A mid-update panel can reject a toggle; the next toggle re-syncs it.
      }
    })
    return hide
  }

  /** @param {string} name */
  isHidden(name) {
    return this._hidden.has(name)
  }

  /**
   * Bring one freshly mounted panel in line with the shared legend's hidden
   * set (virtualized remounts miss the toggles that happened while they were
   * unmounted; the trellis-wide `_hidden` set is the truth).
   * @param {any} chart a panel instance
   */
  applyHiddenTo(chart) {
    if (!this._hidden.size || !chart) return
    const names = (chart.w.seriesData && chart.w.seriesData.seriesNames) || []
    this._hidden.forEach((name) => {
      if (names.indexOf(name) === -1) return
      try {
        chart.hideSeries(name)
      } catch (e) {
        // A mid-update panel can reject the toggle; the next toggle re-syncs.
      }
    })
  }

  /**
   * Cross-panel crosshair sweep.
   *
   * The group's own crosshair fan-out assumes vertically STACKED charts: the
   * sibling path maps the pointer's clientX into the sibling's own plot
   * (Utils.getNearestValues -> screenXToPlotPx), which lands out of bounds
   * the moment a sibling sits beside rather than below the hovered chart, so
   * the sibling bails before ever moving its crosshair (measured; the shipped
   * stacked sample works, a side-by-side group does not).
   *
   * The trellis mirrors instead, and the alignment invariant is what makes
   * the naive mirror CORRECT: every panel has the identical translateX and
   * gridWidth and the identical x domain, so the hovered panel's
   * crosshair-x in plot px means the same data x in every panel.
   *
   * The mirror is a CONTINUOUS rAF loop bounded by grid hover, not a one-shot
   * per mousemove: the group's tooltip pipeline clears sibling crosshairs
   * asynchronously AFTER the event (measured: a one-shot mirror wins the
   * frame, then the native clear lands and the sweep collapses back to the
   * hovered column at rest). Re-asserting every frame while the pointer is
   * inside the grid makes the settled state the mirrored one; the loop stops
   * on mouseleave, so an idle page costs nothing.
   *
   * @param {HTMLElement} elGrid the trellis grid element
   */
  wireCrosshairs(elGrid) {
    /** @type {number} */
    let raf = 0
    /** @type {any} */
    let hoverTarget = null

    const apply = () => {
      const cell =
        hoverTarget && hoverTarget.closest
          ? hoverTarget.closest('.apexcharts-trellis-cell')
          : null
      const source = cell
        ? cell.querySelector('.apexcharts-xcrosshairs')
        : null
      const active = source && source.classList.contains('apexcharts-active')
      this.trellis.panels.forEach((p) => {
        if (!p.cellEl || p.cellEl === cell) return
        const x = p.cellEl.querySelector('.apexcharts-xcrosshairs')
        if (!x) return
        if (active) {
          x.setAttribute('x', source.getAttribute('x') || '0')
          x.setAttribute('x1', source.getAttribute('x1') || '0')
          x.setAttribute('x2', source.getAttribute('x2') || '0')
          x.classList.add('apexcharts-active')
        } else {
          x.classList.remove('apexcharts-active')
        }
      })
    }
    const loop = () => {
      apply()
      raf = hoverTarget ? requestAnimationFrame(loop) : 0
    }
    const move = (/** @type {any} */ e) => {
      hoverTarget = e.target
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const clear = () => {
      hoverTarget = null
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      this.trellis.panels.forEach((p) => {
        const x = p.cellEl && p.cellEl.querySelector('.apexcharts-xcrosshairs')
        if (x) x.classList.remove('apexcharts-active')
      })
    }
    // Reconcile while hovering; full clear when the pointer leaves the grid
    // (each panel's own mouseout only clears itself). Listeners die with the
    // grid element on teardown.
    elGrid.addEventListener('mousemove', move, { passive: true })
    elGrid.addEventListener('mouseleave', clear, { passive: true })
  }
}
