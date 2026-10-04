// @ts-check
import Graphics from './Graphics'
import Utils from '../utils/Utils'
import { Environment } from '../utils/Environment'
import { captureStreamFrame } from './animations/StreamScroll'
import { captureAxisChrome } from './animations/AxisTransition'
import { captureCircle } from './animations/CircleTransition'
import { pendingUntilPaint } from './animations/LayoutTransition'
import {
  captureDataLabels,
  captureExitLabels,
} from './animations/DataLabelTransition'

/**
 * ApexCharts Series Class for interaction with the Series of the chart.
 *
 * @module Series
 **/

export default class Series {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {{ toggleDataSeries?: Function, revertDefaultAxisMinMax?: Function, updateSeries?: Function }} [callbacks]
   */
  constructor(
    w,
    {
      toggleDataSeries = undefined,
      revertDefaultAxisMinMax = undefined,
      updateSeries = undefined,
    } = {},
  ) {
    this.w = w
    // Injected callbacks for cross-module coordination (toggleSeries/showSeries/hideSeries/resetSeries)
    /** @type {Function | null} */ this._toggleDataSeries =
      toggleDataSeries || null
    /** @type {Function | null} */ this._revertDefaultAxisMinMax =
      revertDefaultAxisMinMax || null
    /** @type {Function | null} */ this._updateSeries = updateSeries || null

    this.legendInactiveClass = 'legend-mouseover-inactive'
  }

  clearSeriesCache() {
    const w = this.w
    if (w.globals.cachedSelectors) {
      delete w.globals.cachedSelectors.allSeriesEls
      delete w.globals.cachedSelectors.highlightSeriesEls
    }
  }

  getAllSeriesEls() {
    // cache the result to avoid repeated querySelectorAll
    const w = this.w
    const cacheKey = 'allSeriesEls'

    if (!w.globals.cachedSelectors[cacheKey]) {
      w.globals.cachedSelectors[cacheKey] = /** @type {any} */ (
        w.dom.baseEl.getElementsByClassName(`apexcharts-series`)
      )
    }

    return w.globals.cachedSelectors[cacheKey]
  }

  /**
   * @param {string} seriesName
   */
  getSeriesByName(seriesName) {
    return this.w.dom.baseEl.querySelector(
      `.apexcharts-inner .apexcharts-series[seriesName='${Utils.escapeString(
        seriesName,
      )}']`,
    )
  }

  /**
   * @param {string} seriesName
   */
  isSeriesHidden(seriesName) {
    const targetElement = this.getSeriesByName(seriesName)
    const el = /** @type {Element} */ (targetElement)
    const realIndex = parseInt(el.getAttribute('data:realIndex') ?? '0', 10)
    // The collapse is recorded per index for every type; the class only on
    // the types that draw a series group for it. A pie, donut or polarArea
    // slice never carries it, so asking the class alone called a hidden slice
    // visible, and a second toggleSeries() hid it again instead of showing it.
    const gl = this.w.globals
    const isHidden =
      el.classList.contains('apexcharts-series-collapsed') ||
      gl.collapsedSeriesIndices.includes(realIndex) ||
      gl.ancillaryCollapsedSeriesIndices.includes(realIndex)

    return { isHidden, realIndex }
  }

  /**
   * @param {any} elSeries
   * @param {number} index
   */
  addCollapsedClassToSeries(elSeries, index) {
    Series.addCollapsedClassToSeries(this.w, elSeries, index)
  }

  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {any} elSeries
   * @param {number} index
   */
  static addCollapsedClassToSeries(w, elSeries, index) {
    let collapsed = false
    /**
     * @param {any[]} series
     */
    function iterateOnAllCollapsedSeries(series) {
      for (let cs = 0; cs < series.length; cs++) {
        if (series[cs].index === index) {
          elSeries.node.classList.add('apexcharts-series-collapsed')
          collapsed = true
        }
      }
    }

    iterateOnAllCollapsedSeries(w.globals.collapsedSeries)
    iterateOnAllCollapsedSeries(w.globals.ancillaryCollapsedSeries)

    if (!collapsed) return

    // A series hidden by THIS render is still mid-exit: its marks hold the slot
    // they had before the click and tween down to nothing. `-collapsed` alone
    // (opacity: 0) would blank them on the first frame, which on a stacked
    // chart leaves a hole the height of the outgoing layer until the tween
    // finishes. The `-collapsing` class restores opacity for the length of the
    // exit so the layer visibly shrinks away and the stack stays closed;
    // everything that keys off `-collapsed` (tooltip skipping, isSeriesHidden,
    // the public toggle API) keeps working throughout.
    if ((w.globals.collapsingSeriesIndices || []).indexOf(index) === -1) return

    elSeries.node.classList.add('apexcharts-series-collapsing')
    if (!Environment.isBrowser()) return

    // Hold the paint until the LAST mark of the series has landed, not just the
    // first: Bar.renderSeries staggers marks within a series (capped at half of
    // `animations.speed` across the whole row/column) and Animations.morphSVG
    // spends that delay twice, once holding at pathFrom, once before the tween
    //, so the final mark can start a full `animations.speed` late. Dropping
    // the class earlier re-opens the hole in the columns that have not finished
    // shrinking. Overshooting is free: by then the marks are at zero size and
    // paint nothing either way.
    const anim = w.config.chart.animations
    const hold = (anim.dynamicAnimation.speed || 0) + (anim.speed || 0) + 100
    setTimeout(() => {
      if (w.globals.isDestroyed) return
      elSeries.node.classList.remove('apexcharts-series-collapsing')
    }, hold)
  }

  /**
   * Everything a capture of the screen writes (getPreviousPaths), plus the
   * polar stash the renderer leaves for the next render: what a second update
   * in the same frame is handed again.
   */
  /** A counter keeping the ids of copied zoom defs apart. */
  static ghostDefs = 0

  static HELD = [
    'previousPaths',
    'prevStreamFrame',
    'prevChromeFrame',
    'prevCircleFrame',
    'prevDataLabels',
    'exitLabels',
    'riseLabels',
    'prevTreemapParents',
    'prevTreemapView',
    'prevPolarAngles',
    'prevPolarSizes',
  ]

  /**
   * What a treemap tile's label shows: its text, its size, and whether it is
   * turned to fit. Two renders that agree on this draw the same label, so it
   * can ride from one to the other; when they differ the two cross-fade.
   * Empty for a label that shows nothing.
   * @param {Element} el the label's group
   * @returns {string}
   */
  static treemapLabelLook(el) {
    const t = el.querySelector('text')
    const text = (t?.textContent || '').trim()
    if (!t || !text) return ''
    const turned = /rotate\(/.test(
      `${el.getAttribute('transform') || ''} ${t.getAttribute('transform') || ''}`,
    )
    return `${text}|${t.getAttribute('font-size')}|${turned}`
  }

  /**
   * How a treemap container's header text reads, the same way: its text and
   * its size (a zoom moves a container to another depth, which sets both).
   * @param {Element | null | undefined} el the header's text
   * @returns {string}
   */
  static treemapHeaderLook(el) {
    return el ? `${el.textContent}|${el.getAttribute('font-size')}` : ''
  }

  /**
   * Once a legend-hidden series has finished leaving, leave nothing behind.
   * (Also removes marks that only slid out of view, see Bar._wasOnScreen.)
   *
   * A hidden series is drawn to its exit target so that hiding animates (a
   * line flattens onto the baseline, a stacked layer onto its neighbour, a
   * radar into its center, points shrink away). At rest that shape used to
   * stay in the DOM, unpainted only through the stylesheet's `opacity: 0`:
   * it still lay there, and an export (which cannot rely on the stylesheet)
   * drew it. So once the exit is over its geometry is cleared: every path's
   * `d` is emptied and exit-only ghosts are removed.
   *
   * `pathTo` is kept. It is what the next render reads as this series'
   * previous shape (getPreviousPaths), so showing the series again still
   * rises from its exit target instead of popping in.
   *
   * Runs after every render, not only the one that hid the series: a chart
   * re-rendered while the series is hidden (a resize, a data update) morphs
   * the hidden shape again, invisibly, and that morph must finish first.
   * @param {import('../types/internal').ChartStateW} w
   * @param {any} graphs the renderer output: one element or an array
   */
  static settleCollapsedShapes(w, graphs) {
    const roots = (Array.isArray(graphs) ? graphs : [graphs])
      .map((g) => (g && g.node ? g.node : g))
      .filter((n) => n && typeof n.querySelectorAll === 'function')
    /** @type {Element[]} */
    const groups = []
    // Marks drawn only so they could slide out of view (Bar._wasOnScreen): a
    // zoom-in's outer bars and candles, which end their morph off-screen.
    /** @type {Element[]} */
    const leaving = []
    roots.forEach((r) => {
      r.querySelectorAll('.apexcharts-series-collapsed').forEach(
        (/** @type {Element} */ g) => groups.push(g),
      )
      r.querySelectorAll('.apexcharts-leaving').forEach(
        (/** @type {Element} */ el) => leaving.push(el),
      )
    })
    if (!groups.length && !leaving.length) return

    /** @param {Element} g */
    const clearGroup = (g) => {
      if (w.globals.isDestroyed) return
      g.classList.remove('apexcharts-series-collapsing')
      g.querySelectorAll('.apexcharts-marker-exit, .apexcharts-bar-ghost').forEach(
        (/** @type {Element} */ el) => el.remove(),
      )
      g.querySelectorAll('path').forEach((/** @type {Element} */ p) => {
        p.setAttribute('d', '')
      })
    }
    const clearLeaving = () => {
      if (w.globals.isDestroyed) return
      leaving.forEach((el) => el.remove())
    }

    const anim = w.config.chart.animations
    const animating =
      Environment.isBrowser() &&
      anim.enabled &&
      w.globals.shouldAnimate !== false &&
      (!w.globals.dataChanged || anim.dynamicAnimation.enabled)
    if (!animating) {
      clearLeaving()
      groups.forEach(clearGroup)
      return
    }

    // A series whose exit reports its tweens (path morphs, marker exits) is
    // cleared the moment the last one lands: a line flattened onto the
    // baseline must vanish as it arrives, not lie there until a timer that
    // allows for the slowest staggered bar row runs out.
    const tweens = w.globals.morphBatch?.series
    /** @type {Element[]} */
    const timed = []
    groups.forEach((g) => {
      const ri = g.getAttribute('data:realIndex')
      const s = ri === null ? null : tweens?.get(Number(ri))
      if (!s || s.pending <= 0) {
        timed.push(g)
        return
      }
      const before = s.onDone
      s.onDone = () => {
        before?.()
        clearGroup(g)
      }
    })

    // Everything else (exits drawn some other way, marks that slid out of
    // view) waits as long as the -collapsing class does: long enough for the
    // last mark of any exit, or of an invisible re-render morph, to land.
    const hold = (anim.dynamicAnimation.speed || 0) + (anim.speed || 0) + 100
    setTimeout(() => {
      clearLeaving()
      timed.forEach(clearGroup)
    }, hold)
  }

  /**
   * Instance entry point for the render pipeline; see the static.
   * @param {any} graphs
   */
  settleCollapsedShapes(graphs) {
    Series.settleCollapsedShapes(this.w, graphs)
  }

  /**
   * @param {string} seriesName
   */
  toggleSeries(seriesName) {
    const isSeriesHidden = this.isSeriesHidden(seriesName)

    this._toggleDataSeries?.(isSeriesHidden.realIndex, isSeriesHidden.isHidden)

    return isSeriesHidden.isHidden
  }

  /**
   * @param {string} seriesName
   */
  showSeries(seriesName) {
    const isSeriesHidden = this.isSeriesHidden(seriesName)

    if (isSeriesHidden.isHidden) {
      this._toggleDataSeries?.(isSeriesHidden.realIndex, true)
    }
  }

  /**
   * @param {string} seriesName
   */
  hideSeries(seriesName) {
    const isSeriesHidden = this.isSeriesHidden(seriesName)

    if (!isSeriesHidden.isHidden) {
      this._toggleDataSeries?.(isSeriesHidden.realIndex, false)
    }
  }

  /**
   * Cheap pre-update reset for the data-replacement paths (updateSeries /
   * appendSeries). Clears the series cache and previous paths WITHOUT
   * restoring config.series from the initialSeries snapshot: the caller is
   * about to replace the series anyway (parseData assigns config.series =
   * newSeries), so materializing and cloning the snapshot per update is pure
   * waste (two O(n) deep clones per streaming tick at 50k points).
   *
   * It used to clear the collapsed-series bookkeeping here as well, which made
   * updateSeries() disagree with updateOptions({ series }) about a legend
   * collapse: the options path reconciles hides by name, this one dropped
   * them, so a viewer's legend click was undone by the next data refresh and
   * every series came back on a polling dashboard. An axis chart's records are
   * now kept and reconciled in _updateSeries, the same way and by the same
   * code. A genuine reset still clears them: that is resetSeries(), which does
   * its own clearing and is the call that means "put everything back".
   *
   * A non-axis chart still clears here, and has to. Its collapses are recorded
   * per SLICE: the index points into the slice container (which for an
   * object-form pie or unit chart is series[0].data, not config.series) and
   * the stored data is one slice's value rather than a series' rows. Nothing
   * about that reconciles against an incoming series list, and running the
   * by-name reconcile over it overwrote each record's slice value with a whole
   * series object, so a legend click could hide a category and never bring it
   * back. Persisting those across a data update needs its own slice-level
   * reconcile, which is a separate piece of work.
   */
  prepareDataUpdate() {
    const w = this.w
    this.clearSeriesCache()
    w.globals.previousPaths = []
    if (!w.globals.axisCharts) {
      w.globals.collapsedSeries = []
      w.globals.ancillaryCollapsedSeries = []
      w.globals.collapsedSeriesIndices = []
      w.globals.ancillaryCollapsedSeriesIndices = []
    }
  }

  resetSeries(
    shouldUpdateChart = true,
    shouldResetZoom = true,
    shouldResetCollapsed = true,
  ) {
    const w = this.w

    this.clearSeriesCache()

    let series = Utils.clone(w.globals.initialSeries)
    // A chart constructed (or once updated) with an invalid series leaves no
    // usable snapshot; resetting to the live config beats crashing here and
    // stranding the chart mid-update.
    if (!Array.isArray(series)) {
      series = Utils.clone(w.config.series) || []
    }

    w.globals.previousPaths = []

    if (shouldResetCollapsed) {
      w.globals.collapsedSeries = []
      w.globals.ancillaryCollapsedSeries = []
      w.globals.collapsedSeriesIndices = []
      w.globals.ancillaryCollapsedSeriesIndices = []
    } else {
      series = this.emptyCollapsedSeries(series)
    }

    w.config.series = series

    if (shouldUpdateChart) {
      if (shouldResetZoom) {
        w.interact.zoomed = false
        this._revertDefaultAxisMinMax?.()
      }
      this._updateSeries?.(
        series,
        w.config.chart.animations.dynamicAnimation.enabled,
      )
    }
  }

  /**
   * @param {any[]} series
   */
  emptyCollapsedSeries(series) {
    const w = this.w
    if (!Array.isArray(series)) return series
    for (let i = 0; i < series.length; i++) {
      if (w.globals.collapsedSeriesIndices.indexOf(i) > -1) {
        // Axis charts carry {name, data}; non-axis charts (pie / donut / unit)
        // carry a bare numeric value. Empty each in its own shape: setting
        // `.data` on a number throws ("Cannot create property 'data' on number"),
        // which used to abort an in-flight update (e.g. a storyboard beat) once a
        // series had been collapsed via a legend toggle.
        if (series[i] && typeof series[i] === 'object') {
          series[i].data = []
        } else {
          series[i] = 0
        }
      }
    }
    return series
  }

  /**
   * Series display names for the CURRENT `w.config` (post-merge), derived the
   * same way the parser does: an object series' own `name`, else the matching
   * `labels` entry (non-axis / pie / unit), else a generated `series-N`.
   * @param {any[]} [list] the series to name, defaulting to the live config.
   * @returns {string[]}
   */
  _deriveSeriesNames(list) {
    const w = this.w
    const series = list || w.config.series || []
    const labels = w.config.labels || []
    return series.map((/** @type {any} */ s, /** @type {number} */ i) => {
      if (s && typeof s === 'object' && s.name != null) return String(s.name)
      return labels[i] != null ? String(labels[i]) : `series-${i + 1}`
    })
  }

  /**
   * Re-apply legend-hidden (collapsed) series to a freshly-updated
   * `w.config.series`, matching BY CATEGORY NAME rather than index. This keeps a
   * hide alive across a data update that reorders or regroups categories - most
   * visibly a storyboard beat that supplies new series each scroll:
   *   - a category still present stays hidden (at its possibly-new index);
   *   - a category the update dropped/regrouped away is un-hidden (it no longer
   *     exists, so it must reappear as part of the new grouping).
   * Records without a stored name (older collapses) fall back to their index.
   *
   * @param {any[]} [list] the series being written, defaulting to the live
   *   `w.config.series`. updateSeries()/appendSeries() pass the INCOMING array
   *   instead, because the reconcile has to happen before that array is
   *   parsed: parsing a collapsed row that still carries its values puts them
   *   back into the axis range, and the chart rescales to fit a series nobody
   *   can see. Pass a copy, not the caller's own objects: collapsed rows are
   *   emptied in place at the end of this.
   */
  reconcileCollapsedByName(list) {
    const w = this.w
    const gl = w.globals
    const target = list || w.config.series
    const newNames = this._deriveSeriesNames(target)

    /**
     * @param {any[]} records
     * @returns {{ records: any[], indices: number[] }}
     */
    const reconcile = (records) => {
      /** @type {any[]} */ const nextRecords = []
      /** @type {number[]} */ const nextIndices = []
      records.forEach((rec) => {
        const j =
          rec && rec.name != null ? newNames.indexOf(rec.name) : rec.index
        // Category gone (regrouped away) -> drop the collapse so it reappears.
        if (j == null || j < 0 || j >= target.length) return
        const s = /** @type {any} */ (target[j])
        rec.index = j
        // Refresh the stored data to the NEW value so a later rise restores the
        // current data, not the stale snapshot from when it was first hidden.
        //
        // An empty incoming row is not new data, it IS the collapsed
        // representation: resetSeries(shouldResetCollapsed:false) empties the
        // list before handing it on, and taking that would overwrite the only
        // copy of the data a later rise has to restore from.
        if (gl.axisCharts) {
          if (s && Array.isArray(s.data) && s.data.length) rec.data = s.data.slice()
        } else {
          rec.data = s
        }
        nextRecords.push(rec)
        nextIndices.push(j)
      })
      return { records: nextRecords, indices: nextIndices }
    }

    const main = reconcile(gl.collapsedSeries)
    gl.collapsedSeries = main.records
    gl.collapsedSeriesIndices = main.indices

    const anc = reconcile(gl.ancillaryCollapsedSeries)
    gl.ancillaryCollapsedSeries = anc.records
    gl.ancillaryCollapsedSeriesIndices = anc.indices

    gl.allSeriesCollapsed =
      gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length ===
      target.length

    this.emptyCollapsedSeries(target)
  }

  /**
   * @param {string} seriesName
   */
  /**
   * Bridge SVG series-dim state to the canvas renderer: SVG opacity classes
   * (legend-mouseover-inactive) don't touch the painted canvas series layer, so
   * repaint it with a matching per-series opacity. No-op unless the canvas
   * renderer is active. The renderer is mirrored on globals by RendererController
   * (Series has no ctx handle).
   * @param {{active:number, opacity:number}|null} dim
   */
  canvasRestyle(dim) {
    const r = this.w.globals.activeRenderer
    if (r && r.kind === 'canvas' && typeof r.restyle === 'function') {
      r.restyle(dim)
    }
  }

  /**
   * @param {string} seriesName
   */
  highlightSeries(seriesName) {
    const w = this.w

    const targetElement = this.getSeriesByName(seriesName)
    const realIndex = parseInt(
      targetElement?.getAttribute('data:realIndex') ?? '',
      10,
    )

    const cacheKey = 'highlightSeriesEls'
    let allSeriesEls = w.globals.cachedSelectors[cacheKey]

    if (!allSeriesEls) {
      allSeriesEls = w.dom.baseEl.querySelectorAll(
        `.apexcharts-series, .apexcharts-datalabels, .apexcharts-yaxis`,
      )
      w.globals.cachedSelectors[cacheKey] = allSeriesEls
    }

    let seriesEl = null
    let dataLabelEl = null
    let yaxisEl = null
    if (w.globals.axisCharts || w.config.chart.type === 'radialBar') {
      if (w.globals.axisCharts) {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[data\\:realIndex='${realIndex}']`,
        )
        dataLabelEl = w.dom.baseEl.querySelector(
          `.apexcharts-datalabels[data\\:realIndex='${realIndex}']`,
        )
        const yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex]
        yaxisEl = w.dom.baseEl.querySelector(
          `.apexcharts-yaxis[rel='${yaxisIndex}']`,
        )
      } else {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${realIndex + 1}']`,
        )
      }
    } else {
      seriesEl = w.dom.baseEl.querySelector(
        `.apexcharts-series[rel='${realIndex + 1}'] path`,
      )
    }

    for (let se = 0; se < allSeriesEls.length; se++) {
      const serEl = /** @type {Element} */ (allSeriesEls[se])
      serEl.classList.add(this.legendInactiveClass)
    }

    if (seriesEl) {
      if (!w.globals.axisCharts) {
        const parentEl = /** @type {Element} */ (seriesEl.parentNode)
        parentEl?.classList.remove(this.legendInactiveClass)
      }
      seriesEl.classList.remove(this.legendInactiveClass)

      if (dataLabelEl !== null) {
        dataLabelEl.classList.remove(this.legendInactiveClass)
      }

      if (yaxisEl !== null) {
        yaxisEl.classList.remove(this.legendInactiveClass)
      }
    } else {
      for (let se = 0; se < allSeriesEls.length; se++) {
        const serEl = /** @type {Element} */ (allSeriesEls[se])
        serEl.classList.remove(this.legendInactiveClass)
      }
    }

    this.canvasRestyle(
      seriesEl && !Number.isNaN(realIndex)
        ? { active: realIndex, opacity: 0.2 }
        : null,
    )
  }

  /**
   * @param {Event} e
   * @param {any} targetElement
   */
  toggleSeriesOnHover(e, targetElement) {
    const w = this.w

    if (!targetElement) targetElement = e.target

    const allSeriesEls = w.dom.baseEl.querySelectorAll(
      `.apexcharts-series, .apexcharts-datalabels, .apexcharts-yaxis`,
    )

    if (e.type === 'mousemove') {
      const realIndex = parseInt(targetElement.getAttribute('rel'), 10) - 1

      this.highlightSeries(w.seriesData.seriesNames[realIndex])
    } else if (e.type === 'mouseout') {
      for (let se = 0; se < allSeriesEls.length; se++) {
        allSeriesEls[se].classList.remove(this.legendInactiveClass)
      }
      this.canvasRestyle(null)
    }
  }

  /**
   * Dim every heatmap cell except those whose value falls inside the color
   * range at `rangeIndex`. Shared by the categorical legend (hover a legend
   * item) and the gradient legend (hover a band) — both supply an index into
   * `colorScale.ranges` plus an action, decoupling the highlight from any
   * particular DOM element / event shape.
   *
   * @param {number} rangeIndex index into `colorScale.ranges`
   * @param {'highlight'|'reset'} action
   */
  highlightRangeInSeries(rangeIndex, action) {
    const w = this.w
    const allHeatMapElements = w.dom.baseEl.getElementsByClassName(
      'apexcharts-heatmap-rect',
    )

    /**
     * @param {'add'|'remove'} op
     */
    const toggleAllInactive = (op) => {
      for (let i = 0; i < allHeatMapElements.length; i++) {
        const classList = /** @type {any} */ (allHeatMapElements[i]).classList
        if (typeof classList[op] === 'function') {
          classList[op](this.legendInactiveClass)
        }
      }
    }

    if (action === 'reset') {
      toggleAllInactive('remove')
      return
    }

    const ranges = w.config.plotOptions.heatmap.colorScale.ranges
    const range = ranges && ranges[rangeIndex]
    if (!range) return

    toggleAllInactive('add')
    for (let i = 0; i < allHeatMapElements.length; i++) {
      const val = Number(allHeatMapElements[i].getAttribute('val'))
      // Match the inclusive bounds used by determineColor (treemap/Helpers.js)
      // so the same cells that were colored by this range get highlighted.
      if (val >= range.from && val <= range.to) {
        allHeatMapElements[i].classList.remove(this.legendInactiveClass)
      }
    }
  }

  /**
   * @param {string[]} chartTypes
   */
  getActiveConfigSeriesIndex(order = 'asc', chartTypes = []) {
    const w = this.w
    let activeIndex = 0

    if (w.config.series.length > 1) {
      // active series flag is required to know if user has not deactivated via legend click
      /**
       * @param {Record<string, any>} s
       * @param {number} index
       */
      const activeSeriesIndex = w.config.series.map((s, index) => {
        const checkChartType = () => {
          if (w.globals.comboCharts) {
            return (
              chartTypes.length === 0 ||
              (chartTypes.length &&
                chartTypes.indexOf(
                  /** @type {Record<string,any>} */ (w.config.series[index])
                    .type,
                ) > -1)
            )
          }
          return true
        }

        const hasData =
          /** @type {any} */ (s).data &&
          /** @type {any} */ (s).data.length > 0 &&
          w.globals.collapsedSeriesIndices.indexOf(index) === -1

        return hasData && checkChartType() ? index : -1
      })
      for (
        let a = order === 'asc' ? 0 : activeSeriesIndex.length - 1;
        order === 'asc' ? a < activeSeriesIndex.length : a >= 0;
        order === 'asc' ? a++ : a--
      ) {
        if (activeSeriesIndex[a] !== -1) {
          activeIndex = activeSeriesIndex[a]
          break
        }
      }
    }

    return activeIndex
  }

  /**
   * The highest active series index inside each series group, as an array
   * parallel to `w.labelData.seriesGroups`. Entries are -1 for a group whose
   * every series is collapsed or empty.
   *
   * Same activity test as `getActiveConfigSeriesIndex` (has data and is not
   * legend-collapsed), applied per group so grouped stacked bars can ask which
   * series caps each individual stack rather than the chart as a whole.
   * @param {string[]} chartTypes
   * @returns {number[]}
   */
  getActiveConfigSeriesIndexByGroup(chartTypes = []) {
    const w = this.w
    const groups = w.labelData.seriesGroups || []

    return groups.map((/** @type {string[]} */ group) => {
      let last = -1
      w.config.series.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
        if (group.indexOf(w.seriesData.seriesNames[i]) === -1) return

        if (
          w.globals.comboCharts &&
          chartTypes.length &&
          chartTypes.indexOf(s.type) === -1
        ) {
          return
        }

        const hasData =
          s.data &&
          s.data.length > 0 &&
          w.globals.collapsedSeriesIndices.indexOf(i) === -1

        if (hasData) last = i
      })
      return last
    })
  }

  getBarSeriesIndices() {
    const w = this.w
    if (w.globals.comboCharts) {
      return this.w.config.series
        .map((/** @type {any} */ s, /** @type {number} */ i) => {
          return s.type === 'bar' || s.type === 'column' ? i : -1
        })
        .filter((/** @type {number} */ i) => {
          return i !== -1
        })
    }
    /**
     * @param {Record<string, any>} s
     * @param {number} i
     */
    return this.w.config.series.map((s, i) => {
      return i
    })
  }

  getPreviousPaths() {
    const gl = /** @type {Record<string, any>} */ (this.w.globals)
    // Two updates in one frame (an updateOptions and an updateSeries from the
    // same handler, or the second after awaiting the first): the first one's
    // render never reached the screen, so it is not what this capture should
    // start from. The first capture still is, so all of it is handed to this
    // update too (see LayoutTransition.pendingUntilPaint): the first update
    // has consumed its frames by now, and updateSeries clears the paths
    // before it captures. The polar stash is what the first render wrote.
    const held = gl.pendingCapture
    if (held?.pending) {
      Series.HELD.forEach((k) => {
        gl[k] = held[k]
      })
      return
    }
    this.capturePreviousPaths()
    gl.pendingCapture = Environment.isBrowser()
      ? pendingUntilPaint(Object.fromEntries(Series.HELD.map((k) => [k, gl[k]])))
      : null
  }

  capturePreviousPaths() {
    const w = this.w

    // Streaming scroll: snapshot the outgoing frame's parsed rows + pixel
    // positions so a windowed-continuation update (rolling window / append
    // under xaxis.range) can be animated as a slide. See StreamScroll.
    captureStreamFrame(w)

    // Axis-chrome snapshot: tick labels + gridlines of the outgoing render,
    // so a variable-length update can slide/fade the ruler along with the
    // reflowing marks. See AxisTransition.
    captureAxisChrome(w)

    // Circle snapshot (pie, donut, polarArea, radialBar, radar): its centre
    // and radius, so a circle the chrome re-centres or resizes eases there
    // instead of jumping. See CircleTransition.
    captureCircle(w)

    // Data-label snapshot (opt-in): position + value of bar/column labels, so
    // a data-change update can ride labels to their new slot and count their
    // value up. See DataLabelTransition. No-op unless the feature is on.
    captureDataLabels(w)
    // The labels of a series the legend is hiding, to carry out with it.
    captureExitLabels(w)

    // Non-axis charts (pie/donut/radialBar) overwrite previousPaths with the
    // raw series values at the end anyway — skip the DOM captures entirely.
    if (!w.globals.axisCharts) {
      w.globals.previousPaths = w.seriesData.series
      return
    }

    // A synced sibling chart (see getSyncedCharts()) can land here mid
    // teardown/rebuild: a wrapping component (e.g. a templating card that
    // re-renders its child on every data-driven config change) may have
    // already detached this chart's host element - or never finished
    // mounting it - while this chart's own _updateOptions() call is still
    // in flight. Either way there's no live DOM to capture paths from.
    if (!Utils.elementExists(w.dom.baseEl)) {
      w.globals.previousPaths = []
      return
    }

    w.globals.previousPaths = []

    /**
     * @param {any} seriesEls
     * @param {number} i
     * @param {string} type
     */
    function pushPaths(seriesEls, i, type) {
      const paths = seriesEls[i].childNodes
      const dArr = {
        type,
        paths: /** @type {any[]} */ ([]),
        realIndex: seriesEls[i].getAttribute('data:realIndex'),
      }

      for (let j = 0; j < paths.length; j++) {
        if (paths[j].hasAttribute('pathTo')) {
          const d = paths[j].getAttribute('pathTo')
          // Datum key + fill stamped by the bar renderer: the key lets the
          // next render match survivors by identity (not position) and detect
          // exited datums; the fill paints their exit ghosts.
          //
          // `flip` records whether the bar was MIRRORED. A stacked bar with a
          // borderRadius only ever carries top-rounded geometry; the radius is
          // moved to the bottom by the apexcharts-flip-y/-x class, so without
          // this the next render cannot tell where the previous radius visually
          // sat. See BarStacked's held-mirror handling.
          dArr.paths.push({
            d,
            key: paths[j].getAttribute('data:pathKey'),
            fill: paths[j].getAttribute('fill'),
            flip:
              paths[j].classList.contains('apexcharts-flip-y') ||
              paths[j].classList.contains('apexcharts-flip-x'),
          })
        }
      }

      w.globals.previousPaths.push(dArr)
    }

    /**
     * @param {string} chartType
     */
    const getPaths = (chartType) => {
      return w.dom.baseEl.querySelectorAll(
        `.apexcharts-${chartType}-series .apexcharts-series`,
      )
    }

    // boxPlot shares the candlestick renderer, which now morphs each box from
    // its previous shape, so its paths are captured too.
    const chartTypes = [
      'line',
      'area',
      'bar',
      'rangebar',
      'rangeArea',
      'candlestick',
      'boxPlot',
      'radar',
    ]
    chartTypes.forEach((type) => {
      const paths = getPaths(type)
      for (let p = 0; p < paths.length; p++) {
        pushPaths(paths, p, type)
      }
    })

    const heatTreeSeries = w.dom.baseEl.querySelectorAll(
      `.apexcharts-${w.config.chart.type} .apexcharts-series`,
    )

    if (heatTreeSeries.length > 0) {
      for (let h = 0; h < heatTreeSeries.length; h++) {
        // The cells/tiles by their class, rect or path alike: non-rect heatmap
        // cell shapes render as <path> (and without them a data update loses
        // its color-from and tweens in from transparent). Not every rect in
        // the group: a nested treemap draws its parents and headers ahead of
        // the tiles, so by position each tile started from a parent's shape,
        // and the series title plate came along too.
        const base = `.apexcharts-${w.config.chart.type} .apexcharts-series[data\\:realIndex='${h}']`
        const seriesEls = w.dom.baseEl.querySelectorAll(
          `${base} .apexcharts-${w.config.chart.type}-rect`,
        )

        const dArr = []
        // What each tile's label showed, so a label the next render adds (or
        // draws differently) fades in rather than appearing at full strength
        // over a tile still growing.
        /** @type {Map<string | null, string>} */
        const labelled = new Map()
        /** @type {Set<string | null>} */
        const fading = new Set()
        w.dom.baseEl
          .querySelectorAll(`${base} .apexcharts-data-labels[data\\:key]`)
          .forEach((/** @type {Element} */ el) => {
            labelled.set(el.getAttribute('data:key'), Series.treemapLabelLook(el))
            if (parseFloat(el.getAttribute('opacity') ?? '1') < 0.999) {
              fading.add(el.getAttribute('data:key'))
            }
          })

        for (let i = 0; i < seriesEls.length; i++) {
          /**
           * @param {number} x
           */
          const getAttr = (/** @type {string} */ x) => {
            return /** @type {Element} */ (seriesEls[i]).getAttribute(x)
          }
          const rect = {
            x: parseFloat(getAttr('x') ?? '0'),
            y: parseFloat(getAttr('y') ?? '0'),
            width: parseFloat(getAttr('width') ?? '0'),
            height: parseFloat(getAttr('height') ?? '0'),
          }
          const entry = {
            rect,
            color: seriesEls[i].getAttribute('color'),
            fill: seriesEls[i].getAttribute('fill'),
            label: labelled.get(getAttr('data:key')) ?? '',
            // Still fading in (a move was under way): its successor fades in
            // too, rather than appearing at full strength.
            labelFading: fading.has(getAttr('data:key')),
          }
          // Read back by data index (previousPaths[i][j]), so stored by it.
          // In DOM order, a zoomed treemap (which draws only the branch's
          // leaves) started every tile from another tile's box.
          const j = parseInt(getAttr('j') ?? '', 10)
          if (Number.isFinite(j) && j >= 0) dArr[j] = entry
          else dArr.push(entry)
        }
        w.globals.previousPaths.push(dArr)
      }
    }

    // A nested treemap's parent containers, by series and branch, so they ease from
    // their old boxes with the tiles inside them (Treemap._drawParent).
    /** @type {NonNullable<import('../types/internal').ChartStateW['globals']['prevTreemapParents']>} */
    const parents = new Map()
    if (w.config.chart.type === 'treemap') {
      w.dom.baseEl
        .querySelectorAll('.apexcharts-treemap-parent-rect[data\\:key]')
        .forEach((/** @type {Element} */ el) => {
          const box = ['x', 'y', 'width', 'height'].map((a) =>
            parseFloat(el.getAttribute(a) ?? ''),
          )
          // Branch keys repeat from one series to the next (each has its own
          // root and its own "/0:G1"), so the series is part of the key.
          const ri = el
            .closest('.apexcharts-series')
            ?.getAttribute('data:realIndex')
          // Its header strip too: a zoom changes a container's depth, and
          // with it the strip's height and colours.
          const head = el.parentElement?.querySelector(
            '.apexcharts-treemap-parent-header',
          )
          const hb = head
            ? ['x', 'y', 'width', 'height'].map((a) =>
                parseFloat(head.getAttribute(a) ?? ''),
              )
            : null
          if (box.every(Number.isFinite) && ri != null) {
            parents.set(`${ri}|${el.getAttribute('data:key') ?? ''}`, {
              x: box[0],
              y: box[1],
              width: box[2],
              height: box[3],
              fill: el.getAttribute('fill'),
              header:
                head && hb && hb.every(Number.isFinite)
                  ? {
                      x: hb[0],
                      y: hb[1],
                      width: hb[2],
                      height: hb[3],
                      fill: head.getAttribute('fill'),
                      look: Series.treemapHeaderLook(
                        el.parentElement?.querySelector(
                          '.apexcharts-treemap-parent-label',
                        ),
                      ),
                    }
                  : null,
            })
          }
        })
    }
    w.globals.prevTreemapParents = parents.size ? parents : null

    // A click-to-zoom also needs what the new view will leave out: the whole
    // outgoing picture, for Treemap to carry off the plot, including what an
    // earlier zoom still moving is carrying off. Its gradients, patterns and
    // filters live in the old render's defs, which go with it: copied too,
    // under ids of their own, so nothing the new render defines is shadowed.
    w.globals.prevTreemapView = null
    if (w.config.chart.type === 'treemap' && w.globals.treemapZoom) {
      const view = w.dom.baseEl.querySelector('.apexcharts-treemap')
      if (view) {
        const copy = /** @type {Element} */ (view.cloneNode(true))
        const tag = `zoom${++Series.ghostDefs}`
        /** @type {Map<string, Element>} */
        const defs = new Map()
        copy.querySelectorAll('[fill^="url("], [stroke^="url("], [filter^="url("]').forEach((el) => {
          ;['fill', 'stroke', 'filter'].forEach((a) => {
            const m = /^url\(#([^)]+)\)$/.exec(el.getAttribute(a) || '')
            if (!m) return
            if (!defs.has(m[1])) {
              const src = w.dom.baseEl.querySelector(`[id="${m[1]}"]`)
              if (!src) return
              const c = /** @type {Element} */ (src.cloneNode(true))
              c.setAttribute('id', `${m[1]}-${tag}`)
              defs.set(m[1], c)
            }
            el.setAttribute(a, `url(#${m[1]}-${tag})`)
          })
        })
        if (defs.size) {
          const holder = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
          holder.setAttribute('class', 'apexcharts-treemap-ghost-defs')
          defs.forEach((c) => holder.appendChild(c))
          copy.appendChild(holder)
        }
        w.globals.prevTreemapView = copy
      }
    }
  }

  clearPreviousPaths() {
    const w = this.w
    w.globals.previousPaths = []
    w.globals.allSeriesCollapsed = false
  }

  handleNoData() {
    const w = this.w
    const me = this

    const noDataOpts = w.config.noData
    const graphics = new Graphics(me.w)

    let x = w.globals.svgWidth / 2
    let y = w.globals.svgHeight / 2
    let textAnchor = 'middle'

    w.globals.noData = true
    w.globals.animationEnded = true

    if (noDataOpts.align === 'left') {
      x = 10
      textAnchor = 'start'
    } else if (noDataOpts.align === 'right') {
      x = w.globals.svgWidth - 10
      textAnchor = 'end'
    }

    if (noDataOpts.verticalAlign === 'top') {
      y = 50
    } else if (noDataOpts.verticalAlign === 'bottom') {
      y = w.globals.svgHeight - 50
    }

    x = x + noDataOpts.offsetX
    y = y + parseInt(noDataOpts.style.fontSize, 10) + 2 + noDataOpts.offsetY

    if (noDataOpts.text !== undefined && noDataOpts.text !== '') {
      const titleText = graphics.drawText({
        x,
        y,
        text: noDataOpts.text,
        textAnchor,
        fontSize: noDataOpts.style.fontSize,
        fontFamily: noDataOpts.style.fontFamily,
        foreColor: noDataOpts.style.color,
        opacity: 1,
        cssClass: 'apexcharts-text-nodata',
      })

      w.dom.Paper.add(titleText)
    }
  }

  // When user clicks on legends, the collapsed series is filled with [0,0,0,...,0]
  // This is because we don't want to alter the series' length as it is used at many places
  /**
   * @param {any[]} series
   */
  setNullSeriesToZeroValues(series) {
    const w = this.w
    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length === 0) {
        for (let j = 0; j < series[w.globals.maxValsInArrayIndex].length; j++) {
          series[sl].push(0)
        }
      }
    }
    return series
  }

  hasAllSeriesEqualX() {
    let equalLen = true
    const w = this.w

    const filteredSerX = this.filteredSeriesX()

    for (let i = 0; i < filteredSerX.length - 1; i++) {
      if (filteredSerX[i][0] !== filteredSerX[i + 1][0]) {
        equalLen = false
        break
      }
    }

    w.globals.allSeriesHasEqualX = equalLen

    return equalLen
  }

  filteredSeriesX() {
    const w = this.w

    /**
     * @param {any[]} ser
     */
    const filteredSeriesX = w.seriesData.seriesX.map((ser) =>
      ser.length > 0 ? ser : [],
    )

    return filteredSeriesX
  }
}
