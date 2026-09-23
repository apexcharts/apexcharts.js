// @ts-check
import Graphics from './Graphics'
import Exports from './Exports'
import Utils from './../utils/Utils'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import icoPan from './../assets/ico-pan-hand.svg'
import icoZoom from './../assets/ico-zoom-in.svg'
import icoReset from './../assets/ico-reset.svg'
import icoZoomIn from './../assets/ico-plus.svg'
import icoZoomOut from './../assets/ico-minus.svg'
import icoSelect from './../assets/ico-select.svg'
import icoMeasure from './../assets/ico-measure.svg'
import icoMenu from './../assets/ico-menu.svg'

/**
 * ApexCharts Toolbar Class for creating toolbar in axis based charts.
 *
 * @module Toolbar
 **/

export default class Toolbar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: getSyncedCharts, fireEvent, user callbacks, Exports

    this.ev = this.w.config.chart.events
    this.selectedClass = 'apexcharts-selected'

    this.localeValues = this.w.globals.locale.toolbar

    this.minX = w.globals.minX
    this.maxX = w.globals.maxX
    /** @type {HTMLElement | null} */ this.elZoom = null
    /** @type {HTMLElement | null} */ this.elZoomIn = null
    /** @type {HTMLElement | null} */ this.elZoomOut = null
    /** @type {HTMLElement | null} */ this.elPan = null
    /** @type {HTMLElement | null} */ this.elSelection = null
    /** @type {HTMLElement | null} */ this.elMeasure = null
    /** @type {HTMLElement | null} */ this.elZoomReset = null
    /** @type {HTMLElement | null} */ this.elMenuIcon = null
    /** @type {HTMLElement | null} */ this.elMenu = null
    /** @type {HTMLElement[]} */ this.elMenuItems = []
    /** @type {any} */ this.t = null
    /**
     * What the last render drew purely because the chart was zoomed: the whole
     * toolbar ('wrap'), just the reset control ('control'), or neither. Read by
     * {@link Toolbar#clearZoomAffordance}, which has to take it down by hand.
     *
     * @type {'wrap' | 'control' | null}
     */
    this._drawnForZoom = null
  }

  /**
   * Whether this chart's built-in ways back out of a zoom are switched on.
   *
   * The gate `chart.zoom.resetControl` opens, and the one the Escape shortcut
   * reads too, so a page that says it supplies its own reset gets neither.
   * 'auto' means "supply one when nothing else on screen can": a toolbar
   * showing its reset tool is a way back, and anything else is not.
   *
   * @returns {boolean}
   */
  resetControlAllowed() {
    const c = this.w.config.chart
    if (!c.zoom || !c.zoom.enabled) return false
    const setting =
      c.zoom.resetControl === undefined ? 'auto' : c.zoom.resetControl
    if (setting !== 'auto') return !!setting
    const onScreen =
      c.toolbar && c.toolbar.show && c.toolbar.tools && c.toolbar.tools.reset
    return !onScreen
  }

  /**
   * Whether a reset control has to be drawn for the state the chart is in now.
   *
   * Only while the chart is actually zoomed, which is the whole idea: the
   * control appears at the moment the viewer changed the view, where they are
   * already looking, and goes again when the range does. A page that never
   * zooms never sees it, so `toolbar: { show: false }` still means an empty
   * chart for everyone who does not zoom.
   *
   * @returns {boolean}
   */
  resetControlDue() {
    return !!this.w.interact.zoomed && this.resetControlAllowed()
  }

  /**
   * @param {{ resetOnly?: boolean }} [opts] `resetOnly` draws the on-demand
   *   reset control and nothing else, for a chart whose page asked for no
   *   toolbar at all. See {@link Toolbar#resetControlDue}.
   */
  createToolbar(opts = {}) {
    const w = this.w
    const resetOnly = !!opts.resetOnly

    const createDiv = () => {
      return BrowserAPIs.createElementNS('http://www.w3.org/1999/xhtml', 'div')
    }
    // Toolbar controls are native <button> elements (WCAG 1st rule of ARIA:
    // prefer real buttons over div[role=button]). Type defaults to "submit"
    // inside forms, so we set it explicitly.
    const createBtn = () => {
      const btn = /** @type {HTMLButtonElement} */ (
        BrowserAPIs.createElementNS('http://www.w3.org/1999/xhtml', 'button')
      )
      btn.setAttribute('type', 'button')
      return btn
    }
    const elToolbarWrap = createDiv()
    elToolbarWrap.setAttribute('class', 'apexcharts-toolbar')
    elToolbarWrap.style.top = w.config.chart.toolbar.offsetY + 'px'
    elToolbarWrap.style.right = -w.config.chart.toolbar.offsetX + 3 + 'px'
    w.dom.elWrap.appendChild(elToolbarWrap)

    this.elZoom = createBtn()
    this.elZoomIn = createBtn()
    this.elZoomOut = createBtn()
    this.elPan = createBtn()
    this.elSelection = createBtn()
    this.elMeasure = createBtn()
    this.elZoomReset = createBtn()
    this.elMenuIcon = createBtn()
    // The menu (popup container) stays a <div> — it's not a button.
    this.elMenu = createDiv()
    /** @type {any} */
    this.elCustomIcons = []

    this.t = w.config.chart.toolbar.tools

    this._drawnForZoom = null

    if (resetOnly) {
      // Every control off but the one that undoes the zoom. A copy, because
      // this is the state of one render and not a change to the page's config.
      this.t = {
        zoom: false,
        zoomin: false,
        zoomout: false,
        selection: false,
        pan: false,
        measure: false,
        download: false,
        customIcons: [],
        reset: true,
      }
      this._drawnForZoom = 'wrap'
    } else if (!this.t.reset && this.resetControlDue()) {
      // A toolbar that is shown with its reset tool switched off, on a chart
      // that is now zoomed: the same dead end, so the same answer. It comes and
      // goes with the zoom, which does shift the icons beside it; that is the
      // cost of a config which otherwise offers no way back at all.
      this.t = { ...this.t, reset: true }
      this._drawnForZoom = 'control'
    }

    if (Array.isArray(this.t.customIcons)) {
      for (let i = 0; i < this.t.customIcons.length; i++) {
        this.elCustomIcons.push(createBtn())
      }
    }

    /** @type {any[]} */
    const toolbarControls = []

    /**
     * @param {string} type
     * @param {Element} el
     * @param {string} ico
     */
    const appendZoomControl = (type, el, ico) => {
      const tool = type.toLowerCase()
      if (this.t[tool] && w.config.chart.zoom.enabled) {
        toolbarControls.push({
          el,
          icon: typeof this.t[tool] === 'string' ? this.t[tool] : ico,
          title: /** @type {any} */ (this.localeValues)[type],
          class: `apexcharts-${tool}-icon`,
        })
      }
    }

    appendZoomControl('zoomIn', this.elZoomIn, icoZoomIn)
    appendZoomControl('zoomOut', this.elZoomOut, icoZoomOut)

    /**
     * @param {string} z
     */
    const zoomSelectionCtrls = (z) => {
      if (this.t[z] && w.config.chart[z].enabled) {
        toolbarControls.push({
          el: z === 'zoom' ? this.elZoom : this.elSelection,
          icon:
            typeof this.t[z] === 'string'
              ? this.t[z]
              : z === 'zoom'
                ? icoZoom
                : icoSelect,
          title: /** @type {any} */ (this.localeValues)[
            z === 'zoom' ? 'selectionZoom' : 'selection'
          ],
          class: `apexcharts-${z}-icon`,
        })
      }
    }
    zoomSelectionCtrls('zoom')
    zoomSelectionCtrls('selection')

    if (this.t.pan && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elPan,
        icon: typeof this.t.pan === 'string' ? this.t.pan : icoPan,
        title: this.localeValues.pan,
        class: 'apexcharts-pan-icon',
      })
    }

    // Measure ruler toggle — independent of zoom.enabled; shown only when the
    // measure feature is active (chart.measure.enabled).
    if (this.t.measure && w.config.chart.measure && w.config.chart.measure.enabled) {
      toolbarControls.push({
        el: this.elMeasure,
        icon: typeof this.t.measure === 'string' ? this.t.measure : icoMeasure,
        title: /** @type {any} */ (this.localeValues).measure || 'Measure',
        class: 'apexcharts-measure-icon',
      })
    }

    appendZoomControl('reset', this.elZoomReset, icoReset)

    if (this.t.download) {
      toolbarControls.push({
        el: this.elMenuIcon,
        icon: typeof this.t.download === 'string' ? this.t.download : icoMenu,
        title: this.localeValues.menu,
        class: 'apexcharts-menu-icon',
      })
    }

    for (let i = 0; i < this.elCustomIcons.length; i++) {
      toolbarControls.push({
        el: this.elCustomIcons[i],
        icon: this.t.customIcons[i].icon,
        title: this.t.customIcons[i].title,
        index: this.t.customIcons[i].index,
        class: 'apexcharts-toolbar-custom-icon ' + this.t.customIcons[i].class,
      })
    }

    toolbarControls.forEach((t, index) => {
      if (t.index) {
        Utils.moveIndexInArray(toolbarControls, index, t.index)
      }
    })

    for (let i = 0; i < toolbarControls.length; i++) {
      // <button> already has implicit role="button" and is keyboard-focusable.
      Graphics.setAttrs(toolbarControls[i].el, {
        class: toolbarControls[i].class,
        title: toolbarControls[i].title,
        'aria-label': toolbarControls[i].title,
      })

      toolbarControls[i].el.innerHTML = toolbarControls[i].icon
      elToolbarWrap.appendChild(toolbarControls[i].el)
    }

    // Toggle-button ARIA pressed state for zoom / selection / pan
    if (this.elZoom.parentNode) {
      this.elZoom.setAttribute('aria-pressed', String(!!w.interact.zoomEnabled))
    }
    if (this.elSelection.parentNode) {
      this.elSelection.setAttribute(
        'aria-pressed',
        String(!!w.interact.selectionEnabled),
      )
    }
    if (this.elPan.parentNode) {
      this.elPan.setAttribute('aria-pressed', String(!!w.interact.panEnabled))
    }
    if (this.elMeasure.parentNode) {
      this.elMeasure.setAttribute(
        'aria-pressed',
        String(!!w.interact.measureEnabled),
      )
    }

    // Menu icon: popup indicator
    if (this.elMenuIcon.parentNode) {
      this.elMenuIcon.setAttribute('aria-haspopup', 'true')
      this.elMenuIcon.setAttribute('aria-expanded', 'false')
    }

    // Nothing opens it in a reset-only toolbar, and an export menu is not what
    // a page that asked for no toolbar is being handed a control for.
    if (!resetOnly) this._createHamburgerMenu(elToolbarWrap)

    if (resetOnly) {
      // Just the one binding, rather than the whole set: there is no menu to
      // open, no mode to toggle, and nothing here reaches for the document.
      this.elZoomReset?.addEventListener(
        'click',
        this.handleZoomReset.bind(this),
      )
      return
    }

    if (w.interact.zoomEnabled) {
      this.elZoom.classList.add(this.selectedClass)
    } else if (w.interact.panEnabled) {
      this.elPan.classList.add(this.selectedClass)
    } else if (w.interact.selectionEnabled) {
      this.elSelection.classList.add(this.selectedClass)
    } else if (w.interact.measureEnabled && this.elMeasure) {
      // Pre-selected via toolbar.autoSelected: 'measure'. Arm the ruler now; the
      // Measure module also self-arms on mount, so this is null-safe/idempotent.
      this.elMeasure.classList.add(this.selectedClass)
      this.ctx.measure?.startMeasure?.()
    }

    this.addToolbarEventListeners()
  }

  /**
   * @param {Element} parent
   */
  _createHamburgerMenu(parent) {
    this.elMenuItems = []
    parent.appendChild(/** @type {Node} */ (this.elMenu))

    Graphics.setAttrs(this.elMenu, {
      class: 'apexcharts-menu',
      role: 'menu',
    })

    const menuItems = [
      {
        name: 'exportSVG',
        title: this.localeValues.exportToSVG,
      },
      {
        name: 'exportPNG',
        title: this.localeValues.exportToPNG,
      },
      {
        name: 'exportCSV',
        title: this.localeValues.exportToCSV,
      },
    ]

    for (let i = 0; i < menuItems.length; i++) {
      this.elMenuItems.push(
        BrowserAPIs.createElementNS('http://www.w3.org/1999/xhtml', 'div'),
      )
      this.elMenuItems[i].innerHTML = menuItems[i].title
      Graphics.setAttrs(this.elMenuItems[i], {
        class: `apexcharts-menu-item ${menuItems[i].name}`,
        title: menuItems[i].title,
        role: 'menuitem',
        tabindex: '-1',
      })
      ;/** @type {HTMLElement} */ (this.elMenu).appendChild(this.elMenuItems[i])
    }
  }

  addToolbarEventListeners() {
    this.elZoomReset?.addEventListener('click', this.handleZoomReset.bind(this))
    this.elSelection?.addEventListener(
      'click',
      this.toggleZoomSelection.bind(this, 'selection'),
    )
    this.elZoom?.addEventListener(
      'click',
      this.toggleZoomSelection.bind(this, 'zoom'),
    )
    this.elZoomIn?.addEventListener('click', this.handleZoomIn.bind(this))
    this.elZoomOut?.addEventListener('click', this.handleZoomOut.bind(this))
    this.elPan?.addEventListener('click', this.togglePanning.bind(this))
    this.elMeasure?.addEventListener('click', this.toggleMeasure.bind(this))
    this.elMenuIcon?.addEventListener('click', this.toggleMenu.bind(this))
    this.elMenuItems.forEach((m) => {
      if (m.classList.contains('exportSVG')) {
        m.addEventListener('click', this.handleDownload.bind(this, 'svg'))
      } else if (m.classList.contains('exportPNG')) {
        m.addEventListener('click', this.handleDownload.bind(this, 'png'))
      } else if (m.classList.contains('exportCSV')) {
        m.addEventListener('click', this.handleDownload.bind(this, 'csv'))
      }
    })
    for (let i = 0; i < this.t.customIcons.length; i++) {
      this.elCustomIcons[i].addEventListener(
        'click',
        this.t.customIcons[i].click.bind(this, this.ctx, this.ctx.w),
      )
    }

    // ── Keyboard accessibility ──────────────────────────────────────────────

    // Activate any toolbar button (not menu items) with Enter or Space
    const toolbarButtons = [
      this.elZoomReset,
      this.elSelection,
      this.elZoom,
      this.elZoomIn,
      this.elZoomOut,
      this.elPan,
      this.elMeasure,
      this.elMenuIcon,
      ...this.elCustomIcons,
    ]
    toolbarButtons.forEach((btn) => {
      /**
       * @param {Event} e
       */
      btn.addEventListener('keydown', (/** @type {any} */ e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          // Capture the button's class before click triggers a potential
          // re-render (zoom-in/out/reset recreate the toolbar DOM, which
          // removes the focused element and loses focus — same issue as legend).
          const btnClass = btn.className
          btn.click()
          // After re-render, restore focus to the equivalent new button so the
          // user can keep operating without having to re-tab to the toolbar.
          requestAnimationFrame(() => {
            const baseEl = this.w.dom.baseEl
            if (!baseEl) return
            // Match on the first apexcharts-specific class (e.g. apexcharts-zoomin-icon)
            const apexClass = btnClass
              .split(' ')
              /**
               * @param {string} c
               */
              .find((/** @type {any} */ c) => c.startsWith('apexcharts-'))
            if (!apexClass) return
            const restored = baseEl.querySelector(`.${apexClass}`)
            if (restored) /** @type {HTMLElement} */ (restored).focus()
          })
        }
      })
    })

    // Menu keyboard navigation: Arrow keys move focus, Escape closes menu
    this.elMenuIcon?.addEventListener(
      'keydown',
      (/** @type {KeyboardEvent} */ e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          if (!this.elMenu?.classList.contains('apexcharts-menu-open')) {
            this.toggleMenu()
          }
          // Focus first (ArrowDown) or last (ArrowUp) menu item after menu renders
          window.setTimeout(() => {
            const idx = e.key === 'ArrowDown' ? 0 : this.elMenuItems.length - 1
            if (this.elMenuItems[idx])
              /** @type {HTMLElement} */ (this.elMenuItems[idx]).focus()
          }, 20)
        }
      },
    )

    this.elMenuItems.forEach((m, idx) => {
      m.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          const next = this.elMenuItems[idx + 1] || this.elMenuItems[0]
          next.focus()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          const prev =
            this.elMenuItems[idx - 1] ||
            this.elMenuItems[this.elMenuItems.length - 1]
          prev.focus()
        } else if (e.key === 'Escape' || e.key === 'Tab') {
          this._closeMenu()
          this.elMenuIcon?.focus()
          if (e.key === 'Tab') {
            // Allow Tab to continue natural flow — do not prevent default
          } else {
            e.preventDefault()
          }
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          m.click()
        }
      })
    })
  }

  /**
   * @param {string} type
   */
  toggleZoomSelection(type) {
    const charts = this.ctx.getSyncedCharts()

    /**
     * @param {Record<string, any>} ch
     */
    charts.forEach((ch) => {
      const tb = ch.ctx.toolbar
      const enabledType =
        type === 'selection' ? 'selectionEnabled' : 'zoomEnabled'

      // Capture the state BEFORE toggleOtherControls resets every tool, so a
      // click on the already-selected tool turns it OFF (leaving no active
      // tool) instead of clearing and immediately re-selecting it.
      const wasEnabled = !!ch.w.globals[enabledType]

      tb.toggleOtherControls()

      const el = type === 'selection' ? tb.elSelection : tb.elZoom

      if (!wasEnabled) {
        ch.w.globals[enabledType] = true
        el.classList.add(tb.selectedClass)
      }

      el.setAttribute('aria-pressed', String(!!ch.w.globals[enabledType]))
    })
  }

  /**
   * Toggle the measure ruler tool. Mutually exclusive with zoom/pan/selection
   * (toggleOtherControls deselects those and disarms any active measure), so a
   * fresh enable arms the ruler via the Measure module's sticky mode.
   */
  toggleMeasure() {
    const w = this.w
    const enabling = !w.interact.measureEnabled

    // Deselect zoom/pan/selection and disarm any current measure.
    this.toggleOtherControls()

    if (enabling) {
      w.interact.measureEnabled = true
      this.elMeasure?.classList.add(this.selectedClass)
      this.ctx.measure?.startMeasure?.()
    }

    this.elMeasure?.setAttribute(
      'aria-pressed',
      String(w.interact.measureEnabled),
    )
  }

  getToolbarIconsReference() {
    const w = this.w
    if (!this.elZoom) {
      this.elZoom = w.dom.baseEl.querySelector('.apexcharts-zoom-icon')
    }
    if (!this.elPan) {
      this.elPan = w.dom.baseEl.querySelector('.apexcharts-pan-icon')
    }
    if (!this.elSelection) {
      this.elSelection = w.dom.baseEl.querySelector(
        '.apexcharts-selection-icon',
      )
    }
    if (!this.elMeasure) {
      this.elMeasure = w.dom.baseEl.querySelector('.apexcharts-measure-icon')
    }
  }

  /**
   * @param {string} type
   */
  enableZoomPanFromToolbar(type) {
    this.toggleOtherControls()

    type === 'pan'
      ? (this.w.interact.panEnabled = true)
      : (this.w.interact.zoomEnabled = true)

    const el = type === 'pan' ? this.elPan : this.elZoom
    const el2 = type === 'pan' ? this.elZoom : this.elPan
    if (el) {
      el.classList.add(this.selectedClass)
    }
    if (el2) {
      el2.classList.remove(this.selectedClass)
    }
  }

  togglePanning() {
    const charts = this.ctx.getSyncedCharts()

    /**
     * @param {Record<string, any>} ch
     */
    charts.forEach((ch) => {
      const tb = ch.ctx.toolbar
      // Capture BEFORE the reset so clicking the active pan tool turns it off.
      const wasEnabled = !!ch.w.interact.panEnabled

      tb.toggleOtherControls()

      if (!wasEnabled) {
        ch.w.interact.panEnabled = true
        tb.elPan.classList.add(tb.selectedClass)
      }

      tb.elPan.setAttribute('aria-pressed', String(!!ch.w.interact.panEnabled))
    })
  }

  toggleOtherControls() {
    const w = this.w
    w.interact.panEnabled = false
    w.interact.zoomEnabled = false
    w.interact.selectionEnabled = false

    // Measure is mutually exclusive with zoom/pan/selection: leaving measure
    // mode disarms the ruler's capture pane so the plot regains zoom/pan/hover.
    if (w.interact.measureEnabled) {
      w.interact.measureEnabled = false
      this.ctx.measure?.stopMeasure?.()
      this.elMeasure?.setAttribute('aria-pressed', 'false')
    }

    this.getToolbarIconsReference()

    const toggleEls = [this.elPan, this.elSelection, this.elZoom, this.elMeasure]
    toggleEls.forEach((el) => {
      if (el) {
        el.classList.remove(this.selectedClass)
      }
    })
  }

  /**
   * Read the current x-range from globals at click time.
   * Toolbar instance is kept alive across updates (Phase 8 lazy
   * instantiation), so cached this.minX/maxX go stale after a zoom.
   * @returns {{minX: number, maxX: number}}
   */
  _currentXRange() {
    const w = this.w
    if (w.axisFlags.isRangeBar) {
      return { minX: w.globals.minY, maxX: w.globals.maxY }
    }
    return { minX: w.globals.minX, maxX: w.globals.maxX }
  }

  handleZoomIn() {
    const w = this.w
    const { minX, maxX } = this._currentXRange()
    this.minX = minX
    this.maxX = maxX

    const centerX = (minX + maxX) / 2
    const newMinX = (minX + centerX) / 2
    const newMaxX = (maxX + centerX) / 2

    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX)

    if (!w.interact.disableZoomIn) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX)
    }
  }

  handleZoomOut() {
    const w = this.w
    const { minX, maxX } = this._currentXRange()
    this.minX = minX
    this.maxX = maxX

    // avoid zooming out beyond 1000 which may result in NaN values being printed on x-axis
    if (
      w.config.xaxis.type === 'datetime' &&
      new Date(minX).getUTCFullYear() < 1000
    ) {
      return
    }

    const centerX = (minX + maxX) / 2
    const newMinX = minX - (centerX - minX)
    const newMaxX = maxX - (centerX - maxX)

    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX)

    if (!w.interact.disableZoomOut) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX)
    }
  }

  /**
   * @param {number} newMinX
   * @param {number} newMaxX
   */
  _getNewMinXMaxX(newMinX, newMaxX) {
    const shouldFloor = this.w.config.xaxis.convertedCatToNumeric
    return {
      minX: shouldFloor ? Math.floor(newMinX) : newMinX,
      maxX: shouldFloor ? Math.floor(newMaxX) : newMaxX,
    }
  }

  /**
   * @param {number} newMinX
   * @param {number} newMaxX
   */
  zoomUpdateOptions(newMinX, newMaxX) {
    const w = this.w

    if (newMinX === undefined && newMaxX === undefined) {
      this.handleZoomReset()
      return
    }

    if (w.config.xaxis.convertedCatToNumeric) {
      // in category charts, avoid zooming out beyond min and max
      if (newMinX < 1) {
        newMinX = 1
        newMaxX = w.globals.dataPoints
      }

      if (newMaxX - newMinX < 2) {
        return
      }
    }

    let xaxis = {
      min: newMinX,
      max: newMaxX,
    }

    const beforeZoomRange = this.getBeforeZoomRange(
      xaxis,
      /** @type {any} */ (undefined),
    )
    if (beforeZoomRange) {
      xaxis = beforeZoomRange.xaxis
    }

    /** @type {{ xaxis: any; yaxis?: any }} */
    const options = {
      xaxis,
    }
    if (!w.globals.initialConfig) return
    const yaxis = Utils.clone(w.globals.initialConfig.yaxis)

    if (!w.config.chart.group) {
      // if chart in a group, prevent yaxis update here
      // fix issue #650
      options.yaxis = yaxis
    }

    this.w.interact.zoomed = true

    this.ctx.updateHelpers._updateOptions(
      options,
      false,
      this.w.config.chart.animations.dynamicAnimation.enabled,
    )

    this.zoomCallback(xaxis, yaxis)
  }

  /**
   * @param {Record<string, any>} xaxis
   * @param {Record<string, any>} yaxis
   */
  zoomCallback(xaxis, yaxis) {
    if (typeof this.ev.zoomed === 'function') {
      this.ev.zoomed(this.ctx, { xaxis, yaxis })
      this.ctx.events.fireEvent('zoomed', { xaxis, yaxis })
    }
  }

  /**
   * @param {Record<string, any>} xaxis
   * @param {Record<string, any>} yaxis
   */
  getBeforeZoomRange(xaxis, yaxis) {
    let newRange = null
    if (typeof this.ev.beforeZoom === 'function') {
      newRange = this.ev.beforeZoom(this, { xaxis, yaxis })
    }

    return newRange
  }

  toggleMenu() {
    window.setTimeout(() => {
      if (this.elMenu?.classList.contains('apexcharts-menu-open')) {
        this._closeMenu()
      } else {
        this.elMenu?.classList.add('apexcharts-menu-open')
        this.elMenuIcon?.setAttribute('aria-expanded', 'true')
      }
    }, 0)
  }

  _closeMenu() {
    this.elMenu?.classList.remove('apexcharts-menu-open')
    this.elMenuIcon?.setAttribute('aria-expanded', 'false')
  }

  /**
   * @param {string} type
   */
  handleDownload(type) {
    const w = this.w
    const exprt = new Exports(this.w, this.ctx)
    switch (type) {
      case 'svg':
        exprt.exportToSVG()
        break
      case 'png':
        exprt.exportToPng()
        break
      case 'csv':
        exprt.exportToCSV({
          series: w.config.series,
          columnDelimiter: w.config.chart.toolbar.export.csv.columnDelimiter,
        })
        break
    }
  }

  /**
   * Take down whatever the zoom alone put on screen.
   *
   * By hand, and not left to the next render, because of the order in
   * {@link Toolbar#handleZoomReset}: the re-render happens while
   * `interact.zoomed` is still true, so the control is drawn once more and then
   * the flag clears with no further pass to notice. Reversing that order would
   * change what every listener downstream of the update sees, which is a much
   * larger promise than this control is worth.
   */
  clearZoomAffordance() {
    const drawn = this._drawnForZoom
    this._drawnForZoom = null
    if (!drawn || !this.elZoomReset) return
    const parent = this.elZoomReset.parentNode
    // 'wrap' means the whole toolbar existed only to carry this one control, so
    // the page goes back to the bare canvas it asked for.
    const gone = drawn === 'wrap' ? parent : this.elZoomReset
    if (gone && gone.parentNode) gone.parentNode.removeChild(gone)
  }

  handleZoomReset() {
    const charts = this.ctx.getSyncedCharts()

    /**
     * @param {Record<string, any>} ch
     */
    charts.forEach((ch) => {
      const w = ch.w

      // if user is hitting zoom reset button without zooming in first, then we should not fire zoom reset event
      if (!w.interact.zoomed) return

      // forget lastXAxis min/max as reset button isn't resetting the x-axis completely if zoomX is called before
      w.globals.lastXAxis.min = w.globals.initialConfig.xaxis.min
      w.globals.lastXAxis.max = w.globals.initialConfig.xaxis.max

      ch.updateHelpers.revertDefaultAxisMinMax()

      if (typeof w.config.chart.events.beforeResetZoom === 'function') {
        // here, user get an option to control xaxis and yaxis when resetZoom is called
        // at this point, whatever is returned from w.config.chart.events.beforeResetZoom
        // is set as the new xaxis/yaxis min/max
        const resetZoomRange = w.config.chart.events.beforeResetZoom(ch, w)

        if (resetZoomRange) {
          ch.updateHelpers.revertDefaultAxisMinMax(resetZoomRange)
        }
      }

      if (typeof w.config.chart.events.zoomed === 'function') {
        ch.ctx.toolbar.zoomCallback({
          min: w.config.xaxis.min,
          max: w.config.xaxis.max,
        })
      }

      // if user has some series collapsed before hitting zoom reset button,
      // those series should stay collapsed
      const series = ch.ctx.series.emptyCollapsedSeries(
        Utils.clone(w.globals.initialSeries),
      )

      ch.updateHelpers._updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled,
      )

      w.interact.zoomed = false
      ch.ctx.toolbar?.clearZoomAffordance()
    })
  }

  destroy() {
    this.elZoom = null
    this.elZoomIn = null
    this.elZoomOut = null
    this.elPan = null
    this.elSelection = null
    this.elMeasure = null
    this.elZoomReset = null
    this.elMenuIcon = null
  }
}
