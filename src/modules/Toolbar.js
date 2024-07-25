import Graphics from './Graphics'
import Exports from './Exports'
import Utils from './../utils/Utils'
import icoPan from './../assets/ico-pan-hand.svg'
import icoZoom from './../assets/ico-zoom-in.svg'
import icoReset from './../assets/ico-home.svg'
import icoZoomIn from './../assets/ico-plus.svg'
import icoZoomOut from './../assets/ico-minus.svg'
import icoSelect from './../assets/ico-select.svg'
import icoMenu from './../assets/ico-menu.svg'

/**
 * ApexCharts Toolbar Class for creating toolbar in axis based charts.
 *
 * @module Toolbar
 **/

export default class Toolbar {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.ev = this.w.config.chart.events

    this.localeValues = this.w.globals.locale.toolbar
  }

  createToolbar() {
    let w = this.w
    const elToolbarWrap = document.createElement('div')
    elToolbarWrap.setAttribute('class', 'apexcharts-toolbar')
    w.globals.dom.elWrap.appendChild(elToolbarWrap)

    this.elZoom = document.createElement('div')
    this.elZoomIn = document.createElement('div')
    this.elZoomOut = document.createElement('div')
    this.elPan = document.createElement('div')
    this.elSelection = document.createElement('div')
    this.elZoomReset = document.createElement('div')
    this.elMenuIcon = document.createElement('div')
    this.elMenu = document.createElement('div')
    this.elCustomIcons = []

    this.t = w.config.chart.toolbar.tools

    if (Array.isArray(this.t.customIcons)) {
      for (let i = 0; i < this.t.customIcons.length; i++) {
        this.elCustomIcons.push(document.createElement('div'))
      }
    }

    this.elMenuItems = []

    let toolbarControls = []

    if (this.t.zoomin && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elZoomIn,
        icon: typeof this.t.zoomin === 'string' ? this.t.zoomin : icoZoomIn,
        title: this.localeValues.zoomIn,
        class: 'apexcharts-zoom-in-icon'
      })
    }

    if (this.t.zoomout && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elZoomOut,
        icon: typeof this.t.zoomout === 'string' ? this.t.zoomout : icoZoomOut,
        title: this.localeValues.zoomOut,
        class: 'apexcharts-zoom-out-icon'
      })
    }

    if (this.t.zoom && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elZoom,
        icon: typeof this.t.zoom === 'string' ? this.t.zoom : icoZoom,
        title: this.localeValues.selectionZoom,
        class: w.globals.isTouchDevice ? 'hidden' : 'apexcharts-zoom-icon'
      })
    }

    if (this.t.selection && w.config.chart.selection.enabled) {
      toolbarControls.push({
        el: this.elSelection,
        icon:
          typeof this.t.selection === 'string' ? this.t.selection : icoSelect,
        title: this.localeValues.selection,
        class: w.globals.isTouchDevice ? 'hidden' : 'apexcharts-selection-icon'
      })
    }

    if (this.t.pan && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elPan,
        icon: typeof this.t.pan === 'string' ? this.t.pan : icoPan,
        title: this.localeValues.pan,
        class: w.globals.isTouchDevice ? 'hidden' : 'apexcharts-pan-icon'
      })
    }

    if (this.t.reset && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elZoomReset,
        icon: typeof this.t.reset === 'string' ? this.t.reset : icoReset,
        title: this.localeValues.reset,
        class: 'apexcharts-reset-zoom-icon'
      })
    }
    if (this.t.download) {
      toolbarControls.push({
        el: this.elMenuIcon,
        icon: typeof this.t.download === 'string' ? this.t.download : icoMenu,
        title: this.localeValues.menu,
        class: 'apexcharts-menu-icon'
      })
    }

    for (let i = 0; i < this.elCustomIcons.length; i++) {
      toolbarControls.push({
        el: this.elCustomIcons[i],
        icon: this.t.customIcons[i].icon,
        title: this.t.customIcons[i].title,
        index: this.t.customIcons[i].index,
        class: 'apexcharts-toolbar-custom-icon ' + this.t.customIcons[i].class
      })
    }

    toolbarControls.forEach((t, index) => {
      if (t.index) {
        Utils.moveIndexInArray(toolbarControls, index, t.index)
      }
    })

    for (let i = 0; i < toolbarControls.length; i++) {
      Graphics.setAttrs(toolbarControls[i].el, {
        class: toolbarControls[i].class,
        title: toolbarControls[i].title
      })

      toolbarControls[i].el.innerHTML = toolbarControls[i].icon
      elToolbarWrap.appendChild(toolbarControls[i].el)
    }

    elToolbarWrap.appendChild(this.elMenu)

    Graphics.setAttrs(this.elMenu, {
      class: 'apexcharts-menu'
    })

    const menuItems = [
      {
        name: 'exportSVG',
        title: this.localeValues.exportToSVG
      },
      {
        name: 'exportPNG',
        title: this.localeValues.exportToPNG
      }
    ]
    for (let i = 0; i < menuItems.length; i++) {
      this.elMenuItems.push(document.createElement('div'))
      this.elMenuItems[i].innerHTML = menuItems[i].title
      Graphics.setAttrs(this.elMenuItems[i], {
        class: `apexcharts-menu-item ${menuItems[i].name}`,
        title: menuItems[i].title
      })
      this.elMenu.appendChild(this.elMenuItems[i])
    }

    if (w.globals.zoomEnabled) {
      this.elZoom.classList.add('selected')
    } else if (w.globals.panEnabled) {
      this.elPan.classList.add('selected')
    } else if (w.globals.selectionEnabled) {
      this.elSelection.classList.add('selected')
    }

    this.addToolbarEventListeners()
  }

  addToolbarEventListeners() {
    this.elZoomReset.addEventListener('click', this.handleZoomReset.bind(this))
    this.elSelection.addEventListener('click', this.toggleSelection.bind(this))
    this.elZoom.addEventListener('click', this.toggleZooming.bind(this))
    this.elZoomIn.addEventListener('click', this.handleZoomIn.bind(this))
    this.elZoomOut.addEventListener('click', this.handleZoomOut.bind(this))
    this.elPan.addEventListener('click', this.togglePanning.bind(this))
    this.elMenuIcon.addEventListener('click', this.toggleMenu.bind(this))
    this.elMenuItems.forEach((m) => {
      if (m.classList.contains('exportSVG')) {
        m.addEventListener('click', this.downloadSVG.bind(this))
      } else if (m.classList.contains('exportPNG')) {
        m.addEventListener('click', this.downloadPNG.bind(this))
      }
    })
    for (let i = 0; i < this.t.customIcons.length; i++) {
      this.elCustomIcons[i].addEventListener(
        'click',
        this.t.customIcons[i].click
      )
    }
  }

  toggleSelection() {
    this.toggleOtherControls()
    this.w.globals.selectionEnabled = !this.w.globals.selectionEnabled

    if (!this.elSelection.classList.contains('selected')) {
      this.elSelection.classList.add('selected')
    } else {
      this.elSelection.classList.remove('selected')
    }
  }

  toggleZooming() {
    this.toggleOtherControls()
    this.w.globals.zoomEnabled = !this.w.globals.zoomEnabled

    if (!this.elZoom.classList.contains('selected')) {
      this.elZoom.classList.add('selected')
    } else {
      this.elZoom.classList.remove('selected')
    }
  }

  getToolbarIconsReference() {
    const w = this.w
    if (!this.elZoom) {
      this.elZoom = w.globals.dom.baseEl.querySelector('.apexcharts-zoom-icon')
    }
    if (!this.elPan) {
      this.elPan = w.globals.dom.baseEl.querySelector('.apexcharts-pan-icon')
    }
    if (!this.elSelection) {
      this.elSelection = w.globals.dom.baseEl.querySelector(
        '.apexcharts-selection-icon'
      )
    }
  }

  enableZooming() {
    this.toggleOtherControls()
    this.w.globals.zoomEnabled = true
    if (this.elZoom) {
      this.elZoom.classList.add('selected')
    }
    if (this.elPan) {
      this.elPan.classList.remove('selected')
    }
  }

  enablePanning() {
    this.toggleOtherControls()
    this.w.globals.panEnabled = true

    if (this.elPan) {
      this.elPan.classList.add('selected')
    }
    if (this.elZoom) {
      this.elZoom.classList.remove('selected')
    }
  }

  togglePanning() {
    this.toggleOtherControls()
    this.w.globals.panEnabled = !this.w.globals.panEnabled

    if (!this.elPan.classList.contains('selected')) {
      this.elPan.classList.add('selected')
    } else {
      this.elPan.classList.remove('selected')
    }
  }

  toggleOtherControls() {
    const w = this.w
    w.globals.panEnabled = false
    w.globals.zoomEnabled = false
    w.globals.selectionEnabled = false

    this.getToolbarIconsReference()

    if (this.elPan) {
      this.elPan.classList.remove('selected')
    }
    if (this.elSelection) {
      this.elSelection.classList.remove('selected')
    }
    if (this.elZoom) {
      this.elZoom.classList.remove('selected')
    }
  }

  handleZoomIn() {
    const w = this.w

    const centerX = (w.globals.minX + w.globals.maxX) / 2
    const newMinX = (w.globals.minX + centerX) / 2
    const newMaxX = (w.globals.maxX + centerX) / 2

    if (!w.globals.disableZoomIn) {
      this.zoomUpdateOptions(newMinX, newMaxX)
    }
  }

  handleZoomOut() {
    const w = this.w

    // avoid zooming out beyond 1000 which may result in NaN values being printed on x-axis
    if (
      w.config.xaxis.type === 'datetime' &&
      new Date(w.globals.minX).getUTCFullYear() < 1000
    ) {
      return
    }

    const centerX = (w.globals.minX + w.globals.maxX) / 2
    const newMinX = w.globals.minX - (centerX - w.globals.minX)
    const newMaxX = w.globals.maxX - (centerX - w.globals.maxX)

    if (!w.globals.disableZoomOut) {
      this.zoomUpdateOptions(newMinX, newMaxX)
    }
  }

  zoomUpdateOptions(newMinX, newMaxX) {
    let xaxis = {
      min: newMinX,
      max: newMaxX
    }

    const beforeZoomRange = this.getBeforeZoomRange(xaxis)
    if (beforeZoomRange) {
      xaxis = beforeZoomRange.xaxis
    }

    this.w.globals.zoomed = true

    this.ctx._updateOptions(
      {
        xaxis
      },
      false,
      this.w.config.chart.animations.dynamicAnimation.enabled
    )

    this.zoomCallback(xaxis)
  }

  zoomCallback(xaxis, yaxis) {
    if (typeof this.ev.zoomed === 'function') {
      this.ev.zoomed(this.ctx, { xaxis, yaxis })
    }
  }

  getBeforeZoomRange(xaxis, yaxis) {
    let newRange = null
    if (typeof this.ev.beforeZoom === 'function') {
      newRange = this.ev.beforeZoom(this, { xaxis, yaxis })
    }

    return newRange
  }
  
  getPng() {
    const downloadPNG = new Exports(this.ctx);
    return () => downloadPNG.exportToPng(this.ctx);
  }

  toggleMenu() {
    if (this.elMenu.classList.contains('open')) {
      this.elMenu.classList.remove('open')
    } else {
      this.elMenu.classList.add('open')
    }
  }

  downloadPNG() {
    const downloadPNG = new Exports(this.ctx)
    downloadPNG.exportToPng(this.ctx)
    this.toggleMenu()
  }

  downloadSVG() {
    const downloadSVG = new Exports(this.ctx)
    downloadSVG.exportToSVG()
    this.toggleMenu()
  }

  handleZoomReset(e) {
    const charts = this.ctx.getSyncedCharts()

    charts.forEach((ch) => {
      let w = ch.w

      if (
        w.globals.minX !== w.globals.initialminX &&
        w.globals.maxX !== w.globals.initialmaxX
      ) {
        ch.revertDefaultAxisMinMax()

        if (typeof w.config.chart.events.zoomed === 'function') {
          this.zoomCallback({
            min: w.config.xaxis.min,
            max: w.config.xaxis.max
          })
        }

        w.globals.zoomed = false

        ch._updateSeries(
          w.globals.initialSeries,
          w.config.chart.animations.dynamicAnimation.enabled
        )
      }
    })
  }

  destroy() {
    if (this.elZoomReset) {
      this.elZoomReset.removeEventListener(
        'click',
        this.handleZoomReset.bind(this)
      )
      this.elSelection.removeEventListener(
        'click',
        this.toggleSelection.bind(this)
      )
      this.elZoom.removeEventListener('click', this.toggleZooming.bind(this))
      this.elZoomIn.removeEventListener('click', this.handleZoomIn.bind(this))
      this.elZoomOut.removeEventListener('click', this.handleZoomOut.bind(this))
      this.elPan.removeEventListener('click', this.togglePanning.bind(this))
      this.elMenuIcon.removeEventListener('click', this.toggleMenu.bind(this))
    }

    this.elZoom = null
    this.elZoomIn = null
    this.elZoomOut = null
    this.elPan = null
    this.elSelection = null
    this.elZoomReset = null
    this.elMenuIcon = null
  }
}
