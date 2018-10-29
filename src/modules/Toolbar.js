import Graphics from './Graphics'
import Exports from './Exports'
import icoPan from './../assets/ico-pan-hand.svg'
import icoZoom from './../assets/ico-zoom-in.svg'
import icoReset from './../assets/ico-home.svg'
import icoZoomIn from './../assets/ico-plus.svg'
import icoZoomOut from './../assets/ico-minus.svg'
import icoSelect from './../assets/ico-select.svg'
import icoCamera from './../assets/ico-camera.svg'

/**
 * ApexCharts Toolbar Class for creating toolbar in axis based charts.
 *
 * @module Toolbar
 **/

class Toolbar {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.ev = this.w.config.chart.events

    this.localeValues = this.w.globals.locale.toolbar
  }

  createToolbar () {
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
    this.elCamera = document.createElement('div')

    let toolbarControls = []
    if (w.config.chart.toolbar.tools.download) {
      toolbarControls.push({
        el: this.elCamera,
        icon: icoCamera,
        title: this.localeValues.download,
        class: 'apexcharts-download-icon'
      })
    }

    if (w.config.chart.toolbar.tools.selection) {
      toolbarControls.push({
        el: this.elSelection,
        icon: icoSelect,
        title: this.localeValues.selection,
        class: 'apexcharts-selection-icon'
      })
    }

    if (w.config.chart.toolbar.tools.zoomin && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elZoomIn,
        icon: icoZoomIn,
        title: this.localeValues.zoomIn,
        class: 'apexcharts-zoom-in-icon'
      })
    }

    if (w.config.chart.toolbar.tools.zoomout && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elZoomOut,
        icon: icoZoomOut,
        title: this.localeValues.zoomOut,
        class: 'apexcharts-zoom-out-icon'
      })
    }

    if (w.config.chart.toolbar.tools.zoom && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elZoom,
        icon: icoZoom,
        title: this.localeValues.selectionZoom,
        class: 'apexcharts-zoom-icon'
      })
    }

    if (w.config.chart.toolbar.tools.pan && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elPan,
        icon: icoPan,
        title: this.localeValues.pan,
        class: 'apexcharts-pan-icon'
      })
    }

    if (w.config.chart.toolbar.tools.reset) {
      toolbarControls.push({
        el: this.elZoomReset,
        icon: icoReset,
        title: this.localeValues.reset,
        class: 'apexcharts-reset-zoom-icon'
      })
    }

    for (let i = 0; i < toolbarControls.length; i++) {
      Graphics.setAttrs(toolbarControls[i].el, {
        class: toolbarControls[i].class,
        title: toolbarControls[i].title
      })
      toolbarControls[i].el.innerHTML = toolbarControls[i].icon
      elToolbarWrap.appendChild(toolbarControls[i].el)
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

  addToolbarEventListeners () {
    this.elZoomReset.addEventListener('click', this.handleZoomReset.bind(this))
    this.elSelection.addEventListener('click', this.toggleSelection.bind(this))
    this.elZoom.addEventListener('click', this.toggleZooming.bind(this))
    this.elZoomIn.addEventListener('click', this.handleZoomIn.bind(this))
    this.elZoomOut.addEventListener('click', this.handleZoomOut.bind(this))
    this.elPan.addEventListener('click', this.togglePanning.bind(this))
    this.elCamera.addEventListener('click', this.downloadSVG.bind(this))
  }

  toggleSelection () {
    this.toggleOtherControls()
    this.w.globals.selectionEnabled = !this.w.globals.selectionEnabled

    if (!this.elSelection.classList.contains('selected')) {
      this.elSelection.classList.add('selected')
    } else {
      this.elSelection.classList.remove('selected')
    }
  }

  toggleZooming () {
    this.toggleOtherControls()
    this.w.globals.zoomEnabled = !this.w.globals.zoomEnabled

    if (!this.elZoom.classList.contains('selected')) {
      this.elZoom.classList.add('selected')
    } else {
      this.elZoom.classList.remove('selected')
    }
  }

  getToolbarIconsReference () {
    const w = this.w
    if (!this.elZoom) {
      this.elZoom = w.globals.dom.baseEl.querySelector('.apexcharts-zoom-icon')
    }
    if (!this.elPan) {
      this.elPan = w.globals.dom.baseEl.querySelector('.apexcharts-pan-icon')
    }
    if (!this.elSelection) {
      this.elSelection = w.globals.dom.baseEl.querySelector('.apexcharts-selection-icon')
    }
  }

  enableZooming () {
    this.toggleOtherControls()
    this.w.globals.zoomEnabled = true
    if (this.elZoom) {
      this.elZoom.classList.add('selected')
    }
    if (this.elPan) {
      this.elPan.classList.remove('selected')
    }
  }

  enablePanning () {
    this.toggleOtherControls()
    this.w.globals.panEnabled = true

    if (this.elPan) {
      this.elPan.classList.add('selected')
    }
    if (this.elZoom) {
      this.elZoom.classList.remove('selected')
    }
  }

  togglePanning () {
    this.toggleOtherControls()
    this.w.globals.panEnabled = !this.w.globals.panEnabled

    if (!this.elPan.classList.contains('selected')) {
      this.elPan.classList.add('selected')
    } else {
      this.elPan.classList.remove('selected')
    }
  }

  toggleOtherControls () {
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

  handleZoomIn () {
    const w = this.w

    const centerX = (w.globals.minX + w.globals.maxX) / 2
    const newMinX = (w.globals.minX + centerX) / 2
    const newMaxX = (w.globals.maxX + centerX) / 2

    if (!w.globals.disableZoomIn) {
      this.zoomUpdateOptions(newMinX, newMaxX)
    }
  }

  handleZoomOut () {
    const w = this.w

    // avoid zooming out beyond 1000 which may result in NaN values being printed on x-axis
    if (w.config.xaxis.type === 'datetime' && new Date(w.globals.minX).getUTCFullYear() < 1000) {
      return
    }

    const centerX = (w.globals.minX + w.globals.maxX) / 2
    const newMinX = w.globals.minX - (centerX - w.globals.minX)
    const newMaxX = w.globals.maxX - (centerX - w.globals.maxX)

    if (!w.globals.disableZoomOut) {
      this.zoomUpdateOptions(newMinX, newMaxX)
    }
  }

  zoomUpdateOptions (newMinX, newMaxX) {
    let xaxis = {
      min: newMinX,
      max: newMaxX
    }

    const beforeZoomRange = this.getBeforeZoomRange(xaxis)
    if (beforeZoomRange) {
      xaxis = beforeZoomRange.xaxis
    }

    this.w.globals.zoomed = true

    this.ctx._updateOptions({
      xaxis
    },
    false,
    this.w.config.chart.animations.dynamicAnimation.enabled
    )

    this.zoomCallback({ min: newMinX, max: newMaxX })
  }

  zoomCallback (xaxis, yaxis) {
    if (typeof this.ev.zoomed === 'function') {
      this.ev.zoomed(this.ctx, { xaxis, yaxis })
    }
  }

  getBeforeZoomRange (xaxis, yaxis) {
    let newRange = null
    if (typeof this.ev.beforeZoom === 'function') {
      newRange = this.ev.beforeZoom(this, { xaxis, yaxis })
    }

    return newRange
  }

  downloadSVG () {
    const downloadSVG = new Exports(this.ctx)

    downloadSVG.exportToSVG()
  }

  handleZoomReset (e) {
    const charts = this.ctx.getSyncedCharts()

    charts.forEach((ch) => {
      let w = ch.w

      if (w.globals.minX !== w.globals.initialminX && w.globals.maxX !== w.globals.initialmaxX) {
        ch.revertDefaultAxisMinMax()

        if (typeof w.config.chart.events.zoomed === 'function') {
          this.zoomCallback({ min: w.config.xaxis.min, max: w.config.xaxis.max })
        }

        w.globals.zoomed = false

        ch._updateSeries(w.globals.initialSeries, w.config.chart.animations.dynamicAnimation.enabled)
      }
    })
  }

  destroy () {
    if (this.elZoomReset) {
      this.elZoomReset.removeEventListener('click', this.handleZoomReset.bind(this))
      this.elSelection.removeEventListener('click', this.toggleSelection.bind(this))
      this.elZoom.removeEventListener('click', this.toggleZooming.bind(this))
      this.elZoomIn.removeEventListener('click', this.handleZoomIn.bind(this))
      this.elZoomOut.removeEventListener('click', this.handleZoomOut.bind(this))
      this.elPan.removeEventListener('click', this.togglePanning.bind(this))
      this.elCamera.removeEventListener('click', this.downloadSVG.bind(this))
    }

    this.elZoom = null
    this.elZoomIn = null
    this.elZoomOut = null
    this.elPan = null
    this.elSelection = null
    this.elZoomReset = null
    this.elCamera = null
  }
}

module.exports = Toolbar
