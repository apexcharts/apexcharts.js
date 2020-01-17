import Graphics from './Graphics'
import Exports from './Exports'
import Scales from './Scales'
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
    this.selectedClass = 'apexcharts-selected'

    this.localeValues = this.w.globals.locale.toolbar
  }

  createToolbar() {
    let w = this.w

    const createDiv = () => {
      return document.createElement('div')
    }
    const elToolbarWrap = createDiv()
    elToolbarWrap.setAttribute('class', 'apexcharts-toolbar')
    w.globals.dom.elWrap.appendChild(elToolbarWrap)

    this.elZoom = createDiv()
    this.elZoomIn = createDiv()
    this.elZoomOut = createDiv()
    this.elPan = createDiv()
    this.elSelection = createDiv()
    this.elZoomReset = createDiv()
    this.elMenuIcon = createDiv()
    this.elMenu = createDiv()
    this.elCustomIcons = []

    this.t = w.config.chart.toolbar.tools

    if (Array.isArray(this.t.customIcons)) {
      for (let i = 0; i < this.t.customIcons.length; i++) {
        this.elCustomIcons.push(createDiv())
      }
    }

    let toolbarControls = []

    const appendZoomControl = (type, el, ico) => {
      const tool = type.toLowerCase()
      if (this.t[tool] && w.config.chart.zoom.enabled) {
        toolbarControls.push({
          el,
          icon: typeof this.t[tool] === 'string' ? this.t[tool] : ico,
          title: this.localeValues[type],
          class: `apexcharts-${tool}-icon`
        })
      }
    }

    appendZoomControl('zoomIn', this.elZoomIn, icoZoomIn)
    appendZoomControl('zoomOut', this.elZoomOut, icoZoomOut)

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
          title: this.localeValues[
            z === 'zoom' ? 'selectionZoom' : 'selection'
          ],
          class: w.globals.isTouchDevice
            ? 'apexcharts-element-hidden'
            : `apexcharts-${z}-icon`
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
        class: w.globals.isTouchDevice
          ? 'apexcharts-element-hidden'
          : 'apexcharts-pan-icon'
      })
    }

    appendZoomControl('reset', this.elZoomReset, icoReset)

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

    this._createHamburgerMenu(elToolbarWrap)

    if (w.globals.zoomEnabled) {
      this.elZoom.classList.add(this.selectedClass)
    } else if (w.globals.panEnabled) {
      this.elPan.classList.add(this.selectedClass)
    } else if (w.globals.selectionEnabled) {
      this.elSelection.classList.add(this.selectedClass)
    }

    this.addToolbarEventListeners()
  }

  _createHamburgerMenu(parent) {
    this.elMenuItems = []
    parent.appendChild(this.elMenu)

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
      },
      {
        name: 'exportCSV',
        title: this.localeValues.exportToCSV
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
  }

  addToolbarEventListeners() {
    this.elZoomReset.addEventListener('click', this.handleZoomReset.bind(this))
    this.elSelection.addEventListener(
      'click',
      this.toggleZoomSelection.bind(this, 'selection')
    )
    this.elZoom.addEventListener(
      'click',
      this.toggleZoomSelection.bind(this, 'zoom')
    )
    this.elZoomIn.addEventListener('click', this.handleZoomIn.bind(this))
    this.elZoomOut.addEventListener('click', this.handleZoomOut.bind(this))
    this.elPan.addEventListener('click', this.togglePanning.bind(this))
    this.elMenuIcon.addEventListener('click', this.toggleMenu.bind(this))
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
        this.t.customIcons[i].click.bind(this, this.ctx, this.ctx.w)
      )
    }
  }

  toggleZoomSelection(type) {
    this.toggleOtherControls()

    let el = type === 'selection' ? this.elSelection : this.elZoom
    let enabledType = type === 'selection' ? 'selectionEnabled' : 'zoomEnabled'

    this.w.globals[enabledType] = !this.w.globals[enabledType]

    if (!el.classList.contains(this.selectedClass)) {
      el.classList.add(this.selectedClass)
    } else {
      el.classList.remove(this.selectedClass)
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

  enableZoomPanFromToolbar(type) {
    this.toggleOtherControls()

    type === 'pan'
      ? (this.w.globals.panEnabled = true)
      : (this.w.globals.zoomEnabled = true)

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
    this.toggleOtherControls()
    this.w.globals.panEnabled = !this.w.globals.panEnabled

    if (!this.elPan.classList.contains(this.selectedClass)) {
      this.elPan.classList.add(this.selectedClass)
    } else {
      this.elPan.classList.remove(this.selectedClass)
    }
  }

  toggleOtherControls() {
    const w = this.w
    w.globals.panEnabled = false
    w.globals.zoomEnabled = false
    w.globals.selectionEnabled = false

    this.getToolbarIconsReference()

    const toggleEls = [this.elPan, this.elSelection, this.elZoom]
    toggleEls.forEach((el) => {
      if (el) {
        el.classList.remove(this.selectedClass)
      }
    })
  }

  handleZoomIn() {
    const w = this.w

    const centerX = (w.globals.minX + w.globals.maxX) / 2
    let newMinX = (w.globals.minX + centerX) / 2
    let newMaxX = (w.globals.maxX + centerX) / 2

    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX)

    if (!w.globals.disableZoomIn) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX)
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
    let newMinX = w.globals.minX - (centerX - w.globals.minX)
    let newMaxX = w.globals.maxX - (centerX - w.globals.maxX)

    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX)

    if (!w.globals.disableZoomOut) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX)
    }
  }

  _getNewMinXMaxX(newMinX, newMaxX) {
    const shouldFloor = this.w.config.xaxis.convertedCatToNumeric
    return {
      minX: shouldFloor ? Math.floor(newMinX) : newMinX,
      maxX: shouldFloor ? Math.floor(newMaxX) : newMaxX
    }
  }

  zoomUpdateOptions(newMinX, newMaxX) {
    const w = this.w

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
      max: newMaxX
    }

    const beforeZoomRange = this.getBeforeZoomRange(xaxis)
    if (beforeZoomRange) {
      xaxis = beforeZoomRange.xaxis
    }

    let options = {
      xaxis
    }

    let yaxis = Utils.clone(w.globals.initialConfig.yaxis)
    if (w.config.chart.zoom.autoScaleYaxis) {
      const scale = new Scales(this.ctx)
      yaxis = scale.autoScaleY(this.ctx, yaxis, {
        xaxis
      })
    }

    if (!w.config.chart.group) {
      // if chart in a group, prevent yaxis update here
      // fix issue #650
      options.yaxis = yaxis
    }

    this.w.globals.zoomed = true

    this.ctx.updateHelpers._updateOptions(
      options,
      false,
      this.w.config.chart.animations.dynamicAnimation.enabled
    )

    this.zoomCallback(xaxis, yaxis)
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

  toggleMenu() {
    window.setTimeout(() => {
      if (this.elMenu.classList.contains('apexcharts-menu-open')) {
        this.elMenu.classList.remove('apexcharts-menu-open')
      } else {
        this.elMenu.classList.add('apexcharts-menu-open')
      }
    }, 0)
  }

  handleDownload(type) {
    const w = this.w
    const exprt = new Exports(this.ctx)
    switch (type) {
      case 'svg':
        exprt.exportToSVG(this.ctx)
        break
      case 'png':
        exprt.exportToPng(this.ctx)
        break
      case 'csv':
        exprt.exportToCSV({ series: w.config.series })
        break
    }
  }

  handleZoomReset(e) {
    const charts = this.ctx.getSyncedCharts()

    charts.forEach((ch) => {
      let w = ch.w

      if (
        w.globals.minX !== w.globals.initialMinX ||
        w.globals.maxX !== w.globals.initialMaxX
      ) {
        ch.updateHelpers.revertDefaultAxisMinMax()

        if (typeof w.config.chart.events.zoomed === 'function') {
          this.zoomCallback({
            min: w.config.xaxis.min,
            max: w.config.xaxis.max
          })
        }

        w.globals.zoomed = false

        ch.updateHelpers._updateSeries(
          w.globals.initialSeries,
          w.config.chart.animations.dynamicAnimation.enabled
        )
      }
    })
  }

  destroy() {
    this.elZoom = null
    this.elZoomIn = null
    this.elZoomOut = null
    this.elPan = null
    this.elSelection = null
    this.elZoomReset = null
    this.elMenuIcon = null
  }
}
