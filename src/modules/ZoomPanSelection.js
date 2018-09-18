import Graphics from './Graphics'
import Utils from './../utils/Utils'
import Toolbar from './Toolbar'

/**
 * ApexCharts Zoom Class for handling zooming and panning on axes based charts.
 *
 * @module ZoomPanSelection
 **/

class ZoomPanSelection extends Toolbar {
  constructor (ctx) {
    super(ctx)

    this.ctx = ctx
    this.w = ctx.w

    this.dragged = false

    this.clientX = 0
    this.clientY = 0
    this.startX = 0
    this.endX = 0
    this.dragX = 0
    this.startY = 0
    this.endY = 0
    this.dragY = 0

    this.toolbar = new Toolbar(this.ctx)

    this.zoomResetIcon = null
  }

  init ({
    xyRatios
  }) {
    let w = this.w
    let self = this

    this.xyRatios = xyRatios

    this.gridRect = null
    const graphics = new Graphics(this.ctx)

    this.zoomRect = graphics.drawRect(0, 0, 0, 0)
    this.selectionRect = graphics.drawRect(0, 0, 0, 0)

    this.zoomRect.node.classList.add('apexcharts-zoom-rect')
    this.selectionRect.node.classList.add('apexcharts-selection-rect')
    w.globals.dom.elGraphical.add(this.zoomRect)
    w.globals.dom.elGraphical.add(this.selectionRect)

    if (w.config.chart.selection.type === 'x') {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        minY: 0,
        maxX: w.globals.gridWidth,
        maxY: w.globals.gridHeight
      }).on('dragmove', this.selectionDragging.bind(this, 'dragging'))
    } else if (w.config.chart.selection.type === 'y') {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        maxX: w.globals.gridWidth
      }).on('dragmove', this.selectionDragging.bind(this, 'dragging'))
    } else {
      this.slDraggableRect = this.selectionRect.draggable().on('dragmove', this.selectionDragging.bind(this, 'dragging'))
    }
    this.preselectedSelection()

    let hoverArea = w.globals.dom.baseEl.querySelector(w.globals.chartClass)
    hoverArea.classList.add('zoomable')

    if (self.gridRect === null) {
      self.gridRect = w.globals.dom.baseEl.querySelector(
        '.apexcharts-grid'
      )
    }

    let eventList = [
      'mousedown',
      'mousemove',
      'touchstart',
      'touchmove',
      'mouseup',
      'touchend'
    ]
    for (let event of eventList) {
      hoverArea.addEventListener(
        event,
        self.svgMouseEvents.bind(self, xyRatios),
        false
      )
    }
  }

  svgMouseEvents (xyRatios, e) {
    let w = this.w
    let me = this

    let zoomtype = w.globals.zoomEnabled ? w.config.chart.zoom.type : w.config.chart.selection.type

    if (e.shiftKey) {
      this.shiftWasPressed = true
      this.toolbar.enablePanning()
    } else {
      if (this.shiftWasPressed) {
        this.toolbar.enableZooming()
        this.shiftWasPressed = false
      }
    }

    const falsePositives = e.target.classList.contains('apexcharts-selection-rect') || e.target.parentNode.classList.contains('apexcharts-toolbar')

    if (falsePositives) return

    me.clientX = e.type === 'touchmove' || e.type === 'touchstart' ? e.touches[0].clientX : (e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX)
    me.clientY = e.type === 'touchmove' || e.type === 'touchstart' ? e.touches[0].clientY : (e.type === 'touchend' ? e.changedTouches[0].clientY : e.clientY)

    if ((e.type === 'mousedown' && e.which === 1)) {
      let gridRectDim = me.gridRect.getBoundingClientRect()

      me.startX = me.clientX - gridRectDim.left
      me.startY = me.clientY - gridRectDim.top

      me.dragged = false
      me.w.globals.mousedown = true
    }

    if ((e.type === 'mousemove' && e.which === 1) ||
      (e.type === 'touchmove')) {
      me.dragged = true

      if (w.globals.panEnabled) {
        w.globals.selection = null
        if (me.w.globals.mousedown) {
          me.panDragging({
            context: me,
            zoomtype,
            xyRatios
          })
        }
      } else {
        if ((me.w.globals.mousedown && w.globals.zoomEnabled) ||
          (me.w.globals.mousedown && w.globals.selectionEnabled)) {
          me.selection = me.selectionDrawing({
            context: me,
            zoomtype
          })
        }
      }
    }

    if ((e.type === 'mouseup') || e.type === 'touchend') {
      // we will be calling getBoundingClientRect on each mousedown/mousemove/mouseup
      let gridRectDim = me.gridRect.getBoundingClientRect()

      if (me.w.globals.mousedown) {
        // user released the drag, now do all the calculations
        me.endX = me.clientX - gridRectDim.left
        me.endY = me.clientY - gridRectDim.top
        me.dragX = Math.abs(me.endX - me.startX)
        me.dragY = Math.abs(me.endY - me.startY)

        if (w.globals.zoomEnabled || w.globals.selectionEnabled) {
          me.selectionDrawn({
            context: me,
            zoomtype
          })
        }
      }

      if (w.globals.zoomEnabled) {
        me.hideSelectionRect()
      }

      me.dragged = false
      me.w.globals.mousedown = false
    }

    this.makeSelectionRectDraggable()
  }

  makeSelectionRectDraggable () {
    const w = this.w
    const rectDim = this.selectionRect.node.getBoundingClientRect()
    if (rectDim.width > 0 && rectDim.height > 0) {
      this.slDraggableRect.selectize().resize({
        constraint: {
          minX: 0,
          minY: 0,
          maxX: w.globals.gridWidth,
          maxY: w.globals.gridHeight
        }
      }).on('resizing', this.selectionDragging.bind(this, 'resizing'))
    }
  }

  preselectedSelection () {
    const w = this.w
    const xyRatios = this.xyRatios

    if (!w.globals.zoomEnabled) {
      if (typeof w.globals.selection !== 'undefined' && w.globals.selection !== null) {
        this.drawSelectionRect(w.globals.selection)
      } else {
        if (w.config.chart.selection.xaxis.min !== undefined && w.config.chart.selection.xaxis.max !== undefined) {
          const x = (w.config.chart.selection.xaxis.min - w.globals.minX) / xyRatios.xRatio
          const width = w.globals.gridWidth - ((w.globals.maxX - w.config.chart.selection.xaxis.max) / xyRatios.xRatio) - x
          let selectionRect = {
            x,
            y: 0,
            width,
            height: w.globals.gridHeight,
            translateX: 0,
            translateY: 0,
            selectionEnabled: true
          }
          this.drawSelectionRect(selectionRect)
          this.makeSelectionRectDraggable()
          if (typeof w.config.chart.events.selection === 'function') {
            w.config.chart.events.selection(this.ctx, {
              xaxis: {
                min: w.config.chart.selection.xaxis.min,
                max: w.config.chart.selection.xaxis.max
              },
              yaxis: {}
            })
          }
        }
      }
    }
  }

  drawSelectionRect ({
    x,
    y,
    width,
    height,
    translateX,
    translateY
  }) {
    const w = this.w
    if (this.dragged || w.globals.selection !== null) {
      let scalingAttrs = {
        transform: 'translate(' + translateX + ', ' + translateY + ')'
      }

      // change styles based on zoom or selection
      // zoom is Enabled and user has dragged, so draw blue rect
      if (w.globals.zoomEnabled && this.dragged) {
        this.zoomRect.attr({
          x,
          y,
          width,
          height,
          fill: w.config.chart.zoom.zoomedArea.fill.color,
          'fill-opacity': w.config.chart.zoom.zoomedArea.fill.opacity,
          stroke: w.config.chart.zoom.zoomedArea.stroke.color,
          'stroke-width': w.config.chart.zoom.zoomedArea.stroke.width,
          'stroke-opacity': w.config.chart.zoom.zoomedArea.stroke.opacity
        })
        Graphics.setAttrs(this.zoomRect.node, scalingAttrs)
      }

      // selection is enabled
      if (w.globals.selectionEnabled) {
        this.selectionRect.attr({
          x,
          y,
          width,
          height,
          fill: w.config.chart.selection.fill.color,
          'fill-opacity': w.config.chart.selection.fill.opacity,
          stroke: w.config.chart.selection.stroke.color,
          'stroke-width': w.config.chart.selection.stroke.width,
          'stroke-dasharray': w.config.chart.selection.stroke.dashArray,
          'stroke-opacity': w.config.chart.selection.stroke.opacity
        })

        Graphics.setAttrs(this.selectionRect.node, scalingAttrs)
      }
    }
  }

  hideSelectionRect () {
    this.selectionRect.attr({
      x: 0,
      y: 0,
      width: 0,
      height: 0
    })
  }

  selectionDrawing ({
    context,
    zoomtype
  }) {
    const w = this.w
    let me = context
    let gridRectDim = me.gridRect.getBoundingClientRect()

    let startX = me.startX - 1
    let startY = me.startY

    let selectionWidth = me.clientX - gridRectDim.left - startX - 1
    let selectionHeight = me.clientY - gridRectDim.top - startY
    let translateX = 0
    let translateY = 0

    let selectionRect = {}

    // inverse selection X
    if (startX > me.clientX - gridRectDim.left) {
      selectionWidth = Math.abs(selectionWidth)
      translateX = -selectionWidth
    }

    // inverse selection Y
    if (startY > me.clientY - gridRectDim.top) {
      selectionHeight = Math.abs(selectionHeight)
      translateY = -selectionHeight
    }

    if (zoomtype === 'x') {
      selectionRect = {
        x: startX,
        y: 0,
        width: selectionWidth,
        height: w.globals.gridHeight,
        translateX,
        translateY: 0
      }
    } else if (zoomtype === 'y') {
      selectionRect = {
        x: 0,
        y: startY,
        width: w.globals.gridWidth,
        height: selectionHeight,
        translateX: 0,
        translateY
      }
    } else {
      selectionRect = {
        x: startX,
        y: startY,
        width: selectionWidth,
        height: selectionHeight,
        translateX,
        translateY
      }
    }

    me.drawSelectionRect(selectionRect)
    return selectionRect
  }

  selectionDragging (type, e) {
    const w = this.w
    const xyRatios = this.xyRatios

    let timerInterval = 0

    if (type === 'resizing') {
      timerInterval = 30
    }
    if (typeof w.config.chart.events.selection === 'function') {
      // a small debouncer is required when resizing to avoid freezing the chart
      clearTimeout(this.w.globals.selectionResizeTimer)
      this.w.globals.selectionResizeTimer = window.setTimeout(() => {
        const gridRectDim = this.gridRect.getBoundingClientRect()
        const selectionRect = this.selectionRect.node.getBoundingClientRect()

        const minX = w.globals.xAxisScale.niceMin + (selectionRect.left - gridRectDim.left) * xyRatios.xRatio
        const maxX = w.globals.xAxisScale.niceMin + (selectionRect.right - gridRectDim.left) * xyRatios.xRatio

        const minY = w.globals.yAxisScale[0].niceMin + (gridRectDim.bottom - selectionRect.bottom) * xyRatios.yRatio[0]
        const maxY = w.globals.yAxisScale[0].niceMax - (selectionRect.top - gridRectDim.top) * xyRatios.yRatio[0]

        w.config.chart.events.selection(this.ctx, {
          xaxis: {
            min: minX,
            max: maxX
          },
          yaxis: {
            min: minY,
            max: maxY
          }
        })
      }, timerInterval)
    }
  }

  selectionDrawn ({
    context,
    zoomtype
  }) {
    const w = this.w
    const me = context
    const xyRatios = this.xyRatios

    if (me.startX > me.endX) {
      let tempX = me.startX
      me.startX = me.endX
      me.endX = tempX
    }
    if (me.startY > me.endY) {
      let tempY = me.startY
      me.startY = me.endY
      me.endY = tempY
    }

    let xLowestValue =
      w.globals.xAxisScale.niceMin + me.startX * xyRatios.xRatio
    let xHighestValue =
      w.globals.xAxisScale.niceMin + me.endX * xyRatios.xRatio

    // TODO: we will consider the 1st y axis values here for getting highest and lowest y
    let yHighestValue = []
    let yLowestValue = []

    w.config.yaxis.map((yaxe, index) => {
      yHighestValue.push(Math.floor(
        w.globals.yAxisScale[index].niceMax - xyRatios.yRatio[index] * me.startY
      ))
      yLowestValue.push(Math.floor(
        w.globals.yAxisScale[index].niceMax - xyRatios.yRatio[index] * me.endY
      ))
    })

    if (
      me.dragged &&
      (me.dragX > 10 || me.dragY > 10) &&
      xLowestValue !== xHighestValue
    ) {
      if (w.globals.zoomEnabled) {
        if (typeof w.config.chart.events.beforeZoom === 'function' && !w.config.chart.events.beforeZoom()) {
          return
        }

        w.globals.zoomed = true
        let yaxis = w.config.yaxis

        if (zoomtype === 'xy' || zoomtype === 'y') {
          yaxis.map((yaxe, index) => {
            yaxis[index].min = yLowestValue[index]
            yaxis[index].max = yHighestValue[index]
          })
        }

        if (zoomtype === 'x') {
          me.ctx.updateOptionsInternal({
            xaxis: {
              min: xLowestValue,
              max: xHighestValue
            }
          },
          false,
          true
          )
        } else if (zoomtype === 'y') {
          me.ctx.updateOptionsInternal({
            yaxis: yaxis
          },
          false,
          true
          )
        } else {
          me.ctx.updateOptionsInternal({
            xaxis: {
              min: xLowestValue,
              max: xHighestValue
            },
            yaxis
          },
          false,
          true
          )
        }

        if (typeof w.config.chart.events.zoomed === 'function') {
          this.toolbar.zoomCallback({
            min: xLowestValue, max: xHighestValue
          },
          yaxis)
        }
      } else if (w.globals.selectionEnabled) {
        let yaxis = null; let xaxis = null
        xaxis = {
          min: xLowestValue,
          max: xHighestValue
        }
        if (zoomtype === 'xy' || zoomtype === 'y') {
          yaxis = Utils.clone(w.config.yaxis)
          yaxis.map((yaxe, index) => {
            yaxis[index].min = yLowestValue[index]
            yaxis[index].max = yHighestValue[index]
          })
        }

        w.globals.selection = me.selection
        if (typeof w.config.chart.events.selection === 'function') {
          w.config.chart.events.selection(me.ctx, {
            xaxis,
            yaxis
          })
        }
      }
    }
  }

  panDragging ({
    context,
    zoomtype
  }) {
    const w = this.w
    let me = context

    let moveDirection

    // check to make sure there is data to compare against
    if (typeof (w.globals.lastClientPosition.x) !== 'undefined') {
      // get the change from last position to this position
      const deltaX = w.globals.lastClientPosition.x - me.clientX
      const deltaY = w.globals.lastClientPosition.y - me.clientY

      // check which direction had the highest amplitude and then figure out direction by checking if the value is greater or less than zero
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
        moveDirection = 'left'
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
        moveDirection = 'right'
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
        moveDirection = 'up'
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
        moveDirection = 'down'
      }
    }

    // set the new last position to the current for next time (to get the position of drag)
    w.globals.lastClientPosition = {
      x: me.clientX,
      y: me.clientY
    }

    let xLowestValue = w.globals.minX
    let xHighestValue = w.globals.maxX

    this.panScrolled(moveDirection, xLowestValue, xHighestValue)
  }

  panScrolled (moveDirection, xLowestValue, xHighestValue) {
    const w = this.w
    const xyRatios = this.xyRatios

    if (moveDirection === 'left') {
      xLowestValue = w.globals.minX + ((w.globals.gridWidth / 15) * xyRatios.xRatio)
      xHighestValue = w.globals.maxX + ((w.globals.gridWidth / 15) * xyRatios.xRatio)
    } else if (moveDirection === 'right') {
      xLowestValue = w.globals.minX - ((w.globals.gridWidth / 15) * xyRatios.xRatio)
      xHighestValue = w.globals.maxX - ((w.globals.gridWidth / 15) * xyRatios.xRatio)
    }

    if (xLowestValue < w.globals.initialminX || xHighestValue > w.globals.initialmaxX) {
      xLowestValue = w.globals.minX
      xHighestValue = w.globals.maxX
    }

    this.ctx.updateOptionsInternal({
      xaxis: {
        min: xLowestValue,
        max: xHighestValue
      }
    },
    false,
    false
    )

    if (typeof w.config.chart.events.scrolled === 'function') {
      w.config.chart.events.scrolled(this.ctx, {
        xaxis: {
          min: xLowestValue,
          max: xHighestValue
        }
      })
    }
  }
}

module.exports = ZoomPanSelection
