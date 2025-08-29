import Events from '../Events'
import Localization from './Localization'
import * as Animations from '../Animations'
import Axes from '../axes/Axes'
import Config from '../settings/Config'
import CoreUtils from '../CoreUtils'
import Crosshairs from '../Crosshairs'
import Grid from '../axes/Grid'
import * as Graphics from '../Graphics'
import Exports from '../Exports'
import * as Fill from '../Fill.js'
import Options from '../settings/Options'
import Responsive from '../Responsive'
import Series from '../Series'
import Theme from '../Theme'
import Formatters from '../Formatters'
import TitleSubtitle from '../TitleSubtitle'
import Legend from '../legend/Legend'
import Toolbar from '../Toolbar'
import Dimensions from '../dimensions/Dimensions'
import ZoomPanSelection from '../ZoomPanSelection'
import Tooltip from '../tooltip/Tooltip'
import Core from '../Core'
import Data from '../Data'
import UpdateHelpers from './UpdateHelpers'

import { SVG } from '@svgdotjs/svg.js'
import '../../svgjs/svg.pathmorphing.js'
import '@svgdotjs/svg.filter.js'
import '@svgdotjs/svg.draggable.js'
import '@svgdotjs/svg.select.js'
import '@svgdotjs/svg.resize.js'

if (typeof window.SVG === 'undefined') {
  window.SVG = SVG
}

// global Apex object which user can use to override chart's defaults globally
if (typeof window.Apex === 'undefined') {
  window.Apex = {}
}

export default class InitCtxVariables {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  initModules() {
    this.ctx.publicMethods = [
      'updateOptions',
      'updateSeries',
      'appendData',
      'appendSeries',
      'isSeriesHidden',
      'highlightSeries',
      'toggleSeries',
      'showSeries',
      'hideSeries',
      'setLocale',
      'resetSeries',
      'zoomX',
      'toggleDataPointSelection',
      'dataURI',
      'exportToCSV',
      'addXaxisAnnotation',
      'addYaxisAnnotation',
      'addPointAnnotation',
      'clearAnnotations',
      'removeAnnotation',
      'paper',
      'destroy',
    ]

    this.ctx.eventList = [
      'click',
      'mousedown',
      'mousemove',
      'mouseleave',
      'touchstart',
      'touchmove',
      'touchleave',
      'mouseup',
      'touchend',
    ]
    this.ctx.animations = Animations
    this.ctx.axes = new Axes(this.ctx)
    this.ctx.core = new Core(this.ctx.el, this.ctx)
    this.ctx.config = new Config({})
    this.ctx.data = new Data(this.ctx)
    this.ctx.grid = new Grid(this.ctx)
    this.ctx.graphics = Graphics
    this.ctx.coreUtils = new CoreUtils(this.ctx)
    this.ctx.crosshairs = new Crosshairs(this.ctx)
    this.ctx.events = new Events(this.ctx)
    this.ctx.exports = new Exports(this.ctx)
    this.ctx.fill = Fill
    this.ctx.localization = new Localization(this.ctx)
    this.ctx.options = new Options()
    this.ctx.responsive = new Responsive(this.ctx)
    this.ctx.series = new Series(this.ctx)
    this.ctx.theme = new Theme(this.ctx)
    this.ctx.formatters = new Formatters(this.ctx)
    this.ctx.titleSubtitle = new TitleSubtitle(this.ctx)
    this.ctx.legend = new Legend(this.ctx)
    this.ctx.toolbar = new Toolbar(this.ctx)
    this.ctx.tooltip = new Tooltip(this.ctx)
    this.ctx.dimensions = new Dimensions(this.ctx)
    this.ctx.updateHelpers = new UpdateHelpers(this.ctx)
    this.ctx.zoomPanSelection = new ZoomPanSelection(this.ctx)
    this.ctx.w.globals.tooltip = new Tooltip(this.ctx)
  }
}
