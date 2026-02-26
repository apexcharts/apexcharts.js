import Events from '../Events'
import Localization from './Localization'
import Animations from '../Animations'
import Axes from '../axes/Axes'
import Config from '../settings/Config'
import CoreUtils from '../CoreUtils'
import Crosshairs from '../Crosshairs'
import Grid from '../axes/Grid'
import Graphics from '../Graphics'
import Exports from '../Exports'
import Fill from '../Fill.js'
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
import KeyboardNavigation from '../accessibility/KeyboardNavigation'

import { SVG } from '../../svg/index'
import { Environment } from '../../utils/Environment.js'

// set window globals in browser environment
if (Environment.isBrowser()) {
  if (typeof window.SVG === 'undefined') {
    window.SVG = SVG
  }

  // global Apex object which user can use to override chart's defaults globally
  if (typeof window.Apex === 'undefined') {
    window.Apex = {}
  }
} else {
  // SSR: use global namespace (Node.js)
  if (typeof global !== 'undefined') {
    if (typeof global.Apex === 'undefined') {
      global.Apex = {}
    }
  }
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
      'keydown',
      'keyup',
    ]

    this.ctx.animations = new Animations(this.w, this.ctx)
    this.ctx.axes = new Axes(this.w, this.ctx)
    this.ctx.core = new Core(this.ctx.el, this.w, this.ctx)
    this.ctx.config = new Config({})
    this.ctx.data = new Data(this.w, {
      resetGlobals: () => this.ctx.core.resetGlobals(),
      isMultipleY: () => this.ctx.core.isMultipleY(),
    })
    this.ctx.grid = new Grid(this.w, this.ctx)
    this.ctx.graphics = new Graphics(this.w)
    this.ctx.coreUtils = new CoreUtils(this.w)
    this.ctx.crosshairs = new Crosshairs(this.w)
    this.ctx.events = new Events(this.w, this.ctx)
    this.ctx.exports = new Exports(this.w, this.ctx)
    this.ctx.fill = new Fill(this.w)
    this.ctx.localization = new Localization(this.w)
    this.ctx.options = new Options()
    this.ctx.responsive = new Responsive(this.w)
    this.ctx.series = new Series(this.w, {
      toggleDataSeries: (...a) => this.ctx.legend.legendHelpers.toggleDataSeries(...a),
      revertDefaultAxisMinMax: () => this.ctx.updateHelpers.revertDefaultAxisMinMax(),
      updateSeries: (...a) => this.ctx.updateHelpers._updateSeries(...a),
    })
    this.ctx.theme = new Theme(this.w)
    this.ctx.formatters = new Formatters(this.w)
    this.ctx.titleSubtitle = new TitleSubtitle(this.w)
    this.ctx.legend = new Legend(this.w, this.ctx)
    this.ctx.toolbar = new Toolbar(this.w, this.ctx)
    this.ctx.tooltip = new Tooltip(this.w, this.ctx)
    this.ctx.dimensions = new Dimensions(this.w, this.ctx)
    this.ctx.updateHelpers = new UpdateHelpers(this.w, this.ctx)
    this.ctx.zoomPanSelection = new ZoomPanSelection(this.w, this.ctx)
    this.ctx.w.globals.tooltip = new Tooltip(this.w, this.ctx)
    this.ctx.keyboardNavigation = new KeyboardNavigation(this.w, this.ctx)
  }
}
