import Config from './settings/Config'
import Utils from '../utils/Utils'

/**
 * ApexCharts Responsive Class to override options for different screen sizes.
 *
 * @module Responsive
 **/

class Responsive {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  // the opts parameter if not null has to be set overriding everything
  // as the opts is set by user externally
  checkResponsiveConfig (opts) {
    const w = this.w
    const cnf = w.config

    // check if responsive config exists
    if (cnf.responsive === undefined) return

    let newOptions = {}
    for (let i = 0; i < cnf.responsive.length; i++) {
      const width = (window.innerWidth > 0) ? window.innerWidth : screen.width

      if (width < cnf.responsive[i].breakpoint) {
        newOptions = Utils.extend(w.config, cnf.responsive[i].options)
        this.overrideResponsiveOptions(newOptions)
        break
      } else {
        newOptions = Utils.extend(w.config, w.globals.initialConfig)
        this.overrideResponsiveOptions(newOptions)
      }
    }

    if (opts !== null) {
      let options = Utils.extend(w.config, opts)
      this.overrideResponsiveOptions(options)
    }
  }

  overrideResponsiveOptions (newOptions) {
    let newConfig = new Config(newOptions).init()
    this.w.config = newConfig
  }
}

module.exports = Responsive
