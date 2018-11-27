import Config from './settings/Config'
import Utils from '../utils/Utils'
import CoreUtils from './CoreUtils'

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
    let config = new Config(newOptions)
    for (let i = 0; i < cnf.responsive.length; i++) {
      const width = (window.innerWidth > 0) ? window.innerWidth : screen.width

      if (width < cnf.responsive[i].breakpoint) {
        newOptions = CoreUtils.extendArrayProps(config, cnf.responsive[i].options)
        newOptions = Utils.extend(w.config, newOptions)

        this.overrideResponsiveOptions(newOptions)
        break
      } else {
        let options = CoreUtils.extendArrayProps(config, w.globals.initialConfig)
        newOptions = Utils.extend(w.config, options)
        this.overrideResponsiveOptions(newOptions)
      }
    }

    if (opts !== null) {
      let options = CoreUtils.extendArrayProps(config, opts)
      options = Utils.extend(w.config, options)
      this.overrideResponsiveOptions(options)
    }
  }

  overrideResponsiveOptions (newOptions) {
    let newConfig = new Config(newOptions).init()
    this.w.config = newConfig
  }
}

module.exports = Responsive
