import Config from './settings/Config'
import Globals from './settings/Globals'

/**
 * ApexCharts Base Class for extending user options with pre-defined ApexCharts config.
 *
 * @module Base
 **/
export default class Base {
  constructor(opts) {
    this.opts = opts
  }

  init() {
    const config = new Config(this.opts).init({ responsiveOverride: false })
    const globals = new Globals().init(config)

    const w = {
      config,
      globals,
      dom: {}, // DOM node cache — lives here, not inside globals
    }

    // Backward-compat: w.globals.dom proxies to w.dom
    Object.defineProperty(globals, 'dom', {
      get() {
        return w.dom
      },
      set(v) {
        w.dom = v
      },
      enumerable: false,
      configurable: true,
    })

    return w
  }
}
