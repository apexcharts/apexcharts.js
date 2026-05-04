// @ts-check
import Config from './settings/Config'
import Utils from '../utils/Utils'
import CoreUtils from './CoreUtils'
import { Environment } from '../utils/Environment.js'

/**
 * ApexCharts Responsive Class to override options for different screen sizes.
 *
 * @module Responsive
 **/

export default class Responsive {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w
    /** @type {number | null} tracks which breakpoint is currently active (null = none) */
    this._activeBreakpoint = null
  }

  // the opts parameter if not null has to be set overriding everything
  // as the opts is set by user externally
  /**
   * @param {object} opts
   */
  checkResponsiveConfig(opts) {
    const w = this.w
    const cnf = w.config

    // check if responsive config exists
    if (cnf.responsive.length === 0) return

    const res = cnf.responsive.slice()
    res
      .sort(
        (
          /** @type {{ breakpoint: number }} */ a,
          /** @type {{ breakpoint: number }} */ b,
        ) =>
          a.breakpoint > b.breakpoint
            ? 1
            : b.breakpoint > a.breakpoint
              ? -1
              : 0,
      )
      .reverse()

    const config = new Config({})

    const iterateResponsiveOptions = (newOptions = {}) => {
      const largestBreakpoint = res[0].breakpoint
      const width = Environment.isBrowser()
        ? window.innerWidth > 0
          ? window.innerWidth
          : screen.width
        : 0

      if (width > largestBreakpoint) {
        // Above all breakpoints — only reset config if we were previously
        // inside a responsive breakpoint (fixes #2056: chart breaks on
        // updateSeries when viewport is above the largest breakpoint)
        if (this._activeBreakpoint !== null) {
          if (!w.globals.initialConfig) return
          const initialConfig = Utils.clone(w.globals.initialConfig)
          initialConfig.series = Utils.clone(w.config.series)
          const options = CoreUtils.extendArrayProps(config, initialConfig, w)
          // Merge onto a fresh object so w.config is not used as a base
          newOptions = Utils.extend(options, newOptions)
          this.overrideResponsiveOptions(newOptions)
          this._activeBreakpoint = null
        }
      } else {
        for (let i = 0; i < res.length; i++) {
          if (width < res[i].breakpoint) {
            newOptions = CoreUtils.extendArrayProps(config, res[i].options, w)
            newOptions = Utils.extend(w.config, newOptions)
            // Utils.extend does not deep-merge arrays, so a responsive `yaxis` array
            // silently replaces the entire base `yaxis`, losing base settings not
            // re-declared in the responsive options.  Re-merge each yaxis entry with
            // the corresponding base entry so only explicitly overridden keys change.
            if (Array.isArray(w.config.yaxis) && res[i].options?.yaxis) {
              const responsiveYaxis = Array.isArray(res[i].options.yaxis)
                ? res[i].options.yaxis
                : [res[i].options.yaxis]
              newOptions = {
                ...newOptions,
                yaxis: w.config.yaxis.map((baseAxis, idx) =>
                  Utils.extend(baseAxis, responsiveYaxis[idx] || {}),
                ),
              }
            }
            this.overrideResponsiveOptions(newOptions)
            this._activeBreakpoint = res[i].breakpoint
          }
        }
      }
    }

    if (opts) {
      let options = CoreUtils.extendArrayProps(config, opts, w)
      options = Utils.extend(w.config, options)
      options = Utils.extend(options, opts)
      iterateResponsiveOptions(options)
    } else {
      iterateResponsiveOptions({})
    }
  }

  /**
   * @param {Record<string, any>} newOptions
   */
  overrideResponsiveOptions(newOptions) {
    const newConfig = new Config(newOptions).init({ responsiveOverride: true })
    this.w.config = /** @type {any} */ (newConfig)
  }
}
