// @ts-check
import Utils from './../utils/Utils'

/**
 * Default blend strength for each state filter when `states.*.filter.value`
 * is not supplied. See `applyFilter` for the blend math.
 */
const DEFAULT_INTENSITY = { lighten: 0.15, darken: 0.35 }

/**
 * ApexCharts Filters Class for setting hover/active states on the paths.
 *
 * @module Formatters
 **/
class Filters {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w
  }

  // create a re-usable filter which can be appended other filter effects and applied to multiple elements
  /**
   * @param {any} el
   * @param {number} i
   */
  getDefaultFilter(el, i) {
    const w = this.w
    if (el.unfilter) {
      el.unfilter(true)
    }

    if (w.config.chart.dropShadow.enabled) {
      this.dropShadow(el, w.config.chart.dropShadow, i)
    }
  }

  /**
   * @param {any} el
   * @param {number} i
   * @param {string} filterType
   * @param {number} [intensity] Blend strength (0 to 1). Defaults per type.
   */
  applyFilter(el, i, filterType, intensity) {
    const w = this.w
    if (el.unfilter) {
      el.unfilter(true)
    }

    if (filterType === 'none') {
      this.getDefaultFilter(el, i)
      return
    }

    const shadowAttr = w.config.chart.dropShadow

    // Blend the source colour towards white (lighten) or black (darken) by
    // `t`, instead of applying a flat multiplicative gain. A gain of 2 clips
    // every channel above 0.5 straight to pure white, which is why light
    // series used to wash out entirely on hover; a convex blend can never
    // leave the [0,1] range so nothing ever blows out or crushes to black.
    //
    // The per-channel shift is proportional to the head-room: t*(1-c) for
    // lighten, t*c for darken. So an already-light colour is nudged only
    // slightly on lighten (and an already-dark one only slightly on darken):
    // the effect self-scales to the base colour, per pixel, with no need to
    // read back the series colour (this keeps gradients/patterns correct too).
    const fallback =
      filterType === 'lighten'
        ? DEFAULT_INTENSITY.lighten
        : DEFAULT_INTENSITY.darken
    const t = Math.max(
      0,
      Math.min(1, typeof intensity === 'number' ? intensity : fallback),
    )
    const diag = 1 - t
    const offset = filterType === 'lighten' ? t : 0

    if (el.filterWith) {
      /**
       * @param {any} add
       */
      el.filterWith((/** @type {any} */ add) => {
        add.colorMatrix({
          type: 'matrix',
          values: `
            ${diag} 0 0 0 ${offset}
            0 ${diag} 0 0 ${offset}
            0 0 ${diag} 0 ${offset}
            0 0 0 1 0
          `,
          in: 'SourceGraphic',
          result: 'brightness',
        })

        if (shadowAttr.enabled) {
          this.addShadow(add, i, shadowAttr, 'brightness')
        }
      })

      if (!shadowAttr.noUserSpaceOnUse) {
        el.filterer()?.node?.setAttribute('filterUnits', 'userSpaceOnUse')
      }

      // this scales the filter to a bigger size so that the dropshadow doesn't crops
      this._scaleFilterSize(el.filterer()?.node)
    }
  }

  // appends dropShadow to the filter object which can be chained with other filter effects
  /**
   * @param {any} add
   * @param {number} i
   * @param {Record<string, any>} attrs
   * @param {string} source
   */
  addShadow(add, i, attrs, source) {
    const w = this.w
    let { blur, top, left, color, opacity } = attrs
    color = Array.isArray(color) ? color[i] : color

    if (w.config.chart.dropShadow.enabledOnSeries?.length > 0) {
      if (w.config.chart.dropShadow.enabledOnSeries.indexOf(i) === -1) {
        return add
      }
    }

    add.offset({
      in: source,
      dx: left,
      dy: top,
      result: 'offset',
    })

    add.gaussianBlur({
      in: 'offset',
      stdDeviation: blur,
      result: 'blur',
    })

    add.flood({
      'flood-color': color,
      'flood-opacity': opacity,
      result: 'flood',
    })

    add.composite({
      in: 'flood',
      in2: 'blur',
      operator: 'in',
      result: 'shadow',
    })

    add.merge(['shadow', source])
  }

  // directly adds dropShadow to the element and returns the same element.
  /**
   * @param {any} el
   * @param {Record<string, any>} attrs
   */
  dropShadow(el, attrs, i = 0) {
    const w = this.w

    if (el.unfilter) {
      el.unfilter(true)
    }

    if (Utils.isMsEdge() && w.config.chart.type === 'radialBar') {
      // in radialbar charts, dropshadow is clipping actual drawing in IE
      return el
    }

    if (w.config.chart.dropShadow.enabledOnSeries?.length > 0) {
      if (w.config.chart.dropShadow.enabledOnSeries?.indexOf(i) === -1) {
        return el
      }
    }

    if (el.filterWith) {
      el.filterWith((/** @type {any} */ add) => {
        this.addShadow(add, i, attrs, 'SourceGraphic')
      })

      if (!attrs.noUserSpaceOnUse) {
        el.filterer()?.node?.setAttribute('filterUnits', 'userSpaceOnUse')
      }

      // this scales the filter to a bigger size so that the dropshadow doesn't crops
      this._scaleFilterSize(el.filterer()?.node)
    }

    return el
  }

  /**
   * @param {any} el
   * @param {number} realIndex
   * @param {number} dataPointIndex
   */
  setSelectionFilter(el, realIndex, dataPointIndex) {
    const w = this.w
    if (typeof w.interact.selectedDataPoints[realIndex] !== 'undefined') {
      if (
        w.interact.selectedDataPoints[realIndex].indexOf(dataPointIndex) > -1
      ) {
        el.node.setAttribute('selected', true)
        const activeFilter = w.config.states.active.filter
        if (activeFilter !== 'none') {
          this.applyFilter(el, realIndex, activeFilter.type, activeFilter.value)
        }
      }
    }
  }

  /**
   * @param {any} el
   */
  _scaleFilterSize(el) {
    if (!el) return
    /**
     * @param {Record<string, any>} attrs
     */
    const setAttributes = (attrs) => {
      for (const key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) {
          el.setAttribute(key, attrs[key])
        }
      }
    }
    setAttributes({
      width: '200%',
      height: '200%',
      x: '-50%',
      y: '-50%',
    })
  }
}

export default Filters
