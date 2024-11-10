import Filter from '@svgdotjs/svg.filter.js'

import Utils from './../utils/Utils'

/**
 * ApexCharts Filters Class for setting hover/active states on the paths.
 *
 * @module Formatters
 **/
class Filters {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  // create a re-usable filter which can be appended other filter effects and applied to multiple elements
  getDefaultFilter(el, i) {
    const w = this.w
    el.unfilter(true)

    let filter = new Filter()
    filter.size('120%', '180%', '-5%', '-40%')

    if (w.config.chart.dropShadow.enabled) {
      this.dropShadow(el, w.config.chart.dropShadow, i)
    }
  }

  applyFilter(el, i, filterType) {
    const w = this.w
    el.unfilter(true)

    if (filterType === 'none') {
      this.getDefaultFilter(el, i)
      return
    }

    const shadowAttr = w.config.chart.dropShadow
    const brightnessFactor = filterType === 'lighten' ? 2 : 0.3

    el.filterWith((add) => {
      add.colorMatrix({
        type: 'matrix',
        values: `
          ${brightnessFactor} 0 0 0 0
          0 ${brightnessFactor} 0 0 0
          0 0 ${brightnessFactor} 0 0
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

  // appends dropShadow to the filter object which can be chained with other filter effects
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
  dropShadow(el, attrs, i = 0) {
    const w = this.w

    el.unfilter(true)

    if (Utils.isMsEdge() && w.config.chart.type === 'radialBar') {
      // in radialbar charts, dropshadow is clipping actual drawing in IE
      return el
    }

    if (w.config.chart.dropShadow.enabledOnSeries?.length > 0) {
      if (w.config.chart.dropShadow.enabledOnSeries?.indexOf(i) === -1) {
        return el
      }
    }

    el.filterWith((add) => {
      this.addShadow(add, i, attrs, 'SourceGraphic')
    })

    if (!attrs.noUserSpaceOnUse) {
      el.filterer().node.setAttribute('filterUnits', 'userSpaceOnUse')
    }

    // this scales the filter to a bigger size so that the dropshadow doesn't crops
    this._scaleFilterSize(el.filterer()?.node)

    return el
  }

  setSelectionFilter(el, realIndex, dataPointIndex) {
    const w = this.w
    if (typeof w.globals.selectedDataPoints[realIndex] !== 'undefined') {
      if (
        w.globals.selectedDataPoints[realIndex].indexOf(dataPointIndex) > -1
      ) {
        el.node.setAttribute('selected', true)
        let activeFilter = w.config.states.active.filter
        if (activeFilter !== 'none') {
          this.applyFilter(el, realIndex, activeFilter.type)
        }
      }
    }
  }

  _scaleFilterSize(el) {
    if (!el) return
    const setAttributes = (attrs) => {
      for (let key in attrs) {
        if (attrs.hasOwnProperty(key)) {
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
