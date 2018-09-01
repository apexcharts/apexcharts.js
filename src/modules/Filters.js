import Utils from './../utils/Utils'

/**
 * ApexCharts Filters Class for setting value formatters for axes as well as tooltips.
 *
 * @module Formatters
 **/
class Filters {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  // create a re-usable filter which can be appended other filter effects and applied to multiple elements
  getDefaultFilter (el) {
    const w = this.w
    el.unfilter(true)

    let filter = new window.SVG.Filter()
    filter.size('120%', '180%', '-5%', '-40%')

    if (w.config.states.normal.filter !== 'none') {
      this.applyFilter(el, w.config.states.normal.filter.type, w.config.states.normal.filter.value)
    } else {
      if (w.config.chart.dropShadow.enabled) {
        this.dropShadow(el, w.config.chart.dropShadow)
      }
    }
  }

  addNormalFilter (el) {
    const w = this.w
    if (w.config.chart.dropShadow.enabled) {
      this.dropShadow(el, w.config.chart.dropShadow)
    }
  }

  addDesaturateFilter (el) {
    const w = this.w

    el.unfilter(true)

    let filter = new window.SVG.Filter()
    filter.size('120%', '180%', '-5%', '-40%')

    el.filter((add) => {
      const shadowAttr = w.config.chart.dropShadow
      if (shadowAttr.enabled) {
        filter = this.addShadow(add, shadowAttr)
      } else {
        filter = add
      }
      filter.colorMatrix('matrix', [ 0, 0, 0, 0, 0.5,
        0, 0, 0, 0, 0.5,
        0, 0, 0, 0, 0.5,
        0, 0, 0, 1.0, 0 ]).colorMatrix('saturate', 0)
    })
    el.filterer.node.setAttribute('filterUnits', 'userSpaceOnUse')
  }

  // appends dropShadow to the filter object which can be chained with other filter effects
  addLightenFilter (el, attrs) {
    const w = this.w
    const { intensity } = attrs

    if (Utils.isFirefox()) {
      return
    }

    el.unfilter(true)

    let filter = new window.SVG.Filter()
    filter.size('120%', '180%', '-5%', '-40%')

    el.filter((add) => {
      const shadowAttr = w.config.chart.dropShadow
      if (shadowAttr.enabled) {
        filter = this.addShadow(add, shadowAttr)
      } else {
        filter = add
      }
      filter.componentTransfer({
        rgb: { type: 'linear', slope: 1.5, intercept: intensity }
      })
    })
    el.filterer.node.setAttribute('filterUnits', 'userSpaceOnUse')
  }

  // appends dropShadow to the filter object which can be chained with other filter effects
  addDarkenFilter (el, attrs) {
    const w = this.w
    const { intensity } = attrs

    if (Utils.isFirefox()) {
      return
    }

    el.unfilter(true)

    let filter = new window.SVG.Filter()
    filter.size('120%', '180%', '-5%', '-40%')

    el.filter((add) => {
      const shadowAttr = w.config.chart.dropShadow
      if (shadowAttr.enabled) {
        filter = this.addShadow(add, shadowAttr)
      } else {
        filter = add
      }
      filter.componentTransfer({
        rgb: { type: 'linear', slope: intensity }
      })
    })
    el.filterer.node.setAttribute('filterUnits', 'userSpaceOnUse')
  }

  applyFilter (el, filter, intensity = 0.5) {
    switch (filter) {
      case 'none': {
        this.addNormalFilter(el)
        break
      }
      case 'lighten': {
        this.addLightenFilter(el, {
          intensity
        })
        break
      }
      case 'darken': {
        this.addDarkenFilter(el, {
          intensity
        })
        break
      }
      case 'desaturate': {
        this.addDesaturateFilter(el)
        break
      }
      default:
        // do nothing
        break
    }
  }

  // appends dropShadow to the filter object which can be chained with other filter effects
  addShadow (add, attrs) {
    const { blur, top, left, opacity } = attrs

    let shadowBlur = add.flood('black', opacity).composite(add.sourceAlpha, 'in').offset(left, top).gaussianBlur(blur).merge(add.source)
    return add.blend(add.source, shadowBlur)
  }

  // directly adds dropShadow to the element and returns the same element.
  // the only way it is different from the addShadow() function is that addShadow is chainable to other filters, while this function discards all filters and add dropShadow
  dropShadow (el, attrs) {
    let { top, left, blur, opacity } = attrs

    el.unfilter(true)

    let filter = new window.SVG.Filter()
    filter.size('120%', '180%', '-5%', '-40%')

    el.filter(function (add) {
      let shadowBlur = null
      if (Utils.isSafari() || Utils.isFirefox() || Utils.isIE()) {
        // safari/firefox has some alternative way to use this filter
        shadowBlur = add.flood('black', opacity).composite(add.sourceAlpha, 'in').offset(left, top).gaussianBlur(blur)
      } else {
        shadowBlur = add.flood('black', opacity).composite(add.sourceAlpha, 'in').offset(left, top).gaussianBlur(blur).merge(add.source)
      }

      add.blend(add.source, shadowBlur)
    })

    el.filterer.node.setAttribute('filterUnits', 'userSpaceOnUse')

    return el
  }

  // directly adds darken filter to the element and returns the same element.
  // darken (el, intensity = 0.2) {
  //   let darkenFilter = null
  //   el.filter(function (add) {
  //     darkenFilter = add.componentTransfer({
  //       rgb: { type: 'linear', slope: intensity }
  //     })
  //   })
  //   return darkenFilter
  // }

  // directly adds lighten to the element and returns the same element.
  // lighten (el, intensity = 0.2) {
  //   el.filter(function (add) {
  //     add.componentTransfer({
  //       rgb: { type: 'linear', slope: 1.5, intercept: 0.2 }
  //     })
  //   })
  //   return el
  // }
}

export default Filters
