import Graphics from './Graphics'
import Utils from '../utils/Utils'

/**
 * ApexCharts Fill Class for setting fill options of the paths.
 *
 * @module Fill
 **/

class Fill {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.opts = null
    this.seriesIndex = 0
  }

  clippedImgArea (params) {
    let w = this.w
    let cnf = w.config

    let svgW = parseInt(w.globals.gridWidth)
    let svgH = parseInt(w.globals.gridHeight)

    let size = svgW > svgH ? svgW : svgH

    let fillImg = params.image

    let imgWidth = 0
    let imgHeight = 0
    if (
      typeof params.width === 'undefined' &&
      typeof params.height === 'undefined'
    ) {
      if (
        cnf.fill.image.width !== undefined &&
        cnf.fill.image.height !== undefined
      ) {
        imgWidth = cnf.fill.image.width + 1
        imgHeight = cnf.fill.image.height
      } else {
        imgWidth = size + 1
        imgHeight = size
      }
    } else {
      imgWidth = params.width
      imgHeight = params.height
    }

    let elPattern = document.createElementNS(w.globals.svgNS, 'pattern')

    Graphics.setAttrs(elPattern, {
      id: params.patternID,
      patternUnits: 'userSpaceOnUse',
      width: imgWidth + 'px',
      height: imgHeight + 'px'
    })

    let elImage = document.createElementNS(w.globals.svgNS, 'image')
    elPattern.appendChild(elImage)

    elImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', fillImg)

    Graphics.setAttrs(elImage, {
      x: 0,
      y: 0,
      preserveAspectRatio: 'none',
      width: imgWidth + 'px',
      height: imgHeight + 'px'
    })

    elImage.style.opacity = params.opacity

    w.globals.dom.elDefs.node.appendChild(elPattern)
  }

  getSeriesIndex (opts) {
    const w = this.w

    if ((w.config.chart.type === 'bar' && w.config.plotOptions.bar.distributed) || w.config.chart.type === 'heatmap') {
      this.seriesIndex = opts.seriesNumber
    } else {
      this.seriesIndex = opts.seriesNumber % w.globals.series.length
    }

    return this.seriesIndex
  }

  fillPath (elSeries, opts) {
    let w = this.w
    this.opts = opts

    let cnf = this.w.config
    let pathFill

    let patternFill, gradientFill

    this.seriesIndex = this.getSeriesIndex(opts)

    let fillColors = this.getFillColors()
    let fillColor = fillColors[this.seriesIndex]
    let fillOpacity = Array.isArray(cnf.fill.opacity) ? cnf.fill.opacity[this.seriesIndex] : cnf.fill.opacity

    let defaultColor = fillColor

    if (fillColor.indexOf('rgb') === -1) {
      defaultColor = Utils.hexToRgba(
        fillColor,
        fillOpacity
      )
    } else {
      if (fillColor.indexOf('rgba') > -1) {
        fillOpacity = 0 + '.' + Utils.getOpacityFromRGBA(fillColors[this.seriesIndex])
      }
    }

    if (cnf.fill.type === 'pattern') {
      patternFill = this.handlePatternFill(patternFill, fillColor, fillOpacity, defaultColor)
    }

    if (cnf.fill.type === 'gradient') {
      gradientFill = this.handleGradientFill(gradientFill, fillColor, fillOpacity, this.seriesIndex)
    }

    if (cnf.fill.image.src.length > 0 && cnf.fill.type === 'image') {
      if (opts.seriesNumber < cnf.fill.image.src.length) {
        this.clippedImgArea({
          opacity: fillOpacity,
          image: cnf.fill.image.src[opts.seriesNumber],
          patternID: `pattern${w.globals.cuid}${opts.seriesNumber + 1}`
        })
        pathFill = `url(#pattern${w.globals.cuid}${opts.seriesNumber + 1})`
      } else {
        pathFill = defaultColor
      }
    } else if (cnf.fill.type === 'gradient') {
      pathFill = gradientFill
    } else if (cnf.fill.type === 'pattern') {
      pathFill = patternFill
    } else {
      pathFill = defaultColor
    }

    // override pattern/gradient if opts.solid is true
    if (opts.solid) {
      pathFill = defaultColor
    }

    if (!pathFill && opts.color) {
      pathFill = opts.color
    }

    return pathFill
  }

  getFillColors () {
    const w = this.w
    const cnf = w.config
    const opts = this.opts

    let fillColors = []

    if (w.globals.comboCharts) {
      if (w.config.series[this.seriesIndex].type === 'line') {
        if (w.globals.stroke.colors instanceof Array) {
          fillColors = w.globals.stroke.colors
        } else {
          fillColors.push(w.globals.stroke.colors)
        }
      } else {
        if (w.globals.fill.colors instanceof Array) {
          fillColors = w.globals.fill.colors
        } else {
          fillColors.push(w.globals.fill.colors)
        }
      }
    } else {
      if (cnf.chart.type === 'line') {
        if (w.globals.stroke.colors instanceof Array) { fillColors = w.globals.stroke.colors } else {
          fillColors.push(w.globals.stroke.colors)
        }
      } else {
        if (w.globals.fill.colors instanceof Array) {
          fillColors = w.globals.fill.colors
        } else {
          fillColors.push(w.globals.fill.colors)
        }
      }
    }

    // colors passed in arguments
    if (typeof opts.fillColors !== 'undefined') {
      fillColors = []
      if (opts.fillColors instanceof Array) {
        fillColors = opts.fillColors.slice()
      } else {
        fillColors.push(opts.fillColors)
      }
    }

    return fillColors
  }

  handlePatternFill (patternFill, fillColor, fillOpacity, defaultColor) {
    const cnf = this.w.config
    const opts = this.opts
    let graphics = new Graphics(this.ctx)

    let patternStrokeWidth = cnf.fill.pattern.strokeWidth === undefined
      ? Array.isArray(cnf.stroke.width) ? cnf.stroke.width[this.seriesIndex] : cnf.stroke.width
      : Array.isArray(cnf.fill.pattern.strokeWidth) ? cnf.fill.pattern.strokeWidth[this.seriesIndex] : cnf.fill.pattern.strokeWidth
    let patternLineColor = fillColor

    if (cnf.fill.pattern.style instanceof Array) {
      if (typeof cnf.fill.pattern.style[opts.seriesNumber] !== 'undefined') {
        let pf = graphics.drawPattern(
          cnf.fill.pattern.style[opts.seriesNumber],
          cnf.fill.pattern.width,
          cnf.fill.pattern.height,
          patternLineColor,
          patternStrokeWidth,
          fillOpacity
        )
        patternFill = pf
      } else {
        patternFill = defaultColor
      }
    } else {
      patternFill = graphics.drawPattern(
        cnf.fill.pattern.style,
        cnf.fill.pattern.width,
        cnf.fill.pattern.height,
        patternLineColor,
        patternStrokeWidth,
        fillOpacity
      )
    }
    return patternFill
  }

  handleGradientFill (gradientFill, fillColor, fillOpacity, i) {
    const cnf = this.w.config
    const opts = this.opts
    let graphics = new Graphics(this.ctx)
    let utils = new Utils()

    let type = cnf.fill.gradient.type
    let gradientFrom, gradientTo
    let opacityFrom = cnf.fill.gradient.opacityFrom === undefined
      ? fillOpacity
      : Array.isArray(cnf.fill.gradient.opacityFrom) ? cnf.fill.gradient.opacityFrom[i] : cnf.fill.gradient.opacityFrom
    let opacityTo = cnf.fill.gradient.opacityTo === undefined
      ? fillOpacity
      : Array.isArray(cnf.fill.gradient.opacityTo) ? cnf.fill.gradient.opacityTo[i] : cnf.fill.gradient.opacityTo

    gradientFrom = fillColor
    if (
      cnf.fill.gradient.gradientToColors === undefined ||
        cnf.fill.gradient.gradientToColors.length === 0
    ) {
      if (cnf.fill.gradient.shade === 'dark') {
        gradientTo = utils.shadeColor(
          parseFloat(cnf.fill.gradient.shadeIntensity) * -1,
          fillColor
        )
      } else {
        gradientTo = utils.shadeColor(
          parseFloat(cnf.fill.gradient.shadeIntensity),
          fillColor
        )
      }
    } else {
      gradientTo = cnf.fill.gradient.gradientToColors[opts.seriesNumber]
    }

    if (cnf.fill.gradient.inverseColors) {
      let t = gradientFrom
      gradientFrom = gradientTo
      gradientTo = t
    }

    gradientFill = graphics.drawGradient(
      type,
      gradientFrom,
      gradientTo,
      opacityFrom,
      opacityTo,
      opts.size,
      cnf.fill.gradient.stops
    )

    return gradientFill
  }
}

export default Fill
