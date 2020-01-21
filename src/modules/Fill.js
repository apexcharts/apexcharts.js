import Graphics from './Graphics'
import Utils from '../utils/Utils'

/**
 * ApexCharts Fill Class for setting fill options of the paths.
 *
 * @module Fill
 **/

class Fill {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.opts = null
    this.seriesIndex = 0
  }

  clippedImgArea(params) {
    let w = this.w
    let cnf = w.config

    let svgW = parseInt(w.globals.gridWidth, 10)
    let svgH = parseInt(w.globals.gridHeight, 10)

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

    let elPattern = document.createElementNS(w.globals.SVGNS, 'pattern')

    Graphics.setAttrs(elPattern, {
      id: params.patternID,
      patternUnits: params.patternUnits
        ? params.patternUnits
        : 'userSpaceOnUse',
      width: imgWidth + 'px',
      height: imgHeight + 'px'
    })

    let elImage = document.createElementNS(w.globals.SVGNS, 'image')
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

  getSeriesIndex(opts) {
    const w = this.w

    if (
      ((w.config.chart.type === 'bar' || w.config.chart.type === 'rangeBar') &&
        w.config.plotOptions.bar.distributed) ||
      w.config.chart.type === 'heatmap'
    ) {
      this.seriesIndex = opts.seriesNumber
    } else {
      this.seriesIndex = opts.seriesNumber % w.globals.series.length
    }

    return this.seriesIndex
  }

  fillPath(opts) {
    let w = this.w
    this.opts = opts

    let cnf = this.w.config
    let pathFill

    let patternFill, gradientFill

    this.seriesIndex = this.getSeriesIndex(opts)

    let fillColors = this.getFillColors()
    let fillColor = fillColors[this.seriesIndex]

    if (typeof fillColor === 'function') {
      fillColor = fillColor({
        seriesIndex: this.seriesIndex,
        dataPointIndex: opts.dataPointIndex,
        value: opts.value,
        w
      })
    }
    let fillType = this.getFillType(this.seriesIndex)
    let fillOpacity = Array.isArray(cnf.fill.opacity)
      ? cnf.fill.opacity[this.seriesIndex]
      : cnf.fill.opacity

    let defaultColor = fillColor

    if (opts.color) {
      fillColor = opts.color
    }

    if (fillColor.indexOf('rgb') === -1) {
      defaultColor = Utils.hexToRgba(fillColor, fillOpacity)
    } else {
      if (fillColor.indexOf('rgba') > -1) {
        fillOpacity = 0 + '.' + Utils.getOpacityFromRGBA(fillColor)
      }
    }
    if (opts.opacity) fillOpacity = opts.opacity

    if (fillType === 'pattern') {
      patternFill = this.handlePatternFill(
        patternFill,
        fillColor,
        fillOpacity,
        defaultColor
      )
    }

    if (fillType === 'gradient') {
      gradientFill = this.handleGradientFill(
        gradientFill,
        fillColor,
        fillOpacity,
        this.seriesIndex
      )
    }

    if (fillType === 'image') {
      let imgSrc = cnf.fill.image.src

      let patternID = opts.patternID ? opts.patternID : ''
      this.clippedImgArea({
        opacity: fillOpacity,
        image: Array.isArray(imgSrc)
          ? opts.seriesNumber < imgSrc.length
            ? imgSrc[opts.seriesNumber]
            : imgSrc[0]
          : imgSrc,
        width: opts.width ? opts.width : undefined,
        height: opts.height ? opts.height : undefined,
        patternUnits: opts.patternUnits,
        patternID: `pattern${w.globals.cuid}${opts.seriesNumber +
          1}${patternID}`
      })
      pathFill = `url(#pattern${w.globals.cuid}${opts.seriesNumber +
        1}${patternID})`
    } else if (fillType === 'gradient') {
      pathFill = gradientFill
    } else if (fillType === 'pattern') {
      pathFill = patternFill
    } else {
      pathFill = defaultColor
    }

    // override pattern/gradient if opts.solid is true
    if (opts.solid) {
      pathFill = defaultColor
    }

    return pathFill
  }

  getFillType(seriesIndex) {
    const w = this.w

    if (Array.isArray(w.config.fill.type)) {
      return w.config.fill.type[seriesIndex]
    } else {
      return w.config.fill.type
    }
  }

  getFillColors() {
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

  handlePatternFill(patternFill, fillColor, fillOpacity, defaultColor) {
    const cnf = this.w.config
    const opts = this.opts
    let graphics = new Graphics(this.ctx)

    let patternStrokeWidth =
      cnf.fill.pattern.strokeWidth === undefined
        ? Array.isArray(cnf.stroke.width)
          ? cnf.stroke.width[this.seriesIndex]
          : cnf.stroke.width
        : Array.isArray(cnf.fill.pattern.strokeWidth)
        ? cnf.fill.pattern.strokeWidth[this.seriesIndex]
        : cnf.fill.pattern.strokeWidth
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

  handleGradientFill(gradientFill, fillColor, fillOpacity, i) {
    const cnf = this.w.config
    const opts = this.opts
    let graphics = new Graphics(this.ctx)
    let utils = new Utils()

    let type = cnf.fill.gradient.type
    let gradientFrom, gradientTo
    let opacityFrom =
      cnf.fill.gradient.opacityFrom === undefined
        ? fillOpacity
        : Array.isArray(cnf.fill.gradient.opacityFrom)
        ? cnf.fill.gradient.opacityFrom[i]
        : cnf.fill.gradient.opacityFrom
    let opacityTo =
      cnf.fill.gradient.opacityTo === undefined
        ? fillOpacity
        : Array.isArray(cnf.fill.gradient.opacityTo)
        ? cnf.fill.gradient.opacityTo[i]
        : cnf.fill.gradient.opacityTo

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
      cnf.fill.gradient.stops,
      cnf.fill.gradient.colorStops,
      i
    )

    return gradientFill
  }
}

export default Fill
