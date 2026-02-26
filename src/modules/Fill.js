import Graphics from './Graphics'
import Utils from '../utils/Utils'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import { Environment } from '../utils/Environment.js'

/**
 * ApexCharts Fill Class for setting fill options of the paths.
 *
 * @module Fill
 **/

class Fill {
  constructor(w) {
    this.w = w

    this.opts = null
    this.seriesIndex = 0
    this.patternIDs = []
  }

  clippedImgArea(params) {
    const w = this.w
    const cnf = w.config

    const svgW = parseInt(w.globals.gridWidth, 10)
    const svgH = parseInt(w.globals.gridHeight, 10)

    const size = svgW > svgH ? svgW : svgH

    const fillImg = params.image

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

    const elPattern = BrowserAPIs.createElementNS(w.globals.SVGNS, 'pattern')

    Graphics.setAttrs(elPattern, {
      id: params.patternID,
      patternUnits: params.patternUnits
        ? params.patternUnits
        : 'userSpaceOnUse',
      width: imgWidth + 'px',
      height: imgHeight + 'px',
    })

    const elImage = BrowserAPIs.createElementNS(w.globals.SVGNS, 'image')
    elPattern.appendChild(elImage)

    const SVGLib = Environment.isBrowser() ? window.SVG : global.SVG
    elImage.setAttributeNS(SVGLib.xlink, 'href', fillImg)

    Graphics.setAttrs(elImage, {
      x: 0,
      y: 0,
      preserveAspectRatio: 'none',
      width: imgWidth + 'px',
      height: imgHeight + 'px',
    })

    elImage.style.opacity = params.opacity

    w.dom.elDefs.node.appendChild(elPattern)
  }

  getSeriesIndex(opts) {
    const w = this.w
    const cType = w.config.chart.type

    if (
      ((cType === 'bar' || cType === 'rangeBar') &&
        w.config.plotOptions.bar.distributed) ||
      cType === 'heatmap' ||
      cType === 'treemap'
    ) {
      this.seriesIndex = opts.seriesNumber
    } else {
      this.seriesIndex = opts.seriesNumber % w.globals.series.length
    }

    return this.seriesIndex
  }

  computeColorStops(data, multiColorConfig) {
    const w = this.w
    let maxPositive = null
    let minNegative = null

    for (const value of data) {
      if (value >= multiColorConfig.threshold) {
        if (maxPositive === null || value > maxPositive) {
          maxPositive = value
        }
      } else {
        if (minNegative === null || value < minNegative) {
          minNegative = value
        }
      }
    }

    if (maxPositive === null) {
      maxPositive = multiColorConfig.threshold
    }
    if (minNegative === null) {
      minNegative = multiColorConfig.threshold
    }

    let totalRange =
      maxPositive -
      multiColorConfig.threshold +
      (multiColorConfig.threshold - minNegative)

    if (totalRange === 0) {
      totalRange = 1
    }

    const negativePercentage =
      ((multiColorConfig.threshold - minNegative) / totalRange) * 100

    let offset = 100 - negativePercentage

    offset = Math.max(0, Math.min(offset, 100))

    return [
      {
        offset: offset,
        color: multiColorConfig.colorAboveThreshold,
        opacity: w.config.fill.opacity,
      },
      {
        offset: 0,
        color: multiColorConfig.colorBelowThreshold,
        opacity: w.config.fill.opacity,
      },
    ]
  }

  fillPath(opts) {
    const w = this.w
    this.opts = opts

    const cnf = this.w.config
    let pathFill

    let patternFill, gradientFill

    this.seriesIndex = this.getSeriesIndex(opts)

    const drawMultiColorLine =
      cnf.plotOptions.line.colors.colorAboveThreshold &&
      cnf.plotOptions.line.colors.colorBelowThreshold

    const fillColors = this.getFillColors()
    let fillColor = fillColors[this.seriesIndex]

    //override fillcolor if user inputted color with data
    if (w.globals.seriesColors[this.seriesIndex] !== undefined) {
      fillColor = w.globals.seriesColors[this.seriesIndex]
    }

    if (typeof fillColor === 'function') {
      fillColor = fillColor({
        seriesIndex: this.seriesIndex,
        dataPointIndex: opts.dataPointIndex,
        value: opts.value,
        w,
      })
    }
    const fillType = opts.fillType
      ? opts.fillType
      : this.getFillType(this.seriesIndex)
    let fillOpacity = Array.isArray(cnf.fill.opacity)
      ? cnf.fill.opacity[this.seriesIndex]
      : cnf.fill.opacity

    // when line colors needs to be different based on values, we use gradient config to achieve this
    const useGradient = fillType === 'gradient' || drawMultiColorLine

    if (opts.color) {
      fillColor = opts.color
    }

    if (
      w.config.series[this.seriesIndex]?.data?.[opts.dataPointIndex]?.fillColor
    ) {
      fillColor =
        w.config.series[this.seriesIndex]?.data?.[opts.dataPointIndex]
          ?.fillColor
    }

    // in case a color is undefined, fallback to white color to prevent runtime error
    if (!fillColor) {
      fillColor = '#fff'
      console.warn('undefined color - ApexCharts')
    }

    if (Utils.isCSSVariable(fillColor)) {
      fillColor = Utils.getThemeColor(fillColor)
    }

    let defaultColor = fillColor

    if (fillColor.indexOf('rgb') === -1) {
      if (fillColor.indexOf('#') === -1) {
        defaultColor = fillColor
      } else if (fillColor.length < 9) {
        // if the hex contains alpha and is of 9 digit, skip the opacity
        defaultColor = Utils.hexToRgba(fillColor, fillOpacity)
      }
    } else {
      if (fillColor.indexOf('rgba') > -1) {
        fillOpacity = Utils.getOpacityFromRGBA(fillColor)
      } else {
        defaultColor = Utils.hexToRgba(Utils.rgb2hex(fillColor), fillOpacity)
      }
    }
    if (opts.opacity) fillOpacity = opts.opacity

    if (fillType === 'pattern') {
      patternFill = this.handlePatternFill({
        fillConfig: opts.fillConfig,
        patternFill,
        fillColor,
        fillOpacity,
        defaultColor,
      })
    }

    if (useGradient) {
      const colorStops = cnf.fill.gradient.colorStops ? [...cnf.fill.gradient.colorStops] : []
      let type = cnf.fill.gradient.type
      if (drawMultiColorLine) {
        colorStops[this.seriesIndex] = this.computeColorStops(
          w.globals.series[this.seriesIndex],
          cnf.plotOptions.line.colors
        )
        type = 'vertical'
      }

      gradientFill = this.handleGradientFill({
        type,
        fillConfig: opts.fillConfig,
        fillColor,
        fillOpacity,
        colorStops,
        i: this.seriesIndex,
      })
    }

    if (fillType === 'image') {
      const imgSrc = cnf.fill.image.src

      const patternID = opts.patternID ? opts.patternID : ''
      const patternKey = `pattern${w.globals.cuid}${
        opts.seriesNumber + 1
      }${patternID}`

      if (this.patternIDs.indexOf(patternKey) === -1) {
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
          patternID: patternKey,
        })

        this.patternIDs.push(patternKey)
      }

      pathFill = `url(#${patternKey})`
    } else if (useGradient) {
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
        if (Array.isArray(w.globals.stroke.colors)) {
          fillColors = w.globals.stroke.colors
        } else {
          fillColors.push(w.globals.stroke.colors)
        }
      } else {
        if (Array.isArray(w.globals.fill.colors)) {
          fillColors = w.globals.fill.colors
        } else {
          fillColors.push(w.globals.fill.colors)
        }
      }
    } else {
      if (cnf.chart.type === 'line') {
        if (Array.isArray(w.globals.stroke.colors)) {
          fillColors = w.globals.stroke.colors
        } else {
          fillColors.push(w.globals.stroke.colors)
        }
      } else {
        if (Array.isArray(w.globals.fill.colors)) {
          fillColors = w.globals.fill.colors
        } else {
          fillColors.push(w.globals.fill.colors)
        }
      }
    }

    // colors passed in arguments
    if (typeof opts.fillColors !== 'undefined') {
      fillColors = []
      if (Array.isArray(opts.fillColors)) {
        fillColors = opts.fillColors.slice()
      } else {
        fillColors.push(opts.fillColors)
      }
    }

    return fillColors
  }

  handlePatternFill({
    fillConfig,
    patternFill,
    fillColor,
    fillOpacity,
    defaultColor,
  }) {
    let fillCnf = this.w.config.fill

    if (fillConfig) {
      fillCnf = fillConfig
    }

    const opts = this.opts
    const graphics = new Graphics(this.w)

    const patternStrokeWidth = Array.isArray(fillCnf.pattern.strokeWidth)
      ? fillCnf.pattern.strokeWidth[this.seriesIndex]
      : fillCnf.pattern.strokeWidth
    const patternLineColor = fillColor

    if (Array.isArray(fillCnf.pattern.style)) {
      if (typeof fillCnf.pattern.style[opts.seriesNumber] !== 'undefined') {
        const pf = graphics.drawPattern(
          fillCnf.pattern.style[opts.seriesNumber],
          fillCnf.pattern.width,
          fillCnf.pattern.height,
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
        fillCnf.pattern.style,
        fillCnf.pattern.width,
        fillCnf.pattern.height,
        patternLineColor,
        patternStrokeWidth,
        fillOpacity
      )
    }
    return patternFill
  }

  handleGradientFill({
    type,
    fillColor,
    fillOpacity,
    fillConfig,
    colorStops,
    i,
  }) {
    let fillCnf = this.w.config.fill

    if (fillConfig) {
      fillCnf = {
        ...fillCnf,
        ...fillConfig,
      }
    }
    const opts = this.opts
    const graphics = new Graphics(this.w)
    const utils = new Utils()

    type = type || fillCnf.gradient.type
    let gradientFrom = fillColor
    let gradientTo
    let opacityFrom =
      fillCnf.gradient.opacityFrom === undefined
        ? fillOpacity
        : Array.isArray(fillCnf.gradient.opacityFrom)
        ? fillCnf.gradient.opacityFrom[i]
        : fillCnf.gradient.opacityFrom

    if (gradientFrom.indexOf('rgba') > -1) {
      opacityFrom = Utils.getOpacityFromRGBA(gradientFrom)
    }
    let opacityTo =
      fillCnf.gradient.opacityTo === undefined
        ? fillOpacity
        : Array.isArray(fillCnf.gradient.opacityTo)
        ? fillCnf.gradient.opacityTo[i]
        : fillCnf.gradient.opacityTo

    if (
      fillCnf.gradient.gradientToColors === undefined ||
      fillCnf.gradient.gradientToColors.length === 0
    ) {
      if (fillCnf.gradient.shade === 'dark') {
        gradientTo = utils.shadeColor(
          parseFloat(fillCnf.gradient.shadeIntensity) * -1,
          fillColor.indexOf('rgb') > -1 ? Utils.rgb2hex(fillColor) : fillColor
        )
      } else {
        gradientTo = utils.shadeColor(
          parseFloat(fillCnf.gradient.shadeIntensity),
          fillColor.indexOf('rgb') > -1 ? Utils.rgb2hex(fillColor) : fillColor
        )
      }
    } else {
      if (fillCnf.gradient.gradientToColors[opts.seriesNumber]) {
        const gToColor = fillCnf.gradient.gradientToColors[opts.seriesNumber]
        gradientTo = gToColor
        if (gToColor.indexOf('rgba') > -1) {
          opacityTo = Utils.getOpacityFromRGBA(gToColor)
        }
      } else {
        gradientTo = fillColor
      }
    }

    if (fillCnf.gradient.gradientFrom) {
      gradientFrom = fillCnf.gradient.gradientFrom
    }
    if (fillCnf.gradient.gradientTo) {
      gradientTo = fillCnf.gradient.gradientTo
    }

    if (fillCnf.gradient.inverseColors) {
      const t = gradientFrom
      gradientFrom = gradientTo
      gradientTo = t
    }

    if (gradientFrom.indexOf('rgb') > -1) {
      gradientFrom = Utils.rgb2hex(gradientFrom)
    }
    if (gradientTo.indexOf('rgb') > -1) {
      gradientTo = Utils.rgb2hex(gradientTo)
    }

    return graphics.drawGradient(
      type,
      gradientFrom,
      gradientTo,
      opacityFrom,
      opacityTo,
      opts.size,
      fillCnf.gradient.stops,
      colorStops,
      i
    )
  }
}

export default Fill
