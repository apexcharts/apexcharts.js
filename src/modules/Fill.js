// @ts-check
import Graphics from './Graphics'
import Utils from '../utils/Utils'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import { SVGNS } from '../svg/math'

const XLINK = 'http://www.w3.org/1999/xlink'
// CSS colour functions the hex maths cannot read (rgb() aside, which it can).
const MODERN_COLOR = /^\s*(color|color-mix|oklch|oklab|lab|lch|hwb)\(/i

/**
 * Whether `c` carries its own opacity: an rgba(), or an rgb() with a slash
 * alpha (CSS Color 4). Case-sensitive, as the checks it replaced were; a
 * relative rgb(from ...) or one holding a var() is left to the browser.
 * @param {string} c
 */
const hasOwnAlpha = (c) =>
  /^\s*rgba\s*\(/.test(c) ||
  (/^\s*rgb\(/.test(c) && c.indexOf('/') > -1 && !/\bfrom\b|var\(/.test(c))

/**
 * ApexCharts Fill Class for setting fill options of the paths.
 *
 * @module Fill
 **/

class Fill {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w

    /** @type {any} */
    this.opts = null
    this.seriesIndex = 0
  }

  /**
   * @param {Record<string, any>} params
   */
  clippedImgArea(params) {
    const w = this.w
    const cnf = w.config

    const svgW = parseInt(String(w.layout.gridWidth), 10)
    const svgH = parseInt(String(w.layout.gridHeight), 10)

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

    const elPattern = BrowserAPIs.createElementNS(SVGNS, 'pattern')

    Graphics.setAttrs(elPattern, {
      id: params.patternID,
      patternUnits: params.patternUnits
        ? params.patternUnits
        : 'userSpaceOnUse',
      width: imgWidth + 'px',
      height: imgHeight + 'px',
    })

    const elImage = BrowserAPIs.createElementNS(SVGNS, 'image')
    elPattern.appendChild(elImage)

    elImage.setAttributeNS(XLINK, 'href', fillImg)

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

  /**
   * @param {Record<string, any>} opts
   */
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
      this.seriesIndex = opts.seriesNumber % w.seriesData.series.length
    }

    return this.seriesIndex
  }

  /**
   * The y-axis window a series is plotted against. This is the space the
   * threshold gradient is measured in, since that gradient spans the plot area.
   *
   * @param {number} realIndex
   */
  getSeriesAxisRange(realIndex) {
    const w = this.w
    const yaxisIndex = w.globals.seriesYAxisReverseMap?.[realIndex] ?? 0
    const yaxis = w.config.yaxis[yaxisIndex]

    return {
      minY: Utils.isNumber(w.globals.minYArr[realIndex])
        ? w.globals.minYArr[realIndex]
        : w.globals.minY,
      maxY: Utils.isNumber(w.globals.maxYArr[realIndex])
        ? w.globals.maxYArr[realIndex]
        : w.globals.maxY,
      reversed: !!yaxis?.reversed,
      log: !!yaxis?.logarithmic,
    }
  }

  /**
   * Builds the two stops that split a series into an above- and a
   * below-threshold color.
   *
   * The stops are painted into a vertical gradient anchored to the plot area
   * (see Graphics.drawGradient's verticalUserSpace branch), so the boundary is
   * positioned over the *axis* range. Deriving it from the data range instead
   * puts the transition on the wrong value whenever the axis extends past the
   * data, which is the common case: an explicit yaxis.min/max, a nice scale, or
   * an axis shared with another series.
   *
   * @param {{ minY: number, maxY: number, reversed?: boolean, log?: boolean }} axisRange
   * @param {Record<string, any>} multiColorConfig
   */
  computeColorStops(axisRange, multiColorConfig) {
    const w = this.w
    const { threshold, colorAboveThreshold, colorBelowThreshold } =
      multiColorConfig
    const { minY, maxY } = axisRange

    const span = maxY - minY

    // A flat axis has no interior to split: the series sits wholly on one side
    // of the threshold. A logarithmic axis places the threshold the way the
    // series itself is placed, or the split lands at its linear position.
    let offset =
      span === 0
        ? threshold > maxY
          ? 0
          : 100
        : axisRange.log && minY > 0 && threshold > 0
          ? 100 - (Math.log(threshold / minY) / Math.log(maxY / minY)) * 100
          : ((maxY - threshold) / span) * 100

    // A reversed axis puts the low values at the top, mirroring the boundary.
    if (axisRange.reversed) {
      offset = 100 - offset
    }

    offset = Math.max(0, Math.min(offset, 100))

    // fill.opacity may be a per-series array (as elsewhere in fillPath); index
    // it, or the stop opacity becomes the whole array -> stop-opacity="0.9,0.8",
    // an invalid value the browser ignores (renders at full opacity).
    const fillOpacity = Array.isArray(w.config.fill.opacity)
      ? w.config.fill.opacity[this.seriesIndex]
      : w.config.fill.opacity

    const above = {
      offset,
      color: colorAboveThreshold,
      opacity: fillOpacity,
    }
    const below = {
      offset,
      color: colorBelowThreshold,
      opacity: fillOpacity,
    }

    // Both stops share an offset, giving a hard transition there: the band
    // before it takes the first color, the band after it the second. Emitting
    // them in ascending order keeps this off the SVG rule that silently clamps
    // an out-of-order offset up to its predecessor.
    return axisRange.reversed ? [below, above] : [above, below]
  }

  /**
   * @param {Record<string, any>} opts
   */
  fillPath(opts) {
    const w = this.w
    this.opts = opts

    const cnf = this.w.config
    let pathFill

    let patternFill, gradientFill

    this.seriesIndex = this.getSeriesIndex(opts)

    const seriesItem = /** @type {Record<string,any>} */ (w.config.series[this.seriesIndex])
    // The threshold split is a line option: the columns of a combo, or a bar
    // chart under a global Apex.plotOptions.line, keep their own fill.
    const drawMultiColorLine =
      cnf.plotOptions.line.colors.colorAboveThreshold &&
      cnf.plotOptions.line.colors.colorBelowThreshold &&
      /^(line|area|rangeArea)$/.test(seriesItem?.type || cnf.chart.type)

    const fillColors = this.getFillColors()
    let fillColor = fillColors[this.seriesIndex]

    //override fillcolor if user inputted color with data
    if (w.seriesData.seriesColors[this.seriesIndex] !== undefined) {
      fillColor = w.seriesData.seriesColors[this.seriesIndex]
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

    if (seriesItem?.data?.[opts.dataPointIndex]?.fillColor) {
      fillColor = seriesItem?.data?.[opts.dataPointIndex]?.fillColor
    }

    // in case a color is undefined, fallback to white color to prevent runtime error
    if (!fillColor) {
      fillColor = '#fff'
      console.warn('undefined color - ApexCharts')
    }

    if (opts.opacity !== undefined && opts.opacity !== null) fillOpacity = opts.opacity

    let defaultColor = fillColor

    if (Utils.isCSSVariable(fillColor)) {
      defaultColor = Utils.applyOpacityToColor(fillColor, fillOpacity)
    } else if (fillColor.indexOf('rgb') === -1) {
      if (fillColor.indexOf('#') === -1) {
        defaultColor = fillColor
      } else if (fillColor.length < 9) {
        defaultColor = Utils.hexToRgba(fillColor, fillOpacity)
      }
    } else if (hasOwnAlpha(fillColor)) {
      const a = Utils.getOpacityFromRGBA(fillColor)
      if (Number.isFinite(a)) fillOpacity = a
    } else {
      // Any other string naming rgb: rgb() in any syntax, or a modern colour
      // such as color(srgb ...), color-mix(in srgb ...) or rgb(from ...),
      // which the hex maths cannot read and the browser blends instead.
      const hex = Utils.rgb2hex(fillColor)
      defaultColor = hex
        ? Utils.hexToRgba(hex, fillOpacity)
        : Utils.applyOpacityToColor(fillColor, fillOpacity)
    }

    // Gradients and patterns require resolved color values (not CSS variables).
    // Resolve inside the chart, so a variable scoped to its container (or a
    // shadow root) is found. The probe forces a style recalc, so only these
    // two fills ask, once per colour per render (initGlobalVars resets it).
    const resolvedFillColor = () => {
      const resolved = /** @type {any} */ (w.globals).themeColors
      return (
        resolved[fillColor] ||
        (resolved[fillColor] = Utils.getThemeColor(fillColor, w.dom.elWrap))
      )
    }

    if (fillType === 'pattern') {
      patternFill = this.handlePatternFill({
        fillConfig: opts.fillConfig,
        patternFill,
        fillColor: resolvedFillColor(),
        defaultColor,
      })
    }

    if (useGradient) {
      const colorStops = cnf.fill.gradient.colorStops
        ? [...cnf.fill.gradient.colorStops]
        : []
      // A per-datum fill (`data[j].fill`) overrides the chart's gradient colours
      // and stops, so it has to be able to override the DIRECTION too: a
      // gradient given the right colours and the wrong axis is not the gradient
      // that was asked for. Only when the datum names one; otherwise the chart's
      // choice stands.
      let type = opts.fillConfig?.gradient?.type ?? cnf.fill.gradient.type
      if (drawMultiColorLine) {
        colorStops[this.seriesIndex] = this.computeColorStops(
          this.getSeriesAxisRange(this.seriesIndex),
          cnf.plotOptions.line.colors,
        )
        type = 'vertical'
      }

      gradientFill = this.handleGradientFill({
        type,
        fillConfig: opts.fillConfig,
        fillColor: resolvedFillColor(),
        fillOpacity,
        colorStops,
        i: this.seriesIndex,
        // Threshold stops are positioned over the axis range, so the gradient
        // has to be anchored to the plot area to match. This also keeps every
        // segment of a null-split series on one shared coordinate space.
        verticalUserSpace: drawMultiColorLine,
      })
    }

    if (fillType === 'image') {
      const imgSrc = cnf.fill.image.src

      const patternID = opts.patternID ? opts.patternID : ''
      const patternKey = `pattern${w.globals.cuid}${
        opts.seriesNumber + 1
      }${patternID}`

      // Bars build a Fill per bar, so the drawn patterns are recorded on the
      // defs: a re-render draws into fresh defs, a fast update keeps its own.
      const defs = w.dom.elDefs.node
      const drawn = defs.imagePatterns || (defs.imagePatterns = {})
      if (!drawn[patternKey]) {
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

        drawn[patternKey] = 1
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

  /**
   * @param {number} seriesIndex
   */
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
      if (
        /** @type {Record<string,any>} */ (w.config.series[this.seriesIndex]).type === 'line'
      ) {
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

  /** @param {{fillConfig: any, patternFill: any, fillColor: any, defaultColor: any}} opts */
  handlePatternFill({ fillConfig, patternFill, fillColor, defaultColor }) {
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
      )
    }
    return patternFill
  }

  handleGradientFill(
    /** @type {any} */ {
      type,
      fillColor,
      fillOpacity,
      fillConfig,
      colorStops,
      i,
      verticalUserSpace = false,
    },
  ) {
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

    // An rgba() (or a slash-alpha rgb()) carries its own opacity; one it
    // cannot be read from (NaN) keeps the configured opacity.
    const rgbaOpacity = (/** @type {string} */ c, /** @type {number} */ o) => {
      const a = hasOwnAlpha(c) ? Utils.getOpacityFromRGBA(c) : NaN
      return Number.isFinite(a) ? a : o
    }
    opacityFrom = rgbaOpacity(gradientFrom, opacityFrom)
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
      const intensity = parseFloat(fillCnf.gradient.shadeIntensity)
      gradientTo = utils.shadeColor(
        fillCnf.gradient.shade === 'dark' ? -intensity : intensity,
        Utils.rgb2hex(fillColor) || fillColor,
        this.w.dom.elWrap,
      )
    } else {
      if (fillCnf.gradient.gradientToColors[opts.seriesNumber]) {
        const gToColor = fillCnf.gradient.gradientToColors[opts.seriesNumber]
        gradientTo = gToColor
        opacityTo = rgbaOpacity(gToColor, opacityTo)
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

    // drawGradient turns a hex stop into rgba() with the stop's opacity, on
    // top of its stop-opacity. rgb() goes to it as hex; a modern colour the
    // hex maths cannot read (color(srgb ...), color-mix(), oklch(), or a
    // shade blended by the browser) gets the same opacity through
    // color-mix(), so it paints as the same colour given in hex would.
    // Named and hsl() colours stay as given. At opacity 0 the stop-opacity
    // hides it already, and the raw colour keeps its hue for the gradient to
    // fade through (as hexToRgba(hex, 0) does), not 'transparent' black.
    const toStop = (/** @type {string} */ c, /** @type {number} */ o) =>
      c.indexOf('rgb') > -1 || MODERN_COLOR.test(c)
        ? Utils.rgb2hex(c) || (o > 0 ? Utils.applyOpacityToColor(c, o) : c)
        : c
    gradientFrom = toStop(gradientFrom, opacityFrom)
    gradientTo = toStop(gradientTo, opacityTo)

    return graphics.drawGradient(
      type,
      gradientFrom,
      gradientTo,
      opacityFrom,
      opacityTo,
      opts.size,
      fillCnf.gradient.stops,
      colorStops,
      i,
      verticalUserSpace,
    )
  }
}

export default Fill
