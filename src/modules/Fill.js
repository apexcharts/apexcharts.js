import * as Graphics from './Graphics.js'
import Utils from '../utils/Utils.js'

/**
 * ApexCharts Fill Class for setting fill options of the paths.
 *
 * @module Fill
 **/

function clippedImgArea(ctx, params) {
  const w = ctx.w
  const cnf = w.config

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
    patternUnits: params.patternUnits ? params.patternUnits : 'userSpaceOnUse',
    width: imgWidth + 'px',
    height: imgHeight + 'px',
  })

  let elImage = document.createElementNS(w.globals.SVGNS, 'image')
  elPattern.appendChild(elImage)

  elImage.setAttributeNS(window.SVG.xlink, 'href', fillImg)

  Graphics.setAttrs(elImage, {
    x: 0,
    y: 0,
    preserveAspectRatio: 'none',
    width: imgWidth + 'px',
    height: imgHeight + 'px',
  })

  elImage.style.opacity = params.opacity

  w.globals.dom.elDefs.node.appendChild(elPattern)
}

function getSeriesIndex(ctx, opts) {
  const w = ctx.w
  const cType = w.config.chart.type
  let seriesIndex

  if (
    ((cType === 'bar' || cType === 'rangeBar') &&
      w.config.plotOptions.bar.distributed) ||
    cType === 'heatmap' ||
    cType === 'treemap'
  ) {
    seriesIndex = opts.seriesNumber
  } else {
    seriesIndex = opts.seriesNumber % w.globals.series.length
  }

  return seriesIndex
}

function computeColorStops(ctx, data, multiColorConfig) {
  const w = ctx.w
  let maxPositive = null
  let minNegative = null

  for (let value of data) {
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

  let negativePercentage =
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

export function fillPath(ctx, opts) {
  const w = ctx.w
  const cnf = w.config
  let pathFill

  let patternFill, gradientFill

  const seriesIndex = getSeriesIndex(ctx, opts)

  const drawMultiColorLine =
    cnf.plotOptions.line.colors.colorAboveThreshold &&
    cnf.plotOptions.line.colors.colorBelowThreshold

  let fillColors = getFillColors(ctx, opts)
  let fillColor = fillColors[seriesIndex]

  //override fillcolor if user inputted color with data
  if (w.globals.seriesColors[seriesIndex] !== undefined) {
    fillColor = w.globals.seriesColors[seriesIndex]
  }

  if (typeof fillColor === 'function') {
    fillColor = fillColor({
      seriesIndex: seriesIndex,
      dataPointIndex: opts.dataPointIndex,
      value: opts.value,
      w,
    })
  }
  let fillType = opts.fillType ? opts.fillType : getFillType(ctx, seriesIndex)
  let fillOpacity = Array.isArray(cnf.fill.opacity)
    ? cnf.fill.opacity[seriesIndex]
    : cnf.fill.opacity

  // when line colors needs to be different based on values, we use gradient config to achieve this
  const useGradient = fillType === 'gradient' || drawMultiColorLine

  if (opts.color) {
    fillColor = opts.color
  }

  if (w.config.series[seriesIndex]?.data?.[opts.dataPointIndex]?.fillColor) {
    fillColor =
      w.config.series[seriesIndex]?.data?.[opts.dataPointIndex]?.fillColor
  }

  // in case a color is undefined, fallback to white color to prevent runtime error
  if (!fillColor) {
    fillColor = '#fff'
    console.warn('undefined color - ApexCharts')
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
    patternFill = handlePatternFill(ctx, opts, {
      fillConfig: opts.fillConfig,
      patternFill,
      fillColor,
      fillOpacity,
      defaultColor,
    })
  }

  if (useGradient) {
    let colorStops = [...cnf.fill.gradient.colorStops] || []
    let type = cnf.fill.gradient.type
    if (drawMultiColorLine) {
      colorStops[seriesIndex] = computeColorStops(
        ctx,
        w.globals.series[seriesIndex],
        cnf.plotOptions.line.colors
      )
      type = 'vertical'
    }

    gradientFill = handleGradientFill(ctx, opts, {
      type,
      fillConfig: opts.fillConfig,
      fillColor,
      fillOpacity,
      colorStops,
      i: seriesIndex,
    })
  }

  if (fillType === 'image') {
    if (!w.globals.patternIDs) {
      w.globals.patternIDs = []
    }

    let imgSrc = cnf.fill.image.src

    let patternID = opts.patternID ? opts.patternID : ''
    const patternKey = `pattern${w.globals.cuid}${
      opts.seriesNumber + 1
    }${patternID}`

    if (w.globals.patternIDs.indexOf(patternKey) === -1) {
      clippedImgArea(ctx, {
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

      w.globals.patternIDs.push(patternKey)
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

function getFillType(ctx, seriesIndex) {
  const w = ctx.w

  if (Array.isArray(w.config.fill.type)) {
    return w.config.fill.type[seriesIndex]
  } else {
    return w.config.fill.type
  }
}

function getFillColors(ctx, opts) {
  const w = ctx.w
  const cnf = w.config
  const seriesIndex = getSeriesIndex(ctx, opts)

  let fillColors = []

  if (w.globals.comboCharts) {
    if (w.config.series[seriesIndex].type === 'line') {
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

function handlePatternFill(
  ctx,
  opts,
  { fillConfig, patternFill, fillColor, fillOpacity, defaultColor }
) {
  const w = ctx.w
  let fillCnf = w.config.fill

  if (fillConfig) {
    fillCnf = fillConfig
  }

  const seriesIndex = getSeriesIndex(ctx, opts)

  let patternStrokeWidth = Array.isArray(fillCnf.pattern.strokeWidth)
    ? fillCnf.pattern.strokeWidth[seriesIndex]
    : fillCnf.pattern.strokeWidth
  let patternLineColor = fillColor

  if (Array.isArray(fillCnf.pattern.style)) {
    if (typeof fillCnf.pattern.style[opts.seriesNumber] !== 'undefined') {
      let pf = Graphics.drawPattern(
        ctx,
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
    patternFill = Graphics.drawPattern(
      ctx,
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

function handleGradientFill(
  ctx,
  opts,
  { type, fillColor, fillOpacity, fillConfig, colorStops, i }
) {
  const w = ctx.w
  let fillCnf = w.config.fill

  if (fillConfig) {
    fillCnf = {
      ...fillCnf,
      ...fillConfig,
    }
  }
  let utils = new Utils()

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
    let t = gradientFrom
    gradientFrom = gradientTo
    gradientTo = t
  }

  if (gradientFrom.indexOf('rgb') > -1) {
    gradientFrom = Utils.rgb2hex(gradientFrom)
  }
  if (gradientTo.indexOf('rgb') > -1) {
    gradientTo = Utils.rgb2hex(gradientTo)
  }

  return Graphics.drawGradient(
    ctx,
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

const Fill = {
  fillPath,
}
// Default export

export default Fill
