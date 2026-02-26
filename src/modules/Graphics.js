import Animations from './Animations'
import Filters from './Filters'
import Utils from '../utils/Utils'

/**
 * ApexCharts Graphics Class for all drawing operations.
 *
 * @module Graphics
 **/

class Graphics {
  constructor(w, ctx = null) {
    this.w = w
    this.ctx = ctx
  }

  /*****************************************************************************
   *                                                                            *
   *  SVG Path Rounding Function                                                *
   *  Copyright (C) 2014 Yona Appletree                                         *
   *                                                                            *
   *  Licensed under the Apache License, Version 2.0 (the "License");           *
   *  you may not use this file except in compliance with the License.          *
   *  You may obtain a copy of the License at                                   *
   *                                                                            *
   *      http://www.apache.org/licenses/LICENSE-2.0                            *
   *                                                                            *
   *  Unless required by applicable law or agreed to in writing, software       *
   *  distributed under the License is distributed on an "AS IS" BASIS,         *
   *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
   *  See the License for the specific language governing permissions and       *
   *  limitations under the License.                                            *
   *                                                                            *
   *****************************************************************************/

  /**
   * SVG Path rounding function. Takes an input path string and outputs a path
   * string where all line-line corners have been rounded. Only supports absolute
   * commands at the moment.
   *
   * @param pathString The SVG input path
   * @param radius The amount to round the corners, either a value in the SVG
   *               coordinate space, or, if useFractionalRadius is true, a value
   *               from 0 to 1.
   * @returns A new SVG path string with the rounding
   */
  roundPathCorners(pathString, radius) {
    if (pathString.indexOf('NaN') > -1) pathString = ''

    function moveTowardsLength(movingPoint, targetPoint, amount) {
      var width = targetPoint.x - movingPoint.x
      var height = targetPoint.y - movingPoint.y

      var distance = Math.sqrt(width * width + height * height)

      return moveTowardsFractional(
        movingPoint,
        targetPoint,
        Math.min(1, amount / distance)
      )
    }
    function moveTowardsFractional(movingPoint, targetPoint, fraction) {
      return {
        x: movingPoint.x + (targetPoint.x - movingPoint.x) * fraction,
        y: movingPoint.y + (targetPoint.y - movingPoint.y) * fraction,
      }
    }

    // Adjusts the ending position of a command
    function adjustCommand(cmd, newPoint) {
      if (cmd.length > 2) {
        cmd[cmd.length - 2] = newPoint.x
        cmd[cmd.length - 1] = newPoint.y
      }
    }

    // Gives an {x, y} object for a command's ending position
    function pointForCommand(cmd) {
      return {
        x: parseFloat(cmd[cmd.length - 2]),
        y: parseFloat(cmd[cmd.length - 1]),
      }
    }

    // Split apart the path, handing concatonated letters and numbers
    var pathParts = pathString.split(/[,\s]/).reduce(function (parts, part) {
      var match = part.match(/^([a-zA-Z])(.+)/)
      if (match) {
        parts.push(match[1])
        parts.push(match[2])
      } else {
        parts.push(part)
      }

      return parts
    }, [])

    // Group the commands with their arguments for easier handling
    var commands = pathParts.reduce(function (commands, part) {
      if (parseFloat(part) == part && commands.length) {
        commands[commands.length - 1].push(part)
      } else {
        commands.push([part])
      }

      return commands
    }, [])

    // The resulting commands, also grouped
    var resultCommands = []

    if (commands.length > 1) {
      var startPoint = pointForCommand(commands[0])

      // Handle the close path case with a "virtual" closing line
      var virtualCloseLine = null
      if (commands[commands.length - 1][0] == 'Z' && commands[0].length > 2) {
        virtualCloseLine = ['L', startPoint.x, startPoint.y]
        commands[commands.length - 1] = virtualCloseLine
      }

      // We always use the first command (but it may be mutated)
      resultCommands.push(commands[0])

      for (var cmdIndex = 1; cmdIndex < commands.length; cmdIndex++) {
        var prevCmd = resultCommands[resultCommands.length - 1]

        var curCmd = commands[cmdIndex]

        // Handle closing case
        var nextCmd =
          curCmd == virtualCloseLine ? commands[1] : commands[cmdIndex + 1]

        // Nasty logic to decide if this path is a candidite.
        if (
          nextCmd &&
          prevCmd &&
          prevCmd.length > 2 &&
          curCmd[0] == 'L' &&
          nextCmd.length > 2 &&
          nextCmd[0] == 'L'
        ) {
          // Calc the points we're dealing with
          var prevPoint = pointForCommand(prevCmd)
          var curPoint = pointForCommand(curCmd)
          var nextPoint = pointForCommand(nextCmd)

          // The start and end of the cuve are just our point moved towards the previous and next points, respectivly
          var curveStart, curveEnd

          curveStart = moveTowardsLength(curPoint, prevPoint, radius)
          curveEnd = moveTowardsLength(curPoint, nextPoint, radius)

          // Adjust the current command and add it
          adjustCommand(curCmd, curveStart)
          curCmd.origPoint = curPoint
          resultCommands.push(curCmd)

          // The curve control points are halfway between the start/end of the curve and
          // the original point
          var startControl = moveTowardsFractional(curveStart, curPoint, 0.5)
          var endControl = moveTowardsFractional(curPoint, curveEnd, 0.5)

          // Create the curve
          var curveCmd = [
            'C',
            startControl.x,
            startControl.y,
            endControl.x,
            endControl.y,
            curveEnd.x,
            curveEnd.y,
          ]
          // Save the original point for fractional calculations
          curveCmd.origPoint = curPoint
          resultCommands.push(curveCmd)
        } else {
          // Pass through commands that don't qualify
          resultCommands.push(curCmd)
        }
      }

      // Fix up the starting point and restore the close path if the path was orignally closed
      if (virtualCloseLine) {
        var newStartPoint = pointForCommand(
          resultCommands[resultCommands.length - 1]
        )
        resultCommands.push(['Z'])
        adjustCommand(resultCommands[0], newStartPoint)
      }
    } else {
      resultCommands = commands
    }

    return resultCommands.reduce(function (str, c) {
      return str + c.join(' ') + ' '
    }, '')
  }

  drawLine(
    x1,
    y1,
    x2,
    y2,
    lineColor = '#a8a8a8',
    dashArray = 0,
    strokeWidth = null,
    strokeLineCap = 'butt'
  ) {
    const w = this.w
    const line = w.dom.Paper.line().attr({
      x1,
      y1,
      x2,
      y2,
      stroke: lineColor,
      'stroke-dasharray': dashArray,
      'stroke-width': strokeWidth,
      'stroke-linecap': strokeLineCap,
    })

    return line
  }

  drawRect(
    x1 = 0,
    y1 = 0,
    x2 = 0,
    y2 = 0,
    radius = 0,
    color = '#fefefe',
    opacity = 1,
    strokeWidth = null,
    strokeColor = null,
    strokeDashArray = 0
  ) {
    const w = this.w
    const rect = w.dom.Paper.rect()

    rect.attr({
      x: x1,
      y: y1,
      width: x2 > 0 ? x2 : 0,
      height: y2 > 0 ? y2 : 0,
      rx: radius,
      ry: radius,
      opacity,
      'stroke-width': strokeWidth !== null ? strokeWidth : 0,
      stroke: strokeColor !== null ? strokeColor : 'none',
      'stroke-dasharray': strokeDashArray,
    })

    // fix apexcharts.js#1410
    rect.node.setAttribute('fill', color)

    return rect
  }

  drawPolygon(
    polygonString,
    stroke = '#e1e1e1',
    strokeWidth = 1,
    fill = 'none'
  ) {
    const w = this.w
    const polygon = w.dom.Paper.polygon(polygonString).attr({
      fill,
      stroke,
      'stroke-width': strokeWidth,
    })

    return polygon
  }

  drawCircle(radius, attrs = null) {
    const w = this.w

    if (radius < 0) radius = 0
    const c = w.dom.Paper.circle(radius * 2)
    if (attrs !== null) {
      c.attr(attrs)
    }
    return c
  }

  drawPath({
    d = '',
    stroke = '#a8a8a8',
    strokeWidth = 1,
    fill,
    fillOpacity = 1,
    strokeOpacity = 1,
    classes,
    strokeLinecap = null,
    strokeDashArray = 0,
  }) {
    const w = this.w

    if (strokeLinecap === null) {
      strokeLinecap = w.config.stroke.lineCap
    }

    if (d.indexOf('undefined') > -1 || d.indexOf('NaN') > -1) {
      d = `M 0 ${w.globals.gridHeight}`
    }
    const p = w.dom.Paper.path(d).attr({
      fill,
      'fill-opacity': fillOpacity,
      stroke,
      'stroke-opacity': strokeOpacity,
      'stroke-linecap': strokeLinecap,
      'stroke-width': strokeWidth,
      'stroke-dasharray': strokeDashArray,
      class: classes,
    })

    return p
  }

  group(attrs = null) {
    const w = this.w
    const g = w.dom.Paper.group()

    if (attrs !== null) {
      g.attr(attrs)
    }
    return g
  }

  move(x, y) {
    const move = ['M', x, y].join(' ')
    return move
  }

  line(x, y, hORv = null) {
    let line = null
    if (hORv === null) {
      line = [' L', x, y].join(' ')
    } else if (hORv === 'H') {
      line = [' H', x].join(' ')
    } else if (hORv === 'V') {
      line = [' V', y].join(' ')
    }
    return line
  }

  curve(x1, y1, x2, y2, x, y) {
    const curve = ['C', x1, y1, x2, y2, x, y].join(' ')
    return curve
  }

  quadraticCurve(x1, y1, x, y) {
    const curve = ['Q', x1, y1, x, y].join(' ')
    return curve
  }

  arc(rx, ry, axisRotation, largeArcFlag, sweepFlag, x, y, relative = false) {
    let coord = 'A'
    if (relative) coord = 'a'

    const arc = [coord, rx, ry, axisRotation, largeArcFlag, sweepFlag, x, y].join(
      ' '
    )
    return arc
  }

  /**
   * @memberof Graphics
   * @param {object}
   *  i = series's index
   *  realIndex = realIndex is series's actual index when it was drawn time. After several redraws, the iterating "i" may change in loops, but realIndex doesn't
   *  pathFrom = existing pathFrom to animateTo
   *  pathTo = new Path to which d attr will be animated from pathFrom to pathTo
   *  stroke = line Color
   *  strokeWidth = width of path Line
   *  fill = it can be gradient, single color, pattern or image
   *  animationDelay = how much to delay when starting animation (in milliseconds)
   *  dataChangeSpeed = for dynamic animations, when data changes
   *  className = class attribute to add
   * @return {object} svg.js path object
   **/
  renderPaths({
    j,
    realIndex,
    pathFrom,
    pathTo,
    stroke,
    strokeWidth,
    strokeLinecap,
    fill,
    animationDelay,
    initialSpeed,
    dataChangeSpeed,
    className,
    chartType,
    shouldClipToGrid = true,
    bindEventsOnPaths = true,
    drawShadow = true,
  }) {
    const w = this.w
    const filters = new Filters(this.w)
    const anim = new Animations(this.w)

    const initialAnim = this.w.config.chart.animations.enabled
    const dynamicAnim =
      initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled

    // Fix for paths starting with M 0 0
    if (pathFrom && pathFrom.startsWith('M 0 0') && pathTo) {
      const moveCommand = pathTo.match(/^M\s+[\d.-]+\s+[\d.-]+/)
      if (moveCommand) {
        pathFrom = pathFrom.replace(/^M\s+0\s+0/, moveCommand[0])
      }
    }

    let d
    const shouldAnimate = !!(
      (initialAnim && !w.globals.resized) ||
      (dynamicAnim && w.globals.dataChanged && w.globals.shouldAnimate)
    )

    if (shouldAnimate) {
      d = pathFrom
    } else {
      d = pathTo
      w.globals.animationEnded = true
    }

    const strokeDashArrayOpt = w.config.stroke.dashArray
    let strokeDashArray = 0
    if (Array.isArray(strokeDashArrayOpt)) {
      strokeDashArray = strokeDashArrayOpt[realIndex]
    } else {
      strokeDashArray = w.config.stroke.dashArray
    }

    const el = this.drawPath({
      d,
      stroke,
      strokeWidth,
      fill,
      fillOpacity: 1,
      classes: className,
      strokeLinecap,
      strokeDashArray,
    })

    el.attr('index', realIndex)

    if (shouldClipToGrid) {
      if (
        (chartType === 'bar' && !w.globals.isHorizontal) ||
        w.globals.comboCharts
      ) {
        el.attr({
          'clip-path': `url(#gridRectBarMask${w.globals.cuid})`,
        })
      } else {
        el.attr({
          'clip-path': `url(#gridRectMask${w.globals.cuid})`,
        })
      }
    }

    if (w.config.chart.dropShadow.enabled && drawShadow) {
      filters.dropShadow(el, w.config.chart.dropShadow, realIndex)
    }

    if (bindEventsOnPaths) {
      el.node.addEventListener('mouseenter', this.pathMouseEnter.bind(this, el))
      el.node.addEventListener('mouseleave', this.pathMouseLeave.bind(this, el))
      el.node.addEventListener('mousedown', this.pathMouseDown.bind(this, el))
    }

    el.attr({
      pathTo,
      pathFrom,
    })

    const defaultAnimateOpts = {
      el,
      j,
      realIndex,
      pathFrom,
      pathTo,
      fill,
      strokeWidth,
      delay: animationDelay,
    }

    if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
      anim.animatePathsGradually({
        ...defaultAnimateOpts,
        speed: initialSpeed,
      })
    } else {
      if (w.globals.resized || !w.globals.dataChanged) {
        anim.showDelayedElements()
      }
    }

    if (w.globals.dataChanged && dynamicAnim && shouldAnimate) {
      anim.animatePathsGradually({
        ...defaultAnimateOpts,
        speed: dataChangeSpeed,
      })
    }

    return el
  }

  drawPattern(
    style,
    width,
    height,
    stroke = '#a8a8a8',
    strokeWidth = 0,
  ) {
    const w = this.w

    const p = w.dom.Paper.pattern(width, height, (add) => {
      if (style === 'horizontalLines') {
        add
          .line(0, 0, height, 0)
          .stroke({ color: stroke, width: strokeWidth + 1 })
      } else if (style === 'verticalLines') {
        add
          .line(0, 0, 0, width)
          .stroke({ color: stroke, width: strokeWidth + 1 })
      } else if (style === 'slantedLines') {
        add
          .line(0, 0, width, height)
          .stroke({ color: stroke, width: strokeWidth })
      } else if (style === 'squares') {
        add
          .rect(width, height)
          .fill('none')
          .stroke({ color: stroke, width: strokeWidth })
      } else if (style === 'circles') {
        add
          .circle(width)
          .fill('none')
          .stroke({ color: stroke, width: strokeWidth })
      }
    })

    return p
  }

  drawGradient(
    style,
    gfrom,
    gto,
    opacityFrom,
    opacityTo,
    size = null,
    stops = null,
    colorStops = [],
    i = 0
  ) {
    const w = this.w
    let g

    if (gfrom.length < 9 && gfrom.indexOf('#') === 0) {
      // if the hex contains alpha and is of 9 digit, skip the opacity
      gfrom = Utils.hexToRgba(gfrom, opacityFrom)
    }
    if (gto.length < 9 && gto.indexOf('#') === 0) {
      gto = Utils.hexToRgba(gto, opacityTo)
    }

    let stop1 = 0
    let stop2 = 1
    let stop3 = 1
    let stop4 = null

    if (stops !== null) {
      stop1 = typeof stops[0] !== 'undefined' ? stops[0] / 100 : 0
      stop2 = typeof stops[1] !== 'undefined' ? stops[1] / 100 : 1
      stop3 = typeof stops[2] !== 'undefined' ? stops[2] / 100 : 1
      stop4 = typeof stops[3] !== 'undefined' ? stops[3] / 100 : null
    }

    const radial = !!(
      w.config.chart.type === 'donut' ||
      w.config.chart.type === 'pie' ||
      w.config.chart.type === 'polarArea' ||
      w.config.chart.type === 'bubble'
    )

    if (!colorStops || colorStops.length === 0) {
      g = w.dom.Paper.gradient(radial ? 'radial' : 'linear', (add) => {
        add.stop(stop1, gfrom, opacityFrom)
        add.stop(stop2, gto, opacityTo)
        add.stop(stop3, gto, opacityTo)
        if (stop4 !== null) {
          add.stop(stop4, gfrom, opacityFrom)
        }
      })
    } else {
      g = w.dom.Paper.gradient(radial ? 'radial' : 'linear', (add) => {
        const gradientStops = Array.isArray(colorStops[i])
          ? colorStops[i]
          : colorStops
        gradientStops.forEach((s) => {
          add.stop(s.offset / 100, s.color, s.opacity)
        })
      })
    }

    if (!radial) {
      if (style === 'vertical') {
        g.from(0, 0).to(0, 1)
      } else if (style === 'diagonal') {
        g.from(0, 0).to(1, 1)
      } else if (style === 'horizontal') {
        g.from(0, 1).to(1, 1)
      } else if (style === 'diagonal2') {
        g.from(1, 0).to(0, 1)
      }
    } else {
      const offx = w.globals.gridWidth / 2
      const offy = w.globals.gridHeight / 2

      if (w.config.chart.type !== 'bubble') {
        g.attr({
          gradientUnits: 'userSpaceOnUse',
          cx: offx,
          cy: offy,
          r: size,
        })
      } else {
        g.attr({
          cx: 0.5,
          cy: 0.5,
          r: 0.8,
          fx: 0.2,
          fy: 0.2,
        })
      }
    }

    return g
  }

  getTextBasedOnMaxWidth({ text, maxWidth, fontSize, fontFamily }) {
    const tRects = this.getTextRects(text, fontSize, fontFamily)
    const wordWidth = tRects.width / text.length
    const wordsBasedOnWidth = Math.floor(maxWidth / wordWidth)
    if (maxWidth < tRects.width) {
      return text.slice(0, wordsBasedOnWidth - 3) + '...'
    }
    return text
  }

  drawText({
    x,
    y,
    text,
    textAnchor,
    fontSize,
    fontFamily,
    fontWeight,
    foreColor,
    opacity,
    maxWidth,
    cssClass = '',
    isPlainText = true,
    dominantBaseline = 'auto',
  }) {
    const w = this.w

    if (typeof text === 'undefined') text = ''

    let truncatedText = text
    if (!textAnchor) {
      textAnchor = 'start'
    }

    if (!foreColor || !foreColor.length) {
      foreColor = w.config.chart.foreColor
    }
    fontFamily = fontFamily || w.config.chart.fontFamily
    fontSize = fontSize || '11px'
    fontWeight = fontWeight || 'regular'

    const commonProps = {
      maxWidth,
      fontSize,
      fontFamily,
    }
    let elText
    if (Array.isArray(text)) {
      elText = w.dom.Paper.text((add) => {
        for (let i = 0; i < text.length; i++) {
          truncatedText = text[i]
          if (maxWidth) {
            truncatedText = this.getTextBasedOnMaxWidth({
              text: text[i],
              ...commonProps,
            })
          }
          i === 0
            ? add.tspan(truncatedText)
            : add.tspan(truncatedText).newLine()
        }
      })
    } else {
      if (maxWidth) {
        truncatedText = this.getTextBasedOnMaxWidth({
          text,
          ...commonProps,
        })
      }
      elText = isPlainText
        ? w.dom.Paper.plain(text)
        : w.dom.Paper.text((add) => add.tspan(truncatedText))
    }

    elText.attr({
      x,
      y,
      'text-anchor': textAnchor,
      'dominant-baseline': dominantBaseline,
      'font-size': fontSize,
      'font-family': fontFamily,
      'font-weight': fontWeight,
      fill: foreColor,
      class: 'apexcharts-text ' + cssClass,
    })

    elText.node.style.fontFamily = fontFamily
    elText.node.style.opacity = opacity

    return elText
  }

  getMarkerPath(x, y, type, size) {
    let d = ''
    switch (type) {
      case 'cross':
        size = size / 1.4
        d = `M ${x - size} ${y - size} L ${x + size} ${y + size}  M ${
          x - size
        } ${y + size} L ${x + size} ${y - size}`
        break
      case 'plus':
        size = size / 1.12
        d = `M ${x - size} ${y} L ${x + size} ${y}  M ${x} ${y - size} L ${x} ${
          y + size
        }`
        break
      case 'star':
      case 'sparkle': {
        let points = 5
        size = size * 1.15
        if (type === 'sparkle') {
          size = size / 1.1
          points = 4
        }
        const step = Math.PI / points

        for (let i = 0; i <= 2 * points; i++) {
          const angle = i * step
          const radius = i % 2 === 0 ? size : size / 2
          const xPos = x + radius * Math.sin(angle)
          const yPos = y - radius * Math.cos(angle)

          d += (i === 0 ? 'M' : 'L') + xPos + ',' + yPos
        }
        d += 'Z'
        break
      }
      case 'triangle':
        d = `M ${x} ${y - size} 
             L ${x + size} ${y + size} 
             L ${x - size} ${y + size} 
             Z`
        break
      case 'square':
      case 'rect':
        size = size / 1.125
        d = `M ${x - size} ${y - size} 
           L ${x + size} ${y - size} 
           L ${x + size} ${y + size} 
           L ${x - size} ${y + size} 
           Z`
        break
      case 'diamond':
        size = size * 1.05
        d = `M ${x} ${y - size} 
             L ${x + size} ${y} 
             L ${x} ${y + size} 
             L ${x - size} ${y} 
            Z`
        break
      case 'line':
        size = size / 1.1
        d = `M ${x - size} ${y} 
           L ${x + size} ${y}`
        break
      case 'circle':
      default:
        size = size * 2
        d = `M ${x}, ${y} 
           m -${size / 2}, 0 
           a ${size / 2},${size / 2} 0 1,0 ${size},0 
           a ${size / 2},${size / 2} 0 1,0 -${size},0`
        break
    }
    return d
  }

  /**
   * @param {number} x - The x-coordinate of the marker
   * @param {number} y - The y-coordinate of the marker.
   * @param {number} size - The size of the marker
   * @param {Object} opts - The options for the marker.
   * @returns {Object} The created marker.
   */
  drawMarkerShape(x, y, type, size, opts) {
    const path = this.drawPath({
      d: this.getMarkerPath(x, y, type, size, opts),
      stroke: opts.pointStrokeColor,
      strokeDashArray: opts.pointStrokeDashArray,
      strokeWidth: opts.pointStrokeWidth,
      fill: opts.pointFillColor,
      fillOpacity: opts.pointFillOpacity,
      strokeOpacity: opts.pointStrokeOpacity,
    })

    path.attr({
      cx: x,
      cy: y,
      shape: opts.shape,
      class: opts.class ? opts.class : '',
    })

    return path
  }

  drawMarker(x, y, opts) {
    x = x || 0
    let size = opts.pSize || 0

    if (!Utils.isNumber(y)) {
      size = 0
      y = 0
    }

    return this.drawMarkerShape(x, y, opts?.shape, size, {
      ...opts,
      ...(opts.shape === 'line' ||
      opts.shape === 'plus' ||
      opts.shape === 'cross'
        ? {
            pointStrokeColor: opts.pointFillColor,
            pointStrokeOpacity: opts.pointFillOpacity,
          }
        : {}),
    })
  }

  pathMouseEnter(path, e) {
    const w = this.w
    const filters = new Filters(this.w)

    const i = parseInt(path.node.getAttribute('index'), 10)
    const j = parseInt(path.node.getAttribute('j'), 10)

    if (typeof w.config.chart.events.dataPointMouseEnter === 'function') {
      w.config.chart.events.dataPointMouseEnter(e, this.ctx, {
        seriesIndex: i,
        dataPointIndex: j,
        w,
      })
    }
    this.ctx.events.fireEvent('dataPointMouseEnter', [
      e,
      this.ctx,
      { seriesIndex: i, dataPointIndex: j, w },
    ])

    if (w.config.states.active.filter.type !== 'none') {
      if (path.node.getAttribute('selected') === 'true') {
        return
      }
    }

    if (w.config.states.hover.filter.type !== 'none') {
      if (!w.interact.isTouchDevice) {
        const hoverFilter = w.config.states.hover.filter
        filters.applyFilter(path, i, hoverFilter.type)
      }
    }
  }

  pathMouseLeave(path, e) {
    const w = this.w
    const filters = new Filters(this.w)

    const i = parseInt(path.node.getAttribute('index'), 10)
    const j = parseInt(path.node.getAttribute('j'), 10)

    if (typeof w.config.chart.events.dataPointMouseLeave === 'function') {
      w.config.chart.events.dataPointMouseLeave(e, this.ctx, {
        seriesIndex: i,
        dataPointIndex: j,
        w,
      })
    }
    this.ctx.events.fireEvent('dataPointMouseLeave', [
      e,
      this.ctx,
      { seriesIndex: i, dataPointIndex: j, w },
    ])

    if (w.config.states.active.filter.type !== 'none') {
      if (path.node.getAttribute('selected') === 'true') {
        return
      }
    }

    if (w.config.states.hover.filter.type !== 'none') {
      filters.getDefaultFilter(path, i)
    }
  }

  pathMouseDown(path, e) {
    const w = this.w
    const filters = new Filters(this.w)

    const i = parseInt(path.node.getAttribute('index'), 10)
    const j = parseInt(path.node.getAttribute('j'), 10)

    let selected = 'false'
    if (path.node.getAttribute('selected') === 'true') {
      path.node.setAttribute('selected', 'false')

      if (w.interact.selectedDataPoints[i].indexOf(j) > -1) {
        const index = w.interact.selectedDataPoints[i].indexOf(j)
        w.interact.selectedDataPoints[i].splice(index, 1)
      }
    } else {
      if (
        !w.config.states.active.allowMultipleDataPointsSelection &&
        w.interact.selectedDataPoints.length > 0
      ) {
        w.interact.selectedDataPoints = []
        const elPaths = w.dom.Paper.find(
          '.apexcharts-series path:not(.apexcharts-decoration-element)'
        )
        const elCircles = w.dom.Paper.find(
          '.apexcharts-series circle:not(.apexcharts-decoration-element), .apexcharts-series rect:not(.apexcharts-decoration-element)'
        )

        const deSelect = (els) => {
          Array.prototype.forEach.call(els, (el) => {
            el.node.setAttribute('selected', 'false')
            filters.getDefaultFilter(el, i)
          })
        }
        deSelect(elPaths)
        deSelect(elCircles)
      }

      path.node.setAttribute('selected', 'true')
      selected = 'true'

      if (typeof w.interact.selectedDataPoints[i] === 'undefined') {
        w.interact.selectedDataPoints[i] = []
      }
      w.interact.selectedDataPoints[i].push(j)
    }

    if (selected === 'true') {
      const activeFilter = w.config.states.active.filter
      if (activeFilter !== 'none') {
        filters.applyFilter(path, i, activeFilter.type)
      } else {
        // Reapply the hover filter in case it was removed by `deselect`when there is no active filter and it is not a touch device
        if (w.config.states.hover.filter !== 'none') {
          if (!w.interact.isTouchDevice) {
            const hoverFilter = w.config.states.hover.filter
            filters.applyFilter(path, i, hoverFilter.type)
          }
        }
      }
    } else {
      // If the item was deselected, apply hover state filter if it is not a touch device
      if (w.config.states.active.filter.type !== 'none') {
        if (
          w.config.states.hover.filter.type !== 'none' &&
          !w.interact.isTouchDevice
        ) {
          const hoverFilter = w.config.states.hover.filter
          filters.applyFilter(path, i, hoverFilter.type)
        } else {
          filters.getDefaultFilter(path, i)
        }
      }
    }

    if (typeof w.config.chart.events.dataPointSelection === 'function') {
      w.config.chart.events.dataPointSelection(e, this.ctx, {
        selectedDataPoints: w.interact.selectedDataPoints,
        seriesIndex: i,
        dataPointIndex: j,
        w,
      })
    }

    if (e) {
      this.ctx.events.fireEvent('dataPointSelection', [
        e,
        this.ctx,
        {
          selectedDataPoints: w.interact.selectedDataPoints,
          seriesIndex: i,
          dataPointIndex: j,
          w,
        },
      ])
    }
  }

  rotateAroundCenter(el) {
    let coord = {}
    if (el && typeof el.getBBox === 'function') {
      coord = el.getBBox()
    }
    const x = coord.x + coord.width / 2
    const y = coord.y + coord.height / 2

    return {
      x,
      y,
    }
  }

  /**
   * Sets up event delegation on a parent group element.
   * Uses mouseover/mouseout (which bubble) to simulate mouseenter/mouseleave
   * on matching child elements, reducing per-element listener overhead.
   */
  setupEventDelegation(parentGroup, targetSelector) {
    let currentHovered = null

    parentGroup.node.addEventListener('mouseover', (e) => {
      const targetNode = Graphics._findDelegateTarget(
        e.target,
        parentGroup.node,
        targetSelector
      )
      if (!targetNode || targetNode === currentHovered) return

      if (currentHovered && currentHovered.instance) {
        this.pathMouseLeave(currentHovered.instance, e)
      }
      currentHovered = targetNode
      if (targetNode.instance) {
        this.pathMouseEnter(targetNode.instance, e)
      }
    })

    parentGroup.node.addEventListener('mouseout', (e) => {
      if (!currentHovered) return
      const relatedNode = e.relatedTarget
        ? Graphics._findDelegateTarget(
            e.relatedTarget,
            parentGroup.node,
            targetSelector
          )
        : null
      if (relatedNode !== currentHovered) {
        if (currentHovered && currentHovered.instance) {
          this.pathMouseLeave(currentHovered.instance, e)
        }
        currentHovered = null
      }
    })

    parentGroup.node.addEventListener('mousedown', (e) => {
      const targetNode = Graphics._findDelegateTarget(
        e.target,
        parentGroup.node,
        targetSelector
      )
      if (targetNode && targetNode.instance) {
        this.pathMouseDown(targetNode.instance, e)
      }
    })
  }

  static _findDelegateTarget(node, boundary, selector) {
    while (node && node !== boundary && node !== document) {
      if (node.matches && node.matches(selector)) return node
      node = node.parentNode
    }
    return null
  }

  static setAttrs(el, attrs) {
    for (const key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        el.setAttribute(key, attrs[key])
      }
    }
  }

  getTextRects(text, fontSize, fontFamily, transform, useBBox = true) {
    const w = this.w

    // cache text measurements to avoid repeated DOM create/measure/remove cycles
    const cacheKey = `${text}|${fontSize}|${fontFamily}|${transform}|${useBBox}`
    const cache = w.globals.textRectsCache
    if (cache && cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    const virtualText = this.drawText({
      x: -200,
      y: -200,
      text,
      textAnchor: 'start',
      fontSize,
      fontFamily,
      foreColor: '#fff',
      opacity: 0,
    })

    if (transform) {
      virtualText.attr('transform', transform)
    }
    w.dom.Paper.add(virtualText)

    let rect = virtualText.bbox()
    if (!useBBox) {
      rect = virtualText.node.getBoundingClientRect()
    }

    virtualText.remove()

    const result = {
      width: rect.width,
      height: rect.height,
    }

    if (cache) {
      cache.set(cacheKey, result)
    }

    return result
  }

  /**
   * append ... to long text
   * http://stackoverflow.com/questions/9241315/trimming-text-to-a-given-pixel-width-in-svg
   * @memberof Graphics
   **/
  placeTextWithEllipsis(textObj, textString, width) {
    if (typeof textObj.getComputedTextLength !== 'function') return
    textObj.textContent = textString
    if (textString.length > 0) {
      // ellipsis is needed
      if (textObj.getComputedTextLength() >= width / 1.1) {
        for (let x = textString.length - 3; x > 0; x -= 3) {
          if (textObj.getSubStringLength(0, x) <= width / 1.1) {
            textObj.textContent = textString.substring(0, x) + '...'
            return
          }
        }
        textObj.textContent = '.' // can't place at all
      }
    }
  }
}

export default Graphics
