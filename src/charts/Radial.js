// @ts-check
import Pie from './Pie'
import Utils from '../utils/Utils'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Filters from '../modules/Filters'
import Series from '../modules/Series'
import { resolveClaimed } from '../modules/weave/Claims'
import { BrowserAPIs } from '../ssr/BrowserAPIs'
import { Environment } from '../utils/Environment'

/**
 * ApexCharts Radial Class for drawing Circle / Semi Circle Charts.
 * @module Radial
 **/

class Radial extends Pie {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    super(w, ctx)

    this.ctx = ctx
    this.w = w
    this.animBeginArr = [0]
    this.animDur = 0

    this.startAngle = w.config.plotOptions.radialBar.startAngle
    this.endAngle = w.config.plotOptions.radialBar.endAngle

    this.totalAngle = Math.abs(
      w.config.plotOptions.radialBar.endAngle -
        w.config.plotOptions.radialBar.startAngle,
    )

    this.trackStartAngle = w.config.plotOptions.radialBar.track.startAngle
    this.trackEndAngle = w.config.plotOptions.radialBar.track.endAngle

    this.barLabels = this.w.config.plotOptions.radialBar.barLabels

    this.donutDataLabels = this.w.config.plotOptions.radialBar.dataLabels
    this.radialDataLabels = this.donutDataLabels // make a copy for easy reference

    if (!this.trackStartAngle) this.trackStartAngle = this.startAngle
    if (!this.trackEndAngle) this.trackEndAngle = this.endAngle

    if (this.endAngle === 360) this.endAngle = 359.99

    this.margin = parseInt(w.config.plotOptions.radialBar.track.margin, 10)
    this.onBarLabelClick = this.onBarLabelClick.bind(this)
  }

  /**
   * @param {any[]} series
   */
  draw(series) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const ret = graphics.group({
      class: 'apexcharts-radialbar',
    })

    if (w.globals.noData) return ret

    const elSeries = graphics.group()

    // See Pie's constructor: the vertical centre is the band's, not the
    // clipped square's, so a tall narrow container does not push the rings to
    // the top and leave a void above the legend (#4875).
    const centerY = w.layout.gridHeight / 2
    const centerX = w.layout.gridWidth / 2

    let size = this.defaultSize / 2.05
    if (!w.config.chart.sparkline.enabled) {
      size = size - w.config.stroke.width - w.config.chart.dropShadow.blur
    }
    // Where the rings land on screen, for CircleTransition (the outermost
    // ring's radius stands for the circle).
    w.globals.circleGeometry = {
      node: ret.node,
      cx: centerX,
      cy: centerY,
      r: size,
    }
    const colorArr = w.globals.fill.colors

    const rb = w.config.plotOptions.radialBar
    const hasBands = Array.isArray(rb.bands) && rb.bands.length > 0
    const hideTrack =
      hasBands && rb.bandsStyle && rb.bandsStyle.hideTrackWhenPresent
    const isNeedleShape = rb.shape === 'needle'

    const dl = this.radialDataLabels
    if (dl.value.offsetY == null) {
      // A gauge leaves its reading's offset unset (see Defaults.gauge): on
      // the needle shape the reading sits below where the needle reaches at
      // either end of the dial, so the two never cross. Placed as drawn, so
      // it follows a shape changed by an update.
      const n = this.needlePath(
        { size, centerX, centerY, series },
        rb.needle || {},
      )
      this.donutDataLabels = this.radialDataLabels = {
        ...dl,
        value: {
          ...dl.value,
          offsetY: isNeedleShape
            ? n.cy -
              centerY +
              Math.max(
                n.baseW / 2,
                Utils.polarToCartesian(0, 0, n.length, this.startAngle).y,
                Utils.polarToCartesian(0, 0, n.length, this.endAngle).y,
              ) +
              parseFloat(dl.value.fontSize) +
              4
            : 8,
        },
      }
    }

    if (rb.track.show && !hideTrack) {
      const elTracks = this.drawTracks({
        size,
        centerX,
        centerY,
        colorArr,
        series,
      })
      elSeries.add(elTracks)
    }

    if (hasBands) {
      const elBands = this.drawBands({
        size,
        centerX,
        centerY,
        series,
      })
      elSeries.add(elBands)
    }

    const elG = this.drawArcs({
      size,
      centerX,
      centerY,
      colorArr,
      series,
      // When `needle.showValueArc` is true, render both the filled value-arc
      // and the needle on top — required for gauges that want a progress
      // ring with a pointer indicator (default still hides the arc when in
      // needle shape, preserving prior behavior).
      skipValueArc: isNeedleShape && !rb.needle?.showValueArc,
    })

    if (rb.ticks && rb.ticks.show) {
      const elTicks = this.drawTicks({
        size,
        centerX,
        centerY,
        series,
      })
      // On initial mount, ticks/labels fade in after the value arc + needle
      // finish their sweep — so they read as a "settled" annotation rather
      // than competing for attention during the gauge animation.
      const isInitialMount =
        this.initialAnim && !w.globals.dataChanged && !w.globals.resized
      if (isInitialMount && Environment.isBrowser() && w.globals.shouldAnimate) {
        const ticksNode = elTicks.node
        ticksNode.style.opacity = '0'
        ticksNode.style.transition = 'opacity 280ms ease-out'
        const sweepDur = w.config.chart.animations.speed || 800
        setTimeout(() => {
          ticksNode.style.opacity = '1'
        }, sweepDur)
      }
      elSeries.add(elTicks)
    }

    if (isNeedleShape) {
      const elNeedle = this.drawNeedle({
        size,
        centerX,
        centerY,
        series,
      })
      elSeries.add(elNeedle)
    }

    let totalAngle = 360

    if (w.config.plotOptions.radialBar.startAngle < 0) {
      totalAngle = this.totalAngle
    }

    const angleRatio = (360 - totalAngle) / 360
    w.globals.radialSize = size - size * angleRatio

    if (this.radialDataLabels.value.show) {
      const offset = Math.max(
        this.radialDataLabels.value.offsetY,
        this.radialDataLabels.name.offsetY,
      )
      w.globals.radialSize += offset * angleRatio
    }

    elSeries.add(elG.g)

    if (w.config.plotOptions.radialBar.hollow.position === 'front') {
      elG.g.add(elG.elHollow)
      if (elG.dataLabels) {
        elG.g.add(elG.dataLabels)
      }
    }

    ret.add(elSeries)

    return ret
  }

  /**
   * @param {Record<string, any>} opts
   */
  drawTracks(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const g = graphics.group({
      class: 'apexcharts-tracks',
    })

    const filters = new Filters(this.w)
    const fill = new Fill(this.w)

    const strokeWidth = this.getStrokeWidth(opts)

    opts.size = opts.size - strokeWidth / 2

    for (let i = 0; i < opts.series.length; i++) {
      const elRadialBarTrack = graphics.group({
        class: 'apexcharts-radialbar-track apexcharts-track',
      })
      g.add(elRadialBarTrack)

      elRadialBarTrack.attr({
        rel: i + 1,
      })

      opts.size = opts.size - strokeWidth - this.margin

      const trackConfig = w.config.plotOptions.radialBar.track
      const pathFill = fill.fillPath({
        seriesNumber: 0,
        size: opts.size,
        fillColors: Array.isArray(trackConfig.background)
          ? trackConfig.background[i]
          : trackConfig.background,
        solid: true,
      })

      const startAngle = this.trackStartAngle
      let endAngle = this.trackEndAngle

      if (Math.abs(endAngle) + Math.abs(startAngle) >= 360)
        endAngle = 360 - Math.abs(this.startAngle) - 0.1

      const elPath = graphics.drawPath({
        d: '',
        stroke: pathFill,
        strokeWidth:
          (strokeWidth * parseInt(trackConfig.strokeWidth, 10)) / 100,
        fill: 'none',
        strokeOpacity: trackConfig.opacity,
        classes: 'apexcharts-radialbar-area',
      })

      if (trackConfig.dropShadow.enabled) {
        const shadow = trackConfig.dropShadow
        filters.dropShadow(elPath, shadow)
      }

      elRadialBarTrack.add(elPath)

      elPath.attr('id', 'apexcharts-radialbarTrack-' + i)

      this.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: 0,
        dur: 0,
        isTrack: true,
      })
    }

    return g
  }

  /**
   * @param {Record<string, any>} opts
   */
  drawArcs(opts) {
    const w = this.w
    // Highlight filter (opt-in): before the centre labels and the rings.
    this.ctx.highlightFilter?.pie(this)
    // size, donutSize, centerX, centerY, colorArr, lineColorArr, sectorAngleArr, series

    const graphics = new Graphics(this.w)
    const fill = new Fill(this.w)
    const filters = new Filters(this.w)
    const g = graphics.group()

    const strokeWidth = this.getStrokeWidth(opts)
    opts.size = opts.size - strokeWidth / 2

    let hollowFillID = w.config.plotOptions.radialBar.hollow.background
    const hollowSize =
      opts.size -
      strokeWidth * opts.series.length -
      this.margin * opts.series.length -
      (strokeWidth *
        parseInt(w.config.plotOptions.radialBar.track.strokeWidth, 10)) /
        100 /
        2

    const hollowRadius =
      hollowSize - w.config.plotOptions.radialBar.hollow.margin

    if (w.config.plotOptions.radialBar.hollow.image !== undefined) {
      hollowFillID = this.drawHollowImage(opts, g, hollowSize, hollowFillID)
    }

    const elHollow = this.drawHollow({
      size: hollowRadius,
      centerX: opts.centerX,
      centerY: opts.centerY,
      fill: hollowFillID ? hollowFillID : 'transparent',
    })

    if (w.config.plotOptions.radialBar.hollow.dropShadow.enabled) {
      const shadow = w.config.plotOptions.radialBar.hollow.dropShadow
      filters.dropShadow(elHollow, shadow)
    }

    let shown = 1
    if (!this.radialDataLabels.total.show && w.seriesData.series.length > 1) {
      shown = 0
    }

    let dataLabels = null

    if (this.radialDataLabels.show) {
      const dataLabelsGroup = w.dom.Paper.findOne(
        `.apexcharts-datalabels-group`,
      )

      dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.radialDataLabels,
        {
          hollowSize,
          centerX: opts.centerX,
          centerY: opts.centerY,
          opacity: shown,
        },
      )
    }

    if (w.config.plotOptions.radialBar.hollow.position === 'back') {
      g.add(elHollow)
      if (dataLabels) {
        g.add(dataLabels)
      }
    }

    let reverseLoop = false
    if (w.config.plotOptions.radialBar.inverseOrder) {
      reverseLoop = true
    }

    const morphActive = this.ctx.morphTypeChange?.isActive() === true

    for (
      let i = reverseLoop ? opts.series.length - 1 : 0;
      reverseLoop ? i >= 0 : i < opts.series.length;
      reverseLoop ? i-- : i++
    ) {
      const elRadialBarArc = graphics.group({
        class: `apexcharts-series apexcharts-radial-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
      })
      g.add(elRadialBarArc)

      elRadialBarArc.attr({
        rel: i + 1,
        'data:realIndex': i,
      })

      Series.addCollapsedClassToSeries(this.w, elRadialBarArc, i)

      opts.size = opts.size - strokeWidth - this.margin

      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: opts.size,
        value: opts.series[i],
      })

      const startAngle = this.startAngle
      let prevStartAngle

      const endAngle = this._arcEnd(opts.series[i])

      let prevEndAngle
      if (w.globals.dataChanged) {
        prevStartAngle = this.startAngle
        prevEndAngle = this._arcEnd(w.globals.previousPaths[i])
      }

      const angle = endAngle - startAngle

      // Claim-aware, on the same terms as the cartesian path in Graphics: a
      // plugin may have claimed this track's dash, and the caller's config is
      // left exactly as they wrote it. See weave/Claims.
      const dashArray = resolveClaimed(
        w,
        'stroke.dashArray',
        i,
        Array.isArray(w.config.stroke.dashArray)
          ? w.config.stroke.dashArray[i]
          : w.config.stroke.dashArray,
      )

      const morphFrom = morphActive
        ? this.ctx.morphTypeChange.getInitialPathFor(i, 0)
        : null

      // radialBar normally renders as fill=none + stroked-thick. But when
      // morphing FROM a fill-based shape (bar/pie/donut/polarArea), the
      // captured path is a closed FILLED shape — stroking it produces a
      // thick-outlined silhouette until the morph completes. So during the
      // morph, render this element in fill mode (matching the source's
      // appearance), then swap to the real stroked-arc styling in the
      // morph's .after() callback.
      const morphFromType = morphActive
        ? this.ctx.morphTypeChange.getFromType()
        : null
      // funnel + pyramid are Bar.js variants — same fill-based rendering as
      // a regular bar, so they take the same morph-from-filled treatment.
      const morphFromFilled =
        !!morphFrom &&
        (morphFromType === 'bar' ||
          morphFromType === 'funnel' ||
          morphFromType === 'pyramid' ||
          morphFromType === 'pie' ||
          morphFromType === 'donut' ||
          morphFromType === 'polarArea')

      const elPath = graphics.drawPath({
        d: morphFrom || '',
        stroke: morphFromFilled
          ? 'transparent'
          : opts.skipValueArc
            ? 'transparent'
            : pathFill,
        strokeWidth: morphFromFilled ? 0 : opts.skipValueArc ? 0 : strokeWidth,
        fill: morphFromFilled ? pathFill : 'none',
        fillOpacity: w.config.fill.opacity,
        classes: 'apexcharts-radialbar-area apexcharts-radialbar-slice-' + i,
        strokeDashArray: dashArray,
      })

      const radialMidAngle = startAngle + angle / 2
      const radialArcCenter = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        opts.size,
        radialMidAngle,
      )

      Graphics.setAttrs(elPath.node, {
        'data:angle': angle,
        'data:value': opts.series[i],
        'data:cx': radialArcCenter.x,
        'data:cy': radialArcCenter.y,
      })

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        filters.dropShadow(elPath, shadow, i)
      }
      filters.setSelectionFilter(elPath, 0, i)

      this.addListeners(elPath, this.radialDataLabels)

      elRadialBarArc.add(elPath)

      elPath.attr({
        index: 0,
        j: i,
      })

      if (this.barLabels.enabled) {
        const barStartCords = Utils.polarToCartesian(
          opts.centerX,
          opts.centerY,
          opts.size,
          startAngle,
        )
        const text = this.barLabels.formatter(w.seriesData.seriesNames[i], {
          seriesIndex: i,
          w,
        })
        const classes = ['apexcharts-radialbar-label']
        if (!this.barLabels.onClick) {
          classes.push('apexcharts-no-click')
        }

        let textColor = this.barLabels.useSeriesColors
          ? w.globals.colors[i]
          : w.config.chart.foreColor

        if (!textColor) {
          textColor = w.config.chart.foreColor
        }

        const x = barStartCords.x + this.barLabels.offsetX
        const y = barStartCords.y + this.barLabels.offsetY
        const elText = graphics.drawText({
          x,
          y,
          text,
          textAnchor: 'end',
          dominantBaseline: 'middle',
          fontFamily: this.barLabels.fontFamily,
          fontWeight: this.barLabels.fontWeight,
          fontSize: this.barLabels.fontSize,
          foreColor: textColor,
          cssClass: classes.join(' '),
        })

        elText.on('click', this.onBarLabelClick)

        elText.attr({
          rel: i + 1,
        })

        if (startAngle !== 0) {
          elText.attr({
            'transform-origin': `${x} ${y}`,
            transform: `rotate(${startAngle} 0 0)`,
          })
        }

        elRadialBarArc.add(elText)
      }

      let dur = 0
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = w.config.chart.animations.speed
      }

      // Pie's gate: a data change animates only while dynamicAnimation (and
      // animations as a whole) is on, or turning it off changed nothing here,
      // and only when the update asked to (an unanimated update captured no
      // previous values to move from).
      if (
        this.dynamicAnim &&
        w.globals.dataChanged &&
        w.globals.shouldAnimate
      ) {
        dur = w.config.chart.animations.dynamicAnimation.speed
      }
      this.animDur = dur / (opts.series.length * 1.2) + this.animDur
      this.animBeginArr.push(this.animDur)

      if (morphActive && morphFrom) {
        // Cross-type morph into radialBar ring. The final radialBar is a
        // stroked open arc (M+A only), but for sources whose appearance comes
        // from fill (pie/donut/polarArea), we morph d toward a CLOSED
        // donut-segment of the same geometry instead — visually identical to
        // the stroked arc when filled the same color — and swap to the real
        // stroked-arc styling once the morph settles. For other sources
        // (bar's stroked-rect → arc) the existing open-arc target works.
        const morphSpeed = this.ctx.morphTypeChange.getSpeed()
        const actualArcD = this.getPiePath({
          me: this,
          startAngle,
          angle,
          size: opts.size,
        })

        if (morphFromFilled) {
          const targetD = this.ctx.morphTypeChange.buildRingSegmentPath(
            opts.centerX,
            opts.centerY,
            opts.size,
            strokeWidth,
            startAngle,
            startAngle + angle,
          )
          elPath
            .animate(morphSpeed)
            .plot(targetD, 'polygons')
            .after(
              /** @this {any} */ function () {
                // Swap to the real radialBar rendering — visually identical
                // to the filled donut-segment, just stroked open arc.
                this.attr({
                  d: actualArcD,
                  fill: 'none',
                  stroke: opts.skipValueArc ? 'transparent' : pathFill,
                  'stroke-width': opts.skipValueArc ? 0 : strokeWidth,
                })
              },
            )
        } else {
          elPath
            .animate(morphSpeed)
            .plot(actualArcD, 'polygons')
            .attr({ 'stroke-width': strokeWidth })
        }
      } else {
        this.animatePaths(elPath, {
          centerX: opts.centerX,
          centerY: opts.centerY,
          endAngle,
          startAngle,
          prevEndAngle,
          prevStartAngle,
          size: opts.size,
          i,
          totalItems: 2,
          animBeginArr: this.animBeginArr,
          dur,
          shouldSetPrevPaths: true,
        })
      }
    }

    return {
      g,
      elHollow,
      dataLabels,
    }
  }

  /**
   * Where a ring's value arc ends for value `v`, in whole degrees: the value
   * as a fraction of the configured min/max domain (clamped, negatives read
   * as 0). Defaults (min: 0, max: 100) preserve the historical percentage
   * behavior; custom domains (e.g. min: 0, max: 240 for a speedometer) make
   * the filled arc honor the same domain as the needle, ticks, and threshold
   * bands. An arc that would close on itself stops just short.
   *
   * @param {any} v
   * @returns {number}
   */
  _arcEnd(v) {
    const rb = this.w.config.plotOptions.radialBar
    const min = typeof rb.min === 'number' ? rb.min : 0
    const max = typeof rb.max === 'number' ? rb.max : 100
    const f = Math.max(
      0,
      (Math.min(Math.max(Utils.negToZero(v), min), max) - min) /
        (max === min ? 1 : max - min),
    )
    const end = Math.round(this.totalAngle * f) + this.startAngle
    return Math.abs(end) + Math.abs(this.startAngle) > 360 ? end - 0.01 : end
  }

  /**
   * Map a domain value (between `min` and `max`) to the corresponding angle
   * in the gauge's `startAngle`..`endAngle` range. Values outside the
   * domain are clamped.
   *
   * @param {number} value
   * @returns {number}
   */
  _angleAtValue(value) {
    const rb = this.w.config.plotOptions.radialBar
    const min = typeof rb.min === 'number' ? rb.min : 0
    const max = typeof rb.max === 'number' ? rb.max : 100
    const safeMax = max === min ? min + 1 : max
    const clamped = Math.max(min, Math.min(safeMax, Number(value)))
    const t = (clamped - min) / (safeMax - min)
    return this.startAngle + t * (this.endAngle - this.startAngle)
  }

  /**
   * Build an SVG arc path from `startAngle` to `endAngle` at radius `r`
   * around `(cx, cy)`. Angles are in degrees, with 0° at the top.
   * Used by drawBands; mirrors the `M ... A ... ` form used elsewhere.
   *
   * @param {number} cx
   * @param {number} cy
   * @param {number} r
   * @param {number} startAngle
   * @param {number} endAngle
   * @returns {string}
   */
  _describeArc(cx, cy, r, startAngle, endAngle) {
    const start = Utils.polarToCartesian(cx, cy, r, endAngle)
    const end = Utils.polarToCartesian(cx, cy, r, startAngle)
    const sweep = endAngle - startAngle
    const largeArc = Math.abs(sweep) > 180 ? 1 : 0
    // sweepFlag: 0 = anti-clockwise from `end` to `start`, which together with
    // polarToCartesian's orientation produces a clockwise visual arc.
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
  }

  /**
   * Draw threshold bands as colored arc segments along the gauge arc.
   * Bands sit behind the value-arc and tick marks. Used for gauges that
   * indicate ranges like 0-30 critical / 30-70 warning / 70-100 healthy.
   *
   * @param {Record<string, any>} opts
   */
  drawBands(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const rb = w.config.plotOptions.radialBar
    const bands = rb.bands || []

    const g = graphics.group({
      class: 'apexcharts-gauge-bands',
    })

    // Mirror the size calculation drawArcs would apply for the first series
    // so bands sit on the same arc radius as the value arc.
    const strokeWidth = this.getStrokeWidth(opts)
    const radius = opts.size - strokeWidth / 2 - strokeWidth - this.margin

    const bandStroke =
      (strokeWidth * parseInt(rb.bandsStyle.strokeWidth, 10)) / 100
    const min = typeof rb.min === 'number' ? rb.min : 0
    const max = typeof rb.max === 'number' ? rb.max : 100
    const gapDeg =
      max === min
        ? 0
        : (rb.bandsStyle.gap || 0) *
          ((this.endAngle - this.startAngle) / (max - min))

    for (let b = 0; b < bands.length; b++) {
      const band = bands[b]
      if (band.from === undefined || band.to === undefined) continue
      const a1 = this._angleAtValue(band.from)
      const a2 = this._angleAtValue(band.to)
      const startA = Math.min(a1, a2) + gapDeg / 2
      const endA = Math.max(a1, a2) - gapDeg / 2
      if (endA - startA <= 0) continue

      const elBand = graphics.drawPath({
        d: this._describeArc(opts.centerX, opts.centerY, radius, startA, endA),
        stroke: band.color || '#ccc',
        strokeWidth: bandStroke,
        fill: 'none',
        strokeLinecap: rb.bandsStyle.linecap || 'butt',
        classes: 'apexcharts-gauge-band',
      })
      elBand.node.setAttribute('data-band-index', String(b))
      g.add(elBand)
    }

    return g
  }

  /**
   * Draw tick marks (major + minor) along the gauge arc, with optional
   * value labels at each major tick.
   *
   * @param {Record<string, any>} opts
   */
  drawTicks(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const rb = w.config.plotOptions.radialBar
    const ticks = rb.ticks
    const g = graphics.group({ class: 'apexcharts-gauge-ticks' })

    const strokeWidth = this.getStrokeWidth(opts)
    const radius = opts.size - strokeWidth / 2 - strokeWidth - this.margin

    const min = typeof rb.min === 'number' ? rb.min : 0
    const max = typeof rb.max === 'number' ? rb.max : 100

    const majorCount = Math.max(2, ticks.major?.count ?? 11)
    const minorCount = Math.max(0, ticks.minor?.count ?? 0)

    /**
     * @param {number} value
     * @param {Record<string, any>} cfg
     * @param {boolean} isMajor
     */
    const drawTickAt = (value, cfg, isMajor) => {
      const angle = this._angleAtValue(value)
      const length = cfg.length ?? 8
      const inner =
        cfg.placement === 'inside' ? radius - length : radius
      const outer =
        cfg.placement === 'inside' ? radius : radius + length
      const p1 = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        inner,
        angle,
      )
      const p2 = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        outer,
        angle,
      )
      const line = graphics.drawLine(
        p1.x,
        p1.y,
        p2.x,
        p2.y,
        cfg.color || (isMajor ? '#666' : '#999'),
        0,
        cfg.width || (isMajor ? 2 : 1),
      )
      g.add(line)

      if (isMajor && ticks.labels?.show) {
        const labelRadius =
          (cfg.placement === 'inside' ? inner : outer) +
          (cfg.placement === 'inside' ? -1 : 1) *
            (ticks.labels.offset ?? 6)
        const labelPos = Utils.polarToCartesian(
          opts.centerX,
          opts.centerY,
          labelRadius,
          angle,
        )
        const labelText =
          typeof ticks.labels.formatter === 'function'
            ? ticks.labels.formatter(value)
            : String(value)
        const elText = graphics.drawText({
          x: labelPos.x,
          y: labelPos.y,
          text: labelText,
          textAnchor: 'middle',
          dominantBaseline: 'middle',
          fontFamily: ticks.labels.fontFamily,
          fontSize: ticks.labels.fontSize,
          fontWeight: ticks.labels.fontWeight,
          foreColor: ticks.labels.color,
          cssClass: 'apexcharts-gauge-tick-label',
        })
        g.add(elText)
      }
    }

    for (let m = 0; m < majorCount; m++) {
      const t = m / (majorCount - 1)
      const value = min + t * (max - min)
      drawTickAt(value, ticks.major || {}, true)

      // Minor ticks fall between this major and the next.
      if (m < majorCount - 1 && minorCount > 0) {
        for (let n = 1; n <= minorCount; n++) {
          const tMinor = (m + n / (minorCount + 1)) / (majorCount - 1)
          const minorValue = min + tMinor * (max - min)
          drawTickAt(minorValue, ticks.minor || {}, false)
        }
      }
    }

    return g
  }

  /**
   * Draw a rotating needle pointing at the current series value. Only
   * called when `plotOptions.radialBar.shape === 'needle'`. The needle is
   * a tapered polygon inside a `<g>` whose rotation transform is animated
   * from `startAngle` to the value's angle.
   *
   * Renders a single needle for the first series value (gauge use case).
   * Additional series are ignored — drilled-down multi-series gauges are
   * out of scope for this iteration.
   *
   * @param {Record<string, any>} opts
   */
  drawNeedle(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const rb = w.config.plotOptions.radialBar
    const cfg = rb.needle || {}

    const g = graphics.group({ class: 'apexcharts-gauge-needle' })
    if (!opts.series || opts.series.length === 0) return g

    const color = cfg.color || '#333'
    const { path, cx, cy } = this.needlePath(opts, cfg)

    const elNeedle = graphics.drawPath({
      d: path,
      stroke: color,
      strokeWidth: 0,
      fill: color,
      classes: 'apexcharts-gauge-needle-shape',
    })
    g.add(elNeedle)

    // Rotate the whole group around the base point.
    const value = Number(opts.series[0])
    const targetAngle = this._angleAtValue(value)

    // Cache the previous angle on the chart instance so updateSeries can
    // tween from it. First update after mount tweens from `startAngle`.
    const ctx = /** @type {any} */ (this.ctx)
    const fromAngle =
      typeof ctx._lastNeedleAngle === 'number'
        ? ctx._lastNeedleAngle
        : this.startAngle
    ctx._lastNeedleAngle = targetAngle

    const motion = this.needleMotion()

    if (motion && fromAngle !== targetAngle) {
      const { speed, ease } = motion
      const node = g.node
      node.setAttribute('transform-origin', `${cx} ${cy}`)
      node.setAttribute('transform', `rotate(${fromAngle})`)

      // A previous render's needle tween may still be scheduled; cancel it so
      // we don't animate the old (now detached) needle alongside this one on a
      // rapid update.
      if (w.globals.radialNeedleRAF != null) {
        BrowserAPIs.cancelAnimationFrame(w.globals.radialNeedleRAF)
        w.globals.radialNeedleRAF = null
      }
      const startAt = performance.now()
      /** @param {number} now */
      const step = (now) => {
        // Stop animating a detached needle after the chart is destroyed
        // mid-tween (route change / re-render). Matches Animations.animatePop.
        if (this.w.globals.isDestroyed) {
          w.globals.radialNeedleRAF = null
          return
        }
        const t = Math.max(0, Math.min(1, (now - startAt) / speed))
        const angle = fromAngle + (targetAngle - fromAngle) * ease(t)
        node.setAttribute('transform', `rotate(${angle})`)
        if (t < 1) {
          w.globals.radialNeedleRAF = BrowserAPIs.requestAnimationFrame(step)
        } else {
          w.globals.radialNeedleRAF = null
        }
      }
      w.globals.radialNeedleRAF = BrowserAPIs.requestAnimationFrame(step)
    } else {
      g.attr({
        'transform-origin': `${cx} ${cy}`,
        transform: `rotate(${targetAngle})`,
      })
    }

    return g
  }

  /**
   * The needle as a tapered shape with a rounded (semi-circular) base,
   * pointing straight up (angle 0 in our polar system) from its base centre
   * (`cx`, `cy`): (centerX, centerY + cfg.offsetY). Rotate it around that
   * point to aim it.
   *
   * @param {Record<string, any>} opts the gauge's size, centre and series
   * @param {Record<string, any>} cfg length, baseWidth, tipWidth, offsetY
   * @returns {{path: string, cx: number, cy: number, length: number, baseW: number}}
   */
  needlePath(opts, cfg) {
    const strokeWidth = this.getStrokeWidth(opts)
    const arcRadius = opts.size - strokeWidth / 2 - strokeWidth - this.margin
    const length =
      typeof cfg.length === 'string' && cfg.length.endsWith('%')
        ? (arcRadius * parseInt(cfg.length, 10)) / 100
        : Number(cfg.length || arcRadius * 0.85)

    const baseW = cfg.baseWidth ?? 4
    const tipW = cfg.tipWidth ?? 1

    const cx = opts.centerX
    const cy = opts.centerY + Number(cfg.offsetY ?? 0)
    // Path: right base → semicircular arc clockwise around the base (bulges
    // below the baseline, giving a rounded "anchor" look) → left base → up
    // to left tip → across to right tip → close.
    const path =
      `M ${cx + baseW / 2} ${cy} ` +
      `A ${baseW / 2} ${baseW / 2} 0 0 1 ${cx - baseW / 2} ${cy} ` +
      `L ${cx - tipW / 2} ${cy - length} ` +
      `L ${cx + tipW / 2} ${cy - length} Z`
    return { path, cx, cy, length, baseW }
  }

  /**
   * How the needle moves this render: its speed and curve, or null when it
   * lands at once. Ease-out-back on initial mount (spring-loaded settle);
   * plain ease-out on data updates (no overshoot, feels mechanical,
   * instrument-like).
   *
   * @returns {{speed: number, ease: (t: number) => number} | null}
   */
  needleMotion() {
    const w = this.w
    const cfg = w.config.plotOptions.radialBar.needle || {}
    const isInitialMount =
      this.initialAnim && !w.globals.dataChanged && !w.globals.resized
    if (
      !(
        Environment.isBrowser() &&
        w.globals.shouldAnimate &&
        (isInitialMount || (this.dynamicAnim && w.globals.dataChanged))
      )
    ) {
      return null
    }
    const speed =
      (cfg.animation?.duration && Number(cfg.animation.duration)) ||
      (cfg.animationSpeed && Number(cfg.animationSpeed)) ||
      w.config.chart.animations.dynamicAnimation?.speed ||
      w.config.chart.animations.speed ||
      800
    const c1 = 1.70158
    const c3 = c1 + 1
    return {
      speed,
      ease: isInitialMount
        ? (/** @type {number} */ t) =>
            1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
        : (/** @type {number} */ t) => 1 - Math.pow(1 - t, 3),
    }
  }

  /**
   * @param {Record<string, any>} opts
   */
  drawHollow(opts) {
    const graphics = new Graphics(this.w)
    const hollow = this.w.config.plotOptions.radialBar.hollow

    const circle = graphics.drawCircle(opts.size * 2)

    /** @type {Record<string, any>} */
    const attrs = {
      class: 'apexcharts-radialbar-hollow',
      cx: opts.centerX,
      cy: opts.centerY,
      r: opts.size,
      fill: opts.fill,
    }
    // Optional stroke around the hollow ring — useful for indicator-style
    // gauges where the value text sits inside a dashed/dotted circle.
    if (hollow.stroke || hollow.strokeDasharray) {
      attrs.stroke = hollow.stroke || 'transparent'
      attrs['stroke-width'] = hollow.strokeWidth ?? 1
      if (hollow.strokeDasharray) {
        attrs['stroke-dasharray'] = hollow.strokeDasharray
      }
    }
    circle.attr(attrs)

    return circle
  }

  /**
   * @param {Record<string, any>} opts
   * @param {any} g
   * @param {number} hollowSize
   * @param {string} hollowFillID
   */
  drawHollowImage(opts, g, hollowSize, hollowFillID) {
    const w = this.w
    const fill = new Fill(this.w)

    const randID = Utils.randomId()
    const hollowFillImg = w.config.plotOptions.radialBar.hollow.image

    if (w.config.plotOptions.radialBar.hollow.imageClipped) {
      fill.clippedImgArea({
        width: hollowSize,
        height: hollowSize,
        image: hollowFillImg,
        patternID: `pattern${w.globals.cuid}${randID}`,
      })
      hollowFillID = `url(#pattern${w.globals.cuid}${randID})`
    } else {
      const imgWidth = w.config.plotOptions.radialBar.hollow.imageWidth
      const imgHeight = w.config.plotOptions.radialBar.hollow.imageHeight
      if (imgWidth === undefined && imgHeight === undefined) {
        /**
         * @param {Record<string, any>} loader
         */
        const image = w.dom.Paper.image(
          hollowFillImg,
          /** @this {any} */
          function (/** @type {Record<string, any>} */ loader) {
            this.move(
              opts.centerX -
                loader.width / 2 +
                w.config.plotOptions.radialBar.hollow.imageOffsetX,
              opts.centerY -
                loader.height / 2 +
                w.config.plotOptions.radialBar.hollow.imageOffsetY,
            )
          },
        )
        g.add(image)
      } else {
        const image = w.dom.Paper.image(
          hollowFillImg,
          /** @this {any} */ function () {
            this.move(
              opts.centerX -
                imgWidth / 2 +
                w.config.plotOptions.radialBar.hollow.imageOffsetX,
              opts.centerY -
                imgHeight / 2 +
                w.config.plotOptions.radialBar.hollow.imageOffsetY,
            )
            this.size(imgWidth, imgHeight)
          },
        )
        g.add(image)
      }
    }
    return hollowFillID
  }

  /**
   * @param {Record<string, any>} opts
   */
  getStrokeWidth(opts) {
    const w = this.w
    return (
      (opts.size *
        (100 - parseInt(w.config.plotOptions.radialBar.hollow.size, 10))) /
        100 /
        (opts.series.length + 1) -
      this.margin
    )
  }

  /**
   * @param {Event} e
   */
  onBarLabelClick(e) {
    const target = /** @type {Element} */ (e.target)
    const seriesIndex = parseInt(target.getAttribute('rel') ?? '', 10) - 1
    const legendClick = this.barLabels.onClick
    const w = this.w

    if (legendClick) {
      legendClick(w.seriesData.seriesNames[seriesIndex], { w, seriesIndex })
    }
  }
}

export default Radial
