// @ts-check
import Animations from '../modules/Animations'
import Fill from '../modules/Fill'
import Utils from '../utils/Utils'
import Graphics from '../modules/Graphics'
import Filters from '../modules/Filters'
import Scales from '../modules/Scales'
import Helpers from './common/circle/Helpers'
import { Environment } from '../utils/Environment'
import {
  roundedDonutSegmentPath,
  roundedPieSegmentPath,
  sharpDonutSegmentPath,
} from './common/arc/ArcPath'
/**
 * ApexCharts Pie Class for drawing Pie / Donut Charts.
 * @module Pie
 **/

/**
 * Slide of a clicked slice out of the pie, and fade of the hover outline band.
 * Both are CSS transitions rather than JS tweens: the slide only ever changes
 * a `transform` and the fade only an `opacity`, so the compositor can run them
 * without touching the path geometry. Applied inline (not from the stylesheet)
 * so a build served without apexcharts.css still animates, and still hides the
 * band by default.
 */
const SLICE_OFFSET_TRANSITION = 'transform 320ms cubic-bezier(0.25, 0.8, 0.3, 1)'
const HOVER_OUTLINE_TRANSITION = 'opacity 180ms ease-out'

class Pie {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx
    this.w = w

    this.chartType = this.w.config.chart.type

    this.initialAnim = this.w.config.chart.animations.enabled
    this.dynamicAnim =
      this.initialAnim &&
      this.w.config.chart.animations.dynamicAnimation.enabled

    this.animBeginArr = [0]
    this.animDur = 0

    this.donutDataLabels = this.w.config.plotOptions.pie.donut.labels

    this.lineColorArr =
      w.globals.stroke.colors !== undefined
        ? w.globals.stroke.colors
        : w.globals.colors

    this.defaultSize = Math.min(w.layout.gridWidth, w.layout.gridHeight)

    this.centerY = this.defaultSize / 2
    this.centerX = w.layout.gridWidth / 2

    if (w.config.chart.type === 'radialBar') {
      this.fullAngle = 360
    } else {
      this.fullAngle = Math.abs(
        w.config.plotOptions.pie.endAngle - w.config.plotOptions.pie.startAngle,
      )
    }
    this.initialAngle = w.config.plotOptions.pie.startAngle % this.fullAngle

    w.globals.radialSize =
      this.defaultSize / 2.05 -
      w.config.stroke.width -
      (!w.config.chart.sparkline.enabled ? w.config.chart.dropShadow.blur : 0)

    // Outer name labels (category name + leader line). Resolve config + the
    // font used for the names, then shrink the radius so the labels and their
    // connectors fit without clipping (see reserveExternalLabelSpace).
    this.externalCfg = w.config.plotOptions.pie.dataLabels.external
    const dlStyle = w.config.dataLabels.style
    this.externalLabelStyle = {
      fontSize: this.externalCfg.fontSize || dlStyle.fontSize,
      fontFamily: this.externalCfg.fontFamily || dlStyle.fontFamily,
      fontWeight: this.externalCfg.fontWeight || dlStyle.fontWeight,
    }
    /** @type {any[]} collected outer-label layout, drawn after de-overlap */
    this.externalLabels = []
    this.externalLabelMaxLines = 1
    this.externalLabelLineH = parseFloat(this.externalLabelStyle.fontSize) || 12
    w.globals.pieExternalLabelMarginY = 0

    // Outer name labels are only meaningful for pie/donut, where every slice
    // reaches the same outer edge. polarArea encodes value as the radial
    // length, so a rim-anchored leader line detaches from short slices and
    // reads like an axis label — skip it there.
    this.showExternalLabels = this.externalCfg.show && this.chartType !== 'polarArea'

    if (this.showExternalLabels && !w.globals.noData) {
      this.reserveExternalLabelSpace()
    }

    this.donutSize =
      (w.globals.radialSize *
        parseInt(w.config.plotOptions.pie.donut.size, 10)) /
      100

    const scaleSize = w.config.plotOptions.pie.customScale
    const halfW = w.layout.gridWidth / 2
    const halfH = w.layout.gridHeight / 2
    this.translateX = halfW - halfW * scaleSize
    this.translateY = halfH - halfH * scaleSize

    this.dataLabelsGroup = new Graphics(this.w).group({
      class: 'apexcharts-datalabels-group',
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${scaleSize})`,
    })

    this.maxY = 0
    /** @type {any} */
    /** @type {any[]} */
    this.sliceLabels = []
    /** @type {any} */
    this.sliceSizes = []
    // polarArea only: previous render's slice radii, so a data change can
    // animate the value channel (the radius) from where it was.
    /** @type {number[]} */
    this.prevSliceSizes = []

    // Everything that has to travel with a slice when it slides out of the pie
    // on click, keyed by slice index: its inner percentage label and its outer
    // name label (each drawn into its own group outside the slice's own group,
    // so they paint above every slice). See offsetSlice.
    /** @type {Record<number, SVGElement>} */
    this.sliceLabelGroups = {}
    /** @type {Record<number, SVGElement>} */
    this.externalLabelGroups = {}

    // The single band re-plotted around whichever slice is hovered, plus the
    // group holding it (created in drawArcs, kept empty until first hover).
    /** @type {any} */
    this.elHoverOutline = null
    /** @type {any} */
    this.elHoverOutlinePath = null
    /** @type {number} slice the band is currently traced around, -1 for none */
    this.hoverOutlineIndex = -1

    /** @type {any} */
    this.prevSectorAngleArr = [] // for dynamic animations
  }

  /**
   * The text shown in an outer (name) label for slice `i`. Applies the
   * user `name.formatter` if provided, otherwise the raw series name. The
   * formatter may return a string or an array of strings (one per line, e.g.
   * `[name, percent]`); normalize via `getExternalLabelLines`.
   * @param {number} i
   * @returns {string | string[]}
   */
  getExternalLabelText(i) {
    const w = this.w
    const name = w.seriesData.seriesNames[i]
    const fn = this.externalCfg.formatter
    if (typeof fn === 'function') {
      return fn(name, {
        seriesIndex: i,
        percent: w.globals.seriesPercent?.[i]?.[0],
        value: w.globals.seriesTotals?.[i],
        w,
      })
    }
    return name == null ? '' : `${name}`
  }

  /**
   * Outer label content for slice `i` normalized to an array of line strings.
   * Supports a formatter returning an array, or a string with `\n` separators.
   * @param {number} i
   * @returns {string[]}
   */
  getExternalLabelLines(i) {
    const raw = this.getExternalLabelText(i)
    const arr = Array.isArray(raw) ? raw : `${raw == null ? '' : raw}`.split('\n')
    return arr.map((l) => (l == null ? '' : `${l}`))
  }

  /**
   * Shrink the pie radius (and reposition its center) so outer name labels and
   * their connector lines fit inside the chart area without clipping. Stores
   * the reserved vertical band on `w.globals.pieExternalLabelMarginY` so
   * Core.resizeNonAxisCharts can grow the SVG height to match.
   */
  reserveExternalLabelSpace() {
    const w = this.w
    const helpers = new Helpers(w)

    // Labels may be multi-line (e.g. name + percent). Measure every line and
    // track the tallest label so the reserved bands fit a 2-line block etc.
    const lineSets = (w.seriesData.seriesNames || []).map((_, i) =>
      this.getExternalLabelLines(i),
    )
    const maxLabelWidth = helpers.getMaxLabelWidth(lineSets.flat(), {
      fontSize: this.externalLabelStyle.fontSize,
      fontFamily: this.externalLabelStyle.fontFamily,
    })
    this.externalLabelMaxLines = lineSets.reduce((m, s) => Math.max(m, s.length), 1)
    this.externalLabelLineH = Math.round(
      (parseFloat(this.externalLabelStyle.fontSize) || 12) * 1.35,
    )

    const cn = this.externalCfg.connector
    const blockHeight = this.externalLabelMaxLines * this.externalLabelLineH
    // horizontal band on each side: text + connector run/gap + breathing room
    const mh = maxLabelWidth + (cn.length || 0) + (cn.gap || 0) + 12
    // vertical band above/below: half the tallest label + connector gap + pad
    const mv = blockHeight / 2 + (cn.gap || 0) + 6

    const fitted = Math.min(
      w.globals.radialSize,
      w.layout.gridWidth / 2 - mh,
      w.layout.gridHeight / 2 - mv,
    )
    // never collapse below a sane floor for very long labels / tiny charts
    w.globals.radialSize = Math.max(fitted, this.defaultSize * 0.15)
    w.globals.pieExternalLabelMarginY = mv

    const heightStr = w.config.chart.height ? String(w.config.chart.height) : ''
    const userSetFixedHeight = heightStr !== '' && heightStr !== 'auto'

    // For a fixed / percent height the container is NOT resized to hug the pie
    // (Core.resizeNonAxisCharts returns early), so center within gridHeight.
    // For an auto height the container is grown to 2*(radius+mv), so place the
    // center one band below the top.
    this.centerY = userSetFixedHeight
      ? w.layout.gridHeight / 2
      : w.globals.radialSize + mv
  }

  /**
   * @param {any[]} series
   */
  draw(series) {
    const self = this
    const w = this.w

    const graphics = new Graphics(this.w)

    const elPie = graphics.group({
      class: 'apexcharts-pie',
    })

    if (w.globals.noData) return elPie

    let total = 0
    for (let k = 0; k < series.length; k++) {
      // CALCULATE THE TOTAL
      total += Utils.negToZero(series[k])
    }

    const sectorAngleArr = []

    // el to which series will be drawn
    const elSeries = graphics.group()

    // prevent division by zero error if there is no data
    if (total === 0) {
      total = 0.00001
    }

    /**
     * @param {number} m
     */
    series.forEach((m) => {
      this.maxY = Math.max(this.maxY, m)
    })

    // override maxY if user provided in config
    if (w.config.yaxis[0].max) {
      this.maxY = w.config.yaxis[0].max
    }

    if (w.config.grid.position === 'back' && this.chartType === 'polarArea') {
      this.drawPolarElements(elPie)
    }

    // polarArea divides the circle by COUNT, so a legend-collapsed series must
    // give its slot back: pie gets this for free (a collapsed value is 0, so
    // its value-proportional angle is 0), but an equal share per series.length
    // would leave a dead gap where the hidden slice was and render the rest of
    // the circle broken. Slots belong to the visible slices only.
    const collapsedIdx = w.globals.collapsedSeriesIndices || []
    let polarVisible = 1
    if (this.chartType === 'polarArea') {
      let visible = 0
      for (let k = 0; k < series.length; k++) {
        if (collapsedIdx.indexOf(k) === -1) visible++
      }
      polarVisible = Math.max(1, visible)
    }

    for (let i = 0; i < series.length; i++) {
      // CALCULATE THE ANGLES
      const angle = (this.fullAngle * Utils.negToZero(series[i])) / total
      sectorAngleArr.push(angle)

      if (this.chartType === 'polarArea') {
        sectorAngleArr[i] =
          collapsedIdx.indexOf(i) > -1 ? 0 : this.fullAngle / polarVisible
        // Floor the divisor: with grid.position:'front' the maxY reset runs
        // after this loop, so an all-zero series would divide by 0 here and push
        // NaN slice sizes into getPiePath (corrupt arcs). series[i] is 0 in that
        // case anyway, so a denom of 1 yields a 0-size slice.
        this.sliceSizes.push(
          (w.globals.radialSize * series[i]) / (this.maxY || 1),
        )
      } else {
        this.sliceSizes.push(w.globals.radialSize)
      }
    }

    // Skip the previous-angle reconstruction when a cross-type morph is
    // active: drawArcs will use the captured path directly via the morph
    // feature, so the per-angle interpolation here would just compute
    // garbage on previousPaths that came from a different chart family.
    const morphActive = this.ctx.morphTypeChange?.isActive() === true

    if (w.globals.dataChanged && !morphActive) {
      if (this.chartType === 'polarArea') {
        // polarArea angles are count-based, so the pie reconstruction below
        // (value-proportional) would fabricate previous angles that never
        // existed and every slice would sweep in from a wrong position. The
        // draw stashes its real angles; use them, or fall back to an equal
        // re-division when the stash cannot line up (e.g. the previous render
        // was a different chart type).
        const prevValues = w.globals.previousPaths
        const stash = w.globals.prevPolarAngles
        if (Array.isArray(stash) && stash.length === prevValues.length) {
          this.prevSectorAngleArr = stash.slice()
        } else {
          for (let i = 0; i < prevValues.length; i++) {
            this.prevSectorAngleArr.push(
              this.fullAngle / Math.max(1, prevValues.length),
            )
          }
        }

        // The radius is the value channel, so it must animate from where it
        // was, like a pie slice's angle does. Reconstruct the previous sizes
        // from the previous values on the same scale rule the draw uses.
        let prevMaxY = 0
        for (let k = 0; k < prevValues.length; k++) {
          prevMaxY = Math.max(prevMaxY, Utils.negToZero(prevValues[k]))
        }
        if (w.config.yaxis[0].max) {
          prevMaxY = w.config.yaxis[0].max
        }
        this.prevSliceSizes = prevValues.map(
          (/** @type {number} */ v) =>
            (w.globals.radialSize * Utils.negToZero(v)) / (prevMaxY || 1),
        )
      } else {
        let prevTotal = 0
        for (let k = 0; k < w.globals.previousPaths.length; k++) {
          // CALCULATE THE PREV TOTAL
          prevTotal += Utils.negToZero(w.globals.previousPaths[k])
        }

        let previousAngle

        for (let i = 0; i < w.globals.previousPaths.length; i++) {
          // CALCULATE THE PREVIOUS ANGLES
          previousAngle =
            (this.fullAngle * Utils.negToZero(w.globals.previousPaths[i])) /
            prevTotal
          this.prevSectorAngleArr.push(previousAngle)
        }
      }
    }

    if (this.chartType === 'polarArea') {
      // The stash the NEXT data-change animation will start from.
      w.globals.prevPolarAngles = sectorAngleArr.slice()
    }

    // on small chart size after few count of resizes browser window donutSize can be negative
    if (this.donutSize < 0) {
      this.donutSize = 0
    }

    if (this.chartType === 'donut') {
      // draw the inner circle and add some text to it
      const circle = graphics.drawCircle(this.donutSize)

      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: w.config.plotOptions.pie.donut.background
          ? w.config.plotOptions.pie.donut.background
          : 'transparent',
      })

      elSeries.add(circle)
    }

    const elG = self.drawArcs(sectorAngleArr, series)

    // add slice dataLabels at the end
    this.sliceLabels.forEach((s) => {
      elG.add(s)
    })

    elSeries.attr({
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${w.config.plotOptions.pie.customScale})`,
    })

    elSeries.add(elG)

    elPie.add(elSeries)

    if (this.donutDataLabels.show) {
      // On initial mount with animations enabled, the center label starts
      // hidden and fades in after the last slice finishes its sweep — so the
      // total/center value lands *with* the chart instead of before it.
      const shouldFadeInLabels =
        this.initialAnim &&
        !w.globals.resized &&
        !w.globals.dataChanged &&
        this.animDur > 0
      const dataLabels = this.renderInnerDataLabels(
        this.dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: shouldFadeInLabels ? 0 : this.donutDataLabels.show,
        },
      )

      if (shouldFadeInLabels) {
        const labelsNode = this.dataLabelsGroup.node
        labelsNode.style.transition = 'opacity 280ms ease-out'
        setTimeout(() => {
          labelsNode.style.opacity = '1'
        }, this.animDur)
      }

      elPie.add(dataLabels)
    }

    if (w.config.grid.position === 'front' && this.chartType === 'polarArea') {
      this.drawPolarElements(elPie)
    }

    return elPie
  }

  // core function for drawing pie arcs
  /**
   * @param {any[]} sectorAngleArr
   * @param {any[]} series
   */
  drawArcs(sectorAngleArr, series) {
    const w = this.w
    const filters = new Filters(this.w)

    const graphics = new Graphics(this.w)
    const fill = new Fill(this.w)
    const g = graphics.group({
      class: 'apexcharts-slices',
    })

    // First child of the slices group, so the hover band always paints *under*
    // the slices: its inner edge can then tuck below a rim without showing a
    // seam. Inert to the pointer, or a band lying over a slid-out slice would
    // steal that slice's hover and flicker the effect it belongs to.
    this.elHoverOutline = graphics.group({
      class: 'apexcharts-pie-hover-outline',
    })
    this.elHoverOutline.node.style.pointerEvents = 'none'
    this.elHoverOutline.node.style.opacity = '0'
    // The group owns the fade and nothing else. Any offset rides on the band
    // path inside it, so the two never have to be untangled from one another.
    if (w.config.chart.animations.enabled) {
      this.elHoverOutline.node.style.transition = HOVER_OUTLINE_TRANSITION
    }
    g.add(this.elHoverOutline)

    let startAngle = this.initialAngle
    let prevStartAngle = this.initialAngle
    let endAngle = this.initialAngle
    let prevEndAngle = this.initialAngle

    this.strokeWidth = w.config.stroke.show ? w.config.stroke.width : 0

    const morphActive = this.ctx.morphTypeChange?.isActive() === true

    for (let i = 0; i < sectorAngleArr.length; i++) {
      const elPieArc = graphics.group({
        class: `apexcharts-series apexcharts-pie-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        'data:realIndex': i,
      })

      g.add(elPieArc)

      startAngle = endAngle
      prevStartAngle = prevEndAngle

      endAngle = startAngle + sectorAngleArr[i]
      prevEndAngle = prevStartAngle + this.prevSectorAngleArr[i]

      const angle =
        endAngle < startAngle
          ? this.fullAngle + endAngle - startAngle
          : endAngle - startAngle

      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: this.sliceSizes[i],
        value: series[i],
      }) // additionally, pass size for gradient drawing in the fillPath function

      // For a cross-type morph, the initial path comes from the captured
      // outgoing snapshot (bar rect, radialBar arc, etc.). The SVGAnimation
      // .plot() chain below will interpolate that into the final pie path
      // via the existing morphPaths engine. Falls back to getChangedPath
      // for normal data-change updates when no morph is queued.
      const morphFrom = morphActive
        ? this.ctx.morphTypeChange.getInitialPathFor(i, 0)
        : null
      // polarArea's pre-animation frame must sit at the PREVIOUS radius too,
      // not just the previous angles: its radius is the value channel.
      const prevSize =
        this.chartType === 'polarArea' &&
        w.globals.dataChanged &&
        !morphActive
          ? this.prevSliceSizes[i] || 0
          : undefined
      const path =
        morphFrom || this.getChangedPath(prevStartAngle, prevEndAngle, prevSize)

      const elPath = graphics.drawPath({
        d: path,
        // Pie/donut/polarArea data is a single series, so a user-supplied
        // `stroke.colors` shorter than the slice count is NOT padded by the
        // theme engine (unlike fill colors, which cycle). Without this, only
        // slice 0 gets the requested color and the rest fall back to a grey
        // default. Cycle the array — matching fill-color behaviour — so a
        // single `stroke.colors: ['#fff']` borders every slice as expected.
        stroke: Array.isArray(this.lineColorArr)
          ? this.lineColorArr[i] ??
            this.lineColorArr[i % this.lineColorArr.length]
          : this.lineColorArr,
        strokeWidth: 0,
        fill: pathFill,
        fillOpacity: w.config.fill.opacity,
        classes: `apexcharts-pie-area apexcharts-${this.chartType.toLowerCase()}-slice-${i}`,
      })

      elPath.attr({
        index: 0,
        j: i,
      })

      filters.setSelectionFilter(elPath, 0, i)

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        filters.dropShadow(elPath, shadow, i)
      }

      this.addListeners(elPath, this.donutDataLabels, i)

      let labelPosition = {
        x: 0,
        y: 0,
      }

      const midAngle = (startAngle + angle / 2) % this.fullAngle
      let arcCenter = { x: this.centerX, y: this.centerY }

      if (this.chartType === 'pie' || this.chartType === 'polarArea') {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 1.25 +
            w.config.plotOptions.pie.dataLabels.offset,
          midAngle,
        )
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 2,
          midAngle,
        )
      } else if (this.chartType === 'donut') {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2 +
            w.config.plotOptions.pie.dataLabels.offset,
          midAngle,
        )
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2,
          midAngle,
        )
      }

      Graphics.setAttrs(elPath.node, {
        'data:angle': angle,
        'data:startAngle': startAngle,
        'data:strokeWidth': this.strokeWidth,
        'data:value': series[i],
        'data:cx': arcCenter.x,
        'data:cy': arcCenter.y,
      })

      elPieArc.add(elPath)

      // Animation code starts
      let dur = 0
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = (angle / this.fullAngle) * w.config.chart.animations.speed

        if (dur === 0) dur = 1
        this.animDur = dur + this.animDur
        this.animBeginArr.push(this.animDur)
      } else {
        this.animBeginArr.push(0)
      }

      if (morphActive && morphFrom) {
        // Cross-type morph: bypass the angle-based animateArc loop and let
        // SVGAnimation's morphPaths interpolate from the captured outgoing
        // path to the final pie/donut/polarArea arc directly.
        const targetD = this.getPiePath({
          me: this,
          startAngle,
          angle,
          size: this.sliceSizes[i],
        })
        const morphSpeed = this.ctx.morphTypeChange.getSpeed()
        const animations = this.ctx.animations
        elPath.node.setAttribute('data:pathOrig', targetD)
        const morphRunner = elPath
          .animate(morphSpeed)
          .plot(targetD, 'polygons')
          .attr({ 'stroke-width': this.strokeWidth })
        // The angle-based branches flag animationCompleted via animateArc; the
        // morph branch must do the same or w.globals.animationEnded stays false
        // after a cross-type morph. animationCompleted is idempotent, so firing
        // it per slice is safe.
        if (morphRunner && typeof morphRunner.after === 'function') {
          morphRunner.after(() => animations.animationCompleted(elPath))
        } else {
          animations.animationCompleted(elPath)
        }
      } else if (this.dynamicAnim && w.globals.dataChanged) {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          prevSize,
          endAngle,
          startAngle,
          prevStartAngle,
          prevEndAngle,
          animateStartingPos: true,
          i,
          animBeginArr: this.animBeginArr,
          shouldSetPrevPaths: true,
          dur: w.config.chart.animations.dynamicAnimation.speed,
        })
      } else {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          endAngle,
          startAngle,
          i,
          totalItems: sectorAngleArr.length - 1,
          animBeginArr: this.animBeginArr,
          dur,
        })
      }
      // animation code ends

      // One condition for "does a click move this slice", so the mouseup wiring
      // can never disagree with getExpandOffset about it (drilldown, polarArea
      // and expandOffset: 0 all land here).
      if (this.getExpandOffset() > 0) {
        elPath.node.addEventListener('mouseup', this.pieClicked.bind(this, i))
      } else if (i === 0 && Filters.drilldownBlocksSliceOffset(w)) {
        this.ctx.drilldown?.warnSliceOffsetDisabled()
      }

      if (
        typeof w.interact.selectedDataPoints[0] !== 'undefined' &&
        w.interact.selectedDataPoints[0].indexOf(i) > -1
      ) {
        // Defer the "pulled out" offset for pre-selected slices until after
        // the sweep finishes. Otherwise the slice translates while it's still
        // growing, which makes both motions hard to read. Parked instantly
        // rather than slid, since nobody clicked: a slice that is *already*
        // selected should just be where it belongs by the time it is seen.
        if (
          this.initialAnim &&
          !w.globals.resized &&
          !w.globals.dataChanged &&
          this.animDur > 0
        ) {
          const _this = this
          const _i = i
          setTimeout(() => _this.pieClicked(_i, { animate: false }), this.animDur)
        } else {
          this.pieClicked(i, { animate: false })
        }
      }

      if (w.config.dataLabels.enabled) {
        const xPos = labelPosition.x
        const yPos = labelPosition.y
        let text = (100 * angle) / this.fullAngle + '%'

        if (
          angle !== 0 &&
          w.config.plotOptions.pie.dataLabels.minAngleToShowLabel <
            sectorAngleArr[i]
        ) {
          const formatter = w.config.dataLabels.formatter
          if (formatter !== undefined) {
            text = formatter(w.globals.seriesPercent[i][0], {
              seriesIndex: i,
              w,
            })
          }
          const foreColor = w.globals.dataLabels.style.colors[i]

          const elPieLabelWrap = graphics.group({
            class: `apexcharts-datalabels`,
          })
          const elPieLabel = graphics.drawText({
            x: xPos,
            y: yPos,
            text,
            textAnchor: 'middle',
            fontSize: w.config.dataLabels.style.fontSize,
            fontFamily: w.config.dataLabels.style.fontFamily,
            fontWeight: w.config.dataLabels.style.fontWeight,
            foreColor,
          })

          elPieLabelWrap.add(elPieLabel)
          if (w.config.dataLabels.dropShadow.enabled) {
            const textShadow = w.config.dataLabels.dropShadow
            filters.dropShadow(elPieLabel, textShadow)
          }

          elPieLabel.node.classList.add('apexcharts-pie-label')
          if (
            w.config.chart.animations.animate &&
            w.globals.resized === false
          ) {
            elPieLabel.node.classList.add('apexcharts-pie-label-delay')
            elPieLabel.node.style.animationDelay =
              w.config.chart.animations.speed / 940 + 's'
          }

          this.sliceLabels.push(elPieLabelWrap)
          this.sliceLabelGroups[i] = elPieLabelWrap.node
        }
      }

      // Outer (name) label: collect geometry now, draw after the loop so the
      // de-overlap pass can space crowded labels before they hit the DOM.
      if (this.showExternalLabels && angle !== 0) {
        const lines = this.getExternalLabelLines(i)
        if (lines.some((l) => l !== '')) {
          const anchor = Utils.polarToCartesian(
            this.centerX,
            this.centerY,
            w.globals.radialSize,
            midAngle,
          )
          const elbow = Utils.polarToCartesian(
            this.centerX,
            this.centerY,
            w.globals.radialSize + (this.externalCfg.connector.gap || 0),
            midAngle,
          )
          const isRight = elbow.x >= this.centerX
          const baseLabelX = isRight
            ? elbow.x + (this.externalCfg.connector.length || 0)
            : elbow.x - (this.externalCfg.connector.length || 0)

          this.externalLabels.push({
            i,
            lines,
            anchor,
            elbow,
            side: isRight ? 'right' : 'left',
            labelX: baseLabelX + parseFloat(this.externalCfg.offsetX || 0),
            idealY: elbow.y + parseFloat(this.externalCfg.offsetY || 0),
            connectorColor: this.externalCfg.connector.color || w.globals.colors[i],
            foreColor: this.externalCfg.color || w.config.chart.foreColor,
          })
        }
      }
    }

    if (this.showExternalLabels && this.externalLabels.length) {
      this.placeExternalLabels()

      // External labels + connectors are overlays on top of the animated slice
      // sweep, so reveal them gradually once the sweep finishes instead of
      // popping in instantly — same mechanism as markers / data labels
      // (delayedElements + apexcharts-element-hidden, faded back in by
      // Animations.showDelayedElements on animationCompleted). Only arm this
      // when a sweep that actually fires animationCompleted will run — matching
      // the three animating branches below (morph, dynamic data-change, initial
      // mount). For resize / animations-off / SSR (no animationCompleted) the
      // labels must render visible so they don't stay stuck hidden.
      const revealOnAnimEnd =
        Environment.isBrowser() &&
        (morphActive ||
          (this.dynamicAnim && w.globals.dataChanged) ||
          (this.initialAnim && !w.globals.resized && !w.globals.dataChanged))

      this.externalLabels.forEach((lbl) => {
        const group = new Helpers(w).drawExternalLabel({
          lines: lbl.lines,
          lineHeight: this.externalLabelLineH,
          anchor: lbl.anchor,
          elbow: lbl.elbow,
          labelX: lbl.labelX,
          labelY: lbl.labelY,
          side: lbl.side,
          connector: {
            show: this.externalCfg.connector.show,
            width: this.externalCfg.connector.width,
            color: lbl.connectorColor,
          },
          style: this.externalLabelStyle,
          foreColor: lbl.foreColor,
        })

        if (revealOnAnimEnd) {
          group.node.classList.add('apexcharts-element-hidden')
          w.globals.delayedElements.push({ el: group.node })
        }

        // Ride along when the slice slides out: the connector is anchored on
        // the rim, so moving both by the same vector keeps it attached.
        this.externalLabelGroups[lbl.i] = group.node

        g.add(group)
      })
    }

    return g
  }

  /**
   * Vertical de-overlap for outer (name) labels: per side, sort by ideal y and
   * push neighbours apart so they keep at least one line-height of spacing.
   * Mutates each entry's `labelY`. Connector lines re-route to the moved y.
   */
  placeExternalLabels() {
    const w = this.w
    // Minimum spacing is a full label block (n lines) so multi-line labels
    // (e.g. name + percent) don't overlap their neighbours.
    const lineHeight = this.externalLabelMaxLines * this.externalLabelLineH + 2
    const maxY =
      this.centerY + w.globals.radialSize + w.globals.pieExternalLabelMarginY

    ;['left', 'right'].forEach((side) => {
      const items = this.externalLabels
        .filter((l) => l.side === side)
        .sort((a, b) => a.idealY - b.idealY)

      items.forEach((l) => {
        l.labelY = l.idealY
      })

      // forward pass: push each label down to keep the minimum gap
      for (let k = 1; k < items.length; k++) {
        if (items[k].labelY - items[k - 1].labelY < lineHeight) {
          items[k].labelY = items[k - 1].labelY + lineHeight
        }
      }

      // if the column ran past the bottom, pull it back up as a block
      const last = items[items.length - 1]
      const overflow = last ? last.labelY - maxY : 0
      if (overflow > 0) {
        for (let k = items.length - 1; k >= 0; k--) {
          items[k].labelY -= overflow
          if (
            k < items.length - 1 &&
            items[k + 1].labelY - items[k].labelY < lineHeight
          ) {
            items[k].labelY = items[k + 1].labelY - lineHeight
          }
        }
      }
    })
  }

  /**
   * @param {any} elPath
   * @param {Record<string, any>} dataLabels
   * @param {number} [i] slice index, for the hover outline band
   */
  addListeners(elPath, dataLabels, i) {
    const graphics = new Graphics(this.w, this.ctx)
    // append filters on mouseenter and mouseleave
    elPath.node.addEventListener(
      'mouseenter',
      graphics.pathMouseEnter.bind(graphics, elPath),
    )

    elPath.node.addEventListener(
      'mouseleave',
      graphics.pathMouseLeave.bind(graphics, elPath),
    )
    elPath.node.addEventListener(
      'mouseleave',
      this.revertDataLabelsInner.bind(this),
    )

    if (typeof i === 'number') {
      elPath.node.addEventListener(
        'mouseenter',
        this.showHoverOutline.bind(this, i),
      )
      elPath.node.addEventListener(
        'mouseleave',
        this.hideHoverOutline.bind(this),
      )
    }
    elPath.node.addEventListener(
      'mousedown',
      graphics.pathMouseDown.bind(graphics, elPath),
    )

    if (!this.donutDataLabels.total.showAlways) {
      elPath.node.addEventListener(
        'mouseenter',
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels),
      )

      elPath.node.addEventListener(
        'mousedown',
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels),
      )
    }
  }

  // This function can be used for other circle charts too
  /**
   * @param {any} el
   * @param {Record<string, any>} opts
   */
  animatePaths(el, opts) {
    const w = this.w
    const me = this

    let angle =
      opts.endAngle < opts.startAngle
        ? this.fullAngle + opts.endAngle - opts.startAngle
        : opts.endAngle - opts.startAngle
    let prevAngle = angle

    let fromStartAngle = opts.startAngle
    const toStartAngle = opts.startAngle

    if (opts.prevStartAngle !== undefined && opts.prevEndAngle !== undefined) {
      fromStartAngle = opts.prevEndAngle
      prevAngle =
        opts.prevEndAngle < opts.prevStartAngle
          ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle
          : opts.prevEndAngle - opts.prevStartAngle
    }
    if (opts.i === w.config.series.length - 1) {
      // some adjustments for the last overlapping paths
      if (angle + toStartAngle > this.fullAngle) {
        opts.endAngle = opts.endAngle - (angle + toStartAngle)
      } else if (angle + toStartAngle < this.fullAngle) {
        opts.endAngle =
          opts.endAngle + (this.fullAngle - (angle + toStartAngle))
      }
    }

    if (angle === this.fullAngle) angle = this.fullAngle - 0.01

    me.animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts)
  }

  /**
   * @param {any} el
   * @param {number} fromStartAngle
   * @param {number} toStartAngle
   * @param {number} angle
   * @param {number} prevAngle
   * @param {Record<string, any>} opts
   */
  animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts) {
    const me = this
    const w = this.w
    const animations = new Animations(this.w)

    const size = opts.size

    let path

    if (isNaN(fromStartAngle) || isNaN(prevAngle)) {
      fromStartAngle = toStartAngle
      prevAngle = angle
      opts.dur = 0
    }

    let currAngle = angle
    let startAngle = toStartAngle
    const fromAngle =
      fromStartAngle < toStartAngle
        ? this.fullAngle + fromStartAngle - toStartAngle
        : fromStartAngle - toStartAngle

    // polarArea animates its value channel, the radius; pie/donut never pass
    // prevSize (their radius is fixed) so this stays their exact old path.
    const hasPrevSize = typeof opts.prevSize === 'number'

    if (w.globals.dataChanged && opts.shouldSetPrevPaths) {
      // to avoid flicker when updating, set prev path first and then animate from there
      if (opts.prevEndAngle) {
        path = me.getPiePath({
          me,
          startAngle: opts.prevStartAngle,
          angle:
            opts.prevEndAngle < opts.prevStartAngle
              ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle
              : opts.prevEndAngle - opts.prevStartAngle,
          size: hasPrevSize ? opts.prevSize : size,
        })
        el.attr({ d: path })
      }
    }

    if (opts.dur !== 0) {
      el.animate(opts.dur, opts.animBeginArr[opts.i])
        .after(
          /** @this {any} */ function () {
            if (
              me.chartType === 'pie' ||
              me.chartType === 'donut' ||
              me.chartType === 'polarArea'
            ) {
              this.animate(
                w.config.chart.animations.dynamicAnimation.speed,
              ).attr({
                'stroke-width': me.strokeWidth,
              })
            }

            if (opts.i === w.config.series.length - 1) {
              animations.animationCompleted(el)
            }
          },
        )
        /**
         * @param {Record<string, any>} pos
         */
        .during((/** @type {any} */ pos) => {
          currAngle = fromAngle + (angle - fromAngle) * pos
          if (opts.animateStartingPos) {
            currAngle = prevAngle + (angle - prevAngle) * pos
            startAngle =
              fromStartAngle -
              prevAngle +
              (toStartAngle - (fromStartAngle - prevAngle)) * pos
          }

          path = me.getPiePath({
            me,
            startAngle,
            angle: currAngle,
            size: hasPrevSize
              ? opts.prevSize + (size - opts.prevSize) * pos
              : size,
          })

          el.node.setAttribute('data:pathOrig', path)

          el.attr({
            d: path,
          })
        })
    } else {
      path = me.getPiePath({
        me,
        startAngle,
        angle,
        size,
      })

      if (!opts.isTrack) {
        w.globals.animationEnded = true
      }
      el.node.setAttribute('data:pathOrig', path)

      el.attr({
        d: path,
        'stroke-width': me.strokeWidth,
      })
    }
  }

  /**
   * Toggle slice `i` in or out of the pie. Only one slice sits outside at a
   * time. Bound to `mouseup` on each slice, and also reached from the
   * `toggleDataPointSelection` API and from the pre-selected-slice pass in
   * drawArcs (which passes `animate: false` so the slice is already parked by
   * the time the first frame is painted).
   * @param {number} i
   * @param {{animate?: boolean}} [opts] a MouseEvent when called as a listener,
   *   which carries no `animate`, so real clicks animate
   */
  pieClicked(i, opts) {
    const w = this.w
    const me = this
    const animate = !(opts && opts.animate === false)
    const elPath = w.dom.Paper.findOne(
      `.apexcharts-${me.chartType.toLowerCase()}-slice-${i}`,
    )
    if (!elPath) return

    if (elPath.attr('data:pieClicked') === 'true') {
      elPath.attr({
        'data:pieClicked': 'false',
      })
      this.revertDataLabelsInner()
      this.offsetSlice(i, 0, animate)
      return
    }

    // Pull in whichever slice is currently out. Only slices actually marked out
    // are touched: an unconditional pass would write a transform onto every
    // slice, and (as it did when this restored `data:pathOrig` instead) fight
    // with a cross-type morph still animating the paths.
    const allEls = w.dom.baseEl.getElementsByClassName('apexcharts-pie-area')
    /**
     * @param {any} pieSlice
     */
    Array.prototype.forEach.call(allEls, (pieSlice) => {
      const wasOut = pieSlice.getAttribute('data:pieClicked') === 'true'
      pieSlice.setAttribute('data:pieClicked', 'false')
      if (wasOut) {
        this.offsetSlice(parseInt(pieSlice.getAttribute('j'), 10), 0, animate)
      }
    })
    w.interact.capturedDataPointIndex = i

    elPath.attr('data:pieClicked', 'true')
    this.offsetSlice(i, this.getExpandOffset(), animate)
  }

  /**
   * How far a clicked slice slides out, in px. 0 when the pull-out is off, when
   * drilldown owns the click, and always for polarArea: there the radius
   * encodes the value, so moving a slice outward would read as a bigger number.
   * @returns {number}
   */
  getExpandOffset() {
    const pie = this.w.config.plotOptions.pie
    if (!pie.expandOnClick || this.chartType === 'polarArea') return 0
    if (Filters.drilldownBlocksSliceOffset(this.w)) return 0
    const offset = Number(pie.expandOffset)
    return Number.isFinite(offset) && offset > 0 ? offset : 0
  }

  /**
   * Every node that has to travel with slice `i`: the slice path itself plus
   * its labels, which live in sibling groups so they paint above all slices.
   * @param {number} i
   * @returns {SVGElement[]}
   */
  getSliceMovers(i) {
    const elPath = this.w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`,
    )
    return [
      elPath ? elPath.node : null,
      this.sliceLabelGroups[i],
      this.externalLabelGroups[i],
      // The hover band, when it is this slice's: clicking a slice you are
      // hovering has to take its outline along, or the band is left behind
      // sitting in the gap the slice just opened.
      this.hoverOutlineIndex === i && this.elHoverOutlinePath
        ? this.elHoverOutlinePath.node
        : null,
    ].filter(Boolean)
  }

  /**
   * Slide slice `i` `dist` px out of the pie along its own mid-angle, or back
   * to its resting place when `dist` is 0.
   *
   * The slice is *translated*, never re-drawn: the arc keeps the exact radius
   * and span it had, so the pulled-out slice still encodes the same quantity
   * (growing the radius, as this used to, quietly inflates it) and a clean gap
   * opens between it and the rest of the pie.
   * @param {number} i
   * @param {number} dist
   * @param {boolean} [animate] false to park it instantly, with no transition
   */
  offsetSlice(i, dist, animate = true) {
    const w = this.w
    const elPath = w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`,
    )
    if (!elPath) return

    const { dx, dy } = this.getSliceOffsetVector(i, dist)
    // translate(0 0) rather than dropping the attribute: an attribute removal
    // is a computed-value jump to `none` in some engines, which skips the
    // transition on the way back in.
    const transform = `translate(${dx} ${dy})`
    const transition =
      animate && w.config.chart.animations.enabled ? SLICE_OFFSET_TRANSITION : ''

    this.getSliceMovers(i).forEach((node) => {
      // The `transform` presentation attribute maps onto the CSS transform
      // property, so a CSS transition on it animates the slide wherever SVG
      // CSS transforms are supported, and degrades to an instant move (the old
      // behaviour) where they are not.
      node.style.transition = transition
      node.setAttribute('transform', transform)
    })
  }

  /**
   * The px vector `dist` along slice `i`'s mid-angle. Zero for a slice that
   * fills the pie: there is no "outside" for it to move to, and sliding it
   * would just shift the whole chart sideways.
   * @param {number} i
   * @param {number} dist
   * @returns {{dx: number, dy: number}}
   */
  getSliceOffsetVector(i, dist) {
    const elPath = this.w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`,
    )
    const angle = elPath ? parseFloat(elPath.attr('data:angle')) : NaN
    if (!dist || !Number.isFinite(angle) || angle >= this.fullAngle) {
      return { dx: 0, dy: 0 }
    }
    const startAngle = parseFloat(elPath.attr('data:startAngle'))
    const midRad = (Math.PI * (startAngle + angle / 2 - 90)) / 180
    return { dx: dist * Math.cos(midRad), dy: dist * Math.sin(midRad) }
  }

  /**
   * Fade in the hover outline: a translucent band traced just outside the rim
   * of slice `i`, in the slice's own colour. It replaces lightening the slice
   * (see Filters.hoverOutlineOwnsHoverState) so a hovered slice keeps the
   * colour the legend and the data labels claim it has.
   * @param {number} i
   */
  showHoverOutline(i) {
    const w = this.w
    if (!Filters.hoverOutlineOwnsHoverState(w)) return
    if (!this.elHoverOutline) return

    const path = this.getHoverOutlinePath(i)
    if (!path) return

    const cfg = w.config.plotOptions.pie.hoverOutline
    const fill = cfg.color || w.globals.colors[i]
    // One band node, re-plotted per slice: sweeping across a pie then costs no
    // DOM churn, and the fade below stays a plain opacity transition.
    if (!this.elHoverOutlinePath) {
      const graphics = new Graphics(w)
      this.elHoverOutlinePath = graphics.drawPath({
        d: path,
        fill,
        strokeWidth: 0,
        classes: 'apexcharts-pie-hover-outline-band',
      })
      this.elHoverOutline.add(this.elHoverOutlinePath)
    }
    this.elHoverOutlinePath.attr({
      d: path,
      fill,
      'fill-opacity': cfg.opacity,
    })

    // The band belongs to the slice, so it has to sit at whatever offset that
    // slice is currently parked at (see offsetSlice). The offset rides on the
    // band path and the fade on the group above it, which keeps the two
    // independent: the band jumps to a newly hovered slice (no transition here)
    // but slides when the slice it is already on is clicked out.
    const { dx, dy } = this.getSliceOffsetVector(
      i,
      this.isSliceOut(i) ? this.getExpandOffset() : 0,
    )
    this.elHoverOutlinePath.node.style.transition = ''
    this.elHoverOutlinePath.node.setAttribute('transform', `translate(${dx} ${dy})`)
    this.hoverOutlineIndex = i

    this.elHoverOutline.node.style.opacity = '1'
  }

  /** Fade the hover outline back out, leaving the band node in place. */
  hideHoverOutline() {
    if (this.elHoverOutline) {
      this.elHoverOutline.node.style.opacity = '0'
    }
  }

  /** @param {number} i @returns {boolean} */
  isSliceOut(i) {
    const elPath = this.w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`,
    )
    return !!elPath && elPath.attr('data:pieClicked') === 'true'
  }

  /**
   * Band geometry for the hover outline of slice `i`: an annulus from the
   * slice rim (plus the stroke and the configured clearance) outward, over the
   * same angular extent the slice is actually drawn over, so it lines up with
   * both slice edges even with `spacing` insetting them. Rounded into a pill
   * when the band is thick enough for the fillets to fit.
   * @param {number} i
   * @returns {string | null}
   */
  getHoverOutlinePath(i) {
    const w = this.w
    const cfg = w.config.plotOptions.pie.hoverOutline
    const elPath = w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`,
    )
    if (!elPath) return null

    const angle = parseFloat(elPath.attr('data:angle'))
    if (!Number.isFinite(angle) || angle <= 0) return null

    const size = this.sliceSizes[i]
    const thickness = Number(cfg.size)
    if (!Number.isFinite(size) || !Number.isFinite(thickness) || thickness <= 0) {
      return null
    }

    const { startDeg, spanDeg } = this.getSliceExtent({
      me: this,
      startAngle: parseFloat(elPath.attr('data:startAngle')),
      angle,
      size,
    })
    if (!(spanDeg > 0)) return null

    // Half the stroke, not all of it: the slice stroke is centred on the rim,
    // so only half of it sits outside. Adding the full width pushed the band a
    // stroke-width further out than the configured gap asked for.
    const rIn = size + (this.strokeWidth || 0) / 2 + (Number(cfg.gap) || 0)
    const rOut = rIn + thickness
    const geo = {
      cx: this.centerX,
      cy: this.centerY,
      rIn,
      rOut,
      a0: startDeg,
      a1: startDeg + spanDeg,
      spanDeg,
    }

    // Pill ends read as deliberate; square ends on a thin band read as a
    // clipping artifact. Bounded by the inner arc length so the two fillets
    // never cross on a narrow slice.
    const r = Math.min(thickness / 2, ((spanDeg * Math.PI) / 180 / 2) * rIn)
    return r > 0.5
      ? roundedDonutSegmentPath({ ...geo, r })
      : sharpDonutSegmentPath(geo)
  }

  /**
   * @param {number} prevStartAngle
   * @param {number} prevEndAngle
   */
  /**
   * @param {number} prevStartAngle
   * @param {number} prevEndAngle
   * @param {number} [prevSize] - polarArea passes its previous slice radius,
   *   so the pre-animation frame sits at the previous VALUE too, not just the
   *   previous angles.
   */
  getChangedPath(prevStartAngle, prevEndAngle, prevSize) {
    let path = ''
    if (this.dynamicAnim && this.w.globals.dataChanged) {
      path = this.getPiePath({
        me: this,
        startAngle: prevStartAngle,
        angle: prevEndAngle - prevStartAngle,
        // @ts-ignore — size is set dynamically during draw()
        size: typeof prevSize === 'number' ? prevSize : this.size,
      })
    }
    return path
  }

  /**
   * The angular extent a slice is actually drawn over: the raw start / span
   * clamped so a full circle never overlaps itself, then inset by
   * `plotOptions.pie.spacing`. Shared by getPiePath and the hover outline, so
   * the band lines up with the slice edges instead of with the un-inset angles
   * cached on the path node.
   * @param {{me: any, startAngle: number, angle: number, size: number}} opts
   * @returns {{startDeg: number, spanDeg: number, endDeg: number}}
   */
  getSliceExtent({ me, startAngle, angle, size }) {
    const w = this.w

    let startDeg = startAngle

    let endDeg = angle + startAngle
    // prevent overlap
    if (
      Math.ceil(endDeg) >=
      this.fullAngle +
        (this.w.config.plotOptions.pie.startAngle % this.fullAngle)
    ) {
      endDeg =
        this.fullAngle +
        (this.w.config.plotOptions.pie.startAngle % this.fullAngle) -
        0.01
    }

    // Clamped angular span (magnitude, in degrees) before wrapping endDeg into
    // [0, fullAngle]. Both builders below derive their geometry from this.
    let spanDeg = endDeg - startDeg

    const isSliceType =
      me.chartType === 'pie' ||
      me.chartType === 'donut' ||
      me.chartType === 'polarArea'

    // Inter-slice spacing (plotOptions.pie.spacing, in px) for pie / donut /
    // polarArea. Inset both edges symmetrically so the slice mid-angle (and
    // therefore its data label and hit region) is preserved. The px gap is
    // measured at the mid-ring radius for donut, or the outer radius otherwise.
    const spacing = w.config.plotOptions.pie.spacing
    if (isSliceType && spacing > 0 && spanDeg > 0) {
      const rRef = me.chartType === 'donut' ? (size + me.donutSize) / 2 : size
      const gapDeg = rRef > 0 ? (spacing / rRef) * (180 / Math.PI) : 0
      // never collapse the slice: keep at least a ~1deg sliver
      const inset = Math.min(gapDeg / 2, Math.max(0, spanDeg / 2 - 0.5))
      startDeg += inset
      spanDeg -= 2 * inset
    }

    // Recompute endDeg from the (possibly inset) start/span, then wrap into
    // [0, fullAngle] for the point math below.
    endDeg = startDeg + spanDeg
    if (Math.ceil(endDeg) > this.fullAngle) endDeg -= this.fullAngle

    return { startDeg, spanDeg, endDeg }
  }

  /** @param {{me: any, startAngle: any, angle: any, size: any}} opts */
  getPiePath({ me, startAngle, angle, size }) {
    let path
    const w = this.w
    const graphics = new Graphics(this.w)

    const { startDeg, spanDeg, endDeg } = this.getSliceExtent({
      me,
      startAngle,
      angle,
      size,
    })

    const isSliceType =
      me.chartType === 'pie' ||
      me.chartType === 'donut' ||
      me.chartType === 'polarArea'

    const startRadians = (Math.PI * (startDeg - 90)) / 180

    // Rounded slice corners (plotOptions.pie.borderRadius). Returns null when
    // the slice is too small to round, in which case we fall through to the
    // regular sharp-corner path below.
    const borderRadius = w.config.plotOptions.pie.borderRadius
    if (borderRadius > 0 && isSliceType) {
      const roundedPath = this.getRoundedSlicePath({
        me,
        startDeg,
        spanDeg,
        size,
        borderRadius,
      })
      if (roundedPath) return roundedPath
    }

    const endRadians = (Math.PI * (endDeg - 90)) / 180

    const x1 = me.centerX + size * Math.cos(startRadians)
    const y1 = me.centerY + size * Math.sin(startRadians)
    const x2 = me.centerX + size * Math.cos(endRadians)
    const y2 = me.centerY + size * Math.sin(endRadians)

    const startInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      endDeg,
    )
    const endInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      startDeg,
    )

    const largeArc = spanDeg > 180 ? 1 : 0

    const pathBeginning = ['M', x1, y1, 'A', size, size, 0, largeArc, 1, x2, y2]

    if (me.chartType === 'donut') {
      path = [
        ...pathBeginning,
        'L',
        startInner.x,
        startInner.y,
        'A',
        me.donutSize,
        me.donutSize,
        0,
        largeArc,
        0,
        endInner.x,
        endInner.y,
        'L',
        x1,
        y1,
        'z',
      ].join(' ')
    } else if (me.chartType === 'pie' || me.chartType === 'polarArea') {
      path = [...pathBeginning, 'L', me.centerX, me.centerY, 'L', x1, y1].join(
        ' ',
      )
    } else {
      path = [...pathBeginning].join(' ')
    }

    return graphics.roundPathCorners(path, this.strokeWidth * 2)
  }

  /**
   * Build a slice path with rounded corners (plotOptions.pie.borderRadius).
   *
   * The generic roundPathCorners() only rounds line->line joins, but a slice
   * corner is an arc<->line join, so we construct the fillets explicitly here:
   * every corner is inset by the (clamped) radius along both the arc and the
   * radial edge, and a quadratic Bezier with its control point at the original
   * sharp corner bridges the two inset points. Donut slices round all four
   * corners; pie / polarArea slices round the two outer corners and keep the
   * center apex sharp.
   *
   * Returns null when the slice is too small to round meaningfully, so the
   * caller can fall back to a sharp-corner path.
   *
   * @param {{me: any, startDeg: number, spanDeg: number, size: number, borderRadius: number}} opts
   * @returns {string | null}
   */
  getRoundedSlicePath({ me, startDeg, spanDeg, size, borderRadius }) {
    if (!(spanDeg > 0)) return null

    const D2R = Math.PI / 180
    const cx = me.centerX
    const cy = me.centerY
    const isDonut = me.chartType === 'donut'
    const rOut = size
    const rIn = isDonut ? me.donutSize : 0

    const spanRad = spanDeg * D2R

    // Clamp the radius so opposing corner fillets never cross: bounded by the
    // room available along each arc and across the radial thickness.
    let r = borderRadius
    r = Math.min(r, (spanRad * rOut) / 2) // outer arc room
    if (isDonut) {
      r = Math.min(r, (spanRad * rIn) / 2) // inner arc room (tighter)
      r = Math.min(r, (rOut - rIn) / 2) // radial thickness
    } else {
      r = Math.min(r, rOut / 2)
    }
    if (!(r > 0.5)) return null

    const a0 = startDeg
    const a1 = startDeg + spanDeg

    if (isDonut) {
      return roundedDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, r, spanDeg })
    }

    // pie / polarArea: round the two outer corners, keep the center apex sharp
    return roundedPieSegmentPath({ cx, cy, rOut, a0, a1, r, spanDeg })
  }

  /**
   * @param {any} parent
   */
  drawPolarElements(parent) {
    const w = this.w
    const scale = new Scales(this.w)
    const graphics = new Graphics(this.w)
    const helpers = new Helpers(this.w)

    const gCircles = graphics.group()
    const gYAxis = graphics.group()

    const yScale = scale.niceScale(0, Math.ceil(this.maxY), 0)

    const yTexts = yScale.result.reverse()
    const len = yScale.result.length

    this.maxY = yScale.niceMax

    let circleSize = w.globals.radialSize
    const diff = circleSize / (len - 1)

    for (let i = 0; i < len - 1; i++) {
      const circle = graphics.drawCircle(circleSize)

      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: 'none',
        'stroke-width': w.config.plotOptions.polarArea.rings.strokeWidth,
        stroke: w.config.plotOptions.polarArea.rings.strokeColor,
      })

      if (w.config.yaxis[0].show) {
        const yLabel = helpers.drawYAxisTexts(
          this.centerX,
          this.centerY -
            circleSize +
            parseInt(w.config.yaxis[0].labels.style.fontSize, 10) / 2,
          i,
          yTexts[i],
        )

        gYAxis.add(yLabel)
      }

      gCircles.add(circle)

      circleSize = circleSize - diff
    }

    this.drawSpokes(parent)

    parent.add(gCircles)
    parent.add(gYAxis)
  }

  /**
   * @param {any} dataLabelsGroup
   * @param {Record<string, any>} dataLabelsConfig
   * @param {Record<string, any>} opts
   */
  renderInnerDataLabels(dataLabelsGroup, dataLabelsConfig, opts) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const showTotal = dataLabelsConfig.total.show

    dataLabelsGroup.node.innerHTML = ''
    dataLabelsGroup.node.style.opacity = opts.opacity

    const x = opts.centerX
    const y = !this.donutDataLabels.total.label
      ? opts.centerY - opts.centerY / 6
      : opts.centerY

    let labelColor, valueColor

    if (dataLabelsConfig.name.color === undefined) {
      labelColor = w.globals.colors[0]
    } else {
      labelColor = dataLabelsConfig.name.color
    }
    let labelFontSize = dataLabelsConfig.name.fontSize
    let labelFontFamily = dataLabelsConfig.name.fontFamily
    let labelFontWeight = dataLabelsConfig.name.fontWeight

    if (dataLabelsConfig.value.color === undefined) {
      valueColor = w.config.chart.foreColor
    } else {
      valueColor = dataLabelsConfig.value.color
    }

    const lbFormatter = dataLabelsConfig.value.formatter
    let val = ''
    let name = ''

    if (showTotal) {
      labelColor = dataLabelsConfig.total.color
      labelFontSize = dataLabelsConfig.total.fontSize
      labelFontFamily = dataLabelsConfig.total.fontFamily
      labelFontWeight = dataLabelsConfig.total.fontWeight
      name = !this.donutDataLabels.total.label
        ? ''
        : dataLabelsConfig.total.label
      val = dataLabelsConfig.total.formatter(w)
    } else {
      if (w.seriesData.series.length === 1) {
        val = lbFormatter(w.seriesData.series[0], w)
        name = w.seriesData.seriesNames[0]
      }
    }

    if (name) {
      name = dataLabelsConfig.name.formatter(
        name,
        dataLabelsConfig.total.show,
        w,
      )
    }

    if (dataLabelsConfig.name.show) {
      const elLabel = graphics.drawText({
        x,
        y: y + parseFloat(dataLabelsConfig.name.offsetY),
        text: name,
        textAnchor: 'middle',
        foreColor: labelColor,
        fontSize: labelFontSize,
        fontWeight: labelFontWeight,
        fontFamily: labelFontFamily,
      })
      elLabel.node.classList.add('apexcharts-datalabel-label')
      dataLabelsGroup.add(elLabel)
    }

    if (dataLabelsConfig.value.show) {
      const valOffset = dataLabelsConfig.name.show
        ? parseFloat(dataLabelsConfig.value.offsetY) + 16
        : dataLabelsConfig.value.offsetY

      const elValue = graphics.drawText({
        x,
        y: y + valOffset,
        text: val,
        textAnchor: 'middle',
        foreColor: valueColor,
        fontWeight: dataLabelsConfig.value.fontWeight,
        fontSize: dataLabelsConfig.value.fontSize,
        fontFamily: dataLabelsConfig.value.fontFamily,
      })
      elValue.node.classList.add('apexcharts-datalabel-value')
      dataLabelsGroup.add(elValue)
    }

    // for a multi-series circle chart, we need to show total value instead of first series labels

    return dataLabelsGroup
  }

  /**
   *
   * @param {string} name - The name of the series
   * @param {string} val - The value of that series
   * @param {any} el - Optional el (indicates which series was hovered/clicked). If this param is not present, means we need to show total
   * @param {Record<string, any>} labelsConfig
   */
  printInnerLabels(labelsConfig, name, val, el) {
    const w = this.w

    let labelColor

    if (el) {
      if (labelsConfig.name.color === undefined) {
        labelColor =
          w.globals.colors[parseInt(el.parentNode.getAttribute('rel'), 10) - 1]
      } else {
        labelColor = labelsConfig.name.color
      }
    } else {
      if (w.seriesData.series.length > 1 && labelsConfig.total.show) {
        labelColor = labelsConfig.total.color
      }
    }

    const elLabel = w.dom.baseEl.querySelector('.apexcharts-datalabel-label')
    const elValue = w.dom.baseEl.querySelector('.apexcharts-datalabel-value')

    const lbFormatter = labelsConfig.value.formatter
    val = lbFormatter(val, w)

    // we need to show Total Val - so get the formatter of it
    if (!el && typeof labelsConfig.total.formatter === 'function') {
      val = labelsConfig.total.formatter(w)
    }

    const isTotal = name === labelsConfig.total.label
    name = !this.donutDataLabels.total.label
      ? ''
      : labelsConfig.name.formatter(name, isTotal, w)

    if (elLabel !== null) {
      elLabel.textContent = name
    }

    if (elValue !== null) {
      elValue.textContent = val
    }
    if (elLabel !== null) {
      const elLabelEl = /** @type {HTMLElement} */ (elLabel)
      elLabelEl.style.fill = labelColor
    }
  }

  /**
   * @param {any} el
   * @param {Record<string, any>} dataLabelsConfig
   */
  printDataLabelsInner(el, dataLabelsConfig) {
    const w = this.w

    const val = el.getAttribute('data:value')
    const name =
      w.seriesData.seriesNames[
        parseInt(el.parentNode.getAttribute('rel'), 10) - 1
      ]

    if (w.seriesData.series.length > 1) {
      this.printInnerLabels(dataLabelsConfig, name, val, el)
    }

    const dataLabelsGroup = w.dom.baseEl.querySelector(
      '.apexcharts-datalabels-group',
    )
    if (dataLabelsGroup !== null) {
      const dataLabelsGroupEl = /** @type {HTMLElement} */ (dataLabelsGroup)
      dataLabelsGroupEl.style.opacity = '1'
    }
  }

  /**
   * @param {any} parent
   */
  drawSpokes(parent) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const spokeConfig = w.config.plotOptions.polarArea.spokes

    if (spokeConfig.strokeWidth === 0) return

    const spokes = []

    const angleDivision = 360 / w.seriesData.series.length
    for (let i = 0; i < w.seriesData.series.length; i++) {
      spokes.push(
        Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize,
          w.config.plotOptions.pie.startAngle + angleDivision * i,
        ),
      )
    }

    spokes.forEach((p, i) => {
      const line = graphics.drawLine(
        p.x,
        p.y,
        this.centerX,
        this.centerY,
        Array.isArray(spokeConfig.connectorColors)
          ? spokeConfig.connectorColors[i]
          : spokeConfig.connectorColors,
      )

      parent.add(line)
    })
  }

  revertDataLabelsInner() {
    const w = this.w
    if (this.donutDataLabels.show) {
      const dataLabelsGroup = w.dom.Paper.findOne(
        `.apexcharts-datalabels-group`,
      )

      const dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: this.donutDataLabels.show,
        },
      )

      const elPie = w.dom.Paper.findOne(
        '.apexcharts-radialbar, .apexcharts-pie',
      )
      elPie.add(dataLabels)
    }
  }
}

export default Pie
