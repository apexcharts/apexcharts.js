// @ts-check
import Scatter from './../charts/Scatter'
import Graphics from './Graphics'
import Filters from './Filters'
import { applyProgressiveReveal } from './Animations'
import { resolveDataLabelOffset } from './helpers/DataLabelOffset'
import { resolveLabelOverlaps } from './helpers/DataLabelOverlap'
import { resolveClaimed } from './weave/Claims'

/**
 * ApexCharts DataLabels Class for drawing dataLabels on Axes based Charts.
 *
 * @module DataLabels
 **/

// Types that place labels around a centre rather than along a value axis. See
// DataLabels.avoidOverlaps.
const RADIAL_TYPES = ['radar', 'pie', 'donut', 'polarArea', 'radialBar']

class DataLabels {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext | null} ctx
   */
  constructor(w, ctx = null) {
    this.w = w
    this.ctx = ctx // only used for new Scatter(w, ctx) in bubble chart path
  }

  // When there are many datalabels to be printed, and some of them overlaps each other in the same series, this method will take care of that
  // Also, when datalabels exceeds the drawable area and get clipped off, we need to adjust and move some pixels to make them visible again
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} val
   * @param {number} i
   * @param {number} dataPointIndex
   * @param {boolean} alwaysDrawDataLabel
   * @param {string} fontSize
   */
  dataLabelsCorrection(
    x,
    y,
    val,
    i,
    dataPointIndex,
    alwaysDrawDataLabel,
    fontSize,
  ) {
    const w = this.w
    const graphics = new Graphics(this.w)
    let drawnextLabel = false //

    const textRects = /** @type {any} */ (graphics).getTextRects(val, fontSize)
    const width = textRects.width
    const height = textRects.height

    if (y < 0) y = 0
    if (y > w.layout.gridHeight + height) y = w.layout.gridHeight + height / 2

    // first value in series, so push an empty array
    if (
      typeof /** @type {any} */ (w.globals).dataLabelsRects[i] === 'undefined'
    ) {
      ;/** @type {any} */ (w.globals).dataLabelsRects[i] = []
    }

    // then start pushing actual rects in that sub-array
    ;/** @type {any} */ (w.globals).dataLabelsRects[i].push({
      x,
      y,
      width,
      height,
    })

    const len = /** @type {any} */ (w.globals).dataLabelsRects[i].length - 2
    const lastDrawnIndex =
      typeof w.globals.lastDrawnDataLabelsIndexes[i] !== 'undefined'
        ? w.globals.lastDrawnDataLabelsIndexes[i][
            w.globals.lastDrawnDataLabelsIndexes[i].length - 1
          ]
        : 0

    if (
      typeof (/** @type {any} */ (w.globals.dataLabelsRects[i])[len]) !==
      'undefined'
    ) {
      const lastDataLabelRect = /** @type {any} */ (
        w.globals.dataLabelsRects[i]
      )[lastDrawnIndex]
      if (
        // next label forward and x not intersecting
        x > lastDataLabelRect.x + lastDataLabelRect.width ||
        y > lastDataLabelRect.y + lastDataLabelRect.height ||
        y + height < lastDataLabelRect.y ||
        x + width < lastDataLabelRect.x // next label is going to be drawn backwards
      ) {
        // the 2 indexes don't override, so OK to draw next label
        drawnextLabel = true
      }
    }

    if (dataPointIndex === 0 || alwaysDrawDataLabel) {
      drawnextLabel = true
    }

    return {
      x,
      y,
      textRects,
      drawnextLabel,
    }
  }

  /** @param {{type: any, pos: any, i: any, j: any, isRangeStart: any, strokeWidth?: any}} opts */
  drawDataLabel({ type, pos, i, j, isRangeStart, strokeWidth = 2 }) {
    // this method handles line, area, bubble, scatter charts as those charts contains markers/points which have pre-defined x/y positions
    // all other charts like radar / bars / heatmaps will define their own drawDataLabel routine
    const w = this.w

    const graphics = new Graphics(this.w)

    const dataLabelsConfig = w.config.dataLabels

    let x = 0
    let y = 0

    let dataPointIndex = j

    let elDataLabelsWrap = null

    const seriesCollapsed = w.globals.collapsedSeriesIndices.indexOf(i) !== -1

    if (seriesCollapsed || !dataLabelsConfig.enabled || !Array.isArray(pos.x)) {
      return elDataLabelsWrap
    }

    elDataLabelsWrap = graphics.group({
      class: 'apexcharts-data-labels',
    })

    for (let q = 0; q < pos.x.length; q++) {
      // a small hack as we have 2 points for the first val to connect it.
      // resolved before the offsets below, which are keyed by data point
      if (j === 1 && q === 0) dataPointIndex = 0
      if (j === 1 && q === 1) dataPointIndex = 1

      x =
        pos.x[q] +
        resolveDataLabelOffset(dataLabelsConfig.offsetX, w, i, dataPointIndex)
      y =
        pos.y[q] +
        resolveDataLabelOffset(dataLabelsConfig.offsetY, w, i, dataPointIndex) +
        strokeWidth

      if (!isNaN(x)) {
        let val = w.seriesData.series[i][dataPointIndex]

        if (type === 'rangeArea') {
          if (isRangeStart) {
            val = w.rangeData.seriesRangeStart[i][dataPointIndex]
          } else {
            val = w.rangeData.seriesRangeEnd[i][dataPointIndex]
          }
        }

        let text = ''

        /**
         * @param {any} v
         */
        const getText = (v) => {
          return w.config.dataLabels.formatter(v, {
            seriesIndex: i,
            dataPointIndex,
            w,
          })
        }

        if (w.config.chart.type === 'bubble') {
          val = w.seriesData.seriesZ[i][dataPointIndex]
          text = getText(val)

          y = pos.y[q]
          const scatter = new Scatter(
            this.w,
            /** @type {import('../types/internal').ChartContext} */ (this.ctx),
          )
          const centerTextInBubbleCoords = scatter.centerTextInBubble(y)
          y = centerTextInBubbleCoords.y
        } else {
          if (typeof val !== 'undefined') {
            text = getText(val)
          }
        }

        let textAnchor = w.config.dataLabels.textAnchor

        if (w.globals.isSlopeChart) {
          if (dataPointIndex === 0) {
            textAnchor = 'end'
          } else if (
            dataPointIndex ===
            /** @type {Record<string,any>} */ (w.config.series[i]).data.length - 1
          ) {
            textAnchor = 'start'
          } else {
            textAnchor = 'middle'
          }
        }

        this.plotDataLabelsText({
          x,
          y,
          text,
          i,
          j: dataPointIndex,
          parent: elDataLabelsWrap,
          offsetCorrection: true,
          dataLabelsConfig: w.config.dataLabels,
          textAnchor,
        })
      }
    }

    return elDataLabelsWrap
  }

  /**
   * @param {Record<string, any>} opts
   */
  plotDataLabelsText(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)
    let {
      x,
      y,
      i,
      j,
      text,
      textAnchor,
      fontSize,
      parent,
      dataLabelsConfig,
      color,
      alwaysDrawDataLabel,
      offsetCorrection,
      className,
      // some callers (radar) reuse `j` for something other than the data point
      // index, so per-point offsets take these explicit indices when supplied
      seriesIndex = i,
      dataPointIndex = j,
    } = opts

    let dataLabelText = null
    // The caller's answer for this series, then the plugin's if one claimed it.
    // A claim is a boolean rather than a restatement of the caller's list
    // shape, because "does THIS series print labels" is the question here.
    const labelsOn = resolveClaimed(
      w,
      'dataLabels.enabledOnSeries',
      i,
      Array.isArray(w.config.dataLabels.enabledOnSeries)
        ? w.config.dataLabels.enabledOnSeries.indexOf(i) >= 0
        : true,
    )
    if (!labelsOn) {
      return dataLabelText
    }

    let correctedLabels = {
      x,
      y,
      drawnextLabel: true,
      textRects: null,
    }

    if (offsetCorrection) {
      correctedLabels = this.dataLabelsCorrection(
        x,
        y,
        text,
        i,
        j,
        alwaysDrawDataLabel,
        parseInt(
          /** @type {any} */ (dataLabelsConfig).style.fontSize,
          10,
        ).toString(),
      )
    }

    // when zoomed, we don't need to correct labels offsets,
    // but if normally, labels get cropped, correct them
    if (!w.interact.zoomed) {
      x = correctedLabels.x
      y = correctedLabels.y
    }

    if (correctedLabels.textRects) {
      // fixes #2264
      const barPad = w.globals.barPadForNumericAxis || 0
      if (
        x <
          -(barPad + 20) -
            /** @type {any} */ (correctedLabels.textRects).width ||
        x >
          w.layout.gridWidth +
            /** @type {any} */ (correctedLabels.textRects).width +
            barPad +
            30
      ) {
        // datalabels fall outside drawing area, so draw a blank label
        text = ''
      }
    }

    let dataLabelColor = w.globals.dataLabels.style.colors[i]
    if (
      ((w.config.chart.type === 'bar' || w.config.chart.type === 'rangeBar') &&
        w.config.plotOptions.bar.distributed) ||
      w.config.dataLabels.distributed
    ) {
      dataLabelColor = w.globals.dataLabels.style.colors[j]
    }
    if (typeof dataLabelColor === 'function') {
      dataLabelColor = /** @type {any} */ (dataLabelColor)({
        series: w.seriesData.series,
        seriesIndex: i,
        dataPointIndex: j,
        w,
      })
    }
    if (color) {
      dataLabelColor = color
    }

    // for certain chart types, we handle offsets while calculating datalabels pos
    // why? because bars/column may have negative values and based on that
    // offsets becomes reversed. skip resolving here so a per-point offset
    // function isn't invoked for a value that is about to be discarded.
    const offsetsHandledElsewhere =
      w.config.chart.type === 'bar' || w.config.chart.type === 'rangeBar'

    const resolvedOffX = offsetsHandledElsewhere
      ? 0
      : resolveDataLabelOffset(
          dataLabelsConfig.offsetX,
          w,
          seriesIndex,
          dataPointIndex,
        )
    const resolvedOffY = offsetsHandledElsewhere
      ? 0
      : resolveDataLabelOffset(
          dataLabelsConfig.offsetY,
          w,
          seriesIndex,
          dataPointIndex,
        )

    let offX = resolvedOffX
    const offY = resolvedOffY

    if (w.globals.isSlopeChart) {
      if (j !== 0) {
        offX = resolvedOffX * -2 + 5
      }
      if (
        j !== 0 &&
        j !== /** @type {Record<string,any>} */ (w.config.series[i]).data.length - 1
      ) {
        offX = 0
      }
    }

    if (correctedLabels.drawnextLabel) {
      // Stop a label running off the right of the canvas (#5036). Two things
      // this has to get right, and the original shape of it got both wrong in
      // opposite directions.
      //
      // It must test the anchor the text will RENDER with. The bar path never
      // passes `textAnchor` and relies on the `||` fallback at the drawText
      // call below, so a test against the local variable alone was
      // unreachable for bar/column: a column chart narrow enough to crowd its
      // last label clipped it clean off the canvas with nothing to catch it.
      //
      // And it must test whether the label actually overflows. The old test
      // was `x === w.layout.gridWidth`, which looks equivalent because a
      // line's last point sits exactly on the plot's right edge - but a label
      // may legitimately sit in the margin beside the plot, and only the
      // canvas edge really crops it. On a dual-axis chart, where that margin
      // holds the second axis, it un-centred a label with 140px to spare.
      const renderedAnchor = textAnchor || dataLabelsConfig.textAnchor
      if (renderedAnchor === 'middle' || renderedAnchor === 'start') {
        const measured =
          correctedLabels.textRects ||
          /** @type {any} */ (graphics).getTextRects(
            text,
            fontSize || dataLabelsConfig.style.fontSize,
            dataLabelsConfig.style.fontFamily,
            '',
            true,
            // Measuring a 600-weight label at 'regular' under-reports it, and
            // an overflow test is only as good as the width it is given.
            dataLabelsConfig.style.fontWeight,
          )
        const overhang =
          renderedAnchor === 'middle' ? measured.width / 2 : measured.width
        // `x` is in the inner (plot-origin) space, so the canvas edge sits at
        // the chart width less the plot's own left offset.
        const canvasRight = w.globals.svgWidth - w.layout.translateX
        if (x + offX + overhang > canvasRight) {
          textAnchor = 'end'
        }
      }

      dataLabelText = graphics.drawText({
        x: x + offX,
        y: y + offY,
        foreColor: dataLabelColor,
        textAnchor: textAnchor || dataLabelsConfig.textAnchor,
        text,
        fontSize: fontSize || dataLabelsConfig.style.fontSize,
        fontFamily: dataLabelsConfig.style.fontFamily,
        fontWeight: dataLabelsConfig.style.fontWeight || 'normal',
      })

      dataLabelText.attr({
        class: className || 'apexcharts-datalabel',
        cx: x,
        cy: y,
      })

      if (dataLabelsConfig.dropShadow.enabled) {
        const textShadow = dataLabelsConfig.dropShadow
        const filters = new Filters(this.w)
        filters.dropShadow(dataLabelText, textShadow)
      }

      parent.add(dataLabelText)

      // Progressive reveal: data labels fade in alongside their markers as the
      // line's pen-stroke reaches them. Uses the corrected x (post-offset).
      applyProgressiveReveal(dataLabelText, x, w)

      if (typeof w.globals.lastDrawnDataLabelsIndexes[i] === 'undefined') {
        w.globals.lastDrawnDataLabelsIndexes[i] = []
      }

      w.globals.lastDrawnDataLabelsIndexes[i].push(j)
    }

    return dataLabelText
  }

  /**
   * @param {Element} el
   * @param {{x: number, y: number, width: number, height: number}} coords
   */
  addBackgroundToDataLabel(el, coords) {
    const w = this.w

    const bCnf = w.config.dataLabels.background

    const paddingH = bCnf.padding
    const paddingV = bCnf.padding / 2

    const width = coords.width
    const height = coords.height
    const graphics = new Graphics(this.w)
    const elRect = graphics.drawRect(
      coords.x - paddingH,
      coords.y - paddingV / 2,
      width + paddingH * 2,
      height + paddingV,
      bCnf.borderRadius,
      w.config.chart.background === 'transparent' || !w.config.chart.background
        ? '#fff'
        : w.config.chart.background,
      bCnf.opacity,
      bCnf.borderWidth,
      bCnf.borderColor,
    )

    if (bCnf.dropShadow.enabled) {
      const filters = new Filters(this.w)
      filters.dropShadow(elRect, bCnf.dropShadow)
    }

    return elRect
  }

  /**
   * Separate data labels that landed on top of each other, across series.
   *
   * Runs after every series has drawn and before `dataLabelsBackground()`, for
   * two reasons: the shift has to be applied to the text before a pill is cut
   * around it, and only at this point does every label exist to be compared.
   * `dataLabelsCorrection` cannot do this job - it runs while a single series
   * is being plotted, so the labels it would collide with have not been drawn.
   *
   * On by default; `dataLabels.avoidOverlap: false` restores strict placement.
   * The pass is a no-op on a chart whose labels already clear each other, so
   * what it costs such a chart is the one measuring loop below.
   */
  avoidOverlaps() {
    const w = this.w
    const cfg = w.config.dataLabels.avoidOverlap
    if (!cfg) return
    // Radial layouts place a label by angle, around a centre. Pushing one
    // "down" is arbitrary there, and on a radar the labels ring a small
    // polygon, so the pass runs out of budget and starts hiding them instead.
    // Pie/donut/polarArea already run their own de-overlap (Pie.placeExternal
    // Labels) and do not use this class on their labels anyway.
    if (RADIAL_TYPES.indexOf(w.config.chart.type) !== -1) return

    const opts = typeof cfg === 'object' ? cfg : {}
    const bCnf = w.config.dataLabels.background

    const nodes = w.dom.baseEl.querySelectorAll(
      '.apexcharts-datalabels text.apexcharts-datalabel',
    )
    if (nodes.length < 2) return

    // Measure what is actually RENDERED, not the local box. `getBBox()` is
    // taken before the element's own transform, so a bar label under
    // `plotOptions.bar.dataLabels.orientation: 'vertical'` measures 29x14 while
    // it occupies 14x29 on screen - the pass would compare the wrong rectangle
    // entirely. getBoundingClientRect() is post-transform, so it is the box the
    // viewer sees. Falls back to getBBox under SSR, where the DOM shim
    // estimates text extents but returns an empty client rect.
    //
    // Same measure-then-mutate shape as dataLabelsBackground below, and for the
    // same reason: all the reads first, so a write cannot force a relayout in
    // the middle of measuring.
    /** @type {{el: SVGGraphicsElement, scaleY: number, box: import('./helpers/DataLabelOverlap').LabelBox}[]} */
    const measured = []
    for (let i = 0; i < nodes.length; i++) {
      const el = /** @type {SVGGraphicsElement} */ (nodes[i])
      const rect = el.getBoundingClientRect()
      const ctm = el.getScreenCTM?.()
      const screen = rect.width > 0 && rect.height > 0
      const box = screen ? rect : el.getBBox()
      if (!box.width || !box.height) continue

      // A rotated or skewed label cannot be moved by its `y` attribute: that
      // runs along its own rotated axis. It still has to be avoided, so it
      // goes in as an obstacle. b/c are the off-diagonal terms of the matrix,
      // zero exactly when the element is axis-aligned.
      const rotated = !!ctm && (Math.abs(ctm.b) > 1e-6 || Math.abs(ctm.c) > 1e-6)
      // Screen px per user unit, to turn the resolved shift back into the
      // units the `y` attribute is written in.
      const scaleY = screen && ctm && ctm.d ? Math.abs(ctm.d) : 1
      const scaleX = screen && ctm && ctm.a ? Math.abs(ctm.a) : 1

      // A label with a background occupies its pill, not its glyphs, so the
      // pass has to compare the pills or it leaves them touching.
      const padH = (bCnf.enabled ? bCnf.padding : 0) * scaleX
      const padV = (bCnf.enabled ? bCnf.padding / 2 : 0) * scaleY
      measured.push({
        el,
        scaleY,
        box: {
          x: (screen ? rect.left : box.x) - padH,
          y: (screen ? rect.top : box.y) - padV / 2,
          width: box.width + padH * 2,
          height: box.height + padV,
          order: measured.length,
          fixed: rotated,
        },
      })
    }
    if (measured.length < 2) return

    // Separate along the VALUE axis, never the category axis. On a column
    // chart that is vertical; on a horizontal bar the two swap, and nudging a
    // label up or down there would walk it into the neighbouring category's
    // row - the same objection that rules out sideways moves on a column
    // chart. The resolver is one-dimensional, so a horizontal bar transposes
    // its boxes going in and writes the result to `x` instead of `y`.
    const horizontal = !!w.config.plotOptions?.bar?.horizontal
    const boxes = measured.map(({ box }) =>
      horizontal
        ? {
            x: box.y,
            y: box.x,
            width: box.height,
            height: box.width,
            order: box.order,
            fixed: box.fixed,
          }
        : box,
    )

    // Bounds come from the grid, in the space the boxes were measured in.
    const gridEl = w.dom.baseEl.querySelector('.apexcharts-grid')
    const gridRect = gridEl?.getBoundingClientRect()
    const useScreen = !!gridRect && gridRect.height > 0
    // The label's own extent along the axis it is being separated on.
    const extent = boxes[0].height
    const unit = measured[0].scaleY

    const lo = useScreen
      ? horizontal
        ? gridRect.left
        : gridRect.top
      : 0
    const hi = useScreen
      ? horizontal
        ? gridRect.right
        : gridRect.bottom
      : horizontal
        ? w.layout.gridWidth
        : w.layout.gridHeight

    const resolved = resolveLabelOverlaps(boxes, {
      gap: (opts.gap ?? 2) * unit,
      // Default budget is roughly one label's own extent in each direction:
      // far enough to clear a coincident twin, near enough that the label is
      // still unmistakably its mark's.
      maxShift: opts.maxShift ? opts.maxShift * unit : Math.max(extent, 14),
      // The plot itself, with no slack: past this edge the label is clipped,
      // so pushing one out there trades an overlap for a truncated value. A
      // label that already starts outside (the one above a bar that reaches
      // the top of the grid) keeps its place - resolveLabelOverlaps treats
      // these as a restriction on movement, never as a push.
      minY: lo,
      maxY: hi,
      // Dropping a label is opt-in. This pass is on by default, and a default
      // that silently deletes a value is worse than the overlap it set out to
      // fix: on a crowded horizontal bar it removed eight of eighteen labels.
      // Off, a pair that cannot be separated is simply left as it is today.
      hide: opts.hide === true,
    })

    const attr = horizontal ? 'x' : 'y'
    const centreAttr = horizontal ? 'cx' : 'cy'

    for (let i = 0; i < measured.length; i++) {
      const { el, scaleY } = measured[i]
      const { dy, hidden } = resolved[i]

      if (hidden) {
        el.style.display = 'none'
        el.classList.add('apexcharts-datalabel-hidden')
        continue
      }
      if (!dy) continue

      const delta = dy / scaleY
      const v = parseFloat(el.getAttribute(attr) || '0')
      el.setAttribute(attr, (v + delta).toString())
      // `cx`/`cy` are the pre-offset anchor the progressive reveal and the
      // update transition both read, so the one on the moved axis has to
      // travel with the text or a label would ride back to its colliding
      // position on the next update.
      const c = el.getAttribute(centreAttr)
      if (c !== null) {
        el.setAttribute(centreAttr, (parseFloat(c) + delta).toString())
      }
    }
  }

  dataLabelsBackground() {
    const w = this.w

    if (w.config.chart.type === 'bubble') return

    const elDataLabels = w.dom.baseEl.querySelectorAll(
      '.apexcharts-datalabels text',
    )

    // Measure every label first, then mutate. `getBBox()` forces a synchronous
    // layout, and inserting the background rect invalidates it again, so doing
    // both in one loop relaid the SVG out once per label. That is the whole
    // render cost on a label-dense chart (the same trap documented for treemap
    // labels on `plotOptions.treemap.dataLabels.minFontSize`): measuring 7k
    // labels this way costs seconds, batched it costs milliseconds.
    /** @type {{el: Element, coords: {x: number, y: number, width: number, height: number}, fill: string | null}[]} */
    const measured = []
    for (let i = 0; i < elDataLabels.length; i++) {
      const el = elDataLabels[i]
      const bbox = /** @type {SVGGraphicsElement} */ (el).getBBox()

      if (bbox.width && bbox.height) {
        measured.push({
          el,
          // copied out of the live SVGRect so nothing below can disturb it
          coords: {
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
          },
          // captured before the write pass overwrites the text's own fill
          fill: el.getAttribute('fill'),
        })
      }
    }

    const bCnf = w.config.dataLabels.background

    // Above chart.animations.largeDatasetThreshold, reveal the backgrounds
    // without per-element animation. Each rect would otherwise get its own JS
    // tween AND its own rAF polling chain (applyProgressiveReveal), so a chart
    // with thousands of labels runs thousands of those at once and spends the
    // whole reveal janking. Same bail-out Graphics.renderPaths takes when the
    // path count crosses this threshold; set it to 0 to always animate.
    const largeThreshold = w.config.chart.animations.largeDatasetThreshold ?? 0
    const bulkReveal = largeThreshold > 0 && measured.length > largeThreshold

    const shouldAnim =
      w.config.chart.animations.enabled &&
      !w.globals.resized &&
      !w.globals.dataChanged &&
      !bulkReveal

    for (let i = 0; i < measured.length; i++) {
      const { el, coords, fill } = measured[i]
      const elRect = this.addBackgroundToDataLabel(el, coords)
      if (!elRect) continue

      el.parentNode?.insertBefore(elRect.node, el)
      const background = bCnf.backgroundColor || fill

      if (shouldAnim) {
        elRect.animate().attr({ fill: background })
      } else {
        elRect.attr({ fill: background })
      }
      el.setAttribute('fill', bCnf.foreColor)

      // Mirror the text's progressive reveal onto the background pill so
      // the rect doesn't pop in before the line draw reaches it.
      if (!bulkReveal) {
        const cxAttr = el.getAttribute('cx')
        if (cxAttr !== null) {
          applyProgressiveReveal(elRect, parseFloat(cxAttr), w)
        }
      }
    }
  }

  bringForward() {
    const w = this.w
    const elDataLabelsNodes = w.dom.baseEl.querySelectorAll(
      '.apexcharts-datalabels',
    )

    const elSeries = w.dom.baseEl.querySelector(
      '.apexcharts-plot-series:last-child',
    )

    for (let i = 0; i < elDataLabelsNodes.length; i++) {
      if (elSeries) {
        elSeries.insertBefore(elDataLabelsNodes[i], elSeries.nextSibling)
      }
    }
  }
}

export default DataLabels
