// @ts-check
import CoreUtils from './CoreUtils'
import Crosshairs from './Crosshairs'
import Globals from '../modules/settings/Globals'
import Graphics from './Graphics'
import Range from './Range'
import Utils from '../utils/Utils'
import TimeScale from './TimeScale'
import { Environment } from '../utils/Environment.js'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import { SVGNS } from '../svg/math'
import { getChartClass } from './ChartFactory'

/**
 * ApexCharts Core Class responsible for major calculations and creating elements.
 *
 * @module Core
 **/

export default class Core {
  /**
   * @param {Element} el
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(el, w, ctx) {
    this.w = w
    this.ctx = ctx // needed: timeScale, updateHelpers, chart type instantiation
    this.el = el
  }

  setupElements() {
    const { globals: gl, config: cnf } = this.w

    const ct = cnf.chart.type
    const xyChartsArrTypes = [
      'line',
      'area',
      'bar',
      'rangeBar',
      'rangeArea',
      'candlestick',
      'boxPlot',
      'scatter',
      'bubble',
    ]

    const axisChartsArrTypes = [
      ...xyChartsArrTypes,
      'radar',
      'heatmap',
      'treemap',
    ]

    gl.axisCharts = axisChartsArrTypes.includes(ct)
    gl.xyCharts = xyChartsArrTypes.includes(ct)

    gl.isBarHorizontal =
      ['bar', 'rangeBar', 'boxPlot'].includes(ct) &&
      cnf.plotOptions.bar.horizontal

    gl.chartClass = `.apexcharts${gl.chartID}`
    this.w.dom.baseEl = this.el

    this.w.dom.elWrap = BrowserAPIs.createElementNS(
      'http://www.w3.org/1999/xhtml',
      'div',
    )
    Graphics.setAttrs(this.w.dom.elWrap, {
      id: gl.chartClass.substring(1),
      class: `apexcharts-canvas ${gl.chartClass.substring(1)}`,
    })
    this.el.appendChild(this.w.dom.elWrap)

    // this.w.dom.Paper = new window.SVG.Doc(this.w.dom.elWrap)
    // Access SVG from appropriate global scope. `globalThis` resolves to
    // `window` in browsers and `global` in Node — works in both, typed in
    // both, no env-specific branching needed.
    const SVG = /** @type {any} */ (globalThis).SVG
    this.w.dom.Paper = SVG().addTo(this.w.dom.elWrap)

    this.w.dom.Paper.attr({
      class: 'apexcharts-svg',
      'xmlns:data': 'ApexChartsNS',
      transform: `translate(${cnf.chart.offsetX}, ${cnf.chart.offsetY})`,
    })

    this.w.dom.Paper.node.style.background =
      cnf.theme.mode === 'dark' && !cnf.chart.background
        ? '#343A3F'
        : cnf.theme.mode === 'light' && !cnf.chart.background
          ? '#fff'
          : cnf.chart.background

    this.setSVGDimensions()

    // foreignObject must be added first (at the back in z-order) to prevent blocking interactions
    this.w.dom.elLegendForeign = BrowserAPIs.createElementNS(
      SVGNS,
      'foreignObject',
    )
    Graphics.setAttrs(this.w.dom.elLegendForeign, {
      x: 0,
      y: 0,
      width: gl.svgWidth,
      height: gl.svgHeight,
    })

    this.w.dom.elLegendWrap = BrowserAPIs.createElementNS(
      'http://www.w3.org/1999/xhtml',
      'div',
    )
    this.w.dom.elLegendWrap.classList.add('apexcharts-legend')

    this.w.dom.elWrap.appendChild(this.w.dom.elLegendWrap)
    this.w.dom.Paper.node.appendChild(this.w.dom.elLegendForeign)

    // Screen-reader-only aria-live status region (WCAG 4.1.3). Sits as a
    // sibling of the SVG so events like zoom-in/out, pan and series toggle
    // can be announced even when no tooltip is on screen. Visually hidden via
    // .apexcharts-sr-status in apexcharts.css.
    if (
      cnf.chart.accessibility.enabled &&
      cnf.chart.accessibility.announcements.enabled
    ) {
      const srStatus = BrowserAPIs.createElement('div')
      srStatus.className = 'apexcharts-sr-status'
      srStatus.setAttribute('role', 'status')
      srStatus.setAttribute('aria-live', 'polite')
      srStatus.setAttribute('aria-atomic', 'true')
      this.w.dom.elWrap.appendChild(srStatus)
    }

    // Add accessibility elements after foreignObject to maintain proper z-order
    if (cnf.chart.accessibility.enabled) {
      const ariaLabel = this.getAccessibleChartLabel()

      // Use role="application" when keyboard navigation is enabled so that
      // screen readers pass arrow keys through to the chart rather than
      // intercepting them.
      const svgRole =
        cnf.chart.accessibility.keyboard.enabled &&
        cnf.chart.accessibility.keyboard.navigation.enabled
          ? 'application'
          : 'img'

      this.w.dom.Paper.attr({
        role: svgRole,
        'aria-label': ariaLabel,
      })

      // Add desc element when description is provided
      if (cnf.chart.accessibility.description) {
        const descEl = BrowserAPIs.createElementNS(SVGNS, 'desc')
        descEl.textContent = cnf.chart.accessibility.description
        this.w.dom.Paper.node.insertBefore(
          descEl,
          this.w.dom.elLegendForeign.nextSibling,
        )
      }
    }

    this.w.dom.elGraphical = this.w.dom.Paper.group().attr({
      class: 'apexcharts-inner apexcharts-graphical',
    })

    this.w.dom.elDefs = this.w.dom.Paper.defs()
    this.w.dom.Paper.add(this.w.dom.elGraphical)
    this.w.dom.elGraphical.add(this.w.dom.elDefs)
  }

  /**
   * @param {any[]} ser
   * @param {import('../types/internal').XYRatios} xyRatios
   */
  plotChartType(ser, xyRatios) {
    const { w, ctx } = this
    const { config: cnf, globals: gl } = w

    const seriesTypes = {
      line: { series: [], i: [] },
      area: { series: [], i: [] },
      scatter: { series: [], i: [] },
      bubble: { series: [], i: [] },
      bar: { series: [], i: [] },
      candlestick: { series: [], i: [] },
      boxPlot: { series: [], i: [] },
      rangeBar: { series: [], i: [] },
      rangeArea: { series: [], seriesRangeEnd: [], i: [] },
    }

    const chartType = cnf.chart.type || 'line'
    let nonComboType = null
    let comboCount = 0

    /**
     * @param {Object} serie
     * @param {number} st
     */
    this.w.seriesData.series.forEach((serie, st) => {
      const seriesType =
        ser[st]?.type === 'column'
          ? 'bar'
          : ser[st]?.type || (chartType === 'column' ? 'bar' : chartType)

      const st_ = /** @type {Record<string,any>} */ (seriesTypes)
      if (st_[seriesType]) {
        if (seriesType === 'rangeArea') {
          st_[seriesType].series.push(this.w.rangeData.seriesRangeStart[st])
          st_[seriesType].seriesRangeEnd.push(
            this.w.rangeData.seriesRangeEnd[st],
          )
        } else {
          st_[seriesType].series.push(serie)
        }
        st_[seriesType].i.push(st)

        if (seriesType === 'bar') w.globals.columnSeries = seriesTypes.bar
      } else if (
        [
          'heatmap',
          'treemap',
          'pie',
          'donut',
          'polarArea',
          'radialBar',
          'radar',
        ].includes(seriesType)
      ) {
        nonComboType = seriesType
      } else {
        console.warn(
          `You have specified an unrecognized series type (${seriesType}).`,
        )
      }
      if (chartType !== seriesType && seriesType !== 'scatter') comboCount++
    })

    if (comboCount > 0) {
      if (nonComboType) {
        console.warn(
          `Chart or series type ${nonComboType} cannot appear with other chart or series types.`,
        )
      }
      if (seriesTypes.bar.series.length > 0 && cnf.plotOptions.bar.horizontal) {
        comboCount -= seriesTypes.bar.series.length
        seriesTypes.bar = { series: [], i: [] }
        w.globals.columnSeries = { series: [], i: [] }
        console.warn(
          'Horizontal bars are not supported in a mixed/combo chart. Please turn off `plotOptions.bar.horizontal`',
        )
      }
    }
    gl.comboCharts ||= comboCount > 0

    // Lazily resolve chart classes — only look up types that are actually used.
    // Eagerly calling getChartClass() for every type would break tree-shaking:
    // a page that only registers 'line' would throw when 'candlestick' etc.
    // are looked up even though they are never rendered.
    const needsLine =
      seriesTypes.line.series.length > 0 ||
      seriesTypes.area.series.length > 0 ||
      seriesTypes.scatter.series.length > 0 ||
      seriesTypes.bubble.series.length > 0 ||
      seriesTypes.rangeArea.series.length > 0 ||
      (!gl.comboCharts &&
        ['line', 'area', 'scatter', 'bubble', 'rangeArea'].includes(
          cnf.chart.type,
        ))
    const line = needsLine
      ? new (getChartClass('line'))(ctx.w, ctx, xyRatios)
      : null

    const needsCandlestick =
      seriesTypes.candlestick.series.length > 0 ||
      seriesTypes.boxPlot.series.length > 0 ||
      (!gl.comboCharts && ['candlestick', 'boxPlot'].includes(cnf.chart.type))
    const boxCandlestick = needsCandlestick
      ? new (getChartClass('candlestick'))(ctx.w, ctx, xyRatios)
      : null

    const needsPie =
      !gl.comboCharts && ['pie', 'donut', 'polarArea'].includes(cnf.chart.type)
    ctx.pie = needsPie ? new (getChartClass('pie'))(ctx.w, ctx) : null

    const needsRangeBar =
      seriesTypes.rangeBar.series.length > 0 ||
      (!gl.comboCharts && cnf.chart.type === 'rangeBar')
    ctx.rangeBar = needsRangeBar
      ? new (getChartClass('rangeBar'))(ctx.w, ctx, xyRatios)
      : null

    let elGraph = []

    if (gl.comboCharts) {
      const coreUtils = new CoreUtils(this.w)
      if (seriesTypes.area.series.length > 0) {
        elGraph.push(
          ...coreUtils.drawSeriesByGroup(
            seriesTypes.area,
            gl.areaGroups,
            'area',
            line,
          ),
        )
      }
      if (seriesTypes.bar.series.length > 0) {
        if (cnf.chart.stacked) {
          const barStacked = new (getChartClass('barStacked'))(
            ctx.w,
            ctx,
            xyRatios,
          )
          elGraph.push(
            barStacked.draw(seriesTypes.bar.series, seriesTypes.bar.i),
          )
        } else {
          ctx.bar = new (getChartClass('bar'))(ctx.w, ctx, xyRatios)
          elGraph.push(ctx.bar.draw(seriesTypes.bar.series, seriesTypes.bar.i))
        }
      }
      if (seriesTypes.rangeArea.series.length > 0) {
        elGraph.push(
          line.draw(
            seriesTypes.rangeArea.series,
            'rangeArea',
            seriesTypes.rangeArea.i,
            seriesTypes.rangeArea.seriesRangeEnd,
          ),
        )
      }
      if (seriesTypes.line.series.length > 0) {
        elGraph.push(
          ...coreUtils.drawSeriesByGroup(
            seriesTypes.line,
            gl.lineGroups,
            'line',
            line,
          ),
        )
      }
      if (seriesTypes.candlestick.series.length > 0) {
        elGraph.push(
          boxCandlestick.draw(
            seriesTypes.candlestick.series,
            'candlestick',
            seriesTypes.candlestick.i,
          ),
        )
      }
      if (seriesTypes.boxPlot.series.length > 0) {
        elGraph.push(
          boxCandlestick.draw(
            seriesTypes.boxPlot.series,
            'boxPlot',
            seriesTypes.boxPlot.i,
          ),
        )
      }
      if (seriesTypes.rangeBar.series.length > 0) {
        elGraph.push(
          ctx.rangeBar.draw(
            seriesTypes.rangeBar.series,
            seriesTypes.rangeBar.i,
          ),
        )
      }
      if (seriesTypes.scatter.series.length > 0) {
        const scatterLine = new (getChartClass('line'))(
          ctx.w,
          ctx,
          xyRatios,
          true,
        )
        elGraph.push(
          scatterLine.draw(
            seriesTypes.scatter.series,
            'scatter',
            seriesTypes.scatter.i,
          ),
        )
      }
      if (seriesTypes.bubble.series.length > 0) {
        const bubbleLine = new (getChartClass('line'))(
          ctx.w,
          ctx,
          xyRatios,
          true,
        )
        elGraph.push(
          bubbleLine.draw(
            seriesTypes.bubble.series,
            'bubble',
            seriesTypes.bubble.i,
          ),
        )
      }
    } else {
      const type = cnf.chart.type
      switch (type) {
        case 'line':
          elGraph = line.draw(this.w.seriesData.series, 'line')
          break
        case 'area':
          elGraph = line.draw(this.w.seriesData.series, 'area')
          break
        case 'bar':
          if (cnf.chart.stacked) {
            const barStacked = new (getChartClass('barStacked'))(
              ctx.w,
              ctx,
              xyRatios,
            )
            elGraph = barStacked.draw(this.w.seriesData.series)
          } else {
            ctx.bar = new (getChartClass('bar'))(ctx.w, ctx, xyRatios)
            elGraph = ctx.bar.draw(this.w.seriesData.series)
          }
          break
        case 'candlestick':
          elGraph = boxCandlestick.draw(this.w.seriesData.series, 'candlestick')
          break
        case 'boxPlot':
          elGraph = boxCandlestick.draw(this.w.seriesData.series, type)
          break
        case 'rangeBar':
          elGraph = ctx.rangeBar.draw(this.w.seriesData.series)
          break
        case 'rangeArea':
          elGraph = line.draw(
            this.w.rangeData.seriesRangeStart,
            'rangeArea',
            undefined,
            this.w.rangeData.seriesRangeEnd,
          )
          break
        case 'heatmap': {
          const heatmap = new (getChartClass('heatmap'))(ctx.w, ctx, xyRatios)
          elGraph = heatmap.draw(this.w.seriesData.series)
          break
        }
        case 'treemap': {
          const treemap = new (getChartClass('treemap'))(ctx.w, ctx)
          elGraph = treemap.draw(this.w.seriesData.series)
          break
        }
        case 'pie':
        case 'donut':
        case 'polarArea':
          elGraph = ctx.pie.draw(this.w.seriesData.series)
          break
        case 'radialBar': {
          const radialBar = new (getChartClass('radialBar'))(ctx.w, ctx)
          elGraph = radialBar.draw(this.w.seriesData.series)
          break
        }
        case 'radar': {
          const radar = new (getChartClass('radar'))(ctx.w, ctx)
          elGraph = radar.draw(this.w.seriesData.series)
          break
        }
        default:
          elGraph = line.draw(this.w.seriesData.series)
      }
    }

    return elGraph
  }

  setSVGDimensions() {
    const { globals: gl, config: cnf } = this.w

    cnf.chart.width = cnf.chart.width || '100%'
    cnf.chart.height = cnf.chart.height || 'auto'

    const rawWidth = cnf.chart.width
    const rawHeight = cnf.chart.height

    // Pre-set NaN so that when the element cannot be measured (e.g. JSDOM with
    // percentage width), svgWidth doesn't stay at the Globals default of 0.
    // The branching below overwrites with a real value when measurement works.
    // The original code achieved this by assigning the raw config string first
    // (e.g. '100%'). We use NaN instead to keep the type as number.
    gl.svgWidth = NaN
    gl.svgHeight = NaN

    let elDim = Utils.getDimensions(this.el)
    const widthUnit = rawWidth
      .toString()
      .split(/[0-9]+/g)
      .pop()

    if (widthUnit === '%') {
      if (Utils.isNumber(elDim[0])) {
        if (elDim[0].width === 0) {
          elDim = Utils.getDimensions(this.el.parentNode)
        }
        gl.svgWidth = (elDim[0] * parseInt(rawWidth, 10)) / 100
      }
    } else if (widthUnit === 'px' || widthUnit === '') {
      gl.svgWidth = parseInt(rawWidth, 10)
    }

    const heightUnit = String(rawHeight)
      .toString()
      .split(/[0-9]+/g)
      .pop()
    if (rawHeight !== 'auto' && rawHeight !== '') {
      if (heightUnit === '%') {
        const elParentDim = Utils.getDimensions(this.el.parentNode)
        gl.svgHeight = (elParentDim[1] * parseInt(rawHeight, 10)) / 100
      } else {
        gl.svgHeight = parseInt(rawHeight, 10)
      }
    } else {
      gl.svgHeight = gl.axisCharts ? gl.svgWidth / 1.61 : gl.svgWidth / 1.2
    }

    gl.svgWidth = Math.max(gl.svgWidth, 0)
    gl.svgHeight = Math.max(gl.svgHeight, 0)

    Graphics.setAttrs(this.w.dom.Paper.node, {
      width: gl.svgWidth,
      height: gl.svgHeight,
    })

    if (heightUnit !== '%' && Environment.isBrowser()) {
      // parentHeightOffset gives breathing room above the SVG so the topmost
      // axis label / gridline / data label isn't clipped. When the chart has
      // no axis adornments visible (grid, x/y labels, axis borders, axis
      // ticks) and no data labels, nothing reaches the top edge — skip it.
      const needsAxisPadding =
        gl.axisCharts &&
        (cnf.grid.show ||
          cnf.dataLabels.enabled ||
          cnf.xaxis.labels.show ||
          cnf.xaxis.axisBorder.show ||
          cnf.xaxis.axisTicks.show ||
          cnf.yaxis.some(
            (/** @type {any} */ y) =>
              y.show &&
              (y.labels.show || y.axisBorder.show || y.axisTicks.show),
          ))
      const offsetY =
        cnf.chart.sparkline.enabled || !needsAxisPadding
          ? 0
          : cnf.chart.parentHeightOffset
      const paperNode = this.w.dom.Paper.node
      if (paperNode.parentNode?.parentNode) {
        paperNode.parentNode.parentNode.style.minHeight = `${gl.svgHeight + offsetY}px`
      }
    }

    this.w.dom.elWrap.style.width = `${gl.svgWidth}px`
    this.w.dom.elWrap.style.height = `${gl.svgHeight}px`
  }

  shiftGraphPosition() {
    const { globals: gl } = this.w
    const { translateY: tY, translateX: tX } = gl

    Graphics.setAttrs(this.w.dom.elGraphical.node, {
      transform: `translate(${tX}, ${tY})`,
    })
  }

  resizeNonAxisCharts() {
    const { w } = this

    // When the user supplies an explicit chart.height (px or %), honor it —
    // don't re-derive SVG / wrap heights from arc geometry. Only 'auto' (and
    // empty) means "size yourself to fit the arc + legend".
    const heightStr = w.config.chart.height
      ? String(w.config.chart.height)
      : ''
    const userSetFixedHeight = heightStr !== '' && heightStr !== 'auto'

    let legendHeight = 0
    let offY = w.config.chart.sparkline.enabled ? 1 : 15
    offY += w.config.grid.padding.bottom

    if (
      ['top', 'bottom'].includes(w.config.legend.position) &&
      w.config.legend.show &&
      !w.config.legend.floating
    ) {
      legendHeight =
        (this.ctx.legend?.legendHelpers.getLegendDimensions().clwh ?? 0) + 7
    }

    const el = w.dom.baseEl.querySelector(
      '.apexcharts-radialbar, .apexcharts-pie',
    )
    let chartInnerDimensions = w.globals.radialSize * 2.05

    const radialAngleSpan = Math.abs(
      w.config.plotOptions.radialBar.endAngle -
        w.config.plotOptions.radialBar.startAngle,
    )
    if (el && !w.config.chart.sparkline.enabled && radialAngleSpan < 360) {
      const svgRect = Utils.getBoundingClientRect(this.w.dom.Paper.node)
      // Compute the visible arc extent by walking children and EXCLUDING the
      // hollow circle. The hollow is always a full 360° circle, so for
      // partial-arc gauges its lower half sits below the arc chord with no
      // visible content — inflating the bbox and breaking auto-sizing.
      let arcTopFromSVGTop = Infinity
      let arcBottomFromSVGTop = -Infinity
      // Walk to leaf nodes only — measuring parent <g> elements would
      // re-include the hollow's bbox via inheritance, defeating the skip.
      /** @param {Element} node */
      const accumulate = (node) => {
        if (node.classList?.contains('apexcharts-radialbar-hollow')) {
          return
        }
        // Skip text/tspan — datalabels can be placed far from the arc
        // (e.g. stroked-gauge's "Median Ratio" at offsetY: 120 sits 120px
        // below center). They're decorative; the chart's vertical sizing
        // should be driven by the arc geometry, not label position.
        const tag = node.tagName?.toLowerCase?.()
        if (tag === 'text' || tag === 'tspan') return
        const children = Array.from(node.children ?? [])
        if (children.length > 0) {
          children.forEach((c) => accumulate(/** @type {Element} */ (c)))
          return
        }
        // Leaf node — measure it.
        const r = Utils.getBoundingClientRect(node)
        const height = r.bottom - r.top
        if (height > 0) {
          const top = r.top - svgRect.top
          const bottom = r.bottom - svgRect.top
          if (top < arcTopFromSVGTop) arcTopFromSVGTop = top
          if (bottom > arcBottomFromSVGTop) arcBottomFromSVGTop = bottom
        }
      }
      Array.from(el.children ?? []).forEach((c) =>
        accumulate(/** @type {Element} */ (c)),
      )
      // Fallback if no measurable children were found.
      if (!Number.isFinite(arcTopFromSVGTop)) arcTopFromSVGTop = 0
      if (!Number.isFinite(arcBottomFromSVGTop)) {
        const elRect = Utils.getBoundingClientRect(el)
        arcBottomFromSVGTop = elRect.bottom - svgRect.top
      }
      // Padding scales with the arc size so larger gauges get proportionally
      // more breathing room. Same value applied to top AND bottom so the
      // arc is vertically centered within the SVG regardless of shape.
      const padding = Math.max(offY, w.globals.radialSize * 0.2)
      // Only shift the graphical group DOWN to give an arc more top
      // breathing room when its natural top is too close to the SVG edge.
      // Never pull the arc UP — that would override the renderer's intent
      // for charts whose arc geometry (e.g. ∩-shape -135/+135) naturally
      // sits with ample space at the top.
      const verticalShift = Math.max(padding - arcTopFromSVGTop, 0)
      if (verticalShift !== 0) {
        w.layout.translateY = (w.layout.translateY ?? 0) + verticalShift
        Graphics.setAttrs(this.w.dom.elGraphical.node, {
          transform: `translate(${w.layout.translateX ?? 0}, ${w.layout.translateY})`,
        })
        arcBottomFromSVGTop += verticalShift
      }
      chartInnerDimensions =
        arcBottomFromSVGTop > 0
          ? arcBottomFromSVGTop
          : w.globals.radialSize * 2.05
      // Pad the bottom with the SAME breathing room the arc has at the top
      // so the SVG ends up centered around the arc. The previous fixed
      // padding (radialSize * 0.2 ≈ 25px) was independent of the natural
      // top space and guaranteed asymmetry — for a 270° ∪-gauge it left
      // ~57px above the arc and only ~25px below within the SVG.
      const bottomPadding = Math.max(padding, arcTopFromSVGTop)
      const svgHeight = Math.ceil(
        chartInnerDimensions + legendHeight + bottomPadding,
      )
      // `chart.offsetY` is applied as a transform on the SVG element, which
      // shifts the SVG within elWrap. For positive offsetY the SVG's bottom
      // ends up below elWrap's bottom — grow elWrap by that amount so the
      // visible drawing area still contains the full SVG.
      const chartOffsetY = w.config.chart.offsetY ?? 0
      const elWrapHeight = svgHeight + Math.max(chartOffsetY, 0)
      if (!userSetFixedHeight) {
        if (this.w.dom.elLegendForeign) {
          this.w.dom.elLegendForeign.setAttribute(
            'height',
            String(elWrapHeight),
          )
        }
        this.w.dom.elWrap.style.height = `${elWrapHeight}px`
        Graphics.setAttrs(this.w.dom.Paper.node, { height: svgHeight })
        if (Environment.isBrowser()) {
          this.w.dom.Paper.node.parentNode.parentNode.style.minHeight = `${elWrapHeight}px`
        }
      }
      return
    }

    const newHeight = Math.ceil(
      chartInnerDimensions + this.w.layout.translateY + legendHeight + offY,
    )

    if (userSetFixedHeight) return

    if (this.w.dom.elLegendForeign) {
      this.w.dom.elLegendForeign.setAttribute('height', String(newHeight))
    }

    this.w.dom.elWrap.style.height = `${newHeight}px`
    Graphics.setAttrs(this.w.dom.Paper.node, { height: newHeight })
    if (Environment.isBrowser()) {
      this.w.dom.Paper.node.parentNode.parentNode.style.minHeight = `${newHeight}px`
    }
  }

  coreCalculations() {
    new Range(this.w).init()
  }

  resetGlobals() {
    const resetxyValues = () => this.w.config.series.map(() => [])
    const globalObj = new Globals()

    const { globals: gl } = this.w

    const parsingFlags = {
      dataWasParsed: this.w.axisFlags.dataWasParsed,
      originalSeries: gl.originalSeries,
    }

    globalObj.initGlobalVars(gl)
    gl.seriesXvalues = resetxyValues()
    gl.seriesYvalues = resetxyValues()

    if (parsingFlags.dataWasParsed) {
      this.w.axisFlags.dataWasParsed = parsingFlags.dataWasParsed
      gl.originalSeries = parsingFlags.originalSeries
    }
  }

  isMultipleY() {
    if (Array.isArray(this.w.config.yaxis) && this.w.config.yaxis.length > 1) {
      this.w.globals.isMultipleYAxis = true
      return true
    }
    return false
  }

  xySettings() {
    const { w } = this
    let xyRatios = null

    if (w.globals.axisCharts) {
      if (w.config.xaxis.crosshairs.position === 'back') {
        new Crosshairs(this.w).drawXCrosshairs()
      }
      if (w.config.yaxis[0].crosshairs.position === 'back') {
        new Crosshairs(this.w).drawYCrosshairs()
      }

      if (
        w.config.xaxis.type === 'datetime' &&
        w.config.xaxis.labels.formatter === undefined
      ) {
        this.ctx.timeScale = new TimeScale(this.w, this.ctx)
        let formattedTimeScale = []
        if (
          isFinite(w.globals.minX) &&
          isFinite(w.globals.maxX) &&
          !w.globals.isBarHorizontal
        ) {
          formattedTimeScale = this.ctx.timeScale.calculateTimeScaleTicks(
            w.globals.minX,
            w.globals.maxX,
          )
        } else if (w.globals.isBarHorizontal) {
          formattedTimeScale = this.ctx.timeScale.calculateTimeScaleTicks(
            w.globals.minY,
            w.globals.maxY,
          )
        }
        this.ctx.timeScale.recalcDimensionsBasedOnFormat(formattedTimeScale)
      }

      const coreUtils = new CoreUtils(this.w)
      xyRatios = coreUtils.getCalculatedRatios()
    }
    return xyRatios
  }

  /**
   * @param {any} targetChart
   */
  updateSourceChart(targetChart) {
    this.ctx.w.interact.selection = undefined
    this.ctx.updateHelpers._updateOptions(
      {
        chart: {
          selection: {
            xaxis: {
              min: targetChart.w.globals.minX,
              max: targetChart.w.globals.maxX,
            },
          },
        },
      },
      false,
      false,
    )
  }

  setupBrushHandler() {
    const { ctx, w } = this

    if (!w.config.chart.brush.enabled) return

    if (typeof w.config.chart.events.selection !== 'function') {
      const targets = Array.isArray(w.config.chart.brush.targets)
        ? w.config.chart.brush.targets
        : [w.config.chart.brush.target]
      targets.forEach((/** @type {any} */ target) => {
        const targetChart = /** @type {any} */ (ctx.constructor).getChartByID(
          target,
        )
        targetChart.w.globals.brushSource = this.ctx

        if (typeof targetChart.w.config.chart.events.zoomed !== 'function') {
          targetChart.w.config.chart.events.zoomed = () =>
            this.updateSourceChart(targetChart)
        }
        if (typeof targetChart.w.config.chart.events.scrolled !== 'function') {
          targetChart.w.config.chart.events.scrolled = () =>
            /**
             * @param {any} chart
             * @param {Event} e
             */
            this.updateSourceChart(targetChart)
        }
      })

      w.config.chart.events.selection = (
        /** @type {any} */ chart,
        /** @type {any} */ e,
      ) => {
        targets.forEach((/** @type {any} */ target) => {
          const targetChart = /** @type {any} */ (ctx.constructor).getChartByID(
            target,
          )
          targetChart.ctx.updateHelpers._updateOptions(
            {
              xaxis: {
                min: e.xaxis.min,
                max: e.xaxis.max,
              },
            },
            false,
            false,
            false,
            false,
          )
        })
      }
    }
  }

  getAccessibleChartLabel() {
    const w = this.w
    const cnf = w.config

    // 1. User-supplied description always wins.
    if (cnf.chart.accessibility && cnf.chart.accessibility.description) {
      return cnf.chart.accessibility.description
    }

    // 2. Build a descriptive label from available metadata.
    const chartType = cnf.chart.type
    const parts = []

    if (cnf.title.text) {
      parts.push(`${cnf.title.text}. ${chartType} chart`)
      if (cnf.subtitle.text) parts.push(cnf.subtitle.text)
    } else {
      // Pull series names from config.series when globals isn't populated yet.
      const namedSeries = (() => {
        if (
          Array.isArray(w.seriesData.seriesNames) &&
          w.seriesData.seriesNames.length
        ) {
          return w.seriesData.seriesNames.filter(Boolean)
        }
        if (Array.isArray(cnf.series)) {
          return cnf.series
            .map((s) => (typeof s === 'object' && s !== null ? s.name : null))
            .filter(Boolean)
        }
        return []
      })()
      const seriesCount =
        w.seriesData.series.length || (cnf.series ? cnf.series.length : 0)

      if (namedSeries.length) {
        parts.push(
          `${chartType} chart with ${seriesCount} data series: ${namedSeries.join(', ')}`,
        )
      } else {
        parts.push(`${chartType} chart with ${seriesCount} data series`)
      }
    }

    return parts.join('. ')
  }
}
