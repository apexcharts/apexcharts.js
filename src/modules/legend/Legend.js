import CoreUtils from '../CoreUtils'
import Dimensions from '../dimensions/Dimensions'
import Graphics from '../Graphics'
import Series from '../Series'
import Utils from '../../utils/Utils'
import Helpers from './Helpers'
import Markers from '../Markers'
import { Environment } from '../../utils/Environment.js'

/**
 * ApexCharts Legend Class to draw legend.
 *
 * @module Legend
 **/

class Legend {
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: fires events, passes chart instance to user callbacks

    // Injected callbacks used by LegendHelpers (avoids lgCtx.ctx.pie / lgCtx.ctx.updateHelpers)
    this.printDataLabelsInner = (...a) => ctx.pie?.printDataLabelsInner(...a)
    this.updateSeries = (...a) => ctx.updateHelpers._updateSeries(...a)

    this.onLegendClick = this.onLegendClick.bind(this)
    this.onLegendHovered = this.onLegendHovered.bind(this)

    this.isBarsDistributed =
      this.w.config.chart.type === 'bar' &&
      this.w.config.plotOptions.bar.distributed &&
      this.w.config.series.length === 1

    this.legendHelpers = new Helpers(this)
  }

  init() {
    const w = this.w

    const gl = w.globals
    const cnf = w.config

    const showLegendAlways =
      (cnf.legend.showForSingleSeries && this.w.seriesData.series.length === 1) ||
      this.isBarsDistributed ||
      this.w.seriesData.series.length > 1

    this.legendHelpers.appendToForeignObject()

    if ((showLegendAlways || !gl.axisCharts) && cnf.legend.show) {
      while (w.dom.elLegendWrap.firstChild) {
        w.dom.elLegendWrap.removeChild(w.dom.elLegendWrap.firstChild)
      }

      this.drawLegends()

      if (cnf.legend.position === 'bottom' || cnf.legend.position === 'top') {
        this.legendAlignHorizontal()
      } else if (
        cnf.legend.position === 'right' ||
        cnf.legend.position === 'left'
      ) {
        this.legendAlignVertical()
      }
    }
  }

  createLegendMarker({ i, fillcolor }) {
    const w = this.w
    const elMarker = document.createElement('span')
    elMarker.classList.add('apexcharts-legend-marker')

    const mShape = w.config.legend.markers.shape || w.config.markers.shape
    let shape = mShape
    if (Array.isArray(mShape)) {
      shape = mShape[i]
    }
    const mSize = Array.isArray(w.config.legend.markers.size)
      ? parseFloat(w.config.legend.markers.size[i])
      : parseFloat(w.config.legend.markers.size)
    const mOffsetX = Array.isArray(w.config.legend.markers.offsetX)
      ? parseFloat(w.config.legend.markers.offsetX[i])
      : parseFloat(w.config.legend.markers.offsetX)
    const mOffsetY = Array.isArray(w.config.legend.markers.offsetY)
      ? parseFloat(w.config.legend.markers.offsetY[i])
      : parseFloat(w.config.legend.markers.offsetY)
    const mBorderWidth = Array.isArray(w.config.legend.markers.strokeWidth)
      ? parseFloat(w.config.legend.markers.strokeWidth[i])
      : parseFloat(w.config.legend.markers.strokeWidth)

    const mStyle = elMarker.style

    mStyle.height = (mSize + mBorderWidth) * 2 + 'px'
    mStyle.width = (mSize + mBorderWidth) * 2 + 'px'
    mStyle.left = mOffsetX + 'px'
    mStyle.top = mOffsetY + 'px'

    if (w.config.legend.markers.customHTML) {
      mStyle.background = 'transparent'
      mStyle.color = fillcolor[i]

      if (Array.isArray(w.config.legend.markers.customHTML)) {
        if (w.config.legend.markers.customHTML[i]) {
          elMarker.innerHTML = w.config.legend.markers.customHTML[i]()
        }
      } else {
        elMarker.innerHTML = w.config.legend.markers.customHTML()
      }
    } else {
      const markers = new Markers(this.ctx.w, this.ctx)

      const markerConfig = markers.getMarkerConfig({
        cssClass: `apexcharts-legend-marker apexcharts-marker apexcharts-marker-${shape}`,
        seriesIndex: i,
        strokeWidth: mBorderWidth,
        size: mSize,
      })

      const SVGLib = Environment.isBrowser() ? window.SVG : global.SVG
      const SVGMarker = SVGLib().addTo(elMarker).size('100%', '100%')
      const marker = new Graphics(this.w).drawMarker(0, 0, {
        ...markerConfig,
        pointFillColor: Array.isArray(fillcolor)
          ? fillcolor[i]
          : markerConfig.pointFillColor,
        shape,
      })

      const shapesEls = w.dom.Paper.find(
        '.apexcharts-legend-marker.apexcharts-marker'
      )
      shapesEls.forEach((shapeEl) => {
        if (shapeEl.node.classList.contains('apexcharts-marker-triangle')) {
          shapeEl.node.style.transform = 'translate(50%, 45%)'
        } else {
          shapeEl.node.style.transform = 'translate(50%, 50%)'
        }
      })
      SVGMarker.add(marker)
    }
    return elMarker
  }

  drawLegends() {
    const me = this
    const w = this.w

    const fontFamily = w.config.legend.fontFamily

    let legendNames = w.seriesData.seriesNames
    let fillcolor = w.config.legend.markers.fillColors
      ? w.config.legend.markers.fillColors.slice()
      : w.globals.colors.slice()

    if (w.config.chart.type === 'heatmap') {
      const ranges = w.config.plotOptions.heatmap.colorScale.ranges
      legendNames = ranges.map((colorScale) => {
        return colorScale.name
          ? colorScale.name
          : colorScale.from + ' - ' + colorScale.to
      })
      fillcolor = ranges.map((color) => color.color)
    } else if (this.isBarsDistributed) {
      legendNames = w.labelData.labels.slice()
    }

    if (w.config.legend.customLegendItems.length) {
      legendNames = w.config.legend.customLegendItems
    }
    const legendFormatter = w.formatters.legendFormatter

    const isLegendInversed = w.config.legend.inverseOrder

    const legendGroups = []

    if (
      w.labelData.seriesGroups.length > 1 &&
      w.config.legend.clusterGroupedSeries
    ) {
      w.labelData.seriesGroups.forEach((_, gi) => {
        legendGroups[gi] = document.createElement('div')
        legendGroups[gi].classList.add(
          'apexcharts-legend-group',
          `apexcharts-legend-group-${gi}`
        )
        if (w.config.legend.clusterGroupedSeriesOrientation === 'horizontal') {
          w.dom.elLegendWrap.classList.add(
            'apexcharts-legend-group-horizontal'
          )
        } else {
          legendGroups[gi].classList.add('apexcharts-legend-group-vertical')
        }
      })
    }

    for (
      let i = isLegendInversed ? legendNames.length - 1 : 0;
      isLegendInversed ? i >= 0 : i <= legendNames.length - 1;
      isLegendInversed ? i-- : i++
    ) {
      const text = legendFormatter(legendNames[i], { seriesIndex: i, w })

      let collapsedSeries = false
      let ancillaryCollapsedSeries = false
      if (w.globals.collapsedSeries.length > 0) {
        for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
          if (w.globals.collapsedSeries[c].index === i) {
            collapsedSeries = true
          }
        }
      }

      if (w.globals.ancillaryCollapsedSeriesIndices.length > 0) {
        for (
          let c = 0;
          c < w.globals.ancillaryCollapsedSeriesIndices.length;
          c++
        ) {
          if (w.globals.ancillaryCollapsedSeriesIndices[c] === i) {
            ancillaryCollapsedSeries = true
          }
        }
      }

      const elMarker = this.createLegendMarker({ i, fillcolor })

      Graphics.setAttrs(elMarker, {
        rel: i + 1,
        'data:collapsed': collapsedSeries || ancillaryCollapsedSeries,
      })

      if (collapsedSeries || ancillaryCollapsedSeries) {
        elMarker.classList.add('apexcharts-inactive-legend')
      }

      const elLegend = document.createElement('div')

      // accessibility attributes
      if (
        w.config.chart.accessibility.enabled &&
        w.config.chart.accessibility.keyboard.enabled
      ) {
        elLegend.setAttribute('role', 'button')
        elLegend.setAttribute('tabindex', '0')

        // Use formatted legend text (handle both string and array)
        const seriesName = Array.isArray(text) ? text.join(' ') : text
        const isCollapsed = collapsedSeries || ancillaryCollapsedSeries
        const statusText = isCollapsed ? 'hidden' : 'visible'
        elLegend.setAttribute(
          'aria-label',
          `${seriesName}, ${statusText}. Press Enter or Space to toggle.`
        )
        elLegend.setAttribute('aria-pressed', isCollapsed ? 'true' : 'false')
      }

      const elLegendText = document.createElement('span')
      elLegendText.classList.add('apexcharts-legend-text')
      elLegendText.innerHTML = Array.isArray(text) ? text.join(' ') : text

      let textColor = w.config.legend.labels.useSeriesColors
        ? w.globals.colors[i]
        : Array.isArray(w.config.legend.labels.colors)
        ? w.config.legend.labels.colors?.[i]
        : w.config.legend.labels.colors

      if (!textColor) {
        textColor = w.config.chart.foreColor
      }

      elLegendText.style.color = textColor

      elLegendText.style.fontSize = w.config.legend.fontSize
      elLegendText.style.fontWeight = w.config.legend.fontWeight
      elLegendText.style.fontFamily = fontFamily || w.config.chart.fontFamily

      Graphics.setAttrs(elLegendText, {
        rel: i + 1,
        i,
        'data:default-text': encodeURIComponent(text),
        'data:collapsed': collapsedSeries || ancillaryCollapsedSeries,
      })

      elLegend.appendChild(elMarker)
      elLegend.appendChild(elLegendText)

      const coreUtils = new CoreUtils(this.w)
      if (!w.config.legend.showForZeroSeries) {
        const total = coreUtils.getSeriesTotalByIndex(i)

        if (
          total === 0 &&
          coreUtils.seriesHaveSameValues(i) &&
          !coreUtils.isSeriesNull(i) &&
          w.globals.collapsedSeriesIndices.indexOf(i) === -1 &&
          w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1
        ) {
          elLegend.classList.add('apexcharts-hidden-zero-series')
        }
      }

      if (!w.config.legend.showForNullSeries) {
        if (
          coreUtils.isSeriesNull(i) &&
          w.globals.collapsedSeriesIndices.indexOf(i) === -1 &&
          w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1
        ) {
          elLegend.classList.add('apexcharts-hidden-null-series')
        }
      }

      if (legendGroups.length) {
        w.labelData.seriesGroups.forEach((group, gi) => {
          if (group.includes(w.config.series[i]?.name)) {
            w.dom.elLegendWrap.appendChild(legendGroups[gi])
            legendGroups[gi].appendChild(elLegend)
          }
        })
      } else {
        w.dom.elLegendWrap.appendChild(elLegend)
      }

      w.dom.elLegendWrap.classList.add(
        `apexcharts-align-${w.config.legend.horizontalAlign}`
      )
      w.dom.elLegendWrap.classList.add(
        'apx-legend-position-' + w.config.legend.position
      )

      elLegend.classList.add('apexcharts-legend-series')
      elLegend.style.margin = `${w.config.legend.itemMargin.vertical}px ${w.config.legend.itemMargin.horizontal}px`
      w.dom.elLegendWrap.style.width = w.config.legend.width
        ? w.config.legend.width + 'px'
        : ''
      w.dom.elLegendWrap.style.height = w.config.legend.height
        ? w.config.legend.height + 'px'
        : ''

      Graphics.setAttrs(elLegend, {
        rel: i + 1,
        seriesName: Utils.escapeString(legendNames[i]),
        'data:collapsed': collapsedSeries || ancillaryCollapsedSeries,
      })

      if (collapsedSeries || ancillaryCollapsedSeries) {
        elLegend.classList.add('apexcharts-inactive-legend')
      }

      if (!w.config.legend.onItemClick.toggleDataSeries) {
        elLegend.classList.add('apexcharts-no-click')
      }
    }

    w.dom.elWrap.addEventListener('click', me.onLegendClick, true)

    if (
      w.config.legend.onItemHover.highlightDataSeries &&
      w.config.legend.customLegendItems.length === 0
    ) {
      w.dom.elWrap.addEventListener(
        'mousemove',
        me.onLegendHovered,
        true
      )
      w.dom.elWrap.addEventListener(
        'mouseout',
        me.onLegendHovered,
        true
      )
    }

    // keyboard navigation support
    if (
      w.config.chart.accessibility.enabled &&
      w.config.chart.accessibility.keyboard.enabled
    ) {
      w.dom.elWrap.addEventListener('keydown', me.onLegendKeyDown.bind(me), true)
    }
  }

  setLegendWrapXY(offsetX, offsetY) {
    const w = this.w

    const elLegendWrap = w.dom.elLegendWrap

    const legendHeight = elLegendWrap.clientHeight

    let x = 0
    let y = 0

    if (w.config.legend.position === 'bottom') {
      y =
        w.globals.svgHeight -
        Math.min(legendHeight, w.globals.svgHeight / 2) -
        5
    } else if (w.config.legend.position === 'top') {
      const dim = new Dimensions(this.w, this.ctx)
      const titleH = dim.dimHelpers.getTitleSubtitleCoords('title').height
      const subtitleH = dim.dimHelpers.getTitleSubtitleCoords('subtitle').height

      y = (titleH > 0 ? titleH - 10 : 0) + (subtitleH > 0 ? subtitleH - 10 : 0)
    }

    elLegendWrap.style.position = 'absolute'

    x = x + offsetX + w.config.legend.offsetX
    y = y + offsetY + w.config.legend.offsetY

    elLegendWrap.style.left = x + 'px'
    elLegendWrap.style.top = y + 'px'

    if (w.config.legend.position === 'right') {
      elLegendWrap.style.left = 'auto'
      elLegendWrap.style.right = 25 + w.config.legend.offsetX + 'px'
    }

    const fixedHeigthWidth = ['width', 'height']
    fixedHeigthWidth.forEach((hw) => {
      if (elLegendWrap.style[hw]) {
        elLegendWrap.style[hw] = parseInt(w.config.legend[hw], 10) + 'px'
      }
    })
  }

  legendAlignHorizontal() {
    const w = this.w

    const elLegendWrap = w.dom.elLegendWrap

    elLegendWrap.style.right = 0

    const dimensions = new Dimensions(this.w, this.ctx)
    const titleRect = dimensions.dimHelpers.getTitleSubtitleCoords('title')
    const subtitleRect = dimensions.dimHelpers.getTitleSubtitleCoords('subtitle')

    const offsetX = 20
    let offsetY = 0

    if (w.config.legend.position === 'top') {
      offsetY =
        titleRect.height +
        subtitleRect.height +
        w.config.title.margin +
        w.config.subtitle.margin -
        10
    }

    this.setLegendWrapXY(offsetX, offsetY)
  }

  legendAlignVertical() {
    const w = this.w

    const lRect = this.legendHelpers.getLegendDimensions()

    const offsetY = 20
    let offsetX = 0

    if (w.config.legend.position === 'left') {
      offsetX = 20
    }

    if (w.config.legend.position === 'right') {
      offsetX = w.globals.svgWidth - lRect.clww - 10
    }

    this.setLegendWrapXY(offsetX, offsetY)
  }

  onLegendHovered(e) {
    const w = this.w

    const hoverOverLegend =
      e.target.classList.contains('apexcharts-legend-series') ||
      e.target.classList.contains('apexcharts-legend-text') ||
      e.target.classList.contains('apexcharts-legend-marker')

    if (w.config.chart.type !== 'heatmap' && !this.isBarsDistributed) {
      if (
        !e.target.classList.contains('apexcharts-inactive-legend') &&
        hoverOverLegend
      ) {
        const series = new Series(this.ctx.w)
        series.toggleSeriesOnHover(e, e.target)
      }
    } else {
      // for heatmap handling
      if (hoverOverLegend) {
        const seriesCnt = parseInt(e.target.getAttribute('rel'), 10) - 1
        this.ctx.events.fireEvent('legendHover', [this.ctx, seriesCnt, this.w])

        const series = new Series(this.ctx.w)
        series.highlightRangeInSeries(e, e.target)
      }
    }
  }

  onLegendKeyDown(e) {
    const me = this
    const w = this.w

    // Check if event target is a legend item
    const isLegendItem =
      e.target.classList.contains('apexcharts-legend-series') ||
      e.target.classList.contains('apexcharts-legend-text') ||
      e.target.classList.contains('apexcharts-legend-marker')

    if (!isLegendItem) return

    // Handle Enter or Space key
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault() // Prevent page scroll on Space

      // Capture the rel index before the click (toggleDataSeries re-renders
      // the legend DOM, which destroys the focused element).
      const rel = e.target.getAttribute('rel')

      // Trigger click handler
      me.onLegendClick(e)

      // After re-render, restore focus to the same legend item so the user
      // can keep toggling without having to re-tab to the legend.
      if (rel !== null && w.config.legend.onItemClick.toggleDataSeries) {
        requestAnimationFrame(() => {
          const restored = w.dom.baseEl.querySelector(
            `.apexcharts-legend-series[rel="${rel}"]`
          )
          if (restored) restored.focus()
        })
      }
    }
  }

  onLegendClick(e) {
    const w = this.w

    if (w.config.legend.customLegendItems.length) return

    if (
      e.target.classList.contains('apexcharts-legend-series') ||
      e.target.classList.contains('apexcharts-legend-text') ||
      e.target.classList.contains('apexcharts-legend-marker')
    ) {
      const seriesCnt = parseInt(e.target.getAttribute('rel'), 10) - 1
      const isHidden = e.target.getAttribute('data:collapsed') === 'true'

      const legendClick = this.w.config.chart.events.legendClick
      if (typeof legendClick === 'function') {
        legendClick(this.ctx, seriesCnt, this.w)
      }

      this.ctx.events.fireEvent('legendClick', [this.ctx, seriesCnt, this.w])

      const markerClick = this.w.config.legend.markers.onClick
      if (
        typeof markerClick === 'function' &&
        e.target.classList.contains('apexcharts-legend-marker')
      ) {
        markerClick(this.ctx, seriesCnt, this.w)
        this.ctx.events.fireEvent('legendMarkerClick', [
          this.ctx,
          seriesCnt,
          this.w,
        ])
      }

      // for now - just prevent click on heatmap legend - and allow hover only
      const clickAllowed =
        w.config.chart.type !== 'treemap' &&
        w.config.chart.type !== 'heatmap' &&
        !this.isBarsDistributed

      if (clickAllowed && w.config.legend.onItemClick.toggleDataSeries) {
        this.legendHelpers.toggleDataSeries(seriesCnt, isHidden)
      }
    }
  }
}

export default Legend
