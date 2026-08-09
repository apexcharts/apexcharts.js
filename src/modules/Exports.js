// @ts-check
import AxesUtils from '../modules/axes/AxesUtils'
import Data from '../modules/Data'
import Series from '../modules/Series'
import Utils from '../utils/Utils'
import { Environment } from '../utils/Environment.js'
import { SVGNS } from '../svg/math'

class Exports {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: theme, timeScale (for AxesUtils), passes ctx to Data/Series
  }

  /**
   * @param {string} svgString
   */
  svgStringToNode(svgString) {
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
    return svgDoc.documentElement
  }

  /**
   * @param {any} svg
   * @param {number} scale
   */
  scaleSvgNode(svg, scale) {
    // get current both width and height of the svg
    const svgWidth = parseFloat(svg.getAttributeNS(null, 'width'))
    const svgHeight = parseFloat(svg.getAttributeNS(null, 'height'))
    // set new width and height based on the scale
    svg.setAttributeNS(null, 'width', svgWidth * scale)
    svg.setAttributeNS(null, 'height', svgHeight * scale)
    svg.setAttributeNS(null, 'viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
  }

  /**
   * Inline any Strata canvas series layer into the clone as an SVG `<image>`.
   * A serialized `<canvas>` loses its bitmap, so a canvas-mode export would drop
   * the series; an `<image>` carrying the canvas `toDataURL()` preserves it in
   * place. Because it replaces the `<foreignObject>` at the same DOM position,
   * the grid-behind / annotations-in-front z-order is retained automatically.
   * No-op in SVG mode (no series canvas present).
   * @param {any} clonedNode the cloned elWrap about to be serialized
   */
  inlineCanvasLayers(clonedNode) {
    const w = this.w
    const XLINK = 'http://www.w3.org/1999/xlink'
    const origCanvases = w.dom.elWrap.querySelectorAll(
      '.apexcharts-series-canvas',
    )
    if (!origCanvases.length) return
    const clonedFOs = clonedNode.querySelectorAll('.apexcharts-canvas-series')
    for (let i = 0; i < origCanvases.length && i < clonedFOs.length; i++) {
      let dataURL
      try {
        dataURL = /** @type {HTMLCanvasElement} */ (origCanvases[i]).toDataURL()
      } catch (e) {
        // A tainted canvas (should not happen: no cross-origin draws) throws;
        // skip rather than break the whole export.
        continue
      }
      const fo = clonedFOs[i]
      const img = document.createElementNS(SVGNS, 'image')
      img.setAttribute('x', fo.getAttribute('x') || '0')
      img.setAttribute('y', fo.getAttribute('y') || '0')
      img.setAttribute('width', fo.getAttribute('width') || '0')
      img.setAttribute('height', fo.getAttribute('height') || '0')
      img.setAttribute('href', dataURL)
      img.setAttributeNS(XLINK, 'xlink:href', dataURL)
      if (fo.parentNode) fo.parentNode.replaceChild(img, fo)
    }
  }

  /**
   * `querySelectorAll` as a typed array. Both HTML and SVG elements carry
   * `style` / `classList`, but `NodeListOf<Element>` does not.
   * @param {ParentNode} root
   * @param {string} selector
   * @returns {Array<HTMLElement | SVGElement>}
   */
  queryStyleable(root, selector) {
    return /** @type {Array<HTMLElement | SVGElement>} */ (
      Array.prototype.slice.call(root.querySelectorAll(selector))
    )
  }

  /**
   * Applies `styles` only where the element has no inline value for that
   * property yet.
   *
   * The rules being re-applied here came from a stylesheet, so anything a
   * module set inline has to keep winning exactly like it does in the live
   * DOM: `legend.fontSize` (Legend.js) and the heatmap gradient legend's
   * deliberate `display`/`overflow`/`padding` overrides on the legend wrap
   * (HeatmapGradientLegend.js) would otherwise be clobbered in the export.
   * @param {HTMLElement | SVGElement} el
   * @param {Record<string, string>} styles
   */
  setStyleDefaults(el, styles) {
    Object.keys(styles).forEach((prop) => {
      if (el.style.getPropertyValue(prop) === '') {
        el.style.setProperty(prop, styles[prop])
      }
    })
  }

  /**
   * Re-applies, as inline styles on the clone, the rules that used to reach
   * the exported SVG through an injected `<style>` block. A strict
   * Content-Security-Policy without `'unsafe-inline'` blocks that block and
   * breaks the export, so the export must not depend on one. See #5146.
   *
   * Mirrors `src/assets/apexcharts-legend.css`. Interaction-only rules
   * (`cursor`, `pointer-events`) are carried over for parity even though they
   * do nothing in a static image; the layout rules are what matter.
   * @param {HTMLElement} clonedNode the cloned elWrap about to be serialized
   */
  applyExportStyles(clonedNode) {
    const w = this.w

    // Legend.appendToForeignObject() appends the legend stylesheet inside
    // `elLegendForeign`, a descendant of `elWrap`, so it rides along in the
    // clone. Drop it, or the export still ships the very <style> tag whose
    // removal is the point of doing any of this.
    this.queryStyleable(clonedNode, 'style').forEach((el) => el.remove())

    // Transient overlays. querySelectorAll, not querySelector: a chart can
    // hold more than one of these (one yaxis tooltip per y-axis, a second
    // tooltip element for point annotations) and the stylesheet hid every
    // match, not just the first.
    this.queryStyleable(
      clonedNode,
      [
        '.apexcharts-tooltip',
        '.apexcharts-toolbar',
        '.apexcharts-xaxistooltip',
        '.apexcharts-yaxistooltip',
        '.apexcharts-xcrosshairs',
        '.apexcharts-ycrosshairs',
        '.apexcharts-zoom-rect',
        '.apexcharts-selection-rect',
      ].join(', '),
    ).forEach((el) => {
      // Hard override: these carry inline positioning and must never show up.
      el.style.setProperty('display', 'none', 'important')
    })

    // Stacked bars with a borderRadius are mirrored through these classes.
    this.queryStyleable(clonedNode, '.apexcharts-flip-y').forEach((el) => {
      this.setStyleDefaults(el, {
        transform: 'scaleY(-1) translateY(-100%)',
        'transform-origin': 'top',
        'transform-box': 'fill-box',
      })
    })
    this.queryStyleable(clonedNode, '.apexcharts-flip-x').forEach((el) => {
      this.setStyleDefaults(el, {
        transform: 'scaleX(-1)',
        'transform-origin': 'center',
        'transform-box': 'fill-box',
      })
    })

    if (
      !w.config.legend.show ||
      !w.dom.elLegendWrap ||
      !w.dom.elLegendWrap.children.length
    ) {
      return
    }

    this.queryStyleable(clonedNode, '.apexcharts-legend').forEach((el) => {
      this.setStyleDefaults(el, {
        display: 'flex',
        overflow: 'auto',
        padding: '0 10px',
      })

      const cl = el.classList
      const isSide =
        cl.contains('apx-legend-position-left') ||
        cl.contains('apx-legend-position-right')
      const isTopOrBottom =
        cl.contains('apx-legend-position-top') ||
        cl.contains('apx-legend-position-bottom')

      if (cl.contains('apexcharts-legend-group-horizontal')) {
        this.setStyleDefaults(el, { 'flex-direction': 'column' })
      }
      if (isSide) {
        this.setStyleDefaults(el, { 'flex-direction': 'column', bottom: '0' })
      }
      if (isTopOrBottom) {
        this.setStyleDefaults(el, { 'flex-wrap': 'wrap' })
      }

      // Alignment: side legends always align to the start; top/bottom follow
      // the `apexcharts-align-*` class.
      if (isSide || (isTopOrBottom && cl.contains('apexcharts-align-left'))) {
        this.setStyleDefaults(el, {
          'justify-content': 'flex-start',
          'align-items': 'flex-start',
        })
      } else if (isTopOrBottom && cl.contains('apexcharts-align-center')) {
        this.setStyleDefaults(el, {
          'justify-content': 'center',
          'align-items': 'center',
        })
      } else if (isTopOrBottom && cl.contains('apexcharts-align-right')) {
        this.setStyleDefaults(el, {
          'justify-content': 'flex-end',
          'align-items': 'flex-end',
        })
      }
    })

    this.queryStyleable(clonedNode, '.apexcharts-legend-group').forEach(
      (el) => {
        this.setStyleDefaults(el, { display: 'flex' })
      },
    )
    this.queryStyleable(
      clonedNode,
      '.apexcharts-legend-group-vertical',
    ).forEach((el) => {
      this.setStyleDefaults(el, { 'flex-direction': 'column-reverse' })
    })

    this.queryStyleable(clonedNode, '.apexcharts-legend-series').forEach(
      (el) => {
        this.setStyleDefaults(el, {
          cursor: el.classList.contains('apexcharts-no-click')
            ? 'auto'
            : 'pointer',
          'line-height': 'normal',
          display: 'flex',
          'align-items': 'center',
        })
      },
    )

    this.queryStyleable(clonedNode, '.apexcharts-legend-text').forEach((el) => {
      // font-size is a default only: Legend.js sets `legend.fontSize` inline,
      // and the legend box was measured at that size.
      this.setStyleDefaults(el, {
        position: 'relative',
        'font-size': '14px',
      })
    })

    this.queryStyleable(clonedNode, '.apexcharts-legend-marker').forEach(
      (el) => {
        this.setStyleDefaults(el, {
          position: 'relative',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          cursor: 'pointer',
          'margin-right': '1px',
        })
      },
    )

    this.queryStyleable(clonedNode, '.apexcharts-inactive-legend').forEach(
      (el) => {
        this.setStyleDefaults(el, { opacity: '0.45' })
      },
    )

    // `display: none !important` in the stylesheet, so force it here too.
    this.queryStyleable(
      clonedNode,
      '.apexcharts-legend .apexcharts-hidden-zero-series, .apexcharts-legend .apexcharts-hidden-null-series',
    ).forEach((el) => {
      el.style.setProperty('display', 'none', 'important')
    })
  }

  /**
   * @param {number} [_scale]
   */
  getSvgString(_scale) {
    return new Promise((resolve) => {
      const w = this.w
      let scale =
        _scale ||
        w.config.chart.toolbar.export.scale ||
        w.config.chart.toolbar.export.width / w.globals.svgWidth

      if (!scale) {
        scale = 1 // if no scale is specified, don't scale...
      }

      const width = w.globals.svgWidth * scale
      const height = w.globals.svgHeight * scale

      const clonedNode = /** @type {HTMLElement} */ (
        w.dom.elWrap.cloneNode(true)
      )
      clonedNode.style.width = width + 'px'
      clonedNode.style.height = height + 'px'
      // Strata: replace any series-canvas with an <image> before serialization.
      this.inlineCanvasLayers(clonedNode)

      this.applyExportStyles(clonedNode)

      const serializedNode = new XMLSerializer().serializeToString(clonedNode)

      let svgString = `
        <svg xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          class="apexcharts-svg"
          xmlns:data="ApexChartsNS"
          transform="translate(0, 0)"
          width="${w.globals.svgWidth}px" height="${w.globals.svgHeight}px">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px; height:${height}px;">
              ${serializedNode}
            </div>
          </foreignObject>
        </svg>
      `

      const svgNode = this.svgStringToNode(svgString)

      if (scale !== 1) {
        // scale the image
        this.scaleSvgNode(svgNode, scale)
      }

      this.convertImagesToBase64(svgNode).then(() => {
        svgString = new XMLSerializer().serializeToString(svgNode)
        resolve(svgString.replace(/&nbsp;/g, '&#160;'))
      })
    })
  }

  /**
   * @param {any} svgNode
   */
  convertImagesToBase64(svgNode) {
    const images = svgNode.getElementsByTagName('image')
    const promises = Array.from(images).map((img) => {
      const href = img.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
      if (href && !href.startsWith('data:')) {
        return this.getBase64FromUrl(href)
          .then((base64) => {
            img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', base64)
          })
          .catch((error) => {
            console.error('Error converting image to base64:', error)
          })
      }
      return Promise.resolve()
    })
    return Promise.all(promises)
  }

  /**
   * @param {string} url
   */
  getBase64FromUrl(url) {
    if (Environment.isSSR()) return Promise.resolve(url)

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL())
      }
      img.onerror = reject
      img.src = url
    })
  }

  svgUrl() {
    return new Promise((resolve) => {
      this.getSvgString().then((svgData) => {
        const svgBlob = new Blob([svgData], {
          type: 'image/svg+xml;charset=utf-8',
        })
        resolve(URL.createObjectURL(svgBlob))
      })
    })
  }

  /**
   * @param {Record<string, any> | undefined} options
   */
  dataURI(options) {
    if (Environment.isSSR()) return Promise.resolve({ imgURI: '' })

    return new Promise((resolve) => {
      const w = this.w

      const scale = options
        ? options.scale || options.width / w.globals.svgWidth
        : 1

      const canvas = document.createElement('canvas')
      canvas.width = w.globals.svgWidth * scale
      canvas.height = parseInt(w.dom.elWrap.style.height, 10) * scale // because of resizeNonAxisCharts

      const canvasBg =
        w.config.chart.background === 'transparent' ||
        !w.config.chart.background
          ? '#fff'
          : w.config.chart.background

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = canvasBg
      // canvas.width/height already include scale; do NOT multiply again, or a
      // scale < 1 export (dataURI({ width: < svgWidth })) fills only scale^2 of
      // the canvas, leaving the background missing on the right/bottom margins.
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      this.getSvgString(scale).then((svgData) => {
        const svgUrl = 'data:image/svg+xml,' + encodeURIComponent(svgData)
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          ctx.drawImage(img, 0, 0)

          /** @type {any} */ const edgeCanvas = canvas
          if (edgeCanvas.msToBlob) {
            // Legacy Microsoft Edge can't navigate to data urls, so return the blob instead
            const blob = edgeCanvas.msToBlob()
            resolve({ blob })
          } else {
            const imgURI = canvas.toDataURL('image/png')
            resolve({ imgURI })
          }
        }

        img.src = svgUrl
      })
    })
  }

  exportToSVG() {
    this.svgUrl().then((url) => {
      this.triggerDownload(
        url,
        this.w.config.chart.toolbar.export.svg.filename,
        '.svg',
      )
    })
  }

  exportToPng() {
    const scale = this.w.config.chart.toolbar.export.scale
    const width = this.w.config.chart.toolbar.export.width
    const option = scale
      ? { scale: scale }
      : width
        ? { width: width }
        : undefined
    this.dataURI(option).then(({ imgURI, blob }) => {
      if (blob) {
        // @ts-ignore — msSaveOrOpenBlob is an IE11-only API
        navigator.msSaveOrOpenBlob(blob, this.w.globals.chartID + '.png')
      } else {
        this.triggerDownload(
          imgURI,
          this.w.config.chart.toolbar.export.png.filename,
          '.png',
        )
      }
    })
  }

  /** @param {{ series?: any, fileName?: any, columnDelimiter?: string, lineDelimiter?: string }} opts */
  exportToCSV({
    series,
    fileName,
    columnDelimiter = ',',
    lineDelimiter = '\n',
  }) {
    const w = this.w

    if (!series) series = w.config.series

    /** @type {any[]} */
    let columns = []
    const rows = []
    let result = ''
    const universalBOM = '\uFEFF'
    /**
     * @param {Record<string, any>} s
     * @param {number} i
     */
    const gSeries = w.seriesData.series.map((s, i) => {
      return w.globals.collapsedSeriesIndices.indexOf(i) === -1 ? s : []
    })

    // CSV formula-injection guard: a spreadsheet evaluates a cell that begins
    // with = + - @ (or tab / CR) as a formula, so a category/value from
    // user-generated content (e.g. "=HYPERLINK(...)") would execute on open.
    // Prefix such non-numeric string cells with a single quote so they are read
    // as text. Numbers are untouched (a negative number is not a formula).
    /**
     * @param {any} val
     */
    const csvSafe = (val) => {
      // Leave null/undefined (empty cells) and numbers untouched; only guard
      // non-numeric string cells so we don't stringify an empty cell to
      // "undefined" or prefix a negative number.
      if (val == null || Utils.isNumber(val)) return val
      const s = String(val)
      return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
    }

    /**
     * @param {any} cat
     */
    const getFormattedCategory = (cat) => {
      if (
        typeof w.config.chart.toolbar.export.csv.categoryFormatter ===
        'function'
      ) {
        return w.config.chart.toolbar.export.csv.categoryFormatter(cat)
      }

      if (w.config.xaxis.type === 'datetime' && String(cat).length >= 10) {
        return new Date(cat).toDateString()
      }
      return Utils.isNumber(cat) ? cat : csvSafe(cat.split(columnDelimiter).join(''))
    }

    /**
     * @param {any} value
     */
    const getFormattedValue = (value) => {
      return typeof w.config.chart.toolbar.export.csv.valueFormatter ===
        'function'
        ? w.config.chart.toolbar.export.csv.valueFormatter(value)
        : csvSafe(value)
    }

    const seriesMaxDataLength = Math.max(
      /**
       * @param {Record<string, any>} s
       */
      ...series.map((/** @type {any} */ s) => {
        return s.data ? s.data.length : 0
      }),
    )
    const dataFormat = new Data(this.w)

    const axesUtils = new AxesUtils(this.w, {
      theme: this.ctx.theme,
      timeScale: this.ctx.timeScale,
    })
    /**
     * @param {number} i
     */
    const getCat = (i) => {
      let cat = ''

      // pie / donut/ radial
      if (!w.globals.axisCharts) {
        cat = w.config.labels[i]
      } else {
        // xy charts

        // non datetime
        if (
          w.config.xaxis.type === 'category' ||
          w.config.xaxis.convertedCatToNumeric
        ) {
          if (w.globals.isBarHorizontal) {
            const lbFormatter = w.formatters.yLabelFormatters[0]
            const sr = new Series(this.ctx.w)
            const activeSeries = sr.getActiveConfigSeriesIndex()

            cat = lbFormatter(w.labelData.labels[i], {
              seriesIndex: activeSeries,
              dataPointIndex: i,
              w,
            })
          } else {
            cat = axesUtils.getLabel(
              w.labelData.labels,
              w.labelData.timescaleLabels,
              0,
              i,
            ).text
          }
        }

        // datetime, but labels specified in categories or labels
        if (w.config.xaxis.type === 'datetime') {
          if (w.config.xaxis.categories.length) {
            cat = w.config.xaxis.categories[i]
          } else if (w.config.labels.length) {
            cat = w.config.labels[i]
          }
        }
      }

      // let the caller know the current category is null. this can happen for example
      // when dealing with line charts having inconsistent time series data
      if (cat === null) return 'nullvalue'

      if (Array.isArray(cat)) {
        cat = cat.join(' ')
      }

      return Utils.isNumber(cat) ? cat : cat.split(columnDelimiter).join('')
    }

    // Fix https://github.com/apexcharts/apexcharts.js/issues/3365
    const getEmptyDataForCsvColumn = () => {
      return [...Array(seriesMaxDataLength)].map(() => '')
    }

    /**
     * @param {Record<string, any>} s
     * @param {number} sI
     */
    const handleAxisRowsColumns = (s, sI) => {
      if (columns.length && sI === 0) {
        // It's the first series.  Go ahead and create the first row with header information.
        rows.push(columns.join(columnDelimiter))
      }

      if (s.data) {
        // Use the data we have, or a properly sized empty array. Use a LOCAL,
        // not `s.data = ...`: reassigning mutates the live series config, so an
        // empty series kept the placeholder '' points after export.
        const rowData = s.data.length ? s.data : getEmptyDataForCsvColumn()
        for (let i = 0; i < rowData.length; i++) {
          // Reset the columns array so that we can start building columns for this row.
          columns = []

          let cat = getCat(i)

          // current category is null, let's move on to the next one
          if (cat === 'nullvalue') continue

          if (!cat) {
            if (dataFormat.isFormatXY()) {
              cat = series[sI].data[i].x
            } else if (dataFormat.isFormat2DArray()) {
              cat = series[sI].data[i] ? series[sI].data[i][0] : ''
            }
          }

          if (sI === 0) {
            // It's the first series.  Also handle the category.
            columns.push(getFormattedCategory(cat))

            for (let ci = 0; ci < w.seriesData.series.length; ci++) {
              const value = dataFormat.isFormatXY()
                ? series[ci].data[i]?.y
                : gSeries[ci][i]
              columns.push(getFormattedValue(value))
            }
          }

          if (
            w.config.chart.type === 'candlestick' ||
            (s.type && s.type === 'candlestick')
          ) {
            columns.pop()
            columns.push(w.candleData.seriesCandleO[sI][i])
            columns.push(w.candleData.seriesCandleH[sI][i])
            columns.push(w.candleData.seriesCandleL[sI][i])
            columns.push(w.candleData.seriesCandleC[sI][i])
          }

          if (
            w.config.chart.type === 'boxPlot' ||
            (s.type && s.type === 'boxPlot')
          ) {
            columns.pop()
            columns.push(w.candleData.seriesCandleO[sI][i])
            columns.push(w.candleData.seriesCandleH[sI][i])
            columns.push(w.candleData.seriesCandleM[sI][i])
            columns.push(w.candleData.seriesCandleL[sI][i])
            columns.push(w.candleData.seriesCandleC[sI][i])
          }

          if (w.config.chart.type === 'rangeBar') {
            columns.pop()
            columns.push(w.rangeData.seriesRangeStart[sI][i])
            columns.push(w.rangeData.seriesRangeEnd[sI][i])
          }

          if (w.config.chart.type === 'violin' || (s.type && s.type === 'violin')) {
            columns.pop()
            columns.push(w.violinData.seriesViolinMin[sI]?.[i])
            columns.push(w.violinData.seriesViolinMax[sI]?.[i])
            columns.push(w.violinData.seriesViolinPoints[sI]?.[i]?.length ?? 0)
          }

          if (columns.length) {
            rows.push(columns.join(columnDelimiter))
          }
        }
      }
    }

    const handleUnequalXValues = () => {
      const categories = new Set()
      const data = {}

      /**
       * @param {Record<string, any>} s
       * @param {number} sI
       */
      series.forEach((/** @type {any} */ s, /** @type {any} */ sI) => {
        /**
         * @param {Record<string, any>} dataItem
         */
        s?.data.forEach((/** @type {any} */ dataItem) => {
          let cat, value
          if (dataFormat.isFormatXY()) {
            cat = dataItem.x
            value = dataItem.y
          } else if (dataFormat.isFormat2DArray()) {
            cat = dataItem[0]
            value = dataItem[1]
          } else {
            return
          }
          if (!(/** @type {Record<string,any>} */ (data)[cat])) {
            ;/** @type {Record<string,any>} */ (data)[cat] = Array(
              series.length,
            ).fill('')
          }
          ;/** @type {Record<string,any>} */ (data)[cat][sI] =
            getFormattedValue(value)
          categories.add(cat)
        })
      })

      if (columns.length) {
        rows.push(columns.join(columnDelimiter))
      }

      Array.from(categories)
        .sort()
        .forEach((cat) => {
          // Join here: pushing the array would leave rows.join() to stringify
          // it, which always uses a comma between category and values.
          const values = /** @type {Record<string,any>} */ (data)[cat]
          rows.push([getFormattedCategory(cat), ...values].join(columnDelimiter))
        })
    }

    columns.push(w.config.chart.toolbar.export.csv.headerCategory)

    if (w.config.chart.type === 'boxPlot') {
      columns.push('minimum')
      columns.push('q1')
      columns.push('median')
      columns.push('q3')
      columns.push('maximum')
    } else if (w.config.chart.type === 'candlestick') {
      columns.push('open')
      columns.push('high')
      columns.push('low')
      columns.push('close')
    } else if (w.config.chart.type === 'rangeBar') {
      columns.push('minimum')
      columns.push('maximum')
    } else if (w.config.chart.type === 'violin') {
      columns.push('minimum')
      columns.push('maximum')
      columns.push('observations')
    } else {
      /**
       * @param {Record<string, any>} s
       * @param {number} sI
       */
      series.map((/** @type {any} */ s, /** @type {any} */ sI) => {
        const sname = (s.name ? s.name : `series-${sI}`) + ''
        if (w.globals.axisCharts) {
          columns.push(
            sname.split(columnDelimiter).join('')
              ? sname.split(columnDelimiter).join('')
              : `series-${sI}`,
          )
        }
      })
    }

    if (!w.globals.axisCharts) {
      columns.push(w.config.chart.toolbar.export.csv.headerValue)
      rows.push(columns.join(columnDelimiter))
    }

    if (
      !w.globals.allSeriesHasEqualX &&
      w.globals.axisCharts &&
      !w.config.xaxis.categories.length &&
      !w.config.labels.length
    ) {
      handleUnequalXValues()
    } else {
      /**
       * @param {Record<string, any>} s
       * @param {number} sI
       */
      series.map((/** @type {any} */ s, /** @type {any} */ sI) => {
        if (w.globals.axisCharts) {
          handleAxisRowsColumns(s, sI)
        } else {
          columns = []

          columns.push(getFormattedCategory(w.labelData.labels[sI]))
          columns.push(getFormattedValue(gSeries[sI]))
          rows.push(columns.join(columnDelimiter))
        }
      })
    }

    result += rows.join(lineDelimiter)

    this.triggerDownload(
      'data:text/csv; charset=utf-8,' +
        encodeURIComponent(universalBOM + result),
      fileName ? fileName : w.config.chart.toolbar.export.csv.filename,
      '.csv',
    )
  }

  /**
   * @param {string} href
   * @param {string} filename
   * @param {string} ext
   */
  triggerDownload(href, filename, ext) {
    if (Environment.isSSR()) return

    const downloadLink = document.createElement('a')
    downloadLink.href = href
    downloadLink.download = (filename ? filename : this.w.globals.chartID) + ext
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }
}

export default Exports
