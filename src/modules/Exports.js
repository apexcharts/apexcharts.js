// @ts-check
import AxesUtils from '../modules/axes/AxesUtils'
import Series from '../modules/Series'
import Utils from '../utils/Utils'
import { Environment } from '../utils/Environment.js'
import { BrowserAPIs } from '../ssr/BrowserAPIs'
import { SVGNS } from '../svg/math'

class Exports {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: theme, timeScale (for AxesUtils), passes ctx to Series
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
   * The colour a raster export paints under the chart.
   *
   * A PNG needs an opaque base, so `dataURI` fills the canvas before drawing
   * the SVG onto it. That fill used to be `#fff` whenever `chart.background`
   * was unset *or* `'transparent'`, which is wrong for a dark theme:
   * `theme.mode: 'dark'` moves `chart.foreColor` to a near-white `#f6f7f8` but
   * leaves the background alone, so `background: 'transparent'` produced
   * near-white labels, axes and legend on white — a PNG that looked like it had
   * lost all its text. See #2920.
   *
   * The unset-background case was already covered: `Core.setupElements` paints
   * the SVG paper `#343A3F` for a dark theme, and the clone carries that inline
   * style into the export. `'transparent'` is the gap, because it makes that
   * paper style transparent too and nothing is left to cover the white fill.
   *
   * An explicit non-transparent `chart.background` still wins, including one
   * written by the Facet `--apx-surface` token (Theme assigns it into the same
   * field).
   * @returns {string}
   */
  resolveExportBackground() {
    const w = this.w
    const bg = w.config.chart.background
    if (bg && bg !== 'transparent') return bg
    // Same dark surface Core.setupElements gives the paper, so a transparent
    // dark chart rasterizes to the surface it would have had by default.
    return w.config.theme.mode === 'dark' ? '#343A3F' : '#fff'
  }

  /**
   * Font families the rendered chart actually paints with.
   *
   * Read off the live DOM rather than the config: computed styles resolve
   * `chart.fontFamily`, every per-element `style.fontFamily` override, and any
   * family the chart inherits from the page, none of which are reliably
   * enumerable from config alone. The clone is not in the document, so its
   * computed styles would come back empty.
   * @returns {Set<string>}
   */
  collectFontFamilies() {
    /** @type {Set<string>} */
    const families = new Set()
    const w = this.w
    if (!Environment.isBrowser() || !w.dom.elWrap) return families

    const els = this.queryStyleable(
      w.dom.elWrap,
      'text, tspan, .apexcharts-legend-text, .apexcharts-title-text, .apexcharts-subtitle-text',
    )
    // The wrap itself carries chart.fontFamily, which the text inherits.
    /** @type {Array<Element>} */
    const all = [w.dom.elWrap, ...els]

    all.forEach((el) => {
      const cs = /** @type {any} */ (
        BrowserAPIs.getComputedStyle(/** @type {any} */ (el))
      )
      const ff = cs && cs.fontFamily
      if (!ff) return
      ff.split(',').forEach((/** @type {string} */ name) => {
        const clean = name.trim().replace(/^['"]|['"]$/g, '')
        if (clean) families.add(clean.toLowerCase())
      })
    })

    return families
  }

  /**
   * Every `@font-face` rule reachable from the document, as
   * `{ family, css, base }`, where `base` is the URL the rule's relative
   * `url()`s resolve against: its stylesheet, not the page.
   *
   * Same-origin sheets are read through `cssRules`, descending into `@import`
   * and grouping rules (`@media`, `@supports`, `@layer`). A cross-origin sheet
   * throws on that access, so it is re-fetched by href and its `@font-face`
   * blocks are pulled out of the text: that is the path that matters in
   * practice, since hosted webfonts (the subject of #3617) are exactly the
   * cross-origin case.
   * @returns {Promise<Array<{family: string, css: string, base: string}>>}
   */
  collectFontFaceRules() {
    if (!Environment.isBrowser()) return Promise.resolve([])

    /** @type {Array<{family: string, css: string, base: string}>} */
    const found = []
    /** @type {Array<Promise<void>>} */
    const remote = []

    /**
     * @param {string} cssText
     * @param {string} base
     */
    const pushFromText = (cssText, base) => {
      const blocks = cssText.match(/@font-face\s*\{[^}]*\}/gi) || []
      blocks.forEach((css) => {
        const m = css.match(/font-family\s*:\s*([^;}]+)/i)
        if (!m) return
        const family = m[1].trim().replace(/^['"]|['"]$/g, '')
        found.push({ family: family.toLowerCase(), css, base })
      })
    }

    /**
     * @param {any} rules
     * @param {string} base
     */
    const walkRules = (rules, base) => {
      Array.from(rules).forEach((/** @type {any} */ rule) => {
        // CSSFontFaceRule === 5, compared numerically so it also works in
        // engines that don't expose the CSSRule constant.
        if (rule.type === 5) {
          if (rule.cssText) pushFromText(rule.cssText, base)
        } else if (rule.styleSheet) {
          walkSheet(rule.styleSheet) // @import
        } else if (rule.cssRules) {
          walkRules(rule.cssRules, base) // @media, @supports, @layer
        }
      })
    }

    /** @param {any} sheet */
    const walkSheet = (sheet) => {
      /** @type {any} */
      let rules = null
      try {
        rules = sheet.cssRules
      } catch (e) {
        // Cross-origin sheet: unreadable here, re-fetch it below.
      }

      if (rules) {
        walkRules(rules, sheet.href || document.baseURI)
      } else if (sheet.href) {
        remote.push(
          fetch(sheet.href)
            .then((r) => (r.ok ? r.text() : ''))
            .then((text) => pushFromText(text, sheet.href))
            .catch(() => {}),
        )
      }
    }

    Array.from(document.styleSheets || []).forEach(walkSheet)

    return Promise.all(remote).then(() => found)
  }

  /**
   * Inline the `@font-face` rules for the families the chart uses, with the
   * font files themselves as base64 data URIs, into the exported SVG.
   *
   * Needed because the export is a standalone document: rasterizing it through
   * `<img src="data:image/svg+xml,...">` gives it no access to the page's
   * stylesheets *or* its loaded fonts, and an SVG-as-image may not fetch
   * external resources at all. Without this the text silently reflows into a
   * generic fallback face. See #3617.
   *
   * `@font-face` only exists as a stylesheet construct, so unlike the rules in
   * `applyExportStyles` this cannot be expressed as inline styles and has to
   * ship as a `<style>` element. A page whose CSP forbids inline styles will
   * drop it and fall back to today's behaviour, which is why the whole thing is
   * best-effort: any failure leaves the export exactly as it was.
   * @param {any} svgNode the parsed outer <svg> about to be serialized
   * @returns {Promise<void>}
   */
  embedFonts(svgNode) {
    const w = this.w
    if (
      !Environment.isBrowser() ||
      !w.config.chart.toolbar.export.embedFonts ||
      typeof fetch !== 'function'
    ) {
      return Promise.resolve()
    }

    const used = this.collectFontFamilies()
    if (!used.size) return Promise.resolve()

    return this.collectFontFaceRules()
      .then((faces) => {
        const wanted = faces.filter((f) => used.has(f.family))
        if (!wanted.length) return Promise.resolve([])

        return Promise.all(
          wanted.map((face) =>
            this.inlineFontFaceUrls(face.css, face.base).catch(() => null),
          ),
        )
      })
      .then((cssBlocks) => {
        const css = (cssBlocks || []).filter(Boolean).join('\n')
        if (!css) return
        const style = document.createElementNS(SVGNS, 'style')
        style.textContent = css
        // First child: @font-face must be parsed before the text that uses it.
        svgNode.insertBefore(style, svgNode.firstChild)
      })
      .catch(() => {
        // Font embedding is an enhancement; never fail the export over it.
      })
  }

  /**
   * Replace every remote `url(...)` in one `@font-face` block with a base64
   * data URI. Resolves to null if no url could be fetched, so the caller can
   * drop a block that would only reference unreachable files.
   * @param {string} css
   * @param {string} [base] the URL relative `url()`s resolve against
   * @returns {Promise<string | null>}
   */
  inlineFontFaceUrls(css, base) {
    const urls = []
    const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi
    let m
    while ((m = re.exec(css)) !== null) {
      if (!m[2].startsWith('data:')) urls.push(m[2])
    }
    if (!urls.length) return Promise.resolve(css.includes('data:') ? css : null)

    return Promise.all(
      urls.map((url) =>
        this.fetchAsDataUri(base ? new URL(url, base).href : url)
          .then((dataUri) => ({ url, dataUri }))
          .catch(() => ({ url, dataUri: null })),
      ),
    ).then((results) => {
      let out = css
      let replaced = 0
      results.forEach(({ url, dataUri }) => {
        if (!dataUri) return
        out = out.split(url).join(dataUri)
        replaced++
      })
      return replaced ? out : null
    })
  }

  /**
   * Fetch a binary asset as a base64 data URI.
   *
   * Uses `fetch` rather than the `<img>`+canvas route in `getBase64FromUrl`:
   * that route only works for raster images and taints the canvas for any
   * response without CORS headers, whereas this works for fonts too and fails
   * cleanly when CORS denies it.
   * @param {string} url
   * @returns {Promise<string>}
   */
  fetchAsDataUri(url) {
    if (typeof fetch !== 'function' || typeof btoa !== 'function') {
      // Rejects rather than resolves so callers fall through to their
      // non-fetch fallback instead of writing an unusable href.
      return Promise.reject(new Error('fetch unavailable'))
    }
    return fetch(url).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      const type = res.headers.get('content-type') || 'application/octet-stream'
      return res.arrayBuffer().then((buf) => {
        const bytes = new Uint8Array(buf)
        let binary = ''
        // Chunked: a spread/apply over a whole font file blows the argument
        // limit on larger faces.
        const CHUNK = 0x8000
        for (let i = 0; i < bytes.length; i += CHUNK) {
          binary += String.fromCharCode.apply(
            null,
            /** @type {any} */ (bytes.subarray(i, i + CHUNK)),
          )
        }
        return `data:${type};base64,${btoa(binary)}`
      })
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

      // A plot or circle still easing to a new layout (LayoutTransition,
      // CircleTransition) lands first: the export is of the chart as laid
      // out, not of a frame on the way. Exporting right after an update
      // resolves (add a title, then export) is exactly its first frame.
      // The axis chrome tweens (AxisTransition) land with them, or the ticks
      // the layout tween leaves to them stay at their old spots, entering
      // ticks stay invisible and exit ghosts get cloned in. This is
      // finishChromeTweens inlined, so the exports add-on does not bundle
      // AxisTransition.
      w.globals.layoutTween?.finish()
      w.globals.circleTween?.finish()
      w.globals.highlightTween?.finish()
      ;[...(w.globals.chromeTweens || [])].forEach((finish) => finish())

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

      Promise.all([
        this.convertImagesToBase64(svgNode),
        this.embedFonts(svgNode),
      ]).then(() => {
        svgString = new XMLSerializer().serializeToString(svgNode)
        resolve(svgString.replace(/&nbsp;/g, '&#160;'))
      })
    })
  }

  /**
   * Turn every remote `<image>` in the export into an inline data URI.
   *
   * This is not an optimisation: an SVG rasterized through `<img src="data:...">`
   * is not allowed to fetch external resources, so any href left pointing at a
   * URL vanishes from the PNG entirely. Image annotations and `hollow.image`
   * were disappearing from downloads for exactly this reason. See #3170.
   *
   * Two things were missing before. `SVGContainer.image()` writes `xlink:href`,
   * but Strata's inlined canvas layers and hand-authored `customSVG` markup use
   * the plain `href` form, and only the namespaced attribute was being read.
   * And conversion went through `<img>`+canvas, which taints (and therefore
   * throws) for any response without CORS headers, so a cross-origin icon,
   * the common case, silently failed. `fetch` is tried first and only falls
   * back to the canvas route, which still helps for a same-origin image on a
   * page whose CSP blocks `connect-src`.
   * @param {any} svgNode
   */
  convertImagesToBase64(svgNode) {
    const XLINK = 'http://www.w3.org/1999/xlink'
    const images = svgNode.getElementsByTagName('image')
    const promises = Array.from(images).map((/** @type {any} */ img) => {
      const nsHref = img.getAttributeNS(XLINK, 'href')
      const plainHref = img.getAttribute('href')
      const href = nsHref || plainHref
      if (!href || href.startsWith('data:')) return Promise.resolve()

      /** @param {string} base64 */
      const write = (base64) => {
        // Write back whichever forms were present, so the element keeps
        // working in both the modern and the xlink-only reading.
        if (nsHref) img.setAttributeNS(XLINK, 'href', base64)
        if (plainHref || !nsHref) img.setAttribute('href', base64)
      }

      return this.fetchAsDataUri(href)
        .then(write)
        .catch(() =>
          this.getBase64FromUrl(href)
            .then(write)
            .catch((error) => {
              console.error('Error converting image to base64:', error)
            }),
        )
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
   * Resolves `{ imgURI: '' }` when the PNG cannot be made (no 2d context for
   * a canvas that size, an SVG the browser will not decode, a tainted
   * canvas), so a caller is never left waiting.
   * @param {Record<string, any> | undefined} options
   */
  dataURI(options) {
    if (Environment.isSSR()) return Promise.resolve({ imgURI: '' })

    return new Promise((resolve) => {
      const w = this.w
      const fail = () => {
        console.warn('ApexCharts: the PNG export could not be rendered')
        resolve({ imgURI: '' })
      }

      const scale = options
        ? options.scale || options.width / w.globals.svgWidth
        : 1

      const canvas = document.createElement('canvas')
      canvas.width = w.globals.svgWidth * scale
      canvas.height = parseInt(w.dom.elWrap.style.height, 10) * scale // because of resizeNonAxisCharts

      const canvasBg = this.resolveExportBackground()

      const ctx = canvas.getContext('2d')
      if (!ctx) return fail()
      ctx.fillStyle = canvasBg
      // canvas.width/height already include scale; do NOT multiply again, or a
      // scale < 1 export (dataURI({ width: < svgWidth })) fills only scale^2 of
      // the canvas, leaving the background missing on the right/bottom margins.
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      this.getSvgString(scale)
        .then((svgData) => {
          const svgUrl = 'data:image/svg+xml,' + encodeURIComponent(svgData)
          const img = new Image()
          img.crossOrigin = 'anonymous'

          img.onload = () => {
            try {
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
            } catch (e) {
              fail()
            }
          }
          img.onerror = fail

          img.src = svgUrl
        })
        .catch(fail)
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
      } else if (imgURI) {
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
    const gl = w.globals
    const csvCfg = w.config.chart.toolbar.export.csv

    // Streamgraph, waterfall and dumbbell draw rows this library derived
    // (baseline offsets, running totals, merged endpoints). The raw stash is
    // the only copy of the values the user gave, so that is what exports.
    const raw =
      !series &&
      (gl.streamgraphRawSeries || gl.waterfallRawSeries || gl.dumbbellRawSeries)
    if (!series) series = raw || w.config.series

    // A legend-hidden series exports as empty cells, whatever its data format.
    // A dumbbell's legend lists the endpoint series, not the merged row.
    const hidden = new Set(
      raw && raw === gl.dumbbellRawSeries
        ? w.dumbbellData.hidden
        : gl.collapsedSeriesIndices,
    )

    const rows = []
    /** @type {any[][]} */
    const body = []
    const isDatetime = w.config.xaxis.type === 'datetime'
    const utc = w.config.xaxis.labels.datetimeUTC

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
      // "undefined" or prefix a negative number, even one given as text.
      if (val == null || Utils.isNumber(val)) return val
      const s = String(val)
      return /^[=+\-@\t\r]/.test(s) && isNaN(+s) ? `'${s}` : s
    }

    /** @param {any} cat */
    const isDateCat = (cat) =>
      isDatetime && String(cat).length >= 10 && !isNaN(new Date(cat).getTime())

    // A datetime category in the zone the axis shows: the day, or the time as
    // well when two categories share a day.
    /**
     * @param {any} cat
     * @param {boolean} [withTime]
     */
    const datetimeText = (cat, withTime) => {
      const d = new Date(cat)
      // Move local wall time onto the UTC getters, so one path reads both.
      if (!utc) d.setTime(d.getTime() - d.getTimezoneOffset() * 60000)
      if (withTime) {
        return d.toISOString().slice(0, 23).replace('T', ' ').replace('.000', '')
      }
      const [day, date, month, year] = d.toUTCString().split(' ')
      return `${day.slice(0, 3)} ${month} ${date} ${year}`
    }

    /**
     * @param {any} cat
     * @param {boolean} [withTime]
     */
    const getFormattedCategory = (cat, withTime) => {
      if (typeof csvCfg.categoryFormatter === 'function') {
        return csvCfg.categoryFormatter(cat)
      }
      if (cat == null) return ''
      if (isDateCat(cat)) return datetimeText(cat, withTime)
      return Utils.isNumber(cat)
        ? cat
        : csvSafe(String(cat).split(columnDelimiter).join(''))
    }

    /**
     * @param {any} value
     */
    const getFormattedValue = (value) => {
      return typeof csvCfg.valueFormatter === 'function'
        ? csvCfg.valueFormatter(value)
        : csvSafe(value)
    }

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
      if (!gl.axisCharts) {
        cat = w.config.labels[i]
      } else {
        // xy charts

        // non datetime
        if (
          w.config.xaxis.type === 'category' ||
          w.config.xaxis.convertedCatToNumeric
        ) {
          if (gl.isBarHorizontal) {
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
        if (isDatetime) {
          if (w.config.xaxis.categories.length) {
            cat = w.config.xaxis.categories[i]
          } else if (w.config.labels.length) {
            cat = w.config.labels[i]
          }
        }
      }

      return Array.isArray(cat) ? cat.join(' ') : cat
    }

    const cd = w.candleData
    const rd = w.rangeData
    const vd = w.violinData
    const multi = series.length > 1
    // Per series: its header cells and a reader of its cells at data index i.
    // One table for both, so the header and the rows cannot disagree.
    const cols = series.map((/** @type {any} */ s, /** @type {number} */ sI) => {
      const type = raw ? '' : s.type || w.config.chart.type
      /** @type {Record<string, any[]> | null} */
      const fields =
        type === 'candlestick'
          ? {
              open: cd.seriesCandleO,
              high: cd.seriesCandleH,
              low: cd.seriesCandleL,
              close: cd.seriesCandleC,
            }
          : type === 'boxPlot'
            ? {
                minimum: cd.seriesCandleO,
                q1: cd.seriesCandleH,
                median: cd.seriesCandleM,
                q3: cd.seriesCandleL,
                maximum: cd.seriesCandleC,
              }
            : type === 'rangeBar' || type === 'rangeArea'
              ? { minimum: rd.seriesRangeStart, maximum: rd.seriesRangeEnd }
              : type === 'violin'
                ? {
                    minimum: vd.seriesViolinMin,
                    maximum: vd.seriesViolinMax,
                    observations: vd.seriesViolinPoints,
                  }
                : null
      const name =
        String(s.name || `series-${sI}`)
          .split(columnDelimiter)
          .join('') || `series-${sI}`
      const keys = fields ? Object.keys(fields) : [name]
      return {
        head: fields && multi ? keys.map((k) => `${name} ${k}`) : keys,
        /** @param {number} i */
        cells: (i) => {
          const off = hidden.has(sI)
          if (!fields) {
            const d = off ? undefined : s.data?.[i]
            return [
              getFormattedValue(
                d && typeof d === 'object' ? (Array.isArray(d) ? d[1] : d.y) : d,
              ),
            ]
          }
          return Object.values(fields).map((src) => {
            const v = off ? undefined : src?.[sI]?.[i]
            // a violin cell counts its observations
            return getFormattedValue(Array.isArray(v) ? v.length : v)
          })
        },
      }
    })

    if (!gl.axisCharts) {
      rows.push(
        [csvCfg.headerCategory, csvCfg.headerValue].join(columnDelimiter),
      )
      series.forEach((/** @type {any} */ _, /** @type {number} */ sI) => {
        rows.push(
          [
            getFormattedCategory(w.labelData.labels[sI]),
            getFormattedValue(hidden.has(sI) ? '' : w.seriesData.series[sI]),
          ].join(columnDelimiter),
        )
      })
    } else {
      rows.push(
        [csvCfg.headerCategory, ...cols.flatMap((c) => c.head)].join(
          columnDelimiter,
        ),
      )
      if (
        !gl.allSeriesHasEqualX &&
        !w.config.xaxis.categories.length &&
        !w.config.labels.length
      ) {
        // One row per distinct x across the series. A Map stops a plain
        // object category named `__proto__` from writing.
        /** @type {Map<string, {cat: any, values: any[][]}>} */
        const byCategory = new Map()
        series.forEach((/** @type {any} */ s, /** @type {number} */ sI) => {
          s?.data?.forEach((/** @type {any} */ d, /** @type {number} */ i) => {
            // only {x, y} and [x, y] points carry their own x; a null is a gap
            if (!d || typeof d !== 'object') return
            const cat = Array.isArray(d) ? d[0] : d.x
            const key = String(cat)
            let row = byCategory.get(key)
            if (!row) {
              row = { cat, values: cols.map((c) => c.head.map(() => '')) }
              byCategory.set(key, row)
            }
            row.values[sI] = cols[sI].cells(i)
          })
        })

        Array.from(byCategory.values())
          .sort((a, b) => {
            // Numbers and Dates by value (as text 10 sorts before 9), then strings
            const aText = typeof a.cat === 'string'
            const bText = typeof b.cat === 'string'
            if (aText !== bText) return aText ? 1 : -1
            if (!aText) return a.cat - b.cat
            return a.cat < b.cat ? -1 : 1
          })
          .forEach(({ cat, values }) => body.push([cat, ...values.flat()]))
      } else {
        const len = Math.max(
          0,
          ...series.map((/** @type {any} */ s) => s.data?.length || 0),
        )
        // One row per category, with every series' cells on it.
        for (let i = 0; i < len; i++) {
          let cat = getCat(i)
          // a null category is a gap in inconsistent time series data
          if (cat === null) continue
          if (!cat) {
            const d = series
              .map((/** @type {any} */ s) => s.data?.[i])
              .find((/** @type {any} */ d) => d != null)
            cat = d == null ? '' : Array.isArray(d) ? d[0] : d.x
          }
          body.push([cat, ...cols.flatMap((c) => c.cells(i))])
        }
      }
    }

    const dates = body.map((r) => r[0]).filter(isDateCat)
    const withTime =
      new Set(dates.map((c) => datetimeText(c))).size < dates.length
    body.forEach((r) =>
      rows.push(
        [getFormattedCategory(r[0], withTime), ...r.slice(1)].join(
          columnDelimiter,
        ),
      ),
    )

    this.triggerDownload(
      'data:text/csv; charset=utf-8,' +
        encodeURIComponent('﻿' + rows.join(lineDelimiter)),
      fileName ? fileName : csvCfg.filename,
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
