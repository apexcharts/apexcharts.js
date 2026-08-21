// @ts-check
/**
 * Trellis (#22, P3): the composed export.
 *
 * A trellis is one chart, so its export is ONE artifact: a single PNG/SVG of
 * the whole grid (title + headers + every panel + legend at their true cell
 * offsets) and one CSV with a facet-key column. Panel pixels come from each
 * panel's OWN export path (`chart.dataURI()` / `chart.getSvgString()`), so
 * the inlined-font/image discipline that path already enforces holds per
 * panel; this module only composes and draws the HTML chrome (title,
 * headers, legend) on top.
 *
 * Geometry is read from the live DOM (each piece's rect relative to the
 * wrap), so the export is what the user sees. Virtualized grids export what
 * the grid shows: unmounted panels compose as their skeleton tint.
 *
 * Requires the exports feature on the panels (`apexcharts/features/exports`,
 * in the full bundle); without it the download tool is omitted.
 *
 * @module modules/trellis/TrellisExports
 */

export default class TrellisExports {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis
  }

  /** Whether panel-level export machinery is available. */
  supported() {
    return !!this.trellis.ctx.exports
  }

  /**
   * The wrap-relative rect of an element.
   * @param {Element} el
   */
  _rectIn(el) {
    const wrap = /** @type {HTMLElement} */ (this.trellis.elWrap)
    const w = wrap.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    return {
      x: r.left - w.left,
      y: r.top - w.top,
      w: r.width,
      h: r.height,
    }
  }

  /** Export surface size = the wrap's own box. */
  _size() {
    const wrap = /** @type {HTMLElement} */ (this.trellis.elWrap)
    const r = wrap.getBoundingClientRect()
    return { w: Math.ceil(r.width), h: Math.ceil(r.height) }
  }

  /** The opaque base color, from any mounted panel's own resolver. */
  _background() {
    const mounted = this.trellis.panels.find((p) => p.chart)
    const ex = mounted && mounted.chart.exports
    if (ex && typeof ex.resolveExportBackground === 'function') {
      const bg = ex.resolveExportBackground()
      if (bg && bg !== 'transparent') return bg
    }
    return '#fff'
  }

  /** Text pieces to compose: title + one header per cell (+ legend items). */
  _chromeTexts() {
    const t = this.trellis
    /** @type {Array<{ text: string, x: number, y: number, font: string, fontSize: number, color: string, align: 'left'|'center' }>} */
    const texts = []
    /** @param {Element|null} el @param {'left'|'center'} align */
    const push = (el, align) => {
      if (!el || !el.textContent) return
      const rect = this._rectIn(el)
      const cs = getComputedStyle(/** @type {HTMLElement} */ (el))
      texts.push({
        text: el.textContent,
        x: align === 'center' ? rect.x + rect.w / 2 : rect.x,
        y: rect.y + rect.h / 2,
        font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
        fontSize: parseFloat(cs.fontSize) || 12,
        color: cs.color || '#373d3f',
        align,
      })
    }
    push(t.chrome.elTitle, 'left')
    t.panels.forEach((p) => {
      if (!p.cellEl) return
      push(p.cellEl.querySelector('.apexcharts-trellis-header'), 'center')
    })
    if (t.chrome.elLegend) {
      t.chrome.elLegend
        .querySelectorAll('.apexcharts-legend-text')
        .forEach((el) => push(el, 'left'))
    }
    return texts
  }

  /** Legend marker dots (color + rect), for both compose targets. */
  _legendMarkers() {
    const legend = this.trellis.chrome.elLegend
    if (!legend) return []
    return Array.from(
      legend.querySelectorAll('.apexcharts-legend-marker'),
      (el) => ({
        rect: this._rectIn(el),
        color:
          /** @type {HTMLElement} */ (el).style.background ||
          /** @type {HTMLElement} */ (el).style.backgroundColor ||
          '#008FFB',
      }),
    )
  }

  /**
   * One PNG of the whole grid.
   * @param {{ scale?: number }} [options]
   * @returns {Promise<{ imgURI: string }>}
   */
  async dataURI(options = {}) {
    const t = this.trellis
    const scale = options.scale || 1
    const size = this._size()
    const canvas = document.createElement('canvas')
    canvas.width = size.w * scale
    canvas.height = size.h * scale
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return { imgURI: '' }
    const ctx = /** @type {CanvasRenderingContext2D} */ (ctx2d)
    ctx.scale(scale, scale)
    ctx.fillStyle = this._background()
    ctx.fillRect(0, 0, size.w, size.h)

    // Panels first (their own export path), skeleton tint for unmounted.
    for (const p of t.panels) {
      if (!p.el) continue
      const rect = this._rectIn(p.el)
      if (!p.chart) {
        ctx.fillStyle = 'rgba(120, 120, 120, 0.06)'
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
        continue
      }
      const { imgURI } = await p.chart.dataURI({ scale })
      if (!imgURI) continue
      const img = await loadImage(imgURI)
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h)
    }

    // HTML chrome on top: title, headers, legend.
    for (const piece of this._chromeTexts()) {
      ctx.font = piece.font
      ctx.fillStyle = piece.color
      ctx.textAlign = piece.align
      ctx.textBaseline = 'middle'
      ctx.fillText(piece.text, piece.x, piece.y)
    }
    for (const m of this._legendMarkers()) {
      ctx.fillStyle = m.color
      ctx.beginPath()
      ctx.arc(
        m.rect.x + m.rect.w / 2,
        m.rect.y + m.rect.h / 2,
        Math.max(2, m.rect.w / 2),
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
    return { imgURI: canvas.toDataURL('image/png') }
  }

  /**
   * One SVG of the whole grid: nested per-panel SVGs (fonts already inlined
   * by each panel's own getSvgString) plus text chrome.
   * @returns {Promise<string>}
   */
  async svgString() {
    const t = this.trellis
    const size = this._size()
    /** @type {string[]} */
    const parts = []
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">`,
    )
    parts.push(
      `<rect width="${size.w}" height="${size.h}" fill="${this._background()}"/>`,
    )
    for (const p of t.panels) {
      if (!p.el) continue
      const rect = this._rectIn(p.el)
      if (!p.chart) {
        parts.push(
          `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="rgba(120,120,120,0.06)" rx="4"/>`,
        )
        continue
      }
      const svg = await p.chart.getSvgString()
      parts.push(
        `<g transform="translate(${rect.x}, ${rect.y})">${svg}</g>`,
      )
    }
    for (const piece of this._chromeTexts()) {
      const anchor = piece.align === 'center' ? 'middle' : 'start'
      parts.push(
        `<text x="${piece.x}" y="${piece.y}" text-anchor="${anchor}" dominant-baseline="central" style="font:${escapeAttr(
          piece.font,
        )};fill:${escapeAttr(piece.color)}">${escapeXml(piece.text)}</text>`,
      )
    }
    for (const m of this._legendMarkers()) {
      parts.push(
        `<circle cx="${m.rect.x + m.rect.w / 2}" cy="${
          m.rect.y + m.rect.h / 2
        }" r="${Math.max(2, m.rect.w / 2)}" fill="${escapeAttr(m.color)}"/>`,
      )
    }
    parts.push('</svg>')
    return parts.join('')
  }

  /**
   * One CSV for the whole grid, wide form: x, facet, then one column per
   * series name. Rows are (panel x union-x), aligned by the split, so ragged
   * panels emit explicit blanks.
   * @returns {string}
   */
  csv() {
    const t = this.trellis
    const split = t.split
    if (!split) return ''
    const w = t.w
    const delimiter =
      w.config.chart.toolbar?.export?.csv?.columnDelimiter || ','
    const isDatetime = w.config.xaxis && w.config.xaxis.type === 'datetime'
    /** @param {any} v */
    const cell = (v) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      return /[",\n]/.test(s) || s.indexOf(delimiter) !== -1
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }
    /** @param {any} x */
    const xOut = (x) =>
      isDatetime && typeof x === 'number' ? new Date(x).toISOString() : x

    const names = split.seriesNames
    const lines = [
      ['x', 'facet', ...names].map(cell).join(delimiter),
    ]
    split.panels.forEach((slice) => {
      split.unionX.forEach((x, i) => {
        /** @type {any[]} */
        const row = [xOut(x), slice.key]
        names.forEach((name) => {
          const s = slice.series.find((sr) => sr.name === name)
          if (!s || !Array.isArray(s.data)) {
            row.push('')
            return
          }
          const d = s.data[i]
          let y = d
          if (Array.isArray(d)) y = d[1]
          else if (d && typeof d === 'object') y = d.y
          row.push(Array.isArray(y) ? y.join('|') : y)
        })
        lines.push(row.map(cell).join(delimiter))
      })
    })
    return lines.join('\n')
  }

  /** @param {'png'|'svg'|'csv'} kind */
  async download(kind) {
    const t = this.trellis
    const exportCfg = t.w.config.chart.toolbar?.export || {}
    const fallback = String(t.w.globals.chartID || 'trellis')
    if (kind === 'png') {
      const { imgURI } = await this.dataURI()
      triggerDownload(imgURI, (exportCfg.png && exportCfg.png.filename) || fallback, '.png')
    } else if (kind === 'svg') {
      const svg = await this.svgString()
      const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
      triggerDownload(uri, (exportCfg.svg && exportCfg.svg.filename) || fallback, '.svg')
    } else {
      const uri =
        'data:text/csv;charset=utf-8,' +
        encodeURIComponent('\ufeff' + this.csv())
      triggerDownload(uri, (exportCfg.csv && exportCfg.csv.filename) || fallback, '.csv')
    }
  }
}

/**
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * @param {string} href
 * @param {string} filename
 * @param {string} ext
 */
function triggerDownload(href, filename, ext) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename + ext
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/** @param {string} s */
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** @param {string} s */
function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;')
}
