// @ts-check
import Utils from '../../utils/Utils'
import Helpers from './Helpers'
import { applyProgressiveReveal } from '../Animations'
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'

export default class PointAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w
    this.annoCtx = annoCtx
    this.helpers = new Helpers(this.annoCtx)
  }

  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addPointAnnotation(anno, parent, index) {
    const w = this.w

    if (w.globals.collapsedSeriesIndices.indexOf(anno.seriesIndex) > -1) {
      return
    }

    const resultX = this.helpers.getX1X2('x1', anno)
    const x = resultX.x
    const clipX = resultX.clipped
    const resultY = this.helpers.getY1Y2('y1', anno)
    const y = resultY.yP
    const clipY = resultY.clipped

    if (!Utils.isNumber(x)) return

    if (!(clipY || clipX)) {
      const optsPoints = {
        pSize: anno.marker.size,
        pointStrokeWidth: anno.marker.strokeWidth,
        pointFillColor: anno.marker.fillColor,
        pointStrokeColor: anno.marker.strokeColor,
        shape: anno.marker.shape,
        pRadius: anno.marker.radius,
        class: `apexcharts-point-annotation-marker ${anno.marker.cssClass} ${
          anno.id ? anno.id : ''
        }`,
      }

      let point = this.annoCtx.graphics.drawMarker(
        x + anno.marker.offsetX,
        y + anno.marker.offsetY,
        optsPoints,
      )

      parent.appendChild(point.node)

      // Nodes that should trigger the annotation's hover tooltip. The marker is
      // always a candidate; the image / customSVG are added below when present
      // (they may be the only visible element when marker.size is 0).
      const tooltipTargets = [point.node]

      // Progressive reveal — fades in when the line's pen-stroke reaches x.
      applyProgressiveReveal(point, x, w)

      const text = anno.label.text ? anno.label.text : ''

      const elText = this.annoCtx.graphics.drawText({
        x: x + anno.label.offsetX,
        y:
          y +
          anno.label.offsetY -
          anno.marker.size -
          parseFloat(anno.label.style.fontSize) / 1.6,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-point-annotation-label ${
          anno.label.style.cssClass
        } ${anno.id ? anno.id : ''}`,
      })

      elText.attr({
        rel: index,
      })

      parent.appendChild(elText.node)
      applyProgressiveReveal(elText, x, w)

      // TODO: deprecate this as we will use custom
      if (anno.customSVG.SVG) {
        const g = this.annoCtx.graphics.group({
          class:
            'apexcharts-point-annotations-custom-svg ' +
            anno.customSVG.cssClass,
        })

        g.attr({
          transform: `translate(${x + anno.customSVG.offsetX}, ${
            y + anno.customSVG.offsetY
          })`,
        })

        g.node.innerHTML = anno.customSVG.SVG
        parent.appendChild(g.node)
        tooltipTargets.push(g.node)
      }

      if (anno.image.path) {
        const imgWidth = anno.image.width ? anno.image.width : 20
        const imgHeight = anno.image.height ? anno.image.height : 20

        point = this.annoCtx.addImage({
          x: x + anno.image.offsetX - imgWidth / 2,
          y: y + anno.image.offsetY - imgHeight / 2,
          width: imgWidth,
          height: imgHeight,
          path: anno.image.path,
          appendTo: '.apexcharts-point-annotations',
        })
        tooltipTargets.push(point.node)
      }

      // Hover tooltip (apexcharts/apexcharts.js#2424): show richer detail on
      // hover than fits in the always-visible label.
      if (anno.tooltip && anno.tooltip.enabled) {
        tooltipTargets.forEach((node) => {
          node.addEventListener('mouseenter', () => {
            this.showPointTooltip(anno, node)
          })
          node.addEventListener('mouseleave', () => {
            this.hidePointTooltip()
          })
        })
      }

      if (anno.mouseEnter) {
        point.node.addEventListener(
          'mouseenter',
          anno.mouseEnter.bind(this, anno),
        )
      }
      if (anno.mouseLeave) {
        point.node.addEventListener(
          'mouseleave',
          anno.mouseLeave.bind(this, anno),
        )
      }
      if (anno.click) {
        point.node.addEventListener('click', anno.click.bind(this, anno))
      }
    }
  }

  /**
   * Lazily create (once per chart) and return the shared HTML element used to
   * render point-annotation tooltips. Reuses the `.apexcharts-tooltip` glass
   * styling; the `.apexcharts-annotation-tooltip` modifier adds padding and
   * text wrapping for free-form content.
   * @returns {HTMLElement}
   */
  getPointTooltipEl() {
    const w = this.w
    let el = /** @type {HTMLElement | null} */ (
      w.dom.elWrap.querySelector('.apexcharts-annotation-tooltip')
    )
    if (!el) {
      el = /** @type {HTMLElement} */ (
        BrowserAPIs.createElementNS('http://www.w3.org/1999/xhtml', 'div')
      )
      el.classList.add('apexcharts-tooltip', 'apexcharts-annotation-tooltip')
      w.dom.elWrap.appendChild(el)
    }
    return el
  }

  /**
   * Resolve the tooltip markup for a point annotation. Precedence:
   * `tooltip.formatter` (fn) -> `tooltip.text` -> `label.text`. Arrays are
   * joined with line breaks.
   * @param {Record<string, any>} anno
   * @returns {string}
   */
  getPointTooltipContent(anno) {
    const w = this.w
    const tt = anno.tooltip || {}

    if (typeof tt.formatter === 'function') {
      return tt.formatter({
        annotation: anno,
        seriesIndex: anno.seriesIndex,
        id: anno.id,
        w,
      })
    }

    let content = tt.text != null ? tt.text : anno.label && anno.label.text
    if (Array.isArray(content)) {
      content = content.join('<br/>')
    }
    return content == null ? '' : String(content)
  }

  /**
   * @param {Record<string, any>} anno
   * @param {Element} targetNode the hovered marker / image / custom-SVG node
   */
  showPointTooltip(anno, targetNode) {
    const w = this.w

    const content = this.getPointTooltipContent(anno)
    if (!content) return

    const el = this.getPointTooltipEl()
    el.innerHTML = content

    const theme = anno.tooltip.theme || w.config.tooltip.theme || 'light'
    el.classList.remove('apexcharts-theme-light', 'apexcharts-theme-dark')
    el.classList.add(`apexcharts-theme-${theme}`)

    // Make it measurable (opacity 1) before reading its box.
    el.classList.add('apexcharts-active')

    const wrapRect = w.dom.elWrap.getBoundingClientRect()
    const markRect = targetNode.getBoundingClientRect()
    const ttRect = el.getBoundingClientRect()

    const offsetX = anno.tooltip.offsetX || 0
    const offsetY = anno.tooltip.offsetY || 0

    // Centre horizontally over the marker; sit above it by default.
    let left =
      markRect.left - wrapRect.left + markRect.width / 2 - ttRect.width / 2
    let top = markRect.top - wrapRect.top - ttRect.height - 10

    // Keep the box inside the chart horizontally.
    left = Math.max(0, Math.min(left, wrapRect.width - ttRect.width))

    // If there isn't room above the marker, flip below it.
    if (top < 0) {
      top = markRect.top - wrapRect.top + markRect.height + 10
    }

    el.style.left = left + offsetX + 'px'
    el.style.top = top + offsetY + 'px'
  }

  hidePointTooltip() {
    const el = /** @type {HTMLElement | null} */ (
      this.w.dom.elWrap.querySelector('.apexcharts-annotation-tooltip')
    )
    if (el) {
      el.classList.remove('apexcharts-active')
    }
  }

  drawPointAnnotations() {
    const w = this.w

    const elg = this.annoCtx.graphics.group({
      class: 'apexcharts-point-annotations',
    })

    /**
     * @param {Record<string, any>} anno
     * @param {number} index
     */
    w.config.annotations.points.map(
      (/** @type {any} */ anno, /** @type {any} */ index) => {
        this.addPointAnnotation(anno, elg.node, index)
      },
    )

    return elg
  }
}
