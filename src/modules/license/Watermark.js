// @ts-check
/**
 * Watermark - vendored copy of the ApexCharts family trial watermark.
 *
 * A minimal, dependency-free port of `apex-commons`
 * (projects/libs/commons/src/lib/Watermark.ts). It injects a repeating diagonal
 * "APEXCHARTS" SVG-in-CSS overlay as a DOM sibling of the chart SVG. Because it
 * is a DOM overlay (not part of the SVG), image / SVG / CSV exports are NOT
 * affected, matching the rest of the family.
 *
 * All DOM work is defensive: it no-ops when there is no document (SSR) and
 * never throws.
 *
 * @module modules/license/Watermark
 */

const WATERMARK_ATTR = 'data-apexcharts-watermark'
const WATERMARK_TEXT = 'APEXCHARTS'

/** The styles that make the overlay do its job; re-applied on tamper. */
const CRITICAL_STYLES = {
  position: 'absolute',
  top: '0',
  right: '0',
  bottom: '0',
  left: '0',
  pointerEvents: 'none',
  userSelect: 'none',
  webkitUserSelect: 'none',
  msUserSelect: 'none',
  zIndex: '10000',
  display: 'block',
  visibility: 'visible',
  opacity: '1',
}

/** @returns {string} a `url(...)` CSS value with the repeating diagonal text */
function createWatermarkPattern() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif"
        font-size="18"
        font-weight="600"
        fill="rgba(134, 134, 134, 0.1)"
        transform="rotate(-35, 100, 60)"
      >${WATERMARK_TEXT}</text>
    </svg>
  `
  return `url("data:image/svg+xml,${encodeURIComponent(svg.trim())}")`
}

export class Watermark {
  static ATTR = WATERMARK_ATTR

  /**
   * Apply the overlay's critical styles + background to a node. Split out so a
   * MutationObserver can restore styles after tampering.
   * @param {HTMLElement} el
   */
  static applyStyles(el) {
    Object.assign(el.style, CRITICAL_STYLES, {
      backgroundImage: createWatermarkPattern(),
      backgroundRepeat: 'repeat',
    })
  }

  /**
   * Add the watermark to a container, reusing the existing node if present (so
   * a style-tamper observer bound to it stays valid across re-renders). No-op
   * when there is no document (SSR) or no container.
   * @param {HTMLElement | null | undefined} container
   * @returns {HTMLElement | null} the watermark node
   */
  static add(container) {
    if (!container || typeof document === 'undefined') return null

    let watermark = this.node(container)
    if (!watermark) {
      watermark = document.createElement('div')
      watermark.setAttribute(WATERMARK_ATTR, '')
      container.appendChild(watermark)
    }
    this.applyStyles(watermark)

    // The overlay is absolutely positioned, so the container must establish a
    // positioning context.
    if (
      typeof getComputedStyle === 'function' &&
      getComputedStyle(container).position === 'static'
    ) {
      container.style.position = 'relative'
    }

    return watermark
  }

  /**
   * @param {HTMLElement | null | undefined} container
   * @returns {HTMLElement | null} the watermark node, if present
   */
  static node(container) {
    if (!container) return null
    return /** @type {HTMLElement | null} */ (
      container.querySelector(`[${WATERMARK_ATTR}]`)
    )
  }

  /**
   * @param {HTMLElement | null | undefined} container
   * @returns {boolean}
   */
  static exists(container) {
    return !!this.node(container)
  }

  /**
   * Remove the watermark from a container.
   * @param {HTMLElement | null | undefined} container
   */
  static remove(container) {
    const existing = this.node(container)
    if (existing) existing.remove()
  }
}
