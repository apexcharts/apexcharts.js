/**
 * Shared mount for the shadow-*.spec.js audit (plans/34-shadow-dom-audit.md).
 *
 * The same config is mounted three ways:
 *   - light:  a plain div in the document;
 *   - shadow: inside the open shadow root of a custom element;
 *   - nested: inside a custom element whose shadow root holds a second host
 *             with its own shadow root. Theme CSS variables sit on the OUTER
 *             host, so they have to inherit across two boundaries.
 *
 * In the page:
 *   await window.__mount(mode, options, { width, height, into })
 *     -> renders `window.chart`, sets `window.chartRoot` (the root the chart
 *        lives in: the div itself in light mode, else the innermost
 *        ShadowRoot) and `window.chartHost` (the outermost element).
 *   window.__makeRoot(mode) -> { root, host } without a chart.
 *
 * Pattern adapted from shadow-dom-tooltip.spec.js:47-65.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
export const distPath = resolve(rootDir, 'dist', 'apexcharts.js')
export const featurePath = (name) =>
  resolve(rootDir, 'dist', 'features', `${name}.js`)

export const MODES = ['light', 'shadow', 'nested']

export const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },

  /**
   * setup(features?: string[]) loads a blank page, the core bundle, any
   * named add-ons from dist/features, and the in-page mount helpers.
   */
  setup: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))
    const setup = async (features = []) => {
      await page.goto('about:blank')
      await page.setContent(
        '<!doctype html><html><body style="margin:0"><div id="mount"></div></body></html>',
      )
      await page.addScriptTag({ path: distPath })
      for (const f of features) await page.addScriptTag({ path: featurePath(f) })
      await page.evaluate(() => {
        if (!customElements.get('x-shadow-host')) {
          class XShadowHost extends HTMLElement {
            constructor() {
              super()
              this.attachShadow({ mode: 'open' })
            }
          }
          customElements.define('x-shadow-host', XShadowHost)
          class XOuterHost extends HTMLElement {
            constructor() {
              super()
              this.attachShadow({ mode: 'open' })
            }
          }
          customElements.define('x-outer-host', XOuterHost)
        }

        window.__makeRoot = (mode, parent) => {
          parent = parent || document.getElementById('mount')
          const wrap = document.createElement('div')
          wrap.className = 'shadow-audit-wrap'
          parent.appendChild(wrap)
          if (mode === 'light') return { root: wrap, host: wrap }
          if (mode === 'shadow') {
            const host = document.createElement('x-shadow-host')
            host.style.display = 'block'
            wrap.appendChild(host)
            return { root: host.shadowRoot, host }
          }
          const outer = document.createElement('x-outer-host')
          outer.style.display = 'block'
          // Theme variables on the OUTER host only.
          outer.style.setProperty('--apx-audit-color', 'rgb(1, 2, 3)')
          outer.style.setProperty('--apx-measure-up', 'rgb(4, 5, 6)')
          wrap.appendChild(outer)
          const inner = document.createElement('x-shadow-host')
          inner.style.display = 'block'
          outer.shadowRoot.appendChild(inner)
          return { root: inner.shadowRoot, host: outer }
        }

        window.__mount = async (mode, options, opts = {}) => {
          const { root, host } = window.__makeRoot(mode, opts.into)
          const target = document.createElement('div')
          target.className = 'shadow-audit-target'
          target.style.width = (opts.width || 600) + 'px'
          root.appendChild(target)
          const chart = new ApexCharts(target, {
            ...options,
            chart: {
              height: opts.height || 360,
              animations: { enabled: false },
              ...options.chart,
            },
          })
          await chart.render()
          window.chart = chart
          window.chartRoot = root
          window.chartHost = host
          return chart
        }
      })
    }
    await use(setup)
    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

/** Centre of the first element matching `sel` inside window.chartRoot. */
export function centreOf(page, sel) {
  return page.evaluate((sel) => {
    const n = window.chartRoot.querySelector(sel)
    if (!n) return null
    const b = n.getBoundingClientRect()
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height, left: b.left, top: b.top, right: b.right, bottom: b.bottom }
  }, sel)
}

export { expect }
