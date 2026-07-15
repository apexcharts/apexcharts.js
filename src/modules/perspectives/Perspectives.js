// @ts-check
import Utils from '../../utils/Utils'
import { Environment } from '../../utils/Environment.js'
import { captureViewState, applyViewState } from '../state/ViewState'

/**
 * Perspectives (#10): serializable, shareable view state.
 *
 * "Capture the chart as I'm looking at it" as a compact token: zoom window,
 * hidden series, selected points, theme, locale and annotations. Encode it to a
 * base64url string / URL hash; a colleague opening the link restores the exact
 * view (functions such as formatters are supplied by their own page config, not
 * carried in the token: see encode()).
 *
 * Eager module (like drilldown): constructed once in InitCtxVariables so the
 * in-memory saved-views registry survives update() and is dropped on destroy().
 *
 * Public API (namespaced under chart.perspectives):
 *   chart.perspectives.capture()          -> Perspective { v, view, options? }
 *   chart.perspectives.encode(token?)      -> base64url string
 *   chart.perspectives.decode(str)         -> Perspective | null
 *   chart.perspectives.toURL()             -> href with #apex=<token> (browser)
 *   chart.perspectives.apply(tokenOrStr, { animate })
 *   chart.perspectives.save(name)          -> id
 *   chart.perspectives.list()              -> [{ id, name, token }]
 *   chart.perspectives.delete(id)
 *   ApexCharts.perspectives.decode(str)    (static, pure)
 *   ApexCharts.perspectives.fromURL(href)  (static, pure)
 *
 * @module Perspectives
 */

/** Perspective token schema version. */
const PERSPECTIVE_VERSION = 1

/** URL-hash key that carries an encoded perspective. */
const HASH_KEY = 'apex'

// ── base64url helpers (UTF-8 safe, Node + browser) ──────────────────────────

/**
 * @param {string} str
 * @returns {string} standard base64
 */
function toBase64(str) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64')
  }
  // Browser: TextEncoder → binary string → btoa (handles non-Latin1 correctly).
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

/**
 * @param {string} b64 standard base64
 * @returns {string}
 */
function fromBase64(b64) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf-8')
  }
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

/**
 * @param {string} str
 * @returns {string} base64url (no padding)
 */
function base64urlEncode(str) {
  return toBase64(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * @param {string} b64url
 * @returns {string}
 */
function base64urlDecode(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  return fromBase64(b64)
}

/**
 * Deep copy of data only: JSON.stringify silently drops functions and
 * undefined, which is exactly what we want for a serialisable option delta.
 * @param {any} obj
 * @returns {any}
 */
function stripFunctions(obj) {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (e) {
    return undefined
  }
}

export default class Perspectives {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** @type {{ id: string, name: string, token: any }[]} in-memory registry */
    this._saved = []
    this._counter = 0
  }

  /**
   * Capture the current chart view as a Perspective token.
   * @returns {{ v: number, view: object, options?: Record<string, any> }}
   */
  capture() {
    const view = captureViewState(this.w, this.ctx)
    const token = /** @type {any} */ ({ v: PERSPECTIVE_VERSION, view })
    const options = this._serializableDelta()
    if (options && Object.keys(options).length) token.options = options
    return token
  }

  /**
   * Build the whitelisted, function-free option override recorded in the token.
   * @returns {Record<string, any>}
   * @private
   */
  _serializableDelta() {
    const cfg = this.w.config
    // Config lives under chart.perspectives (see Options.js); fall back to the
    // documented default whitelist if it was stripped from the resolved config.
    const whitelist =
      (cfg.chart &&
        cfg.chart.perspectives &&
        cfg.chart.perspectives.serializeOptions) ||
      ['theme', 'xaxis', 'yaxis', 'title', 'subtitle']
    /** @type {Record<string, any>} */
    const delta = {}
    whitelist.forEach((/** @type {string} */ path) => {
      if (cfg[path] !== undefined) {
        const stripped = stripFunctions(cfg[path])
        if (stripped !== undefined) delta[path] = stripped
      }
    })
    return delta
  }

  /**
   * Encode a token (or the current capture) to a compact base64url string.
   * JSON.stringify drops any functions embedded in annotation params / option
   * overrides by construction: a shared link carries data; the opening page
   * supplies its own functions from config.
   * @param {any} [token]
   * @returns {string}
   */
  encode(token) {
    const t = token || this.capture()
    return base64urlEncode(JSON.stringify(t))
  }

  /**
   * Decode a base64url token string. Never throws: returns null on any error
   * or version mismatch (with a console warning).
   * @param {string} str
   * @returns {any | null}
   */
  decode(str) {
    return Perspectives.decode(str)
  }

  /**
   * Encode the current capture into a `#apex=<token>` URL hash fragment on the
   * current location. Browser-only; returns '' under SSR.
   * @returns {string}
   */
  toURL() {
    if (!Environment.isBrowser()) return ''
    const encoded = this.encode(this.capture())
    const url = new URL(window.location.href)
    url.hash = `${HASH_KEY}=${encoded}`
    return url.toString()
  }

  /**
   * Restore a perspective. Accepts a token object or an encoded string. When
   * the chart is grouped, applies to every synced chart.
   * @param {any} tokenOrString
   * @param {{ animate?: boolean }} [opts]
   */
  apply(tokenOrString, opts = {}) {
    const token =
      typeof tokenOrString === 'string'
        ? Perspectives.decode(tokenOrString)
        : tokenOrString
    if (!token || !token.view) return

    const animate = opts.animate !== undefined ? opts.animate : true
    const targets = this.w.config.chart.group
      ? this.ctx.getSyncedCharts()
      : [this.ctx]

    targets.forEach((/** @type {any} */ chart) => {
      if (token.options && Object.keys(token.options).length) {
        chart.updateOptions(
          Utils.clone(token.options),
          false,
          animate,
          false,
          false,
        )
      }
      applyViewState(chart, token.view, { animate })
    })
  }

  /**
   * Save the current view under a name in the in-memory registry.
   * @param {string} name
   * @returns {string} generated id
   */
  save(name) {
    const id = `perspective-${++this._counter}`
    this._saved.push({ id, name: name || id, token: this.capture() })
    return id
  }

  /**
   * List saved perspectives.
   * @returns {{ id: string, name: string, token: any }[]}
   */
  list() {
    return this._saved.map((s) => ({ id: s.id, name: s.name, token: s.token }))
  }

  /**
   * Delete a saved perspective by id.
   * @param {string} id
   */
  delete(id) {
    const i = this._saved.findIndex((s) => s.id === id)
    if (i > -1) this._saved.splice(i, 1)
  }

  /** Drop the saved-views registry (called on full destroy). */
  teardown() {
    this._saved = []
    this._counter = 0
  }

  // ── static, pure helpers (available once the feature is imported) ─────────

  /**
   * @param {string} str base64url token
   * @returns {any | null}
   */
  static decode(str) {
    if (typeof str !== 'string' || !str) return null
    try {
      const token = JSON.parse(base64urlDecode(str))
      if (!token || typeof token !== 'object') return null
      if (token.v !== PERSPECTIVE_VERSION) {
        // No migrations defined yet: warn and bail rather than throw.
        console.warn(
          `apexcharts: unsupported perspective version ${token.v} (expected ${PERSPECTIVE_VERSION}).`,
        )
        return null
      }
      return token
    } catch (e) {
      console.warn('apexcharts: failed to decode perspective token.', e)
      return null
    }
  }

  /**
   * Parse a `#apex=<token>` fragment out of an href (or the current location in
   * a browser). Pure and Node-safe when given an explicit href.
   * @param {string} [href]
   * @returns {any | null}
   */
  static fromURL(href) {
    try {
      const target =
        href || (Environment.isBrowser() ? window.location.href : '')
      if (!target) return null
      const url = new URL(target)
      const hash = url.hash.replace(/^#/, '')
      if (!hash) return null
      const pair = hash
        .split('&')
        .map((p) => p.split('='))
        .find((p) => p[0] === HASH_KEY)
      if (!pair || pair[1] == null) return null
      return Perspectives.decode(decodeURIComponent(pair[1]))
    } catch (e) {
      return null
    }
  }
}
