// @ts-check
/**
 * LicenseEnforcer - decides, per chart, whether a trial watermark is shown.
 *
 * Gates these premium features, and ONLY when they are actually IN USE (not
 * merely bundled): storyboard, link (crossfilter/linked views), ink, measure,
 * context-menu, perspectives, history, PLUS the premium `unit` (dot-cluster /
 * pictogram) chart type. Everything else (all OTHER chart types, and the free
 * modules weave / renderer-canvas / marks / facet / drilldown / morph /
 * annotations / legend / toolbar / keyboard / exports, and the always-on core)
 * is never gated.
 *
 * Enforcement is trial-mode: a premium feature without a valid license keeps
 * working, but the chart shows an "APEXCHARTS" watermark. A valid key removes
 * it. Client-side enforcement is inherently bypassable - this is deterrence and
 * honest-customer compliance, not DRM. It must NEVER degrade or block a feature
 * and must NEVER throw.
 *
 * @module modules/license/LicenseEnforcer
 */

import { LicenseManager } from './LicenseManager'
import { Watermark } from './Watermark'
import { Environment } from '../../utils/Environment.js'

const PRICING_URL = 'https://apexcharts.com/pricing'

// Process-global "used" signals for API-only premium paths that have no chart
// context at call time (the static perspectives decode/fromURL entry points).
let _perspectivesTokenDecoded = false

/**
 * Record that a perspective token was decoded via the STATIC API
 * (ApexCharts.perspectives.decode / fromURL). Unlike the instance apply()/save()
 * signals, this has no chart to attach to, so it is a global signal that marks
 * perspectives as "in use" for any chart that bundles the feature, and it
 * re-evaluates all live charts. Deliberately coarse: calling the premium static
 * decode API is itself premium usage.
 */
export function markPerspectivesTokenDecoded() {
  _perspectivesTokenDecoded = true
  reevaluateLicenseAcrossCharts()
}

/** Test-only: reset the process-global premium signals. */
export function _resetPremiumSignals() {
  _perspectivesTokenDecoded = false
}

/**
 * The premium features this specific chart is USING right now (empty when the
 * chart only touches free functionality). "in use", not "bundled".
 * @param {any} w
 * @param {any} ctx
 * @returns {string[]}
 */
export function premiumFeaturesInUse(w, ctx) {
  const chart = (w && w.config && w.config.chart) || {}
  /** @type {string[]} */
  const used = []

  // unit (dot-cluster / pictogram): premium CHART TYPE. Unlike the feature
  // flags below, "in use" is simply "this chart is a unit chart" - the type is
  // the product. It renders fully in trial mode, just watermarked.
  if (chart.type === 'unit') used.push('unit')

  // storyboard: API-only. bind() sets ctx.storyboard._used; unbind() clears it.
  if (ctx.storyboard && ctx.storyboard._used) used.push('storyboard')

  // link (crossfilter / linked views): chart.link.enabled (highlight) OR a
  // dimension function (filter mode / crossfilter consumer).
  const link = chart.link
  if (
    ctx.linkedViews &&
    link &&
    (link.enabled === true || typeof link.dimension === 'function')
  ) {
    used.push('link')
  }

  // ink / measure / context-menu / history: config .enabled flags.
  if (ctx.ink && chart.ink && chart.ink.enabled === true) used.push('ink')
  if (ctx.measure && chart.measure && chart.measure.enabled === true) {
    used.push('measure')
  }
  if (ctx.contextMenu && chart.contextMenu && chart.contextMenu.enabled === true) {
    used.push('context-menu')
  }

  // perspectives: API-only. apply()/save() set ctx.perspectives._used; the
  // static decode/fromURL path sets the process-global signal.
  if (ctx.perspectives && (ctx.perspectives._used || _perspectivesTokenDecoded)) {
    used.push('perspectives')
  }

  if (ctx.history && chart.history && chart.history.enabled === true) {
    used.push('history')
  }

  return used
}

/**
 * @param {any} w @param {any} ctx
 * @returns {boolean} whether this chart is using any gated premium feature
 */
export function premiumFeatureInUse(w, ctx) {
  return premiumFeaturesInUse(w, ctx).length > 0
}

/**
 * Resolve the effective license key for a chart, most specific first:
 *   chart.license -> setLicense() singleton -> window.Apex.license -> null
 * @param {any} w
 * @returns {string | null}
 */
function resolveKey(w) {
  const perChart = w && w.config && w.config.chart && w.config.chart.license
  if (perChart) return perChart
  const singleton = LicenseManager.getKey()
  if (singleton) return singleton
  const apex = Environment.getApex()
  if (apex && apex.license) return apex.license
  return null
}

/**
 * (Re)create the watermark node and (re)bind a style-tamper observer to it.
 * @param {any} ctx @param {HTMLElement} elWrap
 */
function reinstateWatermark(ctx, elWrap) {
  const node = Watermark.add(elWrap) // reuse-or-create + apply critical styles
  if (!node || typeof MutationObserver === 'undefined') return
  if (ctx._wmNodeObserver && ctx._wmObservedNode === node) return

  if (ctx._wmNodeObserver) ctx._wmNodeObserver.disconnect()
  const nodeObs = new MutationObserver(() => {
    const n = Watermark.node(elWrap)
    if (!n) return
    // Restore critical styles; disconnect + takeRecords so our own write does
    // not re-trigger the observer (no feedback loop).
    nodeObs.disconnect()
    Watermark.applyStyles(n)
    nodeObs.takeRecords()
    nodeObs.observe(n, { attributes: true, attributeFilter: ['style'] })
  })
  nodeObs.observe(node, { attributes: true, attributeFilter: ['style'] })
  ctx._wmNodeObserver = nodeObs
  ctx._wmObservedNode = node
}

/**
 * Add the watermark and attach the re-injection observers (childList on the
 * wrapper catches node removal; the node observer catches style tampering).
 * @param {any} ctx @param {HTMLElement} elWrap
 */
function addWatermark(ctx, elWrap) {
  reinstateWatermark(ctx, elWrap)
  if (typeof MutationObserver === 'undefined' || ctx._wmWrapObserver) return
  const wrapObs = new MutationObserver(() => {
    if (!Watermark.node(elWrap)) reinstateWatermark(ctx, elWrap)
  })
  wrapObs.observe(elWrap, { childList: true })
  ctx._wmWrapObserver = wrapObs
}

/**
 * Remove the watermark and disconnect its observers. Safe to call when none
 * exist; called on a valid license, when premium usage stops, and on destroy().
 * @param {any} ctx @param {HTMLElement | null | undefined} [elWrap]
 */
export function teardownWatermark(ctx, elWrap) {
  if (ctx._wmWrapObserver) {
    ctx._wmWrapObserver.disconnect()
    ctx._wmWrapObserver = null
  }
  if (ctx._wmNodeObserver) {
    ctx._wmNodeObserver.disconnect()
    ctx._wmNodeObserver = null
  }
  ctx._wmObservedNode = null
  const wrap = elWrap || (ctx.w && ctx.w.dom && ctx.w.dom.elWrap)
  if (wrap) Watermark.remove(wrap)
}

/**
 * One concise console message per chart, matching the family:
 *  - a key IS set but invalid/expired/wrong-domain -> console.error the reason
 *    (skipped for the setLicense singleton, which already errored at set time,
 *     to avoid duplicate noise)
 *  - NO key at all -> console.warn naming the feature(s) + pricing link
 * @param {any} ctx @param {string | null} key @param {string[]} features
 */
function notifyTrial(ctx, key, features) {
  if (ctx._premiumLicenseNotified) return
  ctx._premiumLicenseNotified = true

  if (!key) {
    console.warn(
      `[ApexCharts] Premium feature${features.length > 1 ? 's' : ''} in use ` +
        `(${features.join(', ')}) without a license. Running in trial mode ` +
        `with a watermark. Get a license: ${PRICING_URL}`,
    )
    return
  }

  // A key was provided but is not valid. The setLicense singleton already
  // console.error'd at set time; only report per-chart / global keys here.
  if (key !== LicenseManager.getKey()) {
    console.error(`[Apex] ${LicenseManager.validateKey(key).message}`)
  }
}

/**
 * The single enforcement seam. Called at the end of mount()/fastUpdate(), and
 * when an API-driven premium entry point fires. Idempotent; re-evaluated on
 * every render so a late setLicense(validKey) + update() clears the watermark.
 * @param {any} w @param {any} ctx
 */
export function enforceLicense(w, ctx) {
  try {
    // SSR / no-DOM: never touch the DOM, never throw. The client hydrate will
    // re-evaluate and add the watermark if needed.
    if (!Environment.isBrowser()) return
    const elWrap = w && w.dom && w.dom.elWrap
    // Ordering guard: the DOM cache must be populated before we watermark.
    if (!elWrap) return

    const features = premiumFeaturesInUse(w, ctx)

    // Free-only usage: never watermark, never warn.
    if (features.length === 0) {
      teardownWatermark(ctx, elWrap)
      return
    }

    const key = resolveKey(w)
    if (LicenseManager.isKeyValid(key)) {
      teardownWatermark(ctx, elWrap)
      return
    }

    // Premium in use + no valid license -> trial mode (feature still works).
    addWatermark(ctx, elWrap)
    notifyTrial(ctx, key, features)
  } catch {
    // Enforcement must never break rendering.
  }
}

/**
 * Re-run enforcement on every live chart. Used by process-global entry points
 * (ApexCharts.crossfilter, static perspectives decode/fromURL) that change
 * premium "in use" status without themselves triggering a chart render. Only
 * charts registered with a chart.id are reachable; others self-enforce on their
 * next render.
 */
export function reevaluateLicenseAcrossCharts() {
  if (!Environment.isBrowser()) return
  const apex = Environment.getApex()
  const instances = apex && apex._chartInstances
  if (!Array.isArray(instances)) return
  instances.forEach((entry) => {
    const chart = entry && entry.chart
    if (chart && chart.w && !chart.w.globals.isDestroyed) {
      enforceLicense(chart.w, chart)
    }
  })
}
