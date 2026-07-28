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
 * Enforcement is trial-mode: a premium feature without a valid, entitled license
 * keeps working, but the chart shows an "APEXCHARTS" watermark. These features
 * are a Premium-and-above entitlement: a valid key on the `premium` or (higher)
 * `enterprise` plan removes the watermark, while a valid key on the lower `pro`
 * plan (or the free tier) keeps it. Client-side enforcement is inherently
 * bypassable - this is deterrence and honest-customer compliance, not DRM. It
 * must NEVER degrade or block a feature and must NEVER throw.
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
 * Every chart currently using a premium feature, so an async signature verdict
 * can correct the watermark decision made synchronously during render.
 *
 * This exists because `Apex._chartInstances` is not the right list: a chart only
 * joins it when the user declares `chart.id`, which is optional and uncommon.
 * Reconciling through that list alone meant a forged key escaped the watermark
 * entirely on every anonymous chart, since the provisional verdict said "valid"
 * and nothing ever asked again. Membership is tracked here instead, keyed on
 * premium usage rather than on the user having named the chart.
 *
 * Entries are removed on destroy() and pruned during reconciliation.
 */
const enforced = new Set()

/**
 * Stop reconciling a chart. Called from destroy(), which cannot use
 * `teardownWatermark` for this: that also runs on the valid-licence path, where
 * dropping the chart would reintroduce the very gap described above.
 * @param {any} ctx
 */
export function untrackChart(ctx) {
  enforced.delete(ctx)
}

/** Test-only: how many charts are being reconciled. */
export function _enforcedCount() {
  return enforced.size
}

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
 * License plans that entitle the premium feature set, lower-cased. The issuing
 * service (editor-api) sells exactly three licensed plans - `pro`, `premium`,
 * `enterprise` (routes/payment/_shared.js VALID_PLAN_TYPES) - and the premium
 * features are a Premium-and-above entitlement: `premium` and the higher
 * `enterprise` tier unlock them, while `pro` (and the free tier, or any unknown
 * plan) does not.
 * @type {Set<string>}
 */
const PREMIUM_PLANS = new Set(['premium', 'enterprise'])

/**
 * Whether a key both validates (format, signature, expiry, domain) AND carries a
 * plan entitled to the premium features. Structural validity alone is not enough:
 * a valid `pro` key stays in trial mode. The `valid` flag still carries the
 * async-corrected signature verdict; the plan is read from the same synchronous
 * decode, so the plan gate needs no extra round-trip.
 * @param {string | null} key
 * @returns {boolean}
 */
function licensedForPremium(key) {
  if (!key) return false
  const result = LicenseManager.validateKey(key)
  if (!result.valid) return false
  const plan = result.data && result.data.plan
  return typeof plan === 'string' && PREMIUM_PLANS.has(plan.toLowerCase())
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
 *  - NO key at all -> console.warn naming the feature(s) + pricing link
 *  - a valid key on too low a plan (e.g. Pro) -> console.warn to upgrade: the key
 *    is genuine, the tier is insufficient, so this is not an "invalid key" error
 *  - a key IS set but invalid/expired/wrong-domain/forged -> console.error the
 *    reason (skipped for the setLicense singleton, which already errored at set
 *    time, to avoid duplicate noise)
 * @param {any} ctx @param {string | null} key @param {string[]} features
 */
function notifyTrial(ctx, key, features) {
  if (ctx._premiumLicenseNotified) return
  ctx._premiumLicenseNotified = true

  const many = features.length > 1

  if (!key) {
    console.warn(
      `[ApexCharts] Premium feature${many ? 's' : ''} in use ` +
        `(${features.join(', ')}) without a license. Running in trial mode ` +
        `with a watermark. Get a license: ${PRICING_URL}`,
    )
    return
  }

  const result = LicenseManager.validateKey(key)

  // Structurally valid, but the plan does not include the premium features. The
  // key is real (setLicense did not error at set time, since it is valid), so the
  // enforcer is the only place this can be surfaced. A warning, not an error: the
  // licence is genuine, only the tier is too low.
  if (result.valid) {
    const plan = (result.data && result.data.plan) || 'current'
    console.warn(
      `[ApexCharts] Premium feature${many ? 's' : ''} in use ` +
        `(${features.join(', ')}) require a Premium or Enterprise license; the ` +
        `${plan} plan does not include ${many ? 'them' : 'it'}. Running in trial ` +
        `mode with a watermark. Upgrade: ${PRICING_URL}`,
    )
    return
  }

  // A key was provided but is not structurally valid. The setLicense singleton
  // already console.error'd at set time; only report per-chart / global keys here.
  if (key !== LicenseManager.getKey()) {
    console.error(`[Apex] ${result.message}`)
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

    // A destroyed chart is never enforced. destroy() runs teardown hooks that
    // call back in here (storyboard.teardown() is one), and the chart's config
    // still reads as premium at that point, so without this the chart would be
    // re-tracked immediately after being untracked and the enforcer would hold
    // its context for the life of the page.
    if (w && w.globals && w.globals.isDestroyed) {
      enforced.delete(ctx)
      return
    }

    const elWrap = w && w.dom && w.dom.elWrap
    // Ordering guard: the DOM cache must be populated before we watermark.
    if (!elWrap) return

    const features = premiumFeaturesInUse(w, ctx)

    // Free-only usage: never watermark, never warn.
    if (features.length === 0) {
      enforced.delete(ctx)
      teardownWatermark(ctx, elWrap)
      return
    }

    // Tracked on premium usage, not on the verdict: a key that looks valid now
    // may fail verification a microtask later, and that is exactly the chart
    // that needs correcting.
    enforced.add(ctx)

    const key = resolveKey(w)
    if (licensedForPremium(key)) {
      teardownWatermark(ctx, elWrap)
      return
    }

    // Premium in use + no valid, entitled license -> trial mode (feature still
    // works). Covers no key, an invalid/expired/forged key, AND a valid key on a
    // plan below Premium (e.g. Pro).
    addWatermark(ctx, elWrap)
    notifyTrial(ctx, key, features)
  } catch {
    // Enforcement must never break rendering.
  }
}

/**
 * Re-run enforcement on every live chart. Used by process-global entry points
 * (ApexCharts.crossfilter, static perspectives decode/fromURL) that change
 * premium "in use" status without themselves triggering a chart render, and by
 * the async signature verdict.
 *
 * Reaches every chart using a premium feature, whether or not it declares a
 * `chart.id`. `Apex._chartInstances` is still walked, because a chart there may
 * have turned premium through a path that never ran enforcement, but it is no
 * longer the only route.
 */
export function reevaluateLicenseAcrossCharts() {
  if (!Environment.isBrowser()) return

  const visited = new Set()

  const apex = Environment.getApex()
  const instances = apex && apex._chartInstances
  if (Array.isArray(instances)) {
    instances.forEach((entry) => {
      const chart = entry && entry.chart
      if (chart && chart.w && !chart.w.globals.isDestroyed) {
        visited.add(chart)
        enforceLicense(chart.w, chart)
      }
    })
  }

  // Copied first: enforceLicense mutates `enforced`, and a detached or destroyed
  // chart is dropped here so the set cannot pin its subtree in memory.
  Array.from(enforced).forEach((ctx) => {
    const w = ctx && ctx.w
    const elWrap = w && w.dom && w.dom.elWrap
    if (!w || w.globals.isDestroyed || !elWrap || elWrap.isConnected === false) {
      enforced.delete(ctx)
      return
    }
    if (visited.has(ctx)) return
    enforceLicense(w, ctx)
  })
}

// Signature verification is asynchronous (crypto.subtle has no sync API) while
// enforcement is decided synchronously during render, so a key is accepted
// provisionally and the verdict lands a microtask later. Without this, a forged
// key would escape the watermark entirely in the ordinary
// setLicense-then-render sequence, because nothing would ask again once the
// chart had painted.
LicenseManager.onChange(reevaluateLicenseAcrossCharts)
