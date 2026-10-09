// @ts-check

/**
 * Run the script-tag add-ons that loaded before this ApexCharts script.
 *
 * An add-on (`dist/violin.js`, `dist/features/trellis.js`, ...) reads
 * `ApexCharts.__internals` as it runs. One that runs first waits in a global
 * queue instead (build/shared-modules.mjs, `wrapAddon`), and a baseline drains
 * it here, so a page no longer has to get the tag order right.
 *
 * Deferred to a microtask, not run inline: in the script-tag build the class
 * becomes `globalThis.ApexCharts` only after this module's bundle returns, and
 * the add-on looks itself up there. A browser runs microtasks between one
 * classic script and the next, so the queue is empty before the page's own
 * code runs. In a bundled app nothing is ever queued and this does nothing.
 *
 * A queued add-on that throws (a mismatched version, say) is reported with its
 * file name and does not stop the others.
 *
 * Default export only, like every module core imports (see MissingFeature.js).
 *
 * @param {any} ApexCharts the class this baseline exports
 */
export default function drainPendingAddons(ApexCharts) {
  // What tells an add-on that waited past window `load` this class drains,
  // so it does not call an 8.0 script that reached the global late "older
  // than 8.0". Once per class: the full bundle runs this on the same class
  // the default bundle inside it already marked.
  if (!Object.prototype.hasOwnProperty.call(ApexCharts, '__drainsAddons')) {
    Object.defineProperty(ApexCharts, '__drainsAddons', { value: true })
  }
  const g = /** @type {any} */ (globalThis)
  const drain = () => {
    const queue = g.__apexcharts_pending_addons__
    if (!Array.isArray(queue) || !queue.length) return
    if (!g.ApexCharts || !g.ApexCharts.__internals) return
    // All marked done before any runs: an add-on that fires `load` while it
    // registers must not set off the page-load check of one still waiting.
    const batch = queue.splice(0)
    for (const entry of batch) entry.done = true
    for (const entry of batch) {
      try {
        entry.run.call(g)
      } catch (e) {
        g.console.error(
          `ApexCharts: ${entry.file}, loaded before the ApexCharts script, failed to register: ${
            /** @type {any} */ (e)?.message ?? e
          }`,
        )
      }
    }
  }
  if (typeof queueMicrotask === 'function') queueMicrotask(drain)
  else Promise.resolve().then(drain)
}
