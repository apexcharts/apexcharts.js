// @ts-check
import { OSThemeWatcher as MediaWatcher } from 'apex-commons'
import { Environment } from '../../utils/Environment'
import { BrowserAPIs } from '../../ssr/BrowserAPIs'

/**
 * Facet (#13): make `theme.follow: 'os'` reactive to the operating system's
 * `prefers-color-scheme` (light/dark) and `prefers-contrast` (more) settings,
 * with no JS on the consumer's side.
 *
 * The media queries and their listeners belong to the apex-commons watcher.
 * This adapter gives it the `(w, ctx)` shape the feature registry builds in
 * `InitCtxVariables.initModules()`, and does the chart-side work:
 *  - **Initial:** when the modules are built (this runs in
 *    `_initOptionalModules`, which is before `Core.setupElements` and
 *    `Theme.init`), write the resolved mode / high-contrast onto
 *    `w.config.theme` so the first paint already follows the OS. When
 *    `follow:'os'` is set, the OS drives the mode: it wins over any explicit
 *    `theme.mode` (opting into follow IS the intent).
 *  - **Live:** ONE watcher per chart instance, kept on `ctx` so it survives
 *    the re-render that `updateOptions` performs, re-themes through the
 *    existing `updateOptions` path when the OS preference flips. It is
 *    disposed on full destroy.
 *
 * SSR-safe: media queries are evaluated through `BrowserAPIs`, which answers
 * null server side.
 *
 * @module modules/theme/OSThemeWatcher
 */

export default class OSThemeWatcher {
  /**
   * @param {any} w @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx

    if (w.config.theme.follow !== 'os' || !Environment.isBrowser()) return

    /** @type {MediaWatcher} */
    let watcher = ctx._osTheme
    if (!watcher) {
      watcher = new MediaWatcher({
        host: /** @type {any} */ (BrowserAPIs),
        // Closes over `ctx` (stable across re-renders), NOT over `this`: a
        // fresh adapter is built whenever the modules are rebuilt.
        onChange({ mode, highContrast }) {
          // (options, redraw:false, animate:true, updateSyncedCharts:false).
          // Synced charts are NOT updated from here: following the OS is
          // per-chart opt-in, and every follow:'os' group member has its own
          // watcher firing on the same media event, so syncing would
          // double-update each of them. Leaving high contrast clears the
          // override.
          ctx.updateOptions(
            {
              theme: {
                mode,
                accessibility: {
                  colorBlindMode: highContrast ? 'highContrast' : '',
                },
              },
            },
            false,
            true,
            false,
          )
        },
      })
      const { scheme, contrast } = watcher.supports
      if (!scheme && !contrast) {
        // Nothing to follow (no matchMedia).
        watcher.dispose()
        return
      }
      ctx._osTheme = watcher
    }

    const theme = w.config.theme
    const { mode, highContrast } = watcher.state
    if (watcher.supports.scheme) theme.mode = mode
    if (highContrast) {
      theme.accessibility = theme.accessibility || {}
      theme.accessibility.colorBlindMode = 'highContrast'
    }
  }

  /** Detach the media listeners and drop the watcher. */
  teardown() {
    this.ctx._osTheme?.dispose()
    this.ctx._osTheme = null
  }
}
