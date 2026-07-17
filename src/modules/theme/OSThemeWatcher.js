// @ts-check
import { Environment } from '../../utils/Environment'
import { BrowserAPIs } from '../../ssr/BrowserAPIs'

/**
 * Facet (#13): make `theme.follow: 'os'` reactive to the operating system's
 * `prefers-color-scheme` (light/dark) and `prefers-contrast` (more) settings,
 * with no JS on the consumer's side.
 *
 * Two responsibilities:
 *  - **Initial:** on every `create()` (this runs in `_initOptionalModules`,
 *    which is before `Core.setupElements` and `Theme.init`), write the resolved
 *    mode / high-contrast onto `w.config.theme` so the first paint already
 *    follows the OS. When `follow:'os'` is set, the OS drives the mode: it wins
 *    over any explicit `theme.mode` (opting into follow IS the intent).
 *  - **Live:** attach a `change` listener to the media queries ONCE per chart
 *    instance (the listener lives on `ctx`, so it survives the re-render that
 *    `updateOptions` performs) and re-theme via the existing `updateOptions`
 *    path when the OS preference flips. Removed on full destroy.
 *
 * SSR-safe: every browser touch is guarded / routed through `BrowserAPIs`.
 *
 * @module modules/theme/OSThemeWatcher
 */

const DARK_QUERY = '(prefers-color-scheme: dark)'
const CONTRAST_QUERY = '(prefers-contrast: more)'

export default class OSThemeWatcher {
  /**
   * @param {any} w @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx

    if (w.config.theme.follow !== 'os' || !Environment.isBrowser()) return

    const media = this._ensureMedia()
    if (!media) return

    this._applyToConfig(media) // every create, before Theme.init
    this._ensureListeners(media) // once per instance
  }

  /**
   * Create (once per instance) the MediaQueryLists and stash them on `ctx` so
   * they persist across the re-render that `updateOptions` triggers.
   * @returns {{dark: MediaQueryList|null, contrast: MediaQueryList|null, handler: null|(()=>void)}|null}
   */
  _ensureMedia() {
    if (!this.ctx._osThemeMedia) {
      const dark = BrowserAPIs.matchMedia(DARK_QUERY)
      const contrast = BrowserAPIs.matchMedia(CONTRAST_QUERY)
      if (!dark && !contrast) return null
      this.ctx._osThemeMedia = { dark, contrast, handler: null }
    }
    return this.ctx._osThemeMedia
  }

  /**
   * Write the OS-resolved mode / high-contrast onto the live `w.config.theme`.
   * @param {{dark: MediaQueryList|null, contrast: MediaQueryList|null}} media
   */
  _applyToConfig(media) {
    const theme = this.w.config.theme
    if (media.dark) {
      theme.mode = media.dark.matches ? 'dark' : 'light'
    }
    if (media.contrast && media.contrast.matches) {
      theme.accessibility = theme.accessibility || {}
      theme.accessibility.colorBlindMode = 'highContrast'
    }
  }

  /**
   * Attach the `change` listener once. The handler closes over `ctx` + `media`
   * (both stable across re-renders), NOT over `this` (a fresh watcher is built
   * each create), so it never goes stale.
   * @param {{dark: MediaQueryList|null, contrast: MediaQueryList|null, handler: null|(()=>void)}} media
   */
  _ensureListeners(media) {
    if (media.handler) return
    const ctx = this.ctx

    const handler = () => {
      const m = ctx._osThemeMedia
      if (!m) return
      /** @type {any} */
      const themeOpt = { mode: m.dark && m.dark.matches ? 'dark' : 'light' }
      if (m.contrast && m.contrast.matches) {
        themeOpt.accessibility = { colorBlindMode: 'highContrast' }
      } else {
        // clear the contrast override when the OS leaves high-contrast
        themeOpt.accessibility = { colorBlindMode: '' }
      }
      // (options, redraw:false, animate:true, updateSyncedCharts:false).
      // Synced charts are NOT updated from here: following the OS is per-chart
      // opt-in, and every follow:'os' group member has its own watcher firing
      // on the same media event, so syncing would double-update each of them.
      ctx.updateOptions({ theme: themeOpt }, false, true, false)
    }

    OSThemeWatcher._add(media.dark, handler)
    OSThemeWatcher._add(media.contrast, handler)
    media.handler = handler
  }

  /** Remove the listeners and drop the stashed media. Called on full destroy. */
  teardown() {
    const media = this.ctx._osThemeMedia
    if (!media) return
    if (media.handler) {
      OSThemeWatcher._remove(media.dark, media.handler)
      OSThemeWatcher._remove(media.contrast, media.handler)
    }
    this.ctx._osThemeMedia = null
  }

  /**
   * @param {MediaQueryList|null} mql @param {()=>void} handler
   */
  static _add(mql, handler) {
    if (!mql) return
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler)
    } else if (typeof (/** @type {any} */ (mql).addListener) === 'function') {
      // Safari < 14 fallback
      /** @type {any} */ (mql).addListener(handler)
    }
  }

  /**
   * @param {MediaQueryList|null} mql @param {()=>void} handler
   */
  static _remove(mql, handler) {
    if (!mql) return
    if (typeof mql.removeEventListener === 'function') {
      mql.removeEventListener('change', handler)
    } else if (typeof (/** @type {any} */ (mql).removeListener) === 'function') {
      /** @type {any} */ (mql).removeListener(handler)
    }
  }
}
