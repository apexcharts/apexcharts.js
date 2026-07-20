/*!
 * ApexCharts v6.4.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Environment = _core.__apex_Environment_Environment;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const DARK_QUERY = "(prefers-color-scheme: dark)";
const CONTRAST_QUERY = "(prefers-contrast: more)";
class OSThemeWatcher {
  /**
   * @param {any} w @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    if (w.config.theme.follow !== "os" || !Environment.isBrowser()) return;
    const media = this._ensureMedia();
    if (!media) return;
    this._applyToConfig(media);
    this._ensureListeners(media);
  }
  /**
   * Create (once per instance) the MediaQueryLists and stash them on `ctx` so
   * they persist across the re-render that `updateOptions` triggers.
   * @returns {{dark: MediaQueryList|null, contrast: MediaQueryList|null, handler: null|(()=>void)}|null}
   */
  _ensureMedia() {
    if (!this.ctx._osThemeMedia) {
      const dark = BrowserAPIs.matchMedia(DARK_QUERY);
      const contrast = BrowserAPIs.matchMedia(CONTRAST_QUERY);
      if (!dark && !contrast) return null;
      this.ctx._osThemeMedia = { dark, contrast, handler: null };
    }
    return this.ctx._osThemeMedia;
  }
  /**
   * Write the OS-resolved mode / high-contrast onto the live `w.config.theme`.
   * @param {{dark: MediaQueryList|null, contrast: MediaQueryList|null}} media
   */
  _applyToConfig(media) {
    const theme = this.w.config.theme;
    if (media.dark) {
      theme.mode = media.dark.matches ? "dark" : "light";
    }
    if (media.contrast && media.contrast.matches) {
      theme.accessibility = theme.accessibility || {};
      theme.accessibility.colorBlindMode = "highContrast";
    }
  }
  /**
   * Attach the `change` listener once. The handler closes over `ctx` + `media`
   * (both stable across re-renders), NOT over `this` (a fresh watcher is built
   * each create), so it never goes stale.
   * @param {{dark: MediaQueryList|null, contrast: MediaQueryList|null, handler: null|(()=>void)}} media
   */
  _ensureListeners(media) {
    if (media.handler) return;
    const ctx = this.ctx;
    const handler = () => {
      const m = ctx._osThemeMedia;
      if (!m) return;
      const themeOpt = { mode: m.dark && m.dark.matches ? "dark" : "light" };
      if (m.contrast && m.contrast.matches) {
        themeOpt.accessibility = { colorBlindMode: "highContrast" };
      } else {
        themeOpt.accessibility = { colorBlindMode: "" };
      }
      ctx.updateOptions({ theme: themeOpt }, false, true, false);
    };
    OSThemeWatcher._add(media.dark, handler);
    OSThemeWatcher._add(media.contrast, handler);
    media.handler = handler;
  }
  /** Remove the listeners and drop the stashed media. Called on full destroy. */
  teardown() {
    const media = this.ctx._osThemeMedia;
    if (!media) return;
    if (media.handler) {
      OSThemeWatcher._remove(media.dark, media.handler);
      OSThemeWatcher._remove(media.contrast, media.handler);
    }
    this.ctx._osThemeMedia = null;
  }
  /**
   * @param {MediaQueryList|null} mql @param {()=>void} handler
   */
  static _add(mql, handler) {
    if (!mql) return;
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
    } else if (typeof /** @type {any} */
    mql.addListener === "function") {
      mql.addListener(handler);
    }
  }
  /**
   * @param {MediaQueryList|null} mql @param {()=>void} handler
   */
  static _remove(mql, handler) {
    if (!mql) return;
    if (typeof mql.removeEventListener === "function") {
      mql.removeEventListener("change", handler);
    } else if (typeof /** @type {any} */
    mql.removeListener === "function") {
      mql.removeListener(handler);
    }
  }
}
_core__default.registerFeatures({ osThemeWatcher: OSThemeWatcher });
export {
  default2 as default
};
