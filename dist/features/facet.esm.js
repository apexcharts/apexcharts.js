/*!
 * ApexCharts v8.8.2
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
class ye {
  constructor(t = {}) {
    var _a;
    this.dark = null, this.contrast = null, this.handler = null;
    const e = (_a = t.host) != null ? _a : "undefined" == typeof window ? {} : window;
    if (this.dark = ve(e, "(prefers-color-scheme: dark)"), this.contrast = ve(e, "(prefers-contrast: more)"), !this.dark && !this.contrast) return;
    const n = t.onChange;
    n && (this.handler = () => n(this.state), we(this.dark, this.handler), we(this.contrast, this.handler));
  }
  get state() {
    var _a;
    var t, e;
    return { highContrast: (_a = null == (t = this.contrast) ? void 0 : t.matches) != null ? _a : false, mode: (null == (e = this.dark) ? void 0 : e.matches) ? "dark" : "light" };
  }
  get supports() {
    return { contrast: be(this.contrast), scheme: be(this.dark) };
  }
  dispose() {
    this.handler && (Me(this.dark, this.handler), Me(this.contrast, this.handler), this.handler = null), this.dark = null, this.contrast = null;
  }
}
function ve(t, e) {
  var _a;
  var n;
  try {
    return (_a = null == (n = t.matchMedia) ? void 0 : n.call(t, e)) != null ? _a : null;
  } catch (e2) {
    return null;
  }
}
function be(t) {
  return !!t && "not all" !== t.media;
}
function we(t, e) {
  t && ("function" == typeof t.addEventListener ? t.addEventListener("change", e) : "function" == typeof t.addListener && t.addListener(e));
}
function Me(t, e) {
  t && ("function" == typeof t.removeEventListener ? t.removeEventListener("change", e) : "function" == typeof t.removeListener && t.removeListener(e));
}
const Environment = _core.__apex_Environment_Environment;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
class OSThemeWatcher {
  /**
   * @param {any} w @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    if (w.config.theme.follow !== "os" || !Environment.isBrowser()) return;
    let watcher = ctx._osTheme;
    if (!watcher) {
      watcher = new ye({
        host: (
          /** @type {any} */
          BrowserAPIs
        ),
        // Closes over `ctx` (stable across re-renders), NOT over `this`: a
        // fresh adapter is built whenever the modules are rebuilt.
        onChange({ mode: mode2, highContrast: highContrast2 }) {
          ctx.updateOptions(
            {
              theme: {
                mode: mode2,
                accessibility: {
                  colorBlindMode: highContrast2 ? "highContrast" : ""
                }
              }
            },
            false,
            true,
            false
          );
        }
      });
      const { scheme, contrast } = watcher.supports;
      if (!scheme && !contrast) {
        watcher.dispose();
        return;
      }
      ctx._osTheme = watcher;
    }
    const theme = w.config.theme;
    const { mode, highContrast } = watcher.state;
    if (watcher.supports.scheme) theme.mode = mode;
    if (highContrast) {
      theme.accessibility = theme.accessibility || {};
      theme.accessibility.colorBlindMode = "highContrast";
    }
  }
  /** Detach the media listeners and drop the watcher. */
  teardown() {
    var _a;
    (_a = this.ctx._osTheme) == null ? void 0 : _a.dispose();
    this.ctx._osTheme = null;
  }
}
_core__default.registerFeatures({ osThemeWatcher: OSThemeWatcher });
export {
  default2 as default
};
