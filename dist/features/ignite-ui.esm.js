/*!
 * ApexCharts v8.8.0
 * (c) 2018-2026 ApexCharts
 */
import ApexCharts from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const e = (e2, t2, r2) => Math.min(r2, Math.max(t2, e2));
const t = () => "undefined" != typeof document;
let r;
function n(e2) {
  if (/^#[\da-f]{6}$/i.test(e2)) {
    const t3 = parseInt(e2.slice(1), 16);
    return [t3 >> 16, t3 >> 8 & 255, 255 & t3, 1];
  }
  const t2 = /^(rgba?\(|color\(srgb )([^()]*)\)$/.exec(e2), r2 = t2 ? t2[2].split(/[\s,/]+/).map(((e3) => /^[+-]?[\d.]+(e[+-]?\d+)?$/i.test(e3) ? +e3 : NaN)) : [];
  if (r2.length < 3 || r2.length > 4 || r2.some(isNaN)) return null;
  const n2 = "c" === e2[0] ? 255 : 1;
  return [r2[0] * n2, r2[1] * n2, r2[2] * n2, r2.length > 3 ? r2[3] : 1];
}
function o(e2) {
  const o2 = (function() {
    if (void 0 === r && (r = null, t() && ("undefined" == typeof navigator || !/jsdom/i.test(navigator.userAgent)))) try {
      const e3 = document.createElement("canvas");
      e3.width = e3.height = 1, r = e3.getContext("2d", { willReadFrequently: true });
    } catch (e3) {
      r = null;
    }
    return r;
  })(), i2 = o2 && (function(e3, t2) {
    e3.fillStyle = "#000000", e3.fillStyle = t2;
    const r2 = e3.fillStyle;
    return e3.fillStyle = "#ffffff", e3.fillStyle = t2, e3.fillStyle === r2 ? r2 : null;
  })(o2, e2);
  if (!o2 || !i2) return null;
  const s2 = n(i2);
  if (s2) return s2;
  const a2 = / \/ (\S+)\)$/.exec(e2);
  a2 && (o2.fillStyle = e2.slice(0, a2.index) + ")");
  const [l2, c2, u2] = (function(e3) {
    return e3.clearRect(0, 0, 1, 1), e3.fillRect(0, 0, 1, 1), e3.getImageData(0, 0, 1, 1).data;
  })(o2);
  return [l2, c2, u2, a2 ? +a2[1] || 0 : 1];
}
function i(r2, i2) {
  if (!t()) return null;
  const s2 = i2.ownerDocument, a2 = s2.defaultView, l2 = i2.isConnected ? i2 : /var\(|currentcolor/i.test(r2) ? null : s2.body || s2.documentElement, c2 = s2.createElement("span");
  if (c2.style.setProperty("color", r2, "important"), !a2 || !l2 || !c2.style.color || /^(inherit|unset|revert(-layer)?)$/i.test(c2.style.color)) return null;
  let u2;
  c2.style.display = "none", c2.style.setProperty("forced-color-adjust", "none", "important");
  try {
    l2.appendChild(c2), u2 = a2.getComputedStyle(c2).color;
  } catch (e2) {
    return null;
  } finally {
    c2.remove();
  }
  const f2 = u2 ? n(u2) || o(u2) : null;
  return f2 && (function(t2, r3) {
    const n2 = t2.slice(0, 3).map(((t3) => Math.round(e(t3, 0, 255))));
    return t2[3] >= 1 ? "#" + n2.map(((e2) => (256 | e2).toString(16).slice(1))).join("") : `rgba(${n2.join(", ")}, ${t2[3]})`;
  })(f2);
}
const s = "__apex_design_systems_v1__", a = /* @__PURE__ */ new Set(["fore", "muted", "grid", "raised", "overlay", "overlayContrast", "overlayBorder", "hover", "guide", "neutral"]), l = { color(e2, t2) {
  var _a;
  if (!a.has(e2) || ((_a = this.variant) != null ? _a : "light") === ("dark" === t2 ? "dark" : "light")) return this.colors[e2];
}, palette(e2) {
  var _a;
  const t2 = [], r2 = Math.max(this.series.length, e2.length);
  for (let n2 = 0; n2 < r2; n2++) {
    const r3 = (_a = this.series[n2]) != null ? _a : e2.length ? e2[n2 % e2.length] : void 0;
    r3 && t2.push(r3);
  }
  return t2;
} };
function c(e2, t2, r2, n2) {
  const o2 = /* @__PURE__ */ new Map(), s2 = (e3) => {
    let t3 = o2.get(e3);
    return void 0 === t3 && (t3 = (function(e4, t4) {
      const r3 = e4.getPropertyValue(t4);
      return r3 ? String(r3).trim() : "";
    })(n2, e3), o2.set(e3, t3)), t3;
  };
  if (!e2.probe.some(((e3) => s2(e3)))) return null;
  const a2 = (e3, t3) => {
    for (const r3 of e3 != null ? e3 : []) {
      const e4 = s2(r3), n3 = e4 ? t3(e4) : void 0;
      if (void 0 !== n3) return n3;
    }
  }, c2 = (e3) => a2(e3, ((e4) => {
    var _a;
    return (_a = i(e4, r2)) != null ? _a : void 0;
  })), u2 = {};
  for (const t3 of Object.keys(e2.colors)) {
    const r3 = c2(e2.colors[t3]);
    r3 && (u2[t3] = r3);
  }
  const f2 = { colors: u2, id: t2, series: e2.series.map(c2) }, g2 = c2(e2.paperCheck);
  g2 && (f2.paperCheck = g2);
  const d2 = a2(e2.font, ((e3) => e3));
  d2 && (f2.font = d2);
  const y2 = a2(e2.variant, ((e3) => {
    const t3 = e3.toLowerCase();
    return "light" === t3 || "dark" === t3 ? t3 : void 0;
  }));
  return y2 && (f2.variant = y2), (function(e3) {
    return Object.assign(Object.create(l), e3);
  })(f2);
}
function u(e2) {
  const [t2 = "", ...r2] = e2.split("+")[0].split("-"), [n2 = 0, o2 = 0, i2 = 0] = t2.split(".", 3).map(((e3) => parseInt(e3, 10) || 0)), s2 = 1e6 * n2 + 1e3 * o2 + i2;
  return r2.length && s2 > 0 ? s2 - 0.5 : s2;
}
const f = /* @__PURE__ */ u("0.10.0");
const g = (e2) => [`--ig-${e2}-seed`, `--ig-${e2}-500`], d = (e2, t2) => [`--ig-${e2}-${t2}`], y = ["primary", "secondary", "info", "success", "warn", "error"], p = (e2) => {
  if (e2 && "object" == typeof e2 && !Object.isFrozen(e2)) {
    for (const t2 of Object.values(e2)) p(t2);
    Object.freeze(e2);
  }
  return e2;
}, m = /* @__PURE__ */ (() => p({ schema: 1, probe: g("primary"), series: [...y.map(g), ...y.map(((e2) => d(e2, 300))), ...y.map(((e2) => d(e2, 700)))], colors: { fore: ["--ig-gray-800"], muted: ["--ig-gray-600"], grid: ["--ig-gray-300"], raised: ["--ig-surface-raised"], overlay: ["--ig-surface-overlay"], overlayContrast: ["--ig-surface-overlay-contrast"], overlayBorder: ["--ig-gray-300"], hover: ["--ig-gray-100"], guide: ["--ig-gray-400"], neutral: ["--ig-gray-600"], focus: g("primary"), positive: g("success"), negative: g("error"), caution: g("warn") }, paperCheck: ["--ig-surface-base", "--ig-surface-500"], font: ["--ig-font-family"], variant: ["--ig-theme-variant"] }))(), h = (function(e2, t2, r2 = f) {
  return Object.freeze({ name: e2, read: (r3, n2) => c(t2, e2, r3, n2), rev: r2, version: 1 });
})("igniteui", m);
!(function(e2) {
  const t2 = globalThis;
  let r2 = t2[s];
  r2 && "object" == typeof r2 || (r2 = {}, t2[s] = r2);
  const n2 = r2[e2.name];
  n2 && n2.rev >= e2.rev || (r2[e2.name] = e2);
})(h);
const css = ".apexcharts-canvas:where(.apexcharts-igniteui){--apexcharts-focus-color: var(--ig-primary-seed, var(--ig-primary-500, #008FFB))}.apexcharts-canvas:where(.apexcharts-igniteui){--apx-measure-up-ig: var(--ig-success-seed, var(--ig-success-500, #16a34a));--apx-measure-down-ig: var(--ig-error-seed, var(--ig-error-500, #dc2626));--apx-measure-up: var(--apx-measure-up-ig, #16a34a);--apx-measure-down: var(--apx-measure-down-ig, #dc2626)}.apexcharts-canvas:where(.apexcharts-theme-light.apexcharts-igniteui-light),.apexcharts-canvas:where(.apexcharts-theme-dark.apexcharts-igniteui-dark){--apx-measure-neutral-ig: var(--ig-gray-600, #64748b);--apx-measure-guide-ig: var(--ig-gray-400, #94a3b8);--apx-measure-neutral: var(--apx-measure-neutral-ig, #64748b);--apx-measure-guide: var(--apx-measure-guide-ig, #94a3b8)}.apexcharts-canvas:where(.apexcharts-igniteui-light){--apx-menu-bg: var(--ig-surface-overlay, #ffffff);--apx-menu-fg: var(--ig-surface-overlay-contrast, #1e293b);--apx-menu-border: var(--ig-gray-300, #e2e8f0);--apx-menu-hover: var(--ig-gray-100, #f1f5f9)}.apexcharts-canvas:where(.apexcharts-theme-dark.apexcharts-igniteui-dark){--apx-menu-bg: var(--ig-surface-overlay, #ffffff);--apx-menu-fg: var(--ig-surface-overlay-contrast, #1e293b);--apx-menu-border-ig: color-mix(in srgb, var(--ig-surface-overlay-contrast) 16%, var(--ig-surface-overlay));--apx-menu-border: var(--apx-menu-border-ig, #e2e8f0);--apx-menu-hover-ig: color-mix(in srgb, var(--ig-surface-overlay-contrast) 8%, var(--ig-surface-overlay));--apx-menu-hover: var(--apx-menu-hover-ig, #f1f5f9)}.apexcharts-canvas:where(.apexcharts-igniteui){--apx-ink-card-accent: var(--ig-primary-seed, var(--ig-primary-500, #6366f1))}.apexcharts-canvas:where(.apexcharts-igniteui-light){--apx-ink-card-bg: var(--ig-surface-overlay, #ffffff);--apx-ink-card-fg: var(--ig-surface-overlay-contrast, #1e293b);--apx-ink-card-border: var(--ig-gray-300, #e2e8f0);--apx-ink-card-hover: var(--ig-gray-100, #f1f5f9)}.apexcharts-canvas:where(.apexcharts-theme-dark.apexcharts-igniteui-dark){--apx-ink-card-bg: var(--ig-surface-overlay, #ffffff);--apx-ink-card-fg: var(--ig-surface-overlay-contrast, #1e293b);--apx-ink-card-border: var(--apx-menu-border-ig, #e2e8f0);--apx-ink-card-hover: var(--apx-menu-hover-ig, #f1f5f9)}:where(.apexcharts-igniteui) .apexcharts-context-menu,:where(.apexcharts-igniteui) .apexcharts-ink-card{font-family:var(--apx-font-family, var(--ig-font-family, Helvetica, Arial, sans-serif))}:where(.apexcharts-igniteui-light) .apexcharts-tooltip{--apx-tt-bg: var(--ig-surface-overlay, #ffffff);--apx-tt-border: var(--ig-gray-300, rgba(15, 23, 42, .12));--apx-tt-color: var(--ig-surface-overlay-contrast, #0f172a);--apx-tt-color-muted-ig: color-mix(in srgb, var(--ig-surface-overlay-contrast) 55%, transparent);--apx-tt-color-muted: var(--apx-tt-color-muted-ig, rgba(15, 23, 42, .55))}:where(.apexcharts-igniteui-dark) .apexcharts-tooltip.apexcharts-theme-dark{--apx-tt-bg: var(--ig-surface-overlay, #1c1c1f);--apx-tt-border: var(--ig-gray-300, rgba(255, 255, 255, .16));--apx-tt-color: var(--ig-surface-overlay-contrast, #f3f4f6);--apx-tt-color-muted-ig: color-mix(in srgb, var(--ig-surface-overlay-contrast) 55%, transparent);--apx-tt-color-muted: var(--apx-tt-color-muted-ig, rgba(243, 244, 246, .55))}:where(.apexcharts-igniteui-light) .apexcharts-xaxistooltip,:where(.apexcharts-igniteui-light) .apexcharts-yaxistooltip{--apx-axt-bg: var(--ig-surface-overlay, #ffffff);--apx-axt-border: var(--ig-gray-300, rgba(15, 23, 42, .08));--apx-axt-color: var(--ig-surface-overlay-contrast, #0f172a)}:where(.apexcharts-igniteui-dark) .apexcharts-xaxistooltip.apexcharts-theme-dark,:where(.apexcharts-igniteui-dark) .apexcharts-yaxistooltip.apexcharts-theme-dark{--apx-axt-bg: var(--ig-surface-overlay, #1c1c1f);--apx-axt-border: var(--ig-gray-300, rgba(255, 255, 255, .1));--apx-axt-color: var(--ig-surface-overlay-contrast, #f3f4f6)}:where(.apexcharts-igniteui-light) .apexcharts-menu{--apx-menu-bg: var(--ig-surface-overlay, rgba(255, 255, 255, .95));--apx-menu-fg: var(--ig-surface-overlay-contrast, currentColor);--apx-menu-border: var(--ig-gray-300, rgba(15, 23, 42, .08));--apx-menu-hover: var(--ig-gray-100, rgba(15, 23, 42, .06))}.apexcharts-theme-dark:where(.apexcharts-igniteui-dark) .apexcharts-menu{--apx-menu-bg: var(--ig-surface-overlay, rgba(28, 28, 31, .92));--apx-menu-fg: var(--ig-surface-overlay-contrast, #f3f4f6);--apx-menu-border: var(--ig-gray-300, rgba(255, 255, 255, .08));--apx-menu-hover: var(--ig-gray-100, rgba(255, 255, 255, .08))}";
ApexCharts.registerFeatures(
  /** @type {any} */
  {
    designSystemStyles: { name: "igniteui", css, adapter: h }
  }
);
export {
  default2 as default
};
