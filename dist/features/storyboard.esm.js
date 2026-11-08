var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a2, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a2, prop, b[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b) => __defProps(a2, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e2) {
        reject(e2);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e2) {
        reject(e2);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
/*!
 * ApexCharts v8.8.1
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const t = globalThis.console;
function e(e2, ...n2) {
  t.error(e2, ...n2);
}
function n(e2) {
  t.warn(e2);
}
const s = ["community", "pro", "premium", "embedded", "oem"], i = { enterprise: "oem" }, r = { community: 0, pro: 1, premium: 2, embedded: 2, oem: 2 }, o = (t2) => s.includes(t2);
function l(t2) {
  if ("string" != typeof t2) return null;
  const e2 = t2.trim().toLowerCase();
  return o(e2) ? e2 : Object.prototype.hasOwnProperty.call(i, e2) ? i[e2] : null;
}
function a(t2) {
  const e2 = l(t2);
  return e2 ? r[e2] : null;
}
const c = "APEX-", u = /* @__PURE__ */ new Date("2027-07-31T00:00:00Z"), d = "__apex_license_v1__";
function h() {
  const t2 = globalThis;
  let e2 = t2[d];
  return e2 || (e2 = { key: null, listeners: /* @__PURE__ */ new Set(), result: null }, t2[d] = e2), e2;
}
const f = class {
  static get licenseKey() {
    return h().key;
  }
  static set licenseKey(t2) {
    h().key = t2;
  }
  static get listeners() {
    return h().listeners;
  }
  static get validationResult() {
    return h().result;
  }
  static set validationResult(t2) {
    h().result = t2;
  }
  static getKey() {
    return this.licenseKey;
  }
  static getLicenseStatus() {
    return this.licenseKey ? (this.validationResult = this.validateKey(this.licenseKey), this.validationResult) : { expired: false, signatureVerified: false, valid: false };
  }
  static isKeyValid(t2) {
    return !!t2 && this.validateKey(t2).valid;
  }
  static isLicenseValid() {
    return this.getLicenseStatus().valid;
  }
  static onChange(t2) {
    return this.listeners.add(t2), () => {
      this.listeners.delete(t2);
    };
  }
  static setLicense(t2) {
    var _a;
    var s2, i2, r2, o2, c2;
    if (!t2) return this.licenseKey = null, void this.publish({ expired: false, signatureVerified: false, valid: false });
    const u2 = this.validateKey(t2);
    if (u2.valid || t2 === this.licenseKey || !(null == (s2 = this.validationResult) ? void 0 : s2.valid)) {
      if (u2.valid && t2 !== this.licenseKey && this.licenseKey) {
        const t3 = this.getLicenseStatus(), e2 = t3.valid ? a(null == (i2 = t3.data) ? void 0 : i2.plan) : null, s3 = a(null == (r2 = u2.data) ? void 0 : r2.plan);
        if (null !== e2 && null !== s3 && s3 < e2) return void n(`[Apex] Ignoring license key: its plan (${l(null == (o2 = u2.data) ? void 0 : o2.plan)}) is lower than ${l(null == (c2 = t3.data) ? void 0 : c2.plan)}, the plan of the license already active on this page. Call setLicense("") first to replace it with a lower plan.`);
      }
      this.licenseKey = t2, this.publish(u2), u2.valid || e(`[Apex] ${u2.message}`);
    } else n(`[Apex] Ignoring license key: ${(_a = u2.message) != null ? _a : "it is not valid"} A valid license is already active on this page.`);
  }
  static validateKey(t2) {
    const e2 = this.parseKey(t2), n2 = this.validateStructure(t2, e2);
    if (!n2.valid || !(null == e2 ? void 0 : e2.signature)) return n2;
    const s2 = this.verdicts.get(t2);
    return false === s2 ? { data: e2.data, expired: false, message: "Invalid license key. The license signature does not verify.", signatureVerified: true, valid: false } : (void 0 === s2 && this.verifySignature(t2, e2, n2), __spreadProps(__spreadValues({}, n2), { signatureVerified: true === s2 }));
  }
  static _resetSignatureState() {
    this.verdicts.clear(), this.verifying.clear(), this.warnedUnverifiable = false, this.epoch++;
  }
  static base64ToBytes(t2) {
    const e2 = t2.replace(/-/g, "+").replace(/_/g, "/"), n2 = e2.padEnd(4 * Math.ceil(e2.length / 4), "="), s2 = globalThis.atob;
    if ("function" != typeof s2) throw new Error("no base64 decoder available");
    const i2 = s2(n2), r2 = new Uint8Array(i2.length);
    for (let t3 = 0; t3 < i2.length; t3++) r2[t3] = i2.charCodeAt(t3);
    return r2;
  }
  static canonicalPayload(t2) {
    const e2 = t2.domains && t2.domains.length > 0 ? t2.domains.join(",") : "";
    return `v1|${t2.issueDate}|${t2.expiryDate}|${t2.plan}|${e2}`;
  }
  static notify(t2) {
    for (const e2 of this.listeners) try {
      e2(t2);
    } catch (e3) {
    }
  }
  static parseKey(t2) {
    if ("string" != typeof t2 || !t2.startsWith(c)) return null;
    const e2 = t2.slice(5);
    if (!e2) return null;
    try {
      const t3 = new TextDecoder().decode(this.base64ToBytes(e2)), n2 = JSON.parse(t3);
      return n2.issueDate && n2.expiryDate && n2.plan ? { data: { domains: Array.isArray(n2.domains) ? n2.domains : void 0, expiryDate: n2.expiryDate, issueDate: n2.issueDate, plan: n2.plan, valid: true }, signature: "string" == typeof n2.sig && n2.sig ? n2.sig : null } : null;
    } catch (e3) {
      return null;
    }
  }
  static publish(t2) {
    this.validationResult = t2, this.notify(t2);
  }
  static validateStructure(t2, e2) {
    const n2 = (t3) => ({ expired: false, message: t3, signatureVerified: false, valid: false });
    if ("string" != typeof t2 || !t2.startsWith(c)) return n2('Invalid license key format. License key must start with "APEX-".');
    if (!e2) return n2("Invalid license key. Unable to decode license data.");
    const { data: s2, signature: i2 } = e2;
    if (!i2 && /* @__PURE__ */ new Date() >= u) return n2("This license key is in the old unsigned format, which is no longer accepted. Please request a replacement key.");
    if (new Date(s2.expiryDate) < /* @__PURE__ */ new Date()) return { data: s2, expired: true, message: `License expired on ${s2.expiryDate}. Please renew your license.`, signatureVerified: false, valid: false };
    if (s2.domains && s2.domains.length > 0) {
      const t3 = "undefined" == typeof location ? "" : location.hostname;
      if (!s2.domains.some(((e3) => t3 === e3 || t3.endsWith(`.${e3}`)))) return { data: s2, expired: false, message: `License is not valid for this domain (${t3}). Allowed domains: ${s2.domains.join(", ")}.`, signatureVerified: false, valid: false };
    }
    return { data: s2, expired: false, signatureVerified: false, valid: true };
  }
  static verifySignature(t2, s2, i2) {
    return __async(this, null, function* () {
      var r2;
      if (this.verifying.has(t2) || this.verdicts.has(t2)) return;
      this.verifying.add(t2);
      const o2 = this.epoch, l2 = null == (r2 = globalThis.crypto) ? void 0 : r2.subtle;
      if (!l2 || 0 === this.publicKeysSpki.length) return this.verifying.delete(t2), void (this.warnedUnverifiable || (this.warnedUnverifiable = true, n(l2 ? "[Apex] No license signing key is configured in this build, so license signatures cannot be verified." : "[Apex] Web Crypto is unavailable (a secure context is required), so the license signature cannot be verified.")));
      const a2 = new TextEncoder().encode(this.canonicalPayload(s2.data));
      let c2 = false;
      for (const t3 of this.publicKeysSpki) {
        try {
          const e2 = yield l2.importKey("spki", this.base64ToBytes(t3), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
          c2 = yield l2.verify({ hash: "SHA-256", name: "ECDSA" }, e2, this.base64ToBytes(s2.signature), a2);
        } catch (e2) {
          c2 = false;
        }
        if (c2) break;
      }
      if (this.verifying.delete(t2), this.epoch !== o2) return;
      if (this.verdicts.set(t2, c2), c2) {
        const e2 = __spreadProps(__spreadValues({}, i2), { signatureVerified: true });
        return void (this.licenseKey === t2 ? this.publish(e2) : this.notify(e2));
      }
      const u2 = "Invalid license key. The license signature does not verify.", d2 = { data: s2.data, expired: false, message: u2, signatureVerified: true, valid: false };
      this.licenseKey === t2 ? this.publish(d2) : this.notify(d2), e(`[Apex] ${u2}`);
    });
  }
};
f.publicKeysSpki = ["MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQIaK9UMD6n0oR/FIy8QdL0uSzKMQlf1BB+tOrji4/WuHsyRNxeDhVykoSsNURozMi1xhmqWvBH1L//xIfugTPA=="], f.verdicts = /* @__PURE__ */ new Map(), f.verifying = /* @__PURE__ */ new Set(), f.warnedUnverifiable = false, f.epoch = 0;
let m = f;
const p = /* @__PURE__ */ new Set();
function g() {
  var t2;
  const e2 = m.getLicenseStatus();
  return e2.valid ? l(null == (t2 = e2.data) ? void 0 : t2.plan) : null;
}
function y(t2) {
  var e2;
  try {
    const i2 = m.getLicenseStatus();
    if (!i2.valid) return false;
    const o2 = null == (e2 = i2.data) ? void 0 : e2.plan, a2 = l(o2);
    if (a2) return r[a2] >= r[t2];
    const c2 = "string" == typeof o2 && o2.trim() ? o2.trim() : "(missing)";
    return p.has(c2) || (p.add(c2), n(`[apex] licence plan ${JSON.stringify(c2)} is not a known plan, so plan-gated features are being allowed. Expected one of: ${s.join(", ")}.`)), true;
  } catch (e3) {
    return false;
  }
}
const E = class {
  static applyStyles(t2) {
    Object.assign(t2.style, this.CRITICAL_STYLES, { backgroundImage: this.createWatermarkPattern(), backgroundRepeat: "repeat" });
  }
  static node(t2) {
    if (!t2) return null;
    for (const e2 of Array.from(t2.children)) if (e2.hasAttribute(this.WATERMARK_ATTR)) return e2;
    return null;
  }
  static add(t2, e2) {
    return t2 && "undefined" != typeof document ? (this.setManaged(t2, e2), (null == e2 ? void 0 : e2.requires) && this.explainPlan(e2.requires), this.paint(t2)) : null;
  }
  static exists(t2) {
    return !!this.node(t2);
  }
  static remove(t2, e2) {
    t2 && (this.setManaged(t2, e2), this.erase(t2));
  }
  static untrack(t2) {
    this.managed.delete(t2);
  }
  static createWatermarkPattern() {
    const t2 = this.WATERMARK_TEXT;
    return `url("data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
        <text
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif"
          font-size="18"
          font-weight="600"
          fill="rgba(134, 134, 134, 0.1)"
          transform="rotate(-35, 100, 60)"
        >${t2}</text>
      </svg>
    `.trim())}")`;
  }
  static explainPlan(t2) {
    const e2 = g();
    if (!e2 || y(t2)) return;
    const s2 = `${e2}>${t2}`;
    this.explainedPlans.has(s2) || (this.explainedPlans.add(s2), n(`[Apex] The license key is valid, but its plan (${e2}) does not include a product on this page that needs ${t2} or higher, so that product keeps the trial watermark.`));
  }
  static erase(t2) {
    var e2;
    null == (e2 = this.node(t2)) || e2.remove();
  }
  static paint(t2) {
    let e2 = this.node(t2);
    return e2 || (e2 = document.createElement("div"), e2.setAttribute(this.WATERMARK_ATTR, ""), t2.appendChild(e2)), this.applyStyles(e2), "function" == typeof getComputedStyle && "static" === getComputedStyle(t2).position && (t2.style.position = "relative"), e2;
  }
  static reconcile() {
    const t2 = m.isLicenseValid();
    for (const [e2, n2] of this.managed) e2.isConnected ? (n2 ? y(n2) : t2) ? this.erase(e2) : (n2 && this.explainPlan(n2), this.paint(e2)) : this.managed.delete(e2);
  }
  static setManaged(t2, e2) {
    false !== (null == e2 ? void 0 : e2.manage) ? this.track(t2, null == e2 ? void 0 : e2.requires) : this.managed.delete(t2);
  }
  static track(t2, e2) {
    this.managed.set(t2, e2), this.subscribed || (this.subscribed = true, m.onChange((() => {
      this.reconcile();
    })));
  }
};
E.WATERMARK_ATTR = "data-apexcharts-watermark", E.WATERMARK_TEXT = "APEXCHARTS", E.ATTR = "data-apexcharts-watermark", E.CRITICAL_STYLES = { bottom: "0", display: "block", left: "0", msUserSelect: "none", opacity: "1", pointerEvents: "none", position: "absolute", right: "0", top: "0", userSelect: "none", visibility: "visible", webkitUserSelect: "none", zIndex: "10000" }, E.managed = /* @__PURE__ */ new Map(), E.subscribed = false, E.explainedPlans = /* @__PURE__ */ new Set();
let $ = E;
function Ae(t2) {
  const e2 = t2.getRootNode ? t2.getRootNode() : null;
  return e2 && (9 === e2.nodeType || 11 === e2.nodeType && "host" in e2) ? e2 : t2.ownerDocument || document;
}
function Ce(t2, e2) {
  const n2 = Ae(t2), s2 = n2.querySelector(e2);
  if (s2) return s2;
  const i2 = t2.ownerDocument;
  return i2 && i2 !== n2 ? i2.querySelector(e2) : null;
}
function Te(t2, e2) {
  const n2 = Ae(t2), s2 = Array.from(n2.querySelectorAll(e2));
  if (s2.length) return s2;
  const i2 = t2.ownerDocument;
  return i2 && i2 !== n2 ? Array.from(i2.querySelectorAll(e2)) : [];
}
const Environment = _core.__apex_Environment_Environment;
const prefersReducedMotion = _core.__apex_Animations_prefersReducedMotion;
const PRICING_URL = "https://apexcharts.com/pricing";
const STATE_KEY = "__apexcharts_license_enforcer_v1__";
if (!/** @type {any} */
globalThis[STATE_KEY]) {
  globalThis[STATE_KEY] = {
    perspectivesTokenDecoded: false,
    enforced: /* @__PURE__ */ new Set()
  };
}
const state = (
  /** @type {any} */
  globalThis[STATE_KEY]
);
const enforced = state.enforced;
function markPerspectivesTokenDecoded() {
  state.perspectivesTokenDecoded = true;
  reevaluateLicenseAcrossCharts();
}
function premiumFeaturesInUse(w, ctx) {
  var _a;
  const chart = w && w.config && w.config.chart || {};
  const used = [];
  if (chart.type === "unit") used.push("unit");
  if (chart.requestedType === "raincloud") used.push("raincloud");
  if (ctx.trellis && typeof ctx.trellis.isActive === "function" && ctx.trellis.isActive()) {
    used.push("trellis");
  }
  if (ctx.storyboard && ctx.storyboard._used) used.push("storyboard");
  const link = chart.link;
  if (ctx.linkedViews && link && (link.enabled === true || typeof link.dimension === "function")) {
    used.push("link");
  }
  if (ctx.ink && chart.ink && chart.ink.enabled === true) used.push("ink");
  if (ctx.measure && chart.measure && chart.measure.enabled === true) {
    used.push("measure");
  }
  if (ctx.contextMenu && chart.contextMenu && chart.contextMenu.enabled === true) {
    used.push("context-menu");
  }
  if (ctx.perspectives && (ctx.perspectives._used || state.perspectivesTokenDecoded)) {
    used.push("perspectives");
  }
  if (ctx.history && chart.history && chart.history.enabled === true) {
    used.push("history");
  }
  if ((_a = ctx._highlightFilter) == null ? void 0 : _a.isActive()) used.push("highlight-filter");
  return used;
}
function resolveKey(w) {
  const perChart = w && w.config && w.config.chart && w.config.chart.license;
  if (perChart) return perChart;
  const singleton = m.getKey();
  if (singleton) return singleton;
  const apex = Environment.getApex();
  if (apex && apex.license) return apex.license;
  return null;
}
const PREMIUM_PLANS = /* @__PURE__ */ new Set(["premium", "enterprise"]);
function licensedForPremium(key) {
  if (!key) return false;
  const result = m.validateKey(key);
  if (!result.valid) return false;
  const plan = result.data && result.data.plan;
  return typeof plan === "string" && PREMIUM_PLANS.has(plan.toLowerCase());
}
function reinstateWatermark(ctx, elWrap) {
  const node = $.add(elWrap, { manage: false });
  ctx._wmPainted = true;
  if (!node || typeof MutationObserver === "undefined") return;
  if (ctx._wmNodeObserver && ctx._wmObservedNode === node) return;
  if (ctx._wmNodeObserver) ctx._wmNodeObserver.disconnect();
  const nodeObs = new MutationObserver(() => {
    const n2 = $.node(elWrap);
    if (!n2) return;
    nodeObs.disconnect();
    $.applyStyles(n2);
    nodeObs.takeRecords();
    nodeObs.observe(n2, { attributes: true, attributeFilter: ["style"] });
  });
  nodeObs.observe(node, { attributes: true, attributeFilter: ["style"] });
  ctx._wmNodeObserver = nodeObs;
  ctx._wmObservedNode = node;
}
function addWatermark(ctx, elWrap) {
  reinstateWatermark(ctx, elWrap);
  if (typeof MutationObserver === "undefined") return;
  if (ctx._wmWrapObserver && ctx._wmObservedWrap === elWrap) return;
  if (ctx._wmWrapObserver) ctx._wmWrapObserver.disconnect();
  const wrapObs = new MutationObserver(() => {
    if (!$.node(elWrap)) reinstateWatermark(ctx, elWrap);
  });
  wrapObs.observe(elWrap, { childList: true });
  ctx._wmWrapObserver = wrapObs;
  ctx._wmObservedWrap = elWrap;
}
function teardownWatermark(ctx, elWrap) {
  if (!ctx._wmPainted) return;
  ctx._wmPainted = false;
  if (ctx._wmWrapObserver) {
    ctx._wmWrapObserver.disconnect();
    ctx._wmWrapObserver = null;
  }
  if (ctx._wmNodeObserver) {
    ctx._wmNodeObserver.disconnect();
    ctx._wmNodeObserver = null;
  }
  ctx._wmObservedNode = null;
  ctx._wmObservedWrap = null;
  const wrap = elWrap || ctx.w && ctx.w.dom && ctx.w.dom.elWrap;
  if (wrap) $.remove(wrap, { manage: false });
}
function notifyTrial(ctx, key, features) {
  if (ctx._premiumLicenseNotified) return;
  ctx._premiumLicenseNotified = true;
  const many = features.length > 1;
  if (!key) {
    console.warn(
      `[ApexCharts] Premium feature${many ? "s" : ""} in use (${features.join(", ")}) without a license. Running in trial mode with a watermark. Get a license: ${PRICING_URL}`
    );
    return;
  }
  const result = m.validateKey(key);
  if (result.valid) {
    const plan = result.data && result.data.plan || "current";
    console.warn(
      `[ApexCharts] Premium feature${many ? "s" : ""} in use (${features.join(", ")}) require a Premium or Enterprise license; the ${plan} plan does not include ${many ? "them" : "it"}. Running in trial mode with a watermark. Upgrade: ${PRICING_URL}`
    );
    return;
  }
  if (key !== m.getKey()) {
    console.error(`[Apex] ${result.message}`);
  }
}
function enforceLicense(w, ctx) {
  try {
    if (!Environment.isBrowser()) return;
    if (w && w.globals && w.globals.isDestroyed) {
      enforced.delete(ctx);
      return;
    }
    const elWrap = w && w.dom && w.dom.elWrap;
    if (!elWrap) return;
    const features = premiumFeaturesInUse(w, ctx);
    if (features.length === 0) {
      enforced.delete(ctx);
      teardownWatermark(ctx, elWrap);
      return;
    }
    enforced.add(ctx);
    const key = resolveKey(w);
    if (licensedForPremium(key)) {
      teardownWatermark(ctx, elWrap);
      return;
    }
    addWatermark(ctx, elWrap);
    notifyTrial(ctx, key, features);
  } catch (e2) {
  }
}
function reevaluateLicenseAcrossCharts() {
  if (!Environment.isBrowser()) return;
  const visited = /* @__PURE__ */ new Set();
  const apex = Environment.getApex();
  const instances = apex && apex._chartInstances;
  if (Array.isArray(instances)) {
    instances.forEach((entry) => {
      const chart = entry && entry.chart;
      if (chart && chart.w && !chart.w.globals.isDestroyed) {
        visited.add(chart);
        enforceLicense(chart.w, chart);
      }
    });
  }
  Array.from(enforced).forEach((ctx) => {
    const w = ctx && ctx.w;
    const elWrap = w && w.dom && w.dom.elWrap;
    if (!w || w.globals.isDestroyed || !elWrap || elWrap.isConnected === false) {
      enforced.delete(ctx);
      return;
    }
    if (visited.has(ctx)) return;
    enforceLicense(w, ctx);
  });
}
m.onChange(reevaluateLicenseAcrossCharts);
class Storyboard {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._beats = [];
    this._observer = null;
    this._activeIndex = -1;
    this._animate = true;
    this._warnedNoPerspectives = false;
    this._used = false;
  }
  /**
   * Bind beats to scroll position. Rebinding replaces the previous binding.
   * @param {{
   *   beats?: Array<{ el?: Element, selector?: string, key?: string, view?: any, announce?: string, onEnter?: (chart: any, info: StoryboardBeatInfo) => void }>,
   *   scroller?: Element | string,
   *   offset?: number,
   *   animate?: boolean,
   * }} [opts]
   * @returns {number} the number of beats bound
   */
  bind(opts = {}) {
    var _a;
    this.unbind();
    if (!Environment.isBrowser()) return 0;
    const doc = this.ctx.el && this.ctx.el.ownerDocument;
    if (!doc || typeof IntersectionObserver === "undefined") return 0;
    let root = null;
    if (opts.scroller) {
      root = typeof opts.scroller === "string" ? Ce(this.ctx.el, opts.scroller) : opts.scroller;
    }
    this._beats = this._resolveBeats(this.ctx.el, root, opts.beats);
    if (!this._beats.length) return 0;
    this._animate = opts.animate !== false;
    const offset = Math.min(Math.max((_a = opts.offset) != null ? _a : 0.5, 0), 1);
    const top = +(offset * 100).toFixed(3);
    const bottom = +(100 - offset * 100).toFixed(3);
    this._observer = new IntersectionObserver(
      (entries) => this._onIntersect(entries),
      { root, rootMargin: `-${top}% 0px -${bottom}%`, threshold: 0 }
    );
    this._beats.forEach((b) => {
      var _a2;
      return (_a2 = this._observer) == null ? void 0 : _a2.observe(b.el);
    });
    this._used = true;
    enforceLicense(this.w, this.ctx);
    return this._beats.length;
  }
  /**
   * Normalize the beats option, or auto-discover [data-apex-beat] elements in
   * document order when no explicit list is given. Selectors resolve in the
   * chart's own root first, so beats beside a chart in a shadow root are found.
   * @param {Element} chartEl
   * @param {Element | null} root
   * @param {Array<any>} [beatsOpt]
   * @returns {StoryboardBeat[]}
   * @private
   */
  _resolveBeats(chartEl, root, beatsOpt) {
    const beats = [];
    if (Array.isArray(beatsOpt)) {
      beatsOpt.forEach((b, i2) => {
        var _a, _b;
        if (!b) return;
        const el = b.el && typeof b.el === "object" ? b.el : b.selector ? Ce(chartEl, b.selector) : null;
        if (!el) {
          console.warn(
            `apexcharts: storyboard beat ${i2} has no resolvable element; skipped.`
          );
          return;
        }
        beats.push({
          el,
          key: (_b = (_a = b.key) != null ? _a : el.getAttribute("data-apex-beat")) != null ? _b : String(i2),
          view: b.view,
          options: b.options,
          announce: b.announce,
          onEnter: typeof b.onEnter === "function" ? b.onEnter : void 0
        });
      });
      return beats;
    }
    const found = root ? Array.from(root.querySelectorAll("[data-apex-beat]")) : Te(chartEl, "[data-apex-beat]");
    found.forEach((el, i2) => {
      beats.push({
        el,
        key: el.getAttribute("data-apex-beat") || String(i2),
        view: el.getAttribute("data-apex-view") || void 0,
        options: void 0,
        announce: el.getAttribute("data-apex-announce") || void 0,
        onEnter: void 0
      });
    });
    return beats;
  }
  /**
   * @param {IntersectionObserverEntry[]} entries
   * @private
   */
  _onIntersect(entries) {
    entries.forEach((entry) => {
      const idx = this._beats.findIndex((b) => b.el === entry.target);
      if (idx < 0) return;
      if (entry.isIntersecting) {
        this._activate(idx);
      } else if (idx === this._activeIndex && entry.rootBounds) {
        if (entry.boundingClientRect.top >= entry.rootBounds.bottom && idx > 0) {
          this._activate(idx - 1);
        }
      }
    });
  }
  /**
   * Activate a beat: apply its view token, run its callback, announce it and
   * fire `beatChange`. Idempotent per beat (re-activating the current beat is
   * a no-op), so IO chatter never re-applies a view.
   * @param {number} idx
   * @param {{ animate?: boolean }} [opts]
   * @private
   */
  _activate(idx, opts = {}) {
    var _a, _b;
    if (idx === this._activeIndex) return;
    const beat = this._beats[idx];
    if (!beat) return;
    const direction = idx > this._activeIndex ? "down" : "up";
    this._activeIndex = idx;
    const animate = (opts.animate !== void 0 ? opts.animate : this._animate) && !prefersReducedMotion();
    if (beat.view != null || beat.options) {
      if (this.ctx.perspectives) {
        const v = (_a = beat.view) != null ? _a : {};
        const token = typeof v === "string" || v.view ? v : { view: this._normalizeView(v) };
        this.ctx.perspectives.apply(token, {
          animate,
          mergeOptions: beat.options
        });
      } else if (!this._warnedNoPerspectives) {
        this._warnedNoPerspectives = true;
        console.warn(
          'apexcharts: storyboard beats carry views but the perspectives feature is not bundled. import "apexcharts/features/storyboard" (which includes it) or drive beats via onEnter.'
        );
      }
    }
    const info = { index: idx, key: beat.key, el: beat.el, direction };
    if (beat.onEnter) beat.onEnter(this.ctx, info);
    if (beat.announce) this._announce(beat.announce);
    if (typeof this.w.config.chart.events.beatChange === "function") {
      this.w.config.chart.events.beatChange(this.ctx, info);
    }
    (_b = this.ctx.events) == null ? void 0 : _b.fireEvent("beatChange", [this.ctx, info]);
  }
  /**
   * Fill in the parts of a hand-authored (bare) ViewState that would
   * otherwise LEAK between beats. updateOptions merges objects, so a beat
   * listing only xaxis annotations would keep a previous beat's point
   * annotations; padding every annotation kind with an empty array makes
   * each beat fully describe its own state, which is what allows scrubbing
   * in both directions. Full tokens (from capture()/encode()) already carry
   * the complete set and never pass through here.
   * @param {any} view
   * @returns {any}
   * @private
   */
  _normalizeView(view) {
    const provided = view.annotations && view.annotations.static || {};
    return __spreadProps(__spreadValues({}, view), {
      annotations: {
        static: __spreadValues({
          points: [],
          xaxis: [],
          yaxis: [],
          texts: [],
          images: []
        }, provided),
        dynamic: view.annotations && view.annotations.dynamic || []
      }
    });
  }
  /**
   * Programmatically jump to a beat by index or author key (also usable
   * without scrolling, e.g. from next/prev buttons).
   * @param {number | string} indexOrKey
   * @param {{ animate?: boolean }} [opts]
   */
  goTo(indexOrKey, opts = {}) {
    const idx = typeof indexOrKey === "number" ? indexOrKey : this._beats.findIndex((b) => b.key === indexOrKey);
    if (idx >= 0 && idx < this._beats.length) this._activate(idx, opts);
  }
  /**
   * @returns {{ index: number, key: string | null } | null} the active beat
   */
  current() {
    if (this._activeIndex < 0) return null;
    const beat = this._beats[this._activeIndex];
    return { index: this._activeIndex, key: beat ? beat.key : null };
  }
  /** Disconnect the observer and drop the beat list. */
  unbind() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    this._beats = [];
    this._activeIndex = -1;
    this._used = false;
    enforceLicense(this.w, this.ctx);
  }
  /** Full-destroy cleanup (called from Destroy). */
  teardown() {
    this.unbind();
  }
  /**
   * Push a beat's announcement to the chart's visually-hidden aria-live
   * status region so screen-reader users follow the story too. No-op when
   * announcements are disabled or the region is absent.
   * @param {string} message
   * @private
   */
  _announce(message) {
    const w = this.w;
    if (!w.config.chart.accessibility.announcements.enabled) return;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const region = baseEl.querySelector(".apexcharts-sr-status");
    if (!region) return;
    region.textContent = "";
    setTimeout(() => {
      region.textContent = message;
    }, 0);
  }
}
const Utils = _core.__apex_Utils;
const VIEWSTATE_VERSION = 1;
function axisWindow(min, max) {
  const hasMin = min !== void 0 && min !== null;
  const hasMax = max !== void 0 && max !== null;
  if (!hasMin && !hasMax) return null;
  return { min: hasMin ? min : null, max: hasMax ? max : null };
}
function cloneSelection(sel) {
  if (!Array.isArray(sel)) return [];
  return sel.map((a2) => Array.isArray(a2) ? a2.slice() : a2);
}
function annotationKind(method, ctx) {
  if (typeof method !== "function" || !ctx) return null;
  if (method === ctx.addXaxisAnnotation) return "xaxis";
  if (method === ctx.addYaxisAnnotation) return "yaxis";
  if (method === ctx.addPointAnnotation) return "point";
  return null;
}
function addMethodName(kind) {
  switch (kind) {
    case "xaxis":
      return "addXaxisAnnotation";
    case "yaxis":
      return "addYaxisAnnotation";
    case "point":
      return "addPointAnnotation";
    default:
      return null;
  }
}
function captureAnnotations(w, ctx) {
  const staticAnno = w.config.annotations ? Utils.clone(w.config.annotations) : null;
  const dynamic = [];
  const mem = w.globals.memory && w.globals.memory.methodsToExec || [];
  for (const entry of mem) {
    if (!entry || entry.label !== "addAnnotation") continue;
    const kind = annotationKind(entry.method, ctx);
    if (!kind) continue;
    dynamic.push({ kind, params: Utils.clone(entry.params) });
  }
  return { static: staticAnno, dynamic };
}
function captureMeasure(ctx) {
  const m2 = ctx && ctx.measure;
  if (!m2 || typeof m2.getPins !== "function") return null;
  const pins = m2.getPins();
  return Array.isArray(pins) && pins.length ? { pins } : null;
}
function captureViewState(w, ctx) {
  var _a, _b;
  const cfgX = w.config.xaxis || {};
  const cfgYArr = Array.isArray(w.config.yaxis) ? w.config.yaxis : w.config.yaxis ? [w.config.yaxis] : [];
  const yWindows = cfgYArr.map(
    (y2) => axisWindow(y2 && y2.min, y2 && y2.max)
  );
  const anyY = yWindows.some((yw) => yw !== null);
  const theme = w.config.theme;
  const drilldown = ctx && ctx.drilldown;
  return {
    v: VIEWSTATE_VERSION,
    window: {
      xaxis: axisWindow(cfgX.min, cfgX.max),
      yaxis: anyY ? yWindows : null
    },
    zoomed: !!w.interact.zoomed,
    collapsed: (w.globals.collapsedSeriesIndices || []).slice(),
    ancillaryCollapsed: (w.globals.ancillaryCollapsedSeriesIndices || []).slice(),
    selectedDataPoints: cloneSelection(w.interact.selectedDataPoints),
    theme: theme ? {
      mode: (_a = theme.mode) != null ? _a : null,
      palette: (_b = theme.palette) != null ? _b : null,
      // A palette the chart only defaulted to keeps following the mode
      // once restored; without this the restore would name it.
      paletteExplicit: !!w.globals.themePaletteExplicit
    } : null,
    locale: w.config.chart && w.config.chart.defaultLocale || null,
    annotations: captureAnnotations(w, ctx),
    drill: drilldown && drilldown.depth > 0 ? { path: drilldown.path.slice() } : null,
    measure: captureMeasure(ctx)
  };
}
function applyCollapsedSet(ctx, targetCollapsed, targetAncillary) {
  const w = ctx.w;
  if (targetCollapsed == null && targetAncillary == null) return;
  const names = w.globals.seriesNames || [];
  const target = /* @__PURE__ */ new Set([
    ...targetCollapsed || [],
    ...targetAncillary || []
  ]);
  const current = /* @__PURE__ */ new Set([
    ...w.globals.collapsedSeriesIndices || [],
    ...w.globals.ancillaryCollapsedSeriesIndices || []
  ]);
  for (let realIndex = 0; realIndex < names.length; realIndex++) {
    const name = names[realIndex];
    if (name == null) continue;
    const shouldCollapse = target.has(realIndex);
    const isCollapsed = current.has(realIndex);
    if (shouldCollapse && !isCollapsed) {
      ctx.hideSeries(name);
    } else if (!shouldCollapse && isCollapsed) {
      ctx.showSeries(name);
    }
  }
}
function restoreSelection(ctx, selectedDataPoints) {
  if (!Array.isArray(selectedDataPoints)) return;
  ctx.w.interact.selectedDataPoints = cloneSelection(selectedDataPoints);
}
function applyViewState(ctx, view, { animate = true, mergeOptions } = {}) {
  var _a, _b;
  if (!ctx || !view) return;
  if (typeof view.v === "number" && view.v > VIEWSTATE_VERSION) {
    console.warn(
      `[apexcharts] ViewState v${view.v} is newer than this build understands (v${VIEWSTATE_VERSION}); applying best-effort.`
    );
  }
  ctx.clearAnnotations();
  const options = mergeOptions ? Utils.clone(mergeOptions) : {};
  const xw = view.window && view.window.xaxis;
  options.xaxis = Object.assign(
    {},
    options.xaxis,
    xw ? { min: (_a = xw.min) != null ? _a : void 0, max: (_b = xw.max) != null ? _b : void 0 } : { min: void 0, max: void 0 }
  );
  const yw = view.window && view.window.yaxis;
  if (Array.isArray(yw)) {
    options.yaxis = yw.map(
      (y2) => {
        var _a2, _b2;
        return y2 ? { min: (_a2 = y2.min) != null ? _a2 : void 0, max: (_b2 = y2.max) != null ? _b2 : void 0 } : {};
      }
    );
  }
  if (view.theme) {
    const theme = {};
    if (view.theme.mode != null) theme.mode = view.theme.mode;
    if (view.theme.palette != null) theme.palette = view.theme.palette;
    if (Object.keys(theme).length) {
      options.theme = Object.assign({}, options.theme, theme);
    }
  }
  if (view.annotations && view.annotations.static) {
    options.annotations = Utils.clone(view.annotations.static);
  }
  ctx.updateOptions(
    options,
    false,
    animate,
    false,
    false
  );
  restorePaletteChoice(ctx.w, view.theme);
  applyViewInteraction(ctx, view);
}
function restorePaletteChoice(w, theme) {
  if (!w || !theme || theme.palette == null) return;
  w.globals.themePaletteExplicit = typeof theme.paletteExplicit === "boolean" ? theme.paletteExplicit : theme.palette !== (w.config.theme.mode === "dark" ? "palette4" : "palette1");
}
function applyViewInteraction(ctx, view) {
  if (!ctx || !view) return;
  const w = ctx.w;
  w.interact.zoomed = !!view.zoomed;
  applyCollapsedSet(ctx, view.collapsed, view.ancillaryCollapsed);
  if (view.annotations && Array.isArray(view.annotations.dynamic)) {
    view.annotations.dynamic.forEach((a2) => {
      const method = addMethodName(a2.kind);
      if (method && typeof ctx[method] === "function") {
        ctx[method](a2.params, true);
      }
    });
  }
  restoreSelection(ctx, view.selectedDataPoints);
  if (view.locale && view.locale !== w.config.chart.defaultLocale) {
    ctx.setLocale(view.locale);
  }
  if (ctx.measure && typeof ctx.measure.setPins === "function") {
    ctx.measure.setPins(view.measure && view.measure.pins || []);
  }
}
const PERSPECTIVE_VERSION = 1;
const HASH_KEY = "apex";
function toBase64(str) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i2 = 0; i2 < bytes.length; i2++) bin += String.fromCharCode(bytes[i2]);
  return btoa(bin);
}
function fromBase64(b64) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf-8");
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i2 = 0; i2 < bin.length; i2++) bytes[i2] = bin.charCodeAt(i2);
  return new TextDecoder().decode(bytes);
}
function base64urlEncode(str) {
  return toBase64(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlDecode(b64url) {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return fromBase64(b64);
}
function stripFunctions(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e2) {
    return void 0;
  }
}
class Perspectives {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._saved = [];
    this._counter = 0;
    this._used = false;
  }
  /**
   * Capture the current chart view as a Perspective token.
   * @returns {{ v: number, view: object, options?: Record<string, any> }}
   */
  capture() {
    const view = captureViewState(this.w, this.ctx);
    const token = (
      /** @type {any} */
      { v: PERSPECTIVE_VERSION, view }
    );
    const options = this._serializableDelta();
    if (options && Object.keys(options).length) token.options = options;
    return token;
  }
  /**
   * Build the whitelisted, function-free option override recorded in the token.
   * @returns {Record<string, any>}
   * @private
   */
  _serializableDelta() {
    const cfg = this.w.config;
    const whitelist = cfg.chart && cfg.chart.perspectives && cfg.chart.perspectives.serializeOptions || ["theme", "xaxis", "yaxis", "title", "subtitle"];
    const delta = {};
    whitelist.forEach((path) => {
      if (cfg[path] !== void 0) {
        const stripped = stripFunctions(cfg[path]);
        if (stripped !== void 0) delta[path] = stripped;
      }
    });
    return delta;
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
    const t2 = token || this.capture();
    return base64urlEncode(JSON.stringify(t2));
  }
  /**
   * Decode a base64url token string. Never throws: returns null on any error
   * or version mismatch (with a console warning).
   * @param {string} str
   * @returns {any | null}
   */
  decode(str) {
    return Perspectives.decode(str);
  }
  /**
   * Encode the current capture into a `#apex=<token>` URL hash fragment on the
   * current location. Browser-only; returns '' under SSR.
   * @returns {string}
   */
  toURL() {
    if (!Environment.isBrowser()) return "";
    const encoded = this.encode(this.capture());
    const url = new URL(window.location.href);
    url.hash = `${HASH_KEY}=${encoded}`;
    return url.toString();
  }
  /**
   * Restore a perspective. Accepts a token object or an encoded string. When
   * the chart is grouped, applies to every synced chart.
   *
   * The token's option overrides and `opts.mergeOptions` are folded into the
   * view restore's ONE updateOptions call (mergeOptions wins over
   * token.options; the view's own fields win over both). A single render is
   * deliberate: a second immediate updateOptions would kill the first one's
   * animation mid-flight, and a chart.type change applied this way morphs
   * (morph feature) inside the same re-render instead of being re-rendered
   * over. Consumed by Storyboard for per-beat option payloads.
   *
   * @param {any} tokenOrString
   * @param {{ animate?: boolean, mergeOptions?: Record<string, any> }} [opts]
   */
  apply(tokenOrString, opts = {}) {
    const token = typeof tokenOrString === "string" ? Perspectives.decode(tokenOrString) : tokenOrString;
    if (!token || !token.view) return;
    this._used = true;
    enforceLicense(this.w, this.ctx);
    const animate = opts.animate !== void 0 ? opts.animate : true;
    const combined = Utils.extend(
      token.options ? Utils.clone(token.options) : {},
      opts.mergeOptions || {}
    );
    const mergeOptions = Object.keys(combined).length ? combined : void 0;
    const targets = this.w.config.chart.group ? this.ctx.getSyncedCharts() : [this.ctx];
    targets.forEach((chart) => {
      applyViewState(chart, token.view, { animate, mergeOptions });
    });
  }
  /**
   * Save the current view under a name in the in-memory registry.
   * @param {string} name
   * @returns {string} generated id
   */
  save(name) {
    const id = `perspective-${++this._counter}`;
    this._saved.push({ id, name: name || id, token: this.capture() });
    this._used = true;
    enforceLicense(this.w, this.ctx);
    return id;
  }
  /**
   * List saved perspectives.
   * @returns {{ id: string, name: string, token: any }[]}
   */
  list() {
    return this._saved.map((s2) => ({ id: s2.id, name: s2.name, token: s2.token }));
  }
  /**
   * Delete a saved perspective by id.
   * @param {string} id
   */
  delete(id) {
    const i2 = this._saved.findIndex((s2) => s2.id === id);
    if (i2 > -1) this._saved.splice(i2, 1);
  }
  /** Drop the saved-views registry (called on full destroy). */
  teardown() {
    this._saved = [];
    this._counter = 0;
  }
  // ── static, pure helpers (available once the feature is imported) ─────────
  /**
   * @param {string} str base64url token
   * @returns {any | null}
   */
  static decode(str) {
    if (typeof str !== "string" || !str) return null;
    try {
      const token = JSON.parse(base64urlDecode(str));
      if (!token || typeof token !== "object") return null;
      if (token.v !== PERSPECTIVE_VERSION) {
        console.warn(
          `apexcharts: unsupported perspective version ${token.v} (expected ${PERSPECTIVE_VERSION}).`
        );
        return null;
      }
      return token;
    } catch (e2) {
      console.warn("apexcharts: failed to decode perspective token.", e2);
      return null;
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
      const target = href || (Environment.isBrowser() ? window.location.href : "");
      if (!target) return null;
      const url = new URL(target);
      const hash = url.hash.replace(/^#/, "");
      if (!hash) return null;
      const pair = hash.split("&").map((p2) => p2.split("=")).find((p2) => p2[0] === HASH_KEY);
      if (!pair || pair[1] == null) return null;
      return Perspectives.decode(decodeURIComponent(pair[1]));
    } catch (e2) {
      return null;
    }
  }
}
_core__default.registerFeatures({
  perspectives: Perspectives,
  perspectivesStatics: (
    /** @type {any} */
    {
      /** @param {string} str */
      decode: (str) => {
        markPerspectivesTokenDecoded();
        return Perspectives.decode(str);
      },
      /** @param {string} [href] */
      fromURL: (href) => {
        markPerspectivesTokenDecoded();
        return Perspectives.fromURL(href);
      }
    }
  )
});
_core__default.registerFeatures({ storyboard: Storyboard });
export {
  default2 as default
};
