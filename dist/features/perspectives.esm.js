var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
/*!
 * ApexCharts v6.6.1
 * (c) 2018-2026 ApexCharts
 */
import * as ApexCharts from "apexcharts/core";
import ApexCharts__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Utils = ApexCharts.__apex_Utils;
const Environment = ApexCharts.__apex_Environment_Environment;
const VIEWSTATE_VERSION = 1;
function axisWindow(min, max) {
  const hasMin = min !== void 0 && min !== null;
  const hasMax = max !== void 0 && max !== null;
  if (!hasMin && !hasMax) return null;
  return { min: hasMin ? min : null, max: hasMax ? max : null };
}
function cloneSelection(sel) {
  if (!Array.isArray(sel)) return [];
  return sel.map((a) => Array.isArray(a) ? a.slice() : a);
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
  const m = ctx && ctx.measure;
  if (!m || typeof m.getPins !== "function") return null;
  const pins = m.getPins();
  return Array.isArray(pins) && pins.length ? { pins } : null;
}
function captureViewState(w, ctx) {
  var _a, _b;
  const cfgX = w.config.xaxis || {};
  const cfgYArr = Array.isArray(w.config.yaxis) ? w.config.yaxis : w.config.yaxis ? [w.config.yaxis] : [];
  const yWindows = cfgYArr.map(
    (y) => axisWindow(y && y.min, y && y.max)
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
    theme: theme ? { mode: (_a = theme.mode) != null ? _a : null, palette: (_b = theme.palette) != null ? _b : null } : null,
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
      (y) => {
        var _a2, _b2;
        return y ? { min: (_a2 = y.min) != null ? _a2 : void 0, max: (_b2 = y.max) != null ? _b2 : void 0 } : {};
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
  applyViewInteraction(ctx, view);
}
function applyViewInteraction(ctx, view) {
  if (!ctx || !view) return;
  const w = ctx.w;
  w.interact.zoomed = !!view.zoomed;
  applyCollapsedSet(ctx, view.collapsed, view.ancillaryCollapsed);
  if (view.annotations && Array.isArray(view.annotations.dynamic)) {
    view.annotations.dynamic.forEach((a) => {
      const method = addMethodName(a.kind);
      if (method && typeof ctx[method] === "function") {
        ctx[method](a.params, true);
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
const PUBLIC_KEYS_SPKI_BASE64 = [
  "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQIaK9UMD6n0oR/FIy8QdL0uSzKMQlf1BB+tOrji4/WuHsyRNxeDhVykoSsNURozMi1xhmqWvBH1L//xIfugTPA=="
];
const LEGACY_KEYS_ACCEPTED_UNTIL = /* @__PURE__ */ new Date("2027-07-31T00:00:00Z");
const KEY_PREFIX = "APEX-";
const signatureVerdicts = /* @__PURE__ */ new Map();
const verifying = /* @__PURE__ */ new Set();
const listeners = /* @__PURE__ */ new Set();
let warnedUnverifiable = false;
function base64Decode(encoded) {
  if (typeof atob === "function") return atob(encoded);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(encoded, "base64").toString("binary");
  }
  throw new Error("no base64 decoder available");
}
function base64ToBytes(base64) {
  const normalised = base64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised.padEnd(Math.ceil(normalised.length / 4) * 4, "=");
  const binary = base64Decode(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function canonicalPayload(data) {
  const domains = data.domains && data.domains.length > 0 ? data.domains.join(",") : "";
  return `v1|${data.issueDate}|${data.expiryDate}|${data.plan}|${domains}`;
}
function currentHostname() {
  return typeof window !== "undefined" && window.location ? window.location.hostname : "";
}
function signatureOf(encodedData) {
  try {
    const raw = JSON.parse(base64Decode(encodedData));
    return typeof raw.sig === "string" && raw.sig ? raw.sig : null;
  } catch (e) {
    return null;
  }
}
function notify(result) {
  listeners.forEach((listener) => {
    try {
      listener(result);
    } catch (e) {
    }
  });
}
function verifySignature(key, data, signature) {
  return __async(this, null, function* () {
    if (verifying.has(key) || signatureVerdicts.has(key)) return;
    verifying.add(key);
    const subtle = globalThis.crypto ? globalThis.crypto.subtle : void 0;
    const accepted = LicenseManager.publicKeysSpki;
    if (!subtle || accepted.length === 0) {
      verifying.delete(key);
      if (!warnedUnverifiable) {
        warnedUnverifiable = true;
        console.warn(
          subtle ? "[Apex] No license signing key is configured in this build, so license signatures cannot be verified." : "[Apex] Web Crypto is unavailable (a secure context is required), so the license signature cannot be verified."
        );
      }
      return;
    }
    const signed = new TextEncoder().encode(canonicalPayload(data));
    let verified = false;
    for (const spki of accepted) {
      try {
        const publicKey = yield subtle.importKey(
          "spki",
          base64ToBytes(spki),
          { name: "ECDSA", namedCurve: "P-256" },
          false,
          ["verify"]
        );
        verified = yield subtle.verify(
          { hash: "SHA-256", name: "ECDSA" },
          publicKey,
          base64ToBytes(signature),
          signed
        );
      } catch (e) {
        verified = false;
      }
      if (verified) break;
    }
    verifying.delete(key);
    signatureVerdicts.set(key, verified);
    if (!verified) {
      console.error(
        "[Apex] Invalid license key. The license signature does not verify."
      );
    }
    notify(LicenseManager.validateKey(key));
  });
}
class LicenseManager {
  /**
   * Decode license data from an encoded string (base64 + JSON).
   * @param {string} encodedData
   * @returns {LicenseData | null}
   */
  static decodeLicenseData(encodedData) {
    try {
      const data = JSON.parse(base64Decode(encodedData));
      if (!data.issueDate || !data.expiryDate || !data.plan) {
        return null;
      }
      return {
        domains: Array.isArray(data.domains) ? data.domains : void 0,
        expiryDate: data.expiryDate,
        issueDate: data.issueDate,
        plan: data.plan,
        valid: true
      };
    } catch (e) {
      return null;
    }
  }
  /**
   * The key set via setLicense (or null). Lets the enforcer resolve the
   * chart.license -> setLicense -> Apex.license precedence.
   * @returns {null | string}
   */
  static getKey() {
    return this.licenseKey;
  }
  /**
   * Validation result for the singleton key.
   * @returns {LicenseValidationResult}
   */
  static getLicenseStatus() {
    if (!this.licenseKey) {
      return { expired: false, valid: false };
    }
    this.validationResult = this.validateKey(this.licenseKey);
    return this.validationResult;
  }
  /**
   * Whether a specific key is valid (pure; no singleton mutation).
   * @param {string | undefined | null} key
   * @returns {boolean}
   */
  static isKeyValid(key) {
    if (!key) return false;
    return this.validateKey(key).valid;
  }
  /** @returns {boolean} whether the singleton key is valid */
  static isLicenseValid() {
    if (!this.licenseKey) return false;
    return this.getLicenseStatus().valid;
  }
  /**
   * Subscribe to signature verdicts arriving. Returns an unsubscribe function.
   *
   * Without this a forged key would go unnoticed by any chart that asked once and
   * painted. `LicenseEnforcer` uses it to re-evaluate every live chart.
   *
   * @param {(result: LicenseValidationResult) => void} listener
   * @returns {() => void}
   */
  static onChange(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
  /**
   * Set the global (singleton) license key. console.errors when invalid, to
   * match the rest of the family.
   * @param {string} key
   */
  static setLicense(key) {
    this.licenseKey = key;
    this.validationResult = this.validateKey(key);
    if (!this.validationResult.valid) {
      console.error(`[Apex] ${this.validationResult.message}`);
    }
  }
  /**
   * Validate an arbitrary key WITHOUT mutating the singleton. Used to resolve
   * per-chart (`chart.license`) and global (`window.Apex.license`) keys, which
   * bypass setLicense. This is a superset of the family (which keeps
   * validateLicense private); the format and rules are identical.
   *
   * Synchronous by contract, because it runs during render. Signature checking is
   * started here and settles later; see `onChange`.
   *
   * @param {string} key
   * @returns {LicenseValidationResult}
   */
  static validateKey(key) {
    try {
      if (typeof key !== "string" || !key.startsWith(KEY_PREFIX)) {
        return {
          expired: false,
          message: 'Invalid license key format. License key must start with "APEX-".',
          signatureVerified: false,
          valid: false
        };
      }
      const encodedData = key.slice(KEY_PREFIX.length);
      if (!encodedData) {
        return {
          expired: false,
          message: "Invalid license key format. Expected format: APEX-{encoded-data}.",
          signatureVerified: false,
          valid: false
        };
      }
      const licenseData = this.decodeLicenseData(encodedData);
      if (!licenseData) {
        return {
          expired: false,
          message: "Invalid license key. Unable to decode license data.",
          signatureVerified: false,
          valid: false
        };
      }
      const signature = signatureOf(encodedData);
      if (!signature && /* @__PURE__ */ new Date() >= LEGACY_KEYS_ACCEPTED_UNTIL) {
        return {
          data: licenseData,
          expired: false,
          message: "This license key is in the old unsigned format, which is no longer accepted. Please request a replacement key.",
          signatureVerified: false,
          valid: false
        };
      }
      const now = /* @__PURE__ */ new Date();
      const expiryDate = new Date(licenseData.expiryDate);
      if (expiryDate < now) {
        return {
          data: licenseData,
          expired: true,
          message: `License expired on ${licenseData.expiryDate}. Please renew your license.`,
          signatureVerified: false,
          valid: false
        };
      }
      if (licenseData.domains && licenseData.domains.length > 0) {
        const hostname = currentHostname();
        const allowed = licenseData.domains.some(
          (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
        );
        if (!allowed) {
          return {
            data: licenseData,
            expired: false,
            message: `License is not valid for this domain (${hostname}). Allowed domains: ${licenseData.domains.join(", ")}.`,
            signatureVerified: false,
            valid: false
          };
        }
      }
      if (signature) {
        const verdict = signatureVerdicts.get(key);
        if (verdict === false) {
          return {
            data: licenseData,
            expired: false,
            message: "Invalid license key. The license signature does not verify.",
            signatureVerified: true,
            valid: false
          };
        }
        if (verdict === void 0) {
          void verifySignature(key, licenseData, signature);
        }
        return {
          data: licenseData,
          expired: false,
          signatureVerified: verdict === true,
          valid: true
        };
      }
      return {
        data: licenseData,
        expired: false,
        signatureVerified: false,
        valid: true
      };
    } catch (e) {
      return {
        expired: false,
        message: "Invalid license key format or corrupted data.",
        signatureVerified: false,
        valid: false
      };
    }
  }
  /** Test-only: forget signature verdicts and the one-time warnings. */
  static _resetSignatureState() {
    signatureVerdicts.clear();
    verifying.clear();
    warnedUnverifiable = false;
  }
}
/** @type {null | string} */
__publicField(LicenseManager, "licenseKey", null);
/**
 * Accepted signing keys. Replaced by tests with an ephemeral keypair, since
 * they cannot sign for the production key. Not public API.
 * @type {string[]}
 */
__publicField(LicenseManager, "publicKeysSpki", PUBLIC_KEYS_SPKI_BASE64);
/** @type {LicenseValidationResult | null} */
__publicField(LicenseManager, "validationResult", null);
const WATERMARK_ATTR = "data-apexcharts-watermark";
const WATERMARK_TEXT = "APEXCHARTS";
const CRITICAL_STYLES = {
  position: "absolute",
  top: "0",
  right: "0",
  bottom: "0",
  left: "0",
  pointerEvents: "none",
  userSelect: "none",
  webkitUserSelect: "none",
  msUserSelect: "none",
  zIndex: "10000",
  display: "block",
  visibility: "visible",
  opacity: "1"
};
function createWatermarkPattern() {
  const svg = `
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
      >${WATERMARK_TEXT}</text>
    </svg>
  `;
  return `url("data:image/svg+xml,${encodeURIComponent(svg.trim())}")`;
}
class Watermark {
  /**
   * Apply the overlay's critical styles + background to a node. Split out so a
   * MutationObserver can restore styles after tampering.
   * @param {HTMLElement} el
   */
  static applyStyles(el) {
    Object.assign(el.style, CRITICAL_STYLES, {
      backgroundImage: createWatermarkPattern(),
      backgroundRepeat: "repeat"
    });
  }
  /**
   * Add the watermark to a container, reusing the existing node if present (so
   * a style-tamper observer bound to it stays valid across re-renders). No-op
   * when there is no document (SSR) or no container.
   * @param {HTMLElement | null | undefined} container
   * @returns {HTMLElement | null} the watermark node
   */
  static add(container) {
    if (!container || typeof document === "undefined") return null;
    let watermark = this.node(container);
    if (!watermark) {
      watermark = document.createElement("div");
      watermark.setAttribute(WATERMARK_ATTR, "");
      container.appendChild(watermark);
    }
    this.applyStyles(watermark);
    if (typeof getComputedStyle === "function" && getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
    return watermark;
  }
  /**
   * @param {HTMLElement | null | undefined} container
   * @returns {HTMLElement | null} the watermark node, if present
   */
  static node(container) {
    if (!container) return null;
    return (
      /** @type {HTMLElement | null} */
      container.querySelector(`[${WATERMARK_ATTR}]`)
    );
  }
  /**
   * @param {HTMLElement | null | undefined} container
   * @returns {boolean}
   */
  static exists(container) {
    return !!this.node(container);
  }
  /**
   * Remove the watermark from a container.
   * @param {HTMLElement | null | undefined} container
   */
  static remove(container) {
    const existing = this.node(container);
    if (existing) existing.remove();
  }
}
__publicField(Watermark, "ATTR", WATERMARK_ATTR);
const PRICING_URL = "https://apexcharts.com/pricing";
let _perspectivesTokenDecoded = false;
const enforced = /* @__PURE__ */ new Set();
function markPerspectivesTokenDecoded() {
  _perspectivesTokenDecoded = true;
  reevaluateLicenseAcrossCharts();
}
function premiumFeaturesInUse(w, ctx) {
  const chart = w && w.config && w.config.chart || {};
  const used = [];
  if (chart.type === "unit") used.push("unit");
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
  if (ctx.perspectives && (ctx.perspectives._used || _perspectivesTokenDecoded)) {
    used.push("perspectives");
  }
  if (ctx.history && chart.history && chart.history.enabled === true) {
    used.push("history");
  }
  return used;
}
function resolveKey(w) {
  const perChart = w && w.config && w.config.chart && w.config.chart.license;
  if (perChart) return perChart;
  const singleton = LicenseManager.getKey();
  if (singleton) return singleton;
  const apex = Environment.getApex();
  if (apex && apex.license) return apex.license;
  return null;
}
function reinstateWatermark(ctx, elWrap) {
  const node = Watermark.add(elWrap);
  if (!node || typeof MutationObserver === "undefined") return;
  if (ctx._wmNodeObserver && ctx._wmObservedNode === node) return;
  if (ctx._wmNodeObserver) ctx._wmNodeObserver.disconnect();
  const nodeObs = new MutationObserver(() => {
    const n = Watermark.node(elWrap);
    if (!n) return;
    nodeObs.disconnect();
    Watermark.applyStyles(n);
    nodeObs.takeRecords();
    nodeObs.observe(n, { attributes: true, attributeFilter: ["style"] });
  });
  nodeObs.observe(node, { attributes: true, attributeFilter: ["style"] });
  ctx._wmNodeObserver = nodeObs;
  ctx._wmObservedNode = node;
}
function addWatermark(ctx, elWrap) {
  reinstateWatermark(ctx, elWrap);
  if (typeof MutationObserver === "undefined" || ctx._wmWrapObserver) return;
  const wrapObs = new MutationObserver(() => {
    if (!Watermark.node(elWrap)) reinstateWatermark(ctx, elWrap);
  });
  wrapObs.observe(elWrap, { childList: true });
  ctx._wmWrapObserver = wrapObs;
}
function teardownWatermark(ctx, elWrap) {
  if (ctx._wmWrapObserver) {
    ctx._wmWrapObserver.disconnect();
    ctx._wmWrapObserver = null;
  }
  if (ctx._wmNodeObserver) {
    ctx._wmNodeObserver.disconnect();
    ctx._wmNodeObserver = null;
  }
  ctx._wmObservedNode = null;
  const wrap = elWrap || ctx.w && ctx.w.dom && ctx.w.dom.elWrap;
  if (wrap) Watermark.remove(wrap);
}
function notifyTrial(ctx, key, features) {
  if (ctx._premiumLicenseNotified) return;
  ctx._premiumLicenseNotified = true;
  if (!key) {
    console.warn(
      `[ApexCharts] Premium feature${features.length > 1 ? "s" : ""} in use (${features.join(", ")}) without a license. Running in trial mode with a watermark. Get a license: ${PRICING_URL}`
    );
    return;
  }
  if (key !== LicenseManager.getKey()) {
    console.error(`[Apex] ${LicenseManager.validateKey(key).message}`);
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
    if (LicenseManager.isKeyValid(key)) {
      teardownWatermark(ctx, elWrap);
      return;
    }
    addWatermark(ctx, elWrap);
    notifyTrial(ctx, key, features);
  } catch (e) {
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
LicenseManager.onChange(reevaluateLicenseAcrossCharts);
const PERSPECTIVE_VERSION = 1;
const HASH_KEY = "apex";
function toBase64(str) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function fromBase64(b64) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf-8");
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
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
  } catch (e) {
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
    const t = token || this.capture();
    return base64urlEncode(JSON.stringify(t));
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
    return this._saved.map((s) => ({ id: s.id, name: s.name, token: s.token }));
  }
  /**
   * Delete a saved perspective by id.
   * @param {string} id
   */
  delete(id) {
    const i = this._saved.findIndex((s) => s.id === id);
    if (i > -1) this._saved.splice(i, 1);
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
    } catch (e) {
      console.warn("apexcharts: failed to decode perspective token.", e);
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
      const pair = hash.split("&").map((p) => p.split("=")).find((p) => p[0] === HASH_KEY);
      if (!pair || pair[1] == null) return null;
      return Perspectives.decode(decodeURIComponent(pair[1]));
    } catch (e) {
      return null;
    }
  }
}
ApexCharts__default.registerFeatures({ perspectives: Perspectives });
ApexCharts__default.perspectives = {
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
};
export {
  default2 as default
};
