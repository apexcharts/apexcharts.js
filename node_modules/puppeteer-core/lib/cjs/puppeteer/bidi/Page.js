"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        function next() {
            while (env.stack.length) {
                var rec = env.stack.pop();
                try {
                    var result = rec.dispose && rec.dispose.call(rec.value);
                    if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                }
                catch (e) {
                    fail(e);
                }
            }
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidiPage = void 0;
const rxjs_js_1 = require("../../third_party/rxjs/rxjs.js");
const Page_js_1 = require("../api/Page.js");
const Coverage_js_1 = require("../cdp/Coverage.js");
const EmulationManager_js_1 = require("../cdp/EmulationManager.js");
const Tracing_js_1 = require("../cdp/Tracing.js");
const Errors_js_1 = require("../common/Errors.js");
const EventEmitter_js_1 = require("../common/EventEmitter.js");
const util_js_1 = require("../common/util.js");
const assert_js_1 = require("../util/assert.js");
const decorators_js_1 = require("../util/decorators.js");
const ErrorLike_js_1 = require("../util/ErrorLike.js");
const Frame_js_1 = require("./Frame.js");
const Input_js_1 = require("./Input.js");
const util_js_2 = require("./util.js");
/**
 * Implements Page using WebDriver BiDi.
 *
 * @internal
 */
let BidiPage = (() => {
    let _classSuper = Page_js_1.Page;
    let _trustedEmitter_decorators;
    let _trustedEmitter_initializers = [];
    let _trustedEmitter_extraInitializers = [];
    return class BidiPage extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _trustedEmitter_decorators = [(0, decorators_js_1.bubble)()];
            __esDecorate(this, null, _trustedEmitter_decorators, { kind: "accessor", name: "trustedEmitter", static: false, private: false, access: { has: obj => "trustedEmitter" in obj, get: obj => obj.trustedEmitter, set: (obj, value) => { obj.trustedEmitter = value; } }, metadata: _metadata }, _trustedEmitter_initializers, _trustedEmitter_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static from(browserContext, browsingContext) {
            const page = new BidiPage(browserContext, browsingContext);
            page.#initialize();
            return page;
        }
        #trustedEmitter_accessor_storage = __runInitializers(this, _trustedEmitter_initializers, new EventEmitter_js_1.EventEmitter());
        get trustedEmitter() { return this.#trustedEmitter_accessor_storage; }
        set trustedEmitter(value) { this.#trustedEmitter_accessor_storage = value; }
        #browserContext = __runInitializers(this, _trustedEmitter_extraInitializers);
        #frame;
        #viewport = null;
        #workers = new Set();
        keyboard;
        mouse;
        touchscreen;
        tracing;
        coverage;
        #cdpEmulationManager;
        #emulatedNetworkConditions;
        _client() {
            return this.#frame.client;
        }
        constructor(browserContext, browsingContext) {
            super();
            this.#browserContext = browserContext;
            this.#frame = Frame_js_1.BidiFrame.from(this, browsingContext);
            this.#cdpEmulationManager = new EmulationManager_js_1.EmulationManager(this.#frame.client);
            this.tracing = new Tracing_js_1.Tracing(this.#frame.client);
            this.coverage = new Coverage_js_1.Coverage(this.#frame.client);
            this.keyboard = new Input_js_1.BidiKeyboard(this);
            this.mouse = new Input_js_1.BidiMouse(this);
            this.touchscreen = new Input_js_1.BidiTouchscreen(this);
        }
        #initialize() {
            this.#frame.browsingContext.on('closed', () => {
                this.trustedEmitter.emit("close" /* PageEvent.Close */, undefined);
                this.trustedEmitter.removeAllListeners();
            });
            this.trustedEmitter.on("workercreated" /* PageEvent.WorkerCreated */, worker => {
                this.#workers.add(worker);
            });
            this.trustedEmitter.on("workerdestroyed" /* PageEvent.WorkerDestroyed */, worker => {
                this.#workers.delete(worker);
            });
        }
        /**
         * @internal
         */
        _userAgentHeaders = {};
        #userAgentInterception;
        #userAgentPreloadScript;
        async setUserAgent(userAgent, userAgentMetadata) {
            if (!this.#browserContext.browser().cdpSupported && userAgentMetadata) {
                throw new Errors_js_1.UnsupportedOperation('Current Browser does not support `userAgentMetadata`');
            }
            else if (this.#browserContext.browser().cdpSupported &&
                userAgentMetadata) {
                return await this._client().send('Network.setUserAgentOverride', {
                    userAgent: userAgent,
                    userAgentMetadata: userAgentMetadata,
                });
            }
            const enable = userAgent !== '';
            userAgent = userAgent ?? (await this.#browserContext.browser().userAgent());
            this._userAgentHeaders = enable
                ? {
                    'User-Agent': userAgent,
                }
                : {};
            this.#userAgentInterception = await this.#toggleInterception(["beforeRequestSent" /* Bidi.Network.InterceptPhase.BeforeRequestSent */], this.#userAgentInterception, enable);
            const changeUserAgent = (userAgent) => {
                Object.defineProperty(navigator, 'userAgent', {
                    value: userAgent,
                });
            };
            const frames = [this.#frame];
            for (const frame of frames) {
                frames.push(...frame.childFrames());
            }
            if (this.#userAgentPreloadScript) {
                await this.removeScriptToEvaluateOnNewDocument(this.#userAgentPreloadScript);
            }
            const [evaluateToken] = await Promise.all([
                enable
                    ? this.evaluateOnNewDocument(changeUserAgent, userAgent)
                    : undefined,
                // When we disable the UserAgent we want to
                // evaluate the original value in all Browsing Contexts
                frames.map(frame => {
                    return frame.evaluate(changeUserAgent, userAgent);
                }),
            ]);
            this.#userAgentPreloadScript = evaluateToken?.identifier;
        }
        async setBypassCSP(enabled) {
            // TODO: handle CDP-specific cases such as mprach.
            await this._client().send('Page.setBypassCSP', { enabled });
        }
        async queryObjects(prototypeHandle) {
            (0, assert_js_1.assert)(!prototypeHandle.disposed, 'Prototype JSHandle is disposed!');
            (0, assert_js_1.assert)(prototypeHandle.id, 'Prototype JSHandle must not be referencing primitive value');
            const response = await this.#frame.client.send('Runtime.queryObjects', {
                prototypeObjectId: prototypeHandle.id,
            });
            return this.#frame.mainRealm().createHandle({
                type: 'array',
                handle: response.objects.objectId,
            });
        }
        browser() {
            return this.browserContext().browser();
        }
        browserContext() {
            return this.#browserContext;
        }
        mainFrame() {
            return this.#frame;
        }
        async focusedFrame() {
            const env_1 = { stack: [], error: void 0, hasError: false };
            try {
                const handle = __addDisposableResource(env_1, (await this.mainFrame()
                    .isolatedRealm()
                    .evaluateHandle(() => {
                    let win = window;
                    while (win.document.activeElement instanceof win.HTMLIFrameElement ||
                        win.document.activeElement instanceof win.HTMLFrameElement) {
                        if (win.document.activeElement.contentWindow === null) {
                            break;
                        }
                        win = win.document.activeElement.contentWindow;
                    }
                    return win;
                })), false);
                const value = handle.remoteValue();
                (0, assert_js_1.assert)(value.type === 'window');
                const frame = this.frames().find(frame => {
                    return frame._id === value.value.context;
                });
                (0, assert_js_1.assert)(frame);
                return frame;
            }
            catch (e_1) {
                env_1.error = e_1;
                env_1.hasError = true;
            }
            finally {
                __disposeResources(env_1);
            }
        }
        frames() {
            const frames = [this.#frame];
            for (const frame of frames) {
                frames.push(...frame.childFrames());
            }
            return frames;
        }
        isClosed() {
            return this.#frame.detached;
        }
        async close(options) {
            try {
                await this.#frame.browsingContext.close(options?.runBeforeUnload);
            }
            catch {
                return;
            }
        }
        async reload(options = {}) {
            const [response] = await Promise.all([
                this.#frame.waitForNavigation(options),
                this.#frame.browsingContext.reload(),
            ]).catch((0, util_js_2.rewriteNavigationError)(this.url(), options.timeout ?? this._timeoutSettings.navigationTimeout()));
            return response;
        }
        setDefaultNavigationTimeout(timeout) {
            this._timeoutSettings.setDefaultNavigationTimeout(timeout);
        }
        setDefaultTimeout(timeout) {
            this._timeoutSettings.setDefaultTimeout(timeout);
        }
        getDefaultTimeout() {
            return this._timeoutSettings.timeout();
        }
        isJavaScriptEnabled() {
            return this.#cdpEmulationManager.javascriptEnabled;
        }
        async setGeolocation(options) {
            return await this.#cdpEmulationManager.setGeolocation(options);
        }
        async setJavaScriptEnabled(enabled) {
            return await this.#cdpEmulationManager.setJavaScriptEnabled(enabled);
        }
        async emulateMediaType(type) {
            return await this.#cdpEmulationManager.emulateMediaType(type);
        }
        async emulateCPUThrottling(factor) {
            return await this.#cdpEmulationManager.emulateCPUThrottling(factor);
        }
        async emulateMediaFeatures(features) {
            return await this.#cdpEmulationManager.emulateMediaFeatures(features);
        }
        async emulateTimezone(timezoneId) {
            return await this.#cdpEmulationManager.emulateTimezone(timezoneId);
        }
        async emulateIdleState(overrides) {
            return await this.#cdpEmulationManager.emulateIdleState(overrides);
        }
        async emulateVisionDeficiency(type) {
            return await this.#cdpEmulationManager.emulateVisionDeficiency(type);
        }
        async setViewport(viewport) {
            if (!this.browser().cdpSupported) {
                await this.#frame.browsingContext.setViewport({
                    viewport: viewport?.width && viewport?.height
                        ? {
                            width: viewport.width,
                            height: viewport.height,
                        }
                        : null,
                    devicePixelRatio: viewport?.deviceScaleFactor
                        ? viewport.deviceScaleFactor
                        : null,
                });
                this.#viewport = viewport;
                return;
            }
            const needsReload = await this.#cdpEmulationManager.emulateViewport(viewport);
            this.#viewport = viewport;
            if (needsReload) {
                await this.reload();
            }
        }
        viewport() {
            return this.#viewport;
        }
        async pdf(options = {}) {
            const { timeout: ms = this._timeoutSettings.timeout(), path = undefined } = options;
            const { printBackground: background, margin, landscape, width, height, pageRanges: ranges, scale, preferCSSPageSize, } = (0, util_js_1.parsePDFOptions)(options, 'cm');
            const pageRanges = ranges ? ranges.split(', ') : [];
            await (0, rxjs_js_1.firstValueFrom)((0, rxjs_js_1.from)(this.mainFrame()
                .isolatedRealm()
                .evaluate(() => {
                return document.fonts.ready;
            })).pipe((0, rxjs_js_1.raceWith)((0, util_js_1.timeout)(ms))));
            const data = await (0, rxjs_js_1.firstValueFrom)((0, rxjs_js_1.from)(this.#frame.browsingContext.print({
                background,
                margin,
                orientation: landscape ? 'landscape' : 'portrait',
                page: {
                    width,
                    height,
                },
                pageRanges,
                scale,
                shrinkToFit: !preferCSSPageSize,
            })).pipe((0, rxjs_js_1.raceWith)((0, util_js_1.timeout)(ms))));
            const buffer = Buffer.from(data, 'base64');
            await this._maybeWriteBufferToFile(path, buffer);
            return buffer;
        }
        async createPDFStream(options) {
            const buffer = await this.pdf(options);
            return new ReadableStream({
                start(controller) {
                    controller.enqueue(buffer);
                    controller.close();
                },
            });
        }
        async _screenshot(options) {
            const { clip, type, captureBeyondViewport, quality } = options;
            if (options.omitBackground !== undefined && options.omitBackground) {
                throw new Errors_js_1.UnsupportedOperation(`BiDi does not support 'omitBackground'.`);
            }
            if (options.optimizeForSpeed !== undefined && options.optimizeForSpeed) {
                throw new Errors_js_1.UnsupportedOperation(`BiDi does not support 'optimizeForSpeed'.`);
            }
            if (options.fromSurface !== undefined && !options.fromSurface) {
                throw new Errors_js_1.UnsupportedOperation(`BiDi does not support 'fromSurface'.`);
            }
            if (clip !== undefined && clip.scale !== undefined && clip.scale !== 1) {
                throw new Errors_js_1.UnsupportedOperation(`BiDi does not support 'scale' in 'clip'.`);
            }
            let box;
            if (clip) {
                if (captureBeyondViewport) {
                    box = clip;
                }
                else {
                    // The clip is always with respect to the document coordinates, so we
                    // need to convert this to viewport coordinates when we aren't capturing
                    // beyond the viewport.
                    const [pageLeft, pageTop] = await this.evaluate(() => {
                        if (!window.visualViewport) {
                            throw new Error('window.visualViewport is not supported.');
                        }
                        return [
                            window.visualViewport.pageLeft,
                            window.visualViewport.pageTop,
                        ];
                    });
                    box = {
                        ...clip,
                        x: clip.x - pageLeft,
                        y: clip.y - pageTop,
                    };
                }
            }
            const data = await this.#frame.browsingContext.captureScreenshot({
                origin: captureBeyondViewport ? 'document' : 'viewport',
                format: {
                    type: `image/${type}`,
                    ...(quality !== undefined ? { quality: quality / 100 } : {}),
                },
                ...(box ? { clip: { type: 'box', ...box } } : {}),
            });
            return data;
        }
        async createCDPSession() {
            return await this.#frame.createCDPSession();
        }
        async bringToFront() {
            await this.#frame.browsingContext.activate();
        }
        async evaluateOnNewDocument(pageFunction, ...args) {
            const expression = evaluationExpression(pageFunction, ...args);
            const script = await this.#frame.browsingContext.addPreloadScript(expression);
            return { identifier: script };
        }
        async removeScriptToEvaluateOnNewDocument(id) {
            await this.#frame.browsingContext.removePreloadScript(id);
        }
        async exposeFunction(name, pptrFunction) {
            return await this.mainFrame().exposeFunction(name, 'default' in pptrFunction ? pptrFunction.default : pptrFunction);
        }
        isDragInterceptionEnabled() {
            return false;
        }
        async setCacheEnabled(enabled) {
            // TODO: handle CDP-specific cases such as mprach.
            await this._client().send('Network.setCacheDisabled', {
                cacheDisabled: !enabled,
            });
        }
        async cookies(...urls) {
            const normalizedUrls = (urls.length ? urls : [this.url()]).map(url => {
                return new URL(url);
            });
            const cookies = await this.#frame.browsingContext.getCookies();
            return cookies
                .map(cookie => {
                return bidiToPuppeteerCookie(cookie);
            })
                .filter(cookie => {
                return normalizedUrls.some(url => {
                    return testUrlMatchCookie(cookie, url);
                });
            });
        }
        isServiceWorkerBypassed() {
            throw new Errors_js_1.UnsupportedOperation();
        }
        target() {
            throw new Errors_js_1.UnsupportedOperation();
        }
        waitForFileChooser() {
            throw new Errors_js_1.UnsupportedOperation();
        }
        workers() {
            return [...this.#workers];
        }
        #userInterception;
        async setRequestInterception(enable) {
            this.#userInterception = await this.#toggleInterception(["beforeRequestSent" /* Bidi.Network.InterceptPhase.BeforeRequestSent */], this.#userInterception, enable);
        }
        /**
         * @internal
         */
        _extraHTTPHeaders = {};
        #extraHeadersInterception;
        async setExtraHTTPHeaders(headers) {
            const extraHTTPHeaders = {};
            for (const [key, value] of Object.entries(headers)) {
                (0, assert_js_1.assert)((0, util_js_1.isString)(value), `Expected value of header "${key}" to be String, but "${typeof value}" is found.`);
                extraHTTPHeaders[key.toLowerCase()] = value;
            }
            this._extraHTTPHeaders = extraHTTPHeaders;
            this.#extraHeadersInterception = await this.#toggleInterception(["beforeRequestSent" /* Bidi.Network.InterceptPhase.BeforeRequestSent */], this.#extraHeadersInterception, Boolean(Object.keys(this._extraHTTPHeaders).length));
        }
        /**
         * @internal
         */
        _credentials = null;
        #authInterception;
        async authenticate(credentials) {
            this.#authInterception = await this.#toggleInterception(["authRequired" /* Bidi.Network.InterceptPhase.AuthRequired */], this.#authInterception, Boolean(credentials));
            this._credentials = credentials;
        }
        async #toggleInterception(phases, interception, expected) {
            if (expected && !interception) {
                return await this.#frame.browsingContext.addIntercept({
                    phases,
                });
            }
            else if (!expected && interception) {
                await this.#frame.browsingContext.userContext.browser.removeIntercept(interception);
                return;
            }
            return interception;
        }
        setDragInterception() {
            throw new Errors_js_1.UnsupportedOperation();
        }
        setBypassServiceWorker() {
            throw new Errors_js_1.UnsupportedOperation();
        }
        async setOfflineMode(enabled) {
            if (!this.#browserContext.browser().cdpSupported) {
                throw new Errors_js_1.UnsupportedOperation();
            }
            if (!this.#emulatedNetworkConditions) {
                this.#emulatedNetworkConditions = {
                    offline: false,
                    upload: -1,
                    download: -1,
                    latency: 0,
                };
            }
            this.#emulatedNetworkConditions.offline = enabled;
            return await this.#applyNetworkConditions();
        }
        async emulateNetworkConditions(networkConditions) {
            if (!this.#browserContext.browser().cdpSupported) {
                throw new Errors_js_1.UnsupportedOperation();
            }
            if (!this.#emulatedNetworkConditions) {
                this.#emulatedNetworkConditions = {
                    offline: false,
                    upload: -1,
                    download: -1,
                    latency: 0,
                };
            }
            this.#emulatedNetworkConditions.upload = networkConditions
                ? networkConditions.upload
                : -1;
            this.#emulatedNetworkConditions.download = networkConditions
                ? networkConditions.download
                : -1;
            this.#emulatedNetworkConditions.latency = networkConditions
                ? networkConditions.latency
                : 0;
            return await this.#applyNetworkConditions();
        }
        async #applyNetworkConditions() {
            if (!this.#emulatedNetworkConditions) {
                return;
            }
            await this._client().send('Network.emulateNetworkConditions', {
                offline: this.#emulatedNetworkConditions.offline,
                latency: this.#emulatedNetworkConditions.latency,
                uploadThroughput: this.#emulatedNetworkConditions.upload,
                downloadThroughput: this.#emulatedNetworkConditions.download,
            });
        }
        async setCookie(...cookies) {
            const pageURL = this.url();
            const pageUrlStartsWithHTTP = pageURL.startsWith('http');
            for (const cookie of cookies) {
                let cookieUrl = cookie.url || '';
                if (!cookieUrl && pageUrlStartsWithHTTP) {
                    cookieUrl = pageURL;
                }
                (0, assert_js_1.assert)(cookieUrl !== 'about:blank', `Blank page can not have cookie "${cookie.name}"`);
                (0, assert_js_1.assert)(!String.prototype.startsWith.call(cookieUrl || '', 'data:'), `Data URL page can not have cookie "${cookie.name}"`);
                const normalizedUrl = URL.canParse(cookieUrl)
                    ? new URL(cookieUrl)
                    : undefined;
                const domain = cookie.domain ?? normalizedUrl?.hostname;
                (0, assert_js_1.assert)(domain !== undefined, `At least one of the url and domain needs to be specified`);
                const bidiCookie = {
                    domain: domain,
                    name: cookie.name,
                    value: {
                        type: 'string',
                        value: cookie.value,
                    },
                    ...(cookie.path !== undefined ? { path: cookie.path } : {}),
                    ...(cookie.httpOnly !== undefined ? { httpOnly: cookie.httpOnly } : {}),
                    ...(cookie.secure !== undefined ? { secure: cookie.secure } : {}),
                    ...(cookie.sameSite !== undefined
                        ? { sameSite: convertCookiesSameSiteCdpToBiDi(cookie.sameSite) }
                        : {}),
                    ...(cookie.expires !== undefined ? { expiry: cookie.expires } : {}),
                    // Chrome-specific properties.
                    ...cdpSpecificCookiePropertiesFromPuppeteerToBidi(cookie, 'sameParty', 'sourceScheme', 'priority', 'url'),
                };
                if (cookie.partitionKey !== undefined) {
                    await this.browserContext().userContext.setCookie(bidiCookie, cookie.partitionKey);
                }
                else {
                    await this.#frame.browsingContext.setCookie(bidiCookie);
                }
            }
        }
        async deleteCookie(...cookies) {
            await Promise.all(cookies.map(async (deleteCookieRequest) => {
                const cookieUrl = deleteCookieRequest.url ?? this.url();
                const normalizedUrl = URL.canParse(cookieUrl)
                    ? new URL(cookieUrl)
                    : undefined;
                const domain = deleteCookieRequest.domain ?? normalizedUrl?.hostname;
                (0, assert_js_1.assert)(domain !== undefined, `At least one of the url and domain needs to be specified`);
                const filter = {
                    domain: domain,
                    name: deleteCookieRequest.name,
                    ...(deleteCookieRequest.path !== undefined
                        ? { path: deleteCookieRequest.path }
                        : {}),
                };
                await this.#frame.browsingContext.deleteCookie(filter);
            }));
        }
        async removeExposedFunction(name) {
            await this.#frame.removeExposedFunction(name);
        }
        metrics() {
            throw new Errors_js_1.UnsupportedOperation();
        }
        async goBack(options = {}) {
            return await this.#go(-1, options);
        }
        async goForward(options = {}) {
            return await this.#go(1, options);
        }
        async #go(delta, options) {
            try {
                const [response] = await Promise.all([
                    this.waitForNavigation(options),
                    this.#frame.browsingContext.traverseHistory(delta),
                ]);
                return response;
            }
            catch (error) {
                // TODO: waitForNavigation should be cancelled if an error happens.
                if ((0, ErrorLike_js_1.isErrorLike)(error)) {
                    if (error.message.includes('no such history entry')) {
                        return null;
                    }
                }
                throw error;
            }
        }
        waitForDevicePrompt() {
            throw new Errors_js_1.UnsupportedOperation();
        }
    };
})();
exports.BidiPage = BidiPage;
function evaluationExpression(fun, ...args) {
    return `() => {${(0, util_js_1.evaluationString)(fun, ...args)}}`;
}
/**
 * Check domains match.
 * According to cookies spec, this check should match subdomains as well, but CDP
 * implementation does not do that, so this method matches only the exact domains, not
 * what is written in the spec:
 * https://datatracker.ietf.org/doc/html/rfc6265#section-5.1.3
 */
function testUrlMatchCookieHostname(cookie, normalizedUrl) {
    const cookieDomain = cookie.domain.toLowerCase();
    const urlHostname = normalizedUrl.hostname.toLowerCase();
    return cookieDomain === urlHostname;
}
/**
 * Check paths match.
 * Spec: https://datatracker.ietf.org/doc/html/rfc6265#section-5.1.4
 */
function testUrlMatchCookiePath(cookie, normalizedUrl) {
    const uriPath = normalizedUrl.pathname;
    const cookiePath = cookie.path;
    if (uriPath === cookiePath) {
        // The cookie-path and the request-path are identical.
        return true;
    }
    if (uriPath.startsWith(cookiePath)) {
        // The cookie-path is a prefix of the request-path.
        if (cookiePath.endsWith('/')) {
            // The last character of the cookie-path is %x2F ("/").
            return true;
        }
        if (uriPath[cookiePath.length] === '/') {
            // The first character of the request-path that is not included in the cookie-path
            // is a %x2F ("/") character.
            return true;
        }
    }
    return false;
}
/**
 * Checks the cookie matches the URL according to the spec:
 */
function testUrlMatchCookie(cookie, url) {
    const normalizedUrl = new URL(url);
    (0, assert_js_1.assert)(cookie !== undefined);
    if (!testUrlMatchCookieHostname(cookie, normalizedUrl)) {
        return false;
    }
    return testUrlMatchCookiePath(cookie, normalizedUrl);
}
function bidiToPuppeteerCookie(bidiCookie) {
    return {
        name: bidiCookie.name,
        // Presents binary value as base64 string.
        value: bidiCookie.value.value,
        domain: bidiCookie.domain,
        path: bidiCookie.path,
        size: bidiCookie.size,
        httpOnly: bidiCookie.httpOnly,
        secure: bidiCookie.secure,
        sameSite: convertCookiesSameSiteBiDiToCdp(bidiCookie.sameSite),
        expires: bidiCookie.expiry ?? -1,
        session: bidiCookie.expiry === undefined || bidiCookie.expiry <= 0,
        // Extending with CDP-specific properties with `goog:` prefix.
        ...cdpSpecificCookiePropertiesFromBidiToPuppeteer(bidiCookie, 'sameParty', 'sourceScheme', 'partitionKey', 'partitionKeyOpaque', 'priority'),
    };
}
const CDP_SPECIFIC_PREFIX = 'goog:';
/**
 * Gets CDP-specific properties from the BiDi cookie and returns them as a new object.
 */
function cdpSpecificCookiePropertiesFromBidiToPuppeteer(bidiCookie, ...propertyNames) {
    const result = {};
    for (const property of propertyNames) {
        if (bidiCookie[CDP_SPECIFIC_PREFIX + property] !== undefined) {
            result[property] = bidiCookie[CDP_SPECIFIC_PREFIX + property];
        }
    }
    return result;
}
/**
 * Gets CDP-specific properties from the cookie, adds CDP-specific prefixes and returns
 * them as a new object which can be used in BiDi.
 */
function cdpSpecificCookiePropertiesFromPuppeteerToBidi(cookieParam, ...propertyNames) {
    const result = {};
    for (const property of propertyNames) {
        if (cookieParam[property] !== undefined) {
            result[CDP_SPECIFIC_PREFIX + property] = cookieParam[property];
        }
    }
    return result;
}
function convertCookiesSameSiteBiDiToCdp(sameSite) {
    return sameSite === 'strict' ? 'Strict' : sameSite === 'lax' ? 'Lax' : 'None';
}
function convertCookiesSameSiteCdpToBiDi(sameSite) {
    return sameSite === 'Strict'
        ? "strict" /* Bidi.Network.SameSite.Strict */
        : sameSite === 'Lax'
            ? "lax" /* Bidi.Network.SameSite.Lax */
            : "none" /* Bidi.Network.SameSite.None */;
}
//# sourceMappingURL=Page.js.map