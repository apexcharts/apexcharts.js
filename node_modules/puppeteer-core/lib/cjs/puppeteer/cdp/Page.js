"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
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
exports.CdpPage = void 0;
const rxjs_js_1 = require("../../third_party/rxjs/rxjs.js");
const CDPSession_js_1 = require("../api/CDPSession.js");
const Page_js_1 = require("../api/Page.js");
const ConsoleMessage_js_1 = require("../common/ConsoleMessage.js");
const Errors_js_1 = require("../common/Errors.js");
const FileChooser_js_1 = require("../common/FileChooser.js");
const NetworkManagerEvents_js_1 = require("../common/NetworkManagerEvents.js");
const util_js_1 = require("../common/util.js");
const assert_js_1 = require("../util/assert.js");
const Deferred_js_1 = require("../util/Deferred.js");
const disposable_js_1 = require("../util/disposable.js");
const ErrorLike_js_1 = require("../util/ErrorLike.js");
const Binding_js_1 = require("./Binding.js");
const CDPSession_js_2 = require("./CDPSession.js");
const Connection_js_1 = require("./Connection.js");
const Coverage_js_1 = require("./Coverage.js");
const Dialog_js_1 = require("./Dialog.js");
const EmulationManager_js_1 = require("./EmulationManager.js");
const FirefoxTargetManager_js_1 = require("./FirefoxTargetManager.js");
const FrameManager_js_1 = require("./FrameManager.js");
const FrameManagerEvents_js_1 = require("./FrameManagerEvents.js");
const Input_js_1 = require("./Input.js");
const IsolatedWorlds_js_1 = require("./IsolatedWorlds.js");
const JSHandle_js_1 = require("./JSHandle.js");
const Tracing_js_1 = require("./Tracing.js");
const utils_js_1 = require("./utils.js");
const WebWorker_js_1 = require("./WebWorker.js");
function convertConsoleMessageLevel(method) {
    switch (method) {
        case 'warning':
            return 'warn';
        default:
            return method;
    }
}
/**
 * @internal
 */
class CdpPage extends Page_js_1.Page {
    static async _create(client, target, defaultViewport) {
        const page = new CdpPage(client, target);
        await page.#initialize();
        if (defaultViewport) {
            try {
                await page.setViewport(defaultViewport);
            }
            catch (err) {
                if ((0, ErrorLike_js_1.isErrorLike)(err) && (0, Connection_js_1.isTargetClosedError)(err)) {
                    (0, util_js_1.debugError)(err);
                }
                else {
                    throw err;
                }
            }
        }
        return page;
    }
    #closed = false;
    #targetManager;
    #primaryTargetClient;
    #primaryTarget;
    #tabTargetClient;
    #tabTarget;
    #keyboard;
    #mouse;
    #touchscreen;
    #frameManager;
    #emulationManager;
    #tracing;
    #bindings = new Map();
    #exposedFunctions = new Map();
    #coverage;
    #viewport;
    #workers = new Map();
    #fileChooserDeferreds = new Set();
    #sessionCloseDeferred = Deferred_js_1.Deferred.create();
    #serviceWorkerBypassed = false;
    #userDragInterceptionEnabled = false;
    #frameManagerHandlers = [
        [
            FrameManagerEvents_js_1.FrameManagerEvent.FrameAttached,
            (frame) => {
                this.emit("frameattached" /* PageEvent.FrameAttached */, frame);
            },
        ],
        [
            FrameManagerEvents_js_1.FrameManagerEvent.FrameDetached,
            (frame) => {
                this.emit("framedetached" /* PageEvent.FrameDetached */, frame);
            },
        ],
        [
            FrameManagerEvents_js_1.FrameManagerEvent.FrameNavigated,
            (frame) => {
                this.emit("framenavigated" /* PageEvent.FrameNavigated */, frame);
            },
        ],
    ];
    #networkManagerHandlers = [
        [
            NetworkManagerEvents_js_1.NetworkManagerEvent.Request,
            (request) => {
                this.emit("request" /* PageEvent.Request */, request);
            },
        ],
        [
            NetworkManagerEvents_js_1.NetworkManagerEvent.RequestServedFromCache,
            (request) => {
                this.emit("requestservedfromcache" /* PageEvent.RequestServedFromCache */, request);
            },
        ],
        [
            NetworkManagerEvents_js_1.NetworkManagerEvent.Response,
            (response) => {
                this.emit("response" /* PageEvent.Response */, response);
            },
        ],
        [
            NetworkManagerEvents_js_1.NetworkManagerEvent.RequestFailed,
            (request) => {
                this.emit("requestfailed" /* PageEvent.RequestFailed */, request);
            },
        ],
        [
            NetworkManagerEvents_js_1.NetworkManagerEvent.RequestFinished,
            (request) => {
                this.emit("requestfinished" /* PageEvent.RequestFinished */, request);
            },
        ],
    ];
    #sessionHandlers = [
        [
            CDPSession_js_1.CDPSessionEvent.Disconnected,
            () => {
                this.#sessionCloseDeferred.reject(new Errors_js_1.TargetCloseError('Target closed'));
            },
        ],
        [
            'Page.domContentEventFired',
            () => {
                return this.emit("domcontentloaded" /* PageEvent.DOMContentLoaded */, undefined);
            },
        ],
        [
            'Page.loadEventFired',
            () => {
                return this.emit("load" /* PageEvent.Load */, undefined);
            },
        ],
        ['Page.javascriptDialogOpening', this.#onDialog.bind(this)],
        ['Runtime.exceptionThrown', this.#handleException.bind(this)],
        ['Inspector.targetCrashed', this.#onTargetCrashed.bind(this)],
        ['Performance.metrics', this.#emitMetrics.bind(this)],
        ['Log.entryAdded', this.#onLogEntryAdded.bind(this)],
        ['Page.fileChooserOpened', this.#onFileChooser.bind(this)],
    ];
    constructor(client, target) {
        super();
        this.#primaryTargetClient = client;
        this.#tabTargetClient = client.parentSession();
        (0, assert_js_1.assert)(this.#tabTargetClient, 'Tab target session is not defined.');
        this.#tabTarget = this.#tabTargetClient._target();
        (0, assert_js_1.assert)(this.#tabTarget, 'Tab target is not defined.');
        this.#primaryTarget = target;
        this.#targetManager = target._targetManager();
        this.#keyboard = new Input_js_1.CdpKeyboard(client);
        this.#mouse = new Input_js_1.CdpMouse(client, this.#keyboard);
        this.#touchscreen = new Input_js_1.CdpTouchscreen(client, this.#keyboard);
        this.#frameManager = new FrameManager_js_1.FrameManager(client, this, this._timeoutSettings);
        this.#emulationManager = new EmulationManager_js_1.EmulationManager(client);
        this.#tracing = new Tracing_js_1.Tracing(client);
        this.#coverage = new Coverage_js_1.Coverage(client);
        this.#viewport = null;
        for (const [eventName, handler] of this.#frameManagerHandlers) {
            this.#frameManager.on(eventName, handler);
        }
        this.#frameManager.on(FrameManagerEvents_js_1.FrameManagerEvent.ConsoleApiCalled, ([world, event]) => {
            this.#onConsoleAPI(world, event);
        });
        this.#frameManager.on(FrameManagerEvents_js_1.FrameManagerEvent.BindingCalled, ([world, event]) => {
            void this.#onBindingCalled(world, event);
        });
        for (const [eventName, handler] of this.#networkManagerHandlers) {
            // TODO: Remove any.
            this.#frameManager.networkManager.on(eventName, handler);
        }
        this.#tabTargetClient.on(CDPSession_js_1.CDPSessionEvent.Swapped, this.#onActivation.bind(this));
        this.#tabTargetClient.on(CDPSession_js_1.CDPSessionEvent.Ready, this.#onSecondaryTarget.bind(this));
        this.#targetManager.on("targetGone" /* TargetManagerEvent.TargetGone */, this.#onDetachedFromTarget);
        this.#tabTarget._isClosedDeferred
            .valueOrThrow()
            .then(() => {
            this.#targetManager.off("targetGone" /* TargetManagerEvent.TargetGone */, this.#onDetachedFromTarget);
            this.emit("close" /* PageEvent.Close */, undefined);
            this.#closed = true;
        })
            .catch(util_js_1.debugError);
        this.#setupPrimaryTargetListeners();
    }
    async #onActivation(newSession) {
        this.#primaryTargetClient = newSession;
        (0, assert_js_1.assert)(this.#primaryTargetClient instanceof CDPSession_js_2.CdpCDPSession, 'CDPSession is not instance of CDPSessionImpl');
        this.#primaryTarget = this.#primaryTargetClient._target();
        (0, assert_js_1.assert)(this.#primaryTarget, 'Missing target on swap');
        this.#keyboard.updateClient(newSession);
        this.#mouse.updateClient(newSession);
        this.#touchscreen.updateClient(newSession);
        this.#emulationManager.updateClient(newSession);
        this.#tracing.updateClient(newSession);
        this.#coverage.updateClient(newSession);
        await this.#frameManager.swapFrameTree(newSession);
        this.#setupPrimaryTargetListeners();
    }
    async #onSecondaryTarget(session) {
        (0, assert_js_1.assert)(session instanceof CDPSession_js_2.CdpCDPSession);
        if (session._target()._subtype() !== 'prerender') {
            return;
        }
        this.#frameManager.registerSpeculativeSession(session).catch(util_js_1.debugError);
        this.#emulationManager
            .registerSpeculativeSession(session)
            .catch(util_js_1.debugError);
    }
    /**
     * Sets up listeners for the primary target. The primary target can change
     * during a navigation to a prerended page.
     */
    #setupPrimaryTargetListeners() {
        this.#primaryTargetClient.on(CDPSession_js_1.CDPSessionEvent.Ready, this.#onAttachedToTarget);
        for (const [eventName, handler] of this.#sessionHandlers) {
            // TODO: Remove any.
            this.#primaryTargetClient.on(eventName, handler);
        }
    }
    #onDetachedFromTarget = (target) => {
        const sessionId = target._session()?.id();
        const worker = this.#workers.get(sessionId);
        if (!worker) {
            return;
        }
        this.#workers.delete(sessionId);
        this.emit("workerdestroyed" /* PageEvent.WorkerDestroyed */, worker);
    };
    #onAttachedToTarget = (session) => {
        (0, assert_js_1.assert)(session instanceof CDPSession_js_2.CdpCDPSession);
        this.#frameManager.onAttachedToTarget(session._target());
        if (session._target()._getTargetInfo().type === 'worker') {
            const worker = new WebWorker_js_1.CdpWebWorker(session, session._target().url(), session._target()._targetId, session._target().type(), this.#addConsoleMessage.bind(this), this.#handleException.bind(this));
            this.#workers.set(session.id(), worker);
            this.emit("workercreated" /* PageEvent.WorkerCreated */, worker);
        }
        session.on(CDPSession_js_1.CDPSessionEvent.Ready, this.#onAttachedToTarget);
    };
    async #initialize() {
        try {
            await Promise.all([
                this.#frameManager.initialize(this.#primaryTargetClient),
                this.#primaryTargetClient.send('Performance.enable'),
                this.#primaryTargetClient.send('Log.enable'),
            ]);
        }
        catch (err) {
            if ((0, ErrorLike_js_1.isErrorLike)(err) && (0, Connection_js_1.isTargetClosedError)(err)) {
                (0, util_js_1.debugError)(err);
            }
            else {
                throw err;
            }
        }
    }
    async #onFileChooser(event) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            if (!this.#fileChooserDeferreds.size) {
                return;
            }
            const frame = this.#frameManager.frame(event.frameId);
            (0, assert_js_1.assert)(frame, 'This should never happen.');
            // This is guaranteed to be an HTMLInputElement handle by the event.
            const handle = __addDisposableResource(env_1, (await frame.worlds[IsolatedWorlds_js_1.MAIN_WORLD].adoptBackendNode(event.backendNodeId)), false);
            const fileChooser = new FileChooser_js_1.FileChooser(handle.move(), event);
            for (const promise of this.#fileChooserDeferreds) {
                promise.resolve(fileChooser);
            }
            this.#fileChooserDeferreds.clear();
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    }
    _client() {
        return this.#primaryTargetClient;
    }
    isServiceWorkerBypassed() {
        return this.#serviceWorkerBypassed;
    }
    isDragInterceptionEnabled() {
        return this.#userDragInterceptionEnabled;
    }
    isJavaScriptEnabled() {
        return this.#emulationManager.javascriptEnabled;
    }
    async waitForFileChooser(options = {}) {
        const needsEnable = this.#fileChooserDeferreds.size === 0;
        const { timeout = this._timeoutSettings.timeout() } = options;
        const deferred = Deferred_js_1.Deferred.create({
            message: `Waiting for \`FileChooser\` failed: ${timeout}ms exceeded`,
            timeout,
        });
        this.#fileChooserDeferreds.add(deferred);
        let enablePromise;
        if (needsEnable) {
            enablePromise = this.#primaryTargetClient.send('Page.setInterceptFileChooserDialog', {
                enabled: true,
            });
        }
        try {
            const [result] = await Promise.all([
                deferred.valueOrThrow(),
                enablePromise,
            ]);
            return result;
        }
        catch (error) {
            this.#fileChooserDeferreds.delete(deferred);
            throw error;
        }
    }
    async setGeolocation(options) {
        return await this.#emulationManager.setGeolocation(options);
    }
    target() {
        return this.#primaryTarget;
    }
    browser() {
        return this.#primaryTarget.browser();
    }
    browserContext() {
        return this.#primaryTarget.browserContext();
    }
    #onTargetCrashed() {
        this.emit("error" /* PageEvent.Error */, new Error('Page crashed!'));
    }
    #onLogEntryAdded(event) {
        const { level, text, args, source, url, lineNumber } = event.entry;
        if (args) {
            args.map(arg => {
                void (0, JSHandle_js_1.releaseObject)(this.#primaryTargetClient, arg);
            });
        }
        if (source !== 'worker') {
            this.emit("console" /* PageEvent.Console */, new ConsoleMessage_js_1.ConsoleMessage(convertConsoleMessageLevel(level), text, [], [{ url, lineNumber }]));
        }
    }
    mainFrame() {
        return this.#frameManager.mainFrame();
    }
    get keyboard() {
        return this.#keyboard;
    }
    get touchscreen() {
        return this.#touchscreen;
    }
    get coverage() {
        return this.#coverage;
    }
    get tracing() {
        return this.#tracing;
    }
    frames() {
        return this.#frameManager.frames();
    }
    workers() {
        return Array.from(this.#workers.values());
    }
    async setRequestInterception(value) {
        return await this.#frameManager.networkManager.setRequestInterception(value);
    }
    async setBypassServiceWorker(bypass) {
        this.#serviceWorkerBypassed = bypass;
        return await this.#primaryTargetClient.send('Network.setBypassServiceWorker', { bypass });
    }
    async setDragInterception(enabled) {
        this.#userDragInterceptionEnabled = enabled;
        return await this.#primaryTargetClient.send('Input.setInterceptDrags', {
            enabled,
        });
    }
    async setOfflineMode(enabled) {
        return await this.#frameManager.networkManager.setOfflineMode(enabled);
    }
    async emulateNetworkConditions(networkConditions) {
        return await this.#frameManager.networkManager.emulateNetworkConditions(networkConditions);
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
    async queryObjects(prototypeHandle) {
        (0, assert_js_1.assert)(!prototypeHandle.disposed, 'Prototype JSHandle is disposed!');
        (0, assert_js_1.assert)(prototypeHandle.id, 'Prototype JSHandle must not be referencing primitive value');
        const response = await this.mainFrame().client.send('Runtime.queryObjects', {
            prototypeObjectId: prototypeHandle.id,
        });
        return this.mainFrame()
            .mainRealm()
            .createCdpHandle(response.objects);
    }
    async cookies(...urls) {
        const originalCookies = (await this.#primaryTargetClient.send('Network.getCookies', {
            urls: urls.length ? urls : [this.url()],
        })).cookies;
        const unsupportedCookieAttributes = ['sourcePort'];
        const filterUnsupportedAttributes = (cookie) => {
            for (const attr of unsupportedCookieAttributes) {
                delete cookie[attr];
            }
            return cookie;
        };
        return originalCookies.map(filterUnsupportedAttributes);
    }
    async deleteCookie(...cookies) {
        const pageURL = this.url();
        for (const cookie of cookies) {
            const item = Object.assign({}, cookie);
            if (!cookie.url && pageURL.startsWith('http')) {
                item.url = pageURL;
            }
            await this.#primaryTargetClient.send('Network.deleteCookies', item);
        }
    }
    async setCookie(...cookies) {
        const pageURL = this.url();
        const startsWithHTTP = pageURL.startsWith('http');
        const items = cookies.map(cookie => {
            const item = Object.assign({}, cookie);
            if (!item.url && startsWithHTTP) {
                item.url = pageURL;
            }
            (0, assert_js_1.assert)(item.url !== 'about:blank', `Blank page can not have cookie "${item.name}"`);
            (0, assert_js_1.assert)(!String.prototype.startsWith.call(item.url || '', 'data:'), `Data URL page can not have cookie "${item.name}"`);
            return item;
        });
        await this.deleteCookie(...items);
        if (items.length) {
            await this.#primaryTargetClient.send('Network.setCookies', {
                cookies: items,
            });
        }
    }
    async exposeFunction(name, pptrFunction) {
        if (this.#bindings.has(name)) {
            throw new Error(`Failed to add page binding with name ${name}: window['${name}'] already exists!`);
        }
        let binding;
        switch (typeof pptrFunction) {
            case 'function':
                binding = new Binding_js_1.Binding(name, pptrFunction);
                break;
            default:
                binding = new Binding_js_1.Binding(name, pptrFunction.default);
                break;
        }
        this.#bindings.set(name, binding);
        const expression = (0, utils_js_1.pageBindingInitString)('exposedFun', name);
        await this.#primaryTargetClient.send('Runtime.addBinding', { name });
        // TODO: investigate this as it appears to only apply to the main frame and
        // local subframes instead of the entire frame tree (including future
        // frame).
        const { identifier } = await this.#primaryTargetClient.send('Page.addScriptToEvaluateOnNewDocument', {
            source: expression,
        });
        this.#exposedFunctions.set(name, identifier);
        await Promise.all(this.frames().map(frame => {
            // If a frame has not started loading, it might never start. Rely on
            // addScriptToEvaluateOnNewDocument in that case.
            if (frame !== this.mainFrame() && !frame._hasStartedLoading) {
                return;
            }
            return frame.evaluate(expression).catch(util_js_1.debugError);
        }));
    }
    async removeExposedFunction(name) {
        const exposedFun = this.#exposedFunctions.get(name);
        if (!exposedFun) {
            throw new Error(`Failed to remove page binding with name ${name}: window['${name}'] does not exists!`);
        }
        await this.#primaryTargetClient.send('Runtime.removeBinding', { name });
        await this.removeScriptToEvaluateOnNewDocument(exposedFun);
        await Promise.all(this.frames().map(frame => {
            // If a frame has not started loading, it might never start. Rely on
            // addScriptToEvaluateOnNewDocument in that case.
            if (frame !== this.mainFrame() && !frame._hasStartedLoading) {
                return;
            }
            return frame
                .evaluate(name => {
                // Removes the dangling Puppeteer binding wrapper.
                // @ts-expect-error: In a different context.
                globalThis[name] = undefined;
            }, name)
                .catch(util_js_1.debugError);
        }));
        this.#exposedFunctions.delete(name);
        this.#bindings.delete(name);
    }
    async authenticate(credentials) {
        return await this.#frameManager.networkManager.authenticate(credentials);
    }
    async setExtraHTTPHeaders(headers) {
        return await this.#frameManager.networkManager.setExtraHTTPHeaders(headers);
    }
    async setUserAgent(userAgent, userAgentMetadata) {
        return await this.#frameManager.networkManager.setUserAgent(userAgent, userAgentMetadata);
    }
    async metrics() {
        const response = await this.#primaryTargetClient.send('Performance.getMetrics');
        return this.#buildMetricsObject(response.metrics);
    }
    #emitMetrics(event) {
        this.emit("metrics" /* PageEvent.Metrics */, {
            title: event.title,
            metrics: this.#buildMetricsObject(event.metrics),
        });
    }
    #buildMetricsObject(metrics) {
        const result = {};
        for (const metric of metrics || []) {
            if (supportedMetrics.has(metric.name)) {
                result[metric.name] = metric.value;
            }
        }
        return result;
    }
    #handleException(exception) {
        this.emit("pageerror" /* PageEvent.PageError */, (0, utils_js_1.createClientError)(exception.exceptionDetails));
    }
    #onConsoleAPI(world, event) {
        const values = event.args.map(arg => {
            return world.createCdpHandle(arg);
        });
        this.#addConsoleMessage(convertConsoleMessageLevel(event.type), values, event.stackTrace);
    }
    async #onBindingCalled(world, event) {
        let payload;
        try {
            payload = JSON.parse(event.payload);
        }
        catch {
            // The binding was either called by something in the page or it was
            // called before our wrapper was initialized.
            return;
        }
        const { type, name, seq, args, isTrivial } = payload;
        if (type !== 'exposedFun') {
            return;
        }
        const context = world.context;
        if (!context) {
            return;
        }
        const binding = this.#bindings.get(name);
        await binding?.run(context, seq, args, isTrivial);
    }
    #addConsoleMessage(eventType, args, stackTrace) {
        if (!this.listenerCount("console" /* PageEvent.Console */)) {
            args.forEach(arg => {
                return arg.dispose();
            });
            return;
        }
        const textTokens = [];
        // eslint-disable-next-line max-len -- The comment is long.
        // eslint-disable-next-line rulesdir/use-using -- These are not owned by this function.
        for (const arg of args) {
            const remoteObject = arg.remoteObject();
            if (remoteObject.objectId) {
                textTokens.push(arg.toString());
            }
            else {
                textTokens.push((0, utils_js_1.valueFromRemoteObject)(remoteObject));
            }
        }
        const stackTraceLocations = [];
        if (stackTrace) {
            for (const callFrame of stackTrace.callFrames) {
                stackTraceLocations.push({
                    url: callFrame.url,
                    lineNumber: callFrame.lineNumber,
                    columnNumber: callFrame.columnNumber,
                });
            }
        }
        const message = new ConsoleMessage_js_1.ConsoleMessage(convertConsoleMessageLevel(eventType), textTokens.join(' '), args, stackTraceLocations);
        this.emit("console" /* PageEvent.Console */, message);
    }
    #onDialog(event) {
        const type = (0, util_js_1.validateDialogType)(event.type);
        const dialog = new Dialog_js_1.CdpDialog(this.#primaryTargetClient, type, event.message, event.defaultPrompt);
        this.emit("dialog" /* PageEvent.Dialog */, dialog);
    }
    async reload(options) {
        const [result] = await Promise.all([
            this.waitForNavigation({
                ...options,
                ignoreSameDocumentNavigation: true,
            }),
            this.#primaryTargetClient.send('Page.reload'),
        ]);
        return result;
    }
    async createCDPSession() {
        return await this.target().createCDPSession();
    }
    async goBack(options = {}) {
        return await this.#go(-1, options);
    }
    async goForward(options = {}) {
        return await this.#go(+1, options);
    }
    async #go(delta, options) {
        const history = await this.#primaryTargetClient.send('Page.getNavigationHistory');
        const entry = history.entries[history.currentIndex + delta];
        if (!entry) {
            return null;
        }
        const result = await Promise.all([
            this.waitForNavigation(options),
            this.#primaryTargetClient.send('Page.navigateToHistoryEntry', {
                entryId: entry.id,
            }),
        ]);
        return result[0];
    }
    async bringToFront() {
        await this.#primaryTargetClient.send('Page.bringToFront');
    }
    async setJavaScriptEnabled(enabled) {
        return await this.#emulationManager.setJavaScriptEnabled(enabled);
    }
    async setBypassCSP(enabled) {
        await this.#primaryTargetClient.send('Page.setBypassCSP', { enabled });
    }
    async emulateMediaType(type) {
        return await this.#emulationManager.emulateMediaType(type);
    }
    async emulateCPUThrottling(factor) {
        return await this.#emulationManager.emulateCPUThrottling(factor);
    }
    async emulateMediaFeatures(features) {
        return await this.#emulationManager.emulateMediaFeatures(features);
    }
    async emulateTimezone(timezoneId) {
        return await this.#emulationManager.emulateTimezone(timezoneId);
    }
    async emulateIdleState(overrides) {
        return await this.#emulationManager.emulateIdleState(overrides);
    }
    async emulateVisionDeficiency(type) {
        return await this.#emulationManager.emulateVisionDeficiency(type);
    }
    async setViewport(viewport) {
        const needsReload = await this.#emulationManager.emulateViewport(viewport);
        this.#viewport = viewport;
        if (needsReload) {
            await this.reload();
        }
    }
    viewport() {
        return this.#viewport;
    }
    async evaluateOnNewDocument(pageFunction, ...args) {
        const source = (0, util_js_1.evaluationString)(pageFunction, ...args);
        const { identifier } = await this.#primaryTargetClient.send('Page.addScriptToEvaluateOnNewDocument', {
            source,
        });
        return { identifier };
    }
    async removeScriptToEvaluateOnNewDocument(identifier) {
        await this.#primaryTargetClient.send('Page.removeScriptToEvaluateOnNewDocument', {
            identifier,
        });
    }
    async setCacheEnabled(enabled = true) {
        await this.#frameManager.networkManager.setCacheEnabled(enabled);
    }
    async _screenshot(options) {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const { fromSurface, omitBackground, optimizeForSpeed, quality, clip: userClip, type, captureBeyondViewport, } = options;
            const isFirefox = this.target()._targetManager() instanceof FirefoxTargetManager_js_1.FirefoxTargetManager;
            const stack = __addDisposableResource(env_2, new disposable_js_1.AsyncDisposableStack(), true);
            // Firefox omits background by default; it's not configurable.
            if (!isFirefox && omitBackground && (type === 'png' || type === 'webp')) {
                await this.#emulationManager.setTransparentBackgroundColor();
                stack.defer(async () => {
                    await this.#emulationManager
                        .resetDefaultBackgroundColor()
                        .catch(util_js_1.debugError);
                });
            }
            let clip = userClip;
            if (clip && !captureBeyondViewport) {
                const viewport = await this.mainFrame()
                    .isolatedRealm()
                    .evaluate(() => {
                    const { height, pageLeft: x, pageTop: y, width, } = window.visualViewport;
                    return { x, y, height, width };
                });
                clip = getIntersectionRect(clip, viewport);
            }
            // We need to do these spreads because Firefox doesn't allow unknown options.
            const { data } = await this.#primaryTargetClient.send('Page.captureScreenshot', {
                format: type,
                ...(optimizeForSpeed ? { optimizeForSpeed } : {}),
                ...(quality !== undefined ? { quality: Math.round(quality) } : {}),
                ...(clip ? { clip: { ...clip, scale: clip.scale ?? 1 } } : {}),
                ...(!fromSurface ? { fromSurface } : {}),
                captureBeyondViewport,
            });
            return data;
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            const result_1 = __disposeResources(env_2);
            if (result_1)
                await result_1;
        }
    }
    async createPDFStream(options = {}) {
        const { timeout: ms = this._timeoutSettings.timeout() } = options;
        const { landscape, displayHeaderFooter, headerTemplate, footerTemplate, printBackground, scale, width: paperWidth, height: paperHeight, margin, pageRanges, preferCSSPageSize, omitBackground, tagged: generateTaggedPDF, outline: generateDocumentOutline, } = (0, util_js_1.parsePDFOptions)(options);
        if (omitBackground) {
            await this.#emulationManager.setTransparentBackgroundColor();
        }
        await (0, rxjs_js_1.firstValueFrom)((0, rxjs_js_1.from)(this.mainFrame()
            .isolatedRealm()
            .evaluate(() => {
            return document.fonts.ready;
        })).pipe((0, rxjs_js_1.raceWith)((0, util_js_1.timeout)(ms))));
        const printCommandPromise = this.#primaryTargetClient.send('Page.printToPDF', {
            transferMode: 'ReturnAsStream',
            landscape,
            displayHeaderFooter,
            headerTemplate,
            footerTemplate,
            printBackground,
            scale,
            paperWidth,
            paperHeight,
            marginTop: margin.top,
            marginBottom: margin.bottom,
            marginLeft: margin.left,
            marginRight: margin.right,
            pageRanges,
            preferCSSPageSize,
            generateTaggedPDF,
            generateDocumentOutline,
        });
        const result = await (0, rxjs_js_1.firstValueFrom)((0, rxjs_js_1.from)(printCommandPromise).pipe((0, rxjs_js_1.raceWith)((0, util_js_1.timeout)(ms))));
        if (omitBackground) {
            await this.#emulationManager.resetDefaultBackgroundColor();
        }
        (0, assert_js_1.assert)(result.stream, '`stream` is missing from `Page.printToPDF');
        return await (0, util_js_1.getReadableFromProtocolStream)(this.#primaryTargetClient, result.stream);
    }
    async pdf(options = {}) {
        const { path = undefined } = options;
        const readable = await this.createPDFStream(options);
        const buffer = await (0, util_js_1.getReadableAsBuffer)(readable, path);
        (0, assert_js_1.assert)(buffer, 'Could not create buffer');
        return buffer;
    }
    async close(options = { runBeforeUnload: undefined }) {
        const connection = this.#primaryTargetClient.connection();
        (0, assert_js_1.assert)(connection, 'Protocol error: Connection closed. Most likely the page has been closed.');
        const runBeforeUnload = !!options.runBeforeUnload;
        if (runBeforeUnload) {
            await this.#primaryTargetClient.send('Page.close');
        }
        else {
            await connection.send('Target.closeTarget', {
                targetId: this.#primaryTarget._targetId,
            });
            await this.#tabTarget._isClosedDeferred.valueOrThrow();
        }
    }
    isClosed() {
        return this.#closed;
    }
    get mouse() {
        return this.#mouse;
    }
    /**
     * This method is typically coupled with an action that triggers a device
     * request from an api such as WebBluetooth.
     *
     * :::caution
     *
     * This must be called before the device request is made. It will not return a
     * currently active device prompt.
     *
     * :::
     *
     * @example
     *
     * ```ts
     * const [devicePrompt] = Promise.all([
     *   page.waitForDevicePrompt(),
     *   page.click('#connect-bluetooth'),
     * ]);
     * await devicePrompt.select(
     *   await devicePrompt.waitForDevice(({name}) => name.includes('My Device'))
     * );
     * ```
     */
    async waitForDevicePrompt(options = {}) {
        return await this.mainFrame().waitForDevicePrompt(options);
    }
}
exports.CdpPage = CdpPage;
const supportedMetrics = new Set([
    'Timestamp',
    'Documents',
    'Frames',
    'JSEventListeners',
    'Nodes',
    'LayoutCount',
    'RecalcStyleCount',
    'LayoutDuration',
    'RecalcStyleDuration',
    'ScriptDuration',
    'TaskDuration',
    'JSHeapUsedSize',
    'JSHeapTotalSize',
]);
/** @see https://w3c.github.io/webdriver-bidi/#rectangle-intersection */
function getIntersectionRect(clip, viewport) {
    // Note these will already be normalized.
    const x = Math.max(clip.x, viewport.x);
    const y = Math.max(clip.y, viewport.y);
    return {
        x,
        y,
        width: Math.max(Math.min(clip.x + clip.width, viewport.x + viewport.width) - x, 0),
        height: Math.max(Math.min(clip.y + clip.height, viewport.y + viewport.height) - y, 0),
    };
}
//# sourceMappingURL=Page.js.map