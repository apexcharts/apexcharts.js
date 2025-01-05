"use strict";
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowsingContext = void 0;
const EventEmitter_js_1 = require("../../common/EventEmitter.js");
const decorators_js_1 = require("../../util/decorators.js");
const disposable_js_1 = require("../../util/disposable.js");
const Navigation_js_1 = require("./Navigation.js");
const Realm_js_1 = require("./Realm.js");
const Request_js_1 = require("./Request.js");
const UserPrompt_js_1 = require("./UserPrompt.js");
/**
 * @internal
 */
let BrowsingContext = (() => {
    var _a;
    let _classSuper = EventEmitter_js_1.EventEmitter;
    let _instanceExtraInitializers = [];
    let _dispose_decorators;
    let _activate_decorators;
    let _captureScreenshot_decorators;
    let _close_decorators;
    let _traverseHistory_decorators;
    let _navigate_decorators;
    let _reload_decorators;
    let _print_decorators;
    let _handleUserPrompt_decorators;
    let _setViewport_decorators;
    let _performActions_decorators;
    let _releaseActions_decorators;
    let _createWindowRealm_decorators;
    let _addPreloadScript_decorators;
    let _addIntercept_decorators;
    let _removePreloadScript_decorators;
    let _getCookies_decorators;
    let _setCookie_decorators;
    let _setFiles_decorators;
    let _subscribe_decorators;
    let _addInterception_decorators;
    let _deleteCookie_decorators;
    let _locateNodes_decorators;
    return class BrowsingContext extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _deleteCookie_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                    // SAFETY: Disposal implies this exists.
                    return context.#reason;
                })];
            _locateNodes_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                    // SAFETY: Disposal implies this exists.
                    return context.#reason;
                })];
            __esDecorate(this, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: obj => "dispose" in obj, get: obj => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _activate_decorators, { kind: "method", name: "activate", static: false, private: false, access: { has: obj => "activate" in obj, get: obj => obj.activate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _captureScreenshot_decorators, { kind: "method", name: "captureScreenshot", static: false, private: false, access: { has: obj => "captureScreenshot" in obj, get: obj => obj.captureScreenshot }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _close_decorators, { kind: "method", name: "close", static: false, private: false, access: { has: obj => "close" in obj, get: obj => obj.close }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _traverseHistory_decorators, { kind: "method", name: "traverseHistory", static: false, private: false, access: { has: obj => "traverseHistory" in obj, get: obj => obj.traverseHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _navigate_decorators, { kind: "method", name: "navigate", static: false, private: false, access: { has: obj => "navigate" in obj, get: obj => obj.navigate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reload_decorators, { kind: "method", name: "reload", static: false, private: false, access: { has: obj => "reload" in obj, get: obj => obj.reload }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _print_decorators, { kind: "method", name: "print", static: false, private: false, access: { has: obj => "print" in obj, get: obj => obj.print }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _handleUserPrompt_decorators, { kind: "method", name: "handleUserPrompt", static: false, private: false, access: { has: obj => "handleUserPrompt" in obj, get: obj => obj.handleUserPrompt }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setViewport_decorators, { kind: "method", name: "setViewport", static: false, private: false, access: { has: obj => "setViewport" in obj, get: obj => obj.setViewport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _performActions_decorators, { kind: "method", name: "performActions", static: false, private: false, access: { has: obj => "performActions" in obj, get: obj => obj.performActions }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _releaseActions_decorators, { kind: "method", name: "releaseActions", static: false, private: false, access: { has: obj => "releaseActions" in obj, get: obj => obj.releaseActions }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createWindowRealm_decorators, { kind: "method", name: "createWindowRealm", static: false, private: false, access: { has: obj => "createWindowRealm" in obj, get: obj => obj.createWindowRealm }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addPreloadScript_decorators, { kind: "method", name: "addPreloadScript", static: false, private: false, access: { has: obj => "addPreloadScript" in obj, get: obj => obj.addPreloadScript }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addIntercept_decorators, { kind: "method", name: "addIntercept", static: false, private: false, access: { has: obj => "addIntercept" in obj, get: obj => obj.addIntercept }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removePreloadScript_decorators, { kind: "method", name: "removePreloadScript", static: false, private: false, access: { has: obj => "removePreloadScript" in obj, get: obj => obj.removePreloadScript }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCookies_decorators, { kind: "method", name: "getCookies", static: false, private: false, access: { has: obj => "getCookies" in obj, get: obj => obj.getCookies }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setCookie_decorators, { kind: "method", name: "setCookie", static: false, private: false, access: { has: obj => "setCookie" in obj, get: obj => obj.setCookie }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setFiles_decorators, { kind: "method", name: "setFiles", static: false, private: false, access: { has: obj => "setFiles" in obj, get: obj => obj.setFiles }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _subscribe_decorators, { kind: "method", name: "subscribe", static: false, private: false, access: { has: obj => "subscribe" in obj, get: obj => obj.subscribe }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addInterception_decorators, { kind: "method", name: "addInterception", static: false, private: false, access: { has: obj => "addInterception" in obj, get: obj => obj.addInterception }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteCookie_decorators, { kind: "method", name: "deleteCookie", static: false, private: false, access: { has: obj => "deleteCookie" in obj, get: obj => obj.deleteCookie }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _locateNodes_decorators, { kind: "method", name: "locateNodes", static: false, private: false, access: { has: obj => "locateNodes" in obj, get: obj => obj.locateNodes }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static from(userContext, parent, id, url, originalOpener) {
            const browsingContext = new BrowsingContext(userContext, parent, id, url, originalOpener);
            browsingContext.#initialize();
            return browsingContext;
        }
        #navigation = __runInitializers(this, _instanceExtraInitializers);
        #reason;
        #url;
        #children = new Map();
        #disposables = new disposable_js_1.DisposableStack();
        #realms = new Map();
        #requests = new Map();
        defaultRealm;
        id;
        parent;
        userContext;
        originalOpener;
        constructor(context, parent, id, url, originalOpener) {
            super();
            this.#url = url;
            this.id = id;
            this.parent = parent;
            this.userContext = context;
            this.originalOpener = originalOpener;
            this.defaultRealm = this.#createWindowRealm();
        }
        #initialize() {
            const userContextEmitter = this.#disposables.use(new EventEmitter_js_1.EventEmitter(this.userContext));
            userContextEmitter.once('closed', ({ reason }) => {
                this.dispose(`Browsing context already closed: ${reason}`);
            });
            const sessionEmitter = this.#disposables.use(new EventEmitter_js_1.EventEmitter(this.#session));
            sessionEmitter.on('browsingContext.contextCreated', info => {
                if (info.parent !== this.id) {
                    return;
                }
                const browsingContext = BrowsingContext.from(this.userContext, this, info.context, info.url, info.originalOpener);
                this.#children.set(info.context, browsingContext);
                const browsingContextEmitter = this.#disposables.use(new EventEmitter_js_1.EventEmitter(browsingContext));
                browsingContextEmitter.once('closed', () => {
                    browsingContextEmitter.removeAllListeners();
                    this.#children.delete(browsingContext.id);
                });
                this.emit('browsingcontext', { browsingContext });
            });
            sessionEmitter.on('browsingContext.contextDestroyed', info => {
                if (info.context !== this.id) {
                    return;
                }
                this.dispose('Browsing context already closed.');
            });
            sessionEmitter.on('browsingContext.domContentLoaded', info => {
                if (info.context !== this.id) {
                    return;
                }
                this.#url = info.url;
                this.emit('DOMContentLoaded', undefined);
            });
            sessionEmitter.on('browsingContext.load', info => {
                if (info.context !== this.id) {
                    return;
                }
                this.#url = info.url;
                this.emit('load', undefined);
            });
            sessionEmitter.on('browsingContext.navigationStarted', info => {
                if (info.context !== this.id) {
                    return;
                }
                // Note: we should not update this.#url at this point since the context
                // has not finished navigating to the info.url yet.
                for (const [id, request] of this.#requests) {
                    if (request.disposed) {
                        this.#requests.delete(id);
                    }
                }
                // If the navigation hasn't finished, then this is nested navigation. The
                // current navigation will handle this.
                if (this.#navigation !== undefined && !this.#navigation.disposed) {
                    return;
                }
                // Note the navigation ID is null for this event.
                this.#navigation = Navigation_js_1.Navigation.from(this);
                const navigationEmitter = this.#disposables.use(new EventEmitter_js_1.EventEmitter(this.#navigation));
                for (const eventName of ['fragment', 'failed', 'aborted']) {
                    navigationEmitter.once(eventName, ({ url }) => {
                        navigationEmitter[disposable_js_1.disposeSymbol]();
                        this.#url = url;
                    });
                }
                this.emit('navigation', { navigation: this.#navigation });
            });
            sessionEmitter.on('network.beforeRequestSent', event => {
                if (event.context !== this.id) {
                    return;
                }
                if (this.#requests.has(event.request.request)) {
                    // Means the request is a redirect. This is handled in Request.
                    // Or an Auth event was issued
                    return;
                }
                const request = Request_js_1.Request.from(this, event);
                this.#requests.set(request.id, request);
                this.emit('request', { request });
            });
            sessionEmitter.on('log.entryAdded', entry => {
                if (entry.source.context !== this.id) {
                    return;
                }
                this.emit('log', { entry });
            });
            sessionEmitter.on('browsingContext.userPromptOpened', info => {
                if (info.context !== this.id) {
                    return;
                }
                const userPrompt = UserPrompt_js_1.UserPrompt.from(this, info);
                this.emit('userprompt', { userPrompt });
            });
        }
        get #session() {
            return this.userContext.browser.session;
        }
        get children() {
            return this.#children.values();
        }
        get closed() {
            return this.#reason !== undefined;
        }
        get disposed() {
            return this.closed;
        }
        get realms() {
            // eslint-disable-next-line @typescript-eslint/no-this-alias -- Required
            const self = this;
            return (function* () {
                yield self.defaultRealm;
                yield* self.#realms.values();
            })();
        }
        get top() {
            let context = this;
            for (let { parent } = context; parent; { parent } = context) {
                context = parent;
            }
            return context;
        }
        get url() {
            return this.#url;
        }
        #createWindowRealm(sandbox) {
            const realm = Realm_js_1.WindowRealm.from(this, sandbox);
            realm.on('worker', realm => {
                this.emit('worker', { realm });
            });
            return realm;
        }
        dispose(reason) {
            this.#reason = reason;
            this[disposable_js_1.disposeSymbol]();
        }
        async activate() {
            await this.#session.send('browsingContext.activate', {
                context: this.id,
            });
        }
        async captureScreenshot(options = {}) {
            const { result: { data }, } = await this.#session.send('browsingContext.captureScreenshot', {
                context: this.id,
                ...options,
            });
            return data;
        }
        async close(promptUnload) {
            await Promise.all([...this.#children.values()].map(async (child) => {
                await child.close(promptUnload);
            }));
            await this.#session.send('browsingContext.close', {
                context: this.id,
                promptUnload,
            });
        }
        async traverseHistory(delta) {
            await this.#session.send('browsingContext.traverseHistory', {
                context: this.id,
                delta,
            });
        }
        async navigate(url, wait) {
            await this.#session.send('browsingContext.navigate', {
                context: this.id,
                url,
                wait,
            });
        }
        async reload(options = {}) {
            await this.#session.send('browsingContext.reload', {
                context: this.id,
                ...options,
            });
        }
        async print(options = {}) {
            const { result: { data }, } = await this.#session.send('browsingContext.print', {
                context: this.id,
                ...options,
            });
            return data;
        }
        async handleUserPrompt(options = {}) {
            await this.#session.send('browsingContext.handleUserPrompt', {
                context: this.id,
                ...options,
            });
        }
        async setViewport(options = {}) {
            await this.#session.send('browsingContext.setViewport', {
                context: this.id,
                ...options,
            });
        }
        async performActions(actions) {
            await this.#session.send('input.performActions', {
                context: this.id,
                actions,
            });
        }
        async releaseActions() {
            await this.#session.send('input.releaseActions', {
                context: this.id,
            });
        }
        createWindowRealm(sandbox) {
            return this.#createWindowRealm(sandbox);
        }
        async addPreloadScript(functionDeclaration, options = {}) {
            return await this.userContext.browser.addPreloadScript(functionDeclaration, {
                ...options,
                contexts: [this],
            });
        }
        async addIntercept(options) {
            const { result: { intercept }, } = await this.userContext.browser.session.send('network.addIntercept', {
                ...options,
                contexts: [this.id],
            });
            return intercept;
        }
        async removePreloadScript(script) {
            await this.userContext.browser.removePreloadScript(script);
        }
        async getCookies(options = {}) {
            const { result: { cookies }, } = await this.#session.send('storage.getCookies', {
                ...options,
                partition: {
                    type: 'context',
                    context: this.id,
                },
            });
            return cookies;
        }
        async setCookie(cookie) {
            await this.#session.send('storage.setCookie', {
                cookie,
                partition: {
                    type: 'context',
                    context: this.id,
                },
            });
        }
        async setFiles(element, files) {
            await this.#session.send('input.setFiles', {
                context: this.id,
                element,
                files,
            });
        }
        async subscribe(events) {
            await this.#session.subscribe(events, [this.id]);
        }
        async addInterception(events) {
            await this.#session.subscribe(events, [this.id]);
        }
        [(_dispose_decorators = [decorators_js_1.inertIfDisposed], _activate_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _captureScreenshot_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _close_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _traverseHistory_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _navigate_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _reload_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _print_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _handleUserPrompt_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _setViewport_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _performActions_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _releaseActions_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _createWindowRealm_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _addPreloadScript_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _addIntercept_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _removePreloadScript_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _getCookies_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _setCookie_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _setFiles_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _subscribe_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], _addInterception_decorators = [(0, decorators_js_1.throwIfDisposed)(context => {
                // SAFETY: Disposal implies this exists.
                return context.#reason;
            })], disposable_js_1.disposeSymbol)]() {
            this.#reason ??=
                'Browsing context already closed, probably because the user context closed.';
            this.emit('closed', { reason: this.#reason });
            this.#disposables.dispose();
            super[disposable_js_1.disposeSymbol]();
        }
        async deleteCookie(...cookieFilters) {
            await Promise.all(cookieFilters.map(async (filter) => {
                await this.#session.send('storage.deleteCookies', {
                    filter: filter,
                    partition: {
                        type: 'context',
                        context: this.id,
                    },
                });
            }));
        }
        async locateNodes(locator, startNodes) {
            // TODO: add other locateNodes options if needed.
            const result = await this.#session.send('browsingContext.locateNodes', {
                context: this.id,
                locator,
                startNodes: startNodes.length ? startNodes : undefined,
            });
            return result.result.nodes;
        }
    };
})();
exports.BrowsingContext = BrowsingContext;
//# sourceMappingURL=BrowsingContext.js.map