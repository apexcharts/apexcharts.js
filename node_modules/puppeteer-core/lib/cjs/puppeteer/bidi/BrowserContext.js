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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidiBrowserContext = void 0;
const Browser_js_1 = require("../api/Browser.js");
const BrowserContext_js_1 = require("../api/BrowserContext.js");
const EventEmitter_js_1 = require("../common/EventEmitter.js");
const util_js_1 = require("../common/util.js");
const decorators_js_1 = require("../util/decorators.js");
const UserContext_js_1 = require("./core/UserContext.js");
const Page_js_1 = require("./Page.js");
const Target_js_1 = require("./Target.js");
const Target_js_2 = require("./Target.js");
/**
 * @internal
 */
let BidiBrowserContext = (() => {
    let _classSuper = BrowserContext_js_1.BrowserContext;
    let _trustedEmitter_decorators;
    let _trustedEmitter_initializers = [];
    let _trustedEmitter_extraInitializers = [];
    return class BidiBrowserContext extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _trustedEmitter_decorators = [(0, decorators_js_1.bubble)()];
            __esDecorate(this, null, _trustedEmitter_decorators, { kind: "accessor", name: "trustedEmitter", static: false, private: false, access: { has: obj => "trustedEmitter" in obj, get: obj => obj.trustedEmitter, set: (obj, value) => { obj.trustedEmitter = value; } }, metadata: _metadata }, _trustedEmitter_initializers, _trustedEmitter_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static from(browser, userContext, options) {
            const context = new BidiBrowserContext(browser, userContext, options);
            context.#initialize();
            return context;
        }
        #trustedEmitter_accessor_storage = __runInitializers(this, _trustedEmitter_initializers, new EventEmitter_js_1.EventEmitter());
        get trustedEmitter() { return this.#trustedEmitter_accessor_storage; }
        set trustedEmitter(value) { this.#trustedEmitter_accessor_storage = value; }
        #browser = __runInitializers(this, _trustedEmitter_extraInitializers);
        #defaultViewport;
        // This is public because of cookies.
        userContext;
        #pages = new WeakMap();
        #targets = new Map();
        #overrides = [];
        constructor(browser, userContext, options) {
            super();
            this.#browser = browser;
            this.userContext = userContext;
            this.#defaultViewport = options.defaultViewport;
        }
        #initialize() {
            // Create targets for existing browsing contexts.
            for (const browsingContext of this.userContext.browsingContexts) {
                this.#createPage(browsingContext);
            }
            this.userContext.on('browsingcontext', ({ browsingContext }) => {
                const page = this.#createPage(browsingContext);
                // We need to wait for the DOMContentLoaded as the
                // browsingContext still may be navigating from the about:blank
                browsingContext.once('DOMContentLoaded', () => {
                    if (browsingContext.originalOpener) {
                        for (const context of this.userContext.browsingContexts) {
                            if (context.id === browsingContext.originalOpener) {
                                this.#pages
                                    .get(context)
                                    .trustedEmitter.emit("popup" /* PageEvent.Popup */, page);
                            }
                        }
                    }
                });
            });
            this.userContext.on('closed', () => {
                this.trustedEmitter.removeAllListeners();
            });
        }
        #createPage(browsingContext) {
            const page = Page_js_1.BidiPage.from(this, browsingContext);
            this.#pages.set(browsingContext, page);
            page.trustedEmitter.on("close" /* PageEvent.Close */, () => {
                this.#pages.delete(browsingContext);
            });
            // -- Target stuff starts here --
            const pageTarget = new Target_js_2.BidiPageTarget(page);
            const pageTargets = new Map();
            this.#targets.set(page, [pageTarget, pageTargets]);
            page.trustedEmitter.on("frameattached" /* PageEvent.FrameAttached */, frame => {
                const bidiFrame = frame;
                const target = new Target_js_2.BidiFrameTarget(bidiFrame);
                pageTargets.set(bidiFrame, target);
                this.trustedEmitter.emit("targetcreated" /* BrowserContextEvent.TargetCreated */, target);
            });
            page.trustedEmitter.on("framenavigated" /* PageEvent.FrameNavigated */, frame => {
                const bidiFrame = frame;
                const target = pageTargets.get(bidiFrame);
                // If there is no target, then this is the page's frame.
                if (target === undefined) {
                    this.trustedEmitter.emit("targetchanged" /* BrowserContextEvent.TargetChanged */, pageTarget);
                }
                else {
                    this.trustedEmitter.emit("targetchanged" /* BrowserContextEvent.TargetChanged */, target);
                }
            });
            page.trustedEmitter.on("framedetached" /* PageEvent.FrameDetached */, frame => {
                const bidiFrame = frame;
                const target = pageTargets.get(bidiFrame);
                if (target === undefined) {
                    return;
                }
                pageTargets.delete(bidiFrame);
                this.trustedEmitter.emit("targetdestroyed" /* BrowserContextEvent.TargetDestroyed */, target);
            });
            page.trustedEmitter.on("workercreated" /* PageEvent.WorkerCreated */, worker => {
                const bidiWorker = worker;
                const target = new Target_js_1.BidiWorkerTarget(bidiWorker);
                pageTargets.set(bidiWorker, target);
                this.trustedEmitter.emit("targetcreated" /* BrowserContextEvent.TargetCreated */, target);
            });
            page.trustedEmitter.on("workerdestroyed" /* PageEvent.WorkerDestroyed */, worker => {
                const bidiWorker = worker;
                const target = pageTargets.get(bidiWorker);
                if (target === undefined) {
                    return;
                }
                pageTargets.delete(worker);
                this.trustedEmitter.emit("targetdestroyed" /* BrowserContextEvent.TargetDestroyed */, target);
            });
            page.trustedEmitter.on("close" /* PageEvent.Close */, () => {
                this.#targets.delete(page);
                this.trustedEmitter.emit("targetdestroyed" /* BrowserContextEvent.TargetDestroyed */, pageTarget);
            });
            this.trustedEmitter.emit("targetcreated" /* BrowserContextEvent.TargetCreated */, pageTarget);
            // -- Target stuff ends here --
            return page;
        }
        targets() {
            return [...this.#targets.values()].flatMap(([target, frames]) => {
                return [target, ...frames.values()];
            });
        }
        async newPage() {
            const context = await this.userContext.createBrowsingContext("tab" /* Bidi.BrowsingContext.CreateType.Tab */);
            const page = this.#pages.get(context);
            if (!page) {
                throw new Error('Page is not found');
            }
            if (this.#defaultViewport) {
                try {
                    await page.setViewport(this.#defaultViewport);
                }
                catch {
                    // No support for setViewport in Firefox.
                }
            }
            return page;
        }
        async close() {
            if (!this.isIncognito()) {
                throw new Error('Default context cannot be closed!');
            }
            try {
                await this.userContext.remove();
            }
            catch (error) {
                (0, util_js_1.debugError)(error);
            }
            this.#targets.clear();
        }
        browser() {
            return this.#browser;
        }
        async pages() {
            return [...this.userContext.browsingContexts].map(context => {
                return this.#pages.get(context);
            });
        }
        isIncognito() {
            return this.userContext.id !== UserContext_js_1.UserContext.DEFAULT;
        }
        async overridePermissions(origin, permissions) {
            const permissionsSet = new Set(permissions.map(permission => {
                const protocolPermission = Browser_js_1.WEB_PERMISSION_TO_PROTOCOL_PERMISSION.get(permission);
                if (!protocolPermission) {
                    throw new Error('Unknown permission: ' + permission);
                }
                return permission;
            }));
            await Promise.all(Array.from(Browser_js_1.WEB_PERMISSION_TO_PROTOCOL_PERMISSION.keys()).map(permission => {
                const result = this.userContext.setPermissions(origin, {
                    name: permission,
                }, permissionsSet.has(permission)
                    ? "granted" /* Bidi.Permissions.PermissionState.Granted */
                    : "denied" /* Bidi.Permissions.PermissionState.Denied */);
                this.#overrides.push({ origin, permission });
                // TODO: some permissions are outdated and setting them to denied does
                // not work.
                if (!permissionsSet.has(permission)) {
                    return result.catch(util_js_1.debugError);
                }
                return result;
            }));
        }
        async clearPermissionOverrides() {
            const promises = this.#overrides.map(({ permission, origin }) => {
                return this.userContext
                    .setPermissions(origin, {
                    name: permission,
                }, "prompt" /* Bidi.Permissions.PermissionState.Prompt */)
                    .catch(util_js_1.debugError);
            });
            this.#overrides = [];
            await Promise.all(promises);
        }
        get id() {
            if (this.userContext.id === UserContext_js_1.UserContext.DEFAULT) {
                return undefined;
            }
            return this.userContext.id;
        }
    };
})();
exports.BidiBrowserContext = BidiBrowserContext;
//# sourceMappingURL=BrowserContext.js.map