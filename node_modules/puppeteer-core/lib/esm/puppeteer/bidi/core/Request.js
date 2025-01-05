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
import { EventEmitter } from '../../common/EventEmitter.js';
import { inertIfDisposed } from '../../util/decorators.js';
import { DisposableStack, disposeSymbol } from '../../util/disposable.js';
/**
 * @internal
 */
let Request = (() => {
    var _a;
    let _classSuper = EventEmitter;
    let _instanceExtraInitializers = [];
    let _dispose_decorators;
    return class Request extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(this, null, _dispose_decorators, { kind: "method", name: "dispose", static: false, private: false, access: { has: obj => "dispose" in obj, get: obj => obj.dispose }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static from(browsingContext, event) {
            const request = new Request(browsingContext, event);
            request.#initialize();
            return request;
        }
        #error = __runInitializers(this, _instanceExtraInitializers);
        #redirect;
        #response;
        #browsingContext;
        #disposables = new DisposableStack();
        #event;
        constructor(browsingContext, event) {
            super();
            this.#browsingContext = browsingContext;
            this.#event = event;
        }
        #initialize() {
            const browsingContextEmitter = this.#disposables.use(new EventEmitter(this.#browsingContext));
            browsingContextEmitter.once('closed', ({ reason }) => {
                this.#error = reason;
                this.emit('error', this.#error);
                this.dispose();
            });
            const sessionEmitter = this.#disposables.use(new EventEmitter(this.#session));
            sessionEmitter.on('network.beforeRequestSent', event => {
                if (event.context !== this.#browsingContext.id ||
                    event.request.request !== this.id ||
                    event.redirectCount !== this.#event.redirectCount + 1) {
                    return;
                }
                this.#redirect = Request.from(this.#browsingContext, event);
                this.emit('redirect', this.#redirect);
                this.dispose();
            });
            sessionEmitter.on('network.authRequired', event => {
                if (event.context !== this.#browsingContext.id ||
                    event.request.request !== this.id ||
                    // Don't try to authenticate for events that are not blocked
                    !event.isBlocked) {
                    return;
                }
                this.emit('authenticate', undefined);
            });
            sessionEmitter.on('network.fetchError', event => {
                if (event.context !== this.#browsingContext.id ||
                    event.request.request !== this.id ||
                    this.#event.redirectCount !== event.redirectCount) {
                    return;
                }
                this.#error = event.errorText;
                this.emit('error', this.#error);
                this.dispose();
            });
            sessionEmitter.on('network.responseCompleted', event => {
                if (event.context !== this.#browsingContext.id ||
                    event.request.request !== this.id ||
                    this.#event.redirectCount !== event.redirectCount) {
                    return;
                }
                this.#response = event.response;
                this.emit('success', this.#response);
                // In case this is a redirect.
                if (this.#response.status >= 300 && this.#response.status < 400) {
                    return;
                }
                this.dispose();
            });
        }
        get #session() {
            return this.#browsingContext.userContext.browser.session;
        }
        get disposed() {
            return this.#disposables.disposed;
        }
        get error() {
            return this.#error;
        }
        get headers() {
            return this.#event.request.headers;
        }
        get id() {
            return this.#event.request.request;
        }
        get initiator() {
            return this.#event.initiator;
        }
        get method() {
            return this.#event.request.method;
        }
        get navigation() {
            return this.#event.navigation ?? undefined;
        }
        get redirect() {
            return this.#redirect;
        }
        get lastRedirect() {
            let redirect = this.#redirect;
            while (redirect) {
                if (redirect && !redirect.#redirect) {
                    return redirect;
                }
                redirect = redirect.#redirect;
            }
            return redirect;
        }
        get response() {
            return this.#response;
        }
        get url() {
            return this.#event.request.url;
        }
        get isBlocked() {
            return this.#event.isBlocked;
        }
        async continueRequest({ url, method, headers, cookies, body, }) {
            await this.#session.send('network.continueRequest', {
                request: this.id,
                url,
                method,
                headers,
                body,
                cookies,
            });
        }
        async failRequest() {
            await this.#session.send('network.failRequest', {
                request: this.id,
            });
        }
        async provideResponse({ statusCode, reasonPhrase, headers, body, }) {
            await this.#session.send('network.provideResponse', {
                request: this.id,
                statusCode,
                reasonPhrase,
                headers,
                body,
            });
        }
        async continueWithAuth(parameters) {
            if (parameters.action === 'provideCredentials') {
                await this.#session.send('network.continueWithAuth', {
                    request: this.id,
                    action: parameters.action,
                    credentials: parameters.credentials,
                });
            }
            else {
                await this.#session.send('network.continueWithAuth', {
                    request: this.id,
                    action: parameters.action,
                });
            }
        }
        dispose() {
            this[disposeSymbol]();
        }
        [(_dispose_decorators = [inertIfDisposed], disposeSymbol)]() {
            this.#disposables.dispose();
            super[disposeSymbol]();
        }
    };
})();
export { Request };
//# sourceMappingURL=Request.js.map