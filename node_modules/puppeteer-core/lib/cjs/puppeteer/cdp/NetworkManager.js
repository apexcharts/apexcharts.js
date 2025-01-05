"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkManager = void 0;
const CDPSession_js_1 = require("../api/CDPSession.js");
const EventEmitter_js_1 = require("../common/EventEmitter.js");
const NetworkManagerEvents_js_1 = require("../common/NetworkManagerEvents.js");
const util_js_1 = require("../common/util.js");
const assert_js_1 = require("../util/assert.js");
const disposable_js_1 = require("../util/disposable.js");
const HTTPRequest_js_1 = require("./HTTPRequest.js");
const HTTPResponse_js_1 = require("./HTTPResponse.js");
const NetworkEventManager_js_1 = require("./NetworkEventManager.js");
/**
 * @internal
 */
class NetworkManager extends EventEmitter_js_1.EventEmitter {
    #frameManager;
    #networkEventManager = new NetworkEventManager_js_1.NetworkEventManager();
    #extraHTTPHeaders;
    #credentials = null;
    #attemptedAuthentications = new Set();
    #userRequestInterceptionEnabled = false;
    #protocolRequestInterceptionEnabled = false;
    #userCacheDisabled;
    #emulatedNetworkConditions;
    #userAgent;
    #userAgentMetadata;
    #handlers = [
        ['Fetch.requestPaused', this.#onRequestPaused],
        ['Fetch.authRequired', this.#onAuthRequired],
        ['Network.requestWillBeSent', this.#onRequestWillBeSent],
        ['Network.requestServedFromCache', this.#onRequestServedFromCache],
        ['Network.responseReceived', this.#onResponseReceived],
        ['Network.loadingFinished', this.#onLoadingFinished],
        ['Network.loadingFailed', this.#onLoadingFailed],
        ['Network.responseReceivedExtraInfo', this.#onResponseReceivedExtraInfo],
        [CDPSession_js_1.CDPSessionEvent.Disconnected, this.#removeClient],
    ];
    #clients = new Map();
    constructor(frameManager) {
        super();
        this.#frameManager = frameManager;
    }
    async addClient(client) {
        if (this.#clients.has(client)) {
            return;
        }
        const subscriptions = new disposable_js_1.DisposableStack();
        this.#clients.set(client, subscriptions);
        const clientEmitter = subscriptions.use(new EventEmitter_js_1.EventEmitter(client));
        for (const [event, handler] of this.#handlers) {
            clientEmitter.on(event, (arg) => {
                return handler.bind(this)(client, arg);
            });
        }
        await Promise.all([
            client.send('Network.enable'),
            this.#applyExtraHTTPHeaders(client),
            this.#applyNetworkConditions(client),
            this.#applyProtocolCacheDisabled(client),
            this.#applyProtocolRequestInterception(client),
            this.#applyUserAgent(client),
        ]);
    }
    async #removeClient(client) {
        this.#clients.get(client)?.dispose();
        this.#clients.delete(client);
    }
    async authenticate(credentials) {
        this.#credentials = credentials;
        const enabled = this.#userRequestInterceptionEnabled || !!this.#credentials;
        if (enabled === this.#protocolRequestInterceptionEnabled) {
            return;
        }
        this.#protocolRequestInterceptionEnabled = enabled;
        await this.#applyToAllClients(this.#applyProtocolRequestInterception.bind(this));
    }
    async setExtraHTTPHeaders(headers) {
        const extraHTTPHeaders = {};
        for (const [key, value] of Object.entries(headers)) {
            (0, assert_js_1.assert)((0, util_js_1.isString)(value), `Expected value of header "${key}" to be String, but "${typeof value}" is found.`);
            extraHTTPHeaders[key.toLowerCase()] = value;
        }
        this.#extraHTTPHeaders = extraHTTPHeaders;
        await this.#applyToAllClients(this.#applyExtraHTTPHeaders.bind(this));
    }
    async #applyExtraHTTPHeaders(client) {
        if (this.#extraHTTPHeaders === undefined) {
            return;
        }
        await client.send('Network.setExtraHTTPHeaders', {
            headers: this.#extraHTTPHeaders,
        });
    }
    extraHTTPHeaders() {
        return Object.assign({}, this.#extraHTTPHeaders);
    }
    inFlightRequestsCount() {
        return this.#networkEventManager.inFlightRequestsCount();
    }
    async setOfflineMode(value) {
        if (!this.#emulatedNetworkConditions) {
            this.#emulatedNetworkConditions = {
                offline: false,
                upload: -1,
                download: -1,
                latency: 0,
            };
        }
        this.#emulatedNetworkConditions.offline = value;
        await this.#applyToAllClients(this.#applyNetworkConditions.bind(this));
    }
    async emulateNetworkConditions(networkConditions) {
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
        await this.#applyToAllClients(this.#applyNetworkConditions.bind(this));
    }
    async #applyToAllClients(fn) {
        await Promise.all(Array.from(this.#clients.keys()).map(client => {
            return fn(client);
        }));
    }
    async #applyNetworkConditions(client) {
        if (this.#emulatedNetworkConditions === undefined) {
            return;
        }
        await client.send('Network.emulateNetworkConditions', {
            offline: this.#emulatedNetworkConditions.offline,
            latency: this.#emulatedNetworkConditions.latency,
            uploadThroughput: this.#emulatedNetworkConditions.upload,
            downloadThroughput: this.#emulatedNetworkConditions.download,
        });
    }
    async setUserAgent(userAgent, userAgentMetadata) {
        this.#userAgent = userAgent;
        this.#userAgentMetadata = userAgentMetadata;
        await this.#applyToAllClients(this.#applyUserAgent.bind(this));
    }
    async #applyUserAgent(client) {
        if (this.#userAgent === undefined) {
            return;
        }
        await client.send('Network.setUserAgentOverride', {
            userAgent: this.#userAgent,
            userAgentMetadata: this.#userAgentMetadata,
        });
    }
    async setCacheEnabled(enabled) {
        this.#userCacheDisabled = !enabled;
        await this.#applyToAllClients(this.#applyProtocolCacheDisabled.bind(this));
    }
    async setRequestInterception(value) {
        this.#userRequestInterceptionEnabled = value;
        const enabled = this.#userRequestInterceptionEnabled || !!this.#credentials;
        if (enabled === this.#protocolRequestInterceptionEnabled) {
            return;
        }
        this.#protocolRequestInterceptionEnabled = enabled;
        await this.#applyToAllClients(this.#applyProtocolRequestInterception.bind(this));
    }
    async #applyProtocolRequestInterception(client) {
        if (this.#userCacheDisabled === undefined) {
            this.#userCacheDisabled = false;
        }
        if (this.#protocolRequestInterceptionEnabled) {
            await Promise.all([
                this.#applyProtocolCacheDisabled(client),
                client.send('Fetch.enable', {
                    handleAuthRequests: true,
                    patterns: [{ urlPattern: '*' }],
                }),
            ]);
        }
        else {
            await Promise.all([
                this.#applyProtocolCacheDisabled(client),
                client.send('Fetch.disable'),
            ]);
        }
    }
    async #applyProtocolCacheDisabled(client) {
        if (this.#userCacheDisabled === undefined) {
            return;
        }
        await client.send('Network.setCacheDisabled', {
            cacheDisabled: this.#userCacheDisabled,
        });
    }
    #onRequestWillBeSent(client, event) {
        // Request interception doesn't happen for data URLs with Network Service.
        if (this.#userRequestInterceptionEnabled &&
            !event.request.url.startsWith('data:')) {
            const { requestId: networkRequestId } = event;
            this.#networkEventManager.storeRequestWillBeSent(networkRequestId, event);
            /**
             * CDP may have sent a Fetch.requestPaused event already. Check for it.
             */
            const requestPausedEvent = this.#networkEventManager.getRequestPaused(networkRequestId);
            if (requestPausedEvent) {
                const { requestId: fetchRequestId } = requestPausedEvent;
                this.#patchRequestEventHeaders(event, requestPausedEvent);
                this.#onRequest(client, event, fetchRequestId);
                this.#networkEventManager.forgetRequestPaused(networkRequestId);
            }
            return;
        }
        this.#onRequest(client, event, undefined);
    }
    #onAuthRequired(client, event) {
        let response = 'Default';
        if (this.#attemptedAuthentications.has(event.requestId)) {
            response = 'CancelAuth';
        }
        else if (this.#credentials) {
            response = 'ProvideCredentials';
            this.#attemptedAuthentications.add(event.requestId);
        }
        const { username, password } = this.#credentials || {
            username: undefined,
            password: undefined,
        };
        client
            .send('Fetch.continueWithAuth', {
            requestId: event.requestId,
            authChallengeResponse: { response, username, password },
        })
            .catch(util_js_1.debugError);
    }
    /**
     * CDP may send a Fetch.requestPaused without or before a
     * Network.requestWillBeSent
     *
     * CDP may send multiple Fetch.requestPaused
     * for the same Network.requestWillBeSent.
     */
    #onRequestPaused(client, event) {
        if (!this.#userRequestInterceptionEnabled &&
            this.#protocolRequestInterceptionEnabled) {
            client
                .send('Fetch.continueRequest', {
                requestId: event.requestId,
            })
                .catch(util_js_1.debugError);
        }
        const { networkId: networkRequestId, requestId: fetchRequestId } = event;
        if (!networkRequestId) {
            this.#onRequestWithoutNetworkInstrumentation(client, event);
            return;
        }
        const requestWillBeSentEvent = (() => {
            const requestWillBeSentEvent = this.#networkEventManager.getRequestWillBeSent(networkRequestId);
            // redirect requests have the same `requestId`,
            if (requestWillBeSentEvent &&
                (requestWillBeSentEvent.request.url !== event.request.url ||
                    requestWillBeSentEvent.request.method !== event.request.method)) {
                this.#networkEventManager.forgetRequestWillBeSent(networkRequestId);
                return;
            }
            return requestWillBeSentEvent;
        })();
        if (requestWillBeSentEvent) {
            this.#patchRequestEventHeaders(requestWillBeSentEvent, event);
            this.#onRequest(client, requestWillBeSentEvent, fetchRequestId);
        }
        else {
            this.#networkEventManager.storeRequestPaused(networkRequestId, event);
        }
    }
    #patchRequestEventHeaders(requestWillBeSentEvent, requestPausedEvent) {
        requestWillBeSentEvent.request.headers = {
            ...requestWillBeSentEvent.request.headers,
            // includes extra headers, like: Accept, Origin
            ...requestPausedEvent.request.headers,
        };
    }
    #onRequestWithoutNetworkInstrumentation(client, event) {
        // If an event has no networkId it should not have any network events. We
        // still want to dispatch it for the interception by the user.
        const frame = event.frameId
            ? this.#frameManager.frame(event.frameId)
            : null;
        const request = new HTTPRequest_js_1.CdpHTTPRequest(client, frame, event.requestId, this.#userRequestInterceptionEnabled, event, []);
        this.emit(NetworkManagerEvents_js_1.NetworkManagerEvent.Request, request);
        void request.finalizeInterceptions();
    }
    #onRequest(client, event, fetchRequestId) {
        let redirectChain = [];
        if (event.redirectResponse) {
            // We want to emit a response and requestfinished for the
            // redirectResponse, but we can't do so unless we have a
            // responseExtraInfo ready to pair it up with. If we don't have any
            // responseExtraInfos saved in our queue, they we have to wait until
            // the next one to emit response and requestfinished, *and* we should
            // also wait to emit this Request too because it should come after the
            // response/requestfinished.
            let redirectResponseExtraInfo = null;
            if (event.redirectHasExtraInfo) {
                redirectResponseExtraInfo = this.#networkEventManager
                    .responseExtraInfo(event.requestId)
                    .shift();
                if (!redirectResponseExtraInfo) {
                    this.#networkEventManager.queueRedirectInfo(event.requestId, {
                        event,
                        fetchRequestId,
                    });
                    return;
                }
            }
            const request = this.#networkEventManager.getRequest(event.requestId);
            // If we connect late to the target, we could have missed the
            // requestWillBeSent event.
            if (request) {
                this.#handleRequestRedirect(client, request, event.redirectResponse, redirectResponseExtraInfo);
                redirectChain = request._redirectChain;
            }
        }
        const frame = event.frameId
            ? this.#frameManager.frame(event.frameId)
            : null;
        const request = new HTTPRequest_js_1.CdpHTTPRequest(client, frame, fetchRequestId, this.#userRequestInterceptionEnabled, event, redirectChain);
        this.#networkEventManager.storeRequest(event.requestId, request);
        this.emit(NetworkManagerEvents_js_1.NetworkManagerEvent.Request, request);
        void request.finalizeInterceptions();
    }
    #onRequestServedFromCache(_client, event) {
        const request = this.#networkEventManager.getRequest(event.requestId);
        if (request) {
            request._fromMemoryCache = true;
        }
        this.emit(NetworkManagerEvents_js_1.NetworkManagerEvent.RequestServedFromCache, request);
    }
    #handleRequestRedirect(client, request, responsePayload, extraInfo) {
        const response = new HTTPResponse_js_1.CdpHTTPResponse(client, request, responsePayload, extraInfo);
        request._response = response;
        request._redirectChain.push(request);
        response._resolveBody(new Error('Response body is unavailable for redirect responses'));
        this.#forgetRequest(request, false);
        this.emit(NetworkManagerEvents_js_1.NetworkManagerEvent.Response, response);
        this.emit(NetworkManagerEvents_js_1.NetworkManagerEvent.RequestFinished, request);
    }
    #emitResponseEvent(client, responseReceived, extraInfo) {
        const request = this.#networkEventManager.getRequest(responseReceived.requestId);
        // FileUpload sends a response without a matching request.
        if (!request) {
            return;
        }
        const extraInfos = this.#networkEventManager.responseExtraInfo(responseReceived.requestId);
        if (extraInfos.length) {
            (0, util_js_1.debugError)(new Error('Unexpected extraInfo events for request ' +
                responseReceived.requestId));
        }
        // Chromium sends wrong extraInfo events for responses served from cache.
        // See https://github.com/puppeteer/puppeteer/issues/9965 and
        // https://crbug.com/1340398.
        if (responseReceived.response.fromDiskCache) {
            extraInfo = null;
        }
        const response = new HTTPResponse_js_1.CdpHTTPResponse(client, request, responseReceived.response, extraInfo);
        request._response = response;
        this.emit(NetworkManagerEvents_js_1.NetworkManagerEvent.Response, response);
    }
    #onResponseReceived(client, event) {
        const request = this.#networkEventManager.getRequest(event.requestId);
        let extraInfo = null;
        if (request && !request._fromMemoryCache && event.hasExtraInfo) {
            extraInfo = this.#networkEventManager
                .responseExtraInfo(event.requestId)
                .shift();
            if (!extraInfo) {
                // Wait until we get the corresponding ExtraInfo event.
                this.#networkEventManager.queueEventGroup(event.requestId, {
                    responseReceivedEvent: event,
                });
                return;
            }
        }
        this.#emitResponseEvent(client, event, extraInfo);
    }
    #onResponseReceivedExtraInfo(client, event) {
        // We may have skipped a redirect response/request pair due to waiting for
        // this ExtraInfo event. If so, continue that work now that we have the
        // request.
        const redirectInfo = this.#networkEventManager.takeQueuedRedirectInfo(event.requestId);
        if (redirectInfo) {
            this.#networkEventManager.responseExtraInfo(event.requestId).push(event);
            this.#onRequest(client, redirectInfo.event, redirectInfo.fetchRequestId);
            return;
        }
        // We may have skipped response and loading events because we didn't have
        // this ExtraInfo event yet. If so, emit those events now.
        const queuedEvents = this.#networkEventManager.getQueuedEventGroup(event.requestId);
        if (queuedEvents) {
            this.#networkEventManager.forgetQueuedEventGroup(event.requestId);
            this.#emitResponseEvent(client, queuedEvents.responseReceivedEvent, event);
            if (queuedEvents.loadingFinishedEvent) {
                this.#emitLoadingFinished(queuedEvents.loadingFinishedEvent);
            }
            if (queuedEvents.loadingFailedEvent) {
                this.#emitLoadingFailed(queuedEvents.loadingFailedEvent);
            }
            return;
        }
        // Wait until we get another event that can use this ExtraInfo event.
        this.#networkEventManager.responseExtraInfo(event.requestId).push(event);
    }
    #forgetRequest(request, events) {
        const requestId = request.id;
        const interceptionId = request._interceptionId;
        this.#networkEventManager.forgetRequest(requestId);
        interceptionId !== undefined &&
            this.#attemptedAuthentications.delete(interceptionId);
        if (events) {
            this.#networkEventManager.forget(requestId);
        }
    }
    #onLoadingFinished(_client, event) {
        // If the response event for this request is still waiting on a
        // corresponding ExtraInfo event, then wait to emit this event too.
        const queuedEvents = this.#networkEventManager.getQueuedEventGroup(event.requestId);
        if (queuedEvents) {
            queuedEvents.loadingFinishedEvent = event;
        }
        else {
            this.#emitLoadingFinished(event);
        }
    }
    #emitLoadingFinished(event) {
        const request = this.#networkEventManager.getRequest(event.requestId);
        // For certain requestIds we never receive requestWillBeSent event.
        // @see https://crbug.com/750469
        if (!request) {
            return;
        }
        // Under certain conditions we never get the Network.responseReceived
        // event from protocol. @see https://crbug.com/883475
        if (request.response()) {
            request.response()?._resolveBody();
        }
        this.#forgetRequest(request, true);
        this.emit(NetworkManagerEvents_js_1.NetworkManagerEvent.RequestFinished, request);
    }
    #onLoadingFailed(_client, event) {
        // If the response event for this request is still waiting on a
        // corresponding ExtraInfo event, then wait to emit this event too.
        const queuedEvents = this.#networkEventManager.getQueuedEventGroup(event.requestId);
        if (queuedEvents) {
            queuedEvents.loadingFailedEvent = event;
        }
        else {
            this.#emitLoadingFailed(event);
        }
    }
    #emitLoadingFailed(event) {
        const request = this.#networkEventManager.getRequest(event.requestId);
        // For certain requestIds we never receive requestWillBeSent event.
        // @see https://crbug.com/750469
        if (!request) {
            return;
        }
        request._failureText = event.errorText;
        const response = request.response();
        if (response) {
            response._resolveBody();
        }
        this.#forgetRequest(request, true);
        this.emit(NetworkManagerEvents_js_1.NetworkManagerEvent.RequestFailed, request);
    }
}
exports.NetworkManager = NetworkManager;
//# sourceMappingURL=NetworkManager.js.map