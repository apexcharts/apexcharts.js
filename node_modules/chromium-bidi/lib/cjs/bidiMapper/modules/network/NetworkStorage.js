"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkStorage = void 0;
const protocol_js_1 = require("../../../protocol/protocol.js");
const uuid_js_1 = require("../../../utils/uuid.js");
const NetworkRequest_js_1 = require("./NetworkRequest.js");
const NetworkUtils_js_1 = require("./NetworkUtils.js");
/** Stores network and intercept maps. */
class NetworkStorage {
    #eventManager;
    #logger;
    /**
     * A map from network request ID to Network Request objects.
     * Needed as long as information about requests comes from different events.
     */
    #requests = new Map();
    /** A map from intercept ID to track active network intercepts. */
    #intercepts = new Map();
    constructor(eventManager, browserClient, logger) {
        this.#eventManager = eventManager;
        browserClient.on('Target.detachedFromTarget', ({ sessionId }) => {
            this.disposeRequestMap(sessionId);
        });
        this.#logger = logger;
    }
    /**
     * Gets the network request with the given ID, if any.
     * Otherwise, creates a new network request with the given ID and cdp target.
     */
    #getOrCreateNetworkRequest(id, cdpTarget, redirectCount) {
        let request = this.getRequestById(id);
        if (request) {
            return request;
        }
        request = new NetworkRequest_js_1.NetworkRequest(id, this.#eventManager, this, cdpTarget, redirectCount, this.#logger);
        this.addRequest(request);
        return request;
    }
    onCdpTargetCreated(cdpTarget) {
        const cdpClient = cdpTarget.cdpClient;
        // TODO: Wrap into object
        const listeners = [
            [
                'Network.requestWillBeSent',
                (params) => {
                    const request = this.getRequestById(params.requestId);
                    if (request && request.isRedirecting()) {
                        request.handleRedirect(params);
                        this.deleteRequest(params.requestId);
                        this.#getOrCreateNetworkRequest(params.requestId, cdpTarget, request.redirectCount + 1).onRequestWillBeSentEvent(params);
                    }
                    else {
                        this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onRequestWillBeSentEvent(params);
                    }
                },
            ],
            [
                'Network.requestWillBeSentExtraInfo',
                (params) => {
                    this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onRequestWillBeSentExtraInfoEvent(params);
                },
            ],
            [
                'Network.responseReceived',
                (params) => {
                    this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onResponseReceivedEvent(params);
                },
            ],
            [
                'Network.responseReceivedExtraInfo',
                (params) => {
                    this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onResponseReceivedExtraInfoEvent(params);
                },
            ],
            [
                'Network.requestServedFromCache',
                (params) => {
                    this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onServedFromCache();
                },
            ],
            [
                'Network.loadingFailed',
                (params) => {
                    this.#getOrCreateNetworkRequest(params.requestId, cdpTarget).onLoadingFailedEvent(params);
                },
            ],
            [
                'Fetch.requestPaused',
                (event) => {
                    this.#getOrCreateNetworkRequest(
                    // CDP quirk if the Network domain is not present this is undefined
                    event.networkId ?? event.requestId, cdpTarget).onRequestPaused(event);
                },
            ],
            [
                'Fetch.authRequired',
                (event) => {
                    let request = this.getRequestByFetchId(event.requestId);
                    if (!request) {
                        request = this.#getOrCreateNetworkRequest(event.requestId, cdpTarget);
                    }
                    request.onAuthRequired(event);
                },
            ],
        ];
        for (const [event, listener] of listeners) {
            cdpClient.on(event, listener);
        }
    }
    getInterceptionStages(browsingContextId) {
        const stages = {
            request: false,
            response: false,
            auth: false,
        };
        for (const intercept of this.#intercepts.values()) {
            if (intercept.contexts &&
                !intercept.contexts.includes(browsingContextId)) {
                continue;
            }
            stages.request ||= intercept.phases.includes("beforeRequestSent" /* Network.InterceptPhase.BeforeRequestSent */);
            stages.response ||= intercept.phases.includes("responseStarted" /* Network.InterceptPhase.ResponseStarted */);
            stages.auth ||= intercept.phases.includes("authRequired" /* Network.InterceptPhase.AuthRequired */);
        }
        return stages;
    }
    getInterceptsForPhase(request, phase) {
        if (request.url === NetworkRequest_js_1.NetworkRequest.unknownParameter) {
            return new Set();
        }
        const intercepts = new Set();
        for (const [interceptId, intercept] of this.#intercepts.entries()) {
            if (!intercept.phases.includes(phase) ||
                (intercept.contexts &&
                    !intercept.contexts.includes(request.cdpTarget.topLevelId))) {
                continue;
            }
            if (intercept.urlPatterns.length === 0) {
                intercepts.add(interceptId);
                continue;
            }
            for (const pattern of intercept.urlPatterns) {
                if ((0, NetworkUtils_js_1.matchUrlPattern)(pattern, request.url)) {
                    intercepts.add(interceptId);
                    break;
                }
            }
        }
        return intercepts;
    }
    disposeRequestMap(sessionId) {
        for (const request of this.#requests.values()) {
            if (request.cdpClient.sessionId === sessionId) {
                this.#requests.delete(request.id);
            }
        }
    }
    /**
     * Adds the given entry to the intercept map.
     * URL patterns are assumed to be parsed.
     *
     * @return The intercept ID.
     */
    addIntercept(value) {
        const interceptId = (0, uuid_js_1.uuidv4)();
        this.#intercepts.set(interceptId, value);
        return interceptId;
    }
    /**
     * Removes the given intercept from the intercept map.
     * Throws NoSuchInterceptException if the intercept does not exist.
     */
    removeIntercept(intercept) {
        if (!this.#intercepts.has(intercept)) {
            throw new protocol_js_1.NoSuchInterceptException(`Intercept '${intercept}' does not exist.`);
        }
        this.#intercepts.delete(intercept);
    }
    getRequestById(id) {
        return this.#requests.get(id);
    }
    getRequestByFetchId(fetchId) {
        for (const request of this.#requests.values()) {
            if (request.fetchId === fetchId) {
                return request;
            }
        }
        return;
    }
    addRequest(request) {
        this.#requests.set(request.id, request);
    }
    deleteRequest(id) {
        this.#requests.delete(id);
    }
}
exports.NetworkStorage = NetworkStorage;
//# sourceMappingURL=NetworkStorage.js.map