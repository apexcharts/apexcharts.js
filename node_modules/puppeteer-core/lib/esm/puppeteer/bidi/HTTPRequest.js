var _a;
import { HTTPRequest, STATUS_TEXTS, handleError, } from '../api/HTTPRequest.js';
import { UnsupportedOperation } from '../common/Errors.js';
import { BidiHTTPResponse } from './HTTPResponse.js';
export const requests = new WeakMap();
/**
 * @internal
 */
export class BidiHTTPRequest extends HTTPRequest {
    static from(bidiRequest, frame, redirect) {
        const request = new _a(bidiRequest, frame, redirect);
        request.#initialize();
        return request;
    }
    #redirectChain;
    #response = null;
    id;
    #frame;
    #request;
    constructor(request, frame, redirect) {
        super();
        requests.set(request, this);
        this.interception.enabled = request.isBlocked;
        this.#request = request;
        this.#frame = frame;
        this.#redirectChain = redirect ? redirect.#redirectChain : [];
        this.id = request.id;
    }
    get client() {
        return this.#frame.client;
    }
    #initialize() {
        this.#request.on('redirect', request => {
            const httpRequest = _a.from(request, this.#frame, this);
            this.#redirectChain.push(this);
            request.once('success', () => {
                this.#frame
                    .page()
                    .trustedEmitter.emit("requestfinished" /* PageEvent.RequestFinished */, httpRequest);
            });
            request.once('error', () => {
                this.#frame
                    .page()
                    .trustedEmitter.emit("requestfailed" /* PageEvent.RequestFailed */, httpRequest);
            });
            void httpRequest.finalizeInterceptions();
        });
        this.#request.once('success', data => {
            this.#response = BidiHTTPResponse.from(data, this);
        });
        this.#request.on('authenticate', this.#handleAuthentication);
        this.#frame.page().trustedEmitter.emit("request" /* PageEvent.Request */, this);
        if (this.#hasInternalHeaderOverwrite) {
            this.interception.handlers.push(async () => {
                await this.continue({
                    headers: this.headers(),
                }, 0);
            });
        }
    }
    url() {
        return this.#request.url;
    }
    resourceType() {
        throw new UnsupportedOperation();
    }
    method() {
        return this.#request.method;
    }
    postData() {
        throw new UnsupportedOperation();
    }
    hasPostData() {
        throw new UnsupportedOperation();
    }
    async fetchPostData() {
        throw new UnsupportedOperation();
    }
    get #hasInternalHeaderOverwrite() {
        return Boolean(Object.keys(this.#extraHTTPHeaders).length ||
            Object.keys(this.#userAgentHeaders).length);
    }
    get #extraHTTPHeaders() {
        return this.#frame?.page()._extraHTTPHeaders ?? {};
    }
    get #userAgentHeaders() {
        return this.#frame?.page()._userAgentHeaders ?? {};
    }
    headers() {
        const headers = {};
        for (const header of this.#request.headers) {
            headers[header.name.toLowerCase()] = header.value.value;
        }
        return {
            ...headers,
            ...this.#extraHTTPHeaders,
            ...this.#userAgentHeaders,
        };
    }
    response() {
        return this.#response;
    }
    failure() {
        if (this.#request.error === undefined) {
            return null;
        }
        return { errorText: this.#request.error };
    }
    isNavigationRequest() {
        return this.#request.navigation !== undefined;
    }
    initiator() {
        return this.#request.initiator;
    }
    redirectChain() {
        return this.#redirectChain.slice();
    }
    frame() {
        return this.#frame;
    }
    async continue(overrides, priority) {
        return await super.continue({
            headers: this.#hasInternalHeaderOverwrite ? this.headers() : undefined,
            ...overrides,
        }, priority);
    }
    async _continue(overrides = {}) {
        const headers = getBidiHeaders(overrides.headers);
        this.interception.handled = true;
        return await this.#request
            .continueRequest({
            url: overrides.url,
            method: overrides.method,
            body: overrides.postData
                ? {
                    type: 'base64',
                    value: btoa(overrides.postData),
                }
                : undefined,
            headers: headers.length > 0 ? headers : undefined,
        })
            .catch(error => {
            this.interception.handled = false;
            return handleError(error);
        });
    }
    async _abort() {
        this.interception.handled = true;
        return await this.#request.failRequest().catch(error => {
            this.interception.handled = false;
            throw error;
        });
    }
    async _respond(response, _priority) {
        this.interception.handled = true;
        const responseBody = response.body && response.body instanceof Uint8Array
            ? response.body.toString('base64')
            : response.body
                ? btoa(response.body)
                : undefined;
        const headers = getBidiHeaders(response.headers);
        const hasContentLength = headers.some(header => {
            return header.name === 'content-length';
        });
        if (response.contentType) {
            headers.push({
                name: 'content-type',
                value: {
                    type: 'string',
                    value: response.contentType,
                },
            });
        }
        if (responseBody && !hasContentLength) {
            const encoder = new TextEncoder();
            headers.push({
                name: 'content-length',
                value: {
                    type: 'string',
                    value: String(encoder.encode(responseBody).byteLength),
                },
            });
        }
        const status = response.status || 200;
        return await this.#request
            .provideResponse({
            statusCode: status,
            headers: headers.length > 0 ? headers : undefined,
            reasonPhrase: STATUS_TEXTS[status],
            body: responseBody
                ? {
                    type: 'base64',
                    value: responseBody,
                }
                : undefined,
        })
            .catch(error => {
            this.interception.handled = false;
            throw error;
        });
    }
    #authenticationHandled = false;
    #handleAuthentication = async () => {
        if (!this.#frame) {
            return;
        }
        const credentials = this.#frame.page()._credentials;
        if (credentials && !this.#authenticationHandled) {
            this.#authenticationHandled = true;
            void this.#request.continueWithAuth({
                action: 'provideCredentials',
                credentials: {
                    type: 'password',
                    username: credentials.username,
                    password: credentials.password,
                },
            });
        }
        else {
            void this.#request.continueWithAuth({
                action: 'cancel',
            });
        }
    };
}
_a = BidiHTTPRequest;
function getBidiHeaders(rawHeaders) {
    const headers = [];
    for (const [name, value] of Object.entries(rawHeaders ?? [])) {
        if (!Object.is(value, undefined)) {
            const values = Array.isArray(value) ? value : [value];
            for (const value of values) {
                headers.push({
                    name: name.toLowerCase(),
                    value: {
                        type: 'string',
                        value: String(value),
                    },
                });
            }
        }
    }
    return headers;
}
//# sourceMappingURL=HTTPRequest.js.map