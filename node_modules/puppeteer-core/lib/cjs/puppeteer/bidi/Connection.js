"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidiConnection = void 0;
const CallbackRegistry_js_1 = require("../common/CallbackRegistry.js");
const Debug_js_1 = require("../common/Debug.js");
const EventEmitter_js_1 = require("../common/EventEmitter.js");
const util_js_1 = require("../common/util.js");
const assert_js_1 = require("../util/assert.js");
const CDPSession_js_1 = require("./CDPSession.js");
const debugProtocolSend = (0, Debug_js_1.debug)('puppeteer:webDriverBiDi:SEND ►');
const debugProtocolReceive = (0, Debug_js_1.debug)('puppeteer:webDriverBiDi:RECV ◀');
/**
 * @internal
 */
class BidiConnection extends EventEmitter_js_1.EventEmitter {
    #url;
    #transport;
    #delay;
    #timeout = 0;
    #closed = false;
    #callbacks = new CallbackRegistry_js_1.CallbackRegistry();
    #emitters = [];
    constructor(url, transport, delay = 0, timeout) {
        super();
        this.#url = url;
        this.#delay = delay;
        this.#timeout = timeout ?? 180_000;
        this.#transport = transport;
        this.#transport.onmessage = this.onMessage.bind(this);
        this.#transport.onclose = this.unbind.bind(this);
    }
    get closed() {
        return this.#closed;
    }
    get url() {
        return this.#url;
    }
    pipeTo(emitter) {
        this.#emitters.push(emitter);
    }
    emit(type, event) {
        for (const emitter of this.#emitters) {
            emitter.emit(type, event);
        }
        return super.emit(type, event);
    }
    send(method, params, timeout) {
        (0, assert_js_1.assert)(!this.#closed, 'Protocol error: Connection closed.');
        return this.#callbacks.create(method, timeout ?? this.#timeout, id => {
            const stringifiedMessage = JSON.stringify({
                id,
                method,
                params,
            });
            debugProtocolSend(stringifiedMessage);
            this.#transport.send(stringifiedMessage);
        });
    }
    /**
     * @internal
     */
    async onMessage(message) {
        if (this.#delay) {
            await new Promise(f => {
                return setTimeout(f, this.#delay);
            });
        }
        debugProtocolReceive(message);
        const object = JSON.parse(message);
        if ('type' in object) {
            switch (object.type) {
                case 'success':
                    this.#callbacks.resolve(object.id, object);
                    return;
                case 'error':
                    if (object.id === null) {
                        break;
                    }
                    this.#callbacks.reject(object.id, createProtocolError(object), `${object.error}: ${object.message}`);
                    return;
                case 'event':
                    if (isCdpEvent(object)) {
                        CDPSession_js_1.BidiCdpSession.sessions
                            .get(object.params.session)
                            ?.emit(object.params.event, object.params.params);
                        return;
                    }
                    // SAFETY: We know the method and parameter still match here.
                    this.emit(object.method, object.params);
                    return;
            }
        }
        // Even if the response in not in BiDi protocol format but `id` is provided, reject
        // the callback. This can happen if the endpoint supports CDP instead of BiDi.
        if ('id' in object) {
            this.#callbacks.reject(object.id, `Protocol Error. Message is not in BiDi protocol format: '${message}'`, object.message);
        }
        (0, util_js_1.debugError)(object);
    }
    /**
     * Unbinds the connection, but keeps the transport open. Useful when the transport will
     * be reused by other connection e.g. with different protocol.
     * @internal
     */
    unbind() {
        if (this.#closed) {
            return;
        }
        this.#closed = true;
        // Both may still be invoked and produce errors
        this.#transport.onmessage = () => { };
        this.#transport.onclose = () => { };
        this.#callbacks.clear();
    }
    /**
     * Unbinds the connection and closes the transport.
     */
    dispose() {
        this.unbind();
        this.#transport.close();
    }
    getPendingProtocolErrors() {
        return this.#callbacks.getPendingProtocolErrors();
    }
}
exports.BidiConnection = BidiConnection;
/**
 * @internal
 */
function createProtocolError(object) {
    let message = `${object.error} ${object.message}`;
    if (object.stacktrace) {
        message += ` ${object.stacktrace}`;
    }
    return message;
}
function isCdpEvent(event) {
    return event.method.startsWith('cdp.');
}
//# sourceMappingURL=Connection.js.map