"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowCdpTransport = exports.WindowBidiTransport = void 0;
const log_js_1 = require("../utils/log.js");
const mapperTabPage_js_1 = require("./mapperTabPage.js");
class WindowBidiTransport {
    static LOGGER_PREFIX_RECV = `${log_js_1.LogType.bidi}:RECV ◂`;
    static LOGGER_PREFIX_SEND = `${log_js_1.LogType.bidi}:SEND ▸`;
    #onMessage = null;
    constructor() {
        window.onBidiMessage = (message) => {
            (0, mapperTabPage_js_1.log)(WindowBidiTransport.LOGGER_PREFIX_RECV, message);
            try {
                const command = WindowBidiTransport.#parseBidiMessage(message);
                this.#onMessage?.call(null, command);
            }
            catch (e) {
                const error = e instanceof Error ? e : new Error(e);
                // Transport-level error does not provide channel.
                this.#respondWithError(message, "invalid argument" /* ErrorCode.InvalidArgument */, error, null);
            }
        };
    }
    setOnMessage(onMessage) {
        this.#onMessage = onMessage;
    }
    sendMessage(message) {
        (0, mapperTabPage_js_1.log)(WindowBidiTransport.LOGGER_PREFIX_SEND, message);
        const json = JSON.stringify(message);
        window.sendBidiResponse(json);
    }
    close() {
        this.#onMessage = null;
        window.onBidiMessage = null;
    }
    #respondWithError(plainCommandData, errorCode, error, channel) {
        const errorResponse = WindowBidiTransport.#getErrorResponse(plainCommandData, errorCode, error);
        if (channel) {
            this.sendMessage({
                ...errorResponse,
                channel,
            });
        }
        else {
            this.sendMessage(errorResponse);
        }
    }
    static #getJsonType(value) {
        if (value === null) {
            return 'null';
        }
        if (Array.isArray(value)) {
            return 'array';
        }
        return typeof value;
    }
    static #getErrorResponse(message, errorCode, error) {
        // XXX: this is bizarre per spec. We reparse the payload and
        // extract the ID, regardless of what kind of value it was.
        let messageId;
        try {
            const command = JSON.parse(message);
            if (WindowBidiTransport.#getJsonType(command) === 'object' &&
                'id' in command) {
                messageId = command.id;
            }
        }
        catch { }
        return {
            type: 'error',
            id: messageId,
            error: errorCode,
            message: error.message,
        };
    }
    static #parseBidiMessage(message) {
        let command;
        try {
            command = JSON.parse(message);
        }
        catch {
            throw new Error('Cannot parse data as JSON');
        }
        const type = WindowBidiTransport.#getJsonType(command);
        if (type !== 'object') {
            throw new Error(`Expected JSON object but got ${type}`);
        }
        // Extract and validate id, method and params.
        const { id, method, params } = command;
        const idType = WindowBidiTransport.#getJsonType(id);
        if (idType !== 'number' || !Number.isInteger(id) || id < 0) {
            // TODO: should uint64_t be the upper limit?
            // https://tools.ietf.org/html/rfc7049#section-2.1
            throw new Error(`Expected unsigned integer but got ${idType}`);
        }
        const methodType = WindowBidiTransport.#getJsonType(method);
        if (methodType !== 'string') {
            throw new Error(`Expected string method but got ${methodType}`);
        }
        const paramsType = WindowBidiTransport.#getJsonType(params);
        if (paramsType !== 'object') {
            throw new Error(`Expected object params but got ${paramsType}`);
        }
        let channel = command.channel;
        if (channel !== undefined) {
            const channelType = WindowBidiTransport.#getJsonType(channel);
            if (channelType !== 'string') {
                throw new Error(`Expected string channel but got ${channelType}`);
            }
            // Empty string channel is considered as no channel provided.
            if (channel === '') {
                channel = undefined;
            }
        }
        return { id, method, params, channel };
    }
}
exports.WindowBidiTransport = WindowBidiTransport;
class WindowCdpTransport {
    #onMessage = null;
    constructor() {
        window.cdp.onmessage = (message) => {
            this.#onMessage?.call(null, message);
        };
    }
    setOnMessage(onMessage) {
        this.#onMessage = onMessage;
    }
    sendMessage(message) {
        window.cdp.send(message);
    }
    close() {
        this.#onMessage = null;
        window.cdp.onmessage = null;
    }
}
exports.WindowCdpTransport = WindowCdpTransport;
//# sourceMappingURL=Transport.js.map