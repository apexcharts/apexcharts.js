"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipeTransport = void 0;
const EventEmitter_js_1 = require("../common/EventEmitter.js");
const util_js_1 = require("../common/util.js");
const assert_js_1 = require("../util/assert.js");
const disposable_js_1 = require("../util/disposable.js");
/**
 * @internal
 */
class PipeTransport {
    #pipeWrite;
    #subscriptions = new disposable_js_1.DisposableStack();
    #isClosed = false;
    #pendingMessage = '';
    onclose;
    onmessage;
    constructor(pipeWrite, pipeRead) {
        this.#pipeWrite = pipeWrite;
        this.#subscriptions.use(new EventEmitter_js_1.EventSubscription(pipeRead, 'data', (buffer) => {
            return this.#dispatch(buffer);
        }));
        this.#subscriptions.use(new EventEmitter_js_1.EventSubscription(pipeRead, 'close', () => {
            if (this.onclose) {
                this.onclose.call(null);
            }
        }));
        this.#subscriptions.use(new EventEmitter_js_1.EventSubscription(pipeRead, 'error', util_js_1.debugError));
        this.#subscriptions.use(new EventEmitter_js_1.EventSubscription(pipeWrite, 'error', util_js_1.debugError));
    }
    send(message) {
        (0, assert_js_1.assert)(!this.#isClosed, '`PipeTransport` is closed.');
        this.#pipeWrite.write(message);
        this.#pipeWrite.write('\0');
    }
    #dispatch(buffer) {
        (0, assert_js_1.assert)(!this.#isClosed, '`PipeTransport` is closed.');
        let end = buffer.indexOf('\0');
        if (end === -1) {
            this.#pendingMessage += buffer.toString();
            return;
        }
        const message = this.#pendingMessage + buffer.toString(undefined, 0, end);
        if (this.onmessage) {
            this.onmessage.call(null, message);
        }
        let start = end + 1;
        end = buffer.indexOf('\0', start);
        while (end !== -1) {
            if (this.onmessage) {
                this.onmessage.call(null, buffer.toString(undefined, start, end));
            }
            start = end + 1;
            end = buffer.indexOf('\0', start);
        }
        this.#pendingMessage = buffer.toString(undefined, start);
    }
    close() {
        this.#isClosed = true;
        this.#subscriptions.dispose();
    }
}
exports.PipeTransport = PipeTransport;
//# sourceMappingURL=PipeTransport.js.map