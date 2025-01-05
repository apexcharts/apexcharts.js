"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectBidiOverCdp = void 0;
const BidiMapper = __importStar(require("chromium-bidi/lib/cjs/bidiMapper/BidiMapper.js"));
const Debug_js_1 = require("../common/Debug.js");
const Errors_js_1 = require("../common/Errors.js");
const Connection_js_1 = require("./Connection.js");
const bidiServerLogger = (prefix, ...args) => {
    (0, Debug_js_1.debug)(`bidi:${prefix}`)(args);
};
/**
 * @internal
 */
async function connectBidiOverCdp(cdp, options) {
    const transportBiDi = new NoOpTransport();
    const cdpConnectionAdapter = new CdpConnectionAdapter(cdp);
    const pptrTransport = {
        send(message) {
            // Forwards a BiDi command sent by Puppeteer to the input of the BidiServer.
            transportBiDi.emitMessage(JSON.parse(message));
        },
        close() {
            bidiServer.close();
            cdpConnectionAdapter.close();
            cdp.dispose();
        },
        onmessage(_message) {
            // The method is overridden by the Connection.
        },
    };
    transportBiDi.on('bidiResponse', (message) => {
        // Forwards a BiDi event sent by BidiServer to Puppeteer.
        pptrTransport.onmessage(JSON.stringify(message));
    });
    const pptrBiDiConnection = new Connection_js_1.BidiConnection(cdp.url(), pptrTransport, cdp.delay, cdp.timeout);
    const bidiServer = await BidiMapper.BidiServer.createAndStart(transportBiDi, cdpConnectionAdapter, 
    // TODO: most likely need a little bit of refactoring
    cdpConnectionAdapter.browserClient(), '', options, undefined, bidiServerLogger);
    return pptrBiDiConnection;
}
exports.connectBidiOverCdp = connectBidiOverCdp;
/**
 * Manages CDPSessions for BidiServer.
 * @internal
 */
class CdpConnectionAdapter {
    #cdp;
    #adapters = new Map();
    #browserCdpConnection;
    constructor(cdp) {
        this.#cdp = cdp;
        this.#browserCdpConnection = new CDPClientAdapter(cdp);
    }
    browserClient() {
        return this.#browserCdpConnection;
    }
    getCdpClient(id) {
        const session = this.#cdp.session(id);
        if (!session) {
            throw new Error(`Unknown CDP session with id ${id}`);
        }
        if (!this.#adapters.has(session)) {
            const adapter = new CDPClientAdapter(session, id, this.#browserCdpConnection);
            this.#adapters.set(session, adapter);
            return adapter;
        }
        return this.#adapters.get(session);
    }
    close() {
        this.#browserCdpConnection.close();
        for (const adapter of this.#adapters.values()) {
            adapter.close();
        }
    }
}
/**
 * Wrapper on top of CDPSession/CDPConnection to satisfy CDP interface that
 * BidiServer needs.
 *
 * @internal
 */
class CDPClientAdapter extends BidiMapper.EventEmitter {
    #closed = false;
    #client;
    sessionId = undefined;
    #browserClient;
    constructor(client, sessionId, browserClient) {
        super();
        this.#client = client;
        this.sessionId = sessionId;
        this.#browserClient = browserClient;
        this.#client.on('*', this.#forwardMessage);
    }
    browserClient() {
        return this.#browserClient;
    }
    #forwardMessage = (method, event) => {
        this.emit(method, event);
    };
    async sendCommand(method, ...params) {
        if (this.#closed) {
            return;
        }
        try {
            return await this.#client.send(method, ...params);
        }
        catch (err) {
            if (this.#closed) {
                return;
            }
            throw err;
        }
    }
    close() {
        this.#client.off('*', this.#forwardMessage);
        this.#closed = true;
    }
    isCloseError(error) {
        return error instanceof Errors_js_1.TargetCloseError;
    }
}
/**
 * This transport is given to the BiDi server instance and allows Puppeteer
 * to send and receive commands to the BiDiServer.
 * @internal
 */
class NoOpTransport extends BidiMapper.EventEmitter {
    #onMessage = async (_m) => {
        return;
    };
    emitMessage(message) {
        void this.#onMessage(message);
    }
    setOnMessage(onMessage) {
        this.#onMessage = onMessage;
    }
    async sendMessage(message) {
        this.emit('bidiResponse', message);
    }
    close() {
        this.#onMessage = async (_m) => {
            return;
        };
    }
}
//# sourceMappingURL=BidiOverCdp.js.map