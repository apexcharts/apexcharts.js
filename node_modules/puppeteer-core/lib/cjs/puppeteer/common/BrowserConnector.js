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
exports._connectToBrowser = void 0;
const BrowserConnector_js_1 = require("../bidi/BrowserConnector.js");
const BrowserConnector_js_2 = require("../cdp/BrowserConnector.js");
const environment_js_1 = require("../environment.js");
const assert_js_1 = require("../util/assert.js");
const ErrorLike_js_1 = require("../util/ErrorLike.js");
const getWebSocketTransportClass = async () => {
    return environment_js_1.isNode
        ? (await Promise.resolve().then(() => __importStar(require('../node/NodeWebSocketTransport.js')))).NodeWebSocketTransport
        : (await Promise.resolve().then(() => __importStar(require('../common/BrowserWebSocketTransport.js'))))
            .BrowserWebSocketTransport;
};
/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect`. This method attaches Puppeteer to an existing browser instance.
 *
 * @internal
 */
async function _connectToBrowser(options) {
    const { connectionTransport, endpointUrl } = await getConnectionTransport(options);
    if (options.protocol === 'webDriverBiDi') {
        const bidiBrowser = await (0, BrowserConnector_js_1._connectToBiDiBrowser)(connectionTransport, endpointUrl, options);
        return bidiBrowser;
    }
    else {
        const cdpBrowser = await (0, BrowserConnector_js_2._connectToCdpBrowser)(connectionTransport, endpointUrl, options);
        return cdpBrowser;
    }
}
exports._connectToBrowser = _connectToBrowser;
/**
 * Establishes a websocket connection by given options and returns both transport and
 * endpoint url the transport is connected to.
 */
async function getConnectionTransport(options) {
    const { browserWSEndpoint, browserURL, transport, headers = {} } = options;
    (0, assert_js_1.assert)(Number(!!browserWSEndpoint) + Number(!!browserURL) + Number(!!transport) ===
        1, 'Exactly one of browserWSEndpoint, browserURL or transport must be passed to puppeteer.connect');
    if (transport) {
        return { connectionTransport: transport, endpointUrl: '' };
    }
    else if (browserWSEndpoint) {
        const WebSocketClass = await getWebSocketTransportClass();
        const connectionTransport = await WebSocketClass.create(browserWSEndpoint, headers);
        return {
            connectionTransport: connectionTransport,
            endpointUrl: browserWSEndpoint,
        };
    }
    else if (browserURL) {
        const connectionURL = await getWSEndpoint(browserURL);
        const WebSocketClass = await getWebSocketTransportClass();
        const connectionTransport = await WebSocketClass.create(connectionURL);
        return {
            connectionTransport: connectionTransport,
            endpointUrl: connectionURL,
        };
    }
    throw new Error('Invalid connection options');
}
async function getWSEndpoint(browserURL) {
    const endpointURL = new URL('/json/version', browserURL);
    try {
        const result = await globalThis.fetch(endpointURL.toString(), {
            method: 'GET',
        });
        if (!result.ok) {
            throw new Error(`HTTP ${result.statusText}`);
        }
        const data = await result.json();
        return data.webSocketDebuggerUrl;
    }
    catch (error) {
        if ((0, ErrorLike_js_1.isErrorLike)(error)) {
            error.message =
                `Failed to fetch browser webSocket URL from ${endpointURL}: ` +
                    error.message;
        }
        throw error;
    }
}
//# sourceMappingURL=BrowserConnector.js.map