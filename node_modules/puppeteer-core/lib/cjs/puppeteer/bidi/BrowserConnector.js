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
exports._connectToBiDiBrowser = void 0;
const Connection_js_1 = require("../cdp/Connection.js");
const Errors_js_1 = require("../common/Errors.js");
const util_js_1 = require("../common/util.js");
/**
 * Users should never call this directly; it's called when calling `puppeteer.connect`
 * with `protocol: 'webDriverBiDi'`. This method attaches Puppeteer to an existing browser
 * instance. First it tries to connect to the browser using pure BiDi. If the protocol is
 * not supported, connects to the browser using BiDi over CDP.
 *
 * @internal
 */
async function _connectToBiDiBrowser(connectionTransport, url, options) {
    const { ignoreHTTPSErrors = false, defaultViewport = util_js_1.DEFAULT_VIEWPORT } = options;
    const { bidiConnection, closeCallback } = await getBiDiConnection(connectionTransport, url, options);
    const BiDi = await Promise.resolve().then(() => __importStar(require(/* webpackIgnore: true */ './bidi.js')));
    const bidiBrowser = await BiDi.BidiBrowser.create({
        connection: bidiConnection,
        closeCallback,
        process: undefined,
        defaultViewport: defaultViewport,
        ignoreHTTPSErrors: ignoreHTTPSErrors,
    });
    return bidiBrowser;
}
exports._connectToBiDiBrowser = _connectToBiDiBrowser;
/**
 * Returns a BiDiConnection established to the endpoint specified by the options and a
 * callback closing the browser. Callback depends on whether the connection is pure BiDi
 * or BiDi over CDP.
 * The method tries to connect to the browser using pure BiDi protocol, and falls back
 * to BiDi over CDP.
 */
async function getBiDiConnection(connectionTransport, url, options) {
    const BiDi = await Promise.resolve().then(() => __importStar(require(/* webpackIgnore: true */ './bidi.js')));
    const { ignoreHTTPSErrors = false, slowMo = 0, protocolTimeout } = options;
    // Try pure BiDi first.
    const pureBidiConnection = new BiDi.BidiConnection(url, connectionTransport, slowMo, protocolTimeout);
    try {
        const result = await pureBidiConnection.send('session.status', {});
        if ('type' in result && result.type === 'success') {
            // The `browserWSEndpoint` points to an endpoint supporting pure WebDriver BiDi.
            return {
                bidiConnection: pureBidiConnection,
                closeCallback: async () => {
                    await pureBidiConnection.send('browser.close', {}).catch(util_js_1.debugError);
                },
            };
        }
    }
    catch (e) {
        if (!(e instanceof Errors_js_1.ProtocolError)) {
            // Unexpected exception not related to BiDi / CDP. Rethrow.
            throw e;
        }
    }
    // Unbind the connection to avoid memory leaks.
    pureBidiConnection.unbind();
    // Fall back to CDP over BiDi reusing the WS connection.
    const cdpConnection = new Connection_js_1.Connection(url, connectionTransport, slowMo, protocolTimeout);
    const version = await cdpConnection.send('Browser.getVersion');
    if (version.product.toLowerCase().includes('firefox')) {
        throw new Errors_js_1.UnsupportedOperation('Firefox is not supported in BiDi over CDP mode.');
    }
    // TODO: use other options too.
    const bidiOverCdpConnection = await BiDi.connectBidiOverCdp(cdpConnection, {
        acceptInsecureCerts: ignoreHTTPSErrors,
    });
    return {
        bidiConnection: bidiOverCdpConnection,
        closeCallback: async () => {
            // In case of BiDi over CDP, we need to close browser via CDP.
            await cdpConnection.send('Browser.close').catch(util_js_1.debugError);
        },
    };
}
//# sourceMappingURL=BrowserConnector.js.map