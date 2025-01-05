"use strict";
/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports._connectToCdpBrowser = void 0;
const util_js_1 = require("../common/util.js");
const Browser_js_1 = require("./Browser.js");
const Connection_js_1 = require("./Connection.js");
/**
 * Users should never call this directly; it's called when calling
 * `puppeteer.connect` with `protocol: 'cdp'`.
 *
 * @internal
 */
async function _connectToCdpBrowser(connectionTransport, url, options) {
    const { ignoreHTTPSErrors = false, defaultViewport = util_js_1.DEFAULT_VIEWPORT, targetFilter, _isPageTarget: isPageTarget, slowMo = 0, protocolTimeout, } = options;
    const connection = new Connection_js_1.Connection(url, connectionTransport, slowMo, protocolTimeout);
    const version = await connection.send('Browser.getVersion');
    const product = version.product.toLowerCase().includes('firefox')
        ? 'firefox'
        : 'chrome';
    const { browserContextIds } = await connection.send('Target.getBrowserContexts');
    const browser = await Browser_js_1.CdpBrowser._create(product || 'chrome', connection, browserContextIds, ignoreHTTPSErrors, defaultViewport, undefined, () => {
        return connection.send('Browser.close').catch(util_js_1.debugError);
    }, targetFilter, isPageTarget);
    return browser;
}
exports._connectToCdpBrowser = _connectToCdpBrowser;
//# sourceMappingURL=BrowserConnector.js.map