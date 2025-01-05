"use strict";
/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdpBrowserContext = void 0;
const Browser_js_1 = require("../api/Browser.js");
const BrowserContext_js_1 = require("../api/BrowserContext.js");
const assert_js_1 = require("../util/assert.js");
/**
 * @internal
 */
class CdpBrowserContext extends BrowserContext_js_1.BrowserContext {
    #connection;
    #browser;
    #id;
    constructor(connection, browser, contextId) {
        super();
        this.#connection = connection;
        this.#browser = browser;
        this.#id = contextId;
    }
    get id() {
        return this.#id;
    }
    targets() {
        return this.#browser.targets().filter(target => {
            return target.browserContext() === this;
        });
    }
    async pages() {
        const pages = await Promise.all(this.targets()
            .filter(target => {
            return (target.type() === 'page' ||
                (target.type() === 'other' &&
                    this.#browser._getIsPageTargetCallback()?.(target)));
        })
            .map(target => {
            return target.page();
        }));
        return pages.filter((page) => {
            return !!page;
        });
    }
    isIncognito() {
        return !!this.#id;
    }
    async overridePermissions(origin, permissions) {
        const protocolPermissions = permissions.map(permission => {
            const protocolPermission = Browser_js_1.WEB_PERMISSION_TO_PROTOCOL_PERMISSION.get(permission);
            if (!protocolPermission) {
                throw new Error('Unknown permission: ' + permission);
            }
            return protocolPermission;
        });
        await this.#connection.send('Browser.grantPermissions', {
            origin,
            browserContextId: this.#id || undefined,
            permissions: protocolPermissions,
        });
    }
    async clearPermissionOverrides() {
        await this.#connection.send('Browser.resetPermissions', {
            browserContextId: this.#id || undefined,
        });
    }
    newPage() {
        return this.#browser._createPageInContext(this.#id);
    }
    browser() {
        return this.#browser;
    }
    async close() {
        (0, assert_js_1.assert)(this.#id, 'Non-incognito profiles cannot be closed!');
        await this.#browser._disposeContext(this.#id);
    }
}
exports.CdpBrowserContext = CdpBrowserContext;
//# sourceMappingURL=BrowserContext.js.map