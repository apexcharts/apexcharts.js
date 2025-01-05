/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { WEB_PERMISSION_TO_PROTOCOL_PERMISSION, } from '../api/Browser.js';
import { BrowserContext } from '../api/BrowserContext.js';
import { assert } from '../util/assert.js';
/**
 * @internal
 */
export class CdpBrowserContext extends BrowserContext {
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
            const protocolPermission = WEB_PERMISSION_TO_PROTOCOL_PERMISSION.get(permission);
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
        assert(this.#id, 'Non-incognito profiles cannot be closed!');
        await this.#browser._disposeContext(this.#id);
    }
}
//# sourceMappingURL=BrowserContext.js.map