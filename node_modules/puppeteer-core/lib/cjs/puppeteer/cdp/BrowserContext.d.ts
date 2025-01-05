/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Permission } from '../api/Browser.js';
import { BrowserContext } from '../api/BrowserContext.js';
import type { Page } from '../api/Page.js';
import type { CdpBrowser } from './Browser.js';
import type { Connection } from './Connection.js';
import type { CdpTarget } from './Target.js';
/**
 * @internal
 */
export declare class CdpBrowserContext extends BrowserContext {
    #private;
    constructor(connection: Connection, browser: CdpBrowser, contextId?: string);
    get id(): string | undefined;
    targets(): CdpTarget[];
    pages(): Promise<Page[]>;
    isIncognito(): boolean;
    overridePermissions(origin: string, permissions: Permission[]): Promise<void>;
    clearPermissionOverrides(): Promise<void>;
    newPage(): Promise<Page>;
    browser(): CdpBrowser;
    close(): Promise<void>;
}
//# sourceMappingURL=BrowserContext.d.ts.map