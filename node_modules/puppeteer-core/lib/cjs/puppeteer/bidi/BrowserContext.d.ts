/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Permission } from '../api/Browser.js';
import type { BrowserContextEvents } from '../api/BrowserContext.js';
import { BrowserContext } from '../api/BrowserContext.js';
import { type Page } from '../api/Page.js';
import type { Target } from '../api/Target.js';
import { EventEmitter } from '../common/EventEmitter.js';
import type { Viewport } from '../common/Viewport.js';
import type { BidiBrowser } from './Browser.js';
import { UserContext } from './core/UserContext.js';
import { BidiPage } from './Page.js';
/**
 * @internal
 */
export interface BidiBrowserContextOptions {
    defaultViewport: Viewport | null;
}
/**
 * @internal
 */
export declare class BidiBrowserContext extends BrowserContext {
    #private;
    static from(browser: BidiBrowser, userContext: UserContext, options: BidiBrowserContextOptions): BidiBrowserContext;
    accessor trustedEmitter: EventEmitter<BrowserContextEvents>;
    readonly userContext: UserContext;
    private constructor();
    targets(): Target[];
    newPage(): Promise<Page>;
    close(): Promise<void>;
    browser(): BidiBrowser;
    pages(): Promise<BidiPage[]>;
    isIncognito(): boolean;
    overridePermissions(origin: string, permissions: Permission[]): Promise<void>;
    clearPermissionOverrides(): Promise<void>;
    get id(): string | undefined;
}
//# sourceMappingURL=BrowserContext.d.ts.map