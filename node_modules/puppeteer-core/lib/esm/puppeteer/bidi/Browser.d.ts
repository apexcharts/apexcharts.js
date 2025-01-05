/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import type { ChildProcess } from 'child_process';
import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import { Browser, type BrowserCloseCallback, type BrowserContextOptions, type DebugInfo } from '../api/Browser.js';
import type { Page } from '../api/Page.js';
import type { Target } from '../api/Target.js';
import type { Viewport } from '../common/Viewport.js';
import { BidiBrowserContext } from './BrowserContext.js';
import type { BidiConnection } from './Connection.js';
import { BidiBrowserTarget } from './Target.js';
/**
 * @internal
 */
export interface BidiBrowserOptions {
    process?: ChildProcess;
    closeCallback?: BrowserCloseCallback;
    connection: BidiConnection;
    defaultViewport: Viewport | null;
    ignoreHTTPSErrors?: boolean;
}
/**
 * @internal
 */
export declare class BidiBrowser extends Browser {
    #private;
    readonly protocol = "webDriverBiDi";
    static readonly subscribeModules: [string, ...string[]];
    static readonly subscribeCdpEvents: Bidi.Cdp.EventNames[];
    static create(opts: BidiBrowserOptions): Promise<BidiBrowser>;
    private constructor();
    get cdpSupported(): boolean;
    userAgent(): Promise<string>;
    get connection(): BidiConnection;
    wsEndpoint(): string;
    close(): Promise<void>;
    get connected(): boolean;
    process(): ChildProcess | null;
    createBrowserContext(_options?: BrowserContextOptions): Promise<BidiBrowserContext>;
    version(): Promise<string>;
    browserContexts(): BidiBrowserContext[];
    defaultBrowserContext(): BidiBrowserContext;
    newPage(): Promise<Page>;
    targets(): Target[];
    target(): BidiBrowserTarget;
    disconnect(): Promise<void>;
    get debugInfo(): DebugInfo;
}
//# sourceMappingURL=Browser.d.ts.map