/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';
import type { CDPSession } from '../api/CDPSession.js';
import { Frame, type GoToOptions, type WaitForOptions } from '../api/Frame.js';
import { Accessibility } from '../cdp/Accessibility.js';
import type { TimeoutSettings } from '../common/TimeoutSettings.js';
import type { Awaitable } from '../common/types.js';
import { BidiCdpSession } from './CDPSession.js';
import type { BrowsingContext } from './core/BrowsingContext.js';
import type { BidiElementHandle } from './ElementHandle.js';
import type { BidiHTTPResponse } from './HTTPResponse.js';
import type { BidiPage } from './Page.js';
import type { BidiRealm } from './Realm.js';
import { BidiFrameRealm } from './Realm.js';
export declare class BidiFrame extends Frame {
    #private;
    static from(parent: BidiPage | BidiFrame, browsingContext: BrowsingContext): BidiFrame;
    readonly browsingContext: BrowsingContext;
    readonly realms: {
        default: BidiFrameRealm;
        internal: BidiFrameRealm;
    };
    readonly _id: string;
    readonly client: BidiCdpSession;
    readonly accessibility: Accessibility;
    private constructor();
    get timeoutSettings(): TimeoutSettings;
    mainRealm(): BidiFrameRealm;
    isolatedRealm(): BidiFrameRealm;
    realm(id: string): BidiRealm | undefined;
    page(): BidiPage;
    isOOPFrame(): never;
    url(): string;
    parentFrame(): BidiFrame | null;
    childFrames(): BidiFrame[];
    goto(url: string, options?: GoToOptions): Promise<BidiHTTPResponse | null>;
    setContent(html: string, options?: WaitForOptions): Promise<void>;
    waitForNavigation(options?: WaitForOptions): Promise<BidiHTTPResponse | null>;
    waitForDevicePrompt(): never;
    get detached(): boolean;
    exposeFunction<Args extends unknown[], Ret>(name: string, apply: (...args: Args) => Awaitable<Ret>): Promise<void>;
    removeExposedFunction(name: string): Promise<void>;
    createCDPSession(): Promise<CDPSession>;
    setFiles(element: BidiElementHandle, files: string[]): Promise<void>;
    locateNodes(element: BidiElementHandle, locator: Bidi.BrowsingContext.Locator): Promise<Bidi.Script.NodeRemoteValue[]>;
}
//# sourceMappingURL=Frame.d.ts.map