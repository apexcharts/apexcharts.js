/**
 * @license
 * Copyright 2019 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Protocol } from 'devtools-protocol';
import type { Browser } from '../api/Browser.js';
import type { BrowserContext } from '../api/BrowserContext.js';
import type { CDPSession } from '../api/CDPSession.js';
import { type Page } from '../api/Page.js';
import { Target, TargetType } from '../api/Target.js';
import type { Viewport } from '../common/Viewport.js';
import { Deferred } from '../util/Deferred.js';
import type { TargetManager } from './TargetManager.js';
import { CdpWebWorker } from './WebWorker.js';
/**
 * @internal
 */
export declare enum InitializationStatus {
    SUCCESS = "success",
    ABORTED = "aborted"
}
/**
 * @internal
 */
export declare class CdpTarget extends Target {
    #private;
    _initializedDeferred: Deferred<InitializationStatus, Error>;
    _isClosedDeferred: Deferred<void, Error>;
    _targetId: string;
    /**
     * To initialize the target for use, call initialize.
     *
     * @internal
     */
    constructor(targetInfo: Protocol.Target.TargetInfo, session: CDPSession | undefined, browserContext: BrowserContext | undefined, targetManager: TargetManager | undefined, sessionFactory: ((isAutoAttachEmulated: boolean) => Promise<CDPSession>) | undefined);
    asPage(): Promise<Page>;
    _subtype(): string | undefined;
    _session(): CDPSession | undefined;
    protected _sessionFactory(): (isAutoAttachEmulated: boolean) => Promise<CDPSession>;
    createCDPSession(): Promise<CDPSession>;
    url(): string;
    type(): TargetType;
    _targetManager(): TargetManager;
    _getTargetInfo(): Protocol.Target.TargetInfo;
    browser(): Browser;
    browserContext(): BrowserContext;
    opener(): Target | undefined;
    _targetInfoChanged(targetInfo: Protocol.Target.TargetInfo): void;
    _initialize(): void;
    _isTargetExposed(): boolean;
    protected _checkIfInitialized(): void;
}
/**
 * @internal
 */
export declare class PageTarget extends CdpTarget {
    #private;
    protected pagePromise?: Promise<Page>;
    constructor(targetInfo: Protocol.Target.TargetInfo, session: CDPSession | undefined, browserContext: BrowserContext, targetManager: TargetManager, sessionFactory: (isAutoAttachEmulated: boolean) => Promise<CDPSession>, defaultViewport: Viewport | null);
    _initialize(): void;
    page(): Promise<Page | null>;
    _checkIfInitialized(): void;
}
/**
 * @internal
 */
export declare class DevToolsTarget extends PageTarget {
}
/**
 * @internal
 */
export declare class WorkerTarget extends CdpTarget {
    #private;
    worker(): Promise<CdpWebWorker | null>;
}
/**
 * @internal
 */
export declare class OtherTarget extends CdpTarget {
}
//# sourceMappingURL=Target.d.ts.map