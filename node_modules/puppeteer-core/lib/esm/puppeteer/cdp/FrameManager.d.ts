/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import { type CDPSession } from '../api/CDPSession.js';
import { EventEmitter } from '../common/EventEmitter.js';
import type { TimeoutSettings } from '../common/TimeoutSettings.js';
import { CdpCDPSession } from './CDPSession.js';
import { DeviceRequestPromptManager } from './DeviceRequestPrompt.js';
import { CdpFrame } from './Frame.js';
import type { FrameManagerEvents } from './FrameManagerEvents.js';
import { FrameTree } from './FrameTree.js';
import { NetworkManager } from './NetworkManager.js';
import type { CdpPage } from './Page.js';
import type { CdpTarget } from './Target.js';
/**
 * A frame manager manages the frames for a given {@link Page | page}.
 *
 * @internal
 */
export declare class FrameManager extends EventEmitter<FrameManagerEvents> {
    #private;
    _frameTree: FrameTree<CdpFrame>;
    get timeoutSettings(): TimeoutSettings;
    get networkManager(): NetworkManager;
    get client(): CDPSession;
    constructor(client: CDPSession, page: CdpPage, timeoutSettings: TimeoutSettings);
    /**
     * When the main frame is replaced by another main frame,
     * we maintain the main frame object identity while updating
     * its frame tree and ID.
     */
    swapFrameTree(client: CDPSession): Promise<void>;
    registerSpeculativeSession(client: CdpCDPSession): Promise<void>;
    private setupEventListeners;
    initialize(client: CDPSession): Promise<void>;
    page(): CdpPage;
    mainFrame(): CdpFrame;
    frames(): CdpFrame[];
    frame(frameId: string): CdpFrame | null;
    onAttachedToTarget(target: CdpTarget): void;
    _deviceRequestPromptManager(client: CDPSession): DeviceRequestPromptManager;
}
//# sourceMappingURL=FrameManager.d.ts.map