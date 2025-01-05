/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TargetFilterCallback } from '../api/Browser.js';
import { type CDPSession } from '../api/CDPSession.js';
import { EventEmitter } from '../common/EventEmitter.js';
import type { Connection } from './Connection.js';
import type { CdpTarget } from './Target.js';
import { type TargetFactory, type TargetManager, type TargetManagerEvents } from './TargetManager.js';
/**
 * FirefoxTargetManager implements target management using
 * `Target.setDiscoverTargets` without using auto-attach. It, therefore, creates
 * targets that lazily establish their CDP sessions.
 *
 * Although the approach is potentially flaky, there is no other way for Firefox
 * because Firefox's CDP implementation does not support auto-attach.
 *
 * Firefox does not support targetInfoChanged and detachedFromTarget events:
 *
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1610855
 * - https://bugzilla.mozilla.org/show_bug.cgi?id=1636979
 *   @internal
 */
export declare class FirefoxTargetManager extends EventEmitter<TargetManagerEvents> implements TargetManager {
    #private;
    constructor(connection: Connection, targetFactory: TargetFactory, targetFilterCallback?: TargetFilterCallback);
    setupAttachmentListeners(session: CDPSession | Connection): void;
    removeSessionListeners(session: CDPSession): void;
    getAvailableTargets(): ReadonlyMap<string, CdpTarget>;
    dispose(): void;
    initialize(): Promise<void>;
}
//# sourceMappingURL=FirefoxTargetManager.d.ts.map