/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TargetFilterCallback } from '../api/Browser.js';
import { EventEmitter } from '../common/EventEmitter.js';
import type { Connection } from './Connection.js';
import { CdpTarget } from './Target.js';
import { type TargetFactory, type TargetManager, type TargetManagerEvents } from './TargetManager.js';
/**
 * ChromeTargetManager uses the CDP's auto-attach mechanism to intercept
 * new targets and allow the rest of Puppeteer to configure listeners while
 * the target is paused.
 *
 * @internal
 */
export declare class ChromeTargetManager extends EventEmitter<TargetManagerEvents> implements TargetManager {
    #private;
    constructor(connection: Connection, targetFactory: TargetFactory, targetFilterCallback?: TargetFilterCallback, waitForInitiallyDiscoveredTargets?: boolean);
    initialize(): Promise<void>;
    dispose(): void;
    getAvailableTargets(): ReadonlyMap<string, CdpTarget>;
}
//# sourceMappingURL=ChromeTargetManager.d.ts.map