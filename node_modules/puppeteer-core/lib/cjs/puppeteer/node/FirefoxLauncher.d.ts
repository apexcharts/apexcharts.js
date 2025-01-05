/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BrowserLaunchArgumentOptions, PuppeteerNodeLaunchOptions } from './LaunchOptions.js';
import { ProductLauncher, type ResolvedLaunchArgs } from './ProductLauncher.js';
import type { PuppeteerNode } from './PuppeteerNode.js';
/**
 * @internal
 */
export declare class FirefoxLauncher extends ProductLauncher {
    constructor(puppeteer: PuppeteerNode);
    static getPreferences(extraPrefsFirefox?: Record<string, unknown>, protocol?: 'cdp' | 'webDriverBiDi'): Record<string, unknown>;
    /**
     * @internal
     */
    computeLaunchArguments(options?: PuppeteerNodeLaunchOptions): Promise<ResolvedLaunchArgs>;
    /**
     * @internal
     */
    cleanUserDataDir(userDataDir: string, opts: {
        isTemp: boolean;
    }): Promise<void>;
    executablePath(): string;
    defaultArgs(options?: BrowserLaunchArgumentOptions): string[];
}
//# sourceMappingURL=FirefoxLauncher.d.ts.map