/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Browser } from '../api/Browser.js';
import type { BrowserLaunchArgumentOptions, ChromeReleaseChannel, PuppeteerNodeLaunchOptions } from './LaunchOptions.js';
import { ProductLauncher, type ResolvedLaunchArgs } from './ProductLauncher.js';
import type { PuppeteerNode } from './PuppeteerNode.js';
/**
 * @internal
 */
export declare class ChromeLauncher extends ProductLauncher {
    constructor(puppeteer: PuppeteerNode);
    launch(options?: PuppeteerNodeLaunchOptions): Promise<Browser>;
    /**
     * @internal
     */
    computeLaunchArguments(options?: PuppeteerNodeLaunchOptions): Promise<ResolvedLaunchArgs>;
    /**
     * @internal
     */
    cleanUserDataDir(path: string, opts: {
        isTemp: boolean;
    }): Promise<void>;
    defaultArgs(options?: BrowserLaunchArgumentOptions): string[];
    executablePath(channel?: ChromeReleaseChannel, headless?: boolean | 'shell'): string;
}
/**
 * Extracts all features from the given command-line flag
 * (e.g. `--enable-features`, `--enable-features=`).
 *
 * Example input:
 * ["--enable-features=NetworkService,NetworkServiceInProcess", "--enable-features=Foo"]
 *
 * Example output:
 * ["NetworkService", "NetworkServiceInProcess", "Foo"]
 *
 * @internal
 */
export declare function getFeatures(flag: string, options?: string[]): string[];
/**
 * Removes all elements in-place from the given string array
 * that match the given command-line flag.
 *
 * @internal
 */
export declare function removeMatchingFlags(array: string[], flag: string): string[];
//# sourceMappingURL=ChromeLauncher.d.ts.map