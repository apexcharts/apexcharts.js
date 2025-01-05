/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
export type { Protocol } from 'puppeteer-core';
export * from 'puppeteer-core/internal/puppeteer-core.js';
import { PuppeteerNode } from 'puppeteer-core/internal/node/PuppeteerNode.js';
/**
 * @public
 */
declare const puppeteer: PuppeteerNode;
export declare const 
/**
 * @public
 */
connect: (options: import("puppeteer-core/internal/puppeteer-core.js").ConnectOptions) => Promise<import("puppeteer-core/internal/puppeteer-core.js").Browser>, 
/**
 * @public
 */
defaultArgs: (options?: import("puppeteer-core/internal/puppeteer-core.js").BrowserLaunchArgumentOptions | undefined) => string[], 
/**
 * @public
 */
executablePath: (channel?: import("puppeteer-core/internal/puppeteer-core.js").ChromeReleaseChannel | undefined) => string, 
/**
 * @public
 */
launch: (options?: import("puppeteer-core/internal/puppeteer-core.js").PuppeteerLaunchOptions | undefined) => Promise<import("puppeteer-core/internal/puppeteer-core.js").Browser>, 
/**
 * @public
 */
trimCache: () => Promise<void>;
export default puppeteer;
//# sourceMappingURL=puppeteer.d.ts.map