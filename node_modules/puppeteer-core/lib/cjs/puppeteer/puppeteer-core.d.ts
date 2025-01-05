/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
export * from './index.js';
import { PuppeteerNode } from './node/PuppeteerNode.js';
/**
 * @public
 */
declare const puppeteer: PuppeteerNode;
export declare const 
/**
 * @public
 */
connect: (options: import("./index.js").ConnectOptions) => Promise<import("./index.js").Browser>, 
/**
 * @public
 */
defaultArgs: (options?: import("./index.js").BrowserLaunchArgumentOptions) => string[], 
/**
 * @public
 */
executablePath: (channel?: import("./index.js").ChromeReleaseChannel | undefined) => string, 
/**
 * @public
 */
launch: (options?: import("./index.js").PuppeteerLaunchOptions) => Promise<import("./index.js").Browser>;
export default puppeteer;
//# sourceMappingURL=puppeteer-core.d.ts.map