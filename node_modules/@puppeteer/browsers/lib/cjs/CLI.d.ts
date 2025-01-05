/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/// <reference types="node" />
import * as readline from 'readline';
import { type Browser } from './browser-data/browser-data.js';
/**
 * @public
 */
export declare class CLI {
    #private;
    constructor(opts?: string | {
        cachePath?: string;
        scriptName?: string;
        prefixCommand?: {
            cmd: string;
            description: string;
        };
        allowCachePathOverride?: boolean;
        pinnedBrowsers?: Partial<{
            [key in Browser]: string;
        }>;
    }, rl?: readline.Interface);
    run(argv: string[]): Promise<void>;
}
/**
 * @public
 */
export declare function makeProgressCallback(browser: Browser, buildId: string): (downloadedBytes: number, totalBytes: number) => void;
//# sourceMappingURL=CLI.d.ts.map