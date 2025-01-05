/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type { JSHandle } from '../api/JSHandle.js';
import type PuppeteerUtil from '../injected/injected.js';
/**
 * @internal
 */
export interface PuppeteerUtilWrapper {
    puppeteerUtil: Promise<JSHandle<PuppeteerUtil>>;
}
/**
 * @internal
 */
export declare class LazyArg<T, Context = PuppeteerUtilWrapper> {
    #private;
    static create: <T_1>(get: (context: PuppeteerUtilWrapper) => T_1 | Promise<T_1>) => T_1;
    private constructor();
    get(context: Context): Promise<T>;
}
//# sourceMappingURL=LazyArg.d.ts.map