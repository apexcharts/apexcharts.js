/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type PuppeteerUtil from '../injected/injected.js';
import { QueryHandler } from './QueryHandler.js';
/**
 * @internal
 */
export declare class PierceQueryHandler extends QueryHandler {
    static querySelector: (element: Node, selector: string, { pierceQuerySelector }: PuppeteerUtil) => Node | null;
    static querySelectorAll: (element: Node, selector: string, { pierceQuerySelectorAll }: PuppeteerUtil) => Iterable<Node>;
}
//# sourceMappingURL=PierceQueryHandler.d.ts.map