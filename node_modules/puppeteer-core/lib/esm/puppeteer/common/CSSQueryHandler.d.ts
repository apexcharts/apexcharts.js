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
export declare class CSSQueryHandler extends QueryHandler {
    static querySelector: (element: Node, selector: string, { cssQuerySelector }: PuppeteerUtil) => Node | null;
    static querySelectorAll: (element: Node, selector: string, { cssQuerySelectorAll }: PuppeteerUtil) => Iterable<Node>;
}
//# sourceMappingURL=CSSQueryHandler.d.ts.map