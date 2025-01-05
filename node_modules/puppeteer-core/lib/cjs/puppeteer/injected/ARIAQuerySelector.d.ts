/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
declare global {
    interface Window {
        /**
         * @internal
         */
        __ariaQuerySelector(root: Node, selector: string): Promise<Node | null>;
        /**
         * @internal
         */
        __ariaQuerySelectorAll(root: Node, selector: string): Promise<Node[]>;
    }
}
export declare const ariaQuerySelector: (root: Node, selector: string) => Promise<Node | null>;
export declare const ariaQuerySelectorAll: (root: Node, selector: string) => AsyncIterable<Node>;
//# sourceMappingURL=ARIAQuerySelector.d.ts.map