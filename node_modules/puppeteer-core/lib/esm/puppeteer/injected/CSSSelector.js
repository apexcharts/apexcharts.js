/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
export const cssQuerySelector = (root, selector) => {
    // @ts-expect-error assume element root
    return root.querySelector(selector);
};
export const cssQuerySelectorAll = function (root, selector) {
    // @ts-expect-error assume element root
    return root.querySelectorAll(selector);
};
//# sourceMappingURL=CSSSelector.js.map