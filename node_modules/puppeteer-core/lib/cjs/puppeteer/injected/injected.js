"use strict";
/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Deferred_js_1 = require("../util/Deferred.js");
const Function_js_1 = require("../util/Function.js");
const ARIAQuerySelector = __importStar(require("./ARIAQuerySelector.js"));
const CSSSelector = __importStar(require("./CSSSelector.js"));
const CustomQuerySelectors = __importStar(require("./CustomQuerySelector.js"));
const PierceQuerySelector = __importStar(require("./PierceQuerySelector.js"));
const Poller_js_1 = require("./Poller.js");
const PQuerySelector = __importStar(require("./PQuerySelector.js"));
const TextContent_js_1 = require("./TextContent.js");
const TextQuerySelector = __importStar(require("./TextQuerySelector.js"));
const util = __importStar(require("./util.js"));
const XPathQuerySelector = __importStar(require("./XPathQuerySelector.js"));
/**
 * @internal
 */
const PuppeteerUtil = Object.freeze({
    ...ARIAQuerySelector,
    ...CustomQuerySelectors,
    ...PierceQuerySelector,
    ...PQuerySelector,
    ...TextQuerySelector,
    ...util,
    ...XPathQuerySelector,
    ...CSSSelector,
    Deferred: Deferred_js_1.Deferred,
    createFunction: Function_js_1.createFunction,
    createTextContent: TextContent_js_1.createTextContent,
    IntervalPoller: Poller_js_1.IntervalPoller,
    isSuitableNodeForTextMatching: TextContent_js_1.isSuitableNodeForTextMatching,
    MutationPoller: Poller_js_1.MutationPoller,
    RAFPoller: Poller_js_1.RAFPoller,
});
/**
 * @internal
 */
exports.default = PuppeteerUtil;
//# sourceMappingURL=injected.js.map