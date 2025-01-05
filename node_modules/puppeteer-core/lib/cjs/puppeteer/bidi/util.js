"use strict";
/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewriteNavigationError = exports.createEvaluationError = void 0;
const Errors_js_1 = require("../common/Errors.js");
const util_js_1 = require("../common/util.js");
const Deserializer_js_1 = require("./Deserializer.js");
/**
 * @internal
 */
function createEvaluationError(details) {
    if (details.exception.type !== 'error') {
        return Deserializer_js_1.BidiDeserializer.deserialize(details.exception);
    }
    const [name = '', ...parts] = details.text.split(': ');
    const message = parts.join(': ');
    const error = new Error(message);
    error.name = name;
    // The first line is this function which we ignore.
    const stackLines = [];
    if (details.stackTrace && stackLines.length < Error.stackTraceLimit) {
        for (const frame of details.stackTrace.callFrames.reverse()) {
            if (util_js_1.PuppeteerURL.isPuppeteerURL(frame.url) &&
                frame.url !== util_js_1.PuppeteerURL.INTERNAL_URL) {
                const url = util_js_1.PuppeteerURL.parse(frame.url);
                stackLines.unshift(`    at ${frame.functionName || url.functionName} (${url.functionName} at ${url.siteString}, <anonymous>:${frame.lineNumber}:${frame.columnNumber})`);
            }
            else {
                stackLines.push(`    at ${frame.functionName || '<anonymous>'} (${frame.url}:${frame.lineNumber}:${frame.columnNumber})`);
            }
            if (stackLines.length >= Error.stackTraceLimit) {
                break;
            }
        }
    }
    error.stack = [details.text, ...stackLines].join('\n');
    return error;
}
exports.createEvaluationError = createEvaluationError;
/**
 * @internal
 */
function rewriteNavigationError(message, ms) {
    return error => {
        if (error instanceof Errors_js_1.ProtocolError) {
            error.message += ` at ${message}`;
        }
        else if (error instanceof Errors_js_1.TimeoutError) {
            error.message = `Navigation timeout of ${ms} ms exceeded`;
        }
        throw error;
    };
}
exports.rewriteNavigationError = rewriteNavigationError;
//# sourceMappingURL=util.js.map