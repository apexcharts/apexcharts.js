"use strict";
/**
 * @license
 * Copyright 2017 Google Inc.
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
exports.filterAsync = exports.fromAbortSignal = exports.fromEmitterEvent = exports.unitToPixels = exports.parsePDFOptions = exports.NETWORK_IDLE_TIME = exports.getSourceUrlComment = exports.SOURCE_URL_REGEX = exports.UTILITY_WORLD_NAME = exports.timeout = exports.validateDialogType = exports.getReadableFromProtocolStream = exports.getReadableAsBuffer = exports.importFSPromises = exports.evaluationString = exports.isDate = exports.isRegExp = exports.isPlainObject = exports.isNumber = exports.isString = exports.getSourcePuppeteerURLIfAvailable = exports.withSourcePuppeteerURLIfNone = exports.PuppeteerURL = exports.DEFAULT_VIEWPORT = exports.debugError = void 0;
const rxjs_js_1 = require("../../third_party/rxjs/rxjs.js");
const assert_js_1 = require("../util/assert.js");
const Debug_js_1 = require("./Debug.js");
const Errors_js_1 = require("./Errors.js");
const PDFOptions_js_1 = require("./PDFOptions.js");
/**
 * @internal
 */
exports.debugError = (0, Debug_js_1.debug)('puppeteer:error');
/**
 * @internal
 */
exports.DEFAULT_VIEWPORT = Object.freeze({ width: 800, height: 600 });
/**
 * @internal
 */
const SOURCE_URL = Symbol('Source URL for Puppeteer evaluation scripts');
/**
 * @internal
 */
class PuppeteerURL {
    static INTERNAL_URL = 'pptr:internal';
    static fromCallSite(functionName, site) {
        const url = new PuppeteerURL();
        url.#functionName = functionName;
        url.#siteString = site.toString();
        return url;
    }
    static parse = (url) => {
        url = url.slice('pptr:'.length);
        const [functionName = '', siteString = ''] = url.split(';');
        const puppeteerUrl = new PuppeteerURL();
        puppeteerUrl.#functionName = functionName;
        puppeteerUrl.#siteString = decodeURIComponent(siteString);
        return puppeteerUrl;
    };
    static isPuppeteerURL = (url) => {
        return url.startsWith('pptr:');
    };
    #functionName;
    #siteString;
    get functionName() {
        return this.#functionName;
    }
    get siteString() {
        return this.#siteString;
    }
    toString() {
        return `pptr:${[
            this.#functionName,
            encodeURIComponent(this.#siteString),
        ].join(';')}`;
    }
}
exports.PuppeteerURL = PuppeteerURL;
/**
 * @internal
 */
const withSourcePuppeteerURLIfNone = (functionName, object) => {
    if (Object.prototype.hasOwnProperty.call(object, SOURCE_URL)) {
        return object;
    }
    const original = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => {
        // First element is the function.
        // Second element is the caller of this function.
        // Third element is the caller of the caller of this function
        // which is precisely what we want.
        return stack[2];
    };
    const site = new Error().stack;
    Error.prepareStackTrace = original;
    return Object.assign(object, {
        [SOURCE_URL]: PuppeteerURL.fromCallSite(functionName, site),
    });
};
exports.withSourcePuppeteerURLIfNone = withSourcePuppeteerURLIfNone;
/**
 * @internal
 */
const getSourcePuppeteerURLIfAvailable = (object) => {
    if (Object.prototype.hasOwnProperty.call(object, SOURCE_URL)) {
        return object[SOURCE_URL];
    }
    return undefined;
};
exports.getSourcePuppeteerURLIfAvailable = getSourcePuppeteerURLIfAvailable;
/**
 * @internal
 */
const isString = (obj) => {
    return typeof obj === 'string' || obj instanceof String;
};
exports.isString = isString;
/**
 * @internal
 */
const isNumber = (obj) => {
    return typeof obj === 'number' || obj instanceof Number;
};
exports.isNumber = isNumber;
/**
 * @internal
 */
const isPlainObject = (obj) => {
    return typeof obj === 'object' && obj?.constructor === Object;
};
exports.isPlainObject = isPlainObject;
/**
 * @internal
 */
const isRegExp = (obj) => {
    return typeof obj === 'object' && obj?.constructor === RegExp;
};
exports.isRegExp = isRegExp;
/**
 * @internal
 */
const isDate = (obj) => {
    return typeof obj === 'object' && obj?.constructor === Date;
};
exports.isDate = isDate;
/**
 * @internal
 */
function evaluationString(fun, ...args) {
    if ((0, exports.isString)(fun)) {
        (0, assert_js_1.assert)(args.length === 0, 'Cannot evaluate a string with arguments');
        return fun;
    }
    function serializeArgument(arg) {
        if (Object.is(arg, undefined)) {
            return 'undefined';
        }
        return JSON.stringify(arg);
    }
    return `(${fun})(${args.map(serializeArgument).join(',')})`;
}
exports.evaluationString = evaluationString;
/**
 * @internal
 */
let fs = null;
/**
 * @internal
 */
async function importFSPromises() {
    if (!fs) {
        try {
            fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        }
        catch (error) {
            if (error instanceof TypeError) {
                throw new Error('Cannot write to a path outside of a Node-like environment.');
            }
            throw error;
        }
    }
    return fs;
}
exports.importFSPromises = importFSPromises;
/**
 * @internal
 */
async function getReadableAsBuffer(readable, path) {
    const buffers = [];
    const reader = readable.getReader();
    if (path) {
        const fs = await importFSPromises();
        const fileHandle = await fs.open(path, 'w+');
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                buffers.push(value);
                await fileHandle.writeFile(value);
            }
        }
        finally {
            await fileHandle.close();
        }
    }
    else {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            buffers.push(value);
        }
    }
    try {
        return Buffer.concat(buffers);
    }
    catch (error) {
        (0, exports.debugError)(error);
        return null;
    }
}
exports.getReadableAsBuffer = getReadableAsBuffer;
/**
 * @internal
 */
/**
 * @internal
 */
async function getReadableFromProtocolStream(client, handle) {
    return new ReadableStream({
        async pull(controller) {
            function getUnit8Array(data, isBase64) {
                if (isBase64) {
                    return Uint8Array.from(atob(data), m => {
                        return m.codePointAt(0);
                    });
                }
                const encoder = new TextEncoder();
                return encoder.encode(data);
            }
            const { data, base64Encoded, eof } = await client.send('IO.read', {
                handle,
            });
            controller.enqueue(getUnit8Array(data, base64Encoded ?? false));
            if (eof) {
                await client.send('IO.close', { handle });
                controller.close();
            }
        },
    });
}
exports.getReadableFromProtocolStream = getReadableFromProtocolStream;
/**
 * @internal
 */
function validateDialogType(type) {
    let dialogType = null;
    const validDialogTypes = new Set([
        'alert',
        'confirm',
        'prompt',
        'beforeunload',
    ]);
    if (validDialogTypes.has(type)) {
        dialogType = type;
    }
    (0, assert_js_1.assert)(dialogType, `Unknown javascript dialog type: ${type}`);
    return dialogType;
}
exports.validateDialogType = validateDialogType;
/**
 * @internal
 */
function timeout(ms, cause) {
    return ms === 0
        ? rxjs_js_1.NEVER
        : (0, rxjs_js_1.timer)(ms).pipe((0, rxjs_js_1.map)(() => {
            throw new Errors_js_1.TimeoutError(`Timed out after waiting ${ms}ms`, { cause });
        }));
}
exports.timeout = timeout;
/**
 * @internal
 */
exports.UTILITY_WORLD_NAME = '__puppeteer_utility_world__';
/**
 * @internal
 */
exports.SOURCE_URL_REGEX = /^[\040\t]*\/\/[@#] sourceURL=\s*(\S*?)\s*$/m;
/**
 * @internal
 */
function getSourceUrlComment(url) {
    return `//# sourceURL=${url}`;
}
exports.getSourceUrlComment = getSourceUrlComment;
/**
 * @internal
 */
exports.NETWORK_IDLE_TIME = 500;
/**
 * @internal
 */
function parsePDFOptions(options = {}, lengthUnit = 'in') {
    const defaults = {
        scale: 1,
        displayHeaderFooter: false,
        headerTemplate: '',
        footerTemplate: '',
        printBackground: false,
        landscape: false,
        pageRanges: '',
        preferCSSPageSize: false,
        omitBackground: false,
        outline: false,
        tagged: true,
    };
    let width = 8.5;
    let height = 11;
    if (options.format) {
        const format = PDFOptions_js_1.paperFormats[options.format.toLowerCase()];
        (0, assert_js_1.assert)(format, 'Unknown paper format: ' + options.format);
        width = format.width;
        height = format.height;
    }
    else {
        width = convertPrintParameterToInches(options.width, lengthUnit) ?? width;
        height =
            convertPrintParameterToInches(options.height, lengthUnit) ?? height;
    }
    const margin = {
        top: convertPrintParameterToInches(options.margin?.top, lengthUnit) || 0,
        left: convertPrintParameterToInches(options.margin?.left, lengthUnit) || 0,
        bottom: convertPrintParameterToInches(options.margin?.bottom, lengthUnit) || 0,
        right: convertPrintParameterToInches(options.margin?.right, lengthUnit) || 0,
    };
    // Quirk https://bugs.chromium.org/p/chromium/issues/detail?id=840455#c44
    if (options.outline) {
        options.tagged = true;
    }
    return {
        ...defaults,
        ...options,
        width,
        height,
        margin,
    };
}
exports.parsePDFOptions = parsePDFOptions;
/**
 * @internal
 */
exports.unitToPixels = {
    px: 1,
    in: 96,
    cm: 37.8,
    mm: 3.78,
};
function convertPrintParameterToInches(parameter, lengthUnit = 'in') {
    if (typeof parameter === 'undefined') {
        return undefined;
    }
    let pixels;
    if ((0, exports.isNumber)(parameter)) {
        // Treat numbers as pixel values to be aligned with phantom's paperSize.
        pixels = parameter;
    }
    else if ((0, exports.isString)(parameter)) {
        const text = parameter;
        let unit = text.substring(text.length - 2).toLowerCase();
        let valueText = '';
        if (unit in exports.unitToPixels) {
            valueText = text.substring(0, text.length - 2);
        }
        else {
            // In case of unknown unit try to parse the whole parameter as number of pixels.
            // This is consistent with phantom's paperSize behavior.
            unit = 'px';
            valueText = text;
        }
        const value = Number(valueText);
        (0, assert_js_1.assert)(!isNaN(value), 'Failed to parse parameter value: ' + text);
        pixels = value * exports.unitToPixels[unit];
    }
    else {
        throw new Error('page.pdf() Cannot handle parameter type: ' + typeof parameter);
    }
    return pixels / exports.unitToPixels[lengthUnit];
}
/**
 * @internal
 */
function fromEmitterEvent(emitter, eventName) {
    return new rxjs_js_1.Observable(subscriber => {
        const listener = (event) => {
            subscriber.next(event);
        };
        emitter.on(eventName, listener);
        return () => {
            emitter.off(eventName, listener);
        };
    });
}
exports.fromEmitterEvent = fromEmitterEvent;
/**
 * @internal
 */
function fromAbortSignal(signal, cause) {
    return signal
        ? (0, rxjs_js_1.fromEvent)(signal, 'abort').pipe((0, rxjs_js_1.map)(() => {
            if (signal.reason instanceof Error) {
                signal.reason.cause = cause;
                throw signal.reason;
            }
            throw new Error(signal.reason, { cause });
        }))
        : rxjs_js_1.NEVER;
}
exports.fromAbortSignal = fromAbortSignal;
/**
 * @internal
 */
function filterAsync(predicate) {
    return (0, rxjs_js_1.mergeMap)((value) => {
        return (0, rxjs_js_1.from)(Promise.resolve(predicate(value))).pipe((0, rxjs_js_1.filter)(isMatch => {
            return isMatch;
        }), (0, rxjs_js_1.map)(() => {
            return value;
        }));
    });
}
exports.filterAsync = filterAsync;
//# sourceMappingURL=util.js.map