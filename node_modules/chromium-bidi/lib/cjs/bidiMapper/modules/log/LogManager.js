"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogManager = void 0;
const protocol_js_1 = require("../../../protocol/protocol.js");
const log_js_1 = require("../../../utils/log.js");
const logHelper_js_1 = require("./logHelper.js");
/** Converts CDP StackTrace object to BiDi StackTrace object. */
function getBidiStackTrace(cdpStackTrace) {
    const stackFrames = cdpStackTrace?.callFrames.map((callFrame) => {
        return {
            columnNumber: callFrame.columnNumber,
            functionName: callFrame.functionName,
            lineNumber: callFrame.lineNumber,
            url: callFrame.url,
        };
    });
    return stackFrames ? { callFrames: stackFrames } : undefined;
}
function getLogLevel(consoleApiType) {
    if (["error" /* Log.Level.Error */, 'assert'].includes(consoleApiType)) {
        return "error" /* Log.Level.Error */;
    }
    if (["debug" /* Log.Level.Debug */, 'trace'].includes(consoleApiType)) {
        return "debug" /* Log.Level.Debug */;
    }
    if (["warn" /* Log.Level.Warn */, 'warning'].includes(consoleApiType)) {
        return "warn" /* Log.Level.Warn */;
    }
    return "info" /* Log.Level.Info */;
}
class LogManager {
    #eventManager;
    #realmStorage;
    #cdpTarget;
    #logger;
    constructor(cdpTarget, realmStorage, eventManager, logger) {
        this.#cdpTarget = cdpTarget;
        this.#realmStorage = realmStorage;
        this.#eventManager = eventManager;
        this.#logger = logger;
    }
    static create(cdpTarget, realmStorage, eventManager, logger) {
        const logManager = new LogManager(cdpTarget, realmStorage, eventManager, logger);
        logManager.#initializeEntryAddedEventListener();
        return logManager;
    }
    #initializeEntryAddedEventListener() {
        this.#cdpTarget.cdpClient.on('Runtime.consoleAPICalled', (params) => {
            // Try to find realm by `cdpSessionId` and `executionContextId`,
            // if provided.
            const realm = this.#realmStorage.findRealm({
                cdpSessionId: this.#cdpTarget.cdpSessionId,
                executionContextId: params.executionContextId,
            });
            if (realm === undefined) {
                // Ignore exceptions not attached to any realm.
                this.#logger?.(log_js_1.LogType.cdp, params);
                return;
            }
            const argsPromise = realm === undefined
                ? Promise.resolve(params.args)
                : // Properly serialize arguments if possible.
                    Promise.all(params.args.map((arg) => {
                        return realm.serializeCdpObject(arg, "none" /* Script.ResultOwnership.None */);
                    }));
            for (const browsingContext of realm.associatedBrowsingContexts) {
                this.#eventManager.registerPromiseEvent(argsPromise.then((args) => ({
                    kind: 'success',
                    value: {
                        type: 'event',
                        method: protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded,
                        params: {
                            level: getLogLevel(params.type),
                            source: realm.source,
                            text: (0, logHelper_js_1.getRemoteValuesText)(args, true),
                            timestamp: Math.round(params.timestamp),
                            stackTrace: getBidiStackTrace(params.stackTrace),
                            type: 'console',
                            // Console method is `warn`, not `warning`.
                            method: params.type === 'warning' ? 'warn' : params.type,
                            args,
                        },
                    },
                }), (error) => ({
                    kind: 'error',
                    error,
                })), browsingContext.id, protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded);
            }
        });
        this.#cdpTarget.cdpClient.on('Runtime.exceptionThrown', (params) => {
            // Try to find realm by `cdpSessionId` and `executionContextId`,
            // if provided.
            const realm = this.#realmStorage.findRealm({
                cdpSessionId: this.#cdpTarget.cdpSessionId,
                executionContextId: params.exceptionDetails.executionContextId,
            });
            if (realm === undefined) {
                // Ignore exceptions not attached to any realm.
                this.#logger?.(log_js_1.LogType.cdp, params);
                return;
            }
            for (const browsingContext of realm.associatedBrowsingContexts) {
                this.#eventManager.registerPromiseEvent(LogManager.#getExceptionText(params, realm).then((text) => ({
                    kind: 'success',
                    value: {
                        type: 'event',
                        method: protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded,
                        params: {
                            level: "error" /* Log.Level.Error */,
                            source: realm.source,
                            text,
                            timestamp: Math.round(params.timestamp),
                            stackTrace: getBidiStackTrace(params.exceptionDetails.stackTrace),
                            type: 'javascript',
                        },
                    },
                }), (error) => ({
                    kind: 'error',
                    error,
                })), browsingContext.id, protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded);
            }
        });
    }
    /**
     * Try the best to get the exception text.
     */
    static async #getExceptionText(params, realm) {
        if (!params.exceptionDetails.exception) {
            return params.exceptionDetails.text;
        }
        if (realm === undefined) {
            return JSON.stringify(params.exceptionDetails.exception);
        }
        return await realm.stringifyObject(params.exceptionDetails.exception);
    }
}
exports.LogManager = LogManager;
//# sourceMappingURL=LogManager.js.map