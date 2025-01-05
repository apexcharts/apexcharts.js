"use strict";
/**
 * Copyright 2021 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapperServerCdpConnection = void 0;
const debug_1 = __importDefault(require("debug"));
const SimpleTransport_js_1 = require("./SimpleTransport.js");
const debugInternal = (0, debug_1.default)('bidi:mapper:internal');
const debugInfo = (0, debug_1.default)('bidi:mapper:info');
const debugOthers = (0, debug_1.default)('bidi:mapper:debug:others');
// Memorizes a debug creation
const loggers = new Map();
const getLogger = (type) => {
    const prefix = `bidi:mapper:${type}`;
    let logger = loggers.get(prefix);
    if (!logger) {
        logger = (0, debug_1.default)(prefix);
        loggers.set(prefix, logger);
    }
    return logger;
};
class MapperServerCdpConnection {
    #cdpConnection;
    #bidiSession;
    static async create(cdpConnection, mapperTabSource, verbose, mapperOptions) {
        try {
            const bidiSession = await this.#initMapper(cdpConnection, mapperTabSource, verbose, mapperOptions);
            return new MapperServerCdpConnection(cdpConnection, bidiSession);
        }
        catch (e) {
            cdpConnection.close();
            throw e;
        }
    }
    constructor(cdpConnection, bidiSession) {
        this.#cdpConnection = cdpConnection;
        this.#bidiSession = bidiSession;
    }
    static async #sendMessage(mapperCdpClient, message) {
        try {
            await mapperCdpClient.sendCommand('Runtime.evaluate', {
                expression: `onBidiMessage(${JSON.stringify(message)})`,
            });
        }
        catch (error) {
            debugInternal('Call to onBidiMessage failed', error);
        }
    }
    close() {
        this.#cdpConnection.close();
    }
    bidiSession() {
        return this.#bidiSession;
    }
    static #onBindingCalled = (params, bidiSession) => {
        if (params.name === 'sendBidiResponse') {
            bidiSession.emit('message', params.payload);
        }
        else if (params.name === 'sendDebugMessage') {
            this.#onDebugMessage(params.payload);
        }
    };
    static #onDebugMessage = (json) => {
        try {
            const log = JSON.parse(json);
            if (log.logType !== undefined && log.messages !== undefined) {
                const logger = getLogger(log.logType);
                logger(log.messages);
            }
        }
        catch {
            // Fall back to raw log in case of unknown
            debugOthers(json);
        }
    };
    static #onConsoleAPICalled = (params) => {
        debugInfo('consoleAPICalled: %s %O', params.type, params.args.map((arg) => arg.value));
    };
    static #onRuntimeExceptionThrown = (params) => {
        debugInfo('exceptionThrown:', params);
    };
    static async #initMapper(cdpConnection, mapperTabSource, verbose, mapperOptions) {
        debugInternal('Initializing Mapper.', mapperOptions);
        const browserClient = await cdpConnection.createBrowserSession();
        // Run mapper in the first open tab.
        const targets = (await cdpConnection.sendCommand('Target.getTargets', {}));
        const mapperTabTargetId = targets.targetInfos.filter((target) => target.type === 'page')[0].targetId;
        const { sessionId: mapperSessionId } = await browserClient.sendCommand('Target.attachToTarget', { targetId: mapperTabTargetId, flatten: true });
        const mapperCdpClient = cdpConnection.getCdpClient(mapperSessionId);
        // Click on the body to interact with the page in order to "beforeunload" being
        // triggered when the tab is closed.
        await mapperCdpClient.sendCommand('Runtime.evaluate', {
            expression: 'document.body.click()',
            userGesture: true,
        });
        // Create and activate new tab with a blank page.
        await browserClient.sendCommand('Target.createTarget', {
            url: 'about:blank',
        });
        const bidiSession = new SimpleTransport_js_1.SimpleTransport(async (message) => await this.#sendMessage(mapperCdpClient, message));
        // Process responses from the mapper tab.
        mapperCdpClient.on('Runtime.bindingCalled', (params) => this.#onBindingCalled(params, bidiSession));
        // Forward console messages from the mapper tab.
        mapperCdpClient.on('Runtime.consoleAPICalled', this.#onConsoleAPICalled);
        // Catch unhandled exceptions in the mapper.
        mapperCdpClient.on('Runtime.exceptionThrown', this.#onRuntimeExceptionThrown);
        await mapperCdpClient.sendCommand('Runtime.enable');
        await browserClient.sendCommand('Target.exposeDevToolsProtocol', {
            bindingName: 'cdp',
            targetId: mapperTabTargetId,
        });
        await mapperCdpClient.sendCommand('Runtime.addBinding', {
            name: 'sendBidiResponse',
        });
        if (verbose) {
            // Needed to request verbose logs from Mapper.
            await mapperCdpClient.sendCommand('Runtime.addBinding', {
                name: 'sendDebugMessage',
            });
        }
        // Evaluate Mapper Tab sources in the tab.
        await mapperCdpClient.sendCommand('Runtime.evaluate', {
            expression: mapperTabSource,
        });
        await mapperCdpClient.sendCommand('Runtime.evaluate', {
            expression: `window.runMapperInstance('${mapperTabTargetId}', ${JSON.stringify(mapperOptions)})`,
            awaitPromise: true,
        });
        debugInternal('Mapper is launched!');
        return bidiSession;
    }
}
exports.MapperServerCdpConnection = MapperServerCdpConnection;
//# sourceMappingURL=MapperCdpConnection.js.map