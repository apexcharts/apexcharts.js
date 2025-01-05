"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = exports.debugInfo = void 0;
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
const http_1 = __importDefault(require("http"));
const debug_1 = __importDefault(require("debug"));
const websocket = __importStar(require("websocket"));
const uuid_js_1 = require("../utils/uuid.js");
const BrowserInstance_js_1 = require("./BrowserInstance.js");
exports.debugInfo = (0, debug_1.default)('bidi:server:info');
const debugInternal = (0, debug_1.default)('bidi:server:internal');
const debugSend = (0, debug_1.default)('bidi:server:SEND ▸');
const debugRecv = (0, debug_1.default)('bidi:server:RECV ◂');
class WebSocketServer {
    #sessions = new Map();
    #port;
    #verbose;
    #server;
    #wsServer;
    constructor(port, verbose) {
        this.#port = port;
        this.#verbose = verbose;
        this.#server = http_1.default.createServer(this.#onRequest.bind(this));
        this.#wsServer = new websocket.server({
            httpServer: this.#server,
            autoAcceptConnections: false,
        });
        this.#wsServer.on('request', this.#onWsRequest.bind(this));
        void this.#listen();
    }
    #logServerStarted() {
        (0, exports.debugInfo)('BiDi server is listening on port', this.#port);
        (0, exports.debugInfo)('BiDi server was started successfully.');
    }
    async #listen() {
        try {
            this.#server.listen(this.#port, () => {
                this.#logServerStarted();
            });
        }
        catch (error) {
            if (error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 'EADDRINUSE') {
                await new Promise((resolve) => {
                    setTimeout(resolve, 500);
                });
                (0, exports.debugInfo)('Retrying to run BiDi server');
                this.#server.listen(this.#port, () => {
                    this.#logServerStarted();
                });
            }
            throw error;
        }
    }
    async #onRequest(request, response) {
        debugInternal(`Received HTTP ${JSON.stringify(request.method)} request for ${JSON.stringify(request.url)}`);
        if (!request.url) {
            return response.end(404);
        }
        // https://w3c.github.io/webdriver-bidi/#transport, step 2.
        if (request.url === '/session') {
            const body = await new Promise((resolve, reject) => {
                const bodyArray = [];
                request.on('data', (chunk) => {
                    bodyArray.push(chunk);
                });
                request.on('error', reject);
                request.on('end', () => {
                    resolve(Buffer.concat(bodyArray));
                });
            });
            debugInternal(`Creating session by HTTP request ${body.toString()}`);
            // https://w3c.github.io/webdriver-bidi/#transport, step 3.
            const jsonBody = JSON.parse(body.toString());
            response.writeHead(200, {
                'Content-Type': 'application/json;charset=utf-8',
                'Cache-Control': 'no-cache',
            });
            const sessionId = (0, uuid_js_1.uuidv4)();
            const session = {
                sessionId,
                // TODO: launch browser instance and set it to the session after WPT
                //  tests clean up is switched to pure BiDi.
                browserInstancePromise: undefined,
                sessionOptions: {
                    chromeOptions: this.#getChromeOptions(jsonBody.capabilities),
                    mapperOptions: this.#getMapperOptions(jsonBody.capabilities),
                    verbose: this.#verbose,
                },
            };
            this.#sessions.set(sessionId, session);
            const webSocketUrl = `ws://localhost:${this.#port}/session/${sessionId}`;
            debugInternal(`Session created. WebSocket URL: ${JSON.stringify(webSocketUrl)}.`);
            response.write(JSON.stringify({
                value: {
                    sessionId,
                    capabilities: {
                        webSocketUrl,
                    },
                },
            }));
            return response.end();
        }
        else if (request.url.startsWith('/session')) {
            debugInternal(`Unknown session command ${request.method ?? 'UNKNOWN METHOD'} request for ${request.url} with payload ${await this.#getHttpRequestPayload(request)}. 200 returned.`);
            response.writeHead(200, {
                'Content-Type': 'application/json;charset=utf-8',
                'Cache-Control': 'no-cache',
            });
            response.write(JSON.stringify({
                value: {},
            }));
            return response.end();
        }
        debugInternal(`Unknown ${request.method} request for ${JSON.stringify(request.url)} with payload ${await this.#getHttpRequestPayload(request)}. 404 returned.`);
        return response.end(404);
    }
    #onWsRequest(request) {
        // Session is set either by Classic or BiDi commands.
        let session;
        // Request to `/session` should be treated as a new session request.
        let requestSessionId = '';
        if ((request.resource ?? '').startsWith(`/session/`)) {
            requestSessionId = (request.resource ?? '').split('/').pop() ?? '';
        }
        debugInternal(`new WS request received. Path: ${JSON.stringify(request.resourceURL.path)}, sessionId: ${JSON.stringify(requestSessionId)}`);
        if (requestSessionId !== '' &&
            requestSessionId !== undefined &&
            !this.#sessions.has(requestSessionId)) {
            debugInternal('Unknown session id:', requestSessionId);
            request.reject();
            return;
        }
        const connection = request.accept();
        session = this.#sessions.get(requestSessionId ?? '');
        if (session !== undefined) {
            // BrowserInstance is created for each new WS connection, even for the
            // same SessionId. This is because WPT uses a single session for all the
            // tests, but cleans up tests using WebDriver Classic commands, which is
            // not implemented in this Mapper runner.
            // TODO: connect to an existing BrowserInstance instead.
            const sessionOptions = session.sessionOptions;
            session.browserInstancePromise = this.#closeBrowserInstanceIfLaunched(session)
                .then(async () => await this.#launchBrowserInstance(connection, sessionOptions))
                .catch((e) => {
                (0, exports.debugInfo)('Error while creating session', e);
                connection.close(500, 'cannot create browser instance');
                throw e;
            });
        }
        connection.on('message', async (message) => {
            // If type is not text, return error.
            if (message.type !== 'utf8') {
                this.#respondWithError(connection, {}, "invalid argument" /* ErrorCode.InvalidArgument */, `not supported type (${message.type})`);
                return;
            }
            const plainCommandData = message.utf8Data;
            if (debugRecv.enabled) {
                try {
                    debugRecv(JSON.parse(plainCommandData));
                }
                catch {
                    debugRecv(plainCommandData);
                }
            }
            // Try to parse the message to handle some of BiDi commands.
            let parsedCommandData;
            try {
                parsedCommandData = JSON.parse(plainCommandData);
            }
            catch (e) {
                this.#respondWithError(connection, {}, "invalid argument" /* ErrorCode.InvalidArgument */, `Cannot parse data as JSON`);
                return;
            }
            // Handle creating new session.
            if (parsedCommandData.method === 'session.new') {
                if (session !== undefined) {
                    (0, exports.debugInfo)('WS connection already have an associated session.');
                    this.#respondWithError(connection, plainCommandData, "session not created" /* ErrorCode.SessionNotCreated */, 'WS connection already have an associated session.');
                    return;
                }
                try {
                    const sessionOptions = {
                        chromeOptions: this.#getChromeOptions(parsedCommandData.params?.capabilities),
                        mapperOptions: this.#getMapperOptions(parsedCommandData.params?.capabilities),
                        verbose: this.#verbose,
                    };
                    const browserInstance = await this.#launchBrowserInstance(connection, sessionOptions);
                    const sessionId = (0, uuid_js_1.uuidv4)();
                    session = {
                        sessionId,
                        browserInstancePromise: Promise.resolve(browserInstance),
                        sessionOptions,
                    };
                    this.#sessions.set(sessionId, session);
                }
                catch (e) {
                    (0, exports.debugInfo)('Error while creating session', e);
                    this.#respondWithError(connection, plainCommandData, "session not created" /* ErrorCode.SessionNotCreated */, e?.message ?? 'Unknown error');
                    return;
                }
                // TODO: extend with capabilities.
                this.#sendClientMessage({
                    id: parsedCommandData.id,
                    type: 'success',
                    result: {
                        sessionId: session.sessionId,
                        capabilities: {},
                    },
                }, connection);
                return;
            }
            // Handle ending session. Close browser if open, remove session.
            if (parsedCommandData.method === 'session.end') {
                if (session === undefined) {
                    (0, exports.debugInfo)('WS connection does not have an associated session.');
                    this.#respondWithError(connection, plainCommandData, "session not created" /* ErrorCode.SessionNotCreated */, 'WS connection does not have an associated session.');
                    return;
                }
                try {
                    await this.#closeBrowserInstanceIfLaunched(session);
                    this.#sessions.delete(session.sessionId);
                }
                catch (e) {
                    (0, exports.debugInfo)('Error while closing session', e);
                    this.#respondWithError(connection, plainCommandData, "unknown error" /* ErrorCode.UnknownError */, `Session cannot be closed. Error: ${e?.message}`);
                    return;
                }
                this.#sendClientMessage({
                    id: parsedCommandData.id,
                    type: 'success',
                    result: {},
                }, connection);
                return;
            }
            if (session === undefined) {
                (0, exports.debugInfo)('Session is not yet initialized.');
                this.#respondWithError(connection, plainCommandData, "invalid session id" /* ErrorCode.InvalidSessionId */, 'Session is not yet initialized.');
                return;
            }
            if (session.browserInstancePromise === undefined) {
                (0, exports.debugInfo)('Browser instance is not launched.');
                this.#respondWithError(connection, plainCommandData, "invalid session id" /* ErrorCode.InvalidSessionId */, 'Browser instance is not launched.');
                return;
            }
            const browserInstance = await session.browserInstancePromise;
            // Handle `browser.close` command.
            if (parsedCommandData.method === 'browser.close') {
                await browserInstance.close();
                this.#sendClientMessage({
                    id: parsedCommandData.id,
                    type: 'success',
                    result: {},
                }, connection);
                return;
            }
            // Forward all other commands to BiDi Mapper.
            await browserInstance.bidiSession().sendCommand(plainCommandData);
        });
        connection.on('close', async () => {
            debugInternal(`Peer ${connection.remoteAddress} disconnected.`);
            // TODO: don't close Browser instance to allow re-connecting to the session.
            await this.#closeBrowserInstanceIfLaunched(session);
        });
    }
    async #closeBrowserInstanceIfLaunched(session) {
        if (session === undefined || session.browserInstancePromise === undefined) {
            return;
        }
        const browserInstance = await session.browserInstancePromise;
        session.browserInstancePromise = undefined;
        void browserInstance.close();
    }
    #getMapperOptions(capabilities) {
        const acceptInsecureCerts = capabilities?.alwaysMatch?.acceptInsecureCerts ?? false;
        return { acceptInsecureCerts };
    }
    #getChromeOptions(capabilities) {
        const chromeCapabilities = capabilities?.alwaysMatch?.['goog:chromeOptions'];
        return {
            chromeArgs: chromeCapabilities?.args ?? [],
            chromeBinary: chromeCapabilities?.binary ?? undefined,
        };
    }
    async #launchBrowserInstance(connection, sessionOptions) {
        (0, exports.debugInfo)('Scheduling browser launch...');
        const browserInstance = await BrowserInstance_js_1.BrowserInstance.run(sessionOptions.chromeOptions, sessionOptions.mapperOptions, sessionOptions.verbose);
        // Forward messages from BiDi Mapper to the client unconditionally.
        browserInstance.bidiSession().on('message', (message) => {
            this.#sendClientMessageString(message, connection);
        });
        (0, exports.debugInfo)('Browser is launched!');
        return browserInstance;
    }
    #sendClientMessageString(message, connection) {
        if (debugSend.enabled) {
            try {
                debugSend(JSON.parse(message));
            }
            catch {
                debugSend(message);
            }
        }
        connection.sendUTF(message);
    }
    #sendClientMessage(object, connection) {
        const json = JSON.stringify(object);
        return this.#sendClientMessageString(json, connection);
    }
    #respondWithError(connection, plainCommandData, errorCode, errorMessage) {
        const errorResponse = this.#getErrorResponse(plainCommandData, errorCode, errorMessage);
        void this.#sendClientMessage(errorResponse, connection);
    }
    #getErrorResponse(plainCommandData, errorCode, errorMessage) {
        // XXX: this is bizarre per spec. We reparse the payload and
        // extract the ID, regardless of what kind of value it was.
        let commandId;
        try {
            const commandData = JSON.parse(plainCommandData);
            if ('id' in commandData) {
                commandId = commandData.id;
            }
        }
        catch { }
        return {
            type: 'error',
            id: commandId,
            error: errorCode,
            message: errorMessage,
            // XXX: optional stacktrace field.
        };
    }
    #getHttpRequestPayload(request) {
        return new Promise((resolve, reject) => {
            let data = '';
            request.on('data', (chunk) => {
                data += chunk;
            });
            request.on('end', () => {
                resolve(data);
            });
            request.on('error', (error) => {
                reject(error);
            });
        });
    }
}
exports.WebSocketServer = WebSocketServer;
//# sourceMappingURL=WebSocketServer.js.map