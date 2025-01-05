"use strict";
/*
 * Copyright 2023 Google LLC.
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
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserInstance = void 0;
const promises_1 = require("fs/promises");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const browsers_1 = require("@puppeteer/browsers");
const debug_1 = __importDefault(require("debug"));
const ws_1 = __importDefault(require("ws"));
const CdpConnection_js_1 = require("../cdp/CdpConnection.js");
const WebsocketTransport_js_1 = require("../utils/WebsocketTransport.js");
const MapperCdpConnection_js_1 = require("./MapperCdpConnection.js");
const reader_js_1 = require("./reader.js");
const debugInternal = (0, debug_1.default)('bidi:mapper:internal');
/**
 * BrowserProcess is responsible for running the browser and BiDi Mapper within
 * it.
 * 1. Launch Chromium (using Puppeteer for now).
 * 2. Get `BiDi-CDP` mapper JS binaries using `MapperReader`.
 * 3. Run `BiDi-CDP` mapper in launched browser using `MapperRunner`.
 * 4. Bind `BiDi-CDP` mapper to the `BiDi server` to forward messages from BiDi
 * Mapper to the client.
 */
class BrowserInstance {
    #mapperCdpConnection;
    #browserProcess;
    static async run(chromeOptions, mapperOptions, verbose) {
        const profileDir = await (0, promises_1.mkdtemp)(path_1.default.join(os_1.default.tmpdir(), 'web-driver-bidi-server-'));
        // See https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md
        const chromeArguments = [
            // keep-sorted start
            '--allow-browser-signin=false',
            '--disable-component-update',
            '--disable-default-apps',
            '--disable-features=DialMediaRouteProvider,TrackingProtection3pcd',
            '--disable-infobars',
            '--disable-notifications',
            '--disable-popup-blocking',
            '--disable-search-engine-choice-screen',
            '--enable-automation',
            '--no-default-browser-check',
            '--no-first-run',
            '--password-store=basic',
            '--remote-debugging-port=9222',
            '--use-mock-keychain',
            `--user-data-dir=${profileDir}`,
            // keep-sorted end
            ...chromeOptions.chromeArgs,
            'about:blank',
        ];
        const executablePath = chromeOptions.chromeBinary ?? process.env['BROWSER_BIN'];
        if (!executablePath) {
            throw new Error('Could not find Chrome binary');
        }
        const launchArguments = {
            executablePath,
            args: chromeArguments,
            env: process.env,
        };
        debugInternal(`Launching browser`, launchArguments);
        const browserProcess = (0, browsers_1.launch)(launchArguments);
        const cdpEndpoint = await browserProcess.waitForLineOutput(browsers_1.CDP_WEBSOCKET_ENDPOINT_REGEX);
        // There is a conflict between prettier and eslint here.
        // prettier-ignore
        const cdpConnection = await this.#establishCdpConnection(cdpEndpoint);
        // 2. Get `BiDi-CDP` mapper JS binaries.
        const mapperTabSource = await (0, reader_js_1.getMapperTabSource)();
        // 3. Run `BiDi-CDP` mapper in launched browser using `MapperRunner`.
        const mapperCdpConnection = await MapperCdpConnection_js_1.MapperServerCdpConnection.create(cdpConnection, mapperTabSource, verbose, mapperOptions);
        return new BrowserInstance(mapperCdpConnection, browserProcess);
    }
    constructor(mapperCdpConnection, browserProcess) {
        this.#mapperCdpConnection = mapperCdpConnection;
        this.#browserProcess = browserProcess;
    }
    async close() {
        // Close the mapper tab.
        this.#mapperCdpConnection.close();
        // Close browser.
        await this.#browserProcess.close();
    }
    bidiSession() {
        return this.#mapperCdpConnection.bidiSession();
    }
    static #establishCdpConnection(cdpUrl) {
        return new Promise((resolve, reject) => {
            debugInternal('Establishing session with cdpUrl: ', cdpUrl);
            const ws = new ws_1.default(cdpUrl);
            ws.once('error', reject);
            ws.on('open', () => {
                debugInternal('Session established.');
                const transport = new WebsocketTransport_js_1.WebSocketTransport(ws);
                const connection = new CdpConnection_js_1.MapperCdpConnection(transport);
                resolve(connection);
            });
        });
    }
}
exports.BrowserInstance = BrowserInstance;
//# sourceMappingURL=BrowserInstance.js.map