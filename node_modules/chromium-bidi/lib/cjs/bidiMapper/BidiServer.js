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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidiServer = void 0;
const EventEmitter_js_1 = require("../utils/EventEmitter.js");
const log_js_1 = require("../utils/log.js");
const ProcessingQueue_js_1 = require("../utils/ProcessingQueue.js");
const CommandProcessor_js_1 = require("./CommandProcessor.js");
const CdpTargetManager_js_1 = require("./modules/cdp/CdpTargetManager.js");
const BrowsingContextStorage_js_1 = require("./modules/context/BrowsingContextStorage.js");
const NetworkStorage_js_1 = require("./modules/network/NetworkStorage.js");
const PreloadScriptStorage_js_1 = require("./modules/script/PreloadScriptStorage.js");
const RealmStorage_js_1 = require("./modules/script/RealmStorage.js");
const EventManager_js_1 = require("./modules/session/EventManager.js");
class BidiServer extends EventEmitter_js_1.EventEmitter {
    #messageQueue;
    #transport;
    #commandProcessor;
    #eventManager;
    #browsingContextStorage = new BrowsingContextStorage_js_1.BrowsingContextStorage();
    #realmStorage = new RealmStorage_js_1.RealmStorage();
    #preloadScriptStorage = new PreloadScriptStorage_js_1.PreloadScriptStorage();
    #logger;
    #handleIncomingMessage = (message) => {
        void this.#commandProcessor.processCommand(message).catch((error) => {
            this.#logger?.(log_js_1.LogType.debugError, error);
        });
    };
    #processOutgoingMessage = async (messageEntry) => {
        const message = messageEntry.message;
        if (messageEntry.channel !== null) {
            message['channel'] = messageEntry.channel;
        }
        await this.#transport.sendMessage(message);
    };
    constructor(bidiTransport, cdpConnection, browserCdpClient, selfTargetId, defaultUserContextId, options, parser, logger) {
        super();
        this.#logger = logger;
        this.#messageQueue = new ProcessingQueue_js_1.ProcessingQueue(this.#processOutgoingMessage, this.#logger);
        this.#transport = bidiTransport;
        this.#transport.setOnMessage(this.#handleIncomingMessage);
        this.#eventManager = new EventManager_js_1.EventManager(this.#browsingContextStorage);
        const networkStorage = new NetworkStorage_js_1.NetworkStorage(this.#eventManager, browserCdpClient, logger);
        new CdpTargetManager_js_1.CdpTargetManager(cdpConnection, browserCdpClient, selfTargetId, this.#eventManager, this.#browsingContextStorage, this.#realmStorage, networkStorage, this.#preloadScriptStorage, options?.acceptInsecureCerts ?? false, defaultUserContextId, logger);
        this.#commandProcessor = new CommandProcessor_js_1.CommandProcessor(cdpConnection, browserCdpClient, this.#eventManager, this.#browsingContextStorage, this.#realmStorage, this.#preloadScriptStorage, networkStorage, parser, this.#logger);
        this.#eventManager.on("event" /* EventManagerEvents.Event */, ({ message, event }) => {
            this.emitOutgoingMessage(message, event);
        });
        this.#commandProcessor.on("response" /* CommandProcessorEvents.Response */, ({ message, event }) => {
            this.emitOutgoingMessage(message, event);
        });
    }
    /**
     * Creates and starts BiDi Mapper instance.
     */
    static async createAndStart(bidiTransport, cdpConnection, browserCdpClient, selfTargetId, options, parser, logger) {
        // The default context is not exposed in Target.getBrowserContexts but can
        // be observed via Target.getTargets. To determine the default browser
        // context, we check which one is mentioned in Target.getTargets and not in
        // Target.getBrowserContexts.
        const [{ browserContextIds }, { targetInfos }] = await Promise.all([
            browserCdpClient.sendCommand('Target.getBrowserContexts'),
            browserCdpClient.sendCommand('Target.getTargets'),
        ]);
        let defaultUserContextId = 'default';
        for (const info of targetInfos) {
            if (info.browserContextId &&
                !browserContextIds.includes(info.browserContextId)) {
                defaultUserContextId = info.browserContextId;
                break;
            }
        }
        const server = new BidiServer(bidiTransport, cdpConnection, browserCdpClient, selfTargetId, defaultUserContextId, options, parser, logger);
        // Needed to get events about new targets.
        await browserCdpClient.sendCommand('Target.setDiscoverTargets', {
            discover: true,
        });
        // Needed to automatically attach to new targets.
        await browserCdpClient.sendCommand('Target.setAutoAttach', {
            autoAttach: true,
            waitForDebuggerOnStart: true,
            flatten: true,
        });
        await server.#topLevelContextsLoaded();
        return server;
    }
    /**
     * Sends BiDi message.
     */
    emitOutgoingMessage(messageEntry, event) {
        this.#messageQueue.add(messageEntry, event);
    }
    close() {
        this.#transport.close();
    }
    async #topLevelContextsLoaded() {
        await Promise.all(this.#browsingContextStorage
            .getTopLevelContexts()
            .map((c) => c.lifecycleLoaded()));
    }
}
exports.BidiServer = BidiServer;
//# sourceMappingURL=BidiServer.js.map