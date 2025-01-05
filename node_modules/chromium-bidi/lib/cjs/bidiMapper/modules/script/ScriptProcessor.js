"use strict";
/**
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
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptProcessor = void 0;
const protocol_js_1 = require("../../../protocol/protocol.js");
const PreloadScript_js_1 = require("./PreloadScript.js");
class ScriptProcessor {
    #browsingContextStorage;
    #realmStorage;
    #preloadScriptStorage;
    #logger;
    constructor(browsingContextStorage, realmStorage, preloadScriptStorage, logger) {
        this.#browsingContextStorage = browsingContextStorage;
        this.#realmStorage = realmStorage;
        this.#preloadScriptStorage = preloadScriptStorage;
        this.#logger = logger;
    }
    async addPreloadScript(params) {
        const contexts = this.#browsingContextStorage.verifyTopLevelContextsList(params.contexts);
        const preloadScript = new PreloadScript_js_1.PreloadScript(params, this.#logger);
        this.#preloadScriptStorage.add(preloadScript);
        const cdpTargets = contexts.size === 0
            ? new Set(this.#browsingContextStorage
                .getTopLevelContexts()
                .map((context) => context.cdpTarget))
            : new Set([...contexts.values()].map((context) => context.cdpTarget));
        await preloadScript.initInTargets(cdpTargets, false);
        return {
            script: preloadScript.id,
        };
    }
    async removePreloadScript(params) {
        const { script: id } = params;
        const scripts = this.#preloadScriptStorage.find({ id });
        if (scripts.length === 0) {
            throw new protocol_js_1.NoSuchScriptException(`No preload script with id '${id}'`);
        }
        await Promise.all(scripts.map((script) => script.remove()));
        this.#preloadScriptStorage.remove({ id });
        return {};
    }
    async callFunction(params) {
        const realm = await this.#getRealm(params.target);
        return await realm.callFunction(params.functionDeclaration, params.awaitPromise, params.this, params.arguments, params.resultOwnership, params.serializationOptions, params.userActivation);
    }
    async evaluate(params) {
        const realm = await this.#getRealm(params.target);
        return await realm.evaluate(params.expression, params.awaitPromise, params.resultOwnership, params.serializationOptions, params.userActivation);
    }
    async disown(params) {
        const realm = await this.#getRealm(params.target);
        await Promise.all(params.handles.map(async (handle) => await realm.disown(handle)));
        return {};
    }
    getRealms(params) {
        if (params.context !== undefined) {
            // Make sure the context is known.
            this.#browsingContextStorage.getContext(params.context);
        }
        const realms = this.#realmStorage
            .findRealms({
            browsingContextId: params.context,
            type: params.type,
        })
            .map((realm) => realm.realmInfo);
        return { realms };
    }
    async #getRealm(target) {
        if ('context' in target) {
            const context = this.#browsingContextStorage.getContext(target.context);
            return await context.getOrCreateSandbox(target.sandbox);
        }
        return this.#realmStorage.getRealm({
            realmId: target.realm,
        });
    }
}
exports.ScriptProcessor = ScriptProcessor;
//# sourceMappingURL=ScriptProcessor.js.map