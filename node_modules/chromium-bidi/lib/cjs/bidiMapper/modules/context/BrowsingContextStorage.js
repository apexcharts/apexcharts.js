"use strict";
/**
 * Copyright 2022 Google LLC.
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
exports.BrowsingContextStorage = void 0;
const protocol_js_1 = require("../../../protocol/protocol.js");
/** Container class for browsing contexts. */
class BrowsingContextStorage {
    /** Map from context ID to context implementation. */
    #contexts = new Map();
    /** Gets all top-level contexts, i.e. those with no parent. */
    getTopLevelContexts() {
        return this.getAllContexts().filter((context) => context.isTopLevelContext());
    }
    /** Gets all contexts. */
    getAllContexts() {
        return Array.from(this.#contexts.values());
    }
    /** Deletes the context with the given ID. */
    deleteContextById(id) {
        this.#contexts.delete(id);
    }
    /** Deletes the given context. */
    deleteContext(context) {
        this.#contexts.delete(context.id);
    }
    /** Tracks the given context. */
    addContext(context) {
        this.#contexts.set(context.id, context);
    }
    /** Returns true whether there is an existing context with the given ID. */
    hasContext(id) {
        return this.#contexts.has(id);
    }
    /** Gets the context with the given ID, if any. */
    findContext(id) {
        return this.#contexts.get(id);
    }
    /** Returns the top-level context ID of the given context, if any. */
    findTopLevelContextId(id) {
        if (id === null) {
            return null;
        }
        const maybeContext = this.findContext(id);
        const parentId = maybeContext?.parentId ?? null;
        if (parentId === null) {
            return id;
        }
        return this.findTopLevelContextId(parentId);
    }
    findContextBySession(sessionId) {
        for (const context of this.#contexts.values()) {
            if (context.cdpTarget.cdpSessionId === sessionId) {
                return context;
            }
        }
        return;
    }
    /** Gets the context with the given ID, if any, otherwise throws. */
    getContext(id) {
        const result = this.findContext(id);
        if (result === undefined) {
            throw new protocol_js_1.NoSuchFrameException(`Context ${id} not found`);
        }
        return result;
    }
    verifyTopLevelContextsList(contexts) {
        const foundContexts = new Set();
        if (!contexts) {
            return foundContexts;
        }
        for (const contextId of contexts) {
            const context = this.getContext(contextId);
            if (context.isTopLevelContext()) {
                foundContexts.add(context);
            }
            else {
                throw new protocol_js_1.InvalidArgumentException(`Non top-level context '${contextId}' given.`);
            }
        }
        return foundContexts;
    }
}
exports.BrowsingContextStorage = BrowsingContextStorage;
//# sourceMappingURL=BrowsingContextStorage.js.map