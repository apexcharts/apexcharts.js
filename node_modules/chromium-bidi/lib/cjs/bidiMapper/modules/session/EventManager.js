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
exports.EventManager = void 0;
const protocol_js_1 = require("../../../protocol/protocol.js");
const Buffer_js_1 = require("../../../utils/Buffer.js");
const DefaultMap_js_1 = require("../../../utils/DefaultMap.js");
const DistinctValues_js_1 = require("../../../utils/DistinctValues.js");
const EventEmitter_js_1 = require("../../../utils/EventEmitter.js");
const IdWrapper_js_1 = require("../../../utils/IdWrapper.js");
const OutgoingMessage_js_1 = require("../../OutgoingMessage.js");
const events_js_1 = require("./events.js");
const SubscriptionManager_js_1 = require("./SubscriptionManager.js");
class EventWrapper {
    #idWrapper = new IdWrapper_js_1.IdWrapper();
    #contextId;
    #event;
    constructor(event, contextId) {
        this.#event = event;
        this.#contextId = contextId;
    }
    get id() {
        return this.#idWrapper.id;
    }
    get contextId() {
        return this.#contextId;
    }
    get event() {
        return this.#event;
    }
}
/**
 * Maps event name to a desired buffer length.
 */
const eventBufferLength = new Map([[protocol_js_1.ChromiumBidi.Log.EventNames.LogEntryAdded, 100]]);
class EventManager extends EventEmitter_js_1.EventEmitter {
    /**
     * Maps event name to a set of contexts where this event already happened.
     * Needed for getting buffered events from all the contexts in case of
     * subscripting to all contexts.
     */
    #eventToContextsMap = new DefaultMap_js_1.DefaultMap(() => new Set());
    /**
     * Maps `eventName` + `browsingContext` to buffer. Used to get buffered events
     * during subscription. Channel-agnostic.
     */
    #eventBuffers = new Map();
    /**
     * Maps `eventName` + `browsingContext` + `channel` to last sent event id.
     * Used to avoid sending duplicated events when user
     * subscribes -> unsubscribes -> subscribes.
     */
    #lastMessageSent = new Map();
    #subscriptionManager;
    #browsingContextStorage;
    /**
     * Map of event name to hooks to be called when client is subscribed to the event.
     */
    #subscribeHooks;
    constructor(browsingContextStorage) {
        super();
        this.#browsingContextStorage = browsingContextStorage;
        this.#subscriptionManager = new SubscriptionManager_js_1.SubscriptionManager(browsingContextStorage);
        this.#subscribeHooks = new DefaultMap_js_1.DefaultMap(() => []);
    }
    get subscriptionManager() {
        return this.#subscriptionManager;
    }
    /**
     * Returns consistent key to be used to access value maps.
     */
    static #getMapKey(eventName, browsingContext, channel) {
        return JSON.stringify({ eventName, browsingContext, channel });
    }
    addSubscribeHook(event, hook) {
        this.#subscribeHooks.get(event).push(hook);
    }
    registerEvent(event, contextId) {
        this.registerPromiseEvent(Promise.resolve({
            kind: 'success',
            value: event,
        }), contextId, event.method);
    }
    registerPromiseEvent(event, contextId, eventName) {
        const eventWrapper = new EventWrapper(event, contextId);
        const sortedChannels = this.#subscriptionManager.getChannelsSubscribedToEvent(eventName, contextId);
        this.#bufferEvent(eventWrapper, eventName);
        // Send events to channels in the subscription priority.
        for (const channel of sortedChannels) {
            this.emit("event" /* EventManagerEvents.Event */, {
                message: OutgoingMessage_js_1.OutgoingMessage.createFromPromise(event, channel),
                event: eventName,
            });
            this.#markEventSent(eventWrapper, channel, eventName);
        }
    }
    async subscribe(eventNames, contextIds, channel) {
        for (const name of eventNames) {
            (0, events_js_1.assertSupportedEvent)(name);
        }
        // First check if all the contexts are known.
        for (const contextId of contextIds) {
            if (contextId !== null) {
                // Assert the context is known. Throw exception otherwise.
                this.#browsingContextStorage.getContext(contextId);
            }
        }
        // List of the subscription items that were actually added. Each contains a specific
        // event and context. No domain event (like "network") or global context subscription
        // (like null) are included.
        const addedSubscriptionItems = [];
        for (const eventName of eventNames) {
            for (const contextId of contextIds) {
                addedSubscriptionItems.push(...this.#subscriptionManager.subscribe(eventName, contextId, channel));
                for (const eventWrapper of this.#getBufferedEvents(eventName, contextId, channel)) {
                    // The order of the events is important.
                    this.emit("event" /* EventManagerEvents.Event */, {
                        message: OutgoingMessage_js_1.OutgoingMessage.createFromPromise(eventWrapper.event, channel),
                        event: eventName,
                    });
                    this.#markEventSent(eventWrapper, channel, eventName);
                }
            }
        }
        // Iterate over all new subscription items and call hooks if any. There can be
        // duplicates, e.g. when subscribing to the whole domain and some specific event in
        // the same time ("network", "network.responseCompleted"). `distinctValues` guarantees
        // that hooks are called only once per pair event + context.
        (0, DistinctValues_js_1.distinctValues)(addedSubscriptionItems).forEach(({ contextId, event }) => {
            this.#subscribeHooks.get(event).forEach((hook) => hook(contextId));
        });
        await this.toggleModulesIfNeeded();
    }
    async unsubscribe(eventNames, contextIds, channel) {
        for (const name of eventNames) {
            (0, events_js_1.assertSupportedEvent)(name);
        }
        this.#subscriptionManager.unsubscribeAll(eventNames, contextIds, channel);
        await this.toggleModulesIfNeeded();
    }
    async toggleModulesIfNeeded() {
        // TODO(1): Only update changed subscribers
        // TODO(2): Enable for Worker Targets
        await Promise.all(this.#browsingContextStorage.getAllContexts().map(async (context) => {
            return await context.toggleModulesIfNeeded();
        }));
    }
    /**
     * If the event is buffer-able, put it in the buffer.
     */
    #bufferEvent(eventWrapper, eventName) {
        if (!eventBufferLength.has(eventName)) {
            // Do nothing if the event is no buffer-able.
            return;
        }
        const bufferMapKey = EventManager.#getMapKey(eventName, eventWrapper.contextId);
        if (!this.#eventBuffers.has(bufferMapKey)) {
            this.#eventBuffers.set(bufferMapKey, new Buffer_js_1.Buffer(eventBufferLength.get(eventName)));
        }
        this.#eventBuffers.get(bufferMapKey).add(eventWrapper);
        // Add the context to the list of contexts having `eventName` events.
        this.#eventToContextsMap.get(eventName).add(eventWrapper.contextId);
    }
    /**
     * If the event is buffer-able, mark it as sent to the given contextId and channel.
     */
    #markEventSent(eventWrapper, channel, eventName) {
        if (!eventBufferLength.has(eventName)) {
            // Do nothing if the event is no buffer-able.
            return;
        }
        const lastSentMapKey = EventManager.#getMapKey(eventName, eventWrapper.contextId, channel);
        this.#lastMessageSent.set(lastSentMapKey, Math.max(this.#lastMessageSent.get(lastSentMapKey) ?? 0, eventWrapper.id));
    }
    /**
     * Returns events which are buffered and not yet sent to the given channel events.
     */
    #getBufferedEvents(eventName, contextId, channel) {
        const bufferMapKey = EventManager.#getMapKey(eventName, contextId);
        const lastSentMapKey = EventManager.#getMapKey(eventName, contextId, channel);
        const lastSentMessageId = this.#lastMessageSent.get(lastSentMapKey) ?? -Infinity;
        const result = this.#eventBuffers
            .get(bufferMapKey)
            ?.get()
            .filter((wrapper) => wrapper.id > lastSentMessageId) ?? [];
        if (contextId === null) {
            // For global subscriptions, events buffered in each context should be sent back.
            Array.from(this.#eventToContextsMap.get(eventName).keys())
                .filter((_contextId) => 
            // Events without context are already in the result.
            _contextId !== null &&
                // Events from deleted contexts should not be sent.
                this.#browsingContextStorage.hasContext(_contextId))
                .map((_contextId) => this.#getBufferedEvents(eventName, _contextId, channel))
                .forEach((events) => result.push(...events));
        }
        return result.sort((e1, e2) => e1.id - e2.id);
    }
}
exports.EventManager = EventManager;
//# sourceMappingURL=EventManager.js.map