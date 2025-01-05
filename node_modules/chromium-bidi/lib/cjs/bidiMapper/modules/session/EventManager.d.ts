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
import type { BidiPlusChannel } from '../../../protocol/chromium-bidi.js';
import { ChromiumBidi, type BrowsingContext } from '../../../protocol/protocol.js';
import { EventEmitter } from '../../../utils/EventEmitter.js';
import type { Result } from '../../../utils/result.js';
import { OutgoingMessage } from '../../OutgoingMessage.js';
import type { BrowsingContextStorage } from '../context/BrowsingContextStorage.js';
import { SubscriptionManager } from './SubscriptionManager.js';
export declare const enum EventManagerEvents {
    Event = "event"
}
type EventManagerEventsMap = {
    [EventManagerEvents.Event]: {
        message: Promise<Result<OutgoingMessage>>;
        event: string;
    };
};
/**
 * Subscription item is a pair of event name and context id.
 */
export type SubscriptionItem = {
    contextId: BrowsingContext.BrowsingContext;
    event: ChromiumBidi.EventNames;
};
export declare class EventManager extends EventEmitter<EventManagerEventsMap> {
    #private;
    constructor(browsingContextStorage: BrowsingContextStorage);
    get subscriptionManager(): SubscriptionManager;
    addSubscribeHook(event: ChromiumBidi.EventNames, hook: (contextId: BrowsingContext.BrowsingContext) => Promise<void>): void;
    registerEvent(event: ChromiumBidi.Event, contextId: BrowsingContext.BrowsingContext | null): void;
    registerPromiseEvent(event: Promise<Result<ChromiumBidi.Event>>, contextId: BrowsingContext.BrowsingContext | null, eventName: ChromiumBidi.EventNames): void;
    subscribe(eventNames: ChromiumBidi.EventNames[], contextIds: (BrowsingContext.BrowsingContext | null)[], channel: BidiPlusChannel): Promise<void>;
    unsubscribe(eventNames: ChromiumBidi.EventNames[], contextIds: (BrowsingContext.BrowsingContext | null)[], channel: BidiPlusChannel): Promise<void>;
    toggleModulesIfNeeded(): Promise<void>;
}
export {};
