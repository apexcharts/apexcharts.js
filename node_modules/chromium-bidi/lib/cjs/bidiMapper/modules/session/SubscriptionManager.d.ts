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
import { type BrowsingContext, ChromiumBidi } from '../../../protocol/protocol.js';
import type { BrowsingContextStorage } from '../context/BrowsingContextStorage.js';
import type { SubscriptionItem } from './EventManager.js';
/**
 * Returns the cartesian product of the given arrays.
 *
 * Example:
 *   cartesian([1, 2], ['a', 'b']); => [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
 */
export declare function cartesianProduct(...a: any[][]): any[];
/** Expands "AllEvents" events into atomic events. */
export declare function unrollEvents(events: ChromiumBidi.EventNames[]): ChromiumBidi.EventNames[];
export declare class SubscriptionManager {
    #private;
    constructor(browsingContextStorage: BrowsingContextStorage);
    getChannelsSubscribedToEvent(eventMethod: ChromiumBidi.EventNames, contextId: BrowsingContext.BrowsingContext | null): BidiPlusChannel[];
    /**
     * @param module BiDi+ module
     * @param contextId `null` == globally subscribed
     *
     * @returns
     */
    isSubscribedTo(moduleOrEvent: ChromiumBidi.EventNames, contextId?: BrowsingContext.BrowsingContext | null): boolean;
    /**
     * Subscribes to event in the given context and channel.
     * @param {EventNames} event
     * @param {BrowsingContext.BrowsingContext | null} contextId
     * @param {BidiPlusChannel} channel
     * @return {SubscriptionItem[]} List of
     * subscriptions. If the event is a whole module, it will return all the specific
     * events. If the contextId is null, it will return all the top-level contexts which were
     * not subscribed before the command.
     */
    subscribe(event: ChromiumBidi.EventNames, contextId: BrowsingContext.BrowsingContext | null, channel: BidiPlusChannel): SubscriptionItem[];
    /**
     * Unsubscribes atomically from all events in the given contexts and channel.
     */
    unsubscribeAll(events: ChromiumBidi.EventNames[], contextIds: (BrowsingContext.BrowsingContext | null)[], channel: BidiPlusChannel): void;
    /**
     * Unsubscribes from the event in the given context and channel.
     * Syntactic sugar for "unsubscribeAll".
     */
    unsubscribe(eventName: ChromiumBidi.EventNames, contextId: BrowsingContext.BrowsingContext | null, channel: BidiPlusChannel): void;
}
