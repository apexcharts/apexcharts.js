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
import type { CdpClient } from '../../../cdp/CdpClient.js';
import type { BidiPlusChannel } from '../../../protocol/chromium-bidi.js';
import type { EmptyResult, Session } from '../../../protocol/protocol.js';
import type { EventManager } from './EventManager.js';
export declare class SessionProcessor {
    #private;
    constructor(eventManager: EventManager, browserCdpClient: CdpClient);
    status(): Session.StatusResult;
    create(_params: Session.NewParameters): Promise<Session.NewResult>;
    subscribe(params: Session.SubscriptionRequest, channel?: BidiPlusChannel): Promise<EmptyResult>;
    unsubscribe(params: Session.SubscriptionRequest, channel?: BidiPlusChannel): Promise<EmptyResult>;
}
