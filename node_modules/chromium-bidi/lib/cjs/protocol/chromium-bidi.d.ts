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
import type * as Cdp from './cdp.js';
import type * as WebDriverBidiPermissions from './generated/webdriver-bidi-permissions.js';
import type * as WebDriverBidi from './generated/webdriver-bidi.js';
export type EventNames = Cdp.EventNames | `${BiDiModule}` | `${BrowsingContext.EventNames}` | `${Log.EventNames}` | `${Network.EventNames}` | `${Script.EventNames}`;
export declare enum BiDiModule {
    Browser = "browser",
    BrowsingContext = "browsingContext",
    Cdp = "cdp",
    Input = "input",
    Log = "log",
    Network = "network",
    Script = "script",
    Session = "session"
}
export declare namespace Script {
    enum EventNames {
        Message = "script.message",
        RealmCreated = "script.realmCreated",
        RealmDestroyed = "script.realmDestroyed"
    }
}
export declare namespace Log {
    enum EventNames {
        LogEntryAdded = "log.entryAdded"
    }
}
export declare namespace BrowsingContext {
    enum EventNames {
        ContextCreated = "browsingContext.contextCreated",
        ContextDestroyed = "browsingContext.contextDestroyed",
        DomContentLoaded = "browsingContext.domContentLoaded",
        DownloadWillBegin = "browsingContext.downloadWillBegin",
        FragmentNavigated = "browsingContext.fragmentNavigated",
        Load = "browsingContext.load",
        NavigationAborted = "browsingContext.navigationAborted",
        NavigationFailed = "browsingContext.navigationFailed",
        NavigationStarted = "browsingContext.navigationStarted",
        UserPromptClosed = "browsingContext.userPromptClosed",
        UserPromptOpened = "browsingContext.userPromptOpened"
    }
}
export declare namespace Network {
    enum EventNames {
        AuthRequired = "network.authRequired",
        BeforeRequestSent = "network.beforeRequestSent",
        FetchError = "network.fetchError",
        ResponseCompleted = "network.responseCompleted",
        ResponseStarted = "network.responseStarted"
    }
}
export type Command = (WebDriverBidi.Command | Cdp.Command | ({
    id: WebDriverBidi.JsUint;
} & WebDriverBidiPermissions.PermissionsCommand)) & {
    channel?: WebDriverBidi.Script.Channel;
};
export type CommandResponse = WebDriverBidi.CommandResponse | Cdp.CommandResponse;
export type Event = WebDriverBidi.Event | Cdp.Event;
export declare const EVENT_NAMES: Set<BiDiModule | BrowsingContext.EventNames | Log.EventNames.LogEntryAdded | Network.EventNames | Script.EventNames>;
export type ResultData = WebDriverBidi.ResultData | Cdp.ResultData;
export type BidiPlusChannel = string | null;
export type Message = (WebDriverBidi.Message | Cdp.Message) & {
    channel?: BidiPlusChannel;
};
