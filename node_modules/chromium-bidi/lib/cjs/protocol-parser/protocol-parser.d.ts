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
/**
 * @fileoverview Provides parsing and validator for WebDriver BiDi protocol.
 * Parser types should match the `../protocol` types.
 */
import { z, type ZodType } from 'zod';
import type * as Protocol from '../protocol/protocol.js';
export declare function parseObject<T extends ZodType>(obj: unknown, schema: T): z.infer<T>;
/** @see https://w3c.github.io/webdriver-bidi/#module-browser */
export declare namespace Browser {
    function parseRemoveUserContextParams(params: unknown): Protocol.Browser.RemoveUserContextParameters;
}
/** @see https://w3c.github.io/webdriver-bidi/#module-network */
export declare namespace Network {
    function parseAddInterceptParameters(params: unknown): Protocol.Network.AddInterceptParameters;
    function parseContinueRequestParameters(params: unknown): {
        request: string;
        url?: string | undefined;
        cookies?: {
            value: {
                type: "string";
                value: string;
            } | {
                type: "base64";
                value: string;
            };
            name: string;
        }[] | undefined;
        method?: string | undefined;
        body?: {
            type: "string";
            value: string;
        } | {
            type: "base64";
            value: string;
        } | undefined;
        headers?: {
            value: {
                type: "string";
                value: string;
            } | {
                type: "base64";
                value: string;
            };
            name: string;
        }[] | undefined;
    };
    function parseContinueResponseParameters(params: unknown): Protocol.Network.ContinueResponseParameters;
    function parseContinueWithAuthParameters(params: unknown): {
        request: string;
    } & ({
        credentials: {
            type: "password";
            password: string;
            username: string;
        };
        action: "provideCredentials";
    } | {
        action: "default" | "cancel";
    });
    function parseFailRequestParameters(params: unknown): {
        request: string;
    };
    function parseProvideResponseParameters(params: unknown): Protocol.Network.ProvideResponseParameters;
    function parseRemoveInterceptParameters(params: unknown): {
        intercept: string;
    };
}
/** @see https://w3c.github.io/webdriver-bidi/#module-script */
export declare namespace Script {
    function parseGetRealmsParams(params: unknown): Protocol.Script.GetRealmsParameters;
    function parseEvaluateParams(params: unknown): Protocol.Script.EvaluateParameters;
    function parseDisownParams(params: unknown): Protocol.Script.DisownParameters;
    function parseAddPreloadScriptParams(params: unknown): Protocol.Script.AddPreloadScriptParameters;
    function parseRemovePreloadScriptParams(params: unknown): {
        script: string;
    };
    function parseCallFunctionParams(params: unknown): Protocol.Script.CallFunctionParameters;
}
/** @see https://w3c.github.io/webdriver-bidi/#module-browsingContext */
export declare namespace BrowsingContext {
    function parseActivateParams(params: unknown): {
        context: string;
    };
    function parseGetTreeParams(params: unknown): Protocol.BrowsingContext.GetTreeParameters;
    function parseNavigateParams(params: unknown): Protocol.BrowsingContext.NavigateParameters;
    function parseReloadParams(params: unknown): Protocol.BrowsingContext.ReloadParameters;
    function parseCreateParams(params: unknown): Protocol.BrowsingContext.CreateParameters;
    function parseCloseParams(params: unknown): Protocol.BrowsingContext.CloseParameters;
    function parseCaptureScreenshotParams(params: unknown): Protocol.BrowsingContext.CaptureScreenshotParameters;
    function parsePrintParams(params: unknown): Protocol.BrowsingContext.PrintParameters;
    function parseSetViewportParams(params: unknown): Protocol.BrowsingContext.SetViewportParameters;
    function parseTraverseHistoryParams(params: unknown): Protocol.BrowsingContext.TraverseHistoryParameters;
    function parseHandleUserPromptParameters(params: unknown): Protocol.BrowsingContext.HandleUserPromptParameters;
    function parseLocateNodesParams(params: unknown): Protocol.BrowsingContext.LocateNodesParameters;
}
/** @see https://w3c.github.io/webdriver-bidi/#module-session */
export declare namespace Session {
    function parseSubscribeParams(params: unknown): Protocol.Session.SubscriptionRequest;
}
export declare namespace Input {
    function parsePerformActionsParams(params: unknown): Protocol.Input.PerformActionsParameters;
    function parseReleaseActionsParams(params: unknown): Protocol.Input.ReleaseActionsParameters;
    function parseSetFilesParams(params: unknown): Protocol.Input.SetFilesParameters;
}
export declare namespace Storage {
    function parseGetCookiesParams(params: unknown): Protocol.Storage.GetCookiesParameters;
    function parseSetCookieParams(params: unknown): Protocol.Storage.SetCookieParameters;
    function parseDeleteCookiesParams(params: unknown): Protocol.Storage.DeleteCookiesParameters;
}
export declare namespace Cdp {
    function parseSendCommandRequest(params: unknown): Protocol.Cdp.SendCommandParameters;
    function parseGetSessionRequest(params: unknown): Protocol.Cdp.GetSessionParameters;
    function parseResolveRealmRequest(params: unknown): Protocol.Cdp.ResolveRealmParameters;
}
export declare namespace Permissions {
    function parseSetPermissionsParams(params: unknown): Protocol.Permissions.SetPermissionParameters;
}
