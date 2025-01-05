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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permissions = exports.Cdp = exports.Storage = exports.Input = exports.Session = exports.BrowsingContext = exports.Script = exports.Network = exports.Browser = exports.parseObject = void 0;
/**
 * @fileoverview Provides parsing and validator for WebDriver BiDi protocol.
 * Parser types should match the `../protocol` types.
 */
const zod_1 = require("zod");
const protocol_js_1 = require("../protocol/protocol.js");
const WebDriverBidiPermissions = __importStar(require("./generated/webdriver-bidi-permissions.js"));
const WebDriverBidi = __importStar(require("./generated/webdriver-bidi.js"));
function parseObject(obj, schema) {
    const parseResult = schema.safeParse(obj);
    if (parseResult.success) {
        return parseResult.data;
    }
    const errorMessage = parseResult.error.errors
        .map((e) => `${e.message} in ` +
        `${e.path.map((p) => JSON.stringify(p)).join('/')}.`)
        .join(' ');
    throw new protocol_js_1.InvalidArgumentException(errorMessage);
}
exports.parseObject = parseObject;
/** @see https://w3c.github.io/webdriver-bidi/#module-browser */
var Browser;
(function (Browser) {
    function parseRemoveUserContextParams(params) {
        return parseObject(params, WebDriverBidi.Browser.RemoveUserContextParametersSchema);
    }
    Browser.parseRemoveUserContextParams = parseRemoveUserContextParams;
})(Browser || (exports.Browser = Browser = {}));
/** @see https://w3c.github.io/webdriver-bidi/#module-network */
var Network;
(function (Network) {
    function parseAddInterceptParameters(params) {
        // Work around of `cddlconv` https://github.com/google/cddlconv/issues/19.
        return parseObject(params, WebDriverBidi.Network.AddInterceptParametersSchema);
    }
    Network.parseAddInterceptParameters = parseAddInterceptParameters;
    function parseContinueRequestParameters(params) {
        return parseObject(params, WebDriverBidi.Network.ContinueRequestParametersSchema);
    }
    Network.parseContinueRequestParameters = parseContinueRequestParameters;
    function parseContinueResponseParameters(params) {
        // TODO: remove cast after https://github.com/google/cddlconv/issues/19 is fixed.
        return parseObject(params, WebDriverBidi.Network.ContinueResponseParametersSchema);
    }
    Network.parseContinueResponseParameters = parseContinueResponseParameters;
    function parseContinueWithAuthParameters(params) {
        return parseObject(params, WebDriverBidi.Network.ContinueWithAuthParametersSchema);
    }
    Network.parseContinueWithAuthParameters = parseContinueWithAuthParameters;
    function parseFailRequestParameters(params) {
        return parseObject(params, WebDriverBidi.Network.FailRequestParametersSchema);
    }
    Network.parseFailRequestParameters = parseFailRequestParameters;
    function parseProvideResponseParameters(params) {
        // TODO: remove cast after https://github.com/google/cddlconv/issues/19 is fixed.
        return parseObject(params, WebDriverBidi.Network.ProvideResponseParametersSchema);
    }
    Network.parseProvideResponseParameters = parseProvideResponseParameters;
    function parseRemoveInterceptParameters(params) {
        return parseObject(params, WebDriverBidi.Network.RemoveInterceptParametersSchema);
    }
    Network.parseRemoveInterceptParameters = parseRemoveInterceptParameters;
})(Network || (exports.Network = Network = {}));
/** @see https://w3c.github.io/webdriver-bidi/#module-script */
var Script;
(function (Script) {
    function parseGetRealmsParams(params) {
        return parseObject(params, WebDriverBidi.Script.GetRealmsParametersSchema);
    }
    Script.parseGetRealmsParams = parseGetRealmsParams;
    function parseEvaluateParams(params) {
        return parseObject(params, WebDriverBidi.Script.EvaluateParametersSchema);
    }
    Script.parseEvaluateParams = parseEvaluateParams;
    function parseDisownParams(params) {
        return parseObject(params, WebDriverBidi.Script.DisownParametersSchema);
    }
    Script.parseDisownParams = parseDisownParams;
    function parseAddPreloadScriptParams(params) {
        return parseObject(params, WebDriverBidi.Script.AddPreloadScriptParametersSchema);
    }
    Script.parseAddPreloadScriptParams = parseAddPreloadScriptParams;
    function parseRemovePreloadScriptParams(params) {
        return parseObject(params, WebDriverBidi.Script.RemovePreloadScriptParametersSchema);
    }
    Script.parseRemovePreloadScriptParams = parseRemovePreloadScriptParams;
    function parseCallFunctionParams(params) {
        return parseObject(params, WebDriverBidi.Script.CallFunctionParametersSchema);
    }
    Script.parseCallFunctionParams = parseCallFunctionParams;
})(Script || (exports.Script = Script = {}));
/** @see https://w3c.github.io/webdriver-bidi/#module-browsingContext */
var BrowsingContext;
(function (BrowsingContext) {
    function parseActivateParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.ActivateParametersSchema);
    }
    BrowsingContext.parseActivateParams = parseActivateParams;
    function parseGetTreeParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.GetTreeParametersSchema);
    }
    BrowsingContext.parseGetTreeParams = parseGetTreeParams;
    function parseNavigateParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.NavigateParametersSchema);
    }
    BrowsingContext.parseNavigateParams = parseNavigateParams;
    function parseReloadParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.ReloadParametersSchema);
    }
    BrowsingContext.parseReloadParams = parseReloadParams;
    function parseCreateParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.CreateParametersSchema);
    }
    BrowsingContext.parseCreateParams = parseCreateParams;
    function parseCloseParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.CloseParametersSchema);
    }
    BrowsingContext.parseCloseParams = parseCloseParams;
    function parseCaptureScreenshotParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.CaptureScreenshotParametersSchema);
    }
    BrowsingContext.parseCaptureScreenshotParams = parseCaptureScreenshotParams;
    function parsePrintParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.PrintParametersSchema);
    }
    BrowsingContext.parsePrintParams = parsePrintParams;
    function parseSetViewportParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.SetViewportParametersSchema);
    }
    BrowsingContext.parseSetViewportParams = parseSetViewportParams;
    function parseTraverseHistoryParams(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.TraverseHistoryParametersSchema);
    }
    BrowsingContext.parseTraverseHistoryParams = parseTraverseHistoryParams;
    function parseHandleUserPromptParameters(params) {
        return parseObject(params, WebDriverBidi.BrowsingContext.HandleUserPromptParametersSchema);
    }
    BrowsingContext.parseHandleUserPromptParameters = parseHandleUserPromptParameters;
    function parseLocateNodesParams(params) {
        // TODO: remove cast after https://github.com/google/cddlconv/issues/19 is fixed.
        return parseObject(params, WebDriverBidi.BrowsingContext.LocateNodesParametersSchema);
    }
    BrowsingContext.parseLocateNodesParams = parseLocateNodesParams;
})(BrowsingContext || (exports.BrowsingContext = BrowsingContext = {}));
/** @see https://w3c.github.io/webdriver-bidi/#module-session */
var Session;
(function (Session) {
    function parseSubscribeParams(params) {
        return parseObject(params, WebDriverBidi.Session.SubscriptionRequestSchema);
    }
    Session.parseSubscribeParams = parseSubscribeParams;
})(Session || (exports.Session = Session = {}));
var Input;
(function (Input) {
    function parsePerformActionsParams(params) {
        return parseObject(params, WebDriverBidi.Input.PerformActionsParametersSchema);
    }
    Input.parsePerformActionsParams = parsePerformActionsParams;
    function parseReleaseActionsParams(params) {
        return parseObject(params, WebDriverBidi.Input.ReleaseActionsParametersSchema);
    }
    Input.parseReleaseActionsParams = parseReleaseActionsParams;
    function parseSetFilesParams(params) {
        return parseObject(params, WebDriverBidi.Input.SetFilesParametersSchema);
    }
    Input.parseSetFilesParams = parseSetFilesParams;
})(Input || (exports.Input = Input = {}));
var Storage;
(function (Storage) {
    function parseGetCookiesParams(params) {
        // Work around of `cddlconv` https://github.com/google/cddlconv/issues/19.
        // The generated schema `SameSiteSchema` in `src/protocol-parser/webdriver-bidi.ts` is
        // of type `"none" | "strict" | "lax"` which is not assignable to generated enum
        // `SameSite` in `src/protocol/webdriver-bidi.ts`.
        // TODO: remove cast after https://github.com/google/cddlconv/issues/19 is fixed.
        return parseObject(params, WebDriverBidi.Storage.GetCookiesParametersSchema);
    }
    Storage.parseGetCookiesParams = parseGetCookiesParams;
    function parseSetCookieParams(params) {
        // Work around of `cddlconv` https://github.com/google/cddlconv/issues/19.
        // The generated schema `SameSiteSchema` in `src/protocol-parser/webdriver-bidi.ts` is
        // of type `"none" | "strict" | "lax"` which is not assignable to generated enum
        // `SameSite` in `src/protocol/webdriver-bidi.ts`.
        // TODO: remove cast after https://github.com/google/cddlconv/issues/19 is fixed.
        return parseObject(params, WebDriverBidi.Storage.SetCookieParametersSchema);
    }
    Storage.parseSetCookieParams = parseSetCookieParams;
    function parseDeleteCookiesParams(params) {
        // Work around of `cddlconv` https://github.com/google/cddlconv/issues/19.
        // The generated schema `SameSiteSchema` in `src/protocol-parser/webdriver-bidi.ts` is
        // of type `"none" | "strict" | "lax"` which is not assignable to generated enum
        // `SameSite` in `src/protocol/webdriver-bidi.ts`.
        // TODO: remove cast after https://github.com/google/cddlconv/issues/19 is fixed.
        return parseObject(params, WebDriverBidi.Storage.DeleteCookiesParametersSchema);
    }
    Storage.parseDeleteCookiesParams = parseDeleteCookiesParams;
})(Storage || (exports.Storage = Storage = {}));
var Cdp;
(function (Cdp) {
    const SendCommandRequestSchema = zod_1.z.object({
        // Allowing any cdpMethod, and casting to proper type later on.
        method: zod_1.z.string(),
        // `passthrough` allows object to have any fields.
        // https://github.com/colinhacks/zod#passthrough
        params: zod_1.z.object({}).passthrough().optional(),
        session: zod_1.z.string().optional(),
    });
    const GetSessionRequestSchema = zod_1.z.object({
        context: WebDriverBidi.BrowsingContext.BrowsingContextSchema,
    });
    const ResolveRealmRequestSchema = zod_1.z.object({
        realm: WebDriverBidi.Script.RealmSchema,
    });
    function parseSendCommandRequest(params) {
        return parseObject(params, SendCommandRequestSchema);
    }
    Cdp.parseSendCommandRequest = parseSendCommandRequest;
    function parseGetSessionRequest(params) {
        return parseObject(params, GetSessionRequestSchema);
    }
    Cdp.parseGetSessionRequest = parseGetSessionRequest;
    function parseResolveRealmRequest(params) {
        return parseObject(params, ResolveRealmRequestSchema);
    }
    Cdp.parseResolveRealmRequest = parseResolveRealmRequest;
})(Cdp || (exports.Cdp = Cdp = {}));
var Permissions;
(function (Permissions) {
    function parseSetPermissionsParams(params) {
        return {
            // TODO: remove once "goog:" attributes are not needed.
            ...params,
            ...parseObject(params, WebDriverBidiPermissions.Permissions.SetPermissionParametersSchema),
        };
    }
    Permissions.parseSetPermissionsParams = parseSetPermissionsParams;
})(Permissions || (exports.Permissions = Permissions = {}));
//# sourceMappingURL=protocol-parser.js.map