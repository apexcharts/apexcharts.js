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
exports.BidiNoOpParser = void 0;
class BidiNoOpParser {
    // Browser domain
    // keep-sorted start block=yes
    parseRemoveUserContextParams(params) {
        return params;
    }
    // keep-sorted end
    // Browsing Context domain
    // keep-sorted start block=yes
    parseActivateParams(params) {
        return params;
    }
    parseCaptureScreenshotParams(params) {
        return params;
    }
    parseCloseParams(params) {
        return params;
    }
    parseCreateParams(params) {
        return params;
    }
    parseGetTreeParams(params) {
        return params;
    }
    parseHandleUserPromptParams(params) {
        return params;
    }
    parseLocateNodesParams(params) {
        return params;
    }
    parseNavigateParams(params) {
        return params;
    }
    parsePrintParams(params) {
        return params;
    }
    parseReloadParams(params) {
        return params;
    }
    parseSetViewportParams(params) {
        return params;
    }
    parseTraverseHistoryParams(params) {
        return params;
    }
    // keep-sorted end
    // CDP domain
    // keep-sorted start block=yes
    parseGetSessionParams(params) {
        return params;
    }
    parseResolveRealmParams(params) {
        return params;
    }
    parseSendCommandParams(params) {
        return params;
    }
    // keep-sorted end
    // Script domain
    // keep-sorted start block=yes
    parseAddPreloadScriptParams(params) {
        return params;
    }
    parseCallFunctionParams(params) {
        return params;
    }
    parseDisownParams(params) {
        return params;
    }
    parseEvaluateParams(params) {
        return params;
    }
    parseGetRealmsParams(params) {
        return params;
    }
    parseRemovePreloadScriptParams(params) {
        return params;
    }
    // keep-sorted end
    // Input domain
    // keep-sorted start block=yes
    parsePerformActionsParams(params) {
        return params;
    }
    parseReleaseActionsParams(params) {
        return params;
    }
    parseSetFilesParams(params) {
        return params;
    }
    // keep-sorted end
    // Network domain
    // keep-sorted start block=yes
    parseAddInterceptParams(params) {
        return params;
    }
    parseContinueRequestParams(params) {
        return params;
    }
    parseContinueResponseParams(params) {
        return params;
    }
    parseContinueWithAuthParams(params) {
        return params;
    }
    parseFailRequestParams(params) {
        return params;
    }
    parseProvideResponseParams(params) {
        return params;
    }
    parseRemoveInterceptParams(params) {
        return params;
    }
    // keep-sorted end
    // Permissions domain
    // keep-sorted start block=yes
    parseSetPermissionsParams(params) {
        return params;
    }
    // keep-sorted end
    // Session domain
    // keep-sorted start block=yes
    parseSubscribeParams(params) {
        return params;
    }
    // keep-sorted end
    // Storage domain
    // keep-sorted start block=yes
    parseDeleteCookiesParams(params) {
        return params;
    }
    parseGetCookiesParams(params) {
        return params;
    }
    parseSetCookieParams(params) {
        return params;
    }
}
exports.BidiNoOpParser = BidiNoOpParser;
//# sourceMappingURL=BidiNoOpParser.js.map