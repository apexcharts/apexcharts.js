"use strict";
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
exports.BidiParser = void 0;
const Parser = __importStar(require("../protocol-parser/protocol-parser.js"));
class BidiParser {
    // Browser domain
    // keep-sorted start block=yes
    parseRemoveUserContextParams(params) {
        return Parser.Browser.parseRemoveUserContextParams(params);
    }
    // keep-sorted end
    // Browsing Context domain
    // keep-sorted start block=yes
    parseActivateParams(params) {
        return Parser.BrowsingContext.parseActivateParams(params);
    }
    parseCaptureScreenshotParams(params) {
        return Parser.BrowsingContext.parseCaptureScreenshotParams(params);
    }
    parseCloseParams(params) {
        return Parser.BrowsingContext.parseCloseParams(params);
    }
    parseCreateParams(params) {
        return Parser.BrowsingContext.parseCreateParams(params);
    }
    parseGetTreeParams(params) {
        return Parser.BrowsingContext.parseGetTreeParams(params);
    }
    parseHandleUserPromptParams(params) {
        return Parser.BrowsingContext.parseHandleUserPromptParameters(params);
    }
    parseLocateNodesParams(params) {
        return Parser.BrowsingContext.parseLocateNodesParams(params);
    }
    parseNavigateParams(params) {
        return Parser.BrowsingContext.parseNavigateParams(params);
    }
    parsePrintParams(params) {
        return Parser.BrowsingContext.parsePrintParams(params);
    }
    parseReloadParams(params) {
        return Parser.BrowsingContext.parseReloadParams(params);
    }
    parseSetViewportParams(params) {
        return Parser.BrowsingContext.parseSetViewportParams(params);
    }
    parseTraverseHistoryParams(params) {
        return Parser.BrowsingContext.parseTraverseHistoryParams(params);
    }
    // keep-sorted end
    // CDP domain
    // keep-sorted start block=yes
    parseGetSessionParams(params) {
        return Parser.Cdp.parseGetSessionRequest(params);
    }
    parseResolveRealmParams(params) {
        return Parser.Cdp.parseResolveRealmRequest(params);
    }
    parseSendCommandParams(params) {
        return Parser.Cdp.parseSendCommandRequest(params);
    }
    // keep-sorted end
    // Input domain
    // keep-sorted start block=yes
    parsePerformActionsParams(params) {
        return Parser.Input.parsePerformActionsParams(params);
    }
    parseReleaseActionsParams(params) {
        return Parser.Input.parseReleaseActionsParams(params);
    }
    parseSetFilesParams(params) {
        return Parser.Input.parseSetFilesParams(params);
    }
    // keep-sorted end
    // Network domain
    // keep-sorted start block=yes
    parseAddInterceptParams(params) {
        return Parser.Network.parseAddInterceptParameters(params);
    }
    parseContinueRequestParams(params) {
        return Parser.Network.parseContinueRequestParameters(params);
    }
    parseContinueResponseParams(params) {
        return Parser.Network.parseContinueResponseParameters(params);
    }
    parseContinueWithAuthParams(params) {
        return Parser.Network.parseContinueWithAuthParameters(params);
    }
    parseFailRequestParams(params) {
        return Parser.Network.parseFailRequestParameters(params);
    }
    parseProvideResponseParams(params) {
        return Parser.Network.parseProvideResponseParameters(params);
    }
    parseRemoveInterceptParams(params) {
        return Parser.Network.parseRemoveInterceptParameters(params);
    }
    // keep-sorted end
    // Permissions domain
    // keep-sorted start block=yes
    parseSetPermissionsParams(params) {
        return Parser.Permissions.parseSetPermissionsParams(params);
    }
    // keep-sorted end
    // Script domain
    // keep-sorted start block=yes
    parseAddPreloadScriptParams(params) {
        return Parser.Script.parseAddPreloadScriptParams(params);
    }
    parseCallFunctionParams(params) {
        return Parser.Script.parseCallFunctionParams(params);
    }
    parseDisownParams(params) {
        return Parser.Script.parseDisownParams(params);
    }
    parseEvaluateParams(params) {
        return Parser.Script.parseEvaluateParams(params);
    }
    parseGetRealmsParams(params) {
        return Parser.Script.parseGetRealmsParams(params);
    }
    parseRemovePreloadScriptParams(params) {
        return Parser.Script.parseRemovePreloadScriptParams(params);
    }
    // keep-sorted end
    // Session domain
    // keep-sorted start block=yes
    parseSubscribeParams(params) {
        return Parser.Session.parseSubscribeParams(params);
    }
    // keep-sorted end
    // Storage domain
    // keep-sorted start block=yes
    parseDeleteCookiesParams(params) {
        return Parser.Storage.parseDeleteCookiesParams(params);
    }
    parseGetCookiesParams(params) {
        return Parser.Storage.parseGetCookiesParams(params);
    }
    parseSetCookieParams(params) {
        return Parser.Storage.parseSetCookieParams(params);
    }
}
exports.BidiParser = BidiParser;
//# sourceMappingURL=BidiParser.js.map