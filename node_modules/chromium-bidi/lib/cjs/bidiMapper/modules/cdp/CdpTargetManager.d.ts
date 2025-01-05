import type { CdpClient } from '../../../cdp/CdpClient.js';
import type { CdpConnection } from '../../../cdp/CdpConnection.js';
import type { Browser } from '../../../protocol/protocol.js';
import { type LoggerFn } from '../../../utils/log.js';
import type { BrowsingContextStorage } from '../context/BrowsingContextStorage.js';
import type { NetworkStorage } from '../network/NetworkStorage.js';
import type { PreloadScriptStorage } from '../script/PreloadScriptStorage.js';
import type { RealmStorage } from '../script/RealmStorage.js';
import type { EventManager } from '../session/EventManager.js';
export declare class CdpTargetManager {
    #private;
    constructor(cdpConnection: CdpConnection, browserCdpClient: CdpClient, selfTargetId: string, eventManager: EventManager, browsingContextStorage: BrowsingContextStorage, realmStorage: RealmStorage, networkStorage: NetworkStorage, preloadScriptStorage: PreloadScriptStorage, acceptInsecureCerts: boolean, defaultUserContextId: Browser.UserContext, logger?: LoggerFn);
}
