import { type BrowsingContext, Network } from '../../../protocol/protocol.js';
import type { LoggerFn } from '../../../utils/log.js';
import type { CdpClient } from '../../BidiMapper.js';
import type { CdpTarget } from '../cdp/CdpTarget.js';
import type { EventManager } from '../session/EventManager.js';
import { NetworkRequest } from './NetworkRequest.js';
type NetworkInterception = Omit<Network.AddInterceptParameters, 'urlPatterns'> & {
    urlPatterns: Network.UrlPattern[];
};
/** Stores network and intercept maps. */
export declare class NetworkStorage {
    #private;
    constructor(eventManager: EventManager, browserClient: CdpClient, logger?: LoggerFn);
    onCdpTargetCreated(cdpTarget: CdpTarget): void;
    getInterceptionStages(browsingContextId: BrowsingContext.BrowsingContext): {
        request: boolean;
        response: boolean;
        auth: boolean;
    };
    getInterceptsForPhase(request: NetworkRequest, phase: Network.InterceptPhase): Set<Network.Intercept>;
    disposeRequestMap(sessionId: string): void;
    /**
     * Adds the given entry to the intercept map.
     * URL patterns are assumed to be parsed.
     *
     * @return The intercept ID.
     */
    addIntercept(value: NetworkInterception): Network.Intercept;
    /**
     * Removes the given intercept from the intercept map.
     * Throws NoSuchInterceptException if the intercept does not exist.
     */
    removeIntercept(intercept: Network.Intercept): void;
    getRequestById(id: Network.Request): NetworkRequest | undefined;
    getRequestByFetchId(fetchId: Network.Request): NetworkRequest | undefined;
    addRequest(request: NetworkRequest): void;
    deleteRequest(id: Network.Request): void;
}
export {};
