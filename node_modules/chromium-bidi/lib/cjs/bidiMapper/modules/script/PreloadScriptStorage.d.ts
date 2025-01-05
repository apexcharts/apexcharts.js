import type { CdpTarget } from '../cdp/CdpTarget.js';
import type { PreloadScript } from './PreloadScript.js';
/** PreloadScripts can be filtered by BiDi ID or target ID. */
export type PreloadScriptFilter = Partial<{
    id: PreloadScript['id'];
    targetId: CdpTarget['id'];
    global: boolean;
}>;
/**
 * Container class for preload scripts.
 */
export declare class PreloadScriptStorage {
    #private;
    /**
     * Finds all entries that match the given filter (OR logic).
     */
    find(filter?: PreloadScriptFilter): PreloadScript[];
    add(preloadScript: PreloadScript): void;
    /** Deletes all BiDi preload script entries that match the given filter. */
    remove(filter?: PreloadScriptFilter): void;
}
