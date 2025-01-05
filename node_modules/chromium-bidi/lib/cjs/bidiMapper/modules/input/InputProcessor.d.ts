import { Input, type EmptyResult } from '../../../protocol/protocol.js';
import type { BrowsingContextStorage } from '../context/BrowsingContextStorage.js';
import type { RealmStorage } from '../script/RealmStorage.js';
export declare class InputProcessor {
    #private;
    constructor(browsingContextStorage: BrowsingContextStorage, realmStorage: RealmStorage);
    performActions(params: Input.PerformActionsParameters): Promise<EmptyResult>;
    releaseActions(params: Input.ReleaseActionsParameters): Promise<EmptyResult>;
    setFiles(params: Input.SetFilesParameters): Promise<EmptyResult>;
}
