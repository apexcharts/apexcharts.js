import type { Entry, ProposedEntry } from '../../external/rekor';
import type { FetchOptions } from '../../types/fetch';
export type { Entry, ProposedEntry };
export interface TLog {
    createEntry: (proposedEntry: ProposedEntry) => Promise<Entry>;
}
export type TLogClientOptions = {
    rekorBaseURL: string;
    fetchOnConflict?: boolean;
} & FetchOptions;
export declare class TLogClient implements TLog {
    private rekor;
    private fetchOnConflict;
    constructor(options: TLogClientOptions);
    createEntry(proposedEntry: ProposedEntry): Promise<Entry>;
}
