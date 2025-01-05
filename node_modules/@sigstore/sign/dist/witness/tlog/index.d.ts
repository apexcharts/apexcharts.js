import { TLogClientOptions } from './client';
import type { TransparencyLogEntry } from '@sigstore/bundle';
import type { SignatureBundle, Witness } from '../witness';
export declare const DEFAULT_REKOR_URL = "https://rekor.sigstore.dev";
type TransparencyLogEntries = {
    tlogEntries: TransparencyLogEntry[];
};
export type RekorWitnessOptions = Partial<TLogClientOptions> & {
    entryType?: 'dsse' | 'intoto';
};
export declare class RekorWitness implements Witness {
    private tlog;
    private entryType?;
    constructor(options: RekorWitnessOptions);
    testify(content: SignatureBundle, publicKey: string): Promise<TransparencyLogEntries>;
}
export {};
