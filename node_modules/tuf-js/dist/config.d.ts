import type { MakeFetchHappenOptions } from 'make-fetch-happen';
export type Config = {
    maxRootRotations: number;
    maxDelegations: number;
    rootMaxLength: number;
    timestampMaxLength: number;
    snapshotMaxLength: number;
    targetsMaxLength: number;
    prefixTargetsWithHash: boolean;
    fetchTimeout: number;
    fetchRetries: number | undefined;
    fetchRetry: MakeFetchHappenOptions['retry'];
};
export declare const defaultConfig: Config;
