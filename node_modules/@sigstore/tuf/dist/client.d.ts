import type { MakeFetchHappenOptions } from 'make-fetch-happen';
export type Retry = MakeFetchHappenOptions['retry'];
type FetchOptions = {
    retry?: Retry;
    timeout?: number;
};
export type TUFOptions = {
    cachePath: string;
    mirrorURL: string;
    rootPath?: string;
    forceCache: boolean;
    forceInit: boolean;
} & FetchOptions;
export interface TUF {
    getTarget(targetName: string): Promise<string>;
}
export declare class TUFClient implements TUF {
    private updater;
    constructor(options: TUFOptions);
    refresh(): Promise<void>;
    getTarget(targetName: string): Promise<string>;
}
export {};
