/// <reference types="node" />
/// <reference types="node" />
import type { MakeFetchHappenOptions } from 'make-fetch-happen';
type DownloadFileHandler<T> = (file: string) => Promise<T>;
export interface Fetcher {
    downloadFile<T>(url: string, maxLength: number, handler: DownloadFileHandler<T>): Promise<T>;
    downloadBytes(url: string, maxLength: number): Promise<Buffer>;
}
export declare abstract class BaseFetcher implements Fetcher {
    abstract fetch(url: string): Promise<NodeJS.ReadableStream>;
    downloadFile<T>(url: string, maxLength: number, handler: DownloadFileHandler<T>): Promise<T>;
    downloadBytes(url: string, maxLength: number): Promise<Buffer>;
}
type Retry = MakeFetchHappenOptions['retry'];
interface FetcherOptions {
    timeout?: number;
    retry?: Retry;
}
export declare class DefaultFetcher extends BaseFetcher {
    private timeout?;
    private retry?;
    constructor(options?: FetcherOptions);
    fetch(url: string): Promise<NodeJS.ReadableStream>;
}
export {};
