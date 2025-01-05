import * as Debug from 'debug';
export declare function formatDateTime(datetime: Date | number): string;
export declare function formatDuration(millis: number): string;
export declare function timeoutExecute<T>(millis: number, promise: Promise<T>): Promise<T>;
export declare function debugGenerator(namespace: string): Debug.IDebugger;
export declare function log(msg: string): void;
