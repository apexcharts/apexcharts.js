export type Step<T> = () => Promise<T>;
export type Options = {
    limit?: number;
    rejectLate?: boolean;
};
export declare const callLimit: <T extends unknown>(queue: Step<T>[], { limit, rejectLate }?: Options) => Promise<unknown>;
//# sourceMappingURL=index.d.ts.map