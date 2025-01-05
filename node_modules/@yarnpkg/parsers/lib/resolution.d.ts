export type Resolution = {
    from?: {
        fullName: string;
        description?: string;
    };
    descriptor: {
        fullName: string;
        description?: string;
    };
};
export declare function parseResolution(source: string): Resolution;
export declare function stringifyResolution(resolution: Resolution): string;
