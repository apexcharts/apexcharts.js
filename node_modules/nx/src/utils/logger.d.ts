export declare const NX_PREFIX: string;
export declare const NX_ERROR: string;
export declare const logger: {
    warn: (s: any) => void;
    error: (s: any) => void;
    info: (s: any) => void;
    log: (...s: any[]) => void;
    debug: (...s: any[]) => void;
    fatal: (...s: any[]) => void;
    verbose: (...s: any[]) => void;
};
export declare function stripIndent(str: string): string;
