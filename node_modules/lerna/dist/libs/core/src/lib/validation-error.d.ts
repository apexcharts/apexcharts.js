export declare class ValidationError extends Error {
    prefix: string;
    constructor(prefix: string, message: string, ...rest: unknown[]);
}
