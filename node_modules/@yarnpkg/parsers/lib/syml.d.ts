export declare class PreserveOrdering {
    readonly data: any;
    constructor(data: any);
}
export declare function stringifySyml(value: any): string;
export declare namespace stringifySyml {
    var PreserveOrdering: typeof import("./syml").PreserveOrdering;
}
export declare function parseSyml(source: string): {
    [key: string]: any;
};
