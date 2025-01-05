export declare const HASH_GLOB: "HASH_GLOB";
export type HandleHashGlobMessage = {
    type: typeof HASH_GLOB;
    globs: string[];
    exclude?: string[];
};
export declare function isHandleHashGlobMessage(message: unknown): message is HandleHashGlobMessage;
