export declare const GLOB: "GLOB";
export type HandleGlobMessage = {
    type: typeof GLOB;
    globs: string[];
    exclude?: string[];
};
export declare function isHandleGlobMessage(message: unknown): message is HandleGlobMessage;
