export declare let dynamicImport: Function;
export declare function loadConfigFile<T extends object = any>(configFilePath: string): Promise<T>;
export declare function getRootTsConfigPath(): string | null;
export declare function getRootTsConfigFileName(): string | null;
export declare function clearRequireCache(): void;
