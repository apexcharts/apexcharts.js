import { Package } from "../package";
interface CommandConfigs {
    [command: string]: CommandConfigOptions;
}
export interface CommandConfigOptions {
    _?: (string | number)[];
    concurrency?: number;
    sort?: boolean;
    maxBuffer?: number;
    stream?: boolean;
    loglevel?: string;
    verbose?: boolean;
    progress?: boolean;
    npmClient?: string;
    useNx?: boolean;
    independent?: boolean;
    ci?: boolean;
    since?: string;
}
export interface LernaConfig {
    $schema: string;
    version: string;
    packages?: string[];
    useNx?: boolean;
    npmClient?: string;
    command?: CommandConfigs;
}
/**
 * A representation of the entire project managed by Lerna.
 *
 * Wherever the lerna.json file is located, that is the project root.
 * All package globs are rooted from this location.
 */
export declare class Project {
    #private;
    config: LernaConfig;
    configNotFound: boolean;
    rootConfigLocation: string;
    rootPath: string;
    packageConfigs: string[];
    manifest: Package;
    /**
     * @deprecated Only used in legacy core utilities
     * TODO: remove in v8
     */
    static getPackages(cwd: string): Promise<Package[]>;
    /**
     * @deprecated Only used in legacy core utilities
     * TODO: remove in v8
     */
    static getPackagesSync(cwd: string): Package[];
    constructor(cwd?: string, options?: {
        skipLernaConfigValidations: boolean;
    });
    get version(): string;
    set version(val: string);
    get packageParentDirs(): string[];
    get licensePath(): string | undefined;
    get fileFinder(): (fileName: string, fileMapper: any, customGlobOpts: any) => Promise<any>;
    /**
     * A promise resolving to a list of Package instances
     */
    getPackages(): Promise<Package[]>;
    /**
     * A list of Package instances
     */
    getPackagesSync(): Package[];
    getPackageLicensePaths(): Promise<string[]>;
    isIndependent(): boolean;
    serializeConfig(): string;
}
/**
 * @deprecated Only used in legacy core utilities
 * TODO: remove in v8
 */
export declare const getPackages: typeof Project.getPackages;
/**
 * @deprecated Only used in legacy core utilities
 * TODO: remove in v8
 */
export declare const getPackagesSync: typeof Project.getPackagesSync;
export {};
