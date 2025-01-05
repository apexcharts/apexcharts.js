import npa from "npm-package-arg";
import { Packed } from "./pack-directory";
declare const PKG: unique symbol;
declare const _location: unique symbol;
declare const _resolved: unique symbol;
declare const _rootPath: unique symbol;
declare const _scripts: unique symbol;
declare const _contents: unique symbol;
export type AssetDefinition = string | {
    from: string;
    to: string;
};
export interface RawManifestLernaConfig {
    command?: {
        publish?: {
            directory?: string;
            assets?: AssetDefinition[];
        };
    };
}
export interface RawManifest {
    name: string;
    version: string;
    description?: string;
    private?: boolean;
    bin?: Record<string, string> | string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    publishConfig?: Record<"directory" | "registry" | "tag", string>;
    workspaces?: string[];
    nx?: Record<string, unknown>;
    gitHead?: string;
    lerna?: RawManifestLernaConfig;
}
export type ExtendedNpaResult = npa.Result & {
    workspaceSpec?: string;
    workspaceAlias?: string;
};
/**
 * Lerna's internal representation of a local package, with
 * many values resolved directly from the original JSON.
 */
export declare class Package {
    name: string;
    [PKG]: RawManifest;
    [_location]: string;
    [_resolved]: npa.Result;
    [_rootPath]: string;
    [_scripts]: Record<string, string>;
    [_contents]: string | undefined;
    licensePath?: string;
    packed?: Packed;
    /**
     * Create a Package instance from parameters, possibly reusing existing instance.
     * @param ref A path to a package.json file, Package instance, or JSON object
     * @param [dir] If `ref` is a JSON object, this is the location of the manifest
     */
    static lazy(ref: string | Package | RawManifest, dir?: string): Package;
    constructor(pkg: RawManifest, location: string, rootPath?: string);
    get location(): string;
    get private(): boolean;
    set private(isPrivate: boolean);
    get resolved(): npa.Result;
    get rootPath(): string;
    get scripts(): Record<string, string>;
    get lernaConfig(): RawManifestLernaConfig | undefined;
    set lernaConfig(config: RawManifestLernaConfig | undefined);
    get bin(): Record<string, string>;
    get binLocation(): string;
    get manifestLocation(): string;
    get nodeModulesLocation(): string;
    get __isLernaPackage(): boolean;
    get version(): string;
    set version(version: string);
    get contents(): string;
    set contents(subDirectory: string);
    get dependencies(): Record<string, string> | undefined;
    get devDependencies(): Record<string, string> | undefined;
    get optionalDependencies(): Record<string, string> | undefined;
    get peerDependencies(): Record<string, string> | undefined;
    /**
     * Map-like retrieval of arbitrary values
     */
    get(key: keyof RawManifest): string | boolean | string[] | Record<string, string> | Record<"directory" | "registry" | "tag", string> | RawManifestLernaConfig | Record<string, unknown> | undefined;
    /**
     * Map-like storage of arbitrary values
     */
    set(key: keyof RawManifest, val: RawManifest[keyof RawManifest]): Package;
    /**
     * Provide shallow copy for munging elsewhere
     */
    toJSON(): any;
    /**
     * Refresh internal state from disk (e.g., changed by external lifecycles)
     */
    refresh(): Promise<this>;
    /**
     * Write manifest changes to disk
     * @returns {Promise} resolves when write finished
     */
    serialize(): Promise<this>;
    /**
     * Sync dist manifest version
     */
    syncDistVersion(doSync: boolean): Promise<this>;
    getLocalDependency(depName: string): {
        collection: "dependencies" | "devDependencies" | "optionalDependencies";
        spec: string;
    } | null;
    /**
     * Mutate local dependency spec according to type
     * @param resolved npa metadata
     * @param depVersion semver
     * @param savePrefix npm_config_save_prefix
     */
    updateLocalDependency(resolved: ExtendedNpaResult, depVersion: string, savePrefix: string, options?: {
        retainWorkspacePrefix: boolean;
    }): void;
    /**
     * Remove the private property, effectively making the package public.
     */
    removePrivate(): void;
}
export {};
