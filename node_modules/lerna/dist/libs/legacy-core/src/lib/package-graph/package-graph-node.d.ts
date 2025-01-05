import { ExtendedNpaResult, Package } from "@lerna/core";
import { Result } from "npm-package-arg";
declare const PKG: unique symbol;
/**
 * A node in a PackageGraph.
 */
export declare class PackageGraphNode {
    name: string;
    externalDependencies: Map<string, Result>;
    localDependencies: Map<string, ExtendedNpaResult>;
    localDependents: Map<string, PackageGraphNode>;
    [PKG]: Package;
    constructor(pkg: Package);
    get location(): string;
    get pkg(): Package;
    get prereleaseId(): string | undefined;
    get version(): string;
    /**
     * Determine if the Node satisfies a resolved semver range.
     * @see https://github.com/npm/npm-package-arg#result-object
     *
     * @param {!Result} resolved npm-package-arg Result object
     */
    satisfies({ gitCommittish, gitRange, fetchSpec }: any): boolean;
    /**
     * Returns a string representation of this node (its name)
     *
     * @returns {String}
     */
    toString(): string;
}
export {};
