import { Package } from "@lerna/core";
import { PackageGraph } from "./package-graph";
type Tracker = any;
/**
 * Symlink all packages to the packages/node_modules directory
 * Symlink package binaries to dependent packages' node_modules/.bin directory
 */
export declare function symlinkDependencies(packages: Package[], packageGraph: PackageGraph | undefined, tracker: Tracker): Promise<unknown>;
export {};
