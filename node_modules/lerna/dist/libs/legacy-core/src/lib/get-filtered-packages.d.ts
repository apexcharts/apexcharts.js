import { FilterOptions, Package } from "@lerna/core";
import { ExecOptions } from "child_process";
import { PackageGraph } from "./package-graph";
/**
 * Retrieve a list of Package instances filtered by various options.
 */
export declare function getFilteredPackages(packageGraph: PackageGraph, execOpts: ExecOptions, opts: Partial<FilterOptions>): Promise<Package[]>;
