import { Package } from "@lerna/core";
import { PackageGraph } from "../package-graph";
import { collectPackages } from "./collect-packages";
export { collectPackages };
export interface UpdateCollectorOptions {
    bump?: string;
    canary?: boolean;
    ignoreChanges?: string[];
    includeMergedTags?: boolean;
    forcePublish?: boolean | string | string[];
    since?: string;
    conventionalCommits?: boolean;
    conventionalGraduate?: string | boolean;
    excludeDependents?: boolean;
}
/**
 * Create a list of graph nodes representing packages changed since the previous release, tagged or otherwise.
 */
export declare function collectUpdates(filteredPackages: Package[], packageGraph: PackageGraph, execOpts: any, commandOptions: UpdateCollectorOptions): import("../..").PackageGraphNode[];
