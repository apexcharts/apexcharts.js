import { Package } from "@lerna/core";
import { PackageGraph } from "./package-graph";
import { CyclicPackageGraphNode } from "./package-graph/cyclic-package-graph-node";
import { PackageGraphNode } from "./package-graph/package-graph-node";
export interface QueryGraphConfig {
    graphType?: "allDependencies" | "dependencies";
    rejectCycles?: boolean;
}
/**
 * A mutable PackageGraph used to query for next available packages.
 */
export declare class QueryGraph {
    graph: PackageGraph;
    cycles: Set<CyclicPackageGraphNode>;
    /**
     * Sort a list of Packages topologically.
     * @returns A list of Package instances in topological order
     */
    static toposort(packages: Package[], options?: QueryGraphConfig): Package[];
    constructor(packages: Package[], { graphType, rejectCycles }?: QueryGraphConfig);
    _getNextLeaf(): PackageGraphNode[];
    _getNextCycle(): PackageGraphNode[];
    getAvailablePackages(): PackageGraphNode[];
    markAsTaken(name: string): void;
    markAsDone(candidateNode: PackageGraphNode): void;
}
export declare const toposort: typeof QueryGraph.toposort;
