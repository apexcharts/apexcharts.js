import { PackageGraphNode } from "../package-graph/package-graph-node";
/**
 * Build a set of nodes that are dependents of the input set.
 */
export declare function collectDependents(nodes: Set<PackageGraphNode>): Set<PackageGraphNode>;
