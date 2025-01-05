import { PackageGraphNode } from "../package-graph/package-graph-node";
export interface PackageCollectorOptions {
    isCandidate?: (node?: PackageGraphNode, name?: string) => boolean;
    onInclude?: (name: string) => void;
    excludeDependents?: boolean;
}
/**
 * Build a list of graph nodes, possibly including dependents, using predicate if available.
 */
export declare function collectPackages(packages: Map<string, PackageGraphNode>, { isCandidate, onInclude, excludeDependents }?: PackageCollectorOptions): PackageGraphNode[];
