import { PackageGraphNode } from "./package-graph-node";
/**
 * Represents a cyclic collection of nodes in a PackageGraph.
 * It is meant to be used as a black box, where the only exposed
 * information are the connections to the other nodes of the graph.
 * It can contain either `PackageGraphNode`s or other `CyclicPackageGraphNode`s.
 */
export declare class CyclicPackageGraphNode extends Map<string, PackageGraphNode | CyclicPackageGraphNode> {
    name: string;
    localDependencies: Map<string, PackageGraphNode | CyclicPackageGraphNode>;
    localDependents: Map<string, PackageGraphNode | CyclicPackageGraphNode>;
    constructor();
    get isCycle(): boolean;
    /**
     * @returns A representation of a cycle, like like `A -> B -> C -> A`.
     */
    toString(): string;
    /**
     * Flattens a CyclicPackageGraphNode (which can have multiple level of cycles).
     */
    flatten(): PackageGraphNode[];
    /**
     * Checks if a given node is contained in this cycle (or in a nested one)
     *
     * @param name The name of the package to search in this cycle
     */
    contains(name: string): boolean;
    /**
     * Adds a graph node, or a nested cycle, to this group.
     */
    insert(node: PackageGraphNode | CyclicPackageGraphNode): void;
    /**
     * Remove pointers to candidate node from internal collections.
     * @param candidateNode instance to unlink
     */
    unlink(candidateNode: PackageGraphNode | CyclicPackageGraphNode): void;
}
