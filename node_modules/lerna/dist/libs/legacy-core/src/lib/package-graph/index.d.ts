import { Package } from "@lerna/core";
import { CyclicPackageGraphNode } from "./cyclic-package-graph-node";
import { PackageGraphNode } from "./package-graph-node";
/**
 * A graph of packages in the current project.
 */
export declare class PackageGraph extends Map<string, PackageGraphNode> {
    /**
     * @param {import("@lerna/package").Package[]} packages An array of Packages to build the graph out of.
     * @param {'allDependencies'|'dependencies'} [graphType]
     *    Pass "dependencies" to create a graph of only dependencies,
     *    excluding the devDependencies that would normally be included.
     * @param {boolean} [forceLocal] Force all local dependencies to be linked.
     */
    constructor(packages: Package[], graphType?: "allDependencies" | "dependencies", forceLocal?: boolean);
    get rawPackageList(): Package[];
    /**
     * Takes a list of Packages and returns a list of those same Packages with any Packages
     * they depend on. i.e if packageA depended on packageB `graph.addDependencies([packageA])`
     * would return [packageA, packageB].
     *
     * @param filteredPackages The packages to include dependencies for.
     */
    addDependencies(filteredPackages: Package[]): Package[];
    /**
     * Takes a list of Packages and returns a list of those same Packages with any Packages
     * that depend on them. i.e if packageC depended on packageD `graph.addDependents([packageD])`
     * would return [packageD, packageC].
     *
     * @param filteredPackages The packages to include dependents for.
     */
    addDependents(filteredPackages: Package[]): Package[];
    /**
     * Extends a list of packages by traversing on a given property, which must refer to a
     * `PackageGraphNode` property that is a collection of `PackageGraphNode`s.
     * Returns input packages with any additional packages found by traversing `nodeProp`.
     *
     * @param packageList The list of packages to extend
     * @param nodeProp The property on `PackageGraphNode` used to traverse
     */
    extendList(packageList: Package[], nodeProp: "localDependencies" | "localDependents"): Package[];
    /**
     * Return a tuple of cycle paths and nodes.
     *
     * @deprecated Use collapseCycles instead.
     *
     * @param  rejectCycles Whether or not to reject cycles
     */
    partitionCycles(rejectCycles: boolean): [Set<string[]>, Set<PackageGraphNode>];
    /**
     * Returns the cycles of this graph. If two cycles share some elements, they will
     * be returned as a single cycle.
     *
     * @param {boolean} rejectCycles Whether or not to reject cycles
     * @returns {Set<CyclicPackageGraphNode>}
     */
    collapseCycles(rejectCycles?: boolean): Set<CyclicPackageGraphNode>;
    /**
     * Remove cycle nodes.
     *
     * @deprecated Spread set into prune() instead.
     */
    pruneCycleNodes(cycleNodes: Set<PackageGraphNode>): void;
    /**
     * Remove all candidate nodes.
     */
    prune(...candidates: PackageGraphNode[]): void;
    /**
     * Delete by value (instead of key), as well as removing pointers
     * to itself in the other node's internal collections.
     * @param candidateNode instance to remove
     */
    remove(candidateNode: PackageGraphNode): void;
}
