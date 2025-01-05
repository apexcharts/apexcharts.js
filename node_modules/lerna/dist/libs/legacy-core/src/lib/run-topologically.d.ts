import { Package } from "@lerna/core";
import { QueryGraphConfig } from "./query-graph";
interface TopologicalConfig extends QueryGraphConfig {
    concurrency?: number;
}
/**
 * Run callback in maximally-saturated topological order.
 *
 * @template T
 * @param {import("@lerna/package").Package[]} packages List of `Package` instances
 * @param {(pkg: import("@lerna/package").Package) => Promise<T>} runner Callback to map each `Package` with
 * @param {TopologicalConfig} [options]
 * @returns {Promise<T[]>} when all executions complete
 */
export declare function runTopologically<T>(packages: Package[], runner: (pkg: Package) => Promise<T>, { concurrency, graphType, rejectCycles }?: TopologicalConfig): Promise<T[]>;
export {};
