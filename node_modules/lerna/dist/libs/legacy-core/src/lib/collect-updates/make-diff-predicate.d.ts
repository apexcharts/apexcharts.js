import { PackageGraphNode } from "../package-graph/package-graph-node";
/**
 * @param {string} committish
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 * @param {string[]} ignorePatterns
 */
export declare function makeDiffPredicate(committish: string, execOpts: any, ignorePatterns?: string[]): (node: PackageGraphNode) => boolean;
