import { ProjectGraph } from '../../../config/project-graph';
import { PackageJson } from '../../../utils/package-json';
/**
 * Prune project graph's external nodes and their dependencies
 * based on the pruned package.json
 */
export declare function pruneProjectGraph(graph: ProjectGraph, prunedPackageJson: PackageJson): ProjectGraph;
