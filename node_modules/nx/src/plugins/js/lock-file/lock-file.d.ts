/**
 * This is the main API for accessing the lock file functionality.
 * It encapsulates the package manager specific logic and implementation details.
 */
import { PackageManager } from '../../../utils/package-manager';
import { ProjectGraph, ProjectGraphExternalNode } from '../../../config/project-graph';
import { RawProjectGraphDependency } from '../../../project-graph/project-graph-builder';
import { PackageJson } from '../../../utils/package-json';
import { CreateDependenciesContext, CreateNodesContext } from '../../../project-graph/plugins';
export declare const LOCKFILES: string[];
/**
 * Parses lock file and maps dependencies and metadata to {@link LockFileGraph}
 */
export declare function getLockFileNodes(packageManager: PackageManager, contents: string, lockFileHash: string, context: CreateNodesContext): Record<string, ProjectGraphExternalNode>;
/**
 * Parses lock file and maps dependencies and metadata to {@link LockFileGraph}
 */
export declare function getLockFileDependencies(packageManager: PackageManager, contents: string, lockFileHash: string, context: CreateDependenciesContext): RawProjectGraphDependency[];
export declare function lockFileExists(packageManager: PackageManager): boolean;
/**
 * Returns lock file name based on the detected package manager in the root
 * @param packageManager
 * @returns
 */
export declare function getLockFileName(packageManager: PackageManager): string;
/**
 * Create lock file based on the root level lock file and (pruned) package.json
 *
 * @param packageJson
 * @param isProduction
 * @param packageManager
 * @returns
 */
export declare function createLockFile(packageJson: PackageJson, graph: ProjectGraph, packageManager?: PackageManager): string;
