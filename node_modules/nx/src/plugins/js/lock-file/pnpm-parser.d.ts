import { NormalizedPackageJson } from './utils/package-json';
import { RawProjectGraphDependency } from '../../../project-graph/project-graph-builder';
import { ProjectGraph, ProjectGraphExternalNode } from '../../../config/project-graph';
import { CreateDependenciesContext } from '../../../project-graph/plugins';
export declare function getPnpmLockfileNodes(lockFileContent: string, lockFileHash: string): Record<string, ProjectGraphExternalNode>;
export declare function getPnpmLockfileDependencies(lockFileContent: string, lockFileHash: string, ctx: CreateDependenciesContext): RawProjectGraphDependency[];
export declare function stringifyPnpmLockfile(graph: ProjectGraph, rootLockFileContent: string, packageJson: NormalizedPackageJson): string;
