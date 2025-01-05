import { FileData } from './file-utils';
import { FileMapCache } from './nx-deps-cache';
import { LoadedNxPlugin } from './plugins/internal-api';
import { CreateMetadataContext } from './plugins';
import { FileMap, ProjectGraph, ProjectGraphExternalNode } from '../config/project-graph';
import { ProjectConfiguration } from '../config/workspace-json-project-json';
import { NxWorkspaceFilesExternals } from '../native';
import { CreateMetadataError } from './error-types';
import { ConfigurationSourceMaps } from './utils/project-configuration-utils';
export declare function getFileMap(): {
    fileMap: FileMap;
    allWorkspaceFiles: FileData[];
    rustReferences: NxWorkspaceFilesExternals | null;
};
export declare function hydrateFileMap(fileMap: FileMap, allWorkspaceFiles: FileData[], rustReferences: NxWorkspaceFilesExternals): void;
export declare function buildProjectGraphUsingProjectFileMap(projectRootMap: Record<string, ProjectConfiguration>, externalNodes: Record<string, ProjectGraphExternalNode>, fileMap: FileMap, allWorkspaceFiles: FileData[], rustReferences: NxWorkspaceFilesExternals, fileMapCache: FileMapCache | null, plugins: LoadedNxPlugin[], sourceMap: ConfigurationSourceMaps): Promise<{
    projectGraph: ProjectGraph;
    projectFileMapCache: FileMapCache;
}>;
export declare function applyProjectMetadata(graph: ProjectGraph, plugins: LoadedNxPlugin[], context: CreateMetadataContext, sourceMap: ConfigurationSourceMaps): Promise<{
    graph: ProjectGraph;
    errors?: CreateMetadataError[];
}>;
