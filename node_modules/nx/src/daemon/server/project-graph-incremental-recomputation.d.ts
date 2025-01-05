import { FileData, FileMap, ProjectGraph } from '../../config/project-graph';
import { FileMapCache } from '../../project-graph/nx-deps-cache';
import { NxWorkspaceFilesExternals } from '../../native';
interface SerializedProjectGraph {
    error: Error | null;
    projectGraph: ProjectGraph | null;
    projectFileMapCache: FileMapCache | null;
    fileMap: FileMap | null;
    allWorkspaceFiles: FileData[] | null;
    serializedProjectGraph: string | null;
    serializedSourceMaps: string | null;
    rustReferences: NxWorkspaceFilesExternals | null;
}
export declare let fileMapWithFiles: {
    fileMap: FileMap;
    allWorkspaceFiles: FileData[];
    rustReferences: NxWorkspaceFilesExternals;
} | undefined;
export declare let currentProjectFileMapCache: FileMapCache | undefined;
export declare let currentProjectGraph: ProjectGraph | undefined;
export declare function getCachedSerializedProjectGraphPromise(): Promise<SerializedProjectGraph>;
export declare function addUpdatedAndDeletedFiles(createdFiles: string[], updatedFiles: string[], deletedFiles: string[]): void;
export declare function registerProjectGraphRecomputationListener(listener: (projectGraph: ProjectGraph) => void): void;
export {};
