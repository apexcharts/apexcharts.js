import { FileData, FileMap, ProjectFileMap, ProjectGraph } from '../config/project-graph';
import { ProjectConfiguration, ProjectsConfigurations } from '../config/workspace-json-project-json';
import { NxWorkspaceFilesExternals } from '../native';
export interface WorkspaceFileMap {
    allWorkspaceFiles: FileData[];
    fileMap: FileMap;
}
export declare function createProjectFileMapUsingProjectGraph(graph: ProjectGraph): Promise<ProjectFileMap>;
export declare function createFileMapUsingProjectGraph(graph: ProjectGraph): Promise<WorkspaceFileMap>;
export declare function createFileMap(projectsConfigurations: ProjectsConfigurations, allWorkspaceFiles: FileData[]): WorkspaceFileMap;
export declare function updateFileMap(projectsConfigurations: Record<string, ProjectConfiguration>, rustReferences: NxWorkspaceFilesExternals, updatedFiles: Record<string, string>, deletedFiles: string[]): {
    fileMap: import("../native").FileMap;
    allWorkspaceFiles: FileData[];
    rustReferences: NxWorkspaceFilesExternals;
};
