import { ProjectConfiguration } from '../../config/workspace-json-project-json';
import { NxJsonConfiguration } from '../../config/nx-json';
import { ConfigurationResult } from './project-configuration-utils';
import { LoadedNxPlugin } from '../plugins/internal-api';
/**
 * Walks the workspace directory to create the `projectFileMap`, `ProjectConfigurations` and `allWorkspaceFiles`
 * @throws
 * @param workspaceRoot
 * @param nxJson
 */
export declare function retrieveWorkspaceFiles(workspaceRoot: string, projectRootMap: Record<string, string>): Promise<{
    allWorkspaceFiles: import("../file-utils").FileData[];
    fileMap: {
        projectFileMap: ProjectFiles;
        nonProjectFiles: import("../../native").FileData[];
    };
    rustReferences: import("../../native").NxWorkspaceFilesExternals;
}>;
/**
 * Walk through the workspace and return `ProjectConfigurations`. Only use this if the projectFileMap is not needed.
 */
export declare function retrieveProjectConfigurations(plugins: LoadedNxPlugin[], workspaceRoot: string, nxJson: NxJsonConfiguration): Promise<ConfigurationResult>;
export declare function retrieveProjectConfigurationsWithAngularProjects(workspaceRoot: string, nxJson: NxJsonConfiguration): Promise<ConfigurationResult>;
export declare function retrieveProjectConfigurationPaths(root: string, plugins: Array<LoadedNxPlugin>): Promise<string[]>;
export declare function retrieveProjectConfigurationsWithoutPluginInference(root: string): Promise<Record<string, ProjectConfiguration>>;
export declare function configurationGlobs(plugins: Array<LoadedNxPlugin>): string[];
