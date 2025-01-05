import { NxJsonConfiguration, TargetDefaults } from '../../config/nx-json';
import { ProjectGraphExternalNode } from '../../config/project-graph';
import { ProjectConfiguration, ProjectMetadata, TargetConfiguration, TargetMetadata } from '../../config/workspace-json-project-json';
import { LoadedNxPlugin } from '../plugins/internal-api';
export type SourceInformation = [file: string | null, plugin: string];
export type ConfigurationSourceMaps = Record<string, Record<string, SourceInformation>>;
export declare function mergeProjectConfigurationIntoRootMap(projectRootMap: Record<string, ProjectConfiguration>, project: ProjectConfiguration, configurationSourceMaps?: ConfigurationSourceMaps, sourceInformation?: SourceInformation, skipTargetNormalization?: boolean): void;
export declare function mergeMetadata<T = ProjectMetadata | TargetMetadata>(sourceMap: Record<string, [file: string, plugin: string]>, sourceInformation: [file: string, plugin: string], baseSourceMapPath: string, metadata: T, matchingMetadata?: T): T;
export type ConfigurationResult = {
    /**
     * A map of project configurations, keyed by project root.
     */
    projects: {
        [projectRoot: string]: ProjectConfiguration;
    };
    /**
     * Node Name -> Node info
     */
    externalNodes: Record<string, ProjectGraphExternalNode>;
    /**
     * Project Root -> Project Name
     */
    projectRootMap: Record<string, string>;
    sourceMaps: ConfigurationSourceMaps;
    /**
     * The list of files that were used to create project configurations
     */
    matchingProjectFiles: string[];
};
/**
 * Transforms a list of project paths into a map of project configurations.
 *
 * @param root The workspace root
 * @param nxJson The NxJson configuration
 * @param workspaceFiles A list of non-ignored workspace files
 * @param plugins The plugins that should be used to infer project configuration
 */
export declare function createProjectConfigurations(root: string, nxJson: NxJsonConfiguration, projectFiles: string[], // making this parameter allows devkit to pick up newly created projects
plugins: LoadedNxPlugin[]): Promise<ConfigurationResult>;
export declare function findMatchingConfigFiles(projectFiles: string[], pattern: string, include: string[], exclude: string[]): string[];
export declare function readProjectConfigurationsFromRootMap(projectRootMap: Record<string, ProjectConfiguration>): Record<string, ProjectConfiguration>;
export declare function validateProject(project: ProjectConfiguration, knownProjects: Record<string, ProjectConfiguration>): void;
export declare function mergeTargetDefaultWithTargetDefinition(targetName: string, project: ProjectConfiguration, targetDefault: Partial<TargetConfiguration>, sourceMap: Record<string, SourceInformation>): TargetConfiguration;
/**
 * Merges two targets.
 *
 * Most properties from `target` will overwrite any properties from `baseTarget`.
 * Options and configurations are treated differently - they are merged together if the executor definition is compatible.
 *
 * @param target The target definition with higher priority
 * @param baseTarget The target definition that should be overwritten. Can be undefined, in which case the target is returned as-is.
 * @param projectConfigSourceMap The source map to be filled with metadata about where each property came from
 * @param sourceInformation The metadata about where the new target was defined
 * @param targetIdentifier The identifier for the target to merge, used for source map
 * @returns A merged target configuration
 */
export declare function mergeTargetConfigurations(target: TargetConfiguration, baseTarget?: TargetConfiguration, projectConfigSourceMap?: Record<string, SourceInformation>, sourceInformation?: SourceInformation, targetIdentifier?: string): TargetConfiguration;
/**
 * Checks if targets options are compatible - used when merging configurations
 * to avoid merging options for @nx/js:tsc into something like @nx/webpack:webpack.
 *
 * If the executors are both specified and don't match, the options aren't considered
 * "compatible" and shouldn't be merged.
 */
export declare function isCompatibleTarget(a: TargetConfiguration, b: TargetConfiguration): boolean;
export declare function resolveNxTokensInOptions<T extends Object | Array<unknown>>(object: T, project: ProjectConfiguration, key: string): T;
export declare function readTargetDefaultsForTarget(targetName: string, targetDefaults: TargetDefaults, executor?: string): TargetDefaults[string];
/**
 * Expand's `command` syntactic sugar and replaces tokens in options.
 * @param target The target to normalize
 * @param project The project that the target belongs to
 * @returns The normalized target configuration
 */
export declare function normalizeTarget(target: TargetConfiguration, project: ProjectConfiguration): TargetConfiguration<any>;
