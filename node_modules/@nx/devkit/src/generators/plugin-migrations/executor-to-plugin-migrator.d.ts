import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { type CreateNodes, type CreateNodesV2, type ProjectGraph, type TargetConfiguration, type Tree } from 'nx/src/devkit-exports';
import { logger as devkitLogger } from 'nx/src/devkit-exports';
export type InferredTargetConfiguration = TargetConfiguration & {
    name: string;
};
type PostTargetTransformer = (targetConfiguration: TargetConfiguration, tree: Tree, projectDetails: {
    projectName: string;
    root: string;
}, inferredTargetConfiguration: InferredTargetConfiguration) => TargetConfiguration | Promise<TargetConfiguration>;
type SkipTargetFilter = (targetOptions: Record<string, unknown>, projectConfiguration: ProjectConfiguration) => false | string;
type SkipProjectFilter = (projectConfiguration: ProjectConfiguration) => false | string;
export declare class NoTargetsToMigrateError extends Error {
    constructor();
}
export declare function migrateProjectExecutorsToPlugin<T>(tree: Tree, projectGraph: ProjectGraph, pluginPath: string, createNodesV2: CreateNodesV2<T>, defaultPluginOptions: T, migrations: Array<{
    executors: string[];
    targetPluginOptionMapper: (targetName: string) => Partial<T>;
    postTargetTransformer: PostTargetTransformer;
    skipProjectFilter?: SkipProjectFilter;
    skipTargetFilter?: SkipTargetFilter;
}>, specificProjectToMigrate?: string, logger?: typeof devkitLogger): Promise<Map<string, Record<string, string>>>;
export declare function migrateProjectExecutorsToPluginV1<T>(tree: Tree, projectGraph: ProjectGraph, pluginPath: string, createNodes: CreateNodes<T>, defaultPluginOptions: T, migrations: Array<{
    executors: string[];
    targetPluginOptionMapper: (targetName: string) => Partial<T>;
    postTargetTransformer: PostTargetTransformer;
    skipProjectFilter?: SkipProjectFilter;
    skipTargetFilter?: SkipTargetFilter;
}>, specificProjectToMigrate?: string): Promise<Map<string, Record<string, string>>>;
export {};
