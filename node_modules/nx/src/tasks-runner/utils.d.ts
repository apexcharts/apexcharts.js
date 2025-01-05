import { Task, TaskGraph } from '../config/task-graph';
import { ProjectGraph, ProjectGraphProjectNode } from '../config/project-graph';
import { TargetConfiguration, TargetDependencyConfig } from '../config/workspace-json-project-json';
import { CustomHasher, ExecutorConfig } from '../config/misc-interfaces';
export type NormalizedTargetDependencyConfig = TargetDependencyConfig & {
    projects: string[];
};
export declare function getDependencyConfigs({ project, target }: {
    project: string;
    target: string;
}, extraTargetDependencies: Record<string, (TargetDependencyConfig | string)[]>, projectGraph: ProjectGraph, allTargetNames: string[]): NormalizedTargetDependencyConfig[] | undefined;
export declare function normalizeDependencyConfigDefinition(definition: string | TargetDependencyConfig, currentProject: string, graph: ProjectGraph, allTargetNames: string[]): NormalizedTargetDependencyConfig[];
export declare function normalizeDependencyConfigProjects(dependencyConfig: TargetDependencyConfig, currentProject: string, graph: ProjectGraph): NormalizedTargetDependencyConfig;
export declare function expandDependencyConfigSyntaxSugar(dependencyConfigString: string | TargetDependencyConfig, graph: ProjectGraph): TargetDependencyConfig;
export declare function expandWildcardTargetConfiguration(dependencyConfig: NormalizedTargetDependencyConfig, allTargetNames: string[]): NormalizedTargetDependencyConfig[];
export declare function readProjectAndTargetFromTargetString(targetString: string, projects: Record<string, ProjectGraphProjectNode>): {
    projects?: string[];
    target: string;
};
export declare function getOutputs(p: Record<string, ProjectGraphProjectNode>, target: Task['target'], overrides: Task['overrides']): string[];
export declare function normalizeTargetDependencyWithStringProjects(dependencyConfig: TargetDependencyConfig): Omit<TargetDependencyConfig, 'projects'> & {
    projects: string[];
};
export declare function validateOutputs(outputs: string[]): void;
export declare function transformLegacyOutputs(projectRoot: string, outputs: string[]): string[];
/**
 * @deprecated Pass the target and overrides instead. This will be removed in v20.
 */
export declare function getOutputsForTargetAndConfiguration(task: Task, node: ProjectGraphProjectNode): string[];
export declare function getOutputsForTargetAndConfiguration(target: Task['target'] | Task, overrides: Task['overrides'] | ProjectGraphProjectNode, node: ProjectGraphProjectNode): string[];
export declare function interpolate(template: string, data: any): string;
export declare function getTargetConfigurationForTask(task: Task, projectGraph: ProjectGraph): TargetConfiguration | undefined;
export declare function getExecutorNameForTask(task: Task, projectGraph: ProjectGraph): string;
export declare function getExecutorForTask(task: Task, projectGraph: ProjectGraph): ExecutorConfig & {
    isNgCompat: boolean;
    isNxExecutor: boolean;
};
export declare function getCustomHasher(task: Task, projectGraph: ProjectGraph): CustomHasher | null;
export declare function removeTasksFromTaskGraph(graph: TaskGraph, ids: string[]): TaskGraph;
export declare function removeIdsFromGraph<T>(graph: {
    roots: string[];
    dependencies: Record<string, string[]>;
}, ids: string[], mapWithIds: Record<string, T>): {
    mapWithIds: Record<string, T>;
    roots: string[];
    dependencies: Record<string, string[]>;
};
export declare function calculateReverseDeps(taskGraph: TaskGraph): Record<string, string[]>;
export declare function getCliPath(): string;
export declare function getPrintableCommandArgsForTask(task: Task): string[];
export declare function getSerializedArgsForTask(task: Task, isVerbose: boolean): string[];
export declare function shouldStreamOutput(task: Task, initiatingProject: string | null): boolean;
export declare function isCacheableTask(task: Task, options: {
    cacheableOperations?: string[] | null;
    cacheableTargets?: string[] | null;
}): boolean;
export declare function unparse(options: Object): string[];
