import { FileData, ProjectGraph, ProjectGraphProjectNode } from '../config/project-graph';
import { NxJsonConfiguration } from '../config/nx-json';
import { Task, TaskGraph } from '../config/task-graph';
import { DaemonClient } from '../daemon/client/client';
import { InputDefinition } from '../config/workspace-json-project-json';
import { NxWorkspaceFilesExternals } from '../native';
/**
 * A data structure returned by the default hasher.
 */
export interface PartialHash {
    value: string;
    details: {
        [name: string]: string;
    };
}
/**
 * A data structure returned by the default hasher.
 */
export interface Hash {
    value: string;
    details: {
        command: string;
        nodes: {
            [name: string]: string;
        };
        implicitDeps?: {
            [fileName: string]: string;
        };
        runtime?: {
            [input: string]: string;
        };
    };
}
export interface TaskHasher {
    /**
     * @deprecated use hashTask(task:Task, taskGraph: TaskGraph, env: NodeJS.ProcessEnv) instead. This will be removed in v20
     * @param task
     */
    hashTask(task: Task): Promise<Hash>;
    /**
     * @deprecated use hashTask(task:Task, taskGraph: TaskGraph, env: NodeJS.ProcessEnv) instead. This will be removed in v20
     */
    hashTask(task: Task, taskGraph: TaskGraph): Promise<Hash>;
    hashTask(task: Task, taskGraph: TaskGraph, env: NodeJS.ProcessEnv): Promise<Hash>;
    /**
     *  @deprecated use hashTasks(tasks:Task[], taskGraph: TaskGraph, env: NodeJS.ProcessEnv) instead. This will be removed in v20
     * @param tasks
     */
    hashTasks(tasks: Task[]): Promise<Hash[]>;
    /**
     * @deprecated use hashTasks(tasks:Task[], taskGraph: TaskGraph, env: NodeJS.ProcessEnv) instead. This will be removed in v20
     */
    hashTasks(tasks: Task[], taskGraph: TaskGraph): Promise<Hash[]>;
    hashTasks(tasks: Task[], taskGraph: TaskGraph, env: NodeJS.ProcessEnv): Promise<Hash[]>;
}
export interface TaskHasherImpl {
    hashTasks(tasks: Task[], taskGraph: TaskGraph, env: NodeJS.ProcessEnv): Promise<PartialHash[]>;
    hashTask(task: Task, taskGraph: TaskGraph, env: NodeJS.ProcessEnv, visited?: string[]): Promise<PartialHash>;
}
export type Hasher = TaskHasher;
export declare class DaemonBasedTaskHasher implements TaskHasher {
    private readonly daemonClient;
    private readonly runnerOptions;
    constructor(daemonClient: DaemonClient, runnerOptions: any);
    hashTasks(tasks: Task[], taskGraph?: TaskGraph, env?: NodeJS.ProcessEnv): Promise<Hash[]>;
    hashTask(task: Task, taskGraph?: TaskGraph, env?: NodeJS.ProcessEnv): Promise<Hash>;
}
export declare class InProcessTaskHasher implements TaskHasher {
    private readonly projectGraph;
    private readonly nxJson;
    private readonly externalRustReferences;
    private readonly options;
    private taskHasher;
    constructor(projectGraph: ProjectGraph, nxJson: NxJsonConfiguration, externalRustReferences: NxWorkspaceFilesExternals | null, options: any);
    hashTasks(tasks: Task[], taskGraph?: TaskGraph, env?: NodeJS.ProcessEnv): Promise<Hash[]>;
    hashTask(task: Task, taskGraph?: TaskGraph, env?: NodeJS.ProcessEnv): Promise<Hash>;
    private createHashDetails;
    private hashCommand;
}
export type ExpandedSelfInput = {
    fileset: string;
} | {
    runtime: string;
} | {
    env: string;
} | {
    externalDependencies: string[];
};
export type ExpandedDepsOutput = {
    dependentTasksOutputFiles: string;
    transitive?: boolean;
};
export type ExpandedInput = ExpandedSelfInput | ExpandedDepsOutput;
export declare function getNamedInputs(nxJson: NxJsonConfiguration, project: ProjectGraphProjectNode): {
    default: {
        fileset: string;
    }[];
};
export declare function getTargetInputs(nxJson: NxJsonConfiguration, projectNode: ProjectGraphProjectNode, target: string): {
    selfInputs: string[];
    dependencyInputs: string[];
};
export declare function extractPatternsFromFileSets(inputs: readonly ExpandedInput[]): string[];
export declare function getInputs(task: Task, projectGraph: ProjectGraph, nxJson: NxJsonConfiguration): {
    selfInputs: ExpandedSelfInput[];
    depsInputs: {
        input: string;
        dependencies: true;
    }[];
    depsOutputs: ExpandedDepsOutput[];
    projectInputs: {
        input: string;
        projects: string[];
    }[];
};
export declare function isSelfInput(input: ExpandedInput): input is ExpandedSelfInput;
export declare function isDepsOutput(input: ExpandedInput): input is ExpandedDepsOutput;
export declare function expandSingleProjectInputs(inputs: ReadonlyArray<InputDefinition | string>, namedInputs: {
    [inputName: string]: ReadonlyArray<InputDefinition | string>;
}): ExpandedInput[];
export declare function expandNamedInput(input: string, namedInputs: {
    [inputName: string]: ReadonlyArray<InputDefinition | string>;
}): ExpandedInput[];
export declare function filterUsingGlobPatterns(root: string, files: FileData[], patterns: string[]): FileData[];
