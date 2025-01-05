import { ChildProcess } from 'child_process';
import { FileData, ProjectGraph } from '../../config/project-graph';
import { Hash } from '../../hasher/task-hasher';
import { Task, TaskGraph } from '../../config/task-graph';
import { ConfigurationSourceMaps } from '../../project-graph/utils/project-configuration-utils';
import { NxWorkspaceFiles, TaskRun, TaskTarget } from '../../native';
import type { FlushSyncGeneratorChangesResult, SyncGeneratorRunResult } from '../../utils/sync-generators';
export type UnregisterCallback = () => void;
export type ChangedFile = {
    path: string;
    type: 'create' | 'update' | 'delete';
};
export declare class DaemonClient {
    private readonly nxJson;
    constructor();
    private queue;
    private socketMessenger;
    private currentMessage;
    private currentResolve;
    private currentReject;
    private _enabled;
    private _daemonStatus;
    private _waitForDaemonReady;
    private _daemonReady;
    private _out;
    private _err;
    enabled(): boolean;
    reset(): void;
    requestShutdown(): Promise<void>;
    getProjectGraphAndSourceMaps(): Promise<{
        projectGraph: ProjectGraph;
        sourceMaps: ConfigurationSourceMaps;
    }>;
    getAllFileData(): Promise<FileData[]>;
    hashTasks(runnerOptions: any, tasks: Task[], taskGraph: TaskGraph, env: NodeJS.ProcessEnv): Promise<Hash[]>;
    registerFileWatcher(config: {
        watchProjects: string[] | 'all';
        includeGlobalWorkspaceFiles?: boolean;
        includeDependentProjects?: boolean;
        allowPartialGraph?: boolean;
    }, callback: (error: Error | null | 'closed', data: {
        changedProjects: string[];
        changedFiles: ChangedFile[];
    } | null) => void): Promise<UnregisterCallback>;
    processInBackground(requirePath: string, data: any): Promise<any>;
    recordOutputsHash(outputs: string[], hash: string): Promise<any>;
    outputsHashesMatch(outputs: string[], hash: string): Promise<any>;
    glob(globs: string[], exclude?: string[]): Promise<string[]>;
    getWorkspaceContextFileData(): Promise<FileData[]>;
    getWorkspaceFiles(projectRootMap: Record<string, string>): Promise<NxWorkspaceFiles>;
    getFilesInDirectory(dir: string): Promise<string[]>;
    hashGlob(globs: string[], exclude?: string[]): Promise<string>;
    getFlakyTasks(hashes: string[]): Promise<string[]>;
    getEstimatedTaskTimings(targets: TaskTarget[]): Promise<Record<string, number>>;
    recordTaskRuns(taskRuns: TaskRun[]): Promise<void>;
    getSyncGeneratorChanges(generators: string[]): Promise<SyncGeneratorRunResult[]>;
    flushSyncGeneratorChangesToDisk(generators: string[]): Promise<FlushSyncGeneratorChangesResult>;
    getRegisteredSyncGenerators(): Promise<{
        globalGenerators: string[];
        taskGenerators: string[];
    }>;
    updateWorkspaceContext(createdFiles: string[], updatedFiles: string[], deletedFiles: string[]): Promise<void>;
    isServerAvailable(): Promise<boolean>;
    private sendToDaemonViaQueue;
    private setUpConnection;
    private sendMessageToDaemon;
    private handleMessage;
    startInBackground(): Promise<ChildProcess['pid']>;
    stop(): Promise<void>;
}
export declare const daemonClient: DaemonClient;
export declare function isDaemonEnabled(): boolean;
