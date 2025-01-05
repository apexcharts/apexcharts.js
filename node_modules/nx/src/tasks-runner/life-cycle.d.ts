import { TaskStatus } from './tasks-runner';
import { Task } from '../config/task-graph';
export interface TaskResult {
    task: Task;
    status: TaskStatus;
    code: number;
    terminalOutput?: string;
}
export interface TaskMetadata {
    groupId: number;
}
export interface LifeCycle {
    startCommand?(): void | Promise<void>;
    endCommand?(): void | Promise<void>;
    scheduleTask?(task: Task): void | Promise<void>;
    /**
     * @deprecated use startTasks
     *
     * startTask won't be supported after Nx 14 is released.
     */
    startTask?(task: Task): void;
    /**
     * @deprecated use endTasks
     *
     * endTask won't be supported after Nx 14 is released.
     */
    endTask?(task: Task, code: number): void;
    startTasks?(task: Task[], metadata: TaskMetadata): void | Promise<void>;
    endTasks?(taskResults: TaskResult[], metadata: TaskMetadata): void | Promise<void>;
    printTaskTerminalOutput?(task: Task, status: TaskStatus, output: string): void;
}
export declare class CompositeLifeCycle implements LifeCycle {
    private readonly lifeCycles;
    constructor(lifeCycles: LifeCycle[]);
    startCommand(): Promise<void>;
    endCommand(): Promise<void>;
    scheduleTask(task: Task): Promise<void>;
    startTask(task: Task): void;
    endTask(task: Task, code: number): void;
    startTasks(tasks: Task[], metadata: TaskMetadata): Promise<void>;
    endTasks(taskResults: TaskResult[], metadata: TaskMetadata): Promise<void>;
    printTaskTerminalOutput(task: Task, status: TaskStatus, output: string): void;
}
