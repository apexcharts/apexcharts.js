import { NxArgs } from '../utils/command-line-utils';
import { Task, TaskGraph } from '../config/task-graph';
import { TaskResult } from './life-cycle';
export declare function initTasksRunner(nxArgs: NxArgs): Promise<{
    invoke: (opts: {
        tasks: Task[];
        parallel: number;
    }) => Promise<{
        status: NodeJS.Process["exitCode"];
        taskGraph: TaskGraph;
        taskResults: Record<string, TaskResult>;
    }>;
}>;
