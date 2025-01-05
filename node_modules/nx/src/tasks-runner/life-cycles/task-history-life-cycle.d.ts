import { Task } from '../../config/task-graph';
import { LifeCycle, TaskResult } from '../life-cycle';
export declare class TaskHistoryLifeCycle implements LifeCycle {
    private startTimings;
    private taskRuns;
    private taskHistory;
    startTasks(tasks: Task[]): void;
    endTasks(taskResults: TaskResult[]): Promise<void>;
    endCommand(): Promise<void>;
}
