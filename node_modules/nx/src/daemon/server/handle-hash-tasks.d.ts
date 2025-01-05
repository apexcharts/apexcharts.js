import { Task, TaskGraph } from '../../config/task-graph';
export declare function handleHashTasks(payload: {
    runnerOptions: any;
    env: any;
    tasks: Task[];
    taskGraph: TaskGraph;
}): Promise<{
    response: string;
    description: string;
}>;
