import Job from './Job';
import type Cluster from './Cluster';
import type { TaskFunction } from './Cluster';
import { WorkerInstance } from './concurrency/ConcurrencyImplementation';
interface WorkerOptions {
    cluster: Cluster;
    args: string[];
    id: number;
    browser: WorkerInstance;
}
export interface WorkError {
    type: 'error';
    error: Error;
}
export interface WorkData {
    type: 'success';
    data: any;
}
export type WorkResult = WorkError | WorkData;
export default class Worker<JobData, ReturnData> implements WorkerOptions {
    cluster: Cluster;
    args: string[];
    id: number;
    browser: WorkerInstance;
    activeTarget: Job<JobData, ReturnData> | null;
    constructor({ cluster, args, id, browser }: WorkerOptions);
    handle(task: TaskFunction<JobData, ReturnData>, job: Job<JobData, ReturnData>, timeout: number): Promise<WorkResult>;
    close(): Promise<void>;
}
export {};
