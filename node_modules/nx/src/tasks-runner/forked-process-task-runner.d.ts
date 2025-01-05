import { DefaultTasksRunnerOptions } from './default-tasks-runner';
import { Batch } from './tasks-schedule';
import { BatchResults } from './batch/batch-messages';
import { Task, TaskGraph } from '../config/task-graph';
export declare class ForkedProcessTaskRunner {
    private readonly options;
    cliPath: string;
    private readonly verbose;
    private processes;
    private pseudoTerminal;
    constructor(options: DefaultTasksRunnerOptions);
    init(): Promise<void>;
    forkProcessForBatch({ executorName, taskGraph: batchTaskGraph }: Batch, fullTaskGraph: TaskGraph, env: NodeJS.ProcessEnv): Promise<BatchResults>;
    forkProcessLegacy(task: Task, { temporaryOutputPath, streamOutput, pipeOutput, taskGraph, env, }: {
        temporaryOutputPath: string;
        streamOutput: boolean;
        pipeOutput: boolean;
        taskGraph: TaskGraph;
        env: NodeJS.ProcessEnv;
    }): Promise<{
        code: number;
        terminalOutput: string;
    }>;
    forkProcess(task: Task, { temporaryOutputPath, streamOutput, taskGraph, env, disablePseudoTerminal, }: {
        temporaryOutputPath: string;
        streamOutput: boolean;
        pipeOutput: boolean;
        taskGraph: TaskGraph;
        env: NodeJS.ProcessEnv;
        disablePseudoTerminal: boolean;
    }): Promise<{
        code: number;
        terminalOutput: string;
    }>;
    private forkProcessWithPseudoTerminal;
    private forkProcessPipeOutputCapture;
    private forkProcessWithPrefixAndNotTTY;
    private forkProcessDirectOutputCapture;
    private readTerminalOutput;
    private writeTerminalOutput;
    private setupProcessEventListeners;
}
