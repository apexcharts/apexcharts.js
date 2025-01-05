import { type ExecOptions, type ExecSyncOptions } from 'child_process';
import { ChildProcess } from '../native';
export declare function runNxSync(cmd: string, options?: ExecSyncOptions & {
    cwd?: string;
}): void;
export declare function runNxAsync(cmd: string, options?: ExecOptions & {
    cwd?: string;
    silent?: boolean;
}): Promise<void>;
export declare class PseudoTtyProcess {
    private childProcess;
    isAlive: boolean;
    exitCallbacks: any[];
    constructor(childProcess: ChildProcess);
    onExit(callback: (code: number) => void): void;
    onOutput(callback: (message: string) => void): void;
    kill(): void;
}
