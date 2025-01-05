import { ChildProcess, RustPseudoTerminal } from '../native';
import { PseudoIPCServer } from './pseudo-ipc';
import { Serializable } from 'child_process';
export declare function getPseudoTerminal(skipSupportCheck?: boolean): PseudoTerminal;
export declare class PseudoTerminal {
    private rustPseudoTerminal;
    private pseudoIPCPath;
    private pseudoIPC;
    private initialized;
    static isSupported(): boolean;
    constructor(rustPseudoTerminal: RustPseudoTerminal);
    init(): Promise<void>;
    runCommand(command: string, { cwd, execArgv, jsEnv, quiet, tty, }?: {
        cwd?: string;
        execArgv?: string[];
        jsEnv?: Record<string, string>;
        quiet?: boolean;
        tty?: boolean;
    }): PseudoTtyProcess;
    fork(id: string, script: string, { cwd, execArgv, jsEnv, quiet, }: {
        cwd?: string;
        execArgv?: string[];
        jsEnv?: Record<string, string>;
        quiet?: boolean;
    }): Promise<PseudoTtyProcessWithSend>;
    sendMessageToChildren(message: Serializable): void;
    onMessageFromChildren(callback: (message: Serializable) => void): void;
    private setupProcessListeners;
    private shutdownPseudoIPC;
}
export declare class PseudoTtyProcess {
    private childProcess;
    isAlive: boolean;
    exitCallbacks: any[];
    constructor(childProcess: ChildProcess);
    onExit(callback: (code: number) => void): void;
    onOutput(callback: (message: string) => void): void;
    kill(): void;
}
export declare class PseudoTtyProcessWithSend extends PseudoTtyProcess {
    private id;
    private pseudoIpc;
    constructor(_childProcess: ChildProcess, id: string, pseudoIpc: PseudoIPCServer);
    send(message: Serializable): void;
}
