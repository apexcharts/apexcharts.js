import execa from "execa";
type withPkg<T> = T & {
    pkg?: unknown;
};
export type LernaChildProcess = withPkg<execa.ExecaChildProcess<string>>;
export type LernaReturnValue = withPkg<execa.ExecaReturnValue<string>>;
export type LernaOptions = withPkg<execa.Options>;
/**
 * Execute a command asynchronously, piping stdio by default.
 * @param command
 * @param args
 * @param opts
 * @returns
 */
export declare function exec(command: string, args: string[], opts?: LernaOptions): Promise<LernaReturnValue>;
/**
 * Execute a command synchronously.
 * @param command
 * @param args
 * @param opts
 */
export declare function execSync(command: string, args: string[], opts?: import("execa").SyncOptions): string;
/**
 * Spawn a command asynchronously, _always_ inheriting stdio.
 * @param command
 * @param args
 * @param opts
 */
export declare function spawn(command: string, args: string[], opts?: LernaOptions): Promise<LernaReturnValue>;
/**
 * Spawn a command asynchronously, streaming stdio with optional prefix.
 * @param command
 * @param args
 * @param opts
 * @param prefix
 */
export declare function spawnStreaming(command: string, args: string[], opts?: LernaOptions, prefix?: string): Promise<LernaReturnValue>;
export declare function getChildProcessCount(): number;
/**
 * @param result
 * @returns
 */
export declare function getExitCode(result: execa.ExecaError<string> & {
    code?: string | number;
}): number | undefined;
export {};
