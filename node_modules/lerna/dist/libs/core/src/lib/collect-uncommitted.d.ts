import npmlog from "./npmlog";
interface UncommittedConfig {
    cwd: string;
    log?: typeof npmlog;
}
export declare function collectUncommitted({ cwd, log }: UncommittedConfig): Promise<string[]>;
/**
 * Report uncommitted files. (sync)
 * @returns A list of uncommitted files
 */
export declare function collectUncommittedSync({ cwd, log }: UncommittedConfig): string[];
export {};
