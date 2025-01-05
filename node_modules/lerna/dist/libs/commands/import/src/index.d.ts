import { Arguments, Command, CommandConfigOptions } from "@lerna/core";
export declare function factory(argv: Arguments<ImportCommandOptions>): ImportCommand;
interface ImportCommandOptions extends CommandConfigOptions {
    dir?: string;
    dest?: string;
    flatten?: boolean;
    preserveCommit?: boolean;
    yes?: boolean;
}
export declare class ImportCommand extends Command<ImportCommandOptions> {
    private externalExecOpts;
    private targetDirRelativeToGitRoot?;
    private commits;
    private origGitEmail?;
    private origGitName?;
    private preImportHead?;
    gitParamsForTargetCommits(): string[];
    initialize(): true | Promise<boolean>;
    getPackageDirectories(): string[];
    getTargetBase(): string;
    getCurrentSHA(): string;
    getWorkspaceRoot(): string;
    execSync(cmd: string, args: string[]): string;
    externalExecSync(cmd: string, args: string[]): string;
    createPatchForCommit(sha: string): string;
    getGitUserFromSha(sha: string): {
        email: string;
        name: string;
    };
    configureGitUser({ email, name }: {
        email?: string;
        name?: string;
    }): void;
    execute(): Promise<void>;
}
export {};
