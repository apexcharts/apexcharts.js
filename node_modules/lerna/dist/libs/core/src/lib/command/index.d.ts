import { ProjectFileMap } from "@nx/devkit";
import { ExecOptions as NodeExecOptions } from "child_process";
import yargs from "yargs";
import { Logger } from "../npmlog";
import { CommandConfigOptions, Project } from "../project";
import { ProjectGraphWithPackages } from "../project-graph-with-packages";
/**
 * Execa compatible options type
 *
 * Current used execa version options type uses```cwd: string``` and not
 * ``` cwd?: string | URL ```
 *
 * Can be removed when latest execa version is used!!!
 * */
export type ExecOptions = Omit<NodeExecOptions, "cwd"> & {
    cwd?: string;
};
/**
 * Specific logger with log-level success enabled in order to use function without index signature
 */
export interface LernaLogger extends Logger {
    /**
     * Log with level success
     * @param prefix
     * @param message
     * @param args
     */
    success(prefix: string, message: string, ...args: any[]): void;
}
export interface PreInitializedProjectData {
    projectFileMap: ProjectFileMap;
    projectGraph: ProjectGraphWithPackages;
}
export type Arguments<T extends CommandConfigOptions = CommandConfigOptions> = {
    cwd?: string;
    composed?: string;
    lernaVersion?: string;
    onResolved?: (value: unknown) => unknown;
    onRejected?: (reason: unknown) => unknown;
} & yargs.ArgumentsCamelCase<T>;
export declare class Command<T extends CommandConfigOptions = CommandConfigOptions> {
    name: string;
    composed: boolean;
    options: T;
    runner: Promise<unknown>;
    concurrency: number;
    toposort: boolean;
    execOpts: ExecOptions;
    logger: LernaLogger;
    envDefaults: any;
    argv: Arguments<T>;
    projectGraph: ProjectGraphWithPackages;
    projectFileMap: ProjectFileMap;
    private _project?;
    get project(): Project;
    set project(project: Project);
    constructor(_argv: Arguments<T>, { skipValidations, preInitializedProjectData, }?: {
        skipValidations: boolean;
        preInitializedProjectData?: PreInitializedProjectData;
    });
    static createLogger(name: string, loglevel?: string): LernaLogger;
    then(onResolved: () => void, onRejected: (err: string | Error) => void): Promise<void>;
    catch(onRejected: (err: string | Error) => void): Promise<unknown>;
    get requiresGit(): boolean;
    get otherCommandConfigs(): string[];
    detectProjects(): Promise<void>;
    configureEnvironment(): void;
    configureOptions(): void;
    configureProperties(): void;
    enableProgressBar(): void;
    runValidations(): void;
    runPreparations(): void;
    runCommand(): Promise<unknown>;
    initialize(): void | boolean | Promise<void | boolean>;
    /**
     * The execute() method can return a value in some cases (e.g. on the version command)
     */
    execute(): void | Promise<unknown>;
}
