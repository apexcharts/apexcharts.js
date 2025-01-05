import { CommandConfigOptions, Logger, Project } from "@lerna/core";
import { PackageGraph } from "../package-graph";
export declare class Command<T extends CommandConfigOptions = CommandConfigOptions> {
    name: string;
    composed: boolean;
    options: T;
    runner: Promise<unknown>;
    concurrency?: number;
    toposort: boolean;
    execOpts?: {
        cwd: string;
        maxBuffer?: number;
    };
    packageGraph?: PackageGraph;
    logger: Logger;
    private _project?;
    get project(): Project;
    set project(project: Project);
    constructor(_argv: any, { skipValidations }?: {
        skipValidations: boolean;
    });
    then(onResolved: () => void, onRejected: (err: string | Error) => void): Promise<void>;
    catch(onRejected: (err: string | Error) => void): Promise<unknown>;
    get requiresGit(): boolean;
    get otherCommandConfigs(): never[];
    configureEnvironment(): void;
    configureOptions(): void;
    argv(argv: any, arg1: any, config: any, envDefaults: any): any;
    envDefaults(argv: any, arg1: any, config: any, envDefaults: any): any;
    configureProperties(): void;
    configureLogging(): void;
    enableProgressBar(): void;
    gitInitialized(): boolean;
    runValidations(): void;
    runPreparations(): Promise<void>;
    runCommand(): Promise<void>;
    initialize(): void;
    execute(): void;
}
