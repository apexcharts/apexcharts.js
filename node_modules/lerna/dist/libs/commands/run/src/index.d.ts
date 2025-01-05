import { Command, CommandConfigOptions, FilterOptions, ProjectGraphProjectNodeWithPackage, Arguments } from "@lerna/core";
export declare function factory(argv: Arguments<RunCommandConfigOptions>): RunCommand;
export interface RunCommandConfigOptions extends CommandConfigOptions, FilterOptions {
    script: string | string[];
    profile?: boolean;
    profileLocation?: string;
    bail?: boolean;
    prefix?: boolean;
    loadEnvFiles?: boolean;
    parallel?: boolean;
    rejectCycles?: boolean;
    skipNxCache?: boolean;
    "--"?: string[];
}
export declare class RunCommand extends Command<RunCommandConfigOptions> {
    script: string | string[];
    args?: string[];
    npmClient?: string;
    bail?: boolean;
    prefix?: boolean;
    projectsWithScript: ProjectGraphProjectNodeWithPackage[];
    count?: number;
    packagePlural?: string;
    joinedCommand?: string;
    get requiresGit(): boolean;
    initialize(): Promise<boolean>;
    execute(): Promise<void>;
    private getOpts;
    private getRunner;
    private runScriptInPackagesTopological;
    private runScriptInPackagesParallel;
    private runScriptInPackagesLexical;
    private runScriptInPackageStreaming;
    private runScriptInPackageCapturing;
    private runScriptsUsingNx;
    private addQuotesAroundScriptNameIfItHasAColon;
    private prepNxOptions;
    private configureNxOutput;
}
