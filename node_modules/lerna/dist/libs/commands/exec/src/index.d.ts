import { Arguments, Command, CommandConfigOptions, Package, ProjectGraphProjectNodeWithPackage } from "@lerna/core";
export declare function factory(argv: Arguments<ExecCommandConfigOptions>): ExecCommand;
interface ExecCommandConfigOptions extends CommandConfigOptions {
    cmd?: string;
    args?: string[];
    bail?: boolean;
    prefix?: boolean;
    parallel?: boolean;
    profile?: boolean;
    profileLocation?: string;
    rejectCycles?: boolean;
    "--"?: string[];
}
export declare class ExecCommand extends Command<ExecCommandConfigOptions> {
    command?: string;
    args?: string[];
    bail?: boolean;
    prefix?: boolean;
    env?: NodeJS.ProcessEnv;
    filteredProjects: ProjectGraphProjectNodeWithPackage[];
    count?: number;
    packagePlural?: string;
    joinedCommand?: string;
    get requiresGit(): boolean;
    initialize(): Promise<void>;
    execute(): Promise<void>;
    private getOpts;
    private getRunner;
    private runCommandInPackagesTopological;
    runCommandInPackagesParallel(): Promise<any[]>;
    runCommandInPackagesLexical(): Promise<any[]>;
    runCommandInPackageStreaming(pkg: Package): any;
    runCommandInPackageCapturing(pkg: Package): any;
}
export {};
