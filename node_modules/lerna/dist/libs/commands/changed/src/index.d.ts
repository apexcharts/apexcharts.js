import { Arguments, Command, CommandConfigOptions, listableFormatProjects } from "@lerna/core";
export declare function factory(argv: Arguments<ChangedCommandOptions>): ChangedCommand;
interface ChangedCommandOptions extends CommandConfigOptions {
    conventionalCommits?: boolean;
    conventionalGraduate?: boolean | string;
    forceConventionalGraduate?: boolean;
    forcePublish?: boolean | string;
}
export declare class ChangedCommand extends Command<ChangedCommandOptions> {
    result?: ReturnType<typeof listableFormatProjects>;
    get otherCommandConfigs(): string[];
    initialize(): boolean;
    execute(): void;
}
export {};
