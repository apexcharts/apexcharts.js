import { Arguments, Command, CommandConfigOptions } from "@lerna/core";
export declare function factory(argv: Arguments<DiffCommandOptions>): DiffCommand;
interface DiffCommandOptions extends CommandConfigOptions {
    pkgName?: string;
    ignoreChanges?: string[];
}
export declare class DiffCommand extends Command<DiffCommandOptions> {
    private args;
    initialize(): void;
    execute(): Promise<void | import("@lerna/child-process").LernaReturnValue>;
}
export {};
