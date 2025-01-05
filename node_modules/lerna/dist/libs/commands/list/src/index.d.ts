import { Arguments, Command, CommandConfigOptions } from "@lerna/core";
export declare function factory(argv: Arguments<CommandConfigOptions>): ListCommand;
export declare class ListCommand extends Command {
    private result?;
    get requiresGit(): boolean;
    initialize(): Promise<void>;
    execute(): void;
}
