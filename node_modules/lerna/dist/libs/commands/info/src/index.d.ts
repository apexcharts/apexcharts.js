import { Arguments, Command, CommandConfigOptions } from "@lerna/core";
export declare function factory(argv: Arguments<CommandConfigOptions>): InfoCommand;
export declare class InfoCommand extends Command {
    initialize(): void;
    execute(): void;
}
