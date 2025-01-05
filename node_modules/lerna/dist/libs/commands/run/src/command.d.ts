import type { CommandModule } from "yargs";
import { RunCommandConfigOptions } from ".";
/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
declare const command: CommandModule<object, RunCommandConfigOptions>;
export = command;
