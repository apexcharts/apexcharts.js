import { ExecutorContext } from '../../config/misc-interfaces';
export declare const LARGE_BUFFER: number;
export type Json = {
    [k: string]: any;
};
export interface RunCommandsOptions extends Json {
    command?: string | string[];
    commands?: ({
        command: string;
        forwardAllArgs?: boolean;
        /**
         * description was added to allow users to document their commands inline,
         * it is not intended to be used as part of the execution of the command.
         */
        description?: string;
        prefix?: string;
        color?: string;
        bgColor?: string;
    } | string)[];
    color?: boolean;
    parallel?: boolean;
    readyWhen?: string | string[];
    cwd?: string;
    env?: Record<string, string>;
    forwardAllArgs?: boolean;
    args?: string | string[];
    envFile?: string;
    __unparsed__: string[];
    usePty?: boolean;
    streamOutput?: boolean;
    tty?: boolean;
}
export interface NormalizedRunCommandsOptions extends RunCommandsOptions {
    commands: {
        command: string;
        forwardAllArgs?: boolean;
    }[];
    unknownOptions?: {
        [k: string]: any;
    };
    parsedArgs: {
        [k: string]: any;
    };
    unparsedCommandArgs?: {
        [k: string]: string | string[];
    };
    args?: string;
    readyWhenStatus: {
        stringToMatch: string;
        found: boolean;
    }[];
}
export default function (options: RunCommandsOptions, context: ExecutorContext): Promise<{
    success: boolean;
    terminalOutput: string;
}>;
export declare function interpolateArgsIntoCommand(command: string, opts: Pick<NormalizedRunCommandsOptions, 'args' | 'parsedArgs' | '__unparsed__' | 'unknownOptions' | 'unparsedCommandArgs'>, forwardAllArgs: boolean): string;
