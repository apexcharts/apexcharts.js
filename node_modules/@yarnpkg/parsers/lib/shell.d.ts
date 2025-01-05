import { Argument, ArgumentSegment, ArithmeticExpression, Command, CommandChain, CommandChainThen, CommandLine, CommandLineThen, EnvSegment, RedirectArgument, ShellLine, ValueArgument } from './grammars/shell';
export declare function parseShell(source: string, options?: {
    isGlobPattern: (arg: string) => boolean;
}): ShellLine;
export declare function stringifyShellLine(shellLine: ShellLine, { endSemicolon }?: {
    endSemicolon?: boolean;
}): string;
export declare function stringifyCommandLine(commandLine: CommandLine): string;
export declare function stringifyCommandLineThen(commandLineThen: CommandLineThen): string;
export declare function stringifyCommandChain(commandChain: CommandChain): string;
export declare function stringifyCommandChainThen(commandChainThen: CommandChainThen): string;
export declare function stringifyCommand(command: Command): string;
export declare function stringifyEnvSegment(envSegment: EnvSegment): string;
export declare function stringifyArgument(argument: Argument): string;
export declare function stringifyRedirectArgument(argument: RedirectArgument): string;
export declare function stringifyValueArgument(argument: ValueArgument): string;
export declare function stringifyArgumentSegment(argumentSegment: ArgumentSegment): string;
export declare function stringifyArithmeticExpression(argument: ArithmeticExpression): string;
export { stringifyShellLine as stringifyShell };
