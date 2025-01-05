import * as chalk from 'chalk';
import type { TaskStatus } from '../tasks-runner/tasks-runner';
export interface CLIErrorMessageConfig {
    title: string;
    bodyLines?: string[];
    slug?: string;
}
export interface CLIWarnMessageConfig {
    title: string;
    bodyLines?: string[];
    slug?: string;
}
export interface CLINoteMessageConfig {
    title: string;
    bodyLines?: string[];
}
export interface CLISuccessMessageConfig {
    title: string;
    bodyLines?: string[];
}
declare class CLIOutput {
    cliName: string;
    formatCommand: (taskId: string) => string;
    /**
     * Longer dash character which forms more of a continuous line when place side to side
     * with itself, unlike the standard dash character
     */
    private get VERTICAL_SEPARATOR();
    /**
     * Expose some color and other utility functions so that other parts of the codebase that need
     * more fine-grained control of message bodies are still using a centralized
     * implementation.
     */
    colors: {
        gray: chalk.Chalk;
        green: chalk.Chalk;
        red: chalk.Chalk;
        cyan: chalk.Chalk;
        white: chalk.Chalk;
    };
    bold: chalk.Chalk;
    underline: chalk.Chalk;
    dim: chalk.Chalk;
    private writeToStdOut;
    overwriteLine(lineText?: string): void;
    private writeOutputTitle;
    private writeOptionalOutputBody;
    applyNxPrefix(color: string, text: string): string;
    addNewline(): void;
    addVerticalSeparator(color?: string): void;
    addVerticalSeparatorWithoutNewLines(color?: string): void;
    getVerticalSeparatorLines(color?: string): string[];
    private getVerticalSeparator;
    error({ title, slug, bodyLines }: CLIErrorMessageConfig): void;
    warn({ title, slug, bodyLines }: CLIWarnMessageConfig): void;
    note({ title, bodyLines }: CLINoteMessageConfig): void;
    success({ title, bodyLines }: CLISuccessMessageConfig): void;
    logSingleLine(message: string): void;
    logCommand(message: string, taskStatus?: TaskStatus): void;
    logCommandOutput(message: string, taskStatus: TaskStatus, output: string): void;
    private getCommandWithStatus;
    private getStatusIcon;
    private normalizeMessage;
    private addTaskStatus;
    log({ title, bodyLines, color }: CLIWarnMessageConfig & {
        color?: string;
    }): void;
    drain(): Promise<void>;
}
export declare const output: CLIOutput;
export {};
