import { ExecOptions } from "child_process";
/**
 * Reset files modified by publish steps.
 */
export declare function gitCheckout(stagedFiles: string[], gitOpts: {
    granularPathspec: boolean;
}, execOpts: ExecOptions): Promise<void>;
