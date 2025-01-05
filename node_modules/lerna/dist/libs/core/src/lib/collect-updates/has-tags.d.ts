import { ExecOptions } from "child_process";
/**
 * Determine if any git tags are reachable.
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
export declare function hasTags(opts?: ExecOptions): boolean;
