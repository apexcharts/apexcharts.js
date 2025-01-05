import { Argv } from "yargs";
import log from "./npmlog";
export declare function filterOptions<T extends FilterOptions>(yargs: Argv<object>): Argv<T>;
export interface FilterOptions {
    scope?: string;
    ignore?: string;
    private?: boolean;
    since?: string;
    continueIfNoMatch?: boolean;
    excludeDependents?: boolean;
    includeDependents?: boolean;
    includeDependencies?: boolean;
    includeMergedTags?: boolean;
    log: typeof log;
}
