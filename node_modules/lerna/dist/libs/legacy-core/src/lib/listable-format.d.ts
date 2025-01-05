import { ListableOptions, Package } from "@lerna/core";
/**
 * Format a list of packages according to specified options.
 */
export declare function listableFormat(pkgList: Package[], options: ListableOptions): {
    text: string;
    count: number;
};
