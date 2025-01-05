import { Package } from "../package";
/**
 * Read the existing changelog, if it exists.
 * @returns A tuple of changelog location and contents
 */
export declare function readExistingChangelog(pkg: Package): Promise<[string, string]>;
