import { Package } from "@lerna/core";
/**
 * Filters a list of packages, returning all packages that match the `include` glob[s]
 * and do not match the `exclude` glob[s].
 *
 * @param packagesToFilter The packages to filter
 * @param [include] A list of globs to match the package name against
 * @param [exclude] A list of globs to filter the package name against
 * @param [showPrivate] When false, filter out private packages
 * @param [continueIfNoMatch] When true, do not throw if no package is matched
 * @throws when a given glob would produce an empty list of packages and `continueIfNoMatch` is not set.
 */
export declare function filterPackages(packagesToFilter: Package[], include?: string[], exclude?: string[], showPrivate?: boolean, continueIfNoMatch?: boolean): Package[];
