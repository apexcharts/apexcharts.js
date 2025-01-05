/**
 * This is meant to be used with `git filter-branch --tree-filter` to rewrite
 * history to only include commits related to the source project folder. If the
 * destination folder is different, this script also moves the files over.
 *
 * Example:
 * NX_IMPORT_SOURCE=<source> NX_IMPORT_DESTINATION=<destination> git filter-branch --tree-filter 'node git-utils.tree-filter.js' --prune-empty -- --all
 */
declare const execSync: any;
declare const existsSync: any, mkdirSync: any, renameSync: any, rmSync: any;
declare const posix: any;
