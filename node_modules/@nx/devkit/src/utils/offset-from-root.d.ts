/**
 * Calculates an offset from the root of the workspace, which is useful for
 * constructing relative URLs.
 *
 * Examples:
 *
 * ```typescript
 * offsetFromRoot("apps/mydir/myapp/") // returns "../../../"
 * ```
 *
 * @param fullPathToDir - directory path
 */
export declare function offsetFromRoot(fullPathToDir: string): string;
