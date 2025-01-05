import ignore from 'ignore';
/**
 * An array of glob patterns that should always be ignored.
 */
export declare const ALWAYS_IGNORE: string[];
export declare function getIgnoredGlobs(root?: string, prependRoot?: boolean): string[];
export declare function getAlwaysIgnore(root?: string): string[];
export declare function getIgnoreObject(root?: string): ReturnType<typeof ignore>;
