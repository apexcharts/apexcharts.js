export interface ListArgs {
    /** The name of an installed plugin to query  */
    plugin?: string | undefined;
}
/**
 * List available plugins or capabilities within a specific plugin
 *
 * @remarks
 *
 * Must be run within an Nx workspace
 *
 */
export declare function listHandler(args: ListArgs): Promise<void>;
