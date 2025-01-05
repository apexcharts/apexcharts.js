import type { Tree } from '../tree';
/**
 * Formats all the created or updated files using Prettier
 * @param tree - the file system tree
 */
export declare function formatChangedFilesWithPrettierIfAvailable(tree: Tree, options?: {
    silent?: boolean;
}): Promise<void>;
export declare function formatFilesWithPrettierIfAvailable(files: {
    path: string;
    content: string | Buffer;
}[], root: string, options?: {
    silent?: boolean;
}): Promise<Map<string, string>>;
