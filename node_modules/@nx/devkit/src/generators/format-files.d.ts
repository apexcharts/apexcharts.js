import { Tree } from 'nx/src/devkit-exports';
/**
 * Formats all the created or updated files using Prettier
 * @param tree - the file system tree
 */
export declare function formatFiles(tree: Tree, options?: {
    /**
     * TODO(v21): Stop sorting tsconfig paths by default, paths are now less common/important
     * in Nx workspace setups, and the sorting causes comments to be lost.
     */
    sortRootTsconfigPaths: boolean;
}): Promise<void>;
