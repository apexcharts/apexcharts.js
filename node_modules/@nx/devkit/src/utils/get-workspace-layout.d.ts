import { Tree } from 'nx/src/devkit-exports';
/**
 * Returns workspace defaults. It includes defaults folders for apps and libs,
 * and the default scope.
 *
 * Example:
 *
 * ```typescript
 * { appsDir: 'apps', libsDir: 'libs' }
 * ```
 * @param tree - file system tree
 */
export declare function getWorkspaceLayout(tree: Tree): {
    appsDir: string;
    libsDir: string;
    standaloneAsDefault: boolean;
};
/**
 * Experimental
 */
export declare function extractLayoutDirectory(directory?: string): {
    layoutDirectory: string | null;
    projectDirectory?: string;
};
