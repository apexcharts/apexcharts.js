import type { Tree } from 'nx/src/devkit-exports';
/**
 * Utility to act on all files in a tree that are not ignored by git.
 */
export declare function visitNotIgnoredFiles(tree: Tree, dirPath: string, visitor: (path: string) => void): void;
