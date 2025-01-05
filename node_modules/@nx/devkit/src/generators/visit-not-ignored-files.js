"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitNotIgnoredFiles = visitNotIgnoredFiles;
const ignore_1 = require("ignore");
const path_1 = require("path");
/**
 * Utility to act on all files in a tree that are not ignored by git.
 */
function visitNotIgnoredFiles(tree, dirPath = tree.root, visitor) {
    // TODO (v17): use packages/nx/src/utils/ignore.ts
    let ig;
    if (tree.exists('.gitignore')) {
        ig = (0, ignore_1.default)();
        ig.add('.git');
        ig.add(tree.read('.gitignore', 'utf-8'));
    }
    if (tree.exists('.nxignore')) {
        ig ??= (0, ignore_1.default)();
        ig.add(tree.read('.nxignore', 'utf-8'));
    }
    dirPath = normalizePathRelativeToRoot(dirPath, tree.root);
    if (dirPath !== '' && ig?.ignores(dirPath)) {
        return;
    }
    for (const child of tree.children(dirPath)) {
        const fullPath = (0, path_1.join)(dirPath, child);
        if (ig?.ignores(fullPath)) {
            continue;
        }
        if (tree.isFile(fullPath)) {
            visitor(fullPath);
        }
        else {
            visitNotIgnoredFiles(tree, fullPath, visitor);
        }
    }
}
function normalizePathRelativeToRoot(path, root) {
    return (0, path_1.relative)(root, (0, path_1.join)(root, path)).split(path_1.sep).join('/');
}
