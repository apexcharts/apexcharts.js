"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceLayout = getWorkspaceLayout;
exports.extractLayoutDirectory = extractLayoutDirectory;
const devkit_exports_1 = require("nx/src/devkit-exports");
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
function getWorkspaceLayout(tree) {
    const nxJson = (0, devkit_exports_1.readNxJson)(tree);
    return {
        appsDir: nxJson?.workspaceLayout?.appsDir ??
            inOrderOfPreference(tree, ['apps', 'packages'], '.'),
        libsDir: nxJson?.workspaceLayout?.libsDir ??
            inOrderOfPreference(tree, ['libs', 'packages'], '.'),
        standaloneAsDefault: true,
    };
}
/**
 * Experimental
 */
function extractLayoutDirectory(directory) {
    if (directory) {
        directory = directory.startsWith('/') ? directory.substring(1) : directory;
        for (let dir of ['apps', 'libs', 'packages']) {
            if (directory.startsWith(dir + '/') || directory === dir) {
                return {
                    layoutDirectory: dir,
                    projectDirectory: directory.substring(dir.length + 1),
                };
            }
        }
    }
    return { layoutDirectory: null, projectDirectory: directory };
}
function inOrderOfPreference(tree, selectedFolders, defaultChoice) {
    for (let i = 0; i < selectedFolders.length; ++i) {
        if (tree.exists(selectedFolders[i]))
            return selectedFolders[i];
    }
    return defaultChoice;
}
