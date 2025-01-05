"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveFilesToNewDirectory = moveFilesToNewDirectory;
const path_1 = require("path");
const visit_not_ignored_files_1 = require("../generators/visit-not-ignored-files");
const devkit_exports_1 = require("nx/src/devkit-exports");
/**
 * Analogous to cp -r oldDir newDir
 */
function moveFilesToNewDirectory(tree, oldDir, newDir) {
    oldDir = (0, devkit_exports_1.normalizePath)(oldDir);
    newDir = (0, devkit_exports_1.normalizePath)(newDir);
    (0, visit_not_ignored_files_1.visitNotIgnoredFiles)(tree, oldDir, (file) => {
        try {
            tree.rename(file, `${newDir}/${(0, path_1.relative)(oldDir, file)}`);
        }
        catch (e) {
            if (!tree.exists(oldDir)) {
                console.warn(`Path ${oldDir} does not exist`);
            }
            else if (!tree.exists(newDir)) {
                console.warn(`Path ${newDir} does not exist`);
            }
        }
    });
}
