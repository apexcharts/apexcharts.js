"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offsetFromRoot = offsetFromRoot;
const path_1 = require("path");
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
function offsetFromRoot(fullPathToDir) {
    if (fullPathToDir === '.')
        return './';
    const parts = (0, path_1.normalize)(fullPathToDir).split(path_1.sep);
    let offset = '';
    for (let i = 0; i < parts.length; ++i) {
        if (parts[i].length > 0) {
            offset += '../';
        }
    }
    return offset;
}
