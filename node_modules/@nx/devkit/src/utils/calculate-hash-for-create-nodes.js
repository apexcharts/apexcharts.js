"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHashForCreateNodes = calculateHashForCreateNodes;
const path_1 = require("path");
const devkit_exports_1 = require("nx/src/devkit-exports");
const devkit_internals_1 = require("nx/src/devkit-internals");
async function calculateHashForCreateNodes(projectRoot, options, context, additionalGlobs = []) {
    return (0, devkit_exports_1.hashArray)([
        await (0, devkit_internals_1.hashWithWorkspaceContext)(context.workspaceRoot, [
            (0, path_1.join)(projectRoot, '**/*'),
            ...additionalGlobs,
        ]),
        (0, devkit_internals_1.hashObject)(options),
    ]);
}
