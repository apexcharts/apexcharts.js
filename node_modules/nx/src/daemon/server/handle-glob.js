"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGlob = handleGlob;
const workspace_root_1 = require("../../utils/workspace-root");
const workspace_context_1 = require("../../utils/workspace-context");
async function handleGlob(globs, exclude) {
    const files = await (0, workspace_context_1.globWithWorkspaceContext)(workspace_root_1.workspaceRoot, globs, exclude);
    return {
        response: JSON.stringify(files),
        description: 'handleGlob',
    };
}
